// RLS Policy Validation Tests
// Direct testing of PostgreSQL RLS policies at the database level

// Jest globals are available without imports
import { Client } from 'pg';
import { RLSPrismaClient, getRLSPrismaClient } from '../../src/lib/rls';
import { checkDatabaseAvailability, skipIfNoDatabase, withDatabase, checkRLSSetup } from '../helpers/database-test-helper';

describe('RLS Policy Validation Tests', () => {
  let dbClient: Client;
  let prisma: RLSPrismaClient;
  let testUser1Id: string;
  let testUser2Id: string;
  let adminUserId: string;
  let databaseAvailable = false;

  beforeAll(async () => {
    const dbConfig = await checkDatabaseAvailability();
    databaseAvailable = dbConfig.hasDatabase;

    if (!databaseAvailable) {
      console.warn(`⚠️  Skipping RLS Policy Validation Tests: ${dbConfig.skipMessage}`);
      return;
    }

    // Direct database connection for low-level testing
    dbClient = new Client({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });
    
    try {
      await dbClient.connect();
      
      // Check if RLS is set up
      const rlsSetup = await checkRLSSetup(dbClient);
      if (!rlsSetup) {
        console.warn('⚠️  RLS not properly set up in database - some tests may fail');
      }

      prisma = getRLSPrismaClient();
      await prisma.$connect();

      await setupTestData();
    } catch (error) {
      console.warn(`⚠️  Database setup failed: ${error.message}`);
      databaseAvailable = false;
    }
  });

  afterAll(async () => {
    if (!databaseAvailable) return;
    
    try {
      await cleanupTestData();
      if (dbClient) await dbClient.end();
      if (prisma) await prisma.$disconnect();
    } catch (error) {
      console.warn('⚠️  Cleanup failed:', error.message);
    }
  });

  beforeEach(async () => {
    if (!databaseAvailable) return;
    
    try {
      // Clear any existing context
      await dbClient.query("SELECT set_config('app.current_user_id', '', true)");
      await dbClient.query("SELECT set_config('app.admin_emails', 'admin@test.com', true)");
    } catch (error) {
      console.warn('⚠️  beforeEach setup failed:', error.message);
    }
  });

  describe('Database-Level Policy Tests', () => {
    it('should have RLS enabled on all required tables', async () => {
      if (!databaseAvailable) {
        console.warn('⚠️  Skipping test - no database available');
        return;
      }

      const result = await dbClient.query(`
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('User', 'Reminder', 'Account', 'Session', 'FriendInvite', 'Feedback', 'FlowResponse')
      `);

      // All user-specific tables should have RLS enabled
      expect(result.rows.length).toBe(7);
      result.rows.forEach(row => {
        expect(row.rowsecurity).toBe(true);
      });
    });

    it('should have correct policies defined', async () => {
      const result = await dbClient.query(`
        SELECT schemaname, tablename, policyname, cmd, roles
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
      `);

      const policies = result.rows;
      const expectedPolicies = [
        'user_own_data',
        'account_own_data', 
        'session_own_data',
        'reminder_own_data',
        'friend_invite_own_data',
        'feedback_own_data',
        'feedback_anonymous_admin_only',
        'flow_response_own_data',
        'flow_response_anonymous_admin_only'
      ];

      const policyNames = policies.map(p => p.policyname);
      expectedPolicies.forEach(expectedPolicy => {
        expect(policyNames).toContain(expectedPolicy);
      });
    });

    it('should have helper functions created', async () => {
      const result = await dbClient.query(`
        SELECT proname 
        FROM pg_proc 
        WHERE proname IN ('current_app_user_id', 'is_admin_user')
      `);

      expect(result.rows.length).toBe(2);
      const functionNames = result.rows.map(r => r.proname);
      expect(functionNames).toContain('current_app_user_id');
      expect(functionNames).toContain('is_admin_user');
    });
  });

  describe('Policy Logic Validation', () => {
    it('should correctly identify current user', async () => {
      // Set user context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);
      
      // Test the helper function
      const result = await dbClient.query('SELECT current_app_user_id()');
      expect(result.rows[0].current_app_user_id).toBe(testUser1Id);
    });

    it('should correctly identify admin users', async () => {
      // Set admin email and user context for admin
      await dbClient.query(`SELECT set_config('app.admin_emails', 'admin@test.com', true)`);
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [adminUserId]);
      
      // Test admin detection
      const result = await dbClient.query('SELECT is_admin_user()');
      expect(result.rows[0].is_admin_user).toBe(true);
    });

    it('should correctly reject non-admin users', async () => {
      // Set regular user context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);
      
      // Test admin detection
      const result = await dbClient.query('SELECT is_admin_user()');
      expect(result.rows[0].is_admin_user).toBe(false);
    });
  });

  describe('Table-Specific Policy Tests', () => {
    it('should enforce User table policies', async () => {
      // User 1 context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);
      
      const result = await dbClient.query('SELECT * FROM "User"');
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(testUser1Id);
    });

    it('should enforce Reminder table policies', async () => {
      // Create test reminders
      await dbClient.query(`
        INSERT INTO "Reminder" (id, title, "userId", "createdAt", "updatedAt")
        VALUES 
          (gen_random_uuid(), 'User 1 Reminder', $1, NOW(), NOW()),
          (gen_random_uuid(), 'User 2 Reminder', $2, NOW(), NOW())
      `, [testUser1Id, testUser2Id]);

      // Set user 1 context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);
      
      const result = await dbClient.query('SELECT * FROM "Reminder"');
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].userId).toBe(testUser1Id);
    });

    it('should enforce Account table policies', async () => {
      // Create test accounts
      await dbClient.query(`
        INSERT INTO "Account" (id, "userId", provider, "providerAccountId", type, "createdAt", "updatedAt")
        VALUES 
          (gen_random_uuid(), $1, 'test', 'test1', 'oauth', NOW(), NOW()),
          (gen_random_uuid(), $2, 'test', 'test2', 'oauth', NOW(), NOW())
      `, [testUser1Id, testUser2Id]);

      // Set user 1 context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);
      
      const result = await dbClient.query('SELECT * FROM "Account"');
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].userId).toBe(testUser1Id);
    });

    it('should enforce Feedback table policies for user data', async () => {
      // Create test feedback
      await dbClient.query(`
        INSERT INTO "Feedback" (id, type, message, "userId", "createdAt")
        VALUES 
          (gen_random_uuid(), 'COMPLEMENT', 'User 1 feedback', $1, NOW()),
          (gen_random_uuid(), 'CRITICISM', 'User 2 feedback', $2, NOW()),
          (gen_random_uuid(), 'COMPLEMENT', 'Anonymous feedback', NULL, NOW())
      `, [testUser1Id, testUser2Id]);

      // Set user 1 context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);
      
      const result = await dbClient.query('SELECT * FROM "Feedback"');
      
      // User should only see their own feedback, not anonymous
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].userId).toBe(testUser1Id);
    });

    it('should allow admin access to anonymous feedback', async () => {
      // Set admin context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [adminUserId]);
      
      const result = await dbClient.query('SELECT * FROM "Feedback" WHERE "userId" IS NULL');
      
      // Admin should see anonymous feedback
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Security Tests', () => {
    it('should prevent SQL injection through user context', async () => {
      const maliciousInput = "'; DROP TABLE \"User\"; --";
      
      // This should not cause any issues
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [maliciousInput]);
      
      // Verify table still exists and query works
      const result = await dbClient.query('SELECT COUNT(*) FROM "User"');
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });

    it('should handle empty user context gracefully', async () => {
      // Clear user context
      await dbClient.query("SELECT set_config('app.current_user_id', '', true)");
      
      // Should return no results, not error
      const result = await dbClient.query('SELECT * FROM "Reminder"');
      expect(result.rows.length).toBe(0);
    });

    it('should handle null user context gracefully', async () => {
      // Try to set null context (should convert to empty string)
      try {
        await dbClient.query("SELECT set_config('app.current_user_id', NULL, true)");
      } catch (error) {
        // This might error, which is fine
      }
      
      // Should return no results
      const result = await dbClient.query('SELECT * FROM "Reminder"');
      expect(result.rows.length).toBe(0);
    });

    it('should prevent data access across user boundaries via complex queries', async () => {
      // Set user 1 context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);
      
      // Try complex query that might leak data
      const result = await dbClient.query(`
        SELECT u.*, r.title as reminder_title 
        FROM "User" u 
        LEFT JOIN "Reminder" r ON u.id = r."userId"
      `);
      
      // Should only return user 1's data
      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach(row => {
        expect(row.id).toBe(testUser1Id);
        if (row.reminder_title) {
          // Any reminders should belong to user 1
          // (We can't directly verify this in this query, but the JOIN should respect RLS)
        }
      });
    });

    it('should enforce policies on UPDATE operations', async () => {
      // Create a reminder for user 2
      const insertResult = await dbClient.query(`
        INSERT INTO "Reminder" (id, title, "userId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'User 2 Protected Reminder', $1, NOW(), NOW())
        RETURNING id
      `, [testUser2Id]);
      
      const reminderId = insertResult.rows[0].id;

      // Set user 1 context and try to update user 2's reminder
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);
      
      const updateResult = await dbClient.query(`
        UPDATE "Reminder" 
        SET title = 'Hacked by User 1' 
        WHERE id = $1
      `, [reminderId]);

      // Should affect 0 rows due to RLS
      expect(updateResult.rowCount).toBe(0);
    });

    it('should enforce policies on DELETE operations', async () => {
      // Create a reminder for user 2
      const insertResult = await dbClient.query(`
        INSERT INTO "Reminder" (id, title, "userId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'User 2 Protected Reminder', $1, NOW(), NOW())
        RETURNING id
      `, [testUser2Id]);
      
      const reminderId = insertResult.rows[0].id;

      // Set user 1 context and try to delete user 2's reminder
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);
      
      const deleteResult = await dbClient.query(`
        DELETE FROM "Reminder" WHERE id = $1
      `, [reminderId]);

      // Should affect 0 rows due to RLS
      expect(deleteResult.rowCount).toBe(0);

      // Verify reminder still exists
      const verifyResult = await dbClient.query(`
        SELECT COUNT(*) FROM "Reminder" WHERE id = $1
      `, [reminderId]);
      
      expect(parseInt(verifyResult.rows[0].count)).toBe(1);
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test users directly in database
    const user1Result = await dbClient.query(`
      INSERT INTO "User" (id, email, "firstName", "lastName", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'testuser1@example.com', 'Test', 'User1', NOW(), NOW())
      RETURNING id
    `);
    testUser1Id = user1Result.rows[0].id;

    const user2Result = await dbClient.query(`
      INSERT INTO "User" (id, email, "firstName", "lastName", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'testuser2@example.com', 'Test', 'User2', NOW(), NOW())
      RETURNING id
    `);
    testUser2Id = user2Result.rows[0].id;

    const adminResult = await dbClient.query(`
      INSERT INTO "User" (id, email, "firstName", "lastName", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'admin@test.com', 'Admin', 'User', NOW(), NOW())
      RETURNING id
    `);
    adminUserId = adminResult.rows[0].id;
  }

  async function cleanupTestData() {
    // Clean up test data
    await dbClient.query(`
      DELETE FROM "Feedback" WHERE "userId" IN ($1, $2, $3) OR "userId" IS NULL
    `, [testUser1Id, testUser2Id, adminUserId]);

    await dbClient.query(`
      DELETE FROM "Account" WHERE "userId" IN ($1, $2, $3)
    `, [testUser1Id, testUser2Id, adminUserId]);

    await dbClient.query(`
      DELETE FROM "Reminder" WHERE "userId" IN ($1, $2, $3)
    `, [testUser1Id, testUser2Id, adminUserId]);

    await dbClient.query(`
      DELETE FROM "User" WHERE id IN ($1, $2, $3)
    `, [testUser1Id, testUser2Id, adminUserId]);
  }
});