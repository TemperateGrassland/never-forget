// RLS Security Penetration Tests
// Advanced security tests to ensure RLS cannot be bypassed

// Jest globals are available without imports
import { Client } from 'pg';
import { RLSPrismaClient, getRLSPrismaClient, withRLSContext } from '../../src/lib/rls';

describe('RLS Security Penetration Tests', () => {
  let dbClient: Client;
  let prisma: RLSPrismaClient;
  let testUser1Id: string;
  let testUser2Id: string;
  let adminUserId: string;

  beforeAll(async () => {
    process.env.ENABLE_RLS = 'true';
    process.env.ADMIN_EMAILS = 'admin@test.com';
    
    dbClient = new Client({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });
    await dbClient.connect();

    prisma = getRLSPrismaClient();
    await prisma.$connect();
    
    await setupSecurityTestData();
  });

  afterAll(async () => {
    await cleanupSecurityTestData();
    await dbClient.end();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.clearUserContext();
    await dbClient.query("SELECT set_config('app.current_user_id', '', true)");
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection through user context', async () => {
      const maliciousPayloads = [
        "'; DROP TABLE \"User\"; --",
        "' OR '1'='1",
        "'; DELETE FROM \"Reminder\"; --",
        "' UNION SELECT * FROM \"User\" WHERE '1'='1",
        "'; UPDATE \"User\" SET email='hacked@evil.com'; --",
        "') OR ('1'='1",
        "'; INSERT INTO \"Reminder\" VALUES (gen_random_uuid(), 'hacked', '" + testUser2Id + "', NOW(), NOW()); --"
      ];

      for (const payload of maliciousPayloads) {
        // Try to set malicious user context
        await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [payload]);
        
        // Query should not be affected by injection
        const result = await dbClient.query('SELECT * FROM "Reminder"');
        expect(result.rows.length).toBe(0); // Should return no rows due to invalid context
        
        // Verify tables still exist
        const tableCheck = await dbClient.query(`
          SELECT tablename FROM pg_tables 
          WHERE schemaname = 'public' AND tablename = 'User'
        `);
        expect(tableCheck.rows.length).toBe(1);
      }
    });

    it('should prevent SQL injection through Prisma with RLS', async () => {
      const maliciousInputs = [
        "'; DROP TABLE \"User\"; --",
        "' OR 1=1 --",
        "'; DELETE FROM \"Reminder\"; --"
      ];

      for (const maliciousInput of maliciousInputs) {
        try {
          // Try injection through search functionality
          await withRLSContext(testUser1Id, async (p) => {
            return p.reminder.findMany({
              where: {
                title: { contains: maliciousInput }
              }
            });
          });
        } catch (error) {
          // Prisma should handle this safely
        }

        // Verify database integrity
        const reminderCount = await prisma.asServiceRole(async function() {
          return this.reminder.count();
        });
        expect(reminderCount).toBeGreaterThan(0);
      }
    });

    it('should prevent privilege escalation through function calls', async () => {
      // Set regular user context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);
      
      // Try to call admin functions with malicious parameters
      const maliciousCalls = [
        `SELECT set_config('app.admin_emails', 'hacker@evil.com', true)`,
        `SELECT set_config('app.current_user_id', '${testUser2Id}', true)`,
        `UPDATE "User" SET email = 'hacked@evil.com' WHERE id = '${testUser2Id}'`
      ];

      for (const call of maliciousCalls) {
        try {
          await dbClient.query(call);
        } catch (error) {
          // Some calls might error, which is expected
        }
      }

      // Verify user 2's data wasn't compromised
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser2Id]);
      const user2Data = await dbClient.query('SELECT * FROM "User"');
      expect(user2Data.rows.length).toBe(1);
      expect(user2Data.rows[0].email).toBe('secuser2@example.com');
    });
  });

  describe('Cross-User Data Access Prevention', () => {
    it('should prevent direct table access bypassing RLS', async () => {
      // Set user 1 context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);

      // Try various SQL commands that should be restricted
      const restrictedQueries = [
        `SELECT * FROM "User" WHERE id = '${testUser2Id}'`,
        `UPDATE "User" SET "firstName" = 'Hacked' WHERE id = '${testUser2Id}'`,
        `DELETE FROM "Reminder" WHERE "userId" = '${testUser2Id}'`,
        `INSERT INTO "Reminder" (id, title, "userId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), 'Fake', '${testUser2Id}', NOW(), NOW())`
      ];

      for (const query of restrictedQueries) {
        const result = await dbClient.query(query);
        
        // Should affect 0 rows due to RLS
        expect(result.rowCount).toBe(0);
      }
    });

    it('should prevent data access through complex JOINs', async () => {
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);

      // Try to access other user's data through JOINs
      const joinQueries = [
        `
          SELECT r.*, u.email 
          FROM "Reminder" r 
          JOIN "User" u ON r."userId" = u.id 
          WHERE u.id = '${testUser2Id}'
        `,
        `
          SELECT u1.*, u2.email as other_email
          FROM "User" u1
          CROSS JOIN "User" u2
          WHERE u2.id = '${testUser2Id}'
        `,
        `
          SELECT * FROM "User" u
          WHERE EXISTS (
            SELECT 1 FROM "Reminder" r 
            WHERE r."userId" = '${testUser2Id}' AND r."userId" = u.id
          )
        `
      ];

      for (const query of joinQueries) {
        const result = await dbClient.query(query);
        
        // Should only return data for current user (testUser1Id)
        result.rows.forEach(row => {
          if (row.id) {
            expect(row.id).toBe(testUser1Id);
          }
          if (row.userId) {
            expect(row.userId).toBe(testUser1Id);
          }
        });
      }
    });

    it('should prevent data access through subqueries', async () => {
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);

      // Try to access data through subqueries
      const subqueryTests = [
        `
          SELECT * FROM "User" 
          WHERE id IN (
            SELECT "userId" FROM "Reminder" WHERE "userId" = '${testUser2Id}'
          )
        `,
        `
          SELECT * FROM "Reminder" 
          WHERE "userId" = (
            SELECT id FROM "User" WHERE email = 'secuser2@example.com'
          )
        `,
        `
          SELECT COUNT(*) FROM "User" 
          WHERE id != '${testUser1Id}'
        `
      ];

      for (const query of subqueryTests) {
        const result = await dbClient.query(query);
        
        // Should not reveal other users' data
        if (result.rows.length > 0 && result.rows[0].id) {
          expect(result.rows[0].id).toBe(testUser1Id);
        }
        
        // Count queries should only count current user's accessible data
        if (result.rows[0].count !== undefined) {
          expect(parseInt(result.rows[0].count)).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe('Admin Privilege Validation', () => {
    it('should prevent non-admin users from gaining admin access', async () => {
      // Set regular user context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);

      // Try to access admin-only data (anonymous feedback)
      const anonymousFeedback = await dbClient.query(`
        SELECT * FROM "Feedback" WHERE "userId" IS NULL
      `);
      
      expect(anonymousFeedback.rows.length).toBe(0);

      // Try to access all users
      const allUsers = await dbClient.query('SELECT * FROM "User"');
      expect(allUsers.rows.length).toBe(1);
      expect(allUsers.rows[0].id).toBe(testUser1Id);
    });

    it('should validate admin email configuration', async () => {
      // Test with invalid admin email
      await dbClient.query(`SELECT set_config('app.admin_emails', 'notanadmin@example.com', true)`);
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);

      const isAdmin = await dbClient.query('SELECT is_admin_user()');
      expect(isAdmin.rows[0].is_admin_user).toBe(false);

      // Should not have admin access
      const allUsers = await dbClient.query('SELECT * FROM "User"');
      expect(allUsers.rows.length).toBe(1);
    });

    it('should prevent admin email tampering', async () => {
      // Set malicious admin emails
      const maliciousAdminEmails = [
        "'; DROP TABLE \"User\"; --",
        "hacker@evil.com' OR '1'='1",
        "admin@test.com'; UPDATE \"User\" SET email='hacked'; --"
      ];

      for (const maliciousEmail of maliciousAdminEmails) {
        await dbClient.query(`SELECT set_config('app.admin_emails', $1, true)`, [maliciousEmail]);
        await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);

        // Should not grant admin access
        const isAdmin = await dbClient.query('SELECT is_admin_user()');
        expect(isAdmin.rows[0].is_admin_user).toBe(false);
      }
    });
  });

  describe('Session Security', () => {
    it('should prevent session fixation attacks', async () => {
      // Create sessions for both users
      await prisma.asServiceRole(async function() {
        await this.session.createMany({
          data: [
            {
              sessionToken: 'user1_session_token',
              userId: testUser1Id,
              expires: new Date(Date.now() + 86400000) // 24 hours
            },
            {
              sessionToken: 'user2_session_token',
              userId: testUser2Id,
              expires: new Date(Date.now() + 86400000)
            }
          ]
        });
      });

      // Set user 1 context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);

      // Try to access user 2's session
      const sessions = await dbClient.query('SELECT * FROM "Session"');
      
      // Should only see own session
      expect(sessions.rows.length).toBe(1);
      expect(sessions.rows[0].userId).toBe(testUser1Id);
      expect(sessions.rows[0].sessionToken).toBe('user1_session_token');
    });

    it('should prevent session hijacking through account linking', async () => {
      // Create accounts for both users
      await prisma.asServiceRole(async function() {
        await this.account.createMany({
          data: [
            {
              userId: testUser1Id,
              provider: 'google',
              providerAccountId: 'google_user1',
              type: 'oauth',
              access_token: 'user1_access_token'
            },
            {
              userId: testUser2Id,
              provider: 'google',
              providerAccountId: 'google_user2',
              type: 'oauth',
              access_token: 'user2_access_token'
            }
          ]
        });
      });

      // Set user 1 context
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);

      // Try to access other user's accounts
      const accounts = await dbClient.query('SELECT * FROM "Account"');
      
      // Should only see own account
      expect(accounts.rows.length).toBe(1);
      expect(accounts.rows[0].userId).toBe(testUser1Id);
      expect(accounts.rows[0].access_token).toBe('user1_access_token');
    });
  });

  describe('Data Leakage Prevention', () => {
    it('should prevent timing attacks on user existence', async () => {
      const existingUserId = testUser1Id;
      const nonExistentUserId = '123e4567-e89b-12d3-a456-426614174000';

      // Set context for existing user
      const start1 = Date.now();
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [existingUserId]);
      const result1 = await dbClient.query('SELECT * FROM "User"');
      const end1 = Date.now();
      const time1 = end1 - start1;

      // Set context for non-existent user
      const start2 = Date.now();
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [nonExistentUserId]);
      const result2 = await dbClient.query('SELECT * FROM "User"');
      const end2 = Date.now();
      const time2 = end2 - start2;

      // Results should be consistent
      expect(result1.rows.length).toBe(1);
      expect(result2.rows.length).toBe(0);

      // Timing should be similar (within 100ms) to prevent timing attacks
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(100);
    });

    it('should prevent information disclosure through error messages', async () => {
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);

      // Try operations that might reveal information through errors
      const testQueries = [
        `SELECT * FROM "NonExistentTable"`,
        `UPDATE "User" SET email = 'test' WHERE id = '${testUser2Id}'`,
        `DELETE FROM "Reminder" WHERE "userId" = '${testUser2Id}'`
      ];

      for (const query of testQueries) {
        try {
          await dbClient.query(query);
        } catch (error) {
          // Error messages should not reveal sensitive information
          const errorMessage = error.message.toLowerCase();
          expect(errorMessage).not.toContain(testUser2Id);
          expect(errorMessage).not.toContain('secuser2@example.com');
        }
      }
    });
  });

  describe('Concurrent Attack Prevention', () => {
    it('should prevent race conditions in context switching', async () => {
      const promises = [];
      const results = [];

      // Simulate concurrent requests with different users
      for (let i = 0; i < 10; i++) {
        const userId = i % 2 === 0 ? testUser1Id : testUser2Id;
        promises.push(
          withRLSContext(userId, async (p) => {
            const user = await p.user.findFirst();
            results.push({ userId, foundId: user?.id });
            return user;
          })
        );
      }

      await Promise.all(promises);

      // Each request should only find its own user
      results.forEach(result => {
        expect(result.foundId).toBe(result.userId);
      });
    });

    it('should prevent TOCTOU (Time-of-Check-Time-of-Use) attacks', async () => {
      // Create a reminder for user 2
      const reminder = await prisma.asServiceRole(async function() {
        return this.reminder.create({
          data: {
            title: 'TOCTOU Test Reminder',
            userId: testUser2Id
          }
        });
      });

      // User 1 tries to exploit TOCTOU
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUser1Id]);

      // First check - should not find the reminder
      const checkResult = await dbClient.query(`
        SELECT * FROM "Reminder" WHERE id = $1
      `, [reminder.id]);
      expect(checkResult.rows.length).toBe(0);

      // Try to update in between (simulating race condition)
      try {
        const updateResult = await dbClient.query(`
          UPDATE "Reminder" SET title = 'Hacked' WHERE id = $1
        `, [reminder.id]);
        expect(updateResult.rowCount).toBe(0);
      } catch (error) {
        // Update should fail or affect 0 rows
      }

      // Verify reminder wasn't modified
      const verifyResult = await prisma.asServiceRole(async function() {
        return this.reminder.findUnique({
          where: { id: reminder.id }
        });
      });
      expect(verifyResult?.title).toBe('TOCTOU Test Reminder');
    });
  });

  // Helper functions
  async function setupSecurityTestData() {
    await prisma.asServiceRole(async function() {
      const user1 = await this.user.create({
        data: {
          email: 'secuser1@example.com',
          firstName: 'Security',
          lastName: 'User1'
        }
      });
      testUser1Id = user1.id;

      const user2 = await this.user.create({
        data: {
          email: 'secuser2@example.com',
          firstName: 'Security',
          lastName: 'User2'
        }
      });
      testUser2Id = user2.id;

      const adminUser = await this.user.create({
        data: {
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      adminUserId = adminUser.id;

      // Create test data
      await this.reminder.createMany({
        data: [
          { title: 'User 1 Reminder', userId: testUser1Id },
          { title: 'User 2 Reminder', userId: testUser2Id },
          { title: 'Admin Reminder', userId: adminUserId }
        ]
      });

      await this.feedback.createMany({
        data: [
          { type: 'COMPLEMENT', message: 'User feedback', userId: testUser1Id },
          { type: 'CRITICISM', message: 'Anonymous feedback', userId: null }
        ]
      });
    });
  }

  async function cleanupSecurityTestData() {
    await prisma.asServiceRole(async function() {
      await this.session.deleteMany({
        where: {
          userId: { in: [testUser1Id, testUser2Id, adminUserId] }
        }
      });

      await this.account.deleteMany({
        where: {
          userId: { in: [testUser1Id, testUser2Id, adminUserId] }
        }
      });

      await this.feedback.deleteMany({
        where: {
          OR: [
            { userId: { in: [testUser1Id, testUser2Id, adminUserId] } },
            { userId: null }
          ]
        }
      });

      await this.reminder.deleteMany({
        where: {
          userId: { in: [testUser1Id, testUser2Id, adminUserId] }
        }
      });

      await this.user.deleteMany({
        where: {
          id: { in: [testUser1Id, testUser2Id, adminUserId] }
        }
      });
    });
  }
});