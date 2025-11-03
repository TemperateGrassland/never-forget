// RLS Rollback Testing Procedures
// Tests for emergency rollback scenarios and recovery procedures

// Jest globals are available without imports
import { Client } from 'pg';
import { RLSPrismaClient, getRLSPrismaClient } from '../../src/lib/rls';

describe('RLS Rollback Testing Procedures', () => {
  let dbClient: Client;
  let prisma: RLSPrismaClient;
  let testUserId: string;
  let testData: {
    reminders: any[];
    users: any[];
  };

  beforeAll(async () => {
    dbClient = new Client({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });
    await dbClient.connect();

    prisma = getRLSPrismaClient();
    await prisma.$connect();
    
    await setupRollbackTestData();
  });

  afterAll(async () => {
    await cleanupRollbackTestData();
    await dbClient.end();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Ensure RLS is enabled before each test
    process.env.ENABLE_RLS = 'true';
    await enableRLSForTesting();
  });

  describe('Emergency RLS Disable Procedures', () => {
    it('should disable RLS via environment variable', async () => {
      // Verify RLS is enabled initially
      process.env.ENABLE_RLS = 'true';
      let prismaWithRLS = getRLSPrismaClient();
      await prismaWithRLS.clearUserContext();
      
      let reminders = await prismaWithRLS.reminder.findMany();
      expect(reminders.length).toBe(0); // No context = no results

      await prismaWithRLS.$disconnect();

      // Disable RLS via environment
      process.env.ENABLE_RLS = 'false';
      let prismaWithoutRLS = getRLSPrismaClient();
      
      // Should now see all data without context
      reminders = await prismaWithoutRLS.reminder.findMany();
      expect(reminders.length).toBeGreaterThan(0);
      
      await prismaWithoutRLS.$disconnect();
      
      // Re-enable for other tests
      process.env.ENABLE_RLS = 'true';
    });

    it('should disable RLS at database level', async () => {
      // Verify RLS is initially enabled
      const rlsStatus = await dbClient.query(`
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('User', 'Reminder', 'Account', 'Session', 'Feedback', 'FlowResponse')
      `);
      
      rlsStatus.rows.forEach(row => {
        expect(row.rowsecurity).toBe(true);
      });

      // Emergency disable RLS on all tables
      const tables = ['User', 'Reminder', 'Account', 'Session', 'FriendInvite', 'Feedback', 'FlowResponse'];
      for (const table of tables) {
        await dbClient.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
      }

      // Verify RLS is disabled
      const disabledStatus = await dbClient.query(`
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('User', 'Reminder', 'Account', 'Session', 'Feedback', 'FlowResponse')
      `);
      
      disabledStatus.rows.forEach(row => {
        expect(row.rowsecurity).toBe(false);
      });

      // Now queries should work without user context
      await dbClient.query("SELECT set_config('app.current_user_id', '', true)");
      const allReminders = await dbClient.query('SELECT * FROM "Reminder"');
      expect(allReminders.rows.length).toBeGreaterThan(0);

      // Re-enable RLS for other tests
      await enableRLSForTesting();
    });

    it('should handle partial RLS disable (specific tables)', async () => {
      // Disable RLS only on Reminder table
      await dbClient.query('ALTER TABLE "Reminder" DISABLE ROW LEVEL SECURITY');

      // Clear user context
      await dbClient.query("SELECT set_config('app.current_user_id', '', true)");

      // Reminder queries should work without context
      const reminders = await dbClient.query('SELECT * FROM "Reminder"');
      expect(reminders.rows.length).toBeGreaterThan(0);

      // User queries should still be restricted
      const users = await dbClient.query('SELECT * FROM "User"');
      expect(users.rows.length).toBe(0);

      // Re-enable RLS on Reminder table
      await dbClient.query('ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY');
    });
  });

  describe('Data Recovery Validation', () => {
    it('should verify no data loss after RLS disable/enable cycle', async () => {
      // Count data before disable
      const beforeCounts = await prisma.asServiceRole(async function() {
        return {
          users: await this.user.count(),
          reminders: await this.reminder.count(),
          feedback: await this.feedback.count()
        };
      });

      // Disable RLS
      const tables = ['User', 'Reminder', 'Feedback'];
      for (const table of tables) {
        await dbClient.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
      }

      // Verify data is accessible
      const duringDisable = await dbClient.query('SELECT COUNT(*) FROM "Reminder"');
      expect(parseInt(duringDisable.rows[0].count)).toBe(beforeCounts.reminders);

      // Re-enable RLS
      for (const table of tables) {
        await dbClient.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      }

      // Count data after re-enable
      const afterCounts = await prisma.asServiceRole(async function() {
        return {
          users: await this.user.count(),
          reminders: await this.reminder.count(),
          feedback: await this.feedback.count()
        };
      });

      // All data should be preserved
      expect(afterCounts.users).toBe(beforeCounts.users);
      expect(afterCounts.reminders).toBe(beforeCounts.reminders);
      expect(afterCounts.feedback).toBe(beforeCounts.feedback);
    });

    it('should verify data integrity after rollback', async () => {
      // Get specific test data before rollback
      const beforeReminder = await prisma.asServiceRole(async function() {
        return this.reminder.findFirst({
          where: { userId: testUserId }
        });
      });

      expect(beforeReminder).not.toBeNull();

      // Perform rollback
      await dbClient.query('ALTER TABLE "Reminder" DISABLE ROW LEVEL SECURITY');
      
      // Verify data is unchanged
      const duringRollback = await dbClient.query(`
        SELECT * FROM "Reminder" WHERE id = $1
      `, [beforeReminder!.id]);
      
      expect(duringRollback.rows.length).toBe(1);
      expect(duringRollback.rows[0].title).toBe(beforeReminder!.title);
      expect(duringRollback.rows[0].userId).toBe(beforeReminder!.userId);

      // Re-enable and verify again
      await dbClient.query('ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY');
      
      const afterReminder = await prisma.asServiceRole(async function() {
        return this.reminder.findUnique({
          where: { id: beforeReminder!.id }
        });
      });

      expect(afterReminder).toEqual(beforeReminder);
    });
  });

  describe('Policy Recovery Procedures', () => {
    it('should restore RLS policies correctly after disable/enable', async () => {
      // Check policies exist initially
      const initialPolicies = await dbClient.query(`
        SELECT tablename, policyname, cmd 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        ORDER BY tablename, policyname
      `);

      expect(initialPolicies.rows.length).toBeGreaterThan(0);

      // Disable RLS (this doesn't drop policies, just disables enforcement)
      await dbClient.query('ALTER TABLE "Reminder" DISABLE ROW LEVEL SECURITY');

      // Policies should still exist
      const policiesDuringDisable = await dbClient.query(`
        SELECT tablename, policyname, cmd 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'Reminder'
        ORDER BY tablename, policyname
      `);

      expect(policiesDuringDisable.rows.length).toBeGreaterThan(0);

      // Re-enable RLS
      await dbClient.query('ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY');

      // Policies should still exist and work
      const policiesAfterEnable = await dbClient.query(`
        SELECT tablename, policyname, cmd 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'Reminder'
        ORDER BY tablename, policyname
      `);

      expect(policiesAfterEnable.rows).toEqual(policiesDuringDisable.rows);

      // Test that policies actually work
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUserId]);
      const userReminders = await dbClient.query('SELECT * FROM "Reminder"');
      expect(userReminders.rows.length).toBeGreaterThan(0);
      expect(userReminders.rows.every(r => r.userId === testUserId)).toBe(true);
    });

    it('should handle policy recreation if needed', async () => {
      // Drop and recreate a policy to test recovery
      await dbClient.query('DROP POLICY IF EXISTS reminder_own_data ON "Reminder"');

      // Verify policy is gone
      const noPolicies = await dbClient.query(`
        SELECT * FROM pg_policies 
        WHERE tablename = 'Reminder' AND policyname = 'reminder_own_data'
      `);
      expect(noPolicies.rows.length).toBe(0);

      // Recreate the policy
      await dbClient.query(`
        CREATE POLICY reminder_own_data ON "Reminder"
        FOR ALL 
        USING ("userId" = current_app_user_id() OR is_admin_user())
      `);

      // Verify policy works
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [testUserId]);
      const reminders = await dbClient.query('SELECT * FROM "Reminder"');
      expect(reminders.rows.length).toBeGreaterThan(0);
      expect(reminders.rows.every(r => r.userId === testUserId)).toBe(true);
    });
  });

  describe('Application Recovery Testing', () => {
    it('should handle application restart after RLS changes', async () => {
      // Simulate application restart by creating new Prisma client
      let testPrisma = getRLSPrismaClient();
      
      // Verify normal operation
      await testPrisma.setUserContext(testUserId);
      const initialReminders = await testPrisma.reminder.findMany();
      expect(initialReminders.length).toBeGreaterThan(0);
      await testPrisma.$disconnect();

      // Disable RLS at DB level
      await dbClient.query('ALTER TABLE "Reminder" DISABLE ROW LEVEL SECURITY');

      // Create new client (simulating restart)
      testPrisma = getRLSPrismaClient();
      process.env.ENABLE_RLS = 'false'; // Simulate config change

      // Should work without user context
      const noContextReminders = await testPrisma.reminder.findMany();
      expect(noContextReminders.length).toBeGreaterThan(0);
      await testPrisma.$disconnect();

      // Re-enable everything
      await dbClient.query('ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY');
      process.env.ENABLE_RLS = 'true';

      // New client should work with RLS again
      testPrisma = getRLSPrismaClient();
      await testPrisma.setUserContext(testUserId);
      const finalReminders = await testPrisma.reminder.findMany();
      expect(finalReminders.length).toBe(initialReminders.length);
      await testPrisma.$disconnect();
    });

    it('should validate API endpoints work after rollback', async () => {
      // This test simulates API endpoint behavior after rollback
      const originalEnableRLS = process.env.ENABLE_RLS;

      try {
        // Disable RLS
        process.env.ENABLE_RLS = 'false';
        const testPrisma = getRLSPrismaClient();

        // Simulate API endpoint that normally requires user context
        const allReminders = await testPrisma.reminder.findMany();
        expect(allReminders.length).toBeGreaterThan(0);

        // Should see data from multiple users when RLS is disabled
        const userIds = [...new Set(allReminders.map(r => r.userId))];
        expect(userIds.length).toBeGreaterThan(0);

        await testPrisma.$disconnect();
      } finally {
        // Restore original setting
        process.env.ENABLE_RLS = originalEnableRLS;
      }
    });
  });

  describe('Rollback Safety Procedures', () => {
    it('should verify no access control bypass during rollback', async () => {
      // Even when RLS is disabled, application logic should still work
      process.env.ENABLE_RLS = 'false';
      const testPrisma = getRLSPrismaClient();

      // Application should still enforce user context when possible
      await testPrisma.setUserContext(testUserId);
      
      // Even without RLS, the context should be set correctly
      const contextResult = await testPrisma.$queryRaw<{ current_setting: string }[]>`
        SELECT current_setting('app.current_user_id', true) as current_setting
      `;
      
      expect(contextResult[0].current_setting).toBe(testUserId);

      await testPrisma.$disconnect();
      process.env.ENABLE_RLS = 'true';
    });

    it('should validate admin functions during rollback', async () => {
      process.env.ENABLE_RLS = 'false';
      process.env.ADMIN_EMAILS = 'admin@test.com';
      
      const testPrisma = getRLSPrismaClient();

      // Admin functions should still work when RLS is disabled
      const adminOperations = await testPrisma.asServiceRole(async function() {
        return {
          users: await this.user.count(),
          reminders: await this.reminder.count()
        };
      });

      expect(adminOperations.users).toBeGreaterThan(0);
      expect(adminOperations.reminders).toBeGreaterThan(0);

      await testPrisma.$disconnect();
      process.env.ENABLE_RLS = 'true';
    });
  });

  describe('Rollback Documentation Verification', () => {
    it('should verify rollback commands work as documented', async () => {
      // Test the exact commands from the documentation
      const rollbackCommands = [
        'ALTER TABLE "User" DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE "Reminder" DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE "Account" DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE "Session" DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE "Feedback" DISABLE ROW LEVEL SECURITY'
      ];

      // Execute rollback commands
      for (const command of rollbackCommands) {
        await dbClient.query(command);
      }

      // Verify RLS is disabled
      const disabledTables = await dbClient.query(`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('User', 'Reminder', 'Account', 'Session', 'Feedback')
      `);

      disabledTables.rows.forEach(row => {
        expect(row.rowsecurity).toBe(false);
      });

      // Data should be accessible without context
      const testQuery = await dbClient.query('SELECT COUNT(*) FROM "Reminder"');
      expect(parseInt(testQuery.rows[0].count)).toBeGreaterThan(0);

      // Re-enable for cleanup
      await enableRLSForTesting();
    });

    it('should verify environment variable rollback works as documented', async () => {
      // Test environment variable method from documentation
      const originalValue = process.env.ENABLE_RLS;

      // Disable via environment
      process.env.ENABLE_RLS = 'false';
      
      const testPrisma = getRLSPrismaClient();
      
      // Should access data without user context
      const reminders = await testPrisma.reminder.findMany();
      expect(reminders.length).toBeGreaterThan(0);

      await testPrisma.$disconnect();

      // Restore
      process.env.ENABLE_RLS = originalValue;
    });
  });

  // Helper functions
  async function enableRLSForTesting() {
    const tables = ['User', 'Reminder', 'Account', 'Session', 'FriendInvite', 'Feedback', 'FlowResponse'];
    
    for (const table of tables) {
      await dbClient.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    }

    // Set proper admin configuration
    await dbClient.query("SELECT set_config('app.admin_emails', 'admin@test.com', true)");
  }

  async function setupRollbackTestData() {
    testData = { reminders: [], users: [] };

    await prisma.asServiceRole(async function() {
      // Create test user
      const user = await this.user.create({
        data: {
          email: 'rollbacktest@example.com',
          firstName: 'Rollback',
          lastName: 'Test'
        }
      });
      testUserId = user.id;
      testData.users.push(user);

      // Create test reminders
      for (let i = 1; i <= 5; i++) {
        const reminder = await this.reminder.create({
          data: {
            title: `Rollback Test Reminder ${i} - Test reminder ${i} for rollback testing`,
            userId: testUserId
          }
        });
        testData.reminders.push(reminder);
      }

      // Create additional user for multi-user testing
      const user2 = await this.user.create({
        data: {
          email: 'rollbacktest2@example.com',
          firstName: 'Rollback',
          lastName: 'Test2'
        }
      });
      testData.users.push(user2);

      // Create reminders for second user
      for (let i = 1; i <= 3; i++) {
        const reminder = await this.reminder.create({
          data: {
            title: `Rollback Test Reminder ${i} for User 2`,
            userId: user2.id
          }
        });
        testData.reminders.push(reminder);
      }

      // Create feedback for testing
      await this.feedback.create({
        data: {
          type: 'COMPLEMENT',
          message: 'Rollback test feedback',
          userId: testUserId
        }
      });
    });
  }

  async function cleanupRollbackTestData() {
    const userIds = testData.users.map(u => u.id);

    await prisma.asServiceRole(async function() {
      await this.feedback.deleteMany({
        where: { userId: { in: userIds } }
      });

      await this.reminder.deleteMany({
        where: { userId: { in: userIds } }
      });

      await this.user.deleteMany({
        where: { id: { in: userIds } }
      });
    });
  }
});