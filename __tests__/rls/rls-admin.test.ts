// RLS Admin Access Testing
// Comprehensive tests for admin functionality and privilege validation

// Jest globals are available without imports
import { Client } from 'pg';
import { RLSPrismaClient, getRLSPrismaClient, withRLSContext } from '../../src/lib/rls';
import { isUserAdmin } from '../../src/lib/rls-config';

describe('RLS Admin Access Tests', () => {
  let dbClient: Client;
  let prisma: RLSPrismaClient;
  let admin1UserId: string;
  let admin2UserId: string;
  let regularUser1Id: string;
  let regularUser2Id: string;
  let testData: {
    reminders: any[];
    feedback: any[];
    users: any[];
  };

  beforeAll(async () => {
    process.env.ENABLE_RLS = 'true';
    process.env.ADMIN_EMAILS = 'admin1@test.com,admin2@test.com,charlie06allen@gmail.com';
    
    dbClient = new Client({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });
    await dbClient.connect();

    prisma = getRLSPrismaClient();
    await prisma.$connect();
    
    await setupAdminTestData();
  });

  afterAll(async () => {
    await cleanupAdminTestData();
    await dbClient.end();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.clearUserContext();
    await dbClient.query("SELECT set_config('app.current_user_id', '', true)");
    await dbClient.query("SELECT set_config('app.admin_emails', 'admin1@test.com,admin2@test.com,charlie06allen@gmail.com', true)");
  });

  describe('Admin Configuration Validation', () => {
    it('should correctly identify admin users', () => {
      expect(isUserAdmin('admin1@test.com')).toBe(true);
      expect(isUserAdmin('admin2@test.com')).toBe(true);
      expect(isUserAdmin('charlie06allen@gmail.com')).toBe(true);
      expect(isUserAdmin('regular@test.com')).toBe(false);
      expect(isUserAdmin('notfound@test.com')).toBe(false);
      expect(isUserAdmin('')).toBe(false);
    });

    it('should validate admin status at database level', async () => {
      // Test admin user
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [admin1UserId]);
      let result = await dbClient.query('SELECT is_admin_user()');
      expect(result.rows[0].is_admin_user).toBe(true);

      // Test regular user
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [regularUser1Id]);
      result = await dbClient.query('SELECT is_admin_user()');
      expect(result.rows[0].is_admin_user).toBe(false);
    });

    it('should handle case sensitivity in admin emails', async () => {
      // Test uppercase variation
      await dbClient.query("SELECT set_config('app.admin_emails', 'ADMIN1@TEST.COM,admin2@test.com', true)");
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [admin1UserId]);
      
      const result = await dbClient.query('SELECT is_admin_user()');
      // Should be case-sensitive and return false for mismatched case
      expect(result.rows[0].is_admin_user).toBe(false);
    });

    it('should handle multiple admin emails correctly', async () => {
      const multipleAdmins = 'admin1@test.com,admin2@test.com,superadmin@test.com,manager@test.com';
      await dbClient.query(`SELECT set_config('app.admin_emails', $1, true)`, [multipleAdmins]);

      // Test each admin
      const adminEmails = ['admin1@test.com', 'admin2@test.com'];
      for (const email of adminEmails) {
        const user = testData.users.find(u => u.email === email);
        if (user) {
          await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [user.id]);
          const result = await dbClient.query('SELECT is_admin_user()');
          expect(result.rows[0].is_admin_user).toBe(true);
        }
      }
    });
  });

  describe('Admin Data Access Rights', () => {
    it('should allow admin to see all users', async () => {
      const allUsers = await withRLSContext(admin1UserId, async (p) => {
        return p.user.findMany({
          orderBy: { email: 'asc' }
        });
      });

      expect(allUsers.length).toBeGreaterThanOrEqual(4); // At least our test users
      
      const userEmails = allUsers.map(u => u.email);
      expect(userEmails).toContain('admin1@test.com');
      expect(userEmails).toContain('admin2@test.com');
      expect(userEmails).toContain('regular1@test.com');
      expect(userEmails).toContain('regular2@test.com');
    });

    it('should allow admin to see all reminders', async () => {
      const allReminders = await withRLSContext(admin1UserId, async (p) => {
        return p.reminder.findMany({
          include: { User: true },
          orderBy: { createdAt: 'desc' }
        });
      });

      expect(allReminders.length).toBeGreaterThan(0);
      
      // Should see reminders from different users
      const userIds = [...new Set(allReminders.map(r => r.userId))];
      expect(userIds.length).toBeGreaterThan(1);
      
      // Verify admin can see specific user data
      const user1Reminders = allReminders.filter(r => r.userId === regularUser1Id);
      const user2Reminders = allReminders.filter(r => r.userId === regularUser2Id);
      
      expect(user1Reminders.length).toBeGreaterThan(0);
      expect(user2Reminders.length).toBeGreaterThan(0);
    });

    it('should allow admin to see all feedback including anonymous', async () => {
      const allFeedback = await withRLSContext(admin1UserId, async (p) => {
        return p.feedback.findMany({
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        });
      });

      expect(allFeedback.length).toBeGreaterThan(0);
      
      // Should see both user feedback and anonymous feedback
      const userFeedback = allFeedback.filter(f => f.userId !== null);
      const anonymousFeedback = allFeedback.filter(f => f.userId === null);
      
      expect(userFeedback.length).toBeGreaterThan(0);
      expect(anonymousFeedback.length).toBeGreaterThan(0);
      
      // Regular users should not see anonymous feedback
      const regularUserFeedback = await withRLSContext(regularUser1Id, async (p) => {
        return p.feedback.findMany();
      });
      
      expect(regularUserFeedback.every(f => f.userId === regularUser1Id)).toBe(true);
    });

    it('should allow admin to see all accounts and sessions', async () => {
      const allAccounts = await withRLSContext(admin1UserId, async (p) => {
        return p.account.findMany({
          include: { user: true }
        });
      });

      expect(allAccounts.length).toBeGreaterThan(0);
      
      // Should see accounts from different users
      const accountUserIds = [...new Set(allAccounts.map(a => a.userId))];
      expect(accountUserIds.length).toBeGreaterThan(1);

      // Test sessions if any exist
      const allSessions = await withRLSContext(admin1UserId, async (p) => {
        return p.session.findMany({
          include: { user: true }
        });
      });

      // Sessions might be empty in test, but query should succeed
      expect(Array.isArray(allSessions)).toBe(true);
    });
  });

  describe('Admin Operations', () => {
    it('should allow admin to modify any user data', async () => {
      // Admin updates another user's reminder
      const userReminder = testData.reminders.find(r => r.userId === regularUser1Id);
      expect(userReminder).toBeDefined();

      const updatedReminder = await withRLSContext(admin1UserId, async (p) => {
        return p.reminder.update({
          where: { id: userReminder.id },
          data: { title: 'Updated by Admin' }
        });
      });

      expect(updatedReminder.title).toBe('Updated by Admin');
      
      // Verify the user can still see their updated reminder
      const userView = await withRLSContext(regularUser1Id, async (p) => {
        return p.reminder.findUnique({
          where: { id: userReminder.id }
        });
      });

      expect(userView?.title).toBe('Updated by Admin');
    });

    it('should allow admin to delete any data', async () => {
      // Create a test reminder for deletion
      const testReminder = await prisma.asServiceRole(async function() {
        return this.reminder.create({
          data: {
            title: 'To be deleted by admin',
            userId: regularUser2Id
          }
        });
      });

      // Admin deletes user's reminder
      await withRLSContext(admin1UserId, async (p) => {
        return p.reminder.delete({
          where: { id: testReminder.id }
        });
      });

      // Verify deletion
      const deletedReminder = await prisma.asServiceRole(async function() {
        return this.reminder.findUnique({
          where: { id: testReminder.id }
        });
      });

      expect(deletedReminder).toBeNull();
    });

    it('should allow admin to create data for any user', async () => {
      const newReminder = await withRLSContext(admin1UserId, async (p) => {
        return p.reminder.create({
          data: {
            title: 'Created by admin for user',
            userId: regularUser1Id
          }
        });
      });

      expect(newReminder.userId).toBe(regularUser1Id);
      
      // Verify user can see the reminder created by admin
      const userReminders = await withRLSContext(regularUser1Id, async (p) => {
        return p.reminder.findMany({
          where: { title: 'Created by admin for user' }
        });
      });

      expect(userReminders.length).toBe(1);
      expect(userReminders[0].id).toBe(newReminder.id);
    });

    it('should allow admin to perform complex cross-user queries', async () => {
      // Admin gets statistics across all users
      const stats = await withRLSContext(admin1UserId, async (p) => {
        return Promise.all([
          p.user.count(),
          p.reminder.count(),
          p.reminder.groupBy({
            by: ['userId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } }
          }),
          p.feedback.count({ where: { userId: null } }) // Anonymous feedback count
        ]);
      });

      const [userCount, reminderCount, remindersByUser, anonymousFeedbackCount] = stats;

      expect(userCount).toBeGreaterThanOrEqual(4);
      expect(reminderCount).toBeGreaterThan(0);
      expect(remindersByUser.length).toBeGreaterThan(1);
      expect(anonymousFeedbackCount).toBeGreaterThan(0);
    });
  });

  describe('Admin vs Regular User Comparison', () => {
    it('should demonstrate difference in data access between admin and regular user', async () => {
      // Regular user's view
      const regularUserData = await withRLSContext(regularUser1Id, async (p) => {
        return Promise.all([
          p.user.findMany(),
          p.reminder.findMany(),
          p.feedback.findMany(),
          p.account.findMany()
        ]);
      });

      const [regUsers, regReminders, regFeedback, regAccounts] = regularUserData;

      // Admin's view
      const adminData = await withRLSContext(admin1UserId, async (p) => {
        return Promise.all([
          p.user.findMany(),
          p.reminder.findMany(),
          p.feedback.findMany(),
          p.account.findMany()
        ]);
      });

      const [adminUsers, adminReminders, adminFeedback, adminAccounts] = adminData;

      // Regular user should only see their own data
      expect(regUsers.length).toBe(1);
      expect(regUsers[0].id).toBe(regularUser1Id);
      expect(regReminders.every(r => r.userId === regularUser1Id)).toBe(true);
      expect(regFeedback.every(f => f.userId === regularUser1Id)).toBe(true);
      expect(regAccounts.every(a => a.userId === regularUser1Id)).toBe(true);

      // Admin should see all data
      expect(adminUsers.length).toBeGreaterThan(regUsers.length);
      expect(adminReminders.length).toBeGreaterThan(regReminders.length);
      expect(adminFeedback.length).toBeGreaterThan(regFeedback.length);
      expect(adminAccounts.length).toBeGreaterThan(regAccounts.length);

      // Admin should see data from multiple users
      const adminReminderUsers = [...new Set(adminReminders.map(r => r.userId))];
      expect(adminReminderUsers.length).toBeGreaterThan(1);
      expect(adminReminderUsers).toContain(regularUser1Id);
      expect(adminReminderUsers).toContain(regularUser2Id);
    });
  });

  describe('Admin Privilege Validation', () => {
    it('should prevent privilege escalation from regular user to admin', async () => {
      // Regular user tries to access admin-only data
      const regularUserAttempt = await withRLSContext(regularUser1Id, async (p) => {
        return p.feedback.findMany();
      });

      // Should only see their own feedback, not anonymous feedback
      expect(regularUserAttempt.every(f => f.userId === regularUser1Id)).toBe(true);
      expect(regularUserAttempt.some(f => f.userId === null)).toBe(false);
    });

    it('should validate admin status on each request', async () => {
      // Admin makes request
      const adminRequest1 = await withRLSContext(admin1UserId, async (p) => {
        return p.user.findMany();
      });

      expect(adminRequest1.length).toBeGreaterThan(1);

      // Same admin makes another request (context should persist properly)
      const adminRequest2 = await withRLSContext(admin1UserId, async (p) => {
        return p.feedback.findMany({ where: { userId: null } });
      });

      expect(adminRequest2.length).toBeGreaterThan(0);
    });

    it('should handle admin user switching correctly', async () => {
      // First admin
      const admin1Data = await withRLSContext(admin1UserId, async (p) => {
        return p.user.count();
      });

      // Second admin
      const admin2Data = await withRLSContext(admin2UserId, async (p) => {
        return p.user.count();
      });

      // Both admins should see the same data
      expect(admin1Data).toBe(admin2Data);
      expect(admin1Data).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Admin Security Boundaries', () => {
    it('should require proper admin configuration', async () => {
      // Clear admin emails
      await dbClient.query("SELECT set_config('app.admin_emails', '', true)");
      await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [admin1UserId]);

      // Should not have admin privileges without proper configuration
      const result = await dbClient.query('SELECT is_admin_user()');
      expect(result.rows[0].is_admin_user).toBe(false);

      // Should only see own data
      const userData = await dbClient.query('SELECT * FROM "User"');
      expect(userData.rows.length).toBe(1);
      expect(userData.rows[0].id).toBe(admin1UserId);
    });

    it('should validate admin email format', async () => {
      const invalidAdminEmails = [
        'invalid-email',
        'admin@',
        '@test.com',
        'admin@@test.com',
        'admin@test.',
        ''
      ];

      for (const invalidEmail of invalidAdminEmails) {
        await dbClient.query(`SELECT set_config('app.admin_emails', $1, true)`, [invalidEmail]);
        
        // Create a mock user ID for the invalid email
        await dbClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [admin1UserId]);
        
        const result = await dbClient.query('SELECT is_admin_user()');
        expect(result.rows[0].is_admin_user).toBe(false);
      }
    });
  });

  // Helper functions
  async function setupAdminTestData() {
    testData = { reminders: [], feedback: [], users: [] };

    await prisma.asServiceRole(async function() {
      // Create admin users
      const admin1 = await this.user.create({
        data: {
          email: 'admin1@test.com',
          firstName: 'Admin',
          lastName: 'One'
        }
      });
      admin1UserId = admin1.id;
      testData.users.push(admin1);

      const admin2 = await this.user.create({
        data: {
          email: 'admin2@test.com',
          firstName: 'Admin',
          lastName: 'Two'
        }
      });
      admin2UserId = admin2.id;
      testData.users.push(admin2);

      // Create regular users
      const regular1 = await this.user.create({
        data: {
          email: 'regular1@test.com',
          firstName: 'Regular',
          lastName: 'One'
        }
      });
      regularUser1Id = regular1.id;
      testData.users.push(regular1);

      const regular2 = await this.user.create({
        data: {
          email: 'regular2@test.com',
          firstName: 'Regular',
          lastName: 'Two'
        }
      });
      regularUser2Id = regular2.id;
      testData.users.push(regular2);

      // Create reminders for each user
      const allUserIds = [admin1UserId, admin2UserId, regularUser1Id, regularUser2Id];
      for (const userId of allUserIds) {
        for (let i = 1; i <= 3; i++) {
          const reminder = await this.reminder.create({
            data: {
              title: `Reminder ${i} for ${userId} - Test reminder ${i}`,
              userId: userId
            }
          });
          testData.reminders.push(reminder);
        }
      }

      // Create feedback (including anonymous)
      for (const userId of allUserIds) {
        const feedback = await this.feedback.create({
          data: {
            type: 'COMPLEMENT',
            message: `Feedback from ${userId}`,
            userId: userId
          }
        });
        testData.feedback.push(feedback);
      }

      // Create anonymous feedback
      const anonymousFeedback = await this.feedback.create({
        data: {
          type: 'CRITICISM',
          message: 'Anonymous feedback for admin review',
          userId: null
        }
      });
      testData.feedback.push(anonymousFeedback);

      // Create accounts for users
      for (const userId of allUserIds) {
        await this.account.create({
          data: {
            userId: userId,
            provider: 'test',
            providerAccountId: `test_${userId}`,
            type: 'oauth'
          }
        });
      }
    });
  }

  async function cleanupAdminTestData() {
    const allUserIds = [admin1UserId, admin2UserId, regularUser1Id, regularUser2Id];

    await prisma.asServiceRole(async function() {
      // Clean up in dependency order
      await this.feedback.deleteMany({
        where: {
          OR: [
            { userId: { in: allUserIds } },
            { userId: null }
          ]
        }
      });

      await this.account.deleteMany({
        where: { userId: { in: allUserIds } }
      });

      await this.reminder.deleteMany({
        where: { userId: { in: allUserIds } }
      });

      await this.user.deleteMany({
        where: { id: { in: allUserIds } }
      });
    });
  }
});