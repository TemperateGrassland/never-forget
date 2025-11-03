// RLS Unit Tests
// Tests for Row Level Security implementation

// Jest globals are available without imports
import { RLSPrismaClient, getRLSPrismaClient } from '../../src/lib/rls';
import { validateRLSConfig, RLS_CONFIG } from '../../src/lib/rls-config';

// Test database setup
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

describe('RLS Unit Tests', () => {
  let prisma: RLSPrismaClient;
  let testUser1Id: string;
  let testUser2Id: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Ensure RLS is enabled for testing
    process.env.ENABLE_RLS = 'true';
    process.env.ADMIN_EMAILS = 'admin@test.com,charlie06allen@gmail.com';
    
    prisma = getRLSPrismaClient();
    
    try {
      await prisma.$connect();
      
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Set up test data
      await setupTestData();
    } catch (error) {
      console.warn(`⚠️  Database setup failed: ${error.message}`);
      console.warn('⚠️  Some tests may be skipped due to database connectivity issues');
    }
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear any existing context before each test
    await prisma.clearUserContext();
  });

  describe('RLS Configuration', () => {
    it('should validate RLS configuration', () => {
      const config = validateRLSConfig();
      expect(config.valid).toBe(true);
      expect(config.errors).toHaveLength(0);
    });

    it('should have admin emails configured', () => {
      expect(RLS_CONFIG.adminEmails).toContain('admin@test.com');
      expect(RLS_CONFIG.adminEmails).toContain('charlie06allen@gmail.com');
    });

    it('should be enabled in test environment', () => {
      expect(RLS_CONFIG.enabled).toBe(true);
    });
  });

  describe('User Context Management', () => {
    it('should set and retrieve user context', async () => {
      await prisma.setUserContext(testUser1Id);
      
      // Query the context setting directly
      const result = await prisma.$queryRaw<{ current_setting: string }[]>`
        SELECT current_setting('app.current_user_id', true) as current_setting
      `;
      
      expect(result[0].current_setting).toBe(testUser1Id);
    });

    it('should clear user context', async () => {
      await prisma.setUserContext(testUser1Id);
      await prisma.clearUserContext();
      
      const result = await prisma.$queryRaw<{ current_setting: string }[]>`
        SELECT current_setting('app.current_user_id', true) as current_setting
      `;
      
      expect(result[0].current_setting).toBe('');
    });

    it('should execute operations with user context', async () => {
      const result = await prisma.withUserContext(testUser1Id, async () => {
        return await prisma.$queryRaw<{ current_setting: string }[]>`
          SELECT current_setting('app.current_user_id', true) as current_setting
        `;
      });
      
      expect(result[0].current_setting).toBe(testUser1Id);
    });
  });

  describe('RLS Policy Enforcement', () => {
    it('should only return own reminders', async () => {
      if (!testUser1Id || !testUser2Id) {
        console.warn('⚠️  Skipping test - test users not created (database setup issue)');
        return;
      }

      // Create test reminders for both users
      await prisma.asServiceRole(async function() {
        await this.reminder.createMany({
          data: [
            { title: 'User 1 Reminder 1', userId: testUser1Id },
            { title: 'User 1 Reminder 2', userId: testUser1Id },
            { title: 'User 2 Reminder 1', userId: testUser2Id },
          ]
        });
      });

      // Test User 1 can only see their reminders
      const user1Reminders = await prisma.withUserContext(testUser1Id, async (p) => {
        return p.reminder.findMany();
      });

      expect(user1Reminders).toHaveLength(2);
      expect(user1Reminders.every(r => r.userId === testUser1Id)).toBe(true);

      // Test User 2 can only see their reminders
      const user2Reminders = await prisma.withUserContext(testUser2Id, async (p) => {
        return p.reminder.findMany();
      });

      expect(user2Reminders).toHaveLength(1);
      expect(user2Reminders.every(r => r.userId === testUser2Id)).toBe(true);
    });

    it('should only return own user profile', async () => {
      const userProfile = await prisma.withUserContext(testUser1Id, async (p) => {
        return p.user.findMany();
      });

      expect(userProfile).toHaveLength(1);
      expect(userProfile[0].id).toBe(testUser1Id);
    });

    it('should only return own accounts', async () => {
      // Create test accounts
      await prisma.asServiceRole(async function() {
        await this.account.createMany({
          data: [
            {
              userId: testUser1Id,
              provider: 'test',
              providerAccountId: 'test1',
              type: 'oauth'
            },
            {
              userId: testUser2Id,
              provider: 'test',
              providerAccountId: 'test2',
              type: 'oauth'
            }
          ]
        });
      });

      const user1Accounts = await prisma.withUserContext(testUser1Id, async (p) => {
        return p.account.findMany();
      });

      expect(user1Accounts).toHaveLength(1);
      expect(user1Accounts[0].userId).toBe(testUser1Id);
    });

    it('should only return own feedback', async () => {
      // Create test feedback
      await prisma.asServiceRole(async function() {
        await this.feedback.createMany({
          data: [
            {
              type: 'COMPLEMENT',
              message: 'User 1 feedback',
              userId: testUser1Id
            },
            {
              type: 'CRITICISM',
              message: 'User 2 feedback',
              userId: testUser2Id
            },
            {
              type: 'COMPLEMENT',
              message: 'Anonymous feedback',
              userId: null // Anonymous
            }
          ]
        });
      });

      const user1Feedback = await prisma.withUserContext(testUser1Id, async (p) => {
        return p.feedback.findMany();
      });

      expect(user1Feedback).toHaveLength(1);
      expect(user1Feedback[0].userId).toBe(testUser1Id);

      // User should not see anonymous feedback
      expect(user1Feedback.some(f => f.userId === null)).toBe(false);
    });
  });

  describe('Admin Access', () => {
    it('should allow admin to see all reminders', async () => {
      const allReminders = await prisma.withUserContext(adminUserId, async (p) => {
        return p.reminder.findMany();
      });

      // Admin should see reminders from all users
      const userIds = Array.from(new Set(allReminders.map(r => r.userId)));
      expect(userIds.length).toBeGreaterThan(1);
      expect(userIds).toContain(testUser1Id);
      expect(userIds).toContain(testUser2Id);
    });

    it('should allow admin to see all users', async () => {
      const allUsers = await prisma.withUserContext(adminUserId, async (p) => {
        return p.user.findMany();
      });

      expect(allUsers.length).toBeGreaterThanOrEqual(3); // At least our 3 test users
      const userIds = allUsers.map(u => u.id);
      expect(userIds).toContain(testUser1Id);
      expect(userIds).toContain(testUser2Id);
      expect(userIds).toContain(adminUserId);
    });

    it('should allow admin to see anonymous feedback', async () => {
      const allFeedback = await prisma.withUserContext(adminUserId, async (p) => {
        return p.feedback.findMany();
      });

      // Admin should see both user feedback and anonymous feedback
      const hasAnonymous = allFeedback.some(f => f.userId === null);
      const hasUserFeedback = allFeedback.some(f => f.userId !== null);
      
      expect(hasAnonymous).toBe(true);
      expect(hasUserFeedback).toBe(true);
    });
  });

  describe('Service Role Operations', () => {
    it('should bypass RLS with service role', async () => {
      const allReminders = await prisma.asServiceRole(async function() {
        return this.reminder.findMany();
      });

      // Service role should see all reminders regardless of user
      const userIds = Array.from(new Set(allReminders.map(r => r.userId)));
      expect(userIds.length).toBeGreaterThan(1);
    });

    it('should allow service role to create data for any user', async () => {
      const newReminder = await prisma.asServiceRole(async function() {
        return this.reminder.create({
          data: {
            title: 'Service created reminder',
            userId: testUser1Id
          }
        });
      });

      expect(newReminder.userId).toBe(testUser1Id);
      expect(newReminder.title).toBe('Service created reminder');
    });
  });

  describe('Security Boundary Tests', () => {
    it('should prevent user from accessing other user data via complex queries', async () => {
      // Try to access other user's data through joins
      const result = await prisma.withUserContext(testUser1Id, async (p) => {
        return p.user.findMany({
          include: {
            reminders: true
          }
        });
      });

      // Should only return the current user's profile and their reminders
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testUser1Id);
      expect(result[0].reminders.every(r => r.userId === testUser1Id)).toBe(true);
    });

    it('should prevent data leakage through count queries', async () => {
      const userCount = await prisma.withUserContext(testUser1Id, async (p) => {
        return p.user.count();
      });

      // User should only see themselves in count
      expect(userCount).toBe(1);
    });

    it('should prevent data access without user context', async () => {
      // Clear user context and try to access data
      await prisma.clearUserContext();
      
      const reminders = await prisma.reminder.findMany();
      
      // Should return empty result when no user context is set
      expect(reminders).toHaveLength(0);
    });
  });

  // Helper functions
  async function setupTestData() {
    // Use service role to create test users with unique emails
    const timestamp = Date.now();
    
    await prisma.asServiceRole(async function() {
      // First, clean up any existing test data
      await this.user.deleteMany({
        where: {
          email: {
            contains: 'rlstest'
          }
        }
      });

      // Create test users with unique emails
      const user1 = await this.user.create({
        data: {
          email: `rlstest1.${timestamp}@example.com`,
          firstName: 'Test',
          lastName: 'User1'
        }
      });
      testUser1Id = user1.id;

      const user2 = await this.user.create({
        data: {
          email: `rlstest2.${timestamp}@example.com`,
          firstName: 'Test',
          lastName: 'User2'
        }
      });
      testUser2Id = user2.id;

      const adminUser = await this.user.create({
        data: {
          email: `rlsadmin.${timestamp}@test.com`,
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      adminUserId = adminUser.id;
    });
  }

  async function cleanupTestData() {
    if (!testUser1Id && !testUser2Id && !adminUserId) return;
    
    // Clean up test data using service role
    await prisma.asServiceRole(async function() {
      try {
        const userIds = [testUser1Id, testUser2Id, adminUserId].filter(Boolean);
        
        if (userIds.length === 0) return;

        // Delete in order to respect foreign key constraints
        await this.feedback.deleteMany({
          where: {
            OR: [
              { userId: { in: userIds } },
              { userId: null } // Anonymous feedback from tests
            ]
          }
        });

        await this.account.deleteMany({
          where: {
            userId: { in: userIds }
          }
        });

        await this.reminder.deleteMany({
          where: {
            userId: { in: userIds }
          }
        });

        await this.user.deleteMany({
          where: {
            id: { in: userIds }
          }
        });
      } catch (error) {
        console.warn('⚠️  Test cleanup failed:', error.message);
      }
    });
  }
});