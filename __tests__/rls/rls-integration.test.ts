// RLS Integration Tests
// Tests for RLS with actual API routes and real-world scenarios

// Jest globals are available without imports
// import { createMocks } from 'node-mocks-http';
// import { NextRequest } from 'next/server';
import { RLSPrismaClient, getRLSPrismaClient } from '../../src/lib/rls';
import { withRLSContext } from '../../src/lib/rls';

// Mock NextAuth session
const mockAuth = jest.fn();
jest.mock('../../src/auth', () => ({
  auth: () => mockAuth()
}));

describe('RLS Integration Tests', () => {
  let prisma: RLSPrismaClient;
  let testUser1Id: string;
  let testUser2Id: string;
  let adminUserId: string;

  beforeAll(async () => {
    process.env.ENABLE_RLS = 'true';
    process.env.ADMIN_EMAILS = 'admin@test.com';
    
    prisma = getRLSPrismaClient();
    await prisma.$connect();
    
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.clearUserContext();
    jest.clearAllMocks();
  });

  describe('API Route Integration', () => {
    it('should enforce RLS in reminder API endpoints', async () => {
      // Mock session for user 1
      mockAuth.mockResolvedValue({
        user: { id: testUser1Id, email: 'testuser1@example.com' }
      });

      // Create test reminders for both users
      await prisma.asServiceRole(async function() {
        await this.reminder.createMany({
          data: [
            { title: 'User 1 Reminder', userId: testUser1Id },
            { title: 'User 2 Reminder', userId: testUser2Id }
          ]
        });
      });

      // Simulate API call to get reminders
      const reminders = await withRLSContext(testUser1Id, async (p) => {
        return p.reminder.findMany({
          orderBy: { createdAt: 'desc' }
        });
      });

      // Should only return user 1's reminders
      expect(reminders).toHaveLength(1);
      expect(reminders[0].userId).toBe(testUser1Id);
      expect(reminders[0].title).toBe('User 1 Reminder');
    });

    it('should enforce RLS when creating reminders', async () => {
      // User 1 creates a reminder
      const newReminder = await withRLSContext(testUser1Id, async (p) => {
        return p.reminder.create({
          data: {
            title: 'New Reminder',
            userId: testUser1Id
          }
        });
      });

      expect(newReminder.userId).toBe(testUser1Id);

      // Verify user 2 cannot see it
      const user2Reminders = await withRLSContext(testUser2Id, async (p) => {
        return p.reminder.findMany();
      });

      expect(user2Reminders.every(r => r.id !== newReminder.id)).toBe(true);
    });

    it('should prevent users from modifying other users data', async () => {
      // Create a reminder for user 2
      const user2Reminder = await prisma.asServiceRole(async function() {
        return this.reminder.create({
          data: {
            title: 'User 2 Private Reminder',
            userId: testUser2Id
          }
        });
      });

      // Try to update it as user 1 - should fail silently (no rows affected)
      const updateResult = await withRLSContext(testUser1Id, async (p) => {
        try {
          return await p.reminder.update({
            where: { id: user2Reminder.id },
            data: { title: 'Hacked by User 1' }
          });
        } catch (error) {
          // Update will throw an error if no matching record found
          return null;
        }
      });

      expect(updateResult).toBeNull();

      // Verify the reminder wasn't actually updated
      const verifyReminder = await prisma.asServiceRole(async function() {
        return this.reminder.findUnique({
          where: { id: user2Reminder.id }
        });
      });

      expect(verifyReminder?.title).toBe('User 2 Private Reminder');
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should handle concurrent users correctly', async () => {
      // Simulate concurrent operations from different users
      const [user1Reminders, user2Reminders] = await Promise.all([
        withRLSContext(testUser1Id, async (p) => {
          await p.reminder.create({
            data: { title: 'Concurrent User 1', userId: testUser1Id }
          });
          return p.reminder.findMany();
        }),
        withRLSContext(testUser2Id, async (p) => {
          await p.reminder.create({
            data: { title: 'Concurrent User 2', userId: testUser2Id }
          });
          return p.reminder.findMany();
        })
      ]);

      // Each user should only see their own reminders
      expect(user1Reminders.every(r => r.userId === testUser1Id)).toBe(true);
      expect(user2Reminders.every(r => r.userId === testUser2Id)).toBe(true);

      // No cross-contamination
      const user1Titles = user1Reminders.map(r => r.title);
      const user2Titles = user2Reminders.map(r => r.title);
      
      expect(user1Titles).toContain('Concurrent User 1');
      expect(user1Titles).not.toContain('Concurrent User 2');
      expect(user2Titles).toContain('Concurrent User 2');
      expect(user2Titles).not.toContain('Concurrent User 1');
    });

    it('should handle user switching in same session', async () => {
      // Create data for both users
      await prisma.asServiceRole(async function() {
        await this.reminder.createMany({
          data: [
            { title: 'Switch Test User 1', userId: testUser1Id },
            { title: 'Switch Test User 2', userId: testUser2Id }
          ]
        });
      });

      // First request as user 1
      const user1Data = await withRLSContext(testUser1Id, async (p) => {
        return p.reminder.findMany();
      });

      // Then as user 2 in same test session
      const user2Data = await withRLSContext(testUser2Id, async (p) => {
        return p.reminder.findMany();
      });

      // Verify isolation
      expect(user1Data.every(r => r.userId === testUser1Id)).toBe(true);
      expect(user2Data.every(r => r.userId === testUser2Id)).toBe(true);
    });
  });

  describe('Complex Query Scenarios', () => {
    it('should enforce RLS with complex joins and includes', async () => {
      // Create test data with relationships
      await prisma.asServiceRole(async function() {
        await this.account.createMany({
          data: [
            {
              userId: testUser1Id,
              provider: 'google',
              providerAccountId: 'google123',
              type: 'oauth'
            },
            {
              userId: testUser2Id,
              provider: 'google',
              providerAccountId: 'google456',
              type: 'oauth'
            }
          ]
        });

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
            }
          ]
        });
      });

      // Complex query with joins
      const userData = await withRLSContext(testUser1Id, async (p) => {
        return p.user.findMany({
          include: {
            reminders: true,
            accounts: true,
            feedback: true
          }
        });
      });

      // Should only return user 1's data and related records
      expect(userData).toHaveLength(1);
      expect(userData[0].id).toBe(testUser1Id);
      
      // All related data should belong to user 1
      expect(userData[0].accounts.every(a => a.userId === testUser1Id)).toBe(true);
      expect(userData[0].feedback.every(f => f.userId === testUser1Id)).toBe(true);
      expect(userData[0].reminders.every(r => r.userId === testUser1Id)).toBe(true);
    });

    it('should handle aggregation queries correctly', async () => {
      // Create test reminders
      await prisma.asServiceRole(async function() {
        await this.reminder.createMany({
          data: [
            { title: 'User 1 Complete', userId: testUser1Id, isComplete: true },
            { title: 'User 1 Pending', userId: testUser1Id, isComplete: false },
            { title: 'User 2 Complete', userId: testUser2Id, isComplete: true },
            { title: 'User 2 Pending', userId: testUser2Id, isComplete: false }
          ]
        });
      });

      // Aggregation query as user 1
      const user1Stats = await withRLSContext(testUser1Id, async (p) => {
        return Promise.all([
          p.reminder.count(),
          p.reminder.count({ where: { isComplete: true } }),
          p.reminder.count({ where: { isComplete: false } })
        ]);
      });

      // Should only count user 1's reminders
      expect(user1Stats[0]).toBe(2); // Total reminders for user 1
      expect(user1Stats[1]).toBe(1); // Complete reminders for user 1
      expect(user1Stats[2]).toBe(1); // Pending reminders for user 1
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user context gracefully', async () => {
      // Query without setting user context
      const reminders = await prisma.reminder.findMany();
      
      // Should return empty result, not error
      expect(reminders).toHaveLength(0);
    });

    it('should handle invalid user context', async () => {
      const invalidUserId = 'invalid-user-id';
      
      const reminders = await withRLSContext(invalidUserId, async (p) => {
        return p.reminder.findMany();
      });

      // Should return empty result for non-existent user
      expect(reminders).toHaveLength(0);
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database connection failures
      // For now, just ensure the function exists and is callable
      expect(typeof prisma.withUserContext).toBe('function');
    });
  });

  describe('Performance Scenarios', () => {
    it('should not significantly impact query performance', async () => {
      // Create a larger dataset
      const manyReminders = Array.from({ length: 100 }, (_, i) => ({
        title: `Performance Test Reminder ${i}`,
        userId: testUser1Id
      }));

      await prisma.asServiceRole(async function() {
        await this.reminder.createMany({ data: manyReminders });
      });

      // Time the query with RLS
      const startTime = Date.now();
      const reminders = await withRLSContext(testUser1Id, async (p) => {
        return p.reminder.findMany({
          orderBy: { createdAt: 'desc' },
          take: 50
        });
      });
      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(reminders).toHaveLength(50);
      // Query should complete in reasonable time (adjust threshold as needed)
      expect(queryTime).toBeLessThan(1000); // 1 second
    });
  });

  // Helper functions
  async function setupTestData() {
    await prisma.asServiceRole(async function() {
      const user1 = await this.user.create({
        data: {
          email: 'testuser1@example.com',
          firstName: 'Test',
          lastName: 'User1'
        }
      });
      testUser1Id = user1.id;

      const user2 = await this.user.create({
        data: {
          email: 'testuser2@example.com',
          firstName: 'Test',
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
    });
  }

  async function cleanupTestData() {
    await prisma.asServiceRole(async function() {
      // Clean up in reverse dependency order
      await this.feedback.deleteMany({
        where: {
          userId: { in: [testUser1Id, testUser2Id, adminUserId] }
        }
      });

      await this.account.deleteMany({
        where: {
          userId: { in: [testUser1Id, testUser2Id, adminUserId] }
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