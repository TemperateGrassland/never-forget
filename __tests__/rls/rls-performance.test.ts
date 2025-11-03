// RLS Performance Tests
// Tests to ensure RLS implementation doesn't significantly impact performance

// Jest globals are available without imports
import { RLSPrismaClient, getRLSPrismaClient, withRLSContext } from '../../src/lib/rls';

describe('RLS Performance Tests', () => {
  let prisma: RLSPrismaClient;
  let testUser1Id: string;
  let testUser2Id: string;
  let performanceDataUsers: string[] = [];

  beforeAll(async () => {
    process.env.ENABLE_RLS = 'true';
    
    prisma = getRLSPrismaClient();
    await prisma.$connect();
    
    await setupPerformanceTestData();
  });

  afterAll(async () => {
    await cleanupPerformanceTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.clearUserContext();
  });

  describe('Query Performance Impact', () => {
    it('should not significantly slow down simple queries', async () => {
      // Baseline: Query without RLS context (should return empty)
      const startBaseline = Date.now();
      const baselineResults = await prisma.reminder.findMany({ take: 10 });
      const baselineTime = Date.now() - startBaseline;

      // RLS query
      const startRLS = Date.now();
      const rlsResults = await withRLSContext(testUser1Id, async (p) => {
        return p.reminder.findMany({ take: 10 });
      });
      const rlsTime = Date.now() - startRLS;

      // RLS should not add more than 50ms overhead for simple queries
      expect(rlsTime - baselineTime).toBeLessThan(50);
      expect(rlsResults.length).toBeGreaterThan(0);
      expect(baselineResults.length).toBe(0); // No context = no results
    });

    it('should handle pagination efficiently with RLS', async () => {
      const pageSize = 20;
      const pages = 5;
      const times: number[] = [];

      for (let page = 0; page < pages; page++) {
        const start = Date.now();
        
        const results = await withRLSContext(testUser1Id, async (p) => {
          return p.reminder.findMany({
            skip: page * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' }
          });
        });
        
        const end = Date.now();
        times.push(end - start);
        
        // Each page should return some results
        expect(results.length).toBeGreaterThan(0);
      }

      // Performance should be consistent across pages
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      // Max time shouldn't be more than 2x average (indicates performance degradation)
      expect(maxTime).toBeLessThan(avgTime * 2);
      
      // All queries should complete within reasonable time
      times.forEach(time => {
        expect(time).toBeLessThan(200); // 200ms max per page
      });
    });

    it('should handle complex joins efficiently', async () => {
      const start = Date.now();
      
      const results = await withRLSContext(testUser1Id, async (p) => {
        return p.user.findMany({
          include: {
            reminders: {
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            accounts: true,
            feedback: true
          }
        });
      });
      
      const end = Date.now();
      const queryTime = end - start;

      expect(results.length).toBe(1); // Only current user
      expect(queryTime).toBeLessThan(300); // Complex join should complete in <300ms
    });

    it('should handle aggregation queries efficiently', async () => {
      const start = Date.now();
      
      const [totalCount, completedCount, pendingCount] = await withRLSContext(testUser1Id, async (p) => {
        return Promise.all([
          p.reminder.count(),
          p.reminder.count({ where: { isComplete: true } }),
          p.reminder.count({ where: { isComplete: false } })
        ]);
      });
      
      const end = Date.now();
      const queryTime = end - start;

      expect(totalCount).toBeGreaterThan(0);
      expect(totalCount).toBe(completedCount + pendingCount);
      expect(queryTime).toBeLessThan(150); // Aggregation should be fast
    });
  });

  describe('Concurrent User Performance', () => {
    it('should handle multiple concurrent users efficiently', async () => {
      const userIds = performanceDataUsers.slice(0, 10); // Test with 10 concurrent users
      const start = Date.now();

      // Simulate concurrent requests from different users
      const promises = userIds.map(userId => 
        withRLSContext(userId, async (p) => {
          return p.reminder.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' }
          });
        })
      );

      const results = await Promise.all(promises);
      const end = Date.now();
      const totalTime = end - start;

      // All users should get their own data
      expect(results.length).toBe(userIds.length);
      results.forEach((userResults, index) => {
        expect(userResults.length).toBeGreaterThan(0);
        expect(userResults.every(r => r.userId === userIds[index])).toBe(true);
      });

      // Concurrent execution should complete in reasonable time
      expect(totalTime).toBeLessThan(1000); // 1 second for 10 concurrent users
    });

    it('should handle user context switching efficiently', async () => {
      const switchTimes: number[] = [];
      const userIds = performanceDataUsers.slice(0, 5);

      for (let i = 0; i < userIds.length; i++) {
        const start = Date.now();
        
        // Switch user context and query
        const results = await withRLSContext(userIds[i], async (p) => {
          return p.reminder.findMany({ take: 5 });
        });
        
        const end = Date.now();
        switchTimes.push(end - start);
        
        expect(results.every(r => r.userId === userIds[i])).toBe(true);
      }

      // Context switching should be consistent and fast
      const avgSwitchTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length;
      expect(avgSwitchTime).toBeLessThan(100); // Average <100ms per switch
      
      switchTimes.forEach(time => {
        expect(time).toBeLessThan(200); // Max 200ms per switch
      });
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle users with many reminders efficiently', async () => {
      // Find user with most reminders for testing
      const userWithMostReminders = await prisma.asServiceRole(async function() {
        const userCounts = await this.$queryRaw<{ userId: string; count: bigint }[]>`
          SELECT "userId", COUNT(*) as count 
          FROM "Reminder" 
          GROUP BY "userId" 
          ORDER BY count DESC 
          LIMIT 1
        `;
        return userCounts[0]?.userId;
      });

      if (!userWithMostReminders) {
        // Create a user with many reminders for testing
        const manyReminders = Array.from({ length: 500 }, (_, i) => ({
          title: `Performance Test Reminder ${i}`,
          userId: testUser1Id
        }));

        await prisma.asServiceRole(async function() {
          await this.reminder.createMany({ data: manyReminders });
        });
      }

      const userId = userWithMostReminders || testUser1Id;
      const start = Date.now();

      const results = await withRLSContext(userId, async (p) => {
        return p.reminder.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100 // Get first 100 reminders
        });
      });

      const end = Date.now();
      const queryTime = end - start;

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.userId === userId)).toBe(true);
      
      // Should handle large datasets efficiently
      expect(queryTime).toBeLessThan(500); // 500ms max for large dataset
    });

    it('should handle complex search queries efficiently', async () => {
      const searchTerms = ['test', 'reminder', 'important', 'daily'];
      const searchTimes: number[] = [];

      for (const term of searchTerms) {
        const start = Date.now();
        
        const results = await withRLSContext(testUser1Id, async (p) => {
          return p.reminder.findMany({
            where: {
              title: { contains: term, mode: 'insensitive' }
            },
            take: 50
          });
        });
        
        const end = Date.now();
        searchTimes.push(end - start);
        
        expect(results.every(r => r.userId === testUser1Id)).toBe(true);
      }

      // Search queries should be reasonably fast
      const avgSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      expect(avgSearchTime).toBeLessThan(200); // Average <200ms per search
    });
  });

  describe('Connection Pool Performance', () => {
    it('should not exhaust connection pool with RLS', async () => {
      // Simulate many quick requests
      const promises = Array.from({ length: 50 }, (_, i) => 
        withRLSContext(testUser1Id, async (p) => {
          return p.reminder.count();
        })
      );

      const start = Date.now();
      const results = await Promise.all(promises);
      const end = Date.now();
      const totalTime = end - start;

      // All requests should succeed
      expect(results.length).toBe(50);
      results.forEach(count => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });

      // Should handle many concurrent connections
      expect(totalTime).toBeLessThan(2000); // 2 seconds for 50 concurrent requests
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with repeated context switches', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations with context switches
      for (let i = 0; i < 100; i++) {
        const userId = performanceDataUsers[i % performanceDataUsers.length];
        await withRLSContext(userId, async (p) => {
          return p.reminder.findFirst();
        });
      }

      const finalMemory = process.memoryUsage();
      
      // Memory usage shouldn't increase dramatically
      const heapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const heapIncreasePercent = (heapIncrease / initialMemory.heapUsed) * 100;
      
      // Heap should not increase by more than 50% during the test
      expect(heapIncreasePercent).toBeLessThan(50);
    });
  });

  // Helper functions
  async function setupPerformanceTestData() {
    await prisma.asServiceRole(async function() {
      // Create test users
      const user1 = await this.user.create({
        data: {
          email: 'perfuser1@example.com',
          firstName: 'Performance',
          lastName: 'User1'
        }
      });
      testUser1Id = user1.id;
      performanceDataUsers.push(user1.id);

      const user2 = await this.user.create({
        data: {
          email: 'perfuser2@example.com',
          firstName: 'Performance',
          lastName: 'User2'
        }
      });
      testUser2Id = user2.id;
      performanceDataUsers.push(user2.id);

      // Create additional users for concurrent testing
      for (let i = 3; i <= 20; i++) {
        const user = await this.user.create({
          data: {
            email: `perfuser${i}@example.com`,
            firstName: 'Performance',
            lastName: `User${i}`
          }
        });
        performanceDataUsers.push(user.id);
      }

      // Create reminders for each user
      for (const userId of performanceDataUsers) {
        const reminders = Array.from({ length: 50 }, (_, i) => ({
          title: `Performance Reminder ${i} for ${userId} - Test reminder ${i} created for performance testing`,
          userId: userId,
          isComplete: i % 3 === 0 // Some completed, some not
        }));

        await this.reminder.createMany({ data: reminders });
      }

      // Create accounts and feedback for testing joins
      for (const userId of performanceDataUsers) {
        await this.account.create({
          data: {
            userId: userId,
            provider: 'test',
            providerAccountId: `test_${userId}`,
            type: 'oauth'
          }
        });

        await this.feedback.create({
          data: {
            type: 'COMPLEMENT',
            message: `Performance test feedback from ${userId}`,
            userId: userId
          }
        });
      }
    });
  }

  async function cleanupPerformanceTestData() {
    await prisma.asServiceRole(async function() {
      // Clean up in reverse dependency order
      await this.feedback.deleteMany({
        where: {
          userId: { in: performanceDataUsers }
        }
      });

      await this.account.deleteMany({
        where: {
          userId: { in: performanceDataUsers }
        }
      });

      await this.reminder.deleteMany({
        where: {
          userId: { in: performanceDataUsers }
        }
      });

      await this.user.deleteMany({
        where: {
          id: { in: performanceDataUsers }
        }
      });
    });
  }
});