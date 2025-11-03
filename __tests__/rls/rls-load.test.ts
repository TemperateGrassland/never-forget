// RLS Load Testing
// Tests to verify RLS performance under high load conditions

// Jest globals are available without imports
import { RLSPrismaClient, getRLSPrismaClient, withRLSContext } from '../../src/lib/rls';

interface LoadTestMetrics {
  operation: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

describe('RLS Load Testing', () => {
  let prisma: RLSPrismaClient;
  let loadTestUsers: string[] = [];
  let adminUserId: string;

  beforeAll(async () => {
    process.env.ENABLE_RLS = 'true';
    process.env.ADMIN_EMAILS = 'loadtestadmin@example.com';
    
    prisma = getRLSPrismaClient();
    await prisma.$connect();
    
    await setupLoadTestData();
  });

  afterAll(async () => {
    await cleanupLoadTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.clearUserContext();
  });

  describe('High Concurrency Tests', () => {
    it('should handle 100 concurrent read operations', async () => {
      const concurrentRequests = 100;
      const startTime = Date.now();
      const promises: Promise<any>[] = [];
      const responseTimes: number[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const userId = loadTestUsers[i % loadTestUsers.length];
        
        promises.push(
          (async () => {
            const requestStart = Date.now();
            try {
              const result = await withRLSContext(userId, async (p) => {
                return p.reminder.findMany({
                  take: 10,
                  orderBy: { createdAt: 'desc' }
                });
              });
              const requestEnd = Date.now();
              responseTimes.push(requestEnd - requestStart);
              return { success: true, result, userId };
            } catch (error) {
              const requestEnd = Date.now();
              responseTimes.push(requestEnd - requestStart);
              return { success: false, error, userId };
            }
          })()
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Analyze results
      const successfulRequests = results.filter(r => r.success).length;
      const failedRequests = results.filter(r => !r.success).length;
      
      const metrics = calculateMetrics('concurrent_reads', {
        totalRequests: concurrentRequests,
        successfulRequests,
        failedRequests,
        responseTimes,
        totalTime
      });

      // Assertions
      expect(successfulRequests).toBeGreaterThan(concurrentRequests * 0.95); // 95% success rate
      expect(metrics.averageResponseTime).toBeLessThan(500); // Average < 500ms
      expect(metrics.p95ResponseTime).toBeLessThan(1000); // 95th percentile < 1s
      expect(metrics.requestsPerSecond).toBeGreaterThan(50); // At least 50 RPS

      // Verify data isolation
      results.filter(r => r.success).forEach(result => {
        expect(result.result.every((reminder: any) => reminder.userId === result.userId)).toBe(true);
      });

      logMetrics(metrics);
    });

    it('should handle 50 concurrent write operations', async () => {
      const concurrentWrites = 50;
      const startTime = Date.now();
      const promises: Promise<any>[] = [];
      const responseTimes: number[] = [];

      for (let i = 0; i < concurrentWrites; i++) {
        const userId = loadTestUsers[i % loadTestUsers.length];
        
        promises.push(
          (async () => {
            const requestStart = Date.now();
            try {
              const result = await withRLSContext(userId, async (p) => {
                return p.reminder.create({
                  data: {
                    title: `Load Test Reminder ${i} - Created during concurrent write test ${Date.now()}`,
                    userId: userId
                  }
                });
              });
              const requestEnd = Date.now();
              responseTimes.push(requestEnd - requestStart);
              return { success: true, result, userId };
            } catch (error) {
              const requestEnd = Date.now();
              responseTimes.push(requestEnd - requestStart);
              return { success: false, error, userId };
            }
          })()
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulRequests = results.filter(r => r.success).length;
      const failedRequests = results.filter(r => !r.success).length;
      
      const metrics = calculateMetrics('concurrent_writes', {
        totalRequests: concurrentWrites,
        successfulRequests,
        failedRequests,
        responseTimes,
        totalTime
      });

      // Assertions for writes (more lenient than reads)
      expect(successfulRequests).toBeGreaterThan(concurrentWrites * 0.90); // 90% success rate
      expect(metrics.averageResponseTime).toBeLessThan(1000); // Average < 1s
      expect(metrics.p95ResponseTime).toBeLessThan(2000); // 95th percentile < 2s

      // Verify each reminder was created for correct user
      results.filter(r => r.success).forEach(result => {
        expect(result.result.userId).toBe(result.userId);
      });

      logMetrics(metrics);
    });

    it('should handle mixed read/write operations under load', async () => {
      const totalOperations = 200;
      const writeRatio = 0.3; // 30% writes, 70% reads
      const startTime = Date.now();
      const promises: Promise<any>[] = [];
      const responseTimes: number[] = [];

      for (let i = 0; i < totalOperations; i++) {
        const userId = loadTestUsers[i % loadTestUsers.length];
        const isWrite = Math.random() < writeRatio;
        
        promises.push(
          (async () => {
            const requestStart = Date.now();
            try {
              let result;
              if (isWrite) {
                result = await withRLSContext(userId, async (p) => {
                  return p.reminder.create({
                    data: {
                      title: `Mixed Load Test ${i}`,
                      userId: userId
                    }
                  });
                });
              } else {
                result = await withRLSContext(userId, async (p) => {
                  return p.reminder.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                  });
                });
              }
              const requestEnd = Date.now();
              responseTimes.push(requestEnd - requestStart);
              return { success: true, result, userId, operation: isWrite ? 'write' : 'read' };
            } catch (error) {
              const requestEnd = Date.now();
              responseTimes.push(requestEnd - requestStart);
              return { success: false, error, userId, operation: isWrite ? 'write' : 'read' };
            }
          })()
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulRequests = results.filter(r => r.success).length;
      const failedRequests = results.filter(r => !r.success).length;
      
      const metrics = calculateMetrics('mixed_operations', {
        totalRequests: totalOperations,
        successfulRequests,
        failedRequests,
        responseTimes,
        totalTime
      });

      // Assertions
      expect(successfulRequests).toBeGreaterThan(totalOperations * 0.92); // 92% success rate
      expect(metrics.averageResponseTime).toBeLessThan(750); // Average < 750ms
      expect(metrics.requestsPerSecond).toBeGreaterThan(100); // At least 100 RPS

      logMetrics(metrics);
    });
  });

  describe('Sustained Load Tests', () => {
    it('should maintain performance over sustained period', async () => {
      const duration = 30000; // 30 seconds
      const requestsPerSecond = 10;
      const interval = 1000 / requestsPerSecond;
      
      const startTime = Date.now();
      const results: any[] = [];
      const responseTimes: number[] = [];
      let requestCount = 0;

      const makeRequest = async (): Promise<void> => {
        const userId = loadTestUsers[requestCount % loadTestUsers.length];
        const requestStart = Date.now();
        
        try {
          const result = await withRLSContext(userId, async (p) => {
            return p.reminder.count();
          });
          const requestEnd = Date.now();
          responseTimes.push(requestEnd - requestStart);
          results.push({ success: true, result, userId, timestamp: requestEnd });
        } catch (error) {
          const requestEnd = Date.now();
          responseTimes.push(requestEnd - requestStart);
          results.push({ success: false, error, userId, timestamp: requestEnd });
        }
        
        requestCount++;
      };

      // Run sustained load
      const intervalId = setInterval(makeRequest, interval);
      
      await new Promise(resolve => setTimeout(resolve, duration));
      clearInterval(intervalId);
      
      // Wait for any pending requests
      await new Promise(resolve => setTimeout(resolve, 1000));

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const successfulRequests = results.filter(r => r.success).length;
      
      const metrics = calculateMetrics('sustained_load', {
        totalRequests: results.length,
        successfulRequests,
        failedRequests: results.length - successfulRequests,
        responseTimes,
        totalTime
      });

      // Check for performance degradation over time
      const firstHalf = responseTimes.slice(0, Math.floor(responseTimes.length / 2));
      const secondHalf = responseTimes.slice(Math.floor(responseTimes.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      // Performance shouldn't degrade by more than 50%
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
      
      // Overall performance requirements
      expect(metrics.errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(metrics.averageResponseTime).toBeLessThan(300); // Average < 300ms
      
      logMetrics(metrics);
    });
  });

  describe('Database Connection Pool Stress', () => {
    it('should handle connection pool exhaustion gracefully', async () => {
      const totalConnections = 100; // More than typical pool size
      const promises: Promise<any>[] = [];
      const responseTimes: number[] = [];

      for (let i = 0; i < totalConnections; i++) {
        const userId = loadTestUsers[i % loadTestUsers.length];
        
        promises.push(
          (async () => {
            const requestStart = Date.now();
            try {
              // Hold connection for a bit to stress the pool
              const result = await withRLSContext(userId, async (p) => {
                await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
                return p.reminder.findFirst();
              });
              const requestEnd = Date.now();
              responseTimes.push(requestEnd - requestStart);
              return { success: true, result, userId };
            } catch (error) {
              const requestEnd = Date.now();
              responseTimes.push(requestEnd - requestStart);
              return { success: false, error, userId };
            }
          })()
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulRequests = results.filter(r => r.success).length;
      const failedRequests = results.filter(r => !r.success).length;
      
      const metrics = calculateMetrics('connection_pool_stress', {
        totalRequests: totalConnections,
        successfulRequests,
        failedRequests,
        responseTimes,
        totalTime
      });

      // Should handle connection pressure gracefully
      expect(successfulRequests).toBeGreaterThan(totalConnections * 0.85); // 85% success rate
      expect(metrics.errorRate).toBeLessThan(0.15); // Less than 15% error rate
      
      logMetrics(metrics);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not cause memory leaks under load', async () => {
      const initialMemory = process.memoryUsage();
      const operations = 500;
      
      for (let i = 0; i < operations; i++) {
        const userId = loadTestUsers[i % loadTestUsers.length];
        
        await withRLSContext(userId, async (p) => {
          await p.reminder.findMany({ take: 5 });
        });
        
        // Force garbage collection periodically
        if (i % 100 === 0 && global.gc) {
          global.gc();
        }
      }

      // Force final garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      
      // Memory shouldn't increase by more than 100MB
      const heapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(heapIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
    });
  });

  describe('Error Recovery', () => {
    it('should recover from database errors gracefully', async () => {
      const operations = 100;
      const results: any[] = [];
      
      for (let i = 0; i < operations; i++) {
        const userId = loadTestUsers[i % loadTestUsers.length];
        
        try {
          // Occasionally inject a bad query to test error handling
          if (i % 20 === 0) {
            await withRLSContext(userId, async (p) => {
              // This should cause an error
              return p.$queryRaw`SELECT * FROM "NonExistentTable"`;
            });
          } else {
            const result = await withRLSContext(userId, async (p) => {
              return p.reminder.findMany({ take: 1 });
            });
            results.push({ success: true, result });
          }
        } catch (error) {
          results.push({ success: false, error });
        }
      }

      const successfulRequests = results.filter(r => r.success).length;
      const expectedSuccessful = operations - Math.floor(operations / 20);
      
      // Should recover and continue processing after errors
      expect(successfulRequests).toBeGreaterThanOrEqual(expectedSuccessful * 0.95);
    });
  });

  // Helper functions
  function calculateMetrics(operation: string, data: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    responseTimes: number[];
    totalTime: number;
  }): LoadTestMetrics {
    const sortedTimes = data.responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    return {
      operation,
      totalRequests: data.totalRequests,
      successfulRequests: data.successfulRequests,
      failedRequests: data.failedRequests,
      averageResponseTime: data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length,
      minResponseTime: Math.min(...data.responseTimes),
      maxResponseTime: Math.max(...data.responseTimes),
      p95ResponseTime: sortedTimes[p95Index] || 0,
      p99ResponseTime: sortedTimes[p99Index] || 0,
      requestsPerSecond: (data.successfulRequests / data.totalTime) * 1000,
      errorRate: data.failedRequests / data.totalRequests
    };
  }

  function logMetrics(metrics: LoadTestMetrics): void {
    console.log(`\n=== Load Test Metrics: ${metrics.operation} ===`);
    console.log(`Total Requests: ${metrics.totalRequests}`);
    console.log(`Successful: ${metrics.successfulRequests} (${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${metrics.failedRequests} (${(metrics.errorRate * 100).toFixed(1)}%)`);
    console.log(`Average Response Time: ${metrics.averageResponseTime.toFixed(1)}ms`);
    console.log(`95th Percentile: ${metrics.p95ResponseTime.toFixed(1)}ms`);
    console.log(`99th Percentile: ${metrics.p99ResponseTime.toFixed(1)}ms`);
    console.log(`Requests/Second: ${metrics.requestsPerSecond.toFixed(1)}`);
    console.log(`Min/Max Response Time: ${metrics.minResponseTime}ms / ${metrics.maxResponseTime}ms`);
    console.log('=====================================\n');
  }

  async function setupLoadTestData() {
    await prisma.asServiceRole(async function() {
      // Create 20 test users for load testing
      const userPromises = [];
      for (let i = 1; i <= 20; i++) {
        userPromises.push(
          this.user.create({
            data: {
              email: `loaduser${i}@example.com`,
              firstName: 'Load',
              lastName: `User${i}`
            }
          })
        );
      }

      const users = await Promise.all(userPromises);
      loadTestUsers = users.map(u => u.id);

      // Create admin user
      const adminUser = await this.user.create({
        data: {
          email: 'loadtestadmin@example.com',
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      adminUserId = adminUser.id;

      // Create initial reminders for each user
      const reminderPromises = [];
      for (const userId of loadTestUsers) {
        for (let i = 0; i < 10; i++) {
          reminderPromises.push(
            this.reminder.create({
              data: {
                title: `Initial Reminder ${i} for ${userId} - Load test reminder ${i}`,
                userId: userId,
                isComplete: i % 3 === 0
              }
            })
          );
        }
      }

      await Promise.all(reminderPromises);

      // Create some feedback and accounts for more realistic load
      const miscPromises = [];
      for (const userId of loadTestUsers) {
        miscPromises.push(
          this.account.create({
            data: {
              userId: userId,
              provider: 'test',
              providerAccountId: `test_${userId}`,
              type: 'oauth'
            }
          })
        );

        miscPromises.push(
          this.feedback.create({
            data: {
              type: 'COMPLEMENT',
              message: `Load test feedback from ${userId}`,
              userId: userId
            }
          })
        );
      }

      await Promise.all(miscPromises);
    });
  }

  async function cleanupLoadTestData() {
    await prisma.asServiceRole(async function() {
      const allUserIds = [...loadTestUsers, adminUserId];

      // Clean up in dependency order
      await this.feedback.deleteMany({
        where: { userId: { in: allUserIds } }
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