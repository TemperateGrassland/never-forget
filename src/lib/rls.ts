import { PrismaClient } from '@prisma/client';

// Extended Prisma client with RLS support
export class RLSPrismaClient extends PrismaClient {
  /**
   * Set the current user context for RLS policies
   * This must be called before any database operations that need user isolation
   */
  async setUserContext(userId: string): Promise<void> {
    await this.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
  }

  /**
   * Set admin emails for admin privilege checks
   * Should be called during application startup
   */
  async setAdminContext(adminEmails: string): Promise<void> {
    await this.$executeRaw`SELECT set_config('app.admin_emails', ${adminEmails}, true)`;
  }

  /**
   * Clear user context (useful for service operations)
   */
  async clearUserContext(): Promise<void> {
    await this.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
  }

  /**
   * Execute a query with user context automatically set
   * Ensures RLS policies are applied correctly
   */
  async withUserContext<T>(userId: string, operation: (prisma: RLSPrismaClient) => Promise<T>): Promise<T> {
    await this.setUserContext(userId);
    try {
      return await operation(this);
    } finally {
      // Note: Context is session-scoped, so it will be cleared automatically
      // when the connection is returned to the pool
    }
  }

  /**
   * Execute a query as service role (bypasses RLS)
   * Use sparingly and only for system operations
   */
  async asServiceRole<T>(operation: (this: RLSPrismaClient) => Promise<T>): Promise<T> {
    // Create a new client connection with service role
    const serviceClient = new RLSPrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL + "?options=-c%20role%3Dservice_role"
        }
      }
    });

    try {
      await serviceClient.$connect();
      return await operation.call(serviceClient);
    } finally {
      await serviceClient.$disconnect();
    }
  }

  /**
   * Test RLS policies for a specific user
   * Useful for debugging and validation
   */
  async testRLSPolicies(userId: string, adminEmail?: string) {
    const query = adminEmail
      ? this.$queryRaw`SELECT * FROM test_rls_policies(${userId}, ${adminEmail})`
      : this.$queryRaw`SELECT * FROM test_rls_policies(${userId})`;
    
    return await query;
  }
}

// Singleton instance
let rlsPrismaInstance: RLSPrismaClient;

export function getRLSPrismaClient(): RLSPrismaClient {
  if (!rlsPrismaInstance) {
    rlsPrismaInstance = new RLSPrismaClient();
    
    // Set admin context during initialization
    const adminEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
    if (adminEmails) {
      rlsPrismaInstance.setAdminContext(adminEmails).catch(console.error);
    }
  }
  return rlsPrismaInstance;
}

/**
 * Middleware to automatically set user context from session
 * Use this in your API routes
 */
export async function withRLSContext<T>(
  userId: string | undefined,
  operation: (prisma: RLSPrismaClient) => Promise<T>
): Promise<T> {
  const prisma = getRLSPrismaClient();
  
  if (!userId) {
    // No user context - this will only return public data or fail for protected resources
    return await operation(prisma);
  }

  return await prisma.withUserContext(userId, operation);
}

/**
 * Helper to get user ID from NextAuth session
 */
export function getUserIdFromSession(session: { user?: { id?: string } } | null | undefined): string | undefined {
  return session?.user?.id;
}

// Types for RLS test results
export interface RLSTestResult {
  table_name: string;
  policy_name: string;
  can_access: boolean;
  row_count: bigint;
}

/**
 * Utility to check if current environment supports RLS
 */
export function isRLSEnabled(): boolean {
  return process.env.ENABLE_RLS === 'true' || process.env.NODE_ENV === 'production';
}

/**
 * Conditional RLS wrapper - only applies RLS in production or when explicitly enabled
 */
export async function conditionalRLS<T>(
  userId: string | undefined,
  operation: (prisma: RLSPrismaClient) => Promise<T>,
  fallbackPrisma?: PrismaClient
): Promise<T> {
  if (isRLSEnabled()) {
    return withRLSContext(userId, operation);
  } else {
    // In development, use regular Prisma client
    const prisma = (fallbackPrisma as unknown as RLSPrismaClient) || getRLSPrismaClient();
    return await operation(prisma);
  }
}