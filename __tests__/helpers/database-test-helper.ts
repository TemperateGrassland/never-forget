// Database Test Helper
// Utilities for handling database connections in tests

import { Client } from 'pg';

export interface DatabaseTestConfig {
  hasDatabase: boolean;
  databaseUrl: string | undefined;
  skipMessage: string;
}

/**
 * Check if database is available for testing
 */
export async function checkDatabaseAvailability(): Promise<DatabaseTestConfig> {
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return {
      hasDatabase: false,
      databaseUrl: undefined,
      skipMessage: 'No database URL configured - set TEST_DATABASE_URL or DATABASE_URL to run database tests'
    };
  }

  // Try to connect to the database
  const client = new Client({ connectionString: databaseUrl });
  
  try {
    await client.connect();
    await client.query('SELECT 1'); // Simple connectivity test
    await client.end();
    
    return {
      hasDatabase: true,
      databaseUrl,
      skipMessage: ''
    };
  } catch (error) {
    return {
      hasDatabase: false,
      databaseUrl,
      skipMessage: `Database connection failed: ${error.message}. Check your DATABASE_URL or set up a test database.`
    };
  }
}

/**
 * Skip test conditionally based on database availability
 */
export function skipIfNoDatabase(testFn: () => void, config: DatabaseTestConfig) {
  if (config.hasDatabase) {
    testFn();
  } else {
    console.warn(`⚠️  Skipping database tests: ${config.skipMessage}`);
    describe.skip('Database tests (skipped - no database available)', () => {
      it('should have database connection to run these tests', () => {
        // This test will be skipped
      });
    });
  }
}

/**
 * Create a test database client with proper error handling
 */
export async function createTestDatabaseClient(): Promise<Client | null> {
  const config = await checkDatabaseAvailability();
  
  if (!config.hasDatabase) {
    console.warn(`⚠️  Cannot create database client: ${config.skipMessage}`);
    return null;
  }

  const client = new Client({ connectionString: config.databaseUrl });
  await client.connect();
  return client;
}

/**
 * Wrapper for database-dependent tests
 */
export function withDatabase(testName: string, testFn: (client: Client) => Promise<void>) {
  return async () => {
    const client = await createTestDatabaseClient();
    
    if (!client) {
      console.warn(`⚠️  Skipping test "${testName}" - no database available`);
      return;
    }

    try {
      await testFn(client);
    } finally {
      await client.end();
    }
  };
}

/**
 * Check if RLS is properly set up in the database
 */
export async function checkRLSSetup(client: Client): Promise<boolean> {
  try {
    // Check if RLS tables exist
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('User', 'Reminder', 'Account', 'Session', 'Feedback', 'FlowResponse')
    `);
    
    if (result.rows.length === 0) {
      return false;
    }

    // Check if RLS helper functions exist
    const functionsResult = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname IN ('current_app_user_id', 'is_admin_user')
    `);
    
    return functionsResult.rows.length >= 2;
  } catch (error) {
    return false;
  }
}