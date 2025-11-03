#!/usr/bin/env node

/**
 * RLS Test Runner
 * Provides guidance on database setup and runs RLS tests appropriately
 */

const { execSync } = require('child_process');
const { Client } = require('pg');

async function checkDatabaseConnection() {
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return {
      available: false,
      message: 'No database URL configured'
    };
  }

  const client = new Client({ connectionString: databaseUrl });
  
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return {
      available: true,
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      available: false,
      message: `Database connection failed: ${error.message}`
    };
  }
}

async function main() {
  console.log('🔍 Checking database availability for RLS tests...\n');
  
  const dbStatus = await checkDatabaseConnection();
  
  if (dbStatus.available) {
    console.log('✅ Database available:', dbStatus.message);
    console.log('🧪 Running full RLS test suite...\n');
    
    try {
      execSync('npm test __tests__/rls/', { 
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' }
      });
    } catch (error) {
      console.error('\n❌ Some tests failed. This might be expected if:');
      console.error('   - RLS policies are not set up in the database');
      console.error('   - Test data conflicts with existing data');
      console.error('   - Database permissions are not configured correctly\n');
      process.exit(1);
    }
  } else {
    console.log('⚠️  Database not available:', dbStatus.message);
    console.log('\n📋 To run RLS tests with a database:');
    console.log('   1. Set up a PostgreSQL test database');
    console.log('   2. Run the RLS migration: npx prisma migrate deploy');
    console.log('   3. Set TEST_DATABASE_URL environment variable');
    console.log('   4. Re-run this script\n');
    
    console.log('🧪 Running non-database RLS tests only...\n');
    
    try {
      // Run only configuration and unit tests that don't require database
      execSync('npm test -- --testNamePattern="Configuration|should validate" --testPathPattern="rls"', { 
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' }
      });
      
      console.log('\n✅ Configuration tests passed!');
      console.log('💡 Set up a test database to run full RLS validation tests.');
    } catch (error) {
      console.error('\n❌ Configuration tests failed');
      process.exit(1);
    }
  }
}

main().catch(console.error);