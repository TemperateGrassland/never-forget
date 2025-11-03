#!/usr/bin/env node

/**
 * Test RLS with Existing Database
 * Runs RLS tests using your existing database URL from .env
 * Includes proper cleanup to avoid conflicts
 */

const { execSync } = require('child_process');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env file
function getDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  
  if (!match) {
    throw new Error('DATABASE_URL not found in .env file');
  }

  return match[1].replace(/^["']|["']$/g, ''); // Remove quotes if present
}

async function cleanupTestData(databaseUrl) {
  console.log('🧹 Cleaning up any existing test data...');
  
  const client = new Client({ connectionString: databaseUrl });
  
  try {
    await client.connect();
    
    // Clean up test users and related data
    await client.query(`
      DELETE FROM "Reminder" WHERE "userId" IN (
        SELECT id FROM "User" WHERE email LIKE '%rlstest%' OR email LIKE '%@test.com'
      )
    `);
    
    await client.query(`
      DELETE FROM "Account" WHERE "userId" IN (
        SELECT id FROM "User" WHERE email LIKE '%rlstest%' OR email LIKE '%@test.com'
      )
    `);
    
    await client.query(`
      DELETE FROM "Feedback" WHERE "userId" IN (
        SELECT id FROM "User" WHERE email LIKE '%rlstest%' OR email LIKE '%@test.com'
      )
    `);
    
    await client.query(`
      DELETE FROM "User" WHERE email LIKE '%rlstest%' OR email LIKE '%@test.com'
    `);
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️  Cleanup warning:', error.message);
  } finally {
    await client.end();
  }
}

async function checkRLSSetup(databaseUrl) {
  console.log('🔍 Checking RLS setup in database...');
  
  const client = new Client({ connectionString: databaseUrl });
  
  try {
    await client.connect();
    
    // Check if main tables exist
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('User', 'Reminder', 'Account', 'Session', 'Feedback')
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found - run: npx prisma migrate deploy');
      return false;
    }
    
    // Check if RLS helper functions exist
    const functionsResult = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname IN ('current_app_user_id', 'is_admin_user')
    `);
    
    if (functionsResult.rows.length < 2) {
      console.log('⚠️  RLS helper functions not found - RLS migration may not be applied');
      console.log('   Run the RLS migration from sql/enable-rls.sql');
      return false;
    }
    
    console.log('✅ RLS setup appears to be configured');
    return true;
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🧪 RLS Testing with Existing Database\n');
  
  try {
    // Get database URL
    const databaseUrl = getDatabaseUrl();
    console.log('📊 Using database from .env file');
    
    // Check RLS setup
    const rlsReady = await checkRLSSetup(databaseUrl);
    
    if (!rlsReady) {
      console.log('\n📋 To set up RLS:');
      console.log('   1. Run: npx prisma migrate deploy');
      console.log('   2. Apply RLS policies from sql/enable-rls.sql');
      console.log('   3. Re-run this script\n');
      
      console.log('🧪 Running configuration tests only...\n');
      execSync('npm test -- --testNamePattern="Configuration|should validate" --testPathPattern="rls"', { 
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' }
      });
      return;
    }
    
    // Clean up existing test data
    await cleanupTestData(databaseUrl);
    
    // Run RLS tests
    console.log('🧪 Running RLS tests with your database...\n');
    console.log('⚠️  Note: This will create temporary test data that will be cleaned up');
    
    execSync('npm test __tests__/rls/', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        TEST_DATABASE_URL: databaseUrl,
        FORCE_COLOR: '1' 
      }
    });
    
    // Final cleanup
    await cleanupTestData(databaseUrl);
    console.log('\n✅ RLS testing completed!');
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    
    if (error.message.includes('.env file not found')) {
      console.log('💡 Make sure you have a .env file with DATABASE_URL configured');
    } else if (error.message.includes('DATABASE_URL not found')) {
      console.log('💡 Add DATABASE_URL to your .env file');
    }
    
    process.exit(1);
  }
}

main().catch(console.error);