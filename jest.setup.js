// Jest setup file to configure test environment
process.env.ENABLE_RLS = 'true';
process.env.ADMIN_EMAILS = 'admin@test.com,charlie06allen@gmail.com';

// Use test database URL if available, otherwise use main DATABASE_URL for local testing
// For CI/CD, set TEST_DATABASE_URL to a test database or leave empty to skip DB tests
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// Extend Jest matchers
import '@testing-library/jest-dom';