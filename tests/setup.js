// Test setup file to prepare the environment for tests
import dotenv from 'dotenv';

// Set environment for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';

// Load test environment variables if they exist
try {
  dotenv.config({ path: '.env.test' });
} catch (error) {
  console.log('No .env.test file found, using default test values');
}

// Store original console.log for restoration if needed
const originalConsoleLog = console.log;

// Add any global test setup here
beforeAll(async () => {
  console.log('Starting test setup...');
});

// Clean up after all tests
afterAll(async () => {
  console.log('Cleaning up after tests...');
});