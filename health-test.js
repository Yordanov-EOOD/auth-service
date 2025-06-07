// Simple health check test
import request from 'supertest';
import express from 'express';

// Create a minimal express app for testing
const app = express();

// Add a health endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Run test
(async () => {
  try {
    console.log('Running health endpoint test...');
    const response = await request(app).get('/health');
    
    if (response.statusCode === 200 && response.text === 'OK') {
      console.log('✓ Health endpoint test passed!');
    } else {
      console.error('✗ Health endpoint test failed!');
      console.error(`  Expected status 200, got ${response.statusCode}`);
      console.error(`  Expected body 'OK', got '${response.text}'`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running test:', error);
    process.exit(1);
  }
})();
