// Simple auth endpoint test
import request from 'supertest';
import express from 'express';
import bodyParser from 'express';

// Create a minimal express app for testing
const app = express();
app.use(express.json());

// Add a mock auth endpoint
app.post('/auth', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  // Simulate authentication
  if (email === 'test@example.com' && password === 'testpassword') {
    return res.status(200).json({ 
      accessToken: 'mock-token',
      message: 'Authentication successful'
    });
  }
  
  return res.status(401).json({ message: 'Invalid credentials' });
});

// Run test
(async () => {
  try {
    console.log('Running auth endpoint tests...');
    
    // Test successful login
    const successResponse = await request(app)
      .post('/auth')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      });
    
    if (successResponse.statusCode === 200 && successResponse.body.accessToken === 'mock-token') {
      console.log('✓ Successful login test passed!');
    } else {
      console.error('✗ Successful login test failed!');
      console.error(`  Expected status 200, got ${successResponse.statusCode}`);
      console.error(`  Expected accessToken 'mock-token', got '${successResponse.body.accessToken}'`);
      process.exit(1);
    }
    
    // Test failed login
    const failResponse = await request(app)
      .post('/auth')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    
    if (failResponse.statusCode === 401) {
      console.log('✓ Failed login test passed!');
    } else {
      console.error('✗ Failed login test failed!');
      console.error(`  Expected status 401, got ${failResponse.statusCode}`);
      process.exit(1);
    }
    
    // Test missing credentials
    const missingResponse = await request(app)
      .post('/auth')
      .send({
        email: 'test@example.com'
      });
    
    if (missingResponse.statusCode === 400) {
      console.log('✓ Missing credentials test passed!');
    } else {
      console.error('✗ Missing credentials test failed!');
      console.error(`  Expected status 400, got ${missingResponse.statusCode}`);
      process.exit(1);
    }
    
    console.log('All auth tests passed!');
  } catch (error) {
    console.error('Error running test:', error);
    process.exit(1);
  }
})();
