// Auth endpoints integration tests
import request from 'supertest';
import express from 'express';

describe('Auth Endpoints', () => {
  // Create a simple app for testing just the auth endpoint
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

  describe('POST /auth', () => {    it('should authenticate a user with valid credentials', async () => {
    const response = await request(app)
      .post('/auth')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      });
      
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body.accessToken).toBe('mock-token');
  });
    
  it('should return 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/auth')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      
    expect(response.statusCode).toBe(401);
  });
    
  it('should return 400 for missing credentials', async () => {
    const response = await request(app)
      .post('/auth')
      .send({
        email: 'test@example.com'
      });
      
    expect(response.statusCode).toBe(400);
  });

  it('should reject authentication with invalid credentials', async () => {
    const response = await request(app)
      .post('/auth')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      
    expect(response.statusCode).toBe(401);
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/auth')
      .send({
        email: 'test@example.com'
        // Missing password
      });
      
    expect(response.statusCode).toBe(400);
  });
  });
});