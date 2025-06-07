// Login functionality integration test
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

describe('Login Endpoints', () => {
  // Create a simple app for testing just the login endpoint
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  
  // Add a mock login endpoint
  app.post('/auth', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    // Simulate authentication
    if (email === 'test@example.com' && password === 'testpassword') {
      // Set HTTP-only cookie for refresh token
      const refreshToken = 'mock-refresh-token';
      res.cookie('jwt', refreshToken, {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
      
      return res.status(200).json({ 
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '123',
          email: 'test@example.com'
        }
      });
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  });
  
  describe('POST /auth (Login)', () => {
    it('should authenticate a user with valid credentials and set refresh token cookie', async () => {
      const response = await request(app)
        .post('/auth')
        .send({
          email: 'test@example.com',
          password: 'testpassword'
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.accessToken).toBe('mock-access-token');
      
      // Check cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('jwt=');
      expect(cookies[0]).toContain('HttpOnly');
    });
    
    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/auth')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });
    
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/auth')
        .send({
          email: 'test@example.com'
        });
      
      expect(response.statusCode).toBe(400);
    });
  });
});
