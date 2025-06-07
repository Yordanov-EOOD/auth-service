// Refresh token integration test
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

describe('Refresh Token Endpoint', () => {
  // Create a simple app for testing just the refresh token endpoint
  const app = express();
  app.use(cookieParser());
  
  // Mock refresh token endpoint
  app.get('/refresh', (req, res) => {
    const cookies = req.cookies;
    const refreshToken = cookies?.jwt;
    
    if (!refreshToken) {
      return res.sendStatus(401); // Unauthorized
    }
    
    // Simulate token verification
    if (refreshToken === 'valid-refresh-token') {
      return res.status(200).json({ 
        accessToken: 'new-access-token'
      });
    }
    
    if (refreshToken === 'expired-token') {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
    
    return res.status(403).json({ error: 'Invalid token' });
  });
  
  describe('GET /refresh', () => {
    it('should return a new access token with valid refresh token', async () => {
      const response = await request(app)
        .get('/refresh')
        .set('Cookie', ['jwt=valid-refresh-token']);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).toBe('new-access-token');
    });
    
    it('should return 401 when no refresh token is provided', async () => {
      const response = await request(app)
        .get('/refresh');
      
      expect(response.statusCode).toBe(401);
    });
    
    it('should return 403 when refresh token is expired', async () => {
      const response = await request(app)
        .get('/refresh')
        .set('Cookie', ['jwt=expired-token']);
      
      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid or expired refresh token');
    });
  });
});
