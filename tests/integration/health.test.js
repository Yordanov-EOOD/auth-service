// Health endpoint integration test
import request from 'supertest';
import express from 'express';

describe('Health Endpoint', () => {
  // Create a simple app for testing just the health endpoint
  const app = express();
  
  // Add a health endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  it('should return 200 OK for the health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('OK');
  });
});