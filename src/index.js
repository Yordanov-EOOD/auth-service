import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoute from './route/authRoute.js';
import logoutRoute from './route/logoutRoute.js';
import refreshTokenRoute from './route/refreshTokenRoute.js';
import { errorHandler } from './middleware/errorHandler.js';
import verifyJWT from './middleware/verifyJWT.js';
import registerRoute from './route/registerRoute.js';

const app = express();

// Enable credentials for JWT cookies
app.use(cors({
  origin: ['http://localhost', 'http://localhost:3000', 'http://api-gateway:80', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Powered-By']
}));

// Required for refresh token cookies
app.use(cookieParser());
app.use(express.json());

// Authentication endpoints

app.use('/register', registerRoute);
app.use('/auth', authRoute);          // Login
app.use('/refresh', refreshTokenRoute); // Token refresh
app.use('/logout', verifyJWT, logoutRoute); // Requires valid JWT

app.use(errorHandler);

const PORT = 3000;

// Health check endpoint
app.get('/auth/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`Auth Service: ${PORT}`);
});