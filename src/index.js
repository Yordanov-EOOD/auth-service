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
  origin: ['http://localhost:3000', 'http://api-gateway:80'],
  methods: ['GET', 'POST'],
  credentials: true
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
app.listen(PORT, () => {
  console.log(`Auth Service: ${PORT}`);
});