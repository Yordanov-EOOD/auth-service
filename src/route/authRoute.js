import express from 'express';
import { handleLogin, handleVerify } from '../controllers/authController.js';
import { validateLogin } from '../middleware/validation.js';
import { authRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Apply rate limiting and validation to login route
router.post('/login', authRateLimit, validateLogin, handleLogin);
router.post('/verify', handleVerify);

export default router;