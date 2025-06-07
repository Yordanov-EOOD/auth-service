import express from 'express';
import { handleNewUser } from '../controllers/registerController.js';
import { validateRegistration } from '../middleware/validation.js';
import { registerRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Apply rate limiting and validation to registration route
router.post('/', registerRateLimit, validateRegistration, handleNewUser);

export default router;