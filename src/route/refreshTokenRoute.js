import express from 'express';
import { handleRefreshToken } from '../controllers/refreshTokenController.js';
import { refreshRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Apply rate limiting to refresh token route
router.get('/', refreshRateLimit, handleRefreshToken);

export default router;