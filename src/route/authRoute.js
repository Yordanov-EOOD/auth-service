import express from 'express';
import { handleLogin, handleVerify } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', handleLogin);
router.post('/verify', handleVerify);

export default router;