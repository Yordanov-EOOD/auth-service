// src/routes/authRoute.js
import express from 'express';
import { handleLogout } from '../controllers/logoutController.js';
import verifyJWT from '../middleware/verifyJWT.js'; // Protect logout route

const router = express.Router();

router.post('/', verifyJWT, handleLogout); 

export default router;