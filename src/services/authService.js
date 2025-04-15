import prisma from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const loginUserService = async (email, password) => {
  // Validate credentials
  const user = await prisma.user.findUnique({ 
    where: { email },
    select: {
      id: true,
      email: true,
      password: true
    }
  });
  
  if (!user) throw new Error('Invalid credentials');
  
  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) throw new Error('Invalid credentials');

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '10m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '1d' }
  );

  // Update refresh token in database
  await prisma.token.upsert({
    where: { userId: user.id },
    update: { 
      token: refreshToken,
      valid: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    create: {
      token: refreshToken,
      type: 'refresh',
      valid: true,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  // Return response with user data
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email
    }
  };
};

export const verifyTokenService = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true
      }
    });
    
    if (!user) {
      return { valid: false, error: 'User not found' };
    }

    return { valid: true, user };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};