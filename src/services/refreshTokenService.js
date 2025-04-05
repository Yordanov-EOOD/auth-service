import prisma from '../config/db.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const handleRefreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('Refresh token not provided');
  }

  // Verify the refresh token
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  console.log(decoded);

  // Find the token in the database
  const tokenRecord = await prisma.token.findFirst({
    where: { token: refreshToken, userId: decoded.userId },
  });

  if (!tokenRecord || !tokenRecord.valid || tokenRecord.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }

  // Generate a new access token
  const accessToken = jwt.sign(
    { userId: decoded.userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '10m' } // Adjust expiration as needed
  );

  return { accessToken };
};