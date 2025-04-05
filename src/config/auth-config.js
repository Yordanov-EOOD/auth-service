import dotenv from 'dotenv';
dotenv.config(); // Load .env variables

export const jwtConfig = {
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    accessExpiration: '15m',
    refreshExpiration: '7d'
  };