import { handleRefreshTokenService } from '../services/refreshTokenService.js';

export const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;

  try {
    const refreshToken = cookies?.jwt;

    if (!refreshToken) {
      return res.sendStatus(401); // Unauthorized
    }

    const { accessToken } = await handleRefreshTokenService(refreshToken);
    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: error.message }); // Forbidden
  }
};