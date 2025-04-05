import { logoutUserService } from '../services/logoutService.js';

export const handleLogout = async (req, res) => {
  const cookies = req.cookies;

  try {
    // Check if refresh token exists in cookies
    if (!cookies?.jwt) {
      return res.sendStatus(204); // No content (already logged out)
    }

    // Delete the refresh token from the database
    await logoutUserService(req.user.userId); // userId comes from JWT middleware

    // Clear the refresh token cookie
    res.clearCookie('jwt', {
      httpOnly: true,
    });

    res.sendStatus(204); // Successfully logged out
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};