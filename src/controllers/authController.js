import { loginUserService, verifyTokenService } from '../services/authService.js';

const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Call service layer
    const { accessToken, refreshToken, user } = await loginUserService(email, password);

    // Set HTTP-only cookie for refresh token
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Return access token and user data
    res.json({ 
      accessToken,
      user
    });

  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const handleVerify = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing token');
    }
    
    const token = authHeader.split(' ')[1];
    const { valid, user, error } = await verifyTokenService(token);

    if (!valid) {
      throw new Error(error);
    }

    res.json({ valid: true, user });

  } catch (error) {
    res.status(401).json({ valid: false, error: error.message });
  }
};

export { handleLogin, handleVerify };