import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

export const createUserService = async (userData) => {
  const { username, email, password } = userData;
  const hashedPassword = await bcrypt.hash(password, 12);
  let authUser = null;
  let userServiceSuccess = true;
  let yeetServiceSuccess = true;

  try {
    // Create user in Auth Service database
    authUser = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const serviceToken = jwt.sign(
      { service: 'auth-service' },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    // Call the User Service - with error handling
    try {
      await axios.post('http://user-service:3000/internal/users', 
        { authUserId: authUser.id, username },
        {
          headers: {
            'X-Service-Token': serviceToken,
          },
          timeout: 5000 // 5 second timeout
        }
      );
    } catch (userServiceError) {
      console.error("User service error:", userServiceError.message);
      if (userServiceError.response) {
        console.error("User service response:", userServiceError.response.data);
      }
      userServiceSuccess = false;
      // Continue execution despite error
    }

    // Call the Post Service - with error handling
    try {
      await axios.post('http://yeet-service:3000/internal/users',
        { userId: authUser.id, username },
        {
          headers: {
            'X-Service-Token': serviceToken,
          },
          timeout: 5000 // 5 second timeout
        }
      );
    } catch (yeetServiceError) {
      console.error("Yeet service error:", yeetServiceError.message);
      if (yeetServiceError.response) {
        console.error("Yeet service response:", yeetServiceError.response.data);
      }
      yeetServiceSuccess = false;
      // Continue execution despite error
    }

    // Generate tokens for immediate login after registration
    const accessToken = jwt.sign(
      { userId: authUser.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: authUser.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token
    await prisma.token.create({
      data: {
        token: refreshToken,
        type: 'refresh',
        valid: true,
        userId: authUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return { 
      id: authUser.id, 
      username, 
      email,
      accessToken,
      refreshToken,
      user: { id: authUser.id, email },
      userServiceSuccess,
      yeetServiceSuccess
    };
  } catch (error) {
    // If auth user was created but later steps failed
    if (authUser && authUser.id) {
      console.error("Registration partially succeeded (auth user created):", error.message);
      
      // Return partial success
      return { 
        id: authUser.id, 
        username, 
        email,
        user: { id: authUser.id, email },
        partialSuccess: true,
        error: error.message
      };
    }

    console.error("Registration error:", error.message);
    if (error.response) {
      console.error("Service response error:", error.response.data);
    }
    throw error;
  }
};
