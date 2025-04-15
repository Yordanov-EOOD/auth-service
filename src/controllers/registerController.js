import { createUserService } from '../services/registerUserService.js';

export const handleNewUser = async (req, res) => {
  console.log("Register endpoint hit with body:", req.body);
  
  const { username, email, password } = req.body;
  
  // Validate required fields
  if (!username || !email || !password) {
    console.error("Registration failed - missing required fields:", { 
      usernamePresent: !!username, 
      emailPresent: !!email, 
      passwordPresent: !!password 
    });
    return res.status(400).json({ 
      error: "Missing required fields", 
      details: { 
        usernamePresent: !!username, 
        emailPresent: !!email, 
        passwordPresent: !!password 
      } 
    });
  }

  try {
    // Register user and get response including tokens and user info
    console.log("Attempting to create user with:", { username, email });
    const result = await createUserService({ username, email, password });
    
    console.log("User creation result:", { 
      id: result.id, 
      email: result.email,
      partialSuccess: result.partialSuccess || false,
      userServiceSuccess: result.userServiceSuccess,
      yeetServiceSuccess: result.yeetServiceSuccess
    });
    
    // Handle partial success (user created in auth DB but failed in other services)
    if (result.partialSuccess) {
      // Still set refresh token if we have one
      if (result.refreshToken) {
        res.cookie('jwt', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }
      
      // Return 201 Created with warning about partial success
      return res.status(201).json({
        accessToken: result.accessToken,
        user: result.user,
        message: "Registration partially successful. Some features may be limited.",
        warning: result.error
      });
    }
    
    // Handle complete success but with some service failures
    if (!result.userServiceSuccess || !result.yeetServiceSuccess) {
      console.log("Registration successful but with service errors:", 
        !result.userServiceSuccess ? "User service failed" : "Yeet service failed");
    }
    
    // Set HTTP-only cookie for refresh token if included
    if (result.refreshToken) {
      res.cookie('jwt', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    // Return response with access token and user data - return 201 Created
    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user || { id: result.id, email: result.email }
    });
  } catch (error) {
    console.error('Registration error:', error.message, error.stack);
    res.status(400).json({ error: error.message });
  }
};