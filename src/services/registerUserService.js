import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

export const createUserService = async (userData) => {
  const { password, username, email } = userData;
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user in Auth Service database
  const authUser = await prisma.user.create({
    data: { email, password: hashedPassword },
  });

  
  const serviceToken = jwt.sign(
    { service: 'auth-service' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );
  
  // Call the User Service
  await axios.post('http://user-service:3000/internal/users', 
    { authUserId: authUser.id, username: username },
    {
      headers: {
        'X-Service-Token': serviceToken, // Attach the token
      },
    }
  );
}
