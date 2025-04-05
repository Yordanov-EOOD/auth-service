import { createUserService } from '../services/registerUserService.js';

export const handleNewUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const user = await createUserService({ username, email, password });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};  