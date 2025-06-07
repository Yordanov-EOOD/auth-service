// Mock implementation for bcrypt
const compare = async (password, hash) => password === 'testpassword';
const hash = async (password) => 'mock-hashed-password';

export { compare, hash };
export default { compare, hash };
