// Mock Prisma client for tests
export default {
  user: {
    create: async () => ({
      id: '123',
      email: 'test@example.com'
    }),
    findUnique: async () => ({
      id: '123',
      email: 'test@example.com',
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', // Mock bcrypt hash
      username: 'testuser'
    }),
    update: async () => ({
      id: '123',
      email: 'test@example.com'
    })
  }
};
