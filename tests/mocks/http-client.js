// Mock for http-client.js
export const createUserHttpClient = () => ({
  get: async (path) => {
    if (path === '/users/by-email/test@example.com') {
      return {
        id: '123',
        email: 'test@example.com',
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', // Mock bcrypt hash
        username: 'testuser'
      };
    }
    throw new Error('User not found');
  },
  post: async () => ({ success: true })
});

export const createYeetHttpClient = () => ({
  get: async () => ({ success: true }),
  post: async () => ({ success: true })
});
