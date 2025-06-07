// Mock implementation for jsonwebtoken
export const sign = () => 'mock-token';
export const verify = () => ({ email: 'test@example.com', id: '123' });
export default { sign, verify };
