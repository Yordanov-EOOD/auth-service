// Mock implementation of kafka.js for testing
export const getAuthServiceProducer = () => ({
  connect: async () => console.log('Mock Kafka producer connected'),
  send: async () => ({ success: true }),
  disconnect: async () => console.log('Mock Kafka producer disconnected')
});

export const TOPICS = {
  USER_CREATED: 'user-created',
  USER_UPDATED: 'user-updated',
  USER_DELETED: 'user-deleted'
};
