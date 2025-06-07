// Mock implementation for Kafka in tests
// This file mocks /app/shared/kafka.js for auth-service tests

import { jest } from '@jest/globals';

// Mock Topics
export const TOPICS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_FOLLOWED: 'user.followed',
  USER_UNFOLLOWED: 'user.unfollowed',
  YEET_CREATED: 'yeet.created',
  YEET_DELETED: 'yeet.deleted',
  YEET_LIKED: 'yeet.liked',
  YEET_RETWEETED: 'yeet.retweeted',
  
  // Service communication topics
  USER_SERVICE_REQUEST: 'user.service.request',
  USER_SERVICE_RESPONSE: 'user.service.response',
  AUTH_SERVICE_REQUEST: 'auth.service.request',
  AUTH_SERVICE_RESPONSE: 'auth.service.response',
  YEET_SERVICE_REQUEST: 'yeet.service.request',
  YEET_SERVICE_RESPONSE: 'yeet.service.response',
  
  // Dead Letter Queue
  DEAD_LETTER_QUEUE: 'dead.letter.queue'
};

// Mock consumer groups
export const CONSUMER_GROUPS = {
  AUTH_SERVICE: 'auth-service-group',
  USER_SERVICE: 'user-service-group',
  YEET_SERVICE: 'yeet-service-group',
  NOTIFICATION_SERVICE: 'notification-service-group'
};

// Mock Kafka producer for auth service
const mockProducer = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue({ success: true }),
  publishMessage: jest.fn().mockResolvedValue({ success: true })
};

// Mock Kafka producer factory
export const getAuthServiceProducer = jest.fn().mockImplementation(() => {
  return Promise.resolve(mockProducer);
});

// Mock Kafka consumer
export class KafkaConsumer {
  constructor() {
    this.handlers = {};
    this.connected = false;
  }

  onMessage(topic, handler) {
    this.handlers[topic] = handler;
    return this;
  }

  async connect() {
    this.connected = true;
    return this;
  }

  async disconnect() {
    this.connected = false;
    return this;
  }
}

// Make these available to tests that might need to verify calls
export const mockKafka = {
  producer: mockProducer,
  getAuthServiceProducer
};
