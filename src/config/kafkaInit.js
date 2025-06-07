import { getAuthServiceProducer, KafkaConsumer, TOPICS, CONSUMER_GROUPS } from '/app/shared/kafka.js';

// Initialize Kafka producer for auth service
export const initKafkaProducer = async () => {
  try {
    const producer = await getAuthServiceProducer();
    console.log('Auth service Kafka producer initialized');
    return producer;
  } catch (error) {
    console.error('Failed to initialize Kafka producer for auth service:', error);
    // Don't crash the service if Kafka isn't available
    return null;
  }
};

// Initialize a consumer for user events that auth service might need to respond to
export const initKafkaConsumer = async () => {
  try {
    const consumer = new KafkaConsumer(
      CONSUMER_GROUPS.AUTH_SERVICE,
      [TOPICS.USER_CREATED] // Subscribe to relevant topics
    );
    
    // Set up handlers for different events
    consumer.onMessage(TOPICS.USER_CREATED, handleUserCreatedEvent);
    
    await consumer.connect();
    console.log('Auth service Kafka consumer initialized');
    return consumer;
  } catch (error) {
    console.error('Failed to initialize Kafka consumer for auth service:', error);
    // Don't crash the service if Kafka isn't available
    return null;
  }
};

// Handler for user created events
const handleUserCreatedEvent = (message) => {
  console.log('Auth service received user created event:', message);
  // Implement any logic needed when a user is created
};

// Initialize Kafka when the module is imported
export const initKafka = async () => {
  const producer = await initKafkaProducer();
  const consumer = await initKafkaConsumer();
  
  return { producer, consumer };
};