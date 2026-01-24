import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const {
  QUEUE_HOST = 'localhost',
  QUEUE_PORT = 5672,
  QUEUE_USER = 'guest',
  QUEUE_PASSWORD = 'guest',
  QUEUE_NAME = 'notification_queue',
  DLQ_NAME = 'notification_dlq'
} = process.env;

const isTest = process.env.NODE_ENV === 'test';
const inMemoryQueue = [];

let channel;

async function createChannel () {
  if (isTest) return null;
  if (channel) return channel;
  const connection = await amqp.connect({
    protocol: 'amqp',
    hostname: QUEUE_HOST,
    port: Number(QUEUE_PORT),
    username: QUEUE_USER,
    password: QUEUE_PASSWORD
  });
  const ch = await connection.createChannel();
  await ch.assertQueue(DLQ_NAME, { durable: true });
  await ch.assertQueue(QUEUE_NAME, {
    durable: true,
    deadLetterExchange: '',
    deadLetterRoutingKey: DLQ_NAME
  });
  channel = ch;
  return channel;
}

async function publishNotification (payload) {
  if (isTest) {
    inMemoryQueue.push(payload);
    return;
  }
  const ch = await createChannel();
  const buffer = Buffer.from(JSON.stringify(payload));
  ch.sendToQueue(QUEUE_NAME, buffer, { persistent: true });
}

function getInMemoryQueue () {
  return inMemoryQueue;
}

export { createChannel, publishNotification, getInMemoryQueue };
