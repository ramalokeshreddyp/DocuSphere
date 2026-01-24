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

let channel;

async function createChannel () {
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

export { createChannel, QUEUE_NAME, DLQ_NAME };
