import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';
import { startConsumer } from './consumers/notificationConsumer.js';

dotenv.config();

async function start () {
  const maxRetries = 10;
  const retryDelay = 3000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await initDatabase();
      const concurrency = Number(process.env.WORKER_CONCURRENCY || 1);
      await startConsumer(concurrency);
      return;
    } catch (err) {
      console.error(`Start attempt ${i + 1} failed: ${err.message}`);
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('Max retries reached, exiting');
        process.exit(1);
      }
    }
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}
