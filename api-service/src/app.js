import express from 'express';
import dotenv from 'dotenv';
import notificationsRouter from './routes/notifications.js';
import { initDatabase } from './config/database.js';
import { createChannel } from './config/messageQueue.js';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/notifications', notificationsRouter);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

async function start () {
  const maxRetries = 10;
  const retryDelay = 3000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await initDatabase();
      await createChannel();
      app.listen(port, () => {
        console.log(`API service listening on port ${port}`);
      });
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

export default app;
