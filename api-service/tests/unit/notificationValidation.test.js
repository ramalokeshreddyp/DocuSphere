import request from 'supertest';
import app from '../../src/app.js';
import { initDatabase, NotificationLog, sequelize } from '../../src/config/database.js';
import { getInMemoryQueue } from '../../src/config/messageQueue.js';

describe('Notification API validation', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  afterEach(async () => {
    await NotificationLog.destroy({ where: {} });
    getInMemoryQueue().length = 0;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('rejects invalid notification type', async () => {
    const res = await request(app)
      .post('/api/notifications/send')
      .send({ userId: 'user-x', type: 'fax', recipient: 'foo@example.com', message: 'y' });
    expect(res.status).toBe(400);
  });

  test('accepts valid notification and enqueues', async () => {
    const res = await request(app)
      .post('/api/notifications/send')
      .send({ userId: 'user-123', type: 'email', recipient: 'foo@example.com', message: 'Hello world' });

    expect(res.status).toBe(202);
    expect(res.body.id).toBeDefined();
    const log = await NotificationLog.findByPk(res.body.id);
    expect(log.status).toBe('queued');
    expect(getInMemoryQueue().length).toBe(1);
  });
});
