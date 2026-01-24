import { jest } from '@jest/globals';
import { initDatabase, NotificationLog, sequelize } from '../../src/config/database.js';

const buildMessage = (payload) => ({ content: Buffer.from(JSON.stringify(payload)) });

describe('Worker consumer integration', () => {
  let channel;

  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(() => {
    channel = {
      sendToQueue: jest.fn(),
      ack: jest.fn()
    };
  });

  afterEach(async () => {
    await NotificationLog.destroy({ where: {} });
  });

  test('database persists notification logs correctly', async () => {
    // Verify that NotificationLog can be created and updated
    const log = await NotificationLog.create({
      correlation_id: 'test-corr-1',
      user_id: 'user-1',
      message: 'hello',
      notification_type: 'email',
      recipient: 'test@example.com',
      status: 'queued'
    });

    expect(log.id).toBeDefined();
    expect(log.status).toBe('queued');

    // Update status to sent
    await NotificationLog.update(
      { status: 'sent', sent_at: new Date() },
      { where: { correlation_id: 'test-corr-1' } }
    );

    const updated = await NotificationLog.findByPk(log.id);
    expect(updated.status).toBe('sent');
    expect(updated.sent_at).toBeDefined();
  });

  test('database prevents duplicate logs via correlation_id', async () => {
    const correlationId = 'test-corr-unique';

    await NotificationLog.create({
      correlation_id: correlationId,
      user_id: 'user-1',
      message: 'hello',
      notification_type: 'email',
      recipient: 'test@example.com',
      status: 'queued'
    });

    // Try to create another with same correlation_id - should fail
    try {
      await NotificationLog.create({
        correlation_id: correlationId,
        user_id: 'user-2',
        message: 'world',
        notification_type: 'sms',
        recipient: 'test2@example.com',
        status: 'queued'
      });
      throw new Error('Should have failed due to unique constraint');
    } catch (err) {
      expect(err.message).not.toBe('Should have failed due to unique constraint');
      // Expected - unique constraint violation
    }
  });
});
