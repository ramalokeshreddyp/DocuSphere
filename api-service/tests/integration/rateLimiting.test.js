import request from 'supertest';
import app from '../../src/app.js';
import { resetRateLimit, getRedisClient } from '../../src/lib/rateLimiter.js';
import { initDatabase, NotificationLog, sequelize } from '../../src/config/database.js';

describe('Rate Limiting Integration Tests', () => {
  const testUserId = 'integration-test-user';
  const testType = 'email';

  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    await resetRateLimit(testUserId, testType);
    await NotificationLog.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
    const client = getRedisClient();
    await client.quit();
  });

  test('should accept requests within rate limit', async () => {
    const payload = {
      userId: testUserId,
      type: testType,
      recipient: 'test@example.com',
      message: 'Test message'
    };

    const response = await request(app)
      .post('/api/notifications/send')
      .send(payload)
      .expect(202);

    expect(response.body).toHaveProperty('correlationId');
    expect(response.body.status).toBe('queued');
    expect(response.headers).toHaveProperty('x-ratelimit-limit');
    expect(response.headers).toHaveProperty('x-ratelimit-remaining');
  });

  test('should return 429 when rate limit exceeded', async () => {
    const payload = {
      userId: testUserId,
      type: testType,
      recipient: 'test@example.com',
      message: 'Test message'
    };

    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5');

    // Send requests up to limit
    for (let i = 0; i < maxRequests; i++) {
      await request(app)
        .post('/api/notifications/send')
        .send(payload)
        .expect(202);
    }

    // Next request should be rate limited
    const response = await request(app)
      .post('/api/notifications/send')
      .send(payload)
      .expect(429);

    expect(response.body.message).toContain('Too Many Requests');
    expect(response.body).toHaveProperty('retryAfter');
    expect(response.headers['x-ratelimit-remaining']).toBe('0');
  });

  test('should provide correct rate limit headers', async () => {
    const payload = {
      userId: testUserId,
      type: testType,
      recipient: 'test@example.com',
      message: 'Test message'
    };

    const response1 = await request(app)
      .post('/api/notifications/send')
      .send(payload)
      .expect(202);

    const response2 = await request(app)
      .post('/api/notifications/send')
      .send(payload)
      .expect(202);

    const remaining1 = parseInt(response1.headers['x-ratelimit-remaining']);
    const remaining2 = parseInt(response2.headers['x-ratelimit-remaining']);

    expect(remaining2).toBe(remaining1 - 1);
  });

  test('should rate limit per user', async () => {
    const user1Payload = {
      userId: 'user-1',
      type: testType,
      recipient: 'user1@example.com',
      message: 'Test'
    };

    const user2Payload = {
      userId: 'user-2',
      type: testType,
      recipient: 'user2@example.com',
      message: 'Test'
    };

    await resetRateLimit('user-1', testType);
    await resetRateLimit('user-2', testType);

    // Both should succeed as they're different users
    await request(app)
      .post('/api/notifications/send')
      .send(user1Payload)
      .expect(202);

    await request(app)
      .post('/api/notifications/send')
      .send(user2Payload)
      .expect(202);
  });

  test('should rate limit per type', async () => {
    const emailPayload = {
      userId: testUserId,
      type: 'email',
      recipient: 'test@example.com',
      message: 'Test'
    };

    const smsPayload = {
      userId: testUserId,
      type: 'sms',
      recipient: '+1234567890',
      message: 'Test'
    };

    await resetRateLimit(testUserId, 'email');
    await resetRateLimit(testUserId, 'sms');

    // Both should succeed as they're different types
    await request(app)
      .post('/api/notifications/send')
      .send(emailPayload)
      .expect(202);

    await request(app)
      .post('/api/notifications/send')
      .send(smsPayload)
      .expect(202);
  });
});
