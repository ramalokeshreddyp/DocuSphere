import { checkRateLimit, resetRateLimit } from '../../src/lib/rateLimiter.js';

describe('Rate Limiter', () => {
  const testUserId = 'test-user-123';
  const testType = 'email';

  beforeEach(async () => {
    // Reset rate limit before each test
    await resetRateLimit(testUserId, testType);
  });

  test('should allow requests within limit', async () => {
    const result = await checkRateLimit(testUserId, testType);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
    expect(result.limit).toBeGreaterThan(0);
  });

  test('should block requests exceeding limit', async () => {
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5');
    
    // Make requests up to the limit
    for (let i = 0; i < maxRequests; i++) {
      const result = await checkRateLimit(testUserId, testType);
      expect(result.allowed).toBe(true);
    }
    
    // Next request should be blocked
    const blockedResult = await checkRateLimit(testUserId, testType);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
    expect(blockedResult.resetAt).toBeGreaterThan(Date.now());
  });

  test('should track different users separately', async () => {
    const user1 = 'user1';
    const user2 = 'user2';
    
    const result1 = await checkRateLimit(user1, testType);
    const result2 = await checkRateLimit(user2, testType);
    
    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
  });

  test('should track different types separately', async () => {
    const result1 = await checkRateLimit(testUserId, 'email');
    const result2 = await checkRateLimit(testUserId, 'sms');
    
    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
  });

  test('should decrement remaining count correctly', async () => {
    const result1 = await checkRateLimit(testUserId, testType);
    const result2 = await checkRateLimit(testUserId, testType);
    
    expect(result1.remaining).toBeGreaterThan(result2.remaining);
  });
});
