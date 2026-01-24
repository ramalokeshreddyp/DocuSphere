import Redis from 'ioredis';

const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = 6379,
  RATE_LIMIT_WINDOW = 60, // seconds
  RATE_LIMIT_MAX_REQUESTS = 5
} = process.env;

let redisClient;

// Initialize Redis client
function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }
  return redisClient;
}

/**
 * Token Bucket Rate Limiter using Redis
 * Implements a sliding window rate limit per userId and notification type
 * 
 * @param {string} userId - User identifier
 * @param {string} type - Notification type (email, sms, push)
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number}>}
 */
async function checkRateLimit(userId, type) {
  const client = getRedisClient();
  const key = `ratelimit:${userId}:${type}`;
  const window = parseInt(RATE_LIMIT_WINDOW);
  const maxRequests = parseInt(RATE_LIMIT_MAX_REQUESTS);
  const now = Date.now();
  const windowStart = now - (window * 1000);

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = client.pipeline();
    
    // Remove old entries outside the current window
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in the window
    pipeline.zcard(key);
    
    // Add current request with score as timestamp
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiry on the key
    pipeline.expire(key, window);
    
    const results = await pipeline.exec();
    
    // results[1] contains the count before adding the new request
    const currentCount = results[1][1];
    
    if (currentCount >= maxRequests) {
      // Remove the request we just added since it's over the limit
      await client.zrem(key, `${now}-${Math.random()}`);
      
      // Get the oldest request to calculate reset time
      const oldest = await client.zrange(key, 0, 0, 'WITHSCORES');
      const resetAt = oldest.length > 0 ? parseInt(oldest[1]) + (window * 1000) : now + (window * 1000);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: maxRequests,
        window
      };
    }
    
    return {
      allowed: true,
      remaining: maxRequests - currentCount - 1,
      resetAt: now + (window * 1000),
      limit: maxRequests,
      window
    };
    
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow the request if Redis is unavailable
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + (window * 1000),
      limit: maxRequests,
      window,
      error: 'Rate limiter unavailable'
    };
  }
}

/**
 * Reset rate limit for a specific user and type (useful for testing)
 */
async function resetRateLimit(userId, type) {
  const client = getRedisClient();
  const key = `ratelimit:${userId}:${type}`;
  await client.del(key);
}

/**
 * Get current rate limit status without consuming a token
 */
async function getRateLimitStatus(userId, type) {
  const client = getRedisClient();
  const key = `ratelimit:${userId}:${type}`;
  const window = parseInt(RATE_LIMIT_WINDOW);
  const maxRequests = parseInt(RATE_LIMIT_MAX_REQUESTS);
  const now = Date.now();
  const windowStart = now - (window * 1000);

  try {
    await client.zremrangebyscore(key, 0, windowStart);
    const currentCount = await client.zcard(key);
    const oldest = await client.zrange(key, 0, 0, 'WITHSCORES');
    const resetAt = oldest.length > 0 ? parseInt(oldest[1]) + (window * 1000) : now + (window * 1000);

    return {
      currentCount,
      remaining: Math.max(0, maxRequests - currentCount),
      resetAt,
      limit: maxRequests,
      window
    };
  } catch (error) {
    console.error('Rate limit status error:', error);
    return null;
  }
}

export { checkRateLimit, resetRateLimit, getRateLimitStatus, getRedisClient };
