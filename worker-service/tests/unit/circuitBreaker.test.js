import { jest } from '@jest/globals';
import { CircuitBreaker, CircuitState } from '../../src/lib/circuitBreaker.js';

describe('Circuit Breaker', () => {
  let circuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000, // 1 second for testing
      halfOpenMaxCalls: 1
    });
  });

  test('should start in CLOSED state', () => {
    expect(circuitBreaker.state).toBe(CircuitState.CLOSED);
  });

  test('should allow successful calls in CLOSED state', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const result = await circuitBreaker.execute(mockFn, 'test-123');
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalled();
    expect(circuitBreaker.state).toBe(CircuitState.CLOSED);
  });

  test('should transition to OPEN after threshold failures', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
    
    // Fail 3 times to hit threshold
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(mockFn, `test-${i}`);
      } catch (error) {
        // Expected to fail
      }
    }
    
    expect(circuitBreaker.state).toBe(CircuitState.OPEN);
    expect(circuitBreaker.failureCount).toBe(3);
  });

  test('should reject calls immediately when OPEN', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
    
    // Trip the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(mockFn, `test-${i}`);
      } catch (error) {
        // Expected
      }
    }
    
    expect(circuitBreaker.state).toBe(CircuitState.OPEN);
    
    // Next call should be rejected without calling the function
    const callCount = mockFn.mock.calls.length;
    try {
      await circuitBreaker.execute(mockFn, 'test-rejected');
    } catch (error) {
      expect(error.message).toContain('Circuit breaker is OPEN');
      expect(mockFn.mock.calls.length).toBe(callCount); // Not called again
    }
  });

  test('should transition to HALF_OPEN after timeout', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
    
    // Trip the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(mockFn, `test-${i}`);
      } catch (error) {
        // Expected
      }
    }
    
    expect(circuitBreaker.state).toBe(CircuitState.OPEN);
    
    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Next call should transition to HALF_OPEN
    const successFn = jest.fn().mockResolvedValue('recovered');
    const result = await circuitBreaker.execute(successFn, 'test-recovery');
    
    expect(result).toBe('recovered');
    expect(circuitBreaker.state).toBe(CircuitState.CLOSED);
  });

  test('should return to OPEN if call fails in HALF_OPEN', async () => {
    const failFn = jest.fn().mockRejectedValue(new Error('Still failing'));
    
    // Trip circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(failFn, `test-${i}`);
      } catch (error) {
        // Expected
      }
    }
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Fail in HALF_OPEN
    try {
      await circuitBreaker.execute(failFn, 'test-half-open-fail');
    } catch (error) {
      // Expected
    }
    
    expect(circuitBreaker.state).toBe(CircuitState.OPEN);
  });

  test('should track statistics correctly', async () => {
    const successFn = jest.fn().mockResolvedValue('success');
    const failFn = jest.fn().mockRejectedValue(new Error('failure'));
    
    await circuitBreaker.execute(successFn, 'test-1');
    await circuitBreaker.execute(successFn, 'test-2');
    
    try {
      await circuitBreaker.execute(failFn, 'test-3');
    } catch (error) {
      // Expected
    }
    
    const stats = circuitBreaker.getStatus();
    
    expect(stats.stats.totalCalls).toBe(3);
    expect(stats.stats.successfulCalls).toBe(2);
    expect(stats.stats.failedCalls).toBe(1);
  });

  test('should reset correctly', () => {
    circuitBreaker.failureCount = 5;
    circuitBreaker.state = CircuitState.OPEN;
    
    circuitBreaker.reset();
    
    expect(circuitBreaker.state).toBe(CircuitState.CLOSED);
    expect(circuitBreaker.failureCount).toBe(0);
  });
});
