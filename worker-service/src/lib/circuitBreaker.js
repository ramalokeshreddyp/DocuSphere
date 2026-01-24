/**
 * Circuit Breaker Pattern Implementation
 * States: CLOSED (normal), OPEN (failing), HALF_OPEN (testing recovery)
 */

const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 60 seconds
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 1;
    
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.nextAttempt = Date.now();
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0,
      stateTransitions: []
    };
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Async function to execute
   * @param {string} correlationId - For logging
   * @returns {Promise} Result of the function or circuit breaker error
   */
  async execute(fn, correlationId = 'unknown') {
    this.stats.totalCalls++;

    // Check if circuit is OPEN
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.stats.rejectedCalls++;
        const error = new Error('Circuit breaker is OPEN');
        error.circuitState = this.state;
        error.correlationId = correlationId;
        console.log(`[CIRCUIT-BREAKER] ${correlationId} - Request rejected (OPEN state)`);
        throw error;
      }
      // Time to try recovery - transition to HALF_OPEN
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    // Check HALF_OPEN call limit
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenAttempts >= this.halfOpenMaxCalls) {
        this.stats.rejectedCalls++;
        const error = new Error('Circuit breaker is HALF_OPEN (max calls reached)');
        error.circuitState = this.state;
        error.correlationId = correlationId;
        console.log(`[CIRCUIT-BREAKER] ${correlationId} - Request rejected (HALF_OPEN limit)`);
        throw error;
      }
      this.halfOpenAttempts++;
    }

    // Execute the function
    try {
      const result = await fn();
      this.onSuccess(correlationId);
      return result;
    } catch (error) {
      this.onFailure(correlationId, error);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  onSuccess(correlationId) {
    this.stats.successfulCalls++;
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      console.log(`[CIRCUIT-BREAKER] ${correlationId} - Success in HALF_OPEN (${this.successCount}/${this.halfOpenMaxCalls})`);
      
      // If we've had enough successful calls, close the circuit
      if (this.successCount >= this.halfOpenMaxCalls) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      console.log(`[CIRCUIT-BREAKER] ${correlationId} - Success in CLOSED state`);
    }
  }

  /**
   * Handle failed execution
   */
  onFailure(correlationId, error) {
    this.stats.failedCalls++;
    this.failureCount++;
    
    console.log(`[CIRCUIT-BREAKER] ${correlationId} - Failure (${this.failureCount}/${this.failureThreshold}) - ${error.message}`);

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN immediately opens the circuit
      console.log(`[CIRCUIT-BREAKER] ${correlationId} - Failure in HALF_OPEN, opening circuit`);
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failureCount >= this.failureThreshold) {
      console.log(`[CIRCUIT-BREAKER] ${correlationId} - Threshold reached, opening circuit`);
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Transition to a new state
   */
  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    
    this.stats.stateTransitions.push({
      from: oldState,
      to: newState,
      timestamp: new Date().toISOString()
    });

    console.log(`[CIRCUIT-BREAKER] State transition: ${oldState} → ${newState}`);

    if (newState === CircuitState.OPEN) {
      this.nextAttempt = Date.now() + this.resetTimeout;
      this.halfOpenAttempts = 0;
      console.log(`[CIRCUIT-BREAKER] Circuit will attempt recovery in ${this.resetTimeout}ms`);
    } else if (newState === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts = 0;
      this.successCount = 0;
      this.failureCount = 0;
    } else if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
      this.halfOpenAttempts = 0;
    }
  }

  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout,
      nextAttempt: this.state === CircuitState.OPEN ? new Date(this.nextAttempt).toISOString() : null,
      stats: {
        ...this.stats,
        recentTransitions: this.stats.stateTransitions.slice(-5)
      }
    };
  }

  /**
   * Reset circuit breaker (for testing)
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.nextAttempt = Date.now();
    console.log('[CIRCUIT-BREAKER] Circuit breaker reset to CLOSED state');
  }
}

export { CircuitBreaker, CircuitState };
