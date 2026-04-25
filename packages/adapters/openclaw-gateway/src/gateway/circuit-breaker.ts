/**
 * Circuit Breaker for OpenClaw Gateway Connections
 * 
 * Implements the circuit breaker pattern to prevent cascading failures
 * when the Paperclip gateway is unavailable. Auto-detects ECONNREFUSED errors.
 * 
 * Task: BOB-3795 [BOB-3788-1]
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Maximum number of consecutive failures before opening circuit */
  failureThreshold: number;
  /** Time in milliseconds before attempting to close circuit (half-open) */
  resetTimeoutMs: number;
  /** Time window for counting failures in milliseconds */
  failureWindowMs: number;
  /** Minimum number of requests before calculating failure rate */
  minimumRequests: number;
  /** Failure rate threshold (0-1) that triggers circuit open */
  failureRateThreshold: number;
}

export interface CircuitBreakerMetrics {
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastStateChange: number;
  consecutiveFailures: number;
  totalRequests: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  failureWindowMs: 60000,
  minimumRequests: 3,
  failureRateThreshold: 0.5,
};

export class CircuitBreakerOpenError extends Error {
  constructor(public readonly state: CircuitState, public readonly metrics: CircuitBreakerMetrics) {
    super(`Circuit breaker is ${state}. Gateway connection temporarily disabled.`);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class GatewayConnectionError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error,
    public readonly isECONNREFUSED: boolean
  ) {
    super(message);
    this.name = 'GatewayConnectionError';
  }
}

/**
 * Check if an error is an ECONNREFUSED error (BOB-2203)
 */
export function isECONNREFUSEDError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const code = (error as any).code?.toLowerCase?.() || '';
    
    return (
      code === 'econnrefused' ||
      message.includes('econnrefused') ||
      message.includes('connect refused') ||
      message.includes('connection refused') ||
      message.includes('econnrefused')
    );
  }
  return false;
}

/**
 * Check if an error represents a gateway connection failure
 * This includes ECONNREFUSED, network timeouts, and other connection issues
 */
export function isGatewayConnectionError(error: unknown): boolean {
  if (error instanceof GatewayConnectionError) {
    return true;
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const code = (error as any).code?.toLowerCase?.() || '';
    
    return (
      isECONNREFUSEDError(error) ||
      code === 'econnreset' ||
      code === 'etimedout' ||
      code === 'enotfound' ||
      message.includes('socket hang up') ||
      message.includes('network error') ||
      message.includes('fetch failed') ||
      message.includes('connect timed out') ||
      message.includes('connection timed out')
    );
  }
  
  return false;
}

/**
 * Circuit Breaker implementation for gateway connections
 * 
 * Pattern:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Gateway is assumed down, requests fail fast
 * - HALF_OPEN: Testing if gateway has recovered
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private metrics: CircuitBreakerMetrics;
  private options: CircuitBreakerOptions;
  private failureTimestamps: number[] = [];

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.metrics = this.resetMetrics();
  }

  private resetMetrics(): CircuitBreakerMetrics {
    return {
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      lastStateChange: Date.now(),
      consecutiveFailures: 0,
      totalRequests: 0,
    };
  }

  /**
   * Get current circuit state (exposed via method for monitoring)
   */
  getState(): CircuitState {
    // Check if we should transition from open to half-open
    if (this.state === 'open' && this.shouldAttemptReset()) {
      this.transitionTo('half-open');
    }
    return this.state;
  }

  /**
   * Get current metrics (for monitoring/debugging)
   */
  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if the circuit allows new requests
   */
  isAvailable(): boolean {
    const currentState = this.getState();
    return currentState === 'closed' || currentState === 'half-open';
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    this.metrics.successes++;
    this.metrics.totalRequests++;
    this.metrics.consecutiveFailures = 0;

    // In half-open state, one success closes the circuit
    if (this.state === 'half-open') {
      this.transitionTo('closed');
      this.metrics = this.resetMetrics();
      this.failureTimestamps = [];
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    const now = Date.now();
    
    this.metrics.failures++;
    this.metrics.totalRequests++;
    this.metrics.consecutiveFailures++;
    this.metrics.lastFailureTime = now;
    
    // Track failure within window
    this.failureTimestamps.push(now);
    
    // Remove failures outside the window
    const windowStart = now - this.options.failureWindowMs;
    this.failureTimestamps = this.failureTimestamps.filter(t => t >= windowStart);

    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
      this.transitionTo('open');
    } else if (this.state === 'half-open') {
      // In half-open, any failure reopens the circuit
      this.transitionTo('open');
    }
  }

  /**
   * Execute a function with circuit breaker protection
   * 
   * @param fn The function to execute
   * @param fallback Optional fallback function if circuit is open or function fails
   * @returns Result of fn or fallback
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const currentState = this.getState();

    // If circuit is open, fail fast
    if (currentState === 'open') {
      if (fallback) {
        return fallback();
      }
      throw new CircuitBreakerOpenError(this.state, this.metrics);
    }

    // Execute the function
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      // Check if this is a gateway connection error
      const isConnectionError = isGatewayConnectionError(error);
      
      // Record the failure
      if (isConnectionError) {
        this.recordFailure();
      } else {
        // Non-connection errors don't count against circuit
        this.metrics.totalRequests++;
      }

      // If fallback provided, try it
      if (fallback) {
        return fallback();
      }

      throw error;
    }
  }

  /**
   * Check if a request is allowed without executing
   */
  async allowRequest(): Promise<boolean> {
    return this.isAvailable();
  }

  /**
   * Manually force the circuit open (for testing or emergency)
   */
  forceOpen(): void {
    this.transitionTo('open');
    this.metrics.lastFailureTime = Date.now();
  }

  /**
   * Manually force the circuit closed (after recovery)
   */
  forceClose(): void {
    this.transitionTo('closed');
    this.metrics = this.resetMetrics();
    this.failureTimestamps = [];
  }

  private shouldOpenCircuit(): boolean {
    const { failureThreshold, minimumRequests, failureRateThreshold } = this.options;
    
    // Check consecutive failures
    if (this.metrics.consecutiveFailures >= failureThreshold) {
      return true;
    }

    // Check failure rate if we have enough samples
    if (this.metrics.totalRequests >= minimumRequests) {
      const failureRate = this.metrics.failures / this.metrics.totalRequests;
      if (failureRate >= failureRateThreshold) {
        return true;
      }
    }

    // Check failures within time window
    if (this.failureTimestamps.length >= failureThreshold) {
      return true;
    }

    return false;
  }

  private shouldAttemptReset(): boolean {
    if (!this.metrics.lastFailureTime) {
      return true;
    }
    return Date.now() - this.metrics.lastFailureTime >= this.options.resetTimeoutMs;
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.metrics.lastStateChange = Date.now();
    }
  }

  /**
   * Get a health report for monitoring
   */
  getHealthReport(): {
    state: CircuitState;
    healthy: boolean;
    failureRate: number;
    lastFailureTime: number | null;
    consecutiveFailures: number;
  } {
    const now = Date.now();
    const windowStart = now - this.options.failureWindowMs;
    const windowFailures = this.failureTimestamps.filter(t => t >= windowStart).length;
    
    return {
      state: this.state,
      healthy: this.state === 'closed',
      failureRate: this.metrics.totalRequests > 0 
        ? this.metrics.failures / this.metrics.totalRequests 
        : 0,
      lastFailureTime: this.metrics.lastFailureTime,
      consecutiveFailures: this.metrics.consecutiveFailures,
    };
  }
}

// Singleton circuit breaker for gateway connections
let globalCircuitBreaker: CircuitBreaker | null = null;

/**
 * Get or create the global circuit breaker for gateway connections
 */
export function getCircuitBreaker(options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  if (!globalCircuitBreaker) {
    globalCircuitBreaker = new CircuitBreaker(options);
  }
  return globalCircuitBreaker;
}

/**
 * Reset the global circuit breaker (useful for testing)
 */
export function resetCircuitBreaker(): void {
  globalCircuitBreaker = null;
}
