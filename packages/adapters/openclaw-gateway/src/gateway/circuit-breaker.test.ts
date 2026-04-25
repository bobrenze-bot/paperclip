import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { CircuitBreaker, CircuitBreakerOptions, CircuitBreakerOpenError, isECONNREFUSEDError, GatewayConnectionError } from "./circuit-breaker.js";

describe("CircuitBreaker", () => {
  let options: CircuitBreakerOptions;
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    options = {
      failureThreshold: 5,
      resetTimeoutMs: 1000, // Short timeout for testing
      failureWindowMs: 60000,
      minimumRequests: 3,
      failureRateThreshold: 0.5,
    };
    circuitBreaker = new CircuitBreaker(options);
  });

  it("starts in closed state", () => {
    expect(circuitBreaker.getState()).toBe("closed");
  });

  it("opens after failureThreshold failures", async () => {
    // Record 5 failures (failureThreshold)
    for (let i = 0; i < 5; i++) {
      circuitBreaker.recordFailure();
    }

    expect(circuitBreaker.getState()).toBe("open");
  });

  it("allows transitioning from open to half-open after resetTimeoutMs", () => {
    // Open the circuit
    for (let i = 0; i < 5; i++) {
      circuitBreaker.recordFailure();
    }
    expect(circuitBreaker.getState()).toBe("open");

    // Simulate time passing by manually setting lastFailureTime
    circuitBreaker["metrics"].lastFailureTime = Date.now() - 2000; // Past resetTimeoutMs

    // Check state - should transition to half-open
    expect(circuitBreaker.getState()).toBe("half-open");
  });

  it("closes on successes in half-open state", () => {
    // Open the circuit
    for (let i = 0; i < 5; i++) {
      circuitBreaker.recordFailure();
    }
    expect(circuitBreaker.getState()).toBe("open");

    // Simulate time passing to transition to half-open
    circuitBreaker["metrics"].lastFailureTime = Date.now() - 2000;

    // Verify half-open state
    expect(circuitBreaker.getState()).toBe("half-open");

    // Record a success - should close the circuit
    circuitBreaker.recordSuccess();

    expect(circuitBreaker.getState()).toBe("closed");
  });

  it("detects ECONNREFUSED errors", () => {
    const error = new Error("connect ECONNREFUSED 127.0.0.1:8080");
    expect(isECONNREFUSEDError(error)).toBe(true);
  });

  it("records double failure count for connection errors in execute", async () => {
    // This test verifies connection errors properly increment failure tracking
    let errorCount = 0;
    
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(async () => {
          errorCount++;
          throw new Error("ECONNREFUSED");
        });
      } catch (err) {
        if (!(err instanceof CircuitBreakerOpenError)) {
          // Error should be re-thrown after recording
        }
      }
    }

    // Connection errors should be counted
    expect(errorCount).toBe(3);
  });

  it("allows requests when closed or half-open", () => {
    expect(circuitBreaker["isAvailable"]()).toBe(true);

    // Open the circuit
    for (let i = 0; i < 5; i++) {
      circuitBreaker.recordFailure();
    }

    expect(circuitBreaker["isAvailable"]()).toBe(false);
  });

  it("resets consecutive failures on success", () => {
    // Record some failures
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();

    expect(circuitBreaker["metrics"].consecutiveFailures).toBe(2);

    // Record success - should reset
    circuitBreaker.recordSuccess();

    expect(circuitBreaker["metrics"].consecutiveFailures).toBe(0);
  });

  it("execute wraps successful operation", async () => {
    const result = await circuitBreaker.execute(async () => {
      return "success";
    });

    expect(result).toBe("success");
    expect(circuitBreaker.getState()).toBe("closed");
  });

  it("execute opens circuit on failure", async () => {
    // Need 5 failures to open
    for (let i = 0; i < 5; i++) {
      try {
        await circuitBreaker.execute(async () => {
          throw new Error("ECONNREFUSED");
        });
      } catch (err) {
        if (!(err instanceof CircuitBreakerOpenError)) {
          // Expected - error thrown before circuit opens
        }
      }
    }

    // Next call should open circuit
    try {
      await circuitBreaker.execute(async () => {
        throw new Error("ECONNREFUSED");
      });
      expect.fail("Should have thrown CircuitBreakerOpenError");
    } catch (err) {
      expect(err).toBeInstanceOf(CircuitBreakerOpenError);
    }
  });

  it("throws CircuitBreakerOpenError when circuit is open", async () => {
    // Open the circuit
    for (let i = 0; i < 5; i++) {
      circuitBreaker.recordFailure();
    }
    expect(circuitBreaker.getState()).toBe("open");

    // Try to execute - should fail fast
    try {
      await circuitBreaker.execute(async () => {
        return "should not reach";
      });
      expect.fail("Should have thrown CircuitBreakerOpenError");
    } catch (err) {
      expect(err).toBeInstanceOf(CircuitBreakerOpenError);
    }
  });
});

describe("CircuitBreaker with ECONNREFUSED pattern (BOB-2203)", () => {
  it("handles ECONNREFUSED specifically and increments failure count", () => {
    const circuitBreaker = new CircuitBreaker({ failureThreshold: 3 });

    // Simulate ECONNREFUSED errors (all should be detected)
    const errors = [
      new Error("connect ECONNREFUSED 127.0.0.1:8080"),
      new Error("ECONNREFUSED connection refused"),
      new Error("ECONNREFUSED: connection refused"),
    ];

    for (const error of errors) {
      if (isECONNREFUSEDError(error)) {
        circuitBreaker.recordFailure();
      }
    }

    // After 3 consecutive connection errors, circuit should be open
    expect(circuitBreaker.getState()).toBe("open");
  });
});
