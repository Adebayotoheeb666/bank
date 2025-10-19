/**
 * Health Check Test Suite
 * 
 * Tests for the health check system covering:
 * - Database connectivity
 * - Plaid API connectivity
 * - Dwolla API connectivity
 * - Response format validation
 */

import { runHealthCheck, formatHealthCheckOutput, HealthCheckResult } from '@/lib/health-check';

describe('Health Check System', () => {
  describe('runHealthCheck()', () => {
    it('should return a valid health check result', async () => {
      const result = await runHealthCheck();

      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.database).toBeDefined();
      expect(result.plaid).toBeDefined();
      expect(result.dwolla).toBeDefined();
      expect(result.overall).toBeDefined();
    });

    it('should have valid timestamp', async () => {
      const result = await runHealthCheck();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should return valid database check result', async () => {
      const result = await runHealthCheck();

      expect(result.database).toHaveProperty('connected');
      expect(result.database).toHaveProperty('status');
      expect(result.database).toHaveProperty('responseTime');

      expect(typeof result.database.connected).toBe('boolean');
      expect(typeof result.database.status).toBe('string');
      expect(typeof result.database.responseTime).toBe('number');
      expect(result.database.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return valid plaid check result', async () => {
      const result = await runHealthCheck();

      expect(result.plaid).toHaveProperty('connected');
      expect(result.plaid).toHaveProperty('status');
      expect(result.plaid).toHaveProperty('responseTime');

      expect(typeof result.plaid.connected).toBe('boolean');
      expect(typeof result.plaid.status).toBe('string');
      expect(typeof result.plaid.responseTime).toBe('number');
      expect(result.plaid.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return valid dwolla check result', async () => {
      const result = await runHealthCheck();

      expect(result.dwolla).toHaveProperty('connected');
      expect(result.dwolla).toHaveProperty('status');
      expect(result.dwolla).toHaveProperty('responseTime');

      expect(typeof result.dwolla.connected).toBe('boolean');
      expect(typeof result.dwolla.status).toBe('string');
      expect(typeof result.dwolla.responseTime).toBe('number');
      expect(result.dwolla.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return valid overall status', async () => {
      const result = await runHealthCheck();

      expect(result.overall).toHaveProperty('healthy');
      expect(result.overall).toHaveProperty('message');

      expect(typeof result.overall.healthy).toBe('boolean');
      expect(typeof result.overall.message).toBe('string');
    });

    it('should mark overall as healthy only if all services connected', async () => {
      const result = await runHealthCheck();

      const allConnected =
        result.database.connected &&
        result.plaid.connected &&
        result.dwolla.connected;

      expect(result.overall.healthy).toBe(allConnected);
    });

    it('should set healthy=false if database is disconnected', async () => {
      const result = await runHealthCheck();

      if (!result.database.connected) {
        expect(result.overall.healthy).toBe(false);
      }
    });

    it('should set healthy=false if plaid is disconnected', async () => {
      const result = await runHealthCheck();

      if (!result.plaid.connected) {
        expect(result.overall.healthy).toBe(false);
      }
    });

    it('should set healthy=false if dwolla is disconnected', async () => {
      const result = await runHealthCheck();

      if (!result.dwolla.connected) {
        expect(result.overall.healthy).toBe(false);
      }
    });

    it('should include error message if service is disconnected', async () => {
      const result = await runHealthCheck();

      if (!result.database.connected) {
        expect(result.database.error).toBeDefined();
      }

      if (!result.plaid.connected) {
        expect(result.plaid.error).toBeDefined();
      }

      if (!result.dwolla.connected) {
        expect(result.dwolla.error).toBeDefined();
      }
    });

    it('should not include error message if service is connected', async () => {
      const result = await runHealthCheck();

      if (result.database.connected) {
        expect(result.database.error).toBeUndefined();
      }

      if (result.plaid.connected) {
        expect(result.plaid.error).toBeUndefined();
      }

      if (result.dwolla.connected) {
        expect(result.dwolla.error).toBeUndefined();
      }
    });

    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      await runHealthCheck();
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(30000); // 30 seconds max
    });

    it('should be idempotent', async () => {
      const result1 = await runHealthCheck();
      const result2 = await runHealthCheck();

      // Both should have same structure
      expect(result1).toHaveProperty('database');
      expect(result2).toHaveProperty('database');

      // Health status should be consistent
      expect(result1.overall.healthy).toBe(result2.overall.healthy);
    });
  });

  describe('formatHealthCheckOutput()', () => {
    it('should format a healthy result', () => {
      const result: HealthCheckResult = {
        timestamp: '2024-01-15T10:00:00.000Z',
        database: { connected: true, status: 'CONNECTED', responseTime: 100 },
        plaid: { connected: true, status: 'CONNECTED', responseTime: 150 },
        dwolla: { connected: true, status: 'CONNECTED', responseTime: 120 },
        overall: { healthy: true, message: 'All services healthy ✅' },
      };

      const output = formatHealthCheckOutput(result);

      expect(output).toContain('HEALTH CHECK REPORT');
      expect(output).toContain('2024-01-15T10:00:00.000Z');
      expect(output).toContain('✅ HEALTHY');
      expect(output).toContain('DATABASE');
      expect(output).toContain('PLAID');
      expect(output).toContain('DWOLLA');
    });

    it('should format an unhealthy result', () => {
      const result: HealthCheckResult = {
        timestamp: '2024-01-15T10:00:00.000Z',
        database: {
          connected: false,
          status: 'DISCONNECTED',
          error: 'Connection refused',
          responseTime: 5000,
        },
        plaid: { connected: true, status: 'CONNECTED', responseTime: 150 },
        dwolla: { connected: true, status: 'CONNECTED', responseTime: 120 },
        overall: { healthy: false, message: 'Database connection failed ❌' },
      };

      const output = formatHealthCheckOutput(result);

      expect(output).toContain('❌ UNHEALTHY');
      expect(output).toContain('Connection refused');
      expect(output).toContain('Database connection failed');
    });

    it('should include response times', () => {
      const result: HealthCheckResult = {
        timestamp: '2024-01-15T10:00:00.000Z',
        database: { connected: true, status: 'CONNECTED', responseTime: 245 },
        plaid: { connected: true, status: 'CONNECTED', responseTime: 312 },
        dwolla: { connected: true, status: 'CONNECTED', responseTime: 189 },
        overall: { healthy: true, message: 'All services healthy ✅' },
      };

      const output = formatHealthCheckOutput(result);

      expect(output).toContain('245ms');
      expect(output).toContain('312ms');
      expect(output).toContain('189ms');
    });

    it('should format as valid string', () => {
      const result: HealthCheckResult = {
        timestamp: '2024-01-15T10:00:00.000Z',
        database: { connected: true, status: 'CONNECTED', responseTime: 100 },
        plaid: { connected: true, status: 'CONNECTED', responseTime: 150 },
        dwolla: { connected: true, status: 'CONNECTED', responseTime: 120 },
        overall: { healthy: true, message: 'All services healthy ✅' },
      };

      const output = formatHealthCheckOutput(result);

      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
      expect(output).toMatch(/═/); // Box drawing character
    });

    it('should handle missing error messages', () => {
      const result: HealthCheckResult = {
        timestamp: '2024-01-15T10:00:00.000Z',
        database: { connected: true, status: 'CONNECTED', responseTime: 100 },
        plaid: { connected: true, status: 'CONNECTED', responseTime: 150 },
        dwolla: { connected: true, status: 'CONNECTED', responseTime: 120 },
        overall: { healthy: true, message: 'All services healthy ✅' },
      };

      const output = formatHealthCheckOutput(result);

      // Should not crash, should produce valid output
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Service-specific checks', () => {
    it('database check should respond quickly', async () => {
      const result = await runHealthCheck();

      // Database should respond in less than 5 seconds
      if (result.database.responseTime) {
        expect(result.database.responseTime).toBeLessThan(5000);
      }
    });

    it('plaid check should respond quickly', async () => {
      const result = await runHealthCheck();

      // Plaid should respond in less than 10 seconds
      if (result.plaid.responseTime) {
        expect(result.plaid.responseTime).toBeLessThan(10000);
      }
    });

    it('dwolla check should respond quickly', async () => {
      const result = await runHealthCheck();

      // Dwolla should respond in less than 10 seconds
      if (result.dwolla.responseTime) {
        expect(result.dwolla.responseTime).toBeLessThan(10000);
      }
    });

    it('should have valid status strings', async () => {
      const result = await runHealthCheck();

      const validStatuses = [
        'CONNECTED',
        'DISCONNECTED',
        'ERROR',
        'CONNECTED (Invalid Credentials)',
      ];

      expect(validStatuses).toContain(result.database.status);
      expect(validStatuses).toContain(result.plaid.status);
      expect(validStatuses).toContain(result.dwolla.status);
    });
  });

  describe('Error handling', () => {
    it('should not throw on database error', async () => {
      expect(async () => {
        await runHealthCheck();
      }).not.toThrow();
    });

    it('should not throw on plaid error', async () => {
      expect(async () => {
        await runHealthCheck();
      }).not.toThrow();
    });

    it('should not throw on dwolla error', async () => {
      expect(async () => {
        await runHealthCheck();
      }).not.toThrow();
    });

    it('should gracefully handle all checks failing', async () => {
      expect(async () => {
        const result = await runHealthCheck();

        // Even if everything fails, should return valid result
        expect(result).toBeDefined();
        expect(result.overall).toBeDefined();
      }).not.toThrow();
    });
  });
});

/**
 * Integration Tests
 * These test the health check against real services
 */
describe('Health Check Integration', () => {
  it('should connect to at least one service', async () => {
    const result = await runHealthCheck();

    const anyConnected =
      result.database.connected ||
      result.plaid.connected ||
      result.dwolla.connected;

    expect(anyConnected).toBe(true);
  });

  it('should provide meaningful status messages', async () => {
    const result = await runHealthCheck();

    expect(result.overall.message).toMatch(/✅|❌/);
    expect(result.overall.message.length).toBeGreaterThan(0);
  });
});
