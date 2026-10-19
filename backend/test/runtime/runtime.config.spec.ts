import { isCorsOriginAllowed, resolveRuntimeConfig } from '../../src/runtime/runtime.config';

const baseEnvironment = {
  NEXI_SQLITE_LOCAL_ENABLED: 'true',
  NEXI_LOCAL_SQLITE_PATH: '/tmp/nexi-test.sqlite',
  REDIS_URL: 'redis://example.invalid:6379',
  JWT_SECRET: 'test-only-jwt-secret-with-sufficient-length',
};

describe('runtime configuration', () => {
  it('defaults the bind host to all interfaces and honors an explicit host', () => {
    expect(resolveRuntimeConfig(baseEnvironment).host).toBe('0.0.0.0');
    expect(resolveRuntimeConfig({ ...baseEnvironment, HOST: '127.0.0.1' }).host).toBe('127.0.0.1');
  });

  it('requires explicit local SQLite authority', () => {
    expect(() => resolveRuntimeConfig({ REDIS_URL: baseEnvironment.REDIS_URL })).toThrow('NEXI_SQLITE_LOCAL_ENABLED');
    expect(() => resolveRuntimeConfig({ ...baseEnvironment, NEXI_SQLITE_LOCAL_ENABLED: 'false' })).toThrow('NEXI_SQLITE_LOCAL_ENABLED must be true');
  });

  it('rejects a missing JWT secret instead of using a fallback', () => {
    expect(() => resolveRuntimeConfig({
      REDIS_URL: baseEnvironment.REDIS_URL,
      NEXI_SQLITE_LOCAL_ENABLED: baseEnvironment.NEXI_SQLITE_LOCAL_ENABLED,
      NEXI_LOCAL_SQLITE_PATH: baseEnvironment.NEXI_LOCAL_SQLITE_PATH,
    })).toThrow('JWT_SECRET');
  });

  it('uses only an explicit local CORS allowlist outside production', () => {
    expect(resolveRuntimeConfig(baseEnvironment).corsOrigins).toEqual([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
  });

  it('requires CORS_ORIGINS in production and parses an explicit allowlist', () => {
    expect(() => resolveRuntimeConfig({ ...baseEnvironment, NODE_ENV: 'production' })).toThrow('CORS_ORIGINS');

    expect(resolveRuntimeConfig({
      ...baseEnvironment,
      NODE_ENV: 'production',
      PORT: '4100',
      CORS_ORIGINS: 'https://app.example.test, https://admin.example.test',
    })).toMatchObject({
      port: 4100,
      corsOrigins: ['https://app.example.test', 'https://admin.example.test'],
    });
  });

  it('denies websocket origins outside the configured allowlist', () => {
    expect(isCorsOriginAllowed('http://localhost:3000', baseEnvironment)).toBe(true);
    expect(isCorsOriginAllowed('https://untrusted.example.test', baseEnvironment)).toBe(false);
    expect(isCorsOriginAllowed(undefined, baseEnvironment)).toBe(false);
  });
});
