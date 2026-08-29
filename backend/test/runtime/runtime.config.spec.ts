import { isCorsOriginAllowed, resolveRuntimeConfig } from '../../src/runtime/runtime.config';

const baseEnvironment = {
  DATABASE_URL: 'postgresql://example.invalid/nexi',
  REDIS_URL: 'redis://example.invalid:6379',
  JWT_SECRET: 'test-only-jwt-secret-with-sufficient-length',
};

describe('runtime configuration', () => {
  it('rejects missing required dependency URLs without using fallbacks', () => {
    expect(() => resolveRuntimeConfig({ REDIS_URL: baseEnvironment.REDIS_URL })).toThrow('DATABASE_URL');
    expect(() => resolveRuntimeConfig({ DATABASE_URL: baseEnvironment.DATABASE_URL })).toThrow('REDIS_URL');
  });

  it('rejects a missing JWT secret instead of using a fallback', () => {
    expect(() => resolveRuntimeConfig({
      DATABASE_URL: baseEnvironment.DATABASE_URL,
      REDIS_URL: baseEnvironment.REDIS_URL,
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
