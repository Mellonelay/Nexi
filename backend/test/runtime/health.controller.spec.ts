import { HealthController } from '../../src/observability/health.controller';

describe('HealthController', () => {
  it('reports liveness without dependency access', () => {
    const controller = new HealthController({} as any, {} as any);
    expect(controller.live()).toEqual({ status: 'ok', service: 'nexi-api' });
  });

  it('reports readiness when PostgreSQL and Redis are healthy', async () => {
    const controller = new HealthController(
      { $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]) } as any,
      { isReady: jest.fn().mockResolvedValue(true) } as any,
    );
    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
      dependencies: { database: true, redis: true },
    });
  });

  it('returns a service-unavailable error when a dependency is down', async () => {
    const controller = new HealthController(
      { $queryRaw: jest.fn().mockRejectedValue(new Error('database unavailable')) } as any,
      { isReady: jest.fn().mockResolvedValue(true) } as any,
    );
    await expect(controller.ready()).rejects.toMatchObject({
      status: 503,
      response: { status: 'not_ready', dependencies: { database: false, redis: true } },
    });
  });
});
