import { HealthController } from '../../src/observability/health.controller';
import { ReadinessService } from '../../src/observability/readiness.service';

describe('HealthController', () => {
  it('reports liveness without dependency access', () => {
    const controller = new HealthController({} as ReadinessService);
    expect(controller.live()).toEqual({ status: 'ok', service: 'nexi-api' });
  });

  it('reports readiness when D1 and Redis are healthy', async () => {
    const controller = new HealthController(
      new ReadinessService(
        {
          isReady: jest.fn().mockResolvedValue(true),
          isLocalMode: jest.fn().mockReturnValue(false),
        } as any,
        { isReady: jest.fn().mockResolvedValue(true) } as any,
      ),
    );
    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
      dependencies: { database: true, redis: true },
    });
  });

  it('returns a service-unavailable error when a dependency is down', async () => {
    const controller = new HealthController(
      new ReadinessService(
        {
          isReady: jest.fn().mockResolvedValue(false),
          isLocalMode: jest.fn().mockReturnValue(false),
        } as any,
        { isReady: jest.fn().mockResolvedValue(true) } as any,
      ),
    );
    await expect(controller.ready()).rejects.toMatchObject({
      status: 503,
      response: { status: 'not_ready', dependencies: { database: false, redis: true } },
    });
  });
});
