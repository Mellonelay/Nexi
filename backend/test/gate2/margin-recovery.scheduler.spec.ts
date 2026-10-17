import { MarginRecoveryScheduler } from '../../src/spot/margin-recovery.scheduler';

describe('Margin recovery scheduler', () => {
  const env = process.env.NEXI_SCHEDULER_ENABLED;
  afterAll(() => {
    if (env === undefined) delete process.env.NEXI_SCHEDULER_ENABLED;
    else process.env.NEXI_SCHEDULER_ENABLED = env;
  });
  it('skips when scheduling is disabled', async () => {
    process.env.NEXI_SCHEDULER_ENABLED = 'false';
    const margin: any = { closePosition: jest.fn(), liquidatePosition: jest.fn() };
    const gateway: any = { listPendingMarginCloses: jest.fn() };
    const redis: any = { tryAcquireLock: jest.fn() };
    const result = await new MarginRecoveryScheduler(margin, gateway, redis).recoverFilledCloses();
    expect(result).toMatchObject({processed:0,skipped:'scheduler-disabled'});
    expect(gateway.listPendingMarginCloses).not.toHaveBeenCalled();
  });
  it('uses only the original close key and releases its lock', async () => {
    process.env.NEXI_SCHEDULER_ENABLED = 'true';
    const margin: any = {
      closePosition: jest.fn().mockResolvedValue({state:'CLOSED'}),
      liquidatePosition: jest.fn().mockResolvedValue({state:'LIQUIDATED'}),
    };
    const gateway: any = { listPendingMarginCloses: jest.fn().mockResolvedValue([
      {positionId:'one',userId:'alice',closeOrderId:'order-1',idempotencyKey:'original-close',liquidation:false},
      {positionId:'two',userId:'bob',closeOrderId:'order-2',idempotencyKey:'original-liquidation',liquidation:true},
    ]) };
    const redis: any = { tryAcquireLock: jest.fn().mockResolvedValue(true), releaseLock: jest.fn().mockResolvedValue(undefined) };
    const result = await new MarginRecoveryScheduler(margin, gateway, redis).recoverFilledCloses();
    expect(result).toMatchObject({processed:2,failed:0});
    expect(margin.closePosition).toHaveBeenCalledWith('alice','one','original-close');
    expect(margin.liquidatePosition).toHaveBeenCalledWith('bob','two','original-liquidation');
    expect(redis.releaseLock).toHaveBeenCalledTimes(1);
  });
  it('records individual failures without preventing other completed closes', async () => {
    process.env.NEXI_SCHEDULER_ENABLED = 'true';
    const margin: any = {
      closePosition: jest.fn().mockRejectedValueOnce(Error('insufficient debt repayment funds')).mockResolvedValueOnce({state:'CLOSED'}),
      liquidatePosition: jest.fn(),
    };
    const gateway: any = { listPendingMarginCloses: jest.fn().mockResolvedValue([
      {positionId:'one',userId:'alice',idempotencyKey:'close-one',liquidation:false},
      {positionId:'two',userId:'alice',idempotencyKey:'close-two',liquidation:false},
    ]) };
    const redis: any = { tryAcquireLock: jest.fn().mockResolvedValue(true), releaseLock: jest.fn().mockResolvedValue(undefined) };
    expect(await new MarginRecoveryScheduler(margin,gateway,redis).recoverFilledCloses()).toMatchObject({processed:1,failed:1});
    expect(redis.releaseLock).toHaveBeenCalledTimes(1);
  });
});
