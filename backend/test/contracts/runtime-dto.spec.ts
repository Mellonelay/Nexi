import 'reflect-metadata';
import { validate } from 'class-validator';
import { SpotOrderInputDto, WalletMutationInputDto } from '../../src/contracts/runtime.dto';

describe('NEXI runtime DTO boundaries', () => {
  it('accepts valid Spot input', async () => {
    const dto = Object.assign(new SpotOrderInputDto(), { accountId: 'account-1', pair: 'BTC/USDT', side: 'BUY', type: 'LIMIT', amount: 1, limitPrice: 2, idempotencyKey: 'idempotency-key-1' });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });
  it('rejects invalid amount and unknown client balance fields', async () => {
    const dto = Object.assign(new WalletMutationInputDto(), { accountId: 'account-1', asset: 'USDT', amount: 0, idempotencyKey: 'idempotency-key-1', clientBalance: 100 });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.length).toBeGreaterThan(0);
  });
});
