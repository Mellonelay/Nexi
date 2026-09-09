import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  MarginPositionDirection,
  LiquidateMarginPositionDto,
  OpenMarginPositionDto,
} from '../../src/spot/margin.dto';

describe('Spot isolated margin DTO contract', () => {
  it('normalizes pair identifiers and accepts a leverage within the configurable safety range', async () => {
    const dto = plainToInstance(OpenMarginPositionDto, {
      pair: ' btc/usdt ',
      direction: MarginPositionDirection.LONG,
      leverage: '3',
      collateral: '12.500000000000000000',
      idempotencyKey: 'margin-open-12345678',
    });

    expect(dto.pair).toBe('BTC/USDT');
    expect(dto.leverage).toBe(3);
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([1, 21])('rejects leverage outside the configurable safety range %d', async (leverage) => {
    const dto = plainToInstance(OpenMarginPositionDto, {
      pair: 'BTC/USDT',
      direction: 'SHORT',
      leverage,
      collateral: '1',
      idempotencyKey: 'margin-open-12345678',
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it.each(['0', '0.000000000000000000', '-1', '1.1234567890123456789'])
    ('rejects non-positive or over-precision collateral %s', async (collateral) => {
      const dto = plainToInstance(OpenMarginPositionDto, {
        pair: 'BTC/USDT',
        direction: 'LONG',
        leverage: 2,
        collateral,
        idempotencyKey: 'margin-open-12345678',
      });

      await expect(validate(dto)).resolves.not.toHaveLength(0);
    });

  it('rejects malformed pair and direction values', async () => {
    const dto = plainToInstance(OpenMarginPositionDto, {
      pair: 'BTC-USDT',
      direction: 'CROSS',
      leverage: 5,
      collateral: '1',
      idempotencyKey: 'margin-open-12345678',
    });

    await expect(validate(dto)).resolves.toHaveLength(2);
  });

  it('does not accept a client-controlled liquidation threshold', async () => {
    const dto = plainToInstance(LiquidateMarginPositionDto, {
      maintenanceRatio: '0.01',
      idempotencyKey: 'margin-liquidation-12345678',
    });

    await expect(validate(dto, { whitelist: true, forbidNonWhitelisted: true })).resolves.not.toHaveLength(0);
  });
});
