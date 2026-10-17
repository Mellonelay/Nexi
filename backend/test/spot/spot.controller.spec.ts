import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SpotController } from '../../src/spot/spot.controller';
import { SpotPairQueryDto } from '../../src/spot/spot.dto';

describe('SpotController public pair queries', () => {
  // Mirrors the global pipe registered in src/main.ts.
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const metadata = { type: 'query' as const, metatype: SpotPairQueryDto, data: '' };

  it.each([
    ['missing', {}],
    ['empty', { pair: '' }],
    ['too short', { pair: 'BT' }],
  ])('rejects a %s pair with 400 before reaching the service', async (_label, query) => {
    await expect(pipe.transform(query, metadata)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts a valid pair and forwards it to the order book and market trades services', async () => {
    const query = (await pipe.transform({ pair: 'BTCUSDT' }, metadata)) as SpotPairQueryDto;
    const spotService = {
      getOrderBook: jest.fn().mockResolvedValue({ pair: 'BTCUSDT', bids: [], asks: [] }),
      getMarketTrades: jest.fn().mockResolvedValue([]),
    };
    const controller = new SpotController(spotService as any);

    await controller.getOrderBook(query);
    await controller.getMarketTrades(query);

    expect(spotService.getOrderBook).toHaveBeenCalledWith('BTCUSDT');
    expect(spotService.getMarketTrades).toHaveBeenCalledWith('BTCUSDT');
  });
});
