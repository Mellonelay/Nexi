import { ConfigService } from '@nestjs/config';
import { MarketArchiveService } from '../../src/market/market-archive.service';

describe('MarketArchiveService', () => {
  const trade = {
    kind: 'trade' as const,
    symbol: 'BTCUSDT', provider: 'binance-spot', source: 'websocket', providerInstrument: 'BTCUSDT',
    eventTime: 1_700_000_000_000, tradeId: 42, price: '100', quantity: '0.5', maker: false,
  };
  const depth = {
    kind: 'depth' as const,
    symbol: 'BTCUSDT', provider: 'binance-spot', source: 'websocket', providerInstrument: 'BTCUSDT',
    eventTime: 1_700_000_000_000, updateId: 123456, bids: [['100', '1']] as Array<[string, string]>, asks: [['101', '2']] as Array<[string, string]>,
  };

  afterEach(() => jest.restoreAllMocks());

  it('is inert when no pipeline endpoint is configured', async () => {
    const service = new MarketArchiveService(new ConfigService({}));
    await expect(service.archive(trade)).resolves.toBe(false);
  });

  it('posts a versioned event envelope to the configured pipeline', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 202 }));
    const service = new MarketArchiveService(new ConfigService({
      MARKET_ARCHIVE_PIPELINE_URL: 'https://pipeline.example.test/ingest',
      MARKET_ARCHIVE_PIPELINE_TOKEN: 'test-token',
      MARKET_ARCHIVE_PIPELINE_FORMAT: 'structured',
    }));

    await expect(service.archive(trade)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('https://pipeline.example.test/ingest', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ authorization: 'Bearer test-token' }),
      body: expect.stringContaining('"schema_version":1'),
    }));
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body).toHaveLength(1);
    expect(body[0]).toEqual(expect.objectContaining({
      archive_event_type: 'trade',
      canonical_symbol: 'BTCUSDT',
      provider: 'binance-spot',
      provider_instrument: 'BTCUSDT',
      price: '100',
      quantity: '0.5',
      schema_version: 1,
    }));
    expect(typeof body[0].trade_id).toBe('string');
  });

  it('serializes numeric provider depth identifiers as strings for the immutable stream schema', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 202 }));
    const service = new MarketArchiveService(new ConfigService({
      MARKET_ARCHIVE_PIPELINE_URL: 'https://pipeline.example.test/ingest',
      MARKET_ARCHIVE_PIPELINE_FORMAT: 'structured',
    }));

    await expect(service.archive(depth)).resolves.toBe(true);
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body[0].update_id).toBe('123456');
    expect(typeof body[0].update_id).toBe('string');
  });

  it('fails closed when required archive delivery is rejected', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 503 }));
    const service = new MarketArchiveService(new ConfigService({
      MARKET_ARCHIVE_PIPELINE_URL: 'https://pipeline.example.test/ingest',
      MARKET_ARCHIVE_REQUIRED: 'true',
    }));

    await expect(service.archive(trade)).rejects.toThrow('HTTP 503');
  });
});
