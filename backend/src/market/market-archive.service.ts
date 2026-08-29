import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderDepthEvent, ProviderTradeEvent } from './market-provider.adapter';

type ArchiveEvent = ProviderDepthEvent | ProviderTradeEvent;

@Injectable()
export class MarketArchiveService {
  private readonly logger = new Logger(MarketArchiveService.name);

  constructor(private readonly config: ConfigService) {}

  isRequired(): boolean {
    return this.config.get('MARKET_ARCHIVE_REQUIRED', 'false') === 'true';
  }

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('MARKET_ARCHIVE_PIPELINE_URL'));
  }

  async archive(event: ArchiveEvent): Promise<boolean> {
    const endpoint = this.config.get<string>('MARKET_ARCHIVE_PIPELINE_URL');
    if (!endpoint) {
      if (this.isRequired()) throw new Error('Market archive pipeline is required but not configured');
      return false;
    }

    const structured = this.config.get('MARKET_ARCHIVE_PIPELINE_FORMAT', 'structured') === 'structured';
    const eventTime = new Date(event.eventTime);
    const receivedTime = new Date();
    const payload = {
      schema_version: 1,
      archive_event_type: event.kind,
      canonical_symbol: event.symbol,
      provider: event.provider,
      source: event.source,
      provider_instrument: event.providerInstrument,
      event_time: structured ? eventTime.getTime() : eventTime.toISOString(),
      received_time: structured ? receivedTime.getTime() : receivedTime.toISOString(),
      ...(event.kind === 'trade'
        ? { trade_id: String(event.tradeId), price: event.price, quantity: event.quantity, maker: event.maker }
        : { update_id: String(event.updateId), bids: event.bids, asks: event.asks }),
    };
    const token = this.config.get<string>('MARKET_ARCHIVE_PIPELINE_TOKEN');
    // Structured streams accept the normalized columns directly, allowing the
    // Data Catalog/Iceberg sink to expose queryable fields.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify([structured ? payload : { value: payload }]),
    });
    if (!response.ok) {
      this.logger.warn(`Market archive rejected ${event.kind}: HTTP ${response.status}`);
      if (this.isRequired()) throw new Error(`Market archive rejected event: HTTP ${response.status}`);
      return false;
    }
    return true;
  }
}
