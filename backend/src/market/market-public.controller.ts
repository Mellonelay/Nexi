import { BadRequestException, Controller, Get, NotFoundException, Query, Param, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MarketAuthorityService } from './market-authority.service';
import { MarketProviderRouterService } from './market-provider-router.service';
import { MarketAssetMetadataService } from './market-asset-metadata.service';

@ApiTags('Market Data')
@Controller('market')
export class MarketPublicController {
  constructor(
    private readonly authority: MarketAuthorityService,
    private readonly providers: MarketProviderRouterService,
    private readonly metadata: MarketAssetMetadataService,
  ) {}

  @Get('assets')
  listAssets() { return this.authority.getAssets(); }

  @Get('assets/:symbol')
  async getAsset(@Param('symbol') symbol: string) {
    const asset = await this.authority.getAsset(symbol);
    if (!asset) throw new NotFoundException('Market asset is unavailable');
    return { ...asset, details: await this.metadata.getProfile(asset) };
  }

  @Get('provider-state')
  providerState() { return this.providers.currentStatus(); }

  @Get('depth')
  async depth(@Query('symbol') symbol?: string, @Query('pair') pair?: string, @Query('limit') limitInput?: string) {
    const instrument = this.requiredInstrument(symbol ?? pair);
    const limit = this.boundedLimit(limitInput, 20, 100);
    const depth = await this.providers.fetchDepth(instrument, limit);
    if (!depth) throw new ServiceUnavailableException({ state: 'UNAVAILABLE', reason: 'PROVIDER_UNAVAILABLE' });
    return depth;
  }

  @Get('trades')
  async trades(@Query('symbol') symbol?: string, @Query('pair') pair?: string, @Query('limit') limitInput?: string) {
    const instrument = this.requiredInstrument(symbol ?? pair);
    const limit = this.boundedLimit(limitInput, 50, 100);
    const trades = await this.providers.fetchTrades(instrument, limit);
    if (!trades) throw new ServiceUnavailableException({ state: 'UNAVAILABLE', reason: 'PROVIDER_UNAVAILABLE' });
    return trades;
  }

  private requiredInstrument(value?: string): string {
    const normalized = value?.trim().toUpperCase().replaceAll('/', '');
    if (!normalized || !/^[A-Z0-9]{5,24}$/.test(normalized)) throw new BadRequestException('symbol or pair is required');
    return normalized;
  }

  private boundedLimit(value: string | undefined, fallback: number, max: number): number {
    if (value === undefined) return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) throw new BadRequestException(`limit must be between 1 and ${max}`);
    return parsed;
  }
}
