import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MarketAuthorityService } from '../../src/market/market-authority.service';
import { MarketAssetMetadataService } from '../../src/market/market-asset-metadata.service';
import { MarketProviderRouterService } from '../../src/market/market-provider-router.service';
import { MarketPublicController } from '../../src/market/market-public.controller';

describe('MarketPublicController asset detail', () => {
  it('adds metadata to the existing canonical asset and leaves the list path untouched', async () => {
    const asset = { symbol: 'AAPLUSDT', category: 'stock', canonicalAssetId: 'stock:AAPL' };
    const details = { companyName: 'Apple Inc.', status: 'FRESH' };
    const authority = {
      getAsset: jest.fn<() => Promise<typeof asset>>().mockResolvedValue(asset),
      getAssets: jest.fn<() => Promise<typeof asset[]>>().mockResolvedValue([asset]),
    };
    const metadata = { getProfile: jest.fn<() => Promise<typeof details>>().mockResolvedValue(details) };
    const providers = {};

    const controller = new MarketPublicController(
      authority as unknown as MarketAuthorityService,
      providers as MarketProviderRouterService,
      metadata as unknown as MarketAssetMetadataService,
    );

    await expect(controller.getAsset('AAPLUSDT')).resolves.toEqual({ ...asset, details });
    await expect(controller.listAssets()).resolves.toEqual([asset]);
    expect(authority.getAsset).toHaveBeenCalledWith('AAPLUSDT');
    expect(metadata.getProfile).toHaveBeenCalledWith(asset);
    expect(authority.getAssets).toHaveBeenCalledTimes(1);
  });

  it('accepts a canonical ticker and enriches the resolved market pair', async () => {
    const asset = { symbol: 'BTCUSDT', category: 'crypto', canonicalAssetId: 'crypto:btc' };
    const details = { projectName: 'Bitcoin', status: 'FRESH' };
    const authority = { getAsset: jest.fn<() => Promise<typeof asset>>().mockResolvedValue(asset) };
    const metadata = { getProfile: jest.fn<() => Promise<typeof details>>().mockResolvedValue(details) };
    const controller = new MarketPublicController(
      authority as unknown as MarketAuthorityService,
      {} as MarketProviderRouterService,
      metadata as unknown as MarketAssetMetadataService,
    );

    await expect(controller.getAsset('BTC')).resolves.toEqual({ ...asset, details });
    expect(authority.getAsset).toHaveBeenCalledWith('BTC');
    expect(metadata.getProfile).toHaveBeenCalledWith(asset);
  });

  it('rejects malformed symbols at the HTTP boundary before calling the market authority', async () => {
    const authority = { getAsset: jest.fn<() => Promise<null>>().mockResolvedValue(null) };
    const metadata = { getProfile: jest.fn() };
    const controller = new MarketPublicController(
      authority as unknown as MarketAuthorityService,
      {} as MarketProviderRouterService,
      metadata as unknown as MarketAssetMetadataService,
    );

    await expect(controller.getAsset('B@TC')).rejects.toBeInstanceOf(BadRequestException);
    expect(authority.getAsset).not.toHaveBeenCalled();
    expect(metadata.getProfile).not.toHaveBeenCalled();
  });

  it('returns not found for a well-formed symbol outside the canonical catalog', async () => {
    const authority = { getAsset: jest.fn<() => Promise<null>>().mockResolvedValue(null) };
    const metadata = { getProfile: jest.fn() };
    const controller = new MarketPublicController(
      authority as unknown as MarketAuthorityService,
      {} as MarketProviderRouterService,
      metadata as unknown as MarketAssetMetadataService,
    );

    await expect(controller.getAsset('ZZZZZZ')).rejects.toBeInstanceOf(NotFoundException);
    expect(metadata.getProfile).not.toHaveBeenCalled();
  });
});
