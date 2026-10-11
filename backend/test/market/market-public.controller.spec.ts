import { jest } from '@jest/globals';
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
});
