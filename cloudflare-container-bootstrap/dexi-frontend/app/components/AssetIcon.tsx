'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { assetIconPath, findAsset } from '../lib/asset-registry';
import type { MarketPair } from '../hooks/useMarketData';

type AssetIconProps = {
  readonly item: Pick<MarketPair, 'assetId' | 'symbol' | 'displaySymbol' | 'name'>;
  readonly size?: 'sm' | 'md';
};

export default function AssetIcon({ item, size = 'sm' }: AssetIconProps) {
  const asset = findAsset(item.assetId) ?? findAsset(item.symbol) ?? findAsset(item.displaySymbol);
  const iconPath = assetIconPath(asset ?? { iconKey: undefined });
  const dimensions = size === 'md' ? 36 : 28;
  const fallback = (asset?.displaySymbol ?? item.displaySymbol).slice(0, 3).toUpperCase();
  const [sourceAvailable, setSourceAvailable] = useState(Boolean(iconPath));

  useEffect(() => setSourceAvailable(Boolean(iconPath)), [iconPath]);

  return (
    <span
      className={`nexi-token-mark relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${size === 'md' ? 'h-9 w-9' : 'h-7 w-7'}`}
      style={asset?.iconColor ? { backgroundColor: `#${asset.iconColor}26` } : undefined}
      aria-label={`${item.name} icon`}
      role="img"
    >
      {iconPath && sourceAvailable ? (
        <Image
          src={iconPath}
          alt=""
          width={dimensions}
          height={dimensions}
          unoptimized
          onError={() => setSourceAvailable(false)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[9px] font-bold tracking-[-0.04em] text-white/90" aria-hidden="true">{fallback}</span>
      )}
    </span>
  );
}
