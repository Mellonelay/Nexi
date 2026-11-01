'use client';

import { useId } from 'react';
import type { MarketPair } from '../../hooks/useMarketData';
import AssetIcon from '../../components/AssetIcon';

export function AssetMark({ item, large = false }: { item: MarketPair; large?: boolean }) {
  return (
    <span className={`nexi-token-mark relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${large ? 'h-8 w-8 md:h-[58px] md:w-[58px]' : 'h-8 w-8 md:h-11 md:w-11'}`}>
      <AssetIcon item={item} size={large ? 'md' : 'sm'} />
    </span>
  );
}

export function MarketSparkline({ item, compact = false }: { item: MarketPair; compact?: boolean }) {
  const gradientId = useId().replace(/:/g, '');
  const width = compact ? 108 : 136;
  const height = compact ? 36 : 44;
  const hasMarketSeries = (item.dataState === 'LIVE' || item.sessionState === 'CLOSED') && item.source !== 'fallback' && Boolean(item.sparkline && item.sparkline.length > 1);

  if (!hasMarketSeries) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={compact ? 'h-9 w-[108px]' : 'h-11 w-[136px]'} role="img" aria-label={`${item.displaySymbol} market series unavailable`}>
        <line x1="4" y1={height / 2} x2={width - 4} y2={height / 2} stroke="var(--nexi-cal-cyan)" strokeWidth="1.25" strokeDasharray="5 6" strokeLinecap="round" opacity="0.34" />
      </svg>
    );
  }

  const points = item.sparkline!;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const mapped = points.map((point, index) => {
    const x = 3 + (index / (points.length - 1)) * (width - 6);
    const y = height - 4 - ((point - min) / range) * (height - 10);
    return `${x},${y}`;
  }).join(' ');
  const area = `3,${height - 2} ${mapped} ${width - 3},${height - 2}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={compact ? 'h-9 w-[108px]' : 'h-11 w-[136px]'} role="img" aria-label={`${item.displaySymbol} ${item.sessionState === 'CLOSED' ? 'closed market' : 'market'} sparkline`}>
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--nexi-cal-cyan)" stopOpacity="0.28" /><stop offset="1" stopColor="var(--nexi-cal-cyan)" stopOpacity="0" /></linearGradient></defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline points={mapped} fill="none" stroke="var(--nexi-cal-cyan)" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function NexiLogoMark({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const gradientId = useId().replace(/:/g, '');
  const highlightId = `${gradientId}-highlight`;

  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="NEXI"
      className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="7" y1="42" x2="41" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#542FA4" />
          <stop offset="0.48" stopColor="#6D41FF" />
          <stop offset="1" stopColor="#B06CFF" />
        </linearGradient>
        <linearGradient id={highlightId} x1="15" y1="8" x2="34" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D9C5FF" stopOpacity="0.82" />
          <stop offset="0.42" stopColor="#8E5BE2" stopOpacity="0.34" />
          <stop offset="1" stopColor="#351B7C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M7 40.5 12.8 8l10.4 7.4-5.8 29.2L7 40.5Z" fill={`url(#${gradientId})`} />
      <path d="m13 8 10.2 7.4 12.2 19.1-9.7-6.6L13 8Z" fill={`url(#${highlightId})`} />
      <path d="m25.6 27.8 9.8 6.7L41.2 7 31 13.8l-5.4 14Z" fill={`url(#${gradientId})`} />
      <path d="m9.1 31.6 8.4 5.5-1.4 7.4L7 40.5l2.1-8.9Z" fill="#8E5BE2" fillOpacity="0.54" />
    </svg>
  );
}

export function NexiWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <NexiLogoMark compact={compact} className="drop-shadow-[0_0_12px_rgba(109,65,255,.5)]" />
      <span className={`${compact ? 'text-lg' : 'text-xl'} font-semibold tracking-[0.13em] text-white`}>NEXI</span>
    </span>
  );
}
