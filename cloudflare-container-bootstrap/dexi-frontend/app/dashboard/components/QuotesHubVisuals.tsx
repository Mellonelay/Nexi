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
  const hasLiveSeries = item.dataState === 'LIVE' && item.source !== 'fallback' && Boolean(item.sparkline && item.sparkline.length > 1);

  if (!hasLiveSeries) {
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
    <svg viewBox={`0 0 ${width} ${height}`} className={compact ? 'h-9 w-[108px]' : 'h-11 w-[136px]'} role="img" aria-label={`${item.displaySymbol} market sparkline`}>
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--nexi-cal-cyan)" stopOpacity="0.28" /><stop offset="1" stopColor="var(--nexi-cal-cyan)" stopOpacity="0" /></linearGradient></defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline points={mapped} fill="none" stroke="var(--nexi-cal-cyan)" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function OpportunityArtwork() {
  const artId = useId().replace(/:/g, '');
  const sphereId = `${artId}-sphere`;
  const chartId = `${artId}-chart`;

  return (
    <div aria-hidden="true" className="nexi-opportunity-art pointer-events-none absolute inset-0 overflow-hidden">
      <svg viewBox="0 0 960 240" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id={sphereId} cx="38%" cy="34%" r="70%">
            <stop offset="0" stopColor="#a78bfa" stopOpacity="0.42" />
            <stop offset="0.5" stopColor="#7353dd" stopOpacity="0.2" />
            <stop offset="1" stopColor="#180848" stopOpacity="0.03" />
          </radialGradient>
          <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7c3aed" stopOpacity="0.72" />
            <stop offset="1" stopColor="#2c146c" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <g transform="translate(36 22)">
          <circle cx="104" cy="98" r="70" fill={`url(#${sphereId})`} stroke="#a78bfa" strokeOpacity="0.42" strokeWidth="1.4" />
          <ellipse cx="104" cy="98" rx="70" ry="24" fill="none" stroke="#7c3aed" strokeOpacity="0.62" strokeWidth="1.4" />
          <ellipse cx="104" cy="98" rx="70" ry="24" transform="rotate(58 104 98)" fill="none" stroke="#7353dd" strokeOpacity="0.5" strokeWidth="1.2" />
          <ellipse cx="104" cy="98" rx="70" ry="24" transform="rotate(-58 104 98)" fill="none" stroke="#48c0cc" strokeOpacity="0.28" strokeWidth="1.1" />
          <ellipse cx="104" cy="98" rx="42" ry="70" fill="none" stroke="#a78bfa" strokeOpacity="0.24" strokeWidth="1" />
          <path d="M20 122C54 48 152 29 208 84" fill="none" stroke="#7c3aed" strokeOpacity="0.62" strokeWidth="2" strokeLinecap="round" />
          <circle cx="199" cy="78" r="4" fill="#48c0cc" opacity="0.82" />
        </g>

        <g transform="translate(610 48)">
          {[72, 104, 58, 128, 94, 146, 118, 160].map((bar, index) => (
            <rect key={index} x={index * 38} y={170 - bar} width="18" height={bar} rx="4" fill={`url(#${chartId})`} opacity={0.52 + index * 0.04} />
          ))}
          <path d="M0 138C40 122 58 146 94 110C132 72 170 126 210 88C248 52 280 70 316 34" fill="none" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.86" />
          <path d="M0 138C40 122 58 146 94 110C132 72 170 126 210 88C248 52 280 70 316 34L316 180H0Z" fill="#7353dd" opacity="0.08" />
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-violet-950/55 to-transparent md:h-20" />
    </div>
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
