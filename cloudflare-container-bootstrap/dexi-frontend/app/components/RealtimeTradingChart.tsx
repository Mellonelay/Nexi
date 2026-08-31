'use client';

import { useEffect } from 'react';
import TradingChart from './TradingChart';
import { useRealtimeMarket } from '../hooks/useRealtimeMarket';
import type { MarketDataStatus } from '../lib/market-data';

export default function RealtimeTradingChart({
  symbol,
  type,
  interval = '1m',
  onStatusChange,
}: {
  symbol: string;
  type: 'binary' | 'spot';
  interval?: string;
  onStatusChange?: (status: MarketDataStatus) => void;
}) {
  const stream = useRealtimeMarket(symbol, interval);
  const status: MarketDataStatus = stream.status === 'CONNECTING'
    ? 'LOADING'
    : stream.status === 'RECONNECTING'
      ? 'CONNECTION_LOST'
      : stream.status;

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  return <TradingChart symbol={symbol} type={type} interval={interval} candles={status === 'LIVE' || status === 'STALE' ? stream.candles : []} status={status} />;
}
