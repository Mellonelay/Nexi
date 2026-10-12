"use client";

import TradingChart from "./TradingChart";
import { useRealtimeMarket } from "../hooks/useRealtimeMarket";
import type { MarketDataStatus } from "../lib/market-data";
import type { BinarySandboxChartFeed } from "../lib/binary-sandbox-chart";

export default function RealtimeTradingChart({
  symbol,
  type,
  interval = "1m",
  marketStatus,
  sandboxFeed,
  showIndicatorControls,
}: {
  symbol: string;
  type: "binary" | "spot";
  interval?: string;
  marketStatus?: MarketDataStatus;
  sandboxFeed?: BinarySandboxChartFeed;
  showIndicatorControls?: boolean;
}) {
  const stream = useRealtimeMarket(symbol, interval);
  const rawStatus: MarketDataStatus =
    stream.status === "CONNECTING"
      ? "LOADING"
      : stream.status === "RECONNECTING"
        ? "CONNECTION_LOST"
        : stream.status;
  const hasSandbox = Boolean(sandboxFeed?.isSandbox);
  const candles = hasSandbox
    ? sandboxFeed?.valid ? sandboxFeed.candles : []
    : stream.candles;
  const status: MarketDataStatus = hasSandbox
    ? sandboxFeed?.valid && candles.length > 0 ? "LIVE" : "ERROR"
    : marketStatus === "CLOSED" ? "CLOSED" : rawStatus;

  return (
    <TradingChart
      symbol={symbol}
      type={type}
      interval={interval}
      candles={candles}
      status={status}
      sandboxed={hasSandbox}
      showIndicatorControls={showIndicatorControls}
    />
  );
}
