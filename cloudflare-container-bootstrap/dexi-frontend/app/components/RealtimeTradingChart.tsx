"use client";

import TradingChart from "./TradingChart";
import { useRealtimeMarket } from "../hooks/useRealtimeMarket";
import type { MarketDataStatus } from "../lib/market-data";

export default function RealtimeTradingChart({
  symbol,
  type,
  interval = "1m",
  marketStatus,
}: {
  symbol: string;
  type: "binary" | "spot";
  interval?: string;
  marketStatus?: MarketDataStatus;
}) {
  const stream = useRealtimeMarket(symbol, interval);
  const rawStatus: MarketDataStatus =
    stream.status === "CONNECTING"
      ? "LOADING"
      : stream.status === "RECONNECTING"
        ? "CONNECTION_LOST"
        : stream.status;
  const status: MarketDataStatus = marketStatus === "CLOSED" ? "CLOSED" : rawStatus;


  return (
    <TradingChart
      symbol={symbol}
      type={type}
      interval={interval}
      candles={stream.candles}
      status={status}
    />
  );
}
