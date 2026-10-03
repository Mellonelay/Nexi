"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type CandlestickData,
  ColorType,
  createChart,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  LineStyle,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import {
  bollingerBands,
  exponentialMovingAverage,
  latestChartMetrics,
  simpleMovingAverage,
} from "../lib/market-indicators";
import { type Candle, type MarketDataStatus } from "../lib/market-data";

interface TradingChartProps {
  symbol: string;
  type: "binary" | "spot";
  interval?: string;
  candles?: Candle[];
  status?: MarketDataStatus;
}

type IndicatorKey = "MA" | "EMA" | "BOLL" | "RSI" | "MACD" | "VOL";
const INDICATORS: IndicatorKey[] = ["MA", "EMA", "BOLL", "RSI", "MACD", "VOL"];
const EMPTY_CANDLES: Candle[] = [];

const lineData = (
  points: Array<{ time: number; value: number }>,
): LineData<Time>[] =>
  points.map((point) => ({
    time: point.time as UTCTimestamp,
    value: point.value,
  }));
const formatMetric = (value: number | null | undefined) =>
  value == null
    ? "—"
    : value.toLocaleString("en-US", {
        maximumFractionDigits: Math.abs(value) >= 100 ? 2 : 6,
      });

const marketStateCopy: Record<
  Exclude<MarketDataStatus, "LIVE">,
  [string, string]
> = {
  LOADING: [
    "Loading market data",
    "The chart will appear shortly.",
  ],
  STALE: ["Chart updates paused", "Please wait while updates resume."],
  CLOSED: ["Closed", "Showing the last available market history."],
  CONNECTION_LOST: [
    "Market connection interrupted",
    "Reconnecting. The chart shows the last received data.",
  ],
  UNAVAILABLE: [
    "Market data unavailable",
    "Please try again shortly.",
  ],
  DISABLED: [
    "Chart unavailable",
    "Chart data is not available for this market.",
  ],
  ERROR: [
    "Market data unavailable",
    "The chart could not be loaded. Please try again shortly.",
  ],
};

function ChartMetricsRail({
  symbol,
  interval,
  latest,
  rsi,
  macdHistogram,
  activeIndicators,
  overlays,
}: {
  symbol: string;
  interval: string;
  latest: ReturnType<typeof latestChartMetrics>["latest"];
  rsi: number | null;
  macdHistogram: number | null;
  activeIndicators: Set<IndicatorKey>;
  overlays: { ma20: number | undefined; ema20: number | undefined; ema50: number | undefined };
}) {
  return (
    <div role="region" aria-label="Chart values" tabIndex={0} className="nexi-chart-rail nexi-scroll-rail flex min-w-0 shrink-0 items-center overflow-x-auto whitespace-nowrap gap-x-3 gap-y-1 border-b border-violet-300/10 bg-black/15 px-3 py-2 font-mono text-[9px] sm:text-[10px]">
      <span className="font-semibold text-[#F8F6FF]">{symbol}</span>
      <span className="rounded border border-violet-300/15 px-1.5 py-0.5 text-[#CFC4FF]">{interval}</span>
      <span className="hidden text-[#8C8299] sm:inline">O <b className="font-medium text-[#C3BBD0]">{formatMetric(latest?.open)}</b></span>
      <span className="hidden text-[#8C8299] sm:inline">H <b className="font-medium text-[#98FCE4]">{formatMetric(latest?.high)}</b></span>
      <span className="hidden text-[#8C8299] sm:inline">L <b className="font-medium text-[#FF9CB0]">{formatMetric(latest?.low)}</b></span>
      <span className="text-[#8C8299]">C <b className="font-medium text-[#F8F6FF]">{formatMetric(latest?.close)}</b></span>
      {activeIndicators.has("RSI") && <span className="ml-auto text-[#8C8299]">RSI 14 <b className="font-medium text-[#48C0CC]">{rsi === null ? "—" : rsi.toFixed(1)}</b></span>}
      {activeIndicators.has("MA") && <span className="order-first shrink-0 text-[#F4D35E] sm:order-none">MA(20) <b className="font-medium">{formatMetric(overlays.ma20)}</b></span>}
      {activeIndicators.has("EMA") && <><span className="order-first shrink-0 text-[#A995FF] sm:order-none">EMA(20) <b className="font-medium">{formatMetric(overlays.ema20)}</b></span><span className="order-first shrink-0 text-[#48C0CC] sm:order-none">EMA(50) <b className="font-medium">{formatMetric(overlays.ema50)}</b></span></>}
      {activeIndicators.has("BOLL") && <span className="hidden text-[#CFC4FF] md:inline">BOLL</span>}
      {activeIndicators.has("VOL") && <span className="hidden text-[#8C8299] md:inline">VOL</span>}
      {activeIndicators.has("MACD") && <span className="text-[#8C8299]">MACD <b className={`font-medium ${macdHistogram !== null && macdHistogram >= 0 ? "text-[#98FCE4]" : "text-[#FF9CB0]"}`}>{macdHistogram === null ? "—" : macdHistogram.toFixed(2)}</b></span>}
    </div>
  );
}

function ChartIndicatorRail({ activeIndicators, onToggle }: { activeIndicators: Set<IndicatorKey>; onToggle: (indicator: IndicatorKey) => void }) {
  return (
    <div className="nexi-chart-indicators nexi-scroll-rail flex min-w-0 gap-1 overflow-x-auto border-b border-violet-300/10 bg-black/10 px-2 py-1.5" aria-label="Chart indicators">
      {INDICATORS.map((indicator) => {
        const active = activeIndicators.has(indicator);
        return <button key={indicator} type="button" aria-pressed={active} onClick={() => onToggle(indicator)} className={`nexi-interactive min-h-11 min-w-11 shrink-0 rounded-md border px-2 text-[10px] font-semibold ${active ? "border-violet-300/30 bg-[#2A1742] text-white" : "border-transparent text-[#8C8299] hover:text-white"}`}>{indicator}</button>;
      })}
    </div>
  );
}

function ChartStatusOverlay({ blocksChart, stateCopy }: { blocksChart: [string, string] | false | null; stateCopy: [string, string] | null }) {
  return <>
    {blocksChart && <div className="absolute inset-x-0 bottom-0 top-9 z-10 flex items-center justify-center bg-[var(--nexi-surface-execution)] px-6 text-center" role="status"><div><p className="text-sm font-semibold text-white">{blocksChart[0]}</p><p className="mt-1 max-w-xs text-xs leading-5 text-[var(--nexi-text-secondary)]">{blocksChart[1]}</p></div></div>}
    {!blocksChart && stateCopy && <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-lg border border-amber-300/25 bg-[#15101D]/95 px-3 py-2 text-xs text-amber-100" role="status"><span className="font-semibold">{stateCopy[0]}.</span> {stateCopy[1]}</div>}
  </>;
}

export default function TradingChart({
  symbol,
  type,
  interval = "1m",
  candles = EMPTY_CANDLES,
  status = "UNAVAILABLE",
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bollUpperSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bollLowerSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const fittedKeyRef = useRef("");
  const responsiveHeight =
    type === "spot"
      ? "min-h-[220px] md:min-h-[360px] xl:min-h-[430px]"
      : "min-h-0";
  const metrics = useMemo(() => latestChartMetrics(candles), [candles]);
  const overlays = useMemo(() => ({
    ma20: simpleMovingAverage(candles, 20).at(-1)?.value,
    ema20: exponentialMovingAverage(candles, 20).at(-1)?.value,
    ema50: exponentialMovingAverage(candles, 50).at(-1)?.value,
  }), [candles]);
  const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorKey>>(() => new Set(INDICATORS));
  const toggleIndicator = (indicator: IndicatorKey) => {
    setActiveIndicators((current) => {
      const next = new Set(current);
      if (next.has(indicator)) next.delete(indicator);
      else next.add(indicator);
      return next;
    });
  };

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9A8BAA",
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(58,18,79,0.3)" },
        horzLines: { color: "rgba(58,18,79,0.3)" },
      },
      width: container.clientWidth,
      height: container.clientHeight,
      rightPriceScale: {
        borderColor: "rgba(139,92,246,0.18)",
        scaleMargins: { top: 0.08, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "rgba(139,92,246,0.18)",
        timeVisible: true,
        secondsVisible: interval.endsWith("s"),
        rightOffset: 3,
        barSpacing: 8,
      },
      crosshair: {
        vertLine: { color: "#48C0CC", labelBackgroundColor: "#1A0C24" },
        horzLine: { color: "#48C0CC", labelBackgroundColor: "#1A0C24" },
      },
      handleScroll: { horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { pinch: true },
    });
    chartRef.current = chart;
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#22D3A6",
      downColor: "#FF5C7C",
      borderVisible: false,
      wickUpColor: "#22D3A6",
      wickDownColor: "#FF5C7C",
    });
    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeriesRef.current
      .priceScale()
      .applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    ma20SeriesRef.current = chart.addLineSeries({
      color: "#F4D35E",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    ema20SeriesRef.current = chart.addLineSeries({
      color: "#A995FF",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    ema50SeriesRef.current = chart.addLineSeries({
      color: "#48C0CC",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    bollUpperSeriesRef.current = chart.addLineSeries({
      color: "rgba(139,92,246,0.42)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    bollLowerSeriesRef.current = chart.addLineSeries({
      color: "rgba(139,92,246,0.42)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const resizeObserver = new ResizeObserver(() => {
      chart.resize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ma20SeriesRef.current = null;
      ema20SeriesRef.current = null;
      ema50SeriesRef.current = null;
      bollUpperSeriesRef.current = null;
      bollLowerSeriesRef.current = null;
    };
  }, [interval]);

  useEffect(() => {
    ma20SeriesRef.current?.applyOptions({ visible: activeIndicators.has("MA") });
    ema20SeriesRef.current?.applyOptions({ visible: activeIndicators.has("EMA") });
    ema50SeriesRef.current?.applyOptions({ visible: activeIndicators.has("EMA") });
    bollUpperSeriesRef.current?.applyOptions({ visible: activeIndicators.has("BOLL") });
    bollLowerSeriesRef.current?.applyOptions({ visible: activeIndicators.has("BOLL") });
    volumeSeriesRef.current?.applyOptions({ visible: activeIndicators.has("VOL") });
  }, [activeIndicators, interval]);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries) return;

    const candleData: CandlestickData<Time>[] = candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    const volumeData: HistogramData<Time>[] = candles
      .filter((candle) => candle.volume !== undefined)
      .map((candle) => ({
        time: candle.time as UTCTimestamp,
        value: candle.volume ?? 0,
        color:
          candle.close >= candle.open
            ? "rgba(34,211,166,0.38)"
            : "rgba(255,92,124,0.38)",
      }));
    candleSeries.setData(candleData);
    volumeSeries.setData(volumeData);
    ma20SeriesRef.current?.setData(lineData(simpleMovingAverage(candles, 20)));
    ema20SeriesRef.current?.setData(
      lineData(exponentialMovingAverage(candles, 20)),
    );
    ema50SeriesRef.current?.setData(
      lineData(exponentialMovingAverage(candles, 50)),
    );
    const bands = bollingerBands(candles);
    bollUpperSeriesRef.current?.setData(lineData(bands.upper));
    bollLowerSeriesRef.current?.setData(lineData(bands.lower));

    const key = `${symbol}:${interval}`;
    if (candles.length > 0 && fittedKeyRef.current !== key) {
      chartRef.current?.timeScale().fitContent();
      fittedKeyRef.current = key;
    }
  }, [candles, interval, symbol]);

  const latest = metrics.latest;
  const macdHistogram = metrics.macd?.histogram ?? null;
  const stateCopy = status === "LIVE" ? null : marketStateCopy[status];
  const blocksChart = candles.length === 0 && stateCopy;
  return (
    <div
      className={`nexi-trading-chart relative flex h-full w-full flex-col overflow-hidden rounded-lg ${responsiveHeight}`}
    >
      <ChartMetricsRail symbol={symbol} interval={interval} latest={latest} rsi={metrics.rsi} macdHistogram={macdHistogram} activeIndicators={activeIndicators} overlays={overlays} />
      <ChartIndicatorRail activeIndicators={activeIndicators} onToggle={toggleIndicator} />
      <div
        ref={chartContainerRef}
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label={`${symbol} ${interval} candlestick chart with volume and technical overlays`}
      />
      <ChartStatusOverlay blocksChart={blocksChart} stateCopy={stateCopy} />
    </div>
  );
}
