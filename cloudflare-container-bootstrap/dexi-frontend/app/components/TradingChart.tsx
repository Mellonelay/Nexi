'use client';

import { useEffect, useMemo, useRef } from 'react';
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
} from 'lightweight-charts';
import { bollingerBands, exponentialMovingAverage, latestChartMetrics } from '../lib/market-indicators';
import { type Candle, type MarketDataStatus } from '../lib/market-data';

interface TradingChartProps {
  symbol: string;
  type: 'binary' | 'spot';
  interval?: string;
  candles?: Candle[];
  status?: MarketDataStatus;
}

const lineData = (points: Array<{ time: number; value: number }>): LineData<Time>[] => points.map((point) => ({
  time: point.time as UTCTimestamp,
  value: point.value,
}));
const formatMetric = (value: number | null | undefined) => value == null
  ? '—'
  : value.toLocaleString('en-US', { maximumFractionDigits: Math.abs(value) >= 100 ? 2 : 6 });

export default function TradingChart({
  symbol,
  type,
  interval = '1m',
  candles = [],
  status = 'UNAVAILABLE',
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const fittedKeyRef = useRef('');
  const responsiveHeight = type === 'spot'
    ? 'min-h-[220px] md:min-h-[360px] xl:min-h-[430px]'
    : 'min-h-[180px] sm:min-h-[360px] xl:min-h-[430px]';
  const metrics = useMemo(() => latestChartMetrics(candles), [candles]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9A8BAA',
        fontFamily: 'var(--font-geist-mono), monospace',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(58,18,79,0.3)' },
        horzLines: { color: 'rgba(58,18,79,0.3)' },
      },
      width: container.clientWidth,
      height: container.clientHeight,
      rightPriceScale: {
        borderColor: 'rgba(139,92,246,0.18)',
        scaleMargins: { top: 0.08, bottom: 0.2 },
      },
      timeScale: {
        borderColor: 'rgba(139,92,246,0.18)',
        timeVisible: true,
        secondsVisible: interval.endsWith('s'),
        rightOffset: 3,
        barSpacing: 8,
      },
      crosshair: {
        vertLine: { color: '#48C0CC', labelBackgroundColor: '#1A0C24' },
        horzLine: { color: '#48C0CC', labelBackgroundColor: '#1A0C24' },
      },
      handleScroll: { horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { pinch: true },
    });
    chartRef.current = chart;
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#22D3A6',
      downColor: '#FF5C7C',
      borderVisible: false,
      wickUpColor: '#22D3A6',
      wickDownColor: '#FF5C7C',
    });
    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeriesRef.current.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    ema20SeriesRef.current = chart.addLineSeries({ color: '#A995FF', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    ema50SeriesRef.current = chart.addLineSeries({ color: '#48C0CC', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    bollUpperSeriesRef.current = chart.addLineSeries({ color: 'rgba(139,92,246,0.42)', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    bollLowerSeriesRef.current = chart.addLineSeries({ color: 'rgba(139,92,246,0.42)', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ema20SeriesRef.current = null;
      ema50SeriesRef.current = null;
      bollUpperSeriesRef.current = null;
      bollLowerSeriesRef.current = null;
    };
  }, [interval]);

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
        color: candle.close >= candle.open ? 'rgba(34,211,166,0.38)' : 'rgba(255,92,124,0.38)',
      }));
    candleSeries.setData(candleData);
    volumeSeries.setData(volumeData);
    ema20SeriesRef.current?.setData(lineData(exponentialMovingAverage(candles, 20)));
    ema50SeriesRef.current?.setData(lineData(exponentialMovingAverage(candles, 50)));
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
  return (
    <div className={`relative flex h-full w-full flex-col overflow-hidden rounded-lg ${responsiveHeight}`}>
      <div className="nexi-chart-rail flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-violet-300/10 bg-black/15 px-3 py-2 font-mono text-[9px] sm:text-[10px]">
        <span className="font-semibold text-[#F8F6FF]">{symbol}</span>
        <span className="rounded border border-violet-300/15 px-1.5 py-0.5 text-[#CFC4FF]">{interval}</span>
        <span className="hidden text-[#8C8299] sm:inline">O <b className="font-medium text-[#C3BBD0]">{formatMetric(latest?.open)}</b></span>
        <span className="hidden text-[#8C8299] sm:inline">H <b className="font-medium text-[#98FCE4]">{formatMetric(latest?.high)}</b></span>
        <span className="hidden text-[#8C8299] sm:inline">L <b className="font-medium text-[#FF9CB0]">{formatMetric(latest?.low)}</b></span>
        <span className="text-[#8C8299]">C <b className="font-medium text-[#F8F6FF]">{formatMetric(latest?.close)}</b></span>
        <span className="ml-auto text-[#8C8299]">RSI 14 <b className="font-medium text-[#48C0CC]">{metrics.rsi === null ? '—' : metrics.rsi.toFixed(1)}</b></span>
        <span className="text-[#8C8299]">MACD <b className={`font-medium ${macdHistogram !== null && macdHistogram >= 0 ? 'text-[#98FCE4]' : 'text-[#FF9CB0]'}`}>{macdHistogram === null ? '—' : macdHistogram.toFixed(2)}</b></span>
      </div>
      <div ref={chartContainerRef} className="min-h-0 w-full flex-1" role="img" aria-label={`${symbol} ${interval} candlestick chart with volume and technical overlays`} />
      {candles.length === 0 && <div className="pointer-events-none absolute inset-0 bg-[#0B0711]/35" aria-hidden="true" />}
    </div>
  );
}
