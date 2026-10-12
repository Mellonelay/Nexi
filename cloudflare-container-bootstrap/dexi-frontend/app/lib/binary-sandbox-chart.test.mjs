import test from "node:test";
import assert from "node:assert/strict";
import { binarySandboxChartFeed, selectBinarySandboxPosition } from "./binary-sandbox-chart.ts";

const candle = (openTime, closeTime, open, close, high = Math.max(open, close), low = Math.min(open, close)) => ({
  openTime, closeTime, open: String(open), high: String(high),
  low: String(low), close: String(close), volume: "0",
});
const position = (side, plannedResult, expiryPrice, state = plannedResult, candles = [candle("2026-10-11T00:00:00Z", "2026-10-11T00:00:05Z", 100, expiryPrice)]) => ({
  id: "trade-1",
  symbol: "BTCUSDT",
  side,
  openedAt: candles[0]?.openTime,
  expiresAt: candles.at(-1)?.closeTime,
  sandboxSimulation: {
    source: "nexi-sandbox-simulation", plannedResult, state,
    entryPrice: "100", expiryPrice: String(expiryPrice), candles,
  },
});
const valid = (value, interval) => assert.equal(binarySandboxChartFeed(value, interval).valid, true);
const invalid = (value) => assert.deepEqual(binarySandboxChartFeed(value), { isSandbox: true, valid: false, candles: [] });

test("accepts forced outcomes only when expiry direction matches WIN or LOSS, including equal-price LOSS", () => {
  valid(position("CALL", "WIN", 100.1));
  valid(position("CALL", "LOSS", 99.9));
  valid(position("CALL", "LOSS", 100));
  valid(position("PUT", "WIN", 99.9));
  valid(position("PUT", "LOSS", 100.1));
  valid(position("PUT", "LOSS", 100));
  invalid(position("CALL", "WIN", 100));
  invalid(position("PUT", "WIN", 100));
  invalid(position("CALL", "LOSS", 100.1));
  invalid(position("PUT", "LOSS", 99.9));
});

test("requires a continuous monotonic path with coherent OHLC and exact expiry boundary", () => {
  invalid(position("CALL", "WIN", 100.1, "WIN", []));
  invalid(position("CALL", "WIN", 100.1, "WIN", [candle("bad", "2026-10-11T00:00:05Z", 100, 100.1)]));
  invalid(position("CALL", "WIN", 100.1, "WIN", [candle("2026-10-11T00:00:00Z", "2026-10-11T00:00:05Z", 100, 100.1, 100, 100.2)]));
  invalid(position("CALL", "WIN", 100.1, "WIN", [candle("2026-10-11T00:00:00Z", "2026-10-11T00:00:05Z", 100, 100.05)]));
  invalid(position("CALL", "WIN", 100.1, "ACTIVE", [candle("2026-10-11T00:00:00Z", "2026-10-11T00:00:05Z", 99, 100.1)]));
  invalid(position("CALL", "WIN", 100.1, "ACTIVE", [
    candle("2026-10-11T00:00:00Z", "2026-10-11T00:00:05Z", 100, 100.05),
    candle("2026-10-11T00:00:05Z", "2026-10-11T00:00:10Z", 100.05, 100.02),
  ]));
  const wrongExpiryBoundary = position("CALL", "WIN", 100.1);
  wrongExpiryBoundary.expiresAt = "2026-10-11T00:00:06Z";
  invalid(wrongExpiryBoundary);
});

test("aggregates validated simulation candles to the selected chart timeframe", () => {
  const trade = position("CALL", "WIN", 100.1, "WIN", [
    candle("2026-10-11T00:00:00Z", "2026-10-11T00:00:30Z", 100, 100.05),
    candle("2026-10-11T00:00:30Z", "2026-10-11T00:01:00Z", 100.05, 100.1),
  ]);
  const feed = binarySandboxChartFeed(trade, "1m");
  assert.equal(feed.valid, true);
  assert.equal(feed.candles.length, 1);
  assert.equal(feed.candles[0].open, 100);
  assert.equal(feed.candles[0].close, 100.1);
  assert.equal(feed.candles[0].high, 100.1);
  assert.equal(feed.candles[0].low, 100);
  assert.equal(feed.candles[0].time, Math.floor(Date.parse("2026-10-11T00:00:00Z") / 1000));
});

test("fails closed for a missing sandbox path and leaves ordinary positions on live data", () => {
  invalid({ id: "bad", side: "CALL", sandboxSimulation: { source: "nexi-sandbox-simulation" } });
  assert.deepEqual(binarySandboxChartFeed({ side: "CALL" }), { isSandbox: false, valid: true, candles: [] });
});

test("fails closed when sandbox metadata has unrecognized provenance", () => {
  const malformed = position("CALL", "WIN", 100.1);
  malformed.sandboxSimulation.source = "provider-live-feed";
  invalid(malformed);
});

test("selects the explicitly selected trade by symbol and never guesses from history", () => {
  const activeA = position("CALL", "WIN", 100.1, "ACTIVE");
  const activeB = { ...position("PUT", "WIN", 99.9, "ACTIVE"), id: "trade-2" };
  const oldHistory = { ...position("CALL", "LOSS", 99.9), id: "old-history" };
  assert.equal(selectBinarySandboxPosition([activeA, activeB], [oldHistory], null, "BTCUSDT"), null);
  assert.equal(selectBinarySandboxPosition([activeA, activeB], [], "trade-2", "BTCUSDT"), activeB);
  assert.equal(selectBinarySandboxPosition([activeA], [oldHistory], "old-history", "BTCUSDT"), oldHistory);
  assert.equal(selectBinarySandboxPosition([activeA], [], "removed-trade", "BTCUSDT"), null);
  assert.equal(selectBinarySandboxPosition([], [oldHistory], "old-history", "ETHUSDT"), null);
  assert.equal(selectBinarySandboxPosition([], [oldHistory], null, "BTCUSDT"), null);
  assert.equal(selectBinarySandboxPosition([activeA], [], null, "BTCUSDT"), activeA);
});
