"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { normalizeCandle } from "../lib/market-data";
import { apiBaseUrl } from "../lib/api";
import {
  applyMarketTick,
  applyMarketKline,
  EMPTY_STREAM_SNAPSHOT,
  type MarketStreamSnapshot,
  normalizeMarketTick,
  normalizeMarketKline,
  reconnectRecoveryStatus,
  shouldApplyRecovery,
  streamStatusAt,
  timeframeToSeconds,
} from "../lib/market-stream";

type KlinePayload = {
  candles?: unknown;
  dataState?: unknown;
};

const normalizedState = (value: unknown): MarketStreamSnapshot["status"] =>
  value === "LIVE" ||
  value === "STALE" ||
  value === "ERROR" ||
  value === "UNAVAILABLE"
    ? value
    : "UNAVAILABLE";

async function loadBaseline(
  symbol: string,
  interval: string,
): Promise<MarketStreamSnapshot> {
  const params = new URLSearchParams({ symbol, interval, limit: "240" });
  const response = await fetch(`/api/market/klines?${params}`, {
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Market baseline returned ${response.status}.`);
  const payload = (await response.json()) as KlinePayload;
  const candles = Array.isArray(payload.candles)
    ? payload.candles.flatMap((row) => {
        const candle =
          row && typeof row === "object"
            ? normalizeCandle(row as Record<string, unknown>)
            : null;
        return candle ? [candle] : [];
      })
    : [];
  const latest = candles.at(-1);
  if (!latest) throw new Error("Market baseline contained no valid candles.");
  return {
    status: normalizedState(payload.dataState),
    lastSequence: null,
    lastTimestamp: null,
    price: latest.close,
    candles,
  };
}

export function useRealtimeMarket(symbol: string, interval = "1m") {
  const [snapshot, setSnapshot] = useState<MarketStreamSnapshot>(
    EMPTY_STREAM_SNAPSHOT,
  );
  const intervalSeconds = useMemo(
    () => timeframeToSeconds(interval),
    [interval],
  );

  useEffect(() => {
    let disposed = false;
    let staleTimer: ReturnType<typeof setInterval> | null = null;
    let worker: Worker | null = null;
    let socket: ReturnType<typeof io> | null = null;
    let acceptedRealtime = false;
    let connectedOnce = false;
    let recoveryGeneration = 0;
    let cleanupStream: (() => void) | null = null;

    setSnapshot({ ...EMPTY_STREAM_SNAPSHOT, status: "CONNECTING" });

    const initialize = async () => {
      let initial = EMPTY_STREAM_SNAPSHOT;
      try {
        initial = await loadBaseline(symbol, interval);
      } catch {
        initial = EMPTY_STREAM_SNAPSHOT;
      }
      if (disposed) return;
      setSnapshot(initial);
      const apiUrl = apiBaseUrl;
      if (!apiUrl) return;

      if (typeof Worker !== "undefined") {
        worker = new Worker("/market-stream-worker.js");
        worker.postMessage({
          type: "INIT",
          intervalSeconds,
          snapshot: initial,
        });
        worker.onmessage = (event: MessageEvent<MarketStreamSnapshot>) => {
          if (!disposed) setSnapshot(event.data);
        };
      }

      socket = io(`${apiUrl}/market`, {
        // Staging is reached through a Cloudflare tunnel. Start with the
        // reliable polling handshake, then allow websocket upgrade and retry
        // all transports after an authenticated page reload.
        transports: ["polling", "websocket"],
        tryAllTransports: true,
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 500,
        reconnectionDelayMax: 8_000,
      });

      const handleTick = (raw: unknown) => {
        if (disposed || document.visibilityState === "hidden") return;
        const tick = normalizeMarketTick(raw, symbol);
        if (!tick) return;
        acceptedRealtime = true;
        if (worker) worker.postMessage({ type: "TICK", tick });
        else
          setSnapshot((current) =>
            applyMarketTick(current, tick, intervalSeconds),
          );
      };

      const handleSnapshot = (raw: unknown) => {
        if (disposed || !raw || typeof raw !== "object") return;
        const payload = raw as Record<string, unknown>;
        const rows = Array.isArray(payload.data) ? payload.data : [];
        const expected = symbol.replaceAll("/", "").toUpperCase();
        const current = rows.find((value) => {
          if (!value || typeof value !== "object") return false;
          const row = value as Record<string, unknown>;
          return (
            String(row.symbol ?? "")
              .replaceAll("/", "")
              .toUpperCase() === expected
          );
        });
        const price =
          current && typeof current === "object"
            ? Number(
                (current as Record<string, unknown>).price ??
                  (current as Record<string, unknown>).lastPrice,
              )
            : Number.NaN;
        const state = normalizedState(payload.state);
        setSnapshot((previous) => ({
          ...previous,
          status: state,
          ...(Number.isFinite(price) && price > 0 ? { price } : {}),
        }));
      };

      const handleKline = (raw: unknown) => {
        if (disposed) return;
        const kline = normalizeMarketKline(raw, symbol, interval);
        if (!kline) return;
        if (worker) worker.postMessage({ type: "KLINE", kline });
        else setSnapshot((current) => applyMarketKline(current, kline));
      };

      const handleConnect = () => {
        const isReconnect = connectedOnce;
        connectedOnce = true;
        setSnapshot((current) => ({
          ...current,
          status: acceptedRealtime ? "LIVE" : current.status,
        }));
        if (!isReconnect) return;

        // Socket.IO does not guarantee missed-event replay unless connection-state
        // recovery or an application cursor is enabled. Re-anchor every recovered
        // transport to the authoritative REST Kline history instead of inventing
        // events that may have been missed while disconnected.
        const generation = ++recoveryGeneration;
        void loadBaseline(symbol, interval)
          .then((baseline) => {
            if (!shouldApplyRecovery(generation, recoveryGeneration, disposed)) return;
            acceptedRealtime = false;
            if (worker) {
              worker.postMessage({
                type: "INIT",
                intervalSeconds,
                snapshot: baseline,
              });
            } else {
              setSnapshot(baseline);
            }
          })
          .catch(() => {
            if (!shouldApplyRecovery(generation, recoveryGeneration, disposed)) return;
            setSnapshot((current) => ({
              ...current,
              status: reconnectRecoveryStatus(current),
            }));
          });
      };
      const handleReconnectAttempt = () =>
        setSnapshot((current) => ({ ...current, status: "RECONNECTING" }));
      const handleDisconnect = () =>
        setSnapshot((current) => ({
          ...current,
          status: reconnectRecoveryStatus(current),
        }));
      const handleConnectError = () =>
        setSnapshot((current) => ({
          ...current,
          status: reconnectRecoveryStatus(current),
        }));
      socket.on("connect", handleConnect);
      socket.io.on("reconnect_attempt", handleReconnectAttempt);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      socket.on("market_tick", handleTick);
      socket.on("market_snapshot", handleSnapshot);
      socket.on("market_kline", handleKline);

      cleanupStream = () => {
        socket?.off("connect", handleConnect);
        socket?.io.off("reconnect_attempt", handleReconnectAttempt);
        socket?.off("disconnect", handleDisconnect);
        socket?.off("connect_error", handleConnectError);
        socket?.off("market_tick", handleTick);
        socket?.off("market_snapshot", handleSnapshot);
        socket?.off("market_kline", handleKline);
        socket?.disconnect();
        if (worker) worker.onmessage = null;
      };

      staleTimer = setInterval(() => {
        setSnapshot((current) => ({
          ...current,
          status: streamStatusAt(current, Date.now()),
        }));
      }, 5_000);
    };

    void initialize();

    return () => {
      disposed = true;
      if (staleTimer) clearInterval(staleTimer);
      cleanupStream?.();
      socket?.disconnect();
      worker?.terminate();
    };
  }, [interval, intervalSeconds, symbol]);

  return snapshot;
}
