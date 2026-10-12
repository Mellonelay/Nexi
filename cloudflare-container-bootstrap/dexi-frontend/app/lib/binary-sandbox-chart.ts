export type BinarySandboxChartCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
export type BinarySandboxChartFeed = {
  isSandbox: boolean;
  valid: boolean;
  candles: BinarySandboxChartCandle[];
};

const emptyFeed = (isSandbox: boolean, valid: boolean): BinarySandboxChartFeed => ({
  isSandbox,
  valid,
  candles: [],
});
const INTERVAL_SECONDS: Readonly<Record<string, number>> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1_800,
  "1h": 3_600,
  "4h": 14_400,
  "1d": 86_400,
};

function aggregateCandles(candles: BinarySandboxChartCandle[], interval: string): BinarySandboxChartCandle[] {
  const width = INTERVAL_SECONDS[interval] ?? INTERVAL_SECONDS["1m"];
  const aggregated: BinarySandboxChartCandle[] = [];
  for (const candle of candles) {
    const time = Math.floor(candle.time / width) * width;
    const previous = aggregated.at(-1);
    if (!previous || previous.time !== time) {
      aggregated.push({ ...candle, time });
      continue;
    }
    previous.high = Math.max(previous.high, candle.high);
    previous.low = Math.min(previous.low, candle.low);
    previous.close = candle.close;
    previous.volume += candle.volume;
  }
  return aggregated;
}

export function binarySandboxChartFeed(position: unknown, interval = "1m"): BinarySandboxChartFeed {
  if (!position || typeof position !== "object") return emptyFeed(false, true);
  const row = position as Record<string, unknown>;
  const raw = row.sandboxSimulation;
  if (!raw || typeof raw !== "object") return emptyFeed(false, true);
  const invalid = () => emptyFeed(true, false);
  const simulation = raw as Record<string, unknown>;
  if (simulation.source !== "nexi-sandbox-simulation") return invalid();
  const side = String(row.side ?? row.direction ?? "").toUpperCase();
  const isCall = ["CALL", "UP", "LONG"].includes(side);
  const isPut = ["PUT", "DOWN", "SHORT"].includes(side);
  const entry = Number(simulation.entryPrice);
  const expiry = Number(simulation.expiryPrice);
  const result = String(simulation.plannedResult ?? "").toUpperCase();
  if ((!isCall && !isPut) || !Number.isFinite(entry) || entry <= 0 || !Number.isFinite(expiry) || expiry <= 0) return invalid();
  if (result !== "WIN" && result !== "LOSS") return invalid();
  const isWin = isCall ? expiry > entry : expiry < entry;
  if ((result === "WIN") !== isWin) return invalid();
  if (!Array.isArray(simulation.candles) || simulation.candles.length === 0) return invalid();

  const openedAtInput = row.openedAt ?? row.createdAt;
  const expiresAtInput = row.expiresAt;
  const openedAt = openedAtInput === undefined || openedAtInput === null ? null : Date.parse(String(openedAtInput));
  const expiresAt = expiresAtInput === undefined || expiresAtInput === null ? null : Date.parse(String(expiresAtInput));
  if (openedAt !== null && !Number.isFinite(openedAt) || expiresAt !== null && !Number.isFinite(expiresAt)) return invalid();

  const candles: BinarySandboxChartCandle[] = [];
  let previousTime = -1;
  let previousClose = entry;
  let finalCloseMs = Number.NaN;
  for (const value of simulation.candles) {
    if (!value || typeof value !== "object") return invalid();
    const candle = value as Record<string, unknown>;
    const openMs = Date.parse(String(candle.openTime ?? ""));
    const closeMs = Date.parse(String(candle.closeTime ?? ""));
    const open = Number(candle.open);
    const high = Number(candle.high);
    const low = Number(candle.low);
    const close = Number(candle.close);
    const volume = Number(candle.volume ?? 0);
    const time = Math.floor(openMs / 1000);
    if (!Number.isFinite(openMs) || !Number.isFinite(closeMs) || closeMs <= openMs ||
        ![open, high, low, close, volume].every(Number.isFinite) || low <= 0 || volume < 0 ||
        high < Math.max(open, close) || low > Math.min(open, close) || time <= previousTime ||
        openedAt !== null && openMs < openedAt || expiresAt !== null && closeMs > expiresAt ||
        open !== previousClose || (expiry > entry && close < previousClose) ||
        (expiry < entry && close > previousClose) ||
        (expiry === entry && [open, high, low, close].some((price) => price !== entry))) return invalid();
    candles.push({ time, open, high, low, close, volume });
    previousTime = time;
    previousClose = close;
    finalCloseMs = closeMs;
  }

  if (candles[0].open !== entry) return invalid();
  const state = String(simulation.state ?? "").toUpperCase();
  if (["WIN", "LOSS"].includes(state) &&
      (candles.at(-1)?.close !== expiry || expiresAt !== null && finalCloseMs !== expiresAt)) return invalid();
  return { isSandbox: true, valid: true, candles: aggregateCandles(candles, interval) };
}

export function selectBinarySandboxPosition(
  activePositions: unknown,
  history: unknown,
  selectedTradeId: string | null,
  symbol: string,
): unknown | null {
  const pair = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const active = Array.isArray(activePositions) ? activePositions : [];
  const settled = Array.isArray(history) ? history : [];
  const matching = (value: unknown) => {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    return String(row.symbol ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") === pair &&
      Boolean(row.sandboxSimulation);
  };
  if (selectedTradeId) {
    const selected = [...active, ...settled].find((value) => {
      const row = value as Record<string, unknown> | null;
      return matching(value) && row?.id === selectedTradeId;
    });
    return selected ?? null;
  }
  const candidates = active.filter(matching);
  return candidates.length === 1 ? candidates[0] : null;
}
