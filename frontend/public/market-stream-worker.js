let generation = 0;
const emptySnapshot = () => ({
  status: "UNAVAILABLE",
  lastSequence: null,
  lastTimestamp: null,
  lastQuoteTimestamp: null,
  lastKlineTimestamp: null,
  lastKlineProvider: null,
  lastKlineSource: null,
  lastKlineFinal: null,
  candleRevisions: {},
  price: null,
  candles: [],
});
let snapshot = emptySnapshot();
const rank = (revision) =>
  revision?.source?.endsWith(":quote-aggregation")
    ? 0
    : revision?.source?.startsWith("derived:")
      ? 1
      : 2;
const publish = () => self.postMessage({ generation, snapshot });

self.onmessage = (event) => {
  const message = event.data || {};
  if (message.type === "INIT") {
    generation = Number(message.generation) || 0;
    const initial = message.snapshot;
    snapshot =
      initial && Array.isArray(initial.candles)
        ? {
            ...emptySnapshot(),
            ...initial,
            candles: initial.candles.slice(-500),
            candleRevisions: initial.candleRevisions || {},
          }
        : emptySnapshot();
    publish();
    return;
  }
  if (Number(message.generation) !== generation) return;

  if (message.type === "KLINE") {
    const kline = message.kline;
    if (!kline?.candle || !Number.isFinite(kline.observedAt)) return;
    const key = String(kline.candle.time);
    const prior = snapshot.candleRevisions[key];
    const revision = {
      observedAt: kline.observedAt,
      sequence: kline.sequence ?? null,
      provider: kline.provider ?? null,
      source: kline.source ?? null,
      isFinal: kline.isFinal === true,
    };
    if (
      prior &&
      (rank(revision) < rank(prior) ||
        (prior.isFinal && !revision.isFinal) ||
        (rank(revision) === rank(prior) &&
          (revision.observedAt < prior.observedAt ||
            (revision.observedAt === prior.observedAt &&
              ((revision.sequence !== null &&
                prior.sequence !== null &&
                revision.sequence <= prior.sequence) ||
                (revision.sequence === null && prior.sequence === null))))))
    )
      return;
    const latestCandleTime =
      snapshot.candles.at(-1)?.time ?? Number.NEGATIVE_INFINITY;
    const isNewestCandle = kline.candle.time >= latestCandleTime;
    const candles = [...snapshot.candles];
    const index = candles.findIndex(
      (candle) => candle.time === kline.candle.time,
    );
    if (index >= 0) candles[index] = kline.candle;
    else candles.push(kline.candle);
    candles.sort((left, right) => left.time - right.time);
    const boundedCandles = candles.slice(-500);
    const retainedTimes = new Set(
      boundedCandles.map((candle) => String(candle.time)),
    );
    const candleRevisions = Object.fromEntries(
      Object.entries({ ...snapshot.candleRevisions, [key]: revision }).filter(
        ([time]) => retainedTimes.has(time),
      ),
    );
    snapshot = {
      ...snapshot,
      status:
        kline.observedAt >= (snapshot.lastKlineTimestamp || 0)
          ? "LIVE"
          : snapshot.status,
      lastTimestamp: Math.max(
        snapshot.lastKlineTimestamp || 0,
        kline.observedAt,
      ),
      lastKlineTimestamp: Math.max(
        snapshot.lastKlineTimestamp || 0,
        kline.observedAt,
      ),
      lastKlineProvider: isNewestCandle
        ? revision.provider
        : snapshot.lastKlineProvider,
      lastKlineSource: isNewestCandle
        ? revision.source
        : snapshot.lastKlineSource,
      lastKlineFinal: isNewestCandle
        ? revision.isFinal
        : snapshot.lastKlineFinal,
      candleRevisions,
      price:
        isNewestCandle && kline.observedAt >= (snapshot.lastQuoteTimestamp || 0)
          ? kline.candle.close
          : snapshot.price,
      candles: boundedCandles,
    };
    publish();
    return;
  }

  if (message.type !== "TICK") return;
  const tick = message.tick;
  if (!tick || !Number.isFinite(tick.timestamp) || !Number.isFinite(tick.price))
    return;
  if (
    tick.sequence !== undefined &&
    snapshot.lastSequence !== null &&
    tick.sequence <= snapshot.lastSequence
  )
    return;
  if (
    snapshot.lastQuoteTimestamp !== null &&
    tick.timestamp < snapshot.lastQuoteTimestamp
  )
    return;
  snapshot = {
    ...snapshot,
    lastSequence: tick.sequence ?? snapshot.lastSequence,
    lastQuoteTimestamp: tick.timestamp,
    price: tick.price,
  };
  publish();
};
