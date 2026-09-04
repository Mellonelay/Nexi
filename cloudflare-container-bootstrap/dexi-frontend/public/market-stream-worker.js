let intervalSeconds = 60;
const emptySnapshot = () => ({
  status: 'UNAVAILABLE',
  lastSequence: null,
  lastTimestamp: null,
  price: null,
  candles: [],
});
let snapshot = emptySnapshot();

self.onmessage = (event) => {
  if (event.data?.type === 'INIT') {
    intervalSeconds = Math.max(1, Number(event.data.intervalSeconds) || 60);
    const initial = event.data.snapshot;
    snapshot = initial && Array.isArray(initial.candles)
      ? {
          status: initial.status || 'UNAVAILABLE',
          lastSequence: initial.lastSequence ?? null,
          lastTimestamp: initial.lastTimestamp ?? null,
          price: Number.isFinite(initial.price) ? initial.price : null,
          candles: initial.candles.slice(-500),
        }
      : emptySnapshot();
    return;
  }

  if (event.data?.type === 'KLINE') {
    const kline = event.data.kline;
    if (!kline?.candle || !Number.isFinite(kline.observedAt)) return;
    const candles = [...snapshot.candles];
    const index = candles.findIndex((candle) => candle.time === kline.candle.time);
    if (index >= 0) candles[index] = kline.candle;
    else candles.push(kline.candle);
    candles.sort((left, right) => left.time - right.time);
    snapshot = {
      status: 'LIVE',
      lastSequence: snapshot.lastSequence,
      lastTimestamp: Math.max(snapshot.lastTimestamp || 0, kline.observedAt),
      price: kline.candle.close,
      candles: candles.slice(-500),
    };
    self.postMessage(snapshot);
    return;
  }

  if (event.data?.type !== 'TICK') return;
  const tick = event.data.tick;
  if (tick.sequence !== undefined && snapshot.lastSequence !== null && tick.sequence <= snapshot.lastSequence) return;
  if (snapshot.lastTimestamp !== null && tick.timestamp < snapshot.lastTimestamp - intervalSeconds * 1000) return;
  const bucket = Math.floor(tick.timestamp / (intervalSeconds * 1000)) * intervalSeconds;
  const candles = [...snapshot.candles];
  const last = candles.at(-1);
  if (last?.time === bucket) {
    candles[candles.length - 1] = {
      ...last,
      high: Math.max(last.high, tick.price),
      low: Math.min(last.low, tick.price),
      close: tick.price,
      volume: (last.volume || 0) + (tick.volume || 0),
    };
  } else if (!last || bucket > last.time) {
    candles.push({
      time: bucket,
      open: tick.price,
      high: tick.price,
      low: tick.price,
      close: tick.price,
      volume: tick.volume || 0,
    });
  }

  snapshot = {
    status: 'LIVE',
    lastSequence: tick.sequence ?? snapshot.lastSequence,
    lastTimestamp: tick.timestamp,
    price: tick.price,
    candles: candles.slice(-500),
  };
  self.postMessage(snapshot);
};
