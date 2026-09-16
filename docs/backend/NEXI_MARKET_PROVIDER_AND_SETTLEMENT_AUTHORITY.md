# NEXI Market Provider and Settlement Authority

Status: **DESIGN APPROVED — POLICY AND GAP SPECIFICATION ONLY**  
Date: 2026-08-11  
Scope: NEXI Spot, Binary/Microtrade, market intelligence, and the 53-asset catalog.  
Mutation boundary: no provider installation, API key, `.env`, Prisma schema, migration, database, runtime, Cloudflare, or deployment change is made by this document.

## 1. Decision

NEXI must separate four roles for every asset:

1. metadata and reference information;
2. display/reference quote;
3. chart/Kline source;
4. Binary/Microtrade settlement authority.

The same provider may serve more than one role, but one role must not be inferred from another. Display failover is allowed only inside the backend market-data layer. Settlement must never switch providers dynamically after an outage or after observing a possible result.

## 2. Target architecture

```text
provider adapters
  → normalized market data
  → validation: price, timestamp, sequence, freshness, capability
  → MarketAuthorityService
  → D1 MarketQuoteSnapshot / MarketQuoteLatest / MarketKline
  → Redis publication/cache
  → MarketGateway / Socket.IO
  → frontend projections

authoritative settlement feed
  → SettlementAuthorityService contract
  → BinaryService entry/expiry commands
  → immutable provenance + ledger settlement
```

`MarketDataModule` and `SettlementService` are separate authorities even when they consume the same provider.

## 3. Candidate provider matrix

These are candidates, not approvals. Exact instrument coverage, freshness, licensing, redistribution rights, price semantics, and runtime evidence remain required before settlement approval.

| Asset class | Count | Metadata/reference | Display/chart candidate | Settlement status |
|---|---:|---|---|---|
| Crypto | 17 | CoinGecko primary; CoinMarketCap fallback/validation | Current repo has a Binance Spot adapter candidate, but staging authority is unproven and disabled in `.env.example` | UNAPPROVED |
| Stocks | 20 | Massive primary; Finnhub fallback | Massive REST/WebSocket candidate; Finnhub fallback | UNAPPROVED |
| Forex | 9 | Massive primary; Finnhub/OANDA fallback | Massive candidate; OANDA candidate for pair pricing | UNAPPROVED; USD/RUB coverage unverified |
| Precious metals | 4 | OANDA/Metals-API candidates | OANDA primary candidate; Metals-API reference/fallback | UNAPPROVED; account instrument catalog required |
| Industrial metals | 3 | Metals-API/MetalpriceAPI candidates | Reference/historical capabilities must be distinguished from real-time | UNAPPROVED; Binary disabled until proven |

For crypto, the current honest state is:

```text
CURRENT_IMPLEMENTATION = Binance Spot adapter exists
CURRENT_RUNTIME_AUTHORITY = unproven/unresolved
PROVIDER_CANDIDATE = Binance Spot
MARKET_PROVIDER_ENABLED in backend/.env.example = false
configured example symbols = BTCUSDT only
SETTLEMENT_APPROVAL = unapproved
```

This is not a claim that staging currently streams Binance data.

## 4. Capability-aware AssetSourceRegistry

The backend needs one canonical registry, whether initially code-backed or later persisted through governed Admin configuration. It must contain at least:

```ts
type AssetSourcePolicy = {
  canonicalAssetId: string;
  assetClass: 'crypto' | 'stock' | 'forex' | 'metal';
  displaySymbol: string;
  precision: number;
  providerMappings: Array<{
    provider: string;
    instrument: string;
    quoteSupported: boolean;
    klineSupported: boolean;
    websocketSupported: boolean;
    metadataSupported: boolean;
    settlementCandidate: boolean;
  }>;
  displayPolicy: {
    primaryProvider: string;
    fallbackProviders: string[];
    maxStalenessMs: number;
    delayedDataAllowed: boolean;
  };
  settlementPolicy: {
    enabled: boolean;
    approvalStatus: 'UNAPPROVED' | 'APPROVED';
    provider?: string;
    instrument?: string;
    priceType?: 'BID' | 'ASK' | 'MID' | 'LAST' | 'CANDLE_CLOSE';
    timestampPolicy?: string;
    maxStalenessMs?: number;
    precision?: number;
    outagePolicy?: 'RETRY' | 'WAIT_THEN_VOID' | 'VOID';
  };
  capabilities: {
    marketBrowse: boolean;
    spot: boolean;
    binary: boolean;
    supportedBinaryDurations: number[];
  };
  provenance: {
    providerVerificationStatus: string;
    licensingStatus: string;
    redistributionStatus: string;
    lastVerifiedAt?: string;
  };
};
```

The registry must prevent a stock provider symbol, display pair, and database pair from becoming three unrelated assets. The existing discrepancy is `AAPLUSDT` in backend catalog versus `AAPL.US/USDT` in the frontend registry; the provider mapping should be `AAPL`.

## 5. Truthful display and chart policy

Every normalized quote must preserve provider, provider instrument, provider timestamp, server received timestamp, sequence, and freshness. Public states are:

```text
LIVE | DELAYED | STALE | UNAVAILABLE | UNVERIFIED | ERROR
```

Display failover may move from a primary to an allowed fallback only in the backend. The response/event must expose the actual provider and state. A stale or unknown stream must not be labeled LIVE. Klines must use either validated provider OHLCV candles or explicitly marked trade aggregation; ticker-only fallback may not invent candle volume.

## 6. Settlement policy

Binary/Microtrade must call an explicit authoritative settlement contract, not a generic current-price method. The policy for each enabled asset must pin:

```text
provider
provider instrument
feed type
price field: BID, ASK, MID, LAST, or CANDLE_CLOSE
provider timestamp rule
server UTC expiry timestamp
eligible tick selection rule
precision
maximum staleness
session/market-hours policy
outage/retry/void policy
immutable event ID or hash
```

An illustrative rule such as `FIRST_VALID_TICK_AT_OR_AFTER_EXPIRY` is a required policy decision, not a current NEXI approval. No automatic cross-provider substitution is allowed for settlement.

On authoritative-feed outage, the permitted shape is:

```text
retry authoritative provider
→ WAITING_FOR_SETTLEMENT_DATA / SETTLEMENT_DELAYED
→ VOID or REFUND under an approved policy if recovery fails
```

Industrial metals must remain Spot/reference-only until a sufficiently fresh, timestamped, redistributable settlement feed is verified. The presence of 53 catalog rows does not imply 53 Binary-enabled assets.

## 7. Current source reconciliation

| Area | Current evidence | Classification | Required change |
|---|---|---|---|
| Provider adapter | `backend/src/market/binance-spot.adapter.ts` supports ticker, Kline, depth, and trade shapes; `MarketIngestService` consumes ticker and closed Kline events | PARTIAL | Add provider registry, discovery, depth/trade normalization, and approved source configuration |
| Provider enablement | `backend/.env.example` sets `MARKET_PROVIDER_ENABLED=false`, WS/HTTP examples, and `MARKET_PROVIDER_SYMBOLS=BTCUSDT` | CONFIGURED-BUT-DISABLED | Runtime configuration and staging proof are separate approvals |
| Quote authority | `MarketAuthorityService.ingestQuote` validates positive price, rejects stale sequence, writes snapshot/latest, and publishes Redis | IMPLEMENTED-PARTIAL | Preserve provider instrument/timestamp and capability semantics |
| Quote state | `effectiveState` derives LIVE/STALE from stored state and observedAt; other states are explicit | IMPLEMENTED-PARTIAL | Ensure adapter and gateway never promote unverified data to LIVE |
| Kline persistence | `MarketKlineService.persist` upserts validated OHLCV with provider/source/observedAt; `accumulateQuote` creates quote-derived candles with null volume | IMPLEMENTED-PARTIAL | Add explicit provider-candle versus trade-aggregation mode |
| Redis/Socket.IO | MarketAuthority publishes Redis; MarketGateway emits `market_quote` and `market_tick` with state/provider/source | IMPLEMENTED-PARTIAL | Add normalized depth/trade/candle contracts and reconnect/replay semantics where required |
| Asset source registry | Catalog has category, display name, provider symbol, and metadata provider, but no complete display/settlement capability policy | MISSING | Add capability-aware registry without silently changing the 53 catalog |
| Binary entry provenance | `BinaryService.openPosition` stores quote ID, provider, source, observed/received time, sequence, and freshness | IMPLEMENTED-PARTIAL | Add provider instrument, price type, and policy/version identity |
| Binary expiry selection | `findLiveExpiryQuote` reads only `MarketQuoteLatest`, requires LIVE, freshness, observedAt >= expiresAt, and sequence > entrySequence | IMPLEMENTED-PARTIAL | Pin an explicit settlement provider/feed/price/timestamp policy and preserve immutable event identity |
| Settlement provenance | `settlePosition` stores expiry quote ID, provider, source, observed/received time, sequence, price, and receipt | IMPLEMENTED-PARTIAL | Add provider instrument, price type, policy version, selected-tick rule, and replay evidence |
| No valid expiry quote | Current code moves the position to `SETTLEMENT_DELAYED` | IMPLEMENTED-PARTIAL | Add bounded retry/void/refund policy and auditable reason/timing |
| Cross-provider failover | No settlement failover authority is proven; current ingestion is Binance-specific | MISSING | Allow display fallback only; explicitly forbid settlement substitution |
| Per-asset Binary capability | `Gate2BinaryConfiguration` is pair/duration/version/enabled; `BinaryService` uses global durations `[30,60,180,280,420]` | IMPLEMENTED-PARTIAL | Add per-asset capability/eligibility and verified duration matrix |
| Durable truth | Quotes/Klines are D1 models; Aiven Valkey is publication/transport | IMPLEMENTED | Keep settlement evidence durable and replayable |
| Provider licensing/config provenance | No current evidence proves credentials, redistribution approval, or staging runtime authority | UNVERIFIED | Record verification status without printing secrets |

## 8. Exact current Binary behavior

Source evidence:

- `BinaryService.openPosition` resolves an active pair, requires an enabled pair/duration configuration, requires a fresh latest quote, reserves stake in a transaction, and stores entry evidence.
- `BinaryService.findLiveExpiryQuote` uses the latest quote only. It requires `state === LIVE`, a positive price, `observedAt`, received freshness within `NEXI_MARKET_STALE_AFTER_MS` (default 30 seconds), `observedAt >= expiresAt`, and `sequence > entrySequence`.
- `BinaryService.settlePosition` locks the position, delays if no eligible quote exists, pins the configuration version, calculates the outcome, performs ledger settlement, and stores expiry evidence.

This is stronger than a client-side or random-price settlement, but it is not yet a fully provider-pinned settlement authority because the current quote model does not carry provider instrument or price type and the latest-quote lookup does not document a feed-specific selection policy.

## 9. Required backend changes before provider migration is complete

1. Add the capability-aware `AssetSourceRegistry` for all 53 assets.
2. Normalize internal, display, and provider symbols, especially stocks.
3. Add provider adapters and normalized quote/depth/trade/candle contracts.
4. Preserve provider instrument, provider timestamp, received timestamp, sequence, and freshness through persistence and events.
5. Distinguish provider candles from trade aggregation and quote-derived fallback candles.
6. Add a separate settlement authority service/contract with pinned feed semantics.
7. Extend entry and expiry provenance with instrument, price type, policy/version, and selected-event identity.
8. Add per-asset Spot/Binary capability and duration policy.
9. Define deterministic outage, retry, waiting, void/refund, and audit behavior.
10. Verify coverage, licensing/redistribution, staging configuration, D1 persistence, Aiven Valkey publication, Socket.IO delivery, and browser rendering per asset class.

No item above is implemented by this document.

## 10. Required verification questions

The implementation campaign must answer these with source and runtime evidence:

1. Is display/reference distinct from settlement in `MarketAuthorityService`?
2. Are provider timestamps preserved in `MarketIngestService`?
3. Does normalized quote data retain provider instrument and freshness?
4. What exact feed and price field does `findLiveExpiryQuote` select?
5. Is the selected value first-after, last-before, latest stored, or another rule?
6. Is any cross-provider fallback applied during settlement?
7. What happens when no valid expiry quote arrives?
8. Does `settlePosition` preserve all provenance required for replay?
9. Does entry provenance pin the same policy as expiry?
10. Are Binary capabilities and durations per asset?
11. Can an asset be Spot-enabled while Binary-disabled?
12. Which evidence is D1 durable versus Aiven Valkey ephemeral?
13. Can a result be deterministically replayed from stored events?
14. Are failovers visible and auditable?
15. Which provider/environment configuration is active in each environment?

## 11. Evidence sources

### Local authority

- `backend/src/market/market-catalog.ts`
- `backend/src/market/market-authority.service.ts`
- `backend/src/market/market-ingest.service.ts`
- `backend/src/market/binance-spot.adapter.ts`
- `backend/src/market/market-kline.service.ts`
- `backend/src/market/market.gateway.ts`
- `backend/src/binary/binary.service.ts`
- `backend/prisma/schema.prisma`
- `backend/.env.example`
- `work/20260811-canonical-asset-logo-reconciliation/CANONICAL_53_ASSET_LOGO_BRIEF.md`
- `work/20260811-canonical-asset-logo-reconciliation/OFFICE_AGENT_53_ASSET_METADATA_AND_LOGO_BRIEF.md`

### External documentation used for candidate research

- [Binance Spot market data](https://developers.binance.com/en/docs/binance-spot-api-docs/rest-api/market-data-endpoints)
- [Binance Spot WebSocket streams](https://developers.binance.com/en/docs/binance-spot-api-docs/web-socket-streams)
- [Massive Stocks REST](https://massive.com/docs/rest/stocks)
- [Massive Stocks WebSocket](https://massive.com/docs/websocket/stocks/overview?assetClass=stocks&license=personal&name=stocks_starter)
- [Massive Forex](https://massive.com/docs/rest/forex/overview?auth=login%2Fgetting-started)
- [OANDA pricing](https://developer.oanda.com/rest-live-v20/pricing-ep/)
- [Metals-API documentation](https://metals-api.com/documentation)
- [Binance bStocks context](https://academy.binance.com/ky-KG/articles/what-are-bstocks-a-guide-to-tokenized-stocks-on-binance)

External pages establish candidate capabilities only; they do not establish NEXI staging health, licensing approval, settlement approval, or runtime proof.

## 12. Non-actions and completion boundary

```text
FILES_CREATED = this policy/gap spec and the Office Agent 53-asset brief
SOURCE_CODE_CHANGED = false
DATABASE_OR_PRISMA_CHANGED = false
PROVIDER_ENABLED = false
API_KEYS_OR_SECRETS_CHANGED = false
RUNTIME_OR_CLOUDFLARE_CHANGED = false
DEPLOYED = false
SETTLEMENT_APPROVED = false
```

The next implementation slice requires explicit approval for backend source/schema/config changes and must begin with the provider registry and normalized contract, not browser acceptance.

