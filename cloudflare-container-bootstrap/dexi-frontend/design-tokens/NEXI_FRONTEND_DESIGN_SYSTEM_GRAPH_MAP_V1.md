# NEXI Frontend Design System — Graph Map V1

**Status:** Searchable architecture-analysis receipt
**Provenance:** PPTX design-system analysis plus Graphify and Codebase Memory
**Date:** 2026-08-07
**Scope:** Public frontend visual system and its existing market/runtime connections

This document records the design-system graph mapping so it remains searchable
by Codebase Memory and discoverable through Graphify. It does not replace the
visual authorities or authorize database, deployment, Cloudflare, or financial
rule changes.

## God nodes

The highest architectural hubs observed were:

- `PrismaService`
- `AdminDataProvider`
- `NexiAdminApiProvider`
- `NEXI Current Program Status`
- `AuthenticatedRequest`
- `AdminController`
- `AdminService`
- `LedgerAuthorityService`
- `RedisService`

These are infrastructure and control hubs, not visual-authority nodes.

## Relevant communities and connections

### Design-system community

Connected sources:

- `DESIGN.md`
- `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md` (current Public visual/interaction authority)
- `cloudflare-container-bootstrap/dexi-frontend/design-tokens/figma/nexi-foundations-extracted.json`
- `NexiPrimitives.tsx`
- `ProductPrimitives.tsx`
- `AppHeader.tsx`
- `BottomNav.tsx`

### Realtime chart community

Connected sources:

- `RealtimeTradingChart.tsx`
- `TradingChart.tsx`
- `useRealtimeMarket`
- `market-stream.ts`
- `MarketKlineQueryDto`
- `MarketAuthorityService`
- `EventsGateway`
- `RedisService`

`RealtimeTradingChart` consumes `useRealtimeMarket`, maps connection states,
and renders `TradingChart`.

### Market-data community

Connected sources:

- `MarketAuthorityService`
- `market-authority.service.ts`
- `market-kline.contract.ts`
- `market-catalog.ts`
- `market/prices/route.ts`
- `market/klines/route.ts`
- `normalizeMarketTick`
- `applyMarketTick`

The frontend rejects duplicate or out-of-order tick sequences and updates
candle buckets from accepted market ticks.

### Asset/icon community

Connected sources:

- `asset-registry.ts`
- `AssetIcon.tsx`
- `SymbolSelector.tsx`
- `QuotesHubVisuals.tsx`
- Wallet `AssetList.tsx`
- `AssetDetailPage`
- Admin asset-provider routes

The icon registry is shared across Dashboard, Spot, Binary, Wallet, and Asset
Detail.

### Spot/Binary community

Connected sources:

- `dashboard/spot/page.tsx`
- `dashboard/binary/page.tsx`
- `SpotGateway`
- `BinaryGateway`
- `SpotService`
- `BinaryService`
- `TradingChart`
- `TimeframeSelector`

## PPTX alignment

Aligned areas:

- Deep Liquid Violet palette
- Glass tiers
- Lightweight Charts
- live, reconnecting, and stale states
- Socket/Redis market architecture
- asset-icon fallback strategy
- mobile bottom navigation
- reduced-motion behavior
- tabular financial numerals

The PPTX heading's `57 assets` is stale or inconsistent with its own
breakdown. The canonical NEXI catalog remains **53 assets**:

```text
17 Crypto + 20 Stocks + 9 Forex + 7 Metals = 53
```

## Architecture implication

```text
Design tokens
→ shared primitives
→ navigation/header
→ asset registry
→ market stream
→ realtime chart
→ backend market authority
→ Redis/PostgreSQL
```

The PPTX is connected to the existing NEXI implementation rather than being a
separate visual system. Remaining work is live-behavior reconciliation, not
visual-foundation reconstruction.
