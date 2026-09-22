# NEXI Frontend State and Data Model

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## State ownership
- Server state: TanStack Query or equivalent typed cache for catalog, prices, balances, orders, positions, content, and configuration.
- Session state: server-authoritative identity with refresh/revocation behavior; local storage is not final authority.
- UI state: drawers, tabs, form drafts, filters, and responsive shell only.
- Shared product state: one Active Asset/Pair validated against the backend catalog and persisted with safe recovery.

## Navigation and locale state
The shell owns drawer presentation state locally: `isOpen`, focus-trap lifecycle, route-close behavior, backdrop-close behavior, Escape handling, reduced-motion preference, and scroll lock. It does not own market or wallet data.

```ts
type SupportedLocale = 'en' | 'zh-CN' | 'ko' | 'ru' | 'es' | 'ms';

type LocaleState = {
  locale: SupportedLocale;
  source: 'profile' | 'local' | 'default';
  isPersisting: boolean;
};
```

The locale resolver uses authenticated profile preference first, local persistence before authentication, and English as the deterministic default. Locale changes invalidate/re-render translated navigation, forms, validation, system states, and content while leaving asset symbols, pair identifiers, and financial notation unchanged. The profile persistence endpoint and backend-managed content translation payload remain contract gates; the frontend must render an explicit fallback state when a translation is unavailable.

## Canonical client models
`Asset`, `Network`, `MarketPair`, `MarketQuote`, `PairCapability`, `BinaryDuration`, `BinaryDirection`, `SpotOrder`, `SpotTrade`, `BinaryPosition`, `WalletDomain`, `Balance`, `WalletAssetDetail`, `LedgerEntry`, `Deposit`, `Withdrawal`, `MiningProduct`, `LoanProduct`, `Ticket`, `Conversation`, `Announcement`, `Course`, `FeatureFlag`, and `OperationalState`.

## Binary direction presentation
The public UI uses `Long` and `Short`:

```ts
type BinaryDirection = 'LONG' | 'SHORT';
// LONG  => price ends higher at expiry
// SHORT => price ends lower at expiry
```

The current backend request contract exposes `direction: 'UP' | 'DOWN'`. Until a versioned contract changes, the frontend adapter maps `LONG` to `UP` and `SHORT` to `DOWN`, validates the mapping at the contract boundary, and never exposes `Call` or `Put` as the user-facing copy.

## Wallet state
Wallet server state must distinguish portfolio totals, available balance, locked/in-orders balance, asset list, supported networks, deposit/withdrawal capability, internal transfer capability, and transaction history. Network addresses, QR payloads, withdrawal limits/fees, and wallet section availability are backend/Admin data; the frontend must render unavailable states rather than inventing them.

## Active instrument contract
The frontend should preserve the existing `useActivePair` compatibility surface while adding a catalog-resolved instrument model:

```ts
type MarketCategory = 'CRYPTO' | 'METAL' | 'FOREX' | 'SHARES';

type PairCapability = {
  canViewChart: boolean;
  canSpot: boolean;
  canBinary: boolean;
};

type ActiveInstrument = {
  assetId: string;
  pair: string;
  normalizedPair: string;
  symbol: string;
  displayName: string;
  category: MarketCategory;
  capabilities: PairCapability;
};
```

`ActivePairProvider` remains the shared owner. Its implementation target is `activeInstrument`, `setActiveInstrument`, `setActivePair` as a compatibility resolver, and safe clearing when the backend catalog rejects a URL or persisted pair. URL, persisted state, Quotes Hub selection, Asset Detail, Spot, and Binary must resolve through one normalization/validation function.

## Asset Detail view model
The route-level adapter maps the backend market contract into an `AssetDetailModel` with `assetId`, `pair`, `displayName`, `category`, `capabilities`, `currentPrice`, `change24h`, `volume24h`, `state`, `updatedAt`, `stats`, category-specific `about`, and supported chart timeframes. Numeric fields remain nullable. The adapter must not turn fallback rows, mock OHLC, or unavailable values into live market data.

## Data-state contract
Every data-bearing surface distinguishes `LOADING`, `LIVE`, `STALE`, `UNAVAILABLE`, `DISABLED`, and `ERROR` where applicable. Fallback catalog rows may describe structure but cannot masquerade as live prices, payouts, balances, or availability.

## Adapter boundary
Runtime-validate API and event payloads before committing them to client state. Reject malformed durations, unsupported pair capabilities, invalid numeric fields, stale timestamps beyond policy, and unauthorized configuration.

## Synchronization
URL pair, persisted pair, Dashboard selection, Spot, and Binary resolve through one normalization/validation function. WebSocket updates merge by stable identifiers and never bypass server-query invalidation or freshness rules.

## Flow state transitions
Quotes Hub selects an asset, Asset Detail establishes the active instrument, and Spot or Binary consumes that same instrument. A route transition may carry a normalized symbol, but it is not an independent source of truth. Capability checks can disable an execution action while retaining the detail page. Market status controls chart, price, order, payout, and position states independently; a missing quote never authorizes invented values. Wallet is a separate authenticated product state surface and does not own the active market pair.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
