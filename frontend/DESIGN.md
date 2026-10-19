# NEXI Public Frontend — Design Authority

## 1. Purpose

This document is the current frontend-local visual and interaction authority for `frontend`.

It exists to stop visual drift, accidental revival of rejected concepts, and generic redesigns that ignore the accepted NEXI product language.

It does not replace:
- current owner decisions;
- current source/runtime truth;
- backend/domain authority;
- repository-root governance.

When this document conflicts with a newer explicit owner correction, the newer owner correction wins and this document should be reconciled.

## 2. Visual authority order

Use this order for frontend design decisions:

1. Current explicit owner corrections.
2. The five recent owner-approved mobile reference screens:
   - Quotes Hub / market discovery;
   - Options / Binary;
   - wallet-provider chooser bottom sheet;
   - Spot/Margin trading;
   - Wallet overview.
3. Later NEXI-specific implementation decisions that adapt those references.
4. Current rendered source when it represents a verified intentional adaptation.
5. The Sep-16 frontend implementation specification for requirements that remain current.
6. Older visual lineage only when it does not conflict with newer decisions.

Explicitly rejected:
- `nexi_deep_liquid_violet_trading_concept.png`;
- `nexi_synthesized_spot_direction.png`.

Older Sep-12/Sep-13 V2/V3 designs are historical lineage, not the current visual target.

The five reference screens express design intent. They are not a demand for pixel-for-pixel reproduction where later NEXI decisions improved behavior, semantics, responsiveness, or backend truthfulness.

## 3. Product character

NEXI is a dense, mobile-first financial operation surface.

The experience should feel:
- dark;
- precise;
- high-signal;
- fast;
- compact;
- premium without decorative excess;
- trustworthy;
- operational rather than promotional.

The product should not feel like:
- a generic crypto-exchange clone;
- a marketing landing page;
- a collection of unrelated glass cards;
- a cinematic showcase;
- a dashboard full of fake sample numbers;
- a debug console exposed to consumers.

## 4. Core visual system

### Canvas

Primary canvas is near-black with restrained violet/cyan atmosphere.

Current source tokens define:
- calibrated canvas: `#050508`;
- deep canvas: `#0b0a0e`;
- reference abyss: `#01010e`;
- reference base: `#06041a`;
- ambient: `#0b0924`.

The background may use subtle violet/cyan radial atmosphere. It must not reduce chart legibility or compete with financial state.

### Surfaces

Current token family:
- glass surface: `#0c0a26`;
- raised: `#161239`;
- active: `#221259`;
- execution: `#080720`;
- calibrated card: `#1a0c24`;
- calibrated active: `#2c146c`.

Use elevation only when grouping or interaction hierarchy benefits from it. Do not wrap every content block in a generic card.

### Violet identity

Primary violet family:
- `#6d41ff`;
- `#8b5cf6`;
- calibrated violet `#7353dd`;
- bright calibrated violet `#7c3aed`;
- focus `#b996ff`.

Violet is NEXI identity and selection/focus energy. It is not a license to fill every surface purple.

Prefer:
- thin luminous rims;
- active edges;
- restrained glow;
- selected-state emphasis;
- focus treatment.

### Market/data accents

Data cyan:
- `#48c0cc`;
- strong `#22d3ee`;
- soft `#98fce4`.

Positive:
- `#22c55e`.

Negative:
- `#ef4444`.

Warning:
- `#f59e0b`.

Never rely on red/green alone to communicate meaning.

### Text

Primary text:
- `#f5f7fb`.

Secondary/muted:
- `#93a4bd`.

Financial values should use stable/tabular numeric rendering where practical.

## 5. Typography

Geist is the current NEXI type identity.

Use:
- strong, compact display hierarchy for page identity;
- clean medium-weight section headings;
- restrained secondary labels;
- monospaced/tabular treatment for prices, IDs, quantities, and timing where it improves scanning.

Current source type targets include:
- display: 48/52;
- large heading: 24/30;
- medium heading: 20/26;
- body: 14/21;
- label: 11/16;
- data: 14/20.

These are system targets, not a requirement to use the same size in every responsive state.

Do not create oversized marketing typography that pushes trading information below the first viewport.

## 6. Shape, density, spacing

Current radius family:
- 8px;
- 12px;
- 16px;
- 20px;
- 24px;
- pill only when the semantic shape is actually pill-like.

Current operational dimensions:
- primary control target: approximately 44px;
- compact row: approximately 44px;
- market row: approximately 56px;
- mobile dock design token: approximately 72px including the system concept of persistent dock space.

Density is intentional. Preserve information density while keeping controls operable.

Prefer spacing and dividers over additional cards when a new card adds no useful hierarchy.

## 7. Shared application shell

Across the five reference screens, the shell is visually consistent.

### Header

The mobile header should preserve:
- NEXI wordmark/mark;
- wallet/account control;
- language control;
- notifications;
- safe-area clearance;
- compact vertical height.

It must remain visually stable across product routes.

Do not introduce large route-specific mastheads that break shell continuity.

### Bottom dock

Exactly five persistent mobile destinations:

1. Dashboard
2. Spot/Margin
3. Options
4. Wallet
5. Earn

The selected destination uses clear violet emphasis and an active indicator.

No sixth persistent tab.

Nested surfaces such as Asset Detail, Loans, Support, Learn, Messages, Settings, Profile/KYC/Security are reached through contextual navigation/drawer/account flows, not added as persistent dock items.

The dock must remain clear of the device safe area and must never cover primary actions, sheet controls, or content needed to finish a task.

## 8. Quotes Hub

Reference intent:
- compact application header;
- prominent but efficient Quotes Hub identity;
- market search;
- visible selected Active Pair;
- category rail:
  `Favorites | Crypto | Metals | Forex | Stocks`;
- dense market rows;
- local NEXI asset icon;
- symbol/name;
- compact sparkline where useful;
- authoritative price/change/volume when supplied;
- persistent dock.

Market rows should optimize rapid comparison, not behave like large promotional cards.

Changing category/filter does not silently reset Active Pair.

All canonical assets remain discoverable even when a provider is stale/error/closed.

Do not display provider/exchange logos as asset identity.

## 9. Asset Detail

Asset Detail bridges discovery and trading.

It should:
- preserve selected instrument;
- show local NEXI asset identity;
- show current authoritative market context;
- carry the pair into Spot/Margin and Options;
- avoid becoming a duplicate market-state owner;
- keep primary actions visible without turning into a marketing page.

## 10. Spot/Margin — primary trading reference

The attached Spot/Margin screen is the strongest trading-layout visual reference.

### Required hierarchy

On mobile, conceptual order:

```text
compact pair / price context
Spot | Margin selector

dominant K-line workspace
  timeframe rail
  OHLC/current change context
  candle chart + volume
  indicator rail

execution + market depth relationship
recent market context where needed

activity / open orders / history
persistent five-tab dock
```

The chart is the primary visual mass.

Do not place an oversized market-summary panel above it.

### Pair header

Keep:
- back/context navigation where needed;
- local asset mark;
- pair;
- current price/change;
- favorite/watch action when product-supported.

The pair identity should read immediately.

### Spot/Margin switch

The switch is visually prominent enough to prevent mode confusion but should not consume excessive vertical space.

Margin is nested in this destination, not a sixth dock item.

### Timeframes

Canonical intervals:
- 1m
- 5m
- 15m
- 30m
- 1h
- 4h
- 1d

On narrow screens, use bounded horizontal scrolling rather than shrinking touch targets to illegible sizes.

### Indicators

Available chart controls:
- MA
- EMA
- BOLL
- RSI
- MACD
- VOL

On Spot/asset chart surfaces, keep these controls in the compact rail below the plotted region, matching the accepted reference hierarchy. Binary may retain the selected overlays without adding the six-button rail to the trade-ticket composition. Controls remain keyboard-operable and preserve selected state. Do not overload the plotted region with decorative UI.

### Chart

The chart should retain:
- readable candlesticks;
- volume;
- price scale;
- time scale;
- current-price context;
- OHLC context;
- visible selected timeframe;
- selected indicator state;
- usable resize behavior.

Chart motion should represent actual data or user interaction, not decorative animation.

Chart accessibility requires surrounding textual pair/status/value context. Do not claim chart accessibility from candle colors alone.

### Order ticket and depth

The reference visually couples execution and order-book context.

On wider mobile/tablet/desktop arrangements, execution ticket and market depth may appear side-by-side when space permits.

On narrow mobile, a responsive panel/tab adaptation is acceptable if it is an intentional NEXI adaptation and keeps Chart / Order book / Trades immediately reachable.

Do not force an impossible two-column depth/ticket layout onto 320px screens merely to copy the reference image.

The execution ticket must retain:
- Buy/Sell distinction;
- order type;
- price/amount;
- allocation controls only when backed by real available balance behavior;
- review-before-submit;
- inline validation;
- truthful unavailable/disabled state.

No fake depth or trade rows.

## 11. Options / Binary

The reference uses the same market/chart language but a focused options ticket.

Public terminology:
- Long / Short where current product decision requires it.

Backend configuration remains authoritative for:
- enabled durations;
- limits;
- payout/configuration;
- outcome semantics.

The frontend must not hardcode a historical duration list as authority.

The main decision area should emphasize:
- selected instrument;
- duration/config;
- stake;
- estimated payout when backend-backed;
- review;
- Long/Short action;
- result state.

Keep WIN/LOSS presentation direct and unambiguous.

## 12. Wallet

Wallet visual hierarchy from the accepted reference family:

1. Wallet title/context.
2. Compact Total Assets hierarchy.
3. key account totals/scopes.
4. Quick actions.
5. scope tabs.
6. holdings.
7. recent activity.
8. persistent dock.

Wallet numbers must be authoritative.

Do not invent:
- portfolio history;
- P&L;
- all-time returns;
- balances;
- pending amounts;
- transaction history.

If the backend does not supply a field, omit it or show an honest unavailable state rather than filling the reference layout with synthetic numbers.

Required quick actions where supported:
- Deposit
- Withdraw
- Transfer
- Convert

Deposit remains a two-step flow:
`Select asset -> Deposit details`.

Do not fabricate address, network, QR code, minimum, confirmation count, or instructions.

## 13. Wallet chooser / sheets

The accepted wallet chooser is a bottom-sheet reference.

Requirements:
- sheet rises over visible app context;
- bounded size;
- clear title and reason;
- explicit provider choice;
- dismiss control;
- safe-area handling;
- persistent dock is not accidentally covered when product behavior expects it visible;
- focus should enter and remain appropriately contained while open;
- escape/back/dismiss behavior should be predictable.

Never silently auto-select a wallet provider.

## 14. Market status and degraded state language

Current public-facing market status vocabulary is:

- `Live`
- `Error`
- `Closed`

This newer owner/source decision supersedes old documents that exposed raw `STALE`, `UNAVAILABLE`, `CONNECTION_LOST`, or provider diagnostics directly to ordinary users.

Internal state can remain detailed for recovery logic.

Consumer UI should:
- preserve last valid context where safe;
- avoid pretending old data is live;
- avoid dumping internal provider/debug vocabulary;
- keep the instrument discoverable;
- use `Closed` only when the session is actually closed;
- use `Error` for non-live failures according to current source policy.

Provider staleness is not a current redesign target by itself.

## 15. Loading, empty, error, and recovery states

Every important surface should deliberately represent:
- loading;
- loaded;
- legitimate empty;
- error;
- retry where supported;
- recovery.

Prefer layout-matched loading states that preserve orientation.

Do not erase an entire trading workspace because one panel is refreshing.

Error copy should explain what the user can do next without exposing stack/provider internals.

## 16. Responsive contract

Intentionally support:
- 320px;
- 360px;
- approximately 390px;
- 412/430px;
- tablet;
- desktop;
- short-height mobile.

Rules:
- no persistent horizontal page overflow;
- horizontal rails are acceptable inside bounded timeframe/category containers;
- financial CTA and review controls must clear the dock;
- sheets/drawers must clear safe areas;
- chart remains dominant;
- dense tables may become compact rows, contained horizontal regions, tabs, or progressive disclosure;
- information required for a financial decision must not disappear merely to fit the screen.

At 200% zoom, required content should not overlap or truncate.

At 400% zoom, reflow should avoid simultaneous horizontal and vertical page scrolling where the UI can reasonably reflow into a single-column reading/task sequence.

## 17. Accessibility

Baseline:
- semantic buttons/links/inputs;
- accessible names;
- visible focus;
- keyboard operation where desktop keyboard use is expected;
- adequate contrast;
- no color-only financial meaning;
- labels and validation associated with financial inputs;
- sensible sheet/dialog focus and dismissal;
- text scaling without critical clipping;
- reduced-motion support;
- consistent navigation placement.

Touch density does not justify tiny hit targets.

The financial UI may be dense, but task completion and clarity take priority over fitting everything into one viewport.

Use BrowserStack accessibility scanning plus rendered browser/device checks for final acceptance.

## 18. Motion

Current motion-token intent:
- immediate: ~80ms;
- press: ~100ms;
- tab: ~140ms;
- feedback: ~180ms;
- modal: ~220ms;
- drawer: ~250ms.

Purpose:
- acknowledge input;
- preserve orientation;
- communicate selection;
- clarify open/close or state transition.

Do not use:
- parallax;
- cinematic page transitions;
- scroll storytelling;
- decorative chart motion;
- continuous ambient animation that competes with price movement.

Reduced-motion mode should remove nonessential travel/animation while preserving state visibility. Do not make controls feel broken by eliminating every useful feedback cue.

## 19. Next.js 16 rendering design rules

The visual system and framework architecture should reinforce each other.

Prefer:
- Server Component shell for stable structure;
- small client islands for charts, wallet, realtime, forms, sheets, locale and navigation state;
- route loading boundaries that keep stable shell visible;
- route error boundaries that fail locally;
- framework navigation/prefetch instead of custom SPA routing;
- Metadata API for route/document identity;
- selective dynamic loading for genuinely heavy browser-only visualization code.

Do not use Server Components to re-own NestJS business logic.

Do not cache volatile market/financial/auth state just to make a navigation benchmark faster.

## 20. Component-system discipline

Shared components should exist because multiple routes need the same semantic behavior, not merely because two rectangles look alike.

Good shared owners:
- AppHeader;
- BottomNav;
- Sidebar/NavigationDrawer;
- AssetIcon;
- wallet access/connect controls;
- modal/sheet primitives;
- chart shell/primitives;
- pair selection;
- NEXI financial input primitives.

Avoid:
- generic Card abstractions that erase product hierarchy;
- nested wrapper components that only forward className;
- duplicate variants of the same shell control;
- route-local components promoted globally before a second real consumer exists.

## 21. Visual acceptance method

For each accepted reference surface, maintain this reasoning model:

```text
REFERENCE INTENT
-> CURRENT NEXI-SPECIFIC DECISION
-> CURRENT RENDER
-> INTENTIONAL DEVIATION or DEFECT
-> SMALLEST FIX IF DEFECT
```

Do not grade fidelity from source code alone.

Final visual proof requires rendered evidence.

For Spot/Margin, verify at minimum:
- pair/header density;
- Spot/Margin selector;
- chart dominance;
- timeframe usability;
- OHLC/indicator hierarchy;
- chart dimensions;
- execution/depth relationship;
- dock clearance;
- short-height behavior;
- 320/360/~390/430 widths;
- desktop composition.

For Quotes/Options/Wallet/sheets, verify the same shell language and route-specific information hierarchy.

## 22. Non-goals

Unless the owner explicitly changes scope, do not:
- create a new visual concept;
- revive the two rejected generated concepts;
- revert to old V2/V3;
- add a sixth dock tab;
- redesign backend APIs;
- move business logic into Next.js;
- expose direct D1 access;
- fabricate consumer state;
- brand assets with exchange/provider logos;
- convert the dense product UI into a marketing site;
- add cinematic motion;
- do a full Tailwind migration during the Next.js migration;
- enable every new Next.js 16 feature at once;
- perform a broad folder reorganization in the same change as the framework upgrade.

## 23. Definition of visual completion

A frontend surface is not visually complete because:
- the source contains the expected components;
- TypeScript passes;
- Next build passes;
- Graphify finds the expected path;
- Fallow is clean;
- a single screenshot looks close.

Visual completion requires:
- correct current backend data path;
- correct interaction behavior;
- responsive rendered evidence;
- accessibility evidence appropriate to the changed path;
- no material reference-intent drift unless intentionally documented;
- current owner acceptance at the final gate.
