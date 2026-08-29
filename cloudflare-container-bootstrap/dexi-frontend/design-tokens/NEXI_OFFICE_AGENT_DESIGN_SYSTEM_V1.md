# NEXI Frontend Design System — Office Agent V1

**Status:** Supplemental frontend design authority
**Source:** `C:\Users\mello\Downloads\Nexi Design System -.pptx`
**Ingested:** 2026-08-07
**Scope:** Public NEXI frontend only
**Canonical asset count:** 53

This document preserves the Office Agent design-system deck as a searchable,
repository-local source for Graphify and Codebase Memory. It supplements the
existing visual authority files; it does not replace `DESIGN.md`,
`.stitch\DESIGN.md`, or `docs\design\NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`.

## 1. Frontend default color token

The default NEXI interaction token is:

```css
--nexi-primary: #6D41FF;
```

The existing frontend token layer already exposes this value through
`app/styles/nexi-tokens.generated.css`. These aliases are the frontend-facing
semantic contract:

```css
:root {
  --nexi-canvas: #050508;
  --nexi-background: #0B0A0E;
  --nexi-surface: #0B0711;
  --nexi-surface-raised: #171022;
  --nexi-surface-high: #221249;
  --nexi-primary: #6D41FF;
  --nexi-primary-secondary: #9B55FF;
  --nexi-focus: #B996FF;
  --nexi-cyan: #48C0CC;
  --nexi-aqua: #98FCE4;
  --nexi-positive: #22D3A6;
  --nexi-negative: #FF5C7C;
  --nexi-text: #F8F6FF;
  --nexi-text-secondary: #C3BBD0;
  --nexi-text-muted: #8C8299;
}
```

## 2. Color token system

### Canvas and surfaces

| Token | Value | Use |
|---|---|---|
| `--nexi-canvas` | `#050508` | OLED void/page base |
| `--nexi-background` | `#0B0A0E` | Near-black background |
| `--nexi-surface` | `#0B0711` | Default card surface |
| `--nexi-surface-raised` | `#171022` | Raised panel/modal surface |
| `--nexi-surface-high` | `#221249` | Elevated active surface |
| `--nexi-border` | `#3A124F` | Container borders/separators |
| `--nexi-hover` | `#4A1F6F` | Hover/active row state |

### Interaction and signal colors

| Token | Value | Use |
|---|---|---|
| `--nexi-primary` | `#6D41FF` | Primary CTA, selected tab, active navigation |
| `--nexi-primary-secondary` | `#9B55FF` | Secondary violet/badge |
| `--nexi-focus` | `#B996FF` | Focus ring/soft highlight |
| `--nexi-cyan` | `#48C0CC` | Live-data signal/crosshair |
| `--nexi-aqua` | `#98FCE4` | Supporting live-data accent |
| `--nexi-positive` | `#22D3A6` | Profit/success/up candle |
| `--nexi-negative` | `#FF5C7C` | Loss/error/down candle |

### Text

| Token | Value | Use |
|---|---|---|
| `--nexi-text` | `#F8F6FF` | Headings/primary text |
| `--nexi-text-secondary` | `#C3BBD0` | Supporting text |
| `--nexi-text-muted` | `#8C8299` | Metadata/placeholders |

## 3. Glass hierarchy

Do not apply blur uniformly. Each surface has one intended role.

### Tier 1 — Shell Glass

```css
background: linear-gradient(180deg, rgba(11,9,36,.78), rgba(4,4,24,.90));
backdrop-filter: blur(24px) saturate(160%);
border: 1px solid rgba(255,255,255,.06);
box-shadow: inset 0 1px 0 rgba(255,255,255,.12),
  0 18px 48px rgba(1,1,14,.38);
```

Use for navigation bars, top shells, modal framing and overlays.

### Tier 2 — Raised Atmospheric

```css
background: radial-gradient(circle at 100% 0%, rgba(109,65,255,.16), transparent 48%),
  linear-gradient(135deg, rgba(26,12,36,.88), rgba(12,10,38,.76));
backdrop-filter: blur(22px) saturate(150%);
```

Use for active-pair cards and promotional panels.

### Tier 3 — Execution Surface

```css
background: linear-gradient(180deg, rgba(11,7,17,.97), rgba(8,7,20,.94));
backdrop-filter: none;
border: 1px solid rgba(58,18,79,.40);
```

Use for charts, order books, trade forms and dense financial data. Never use
glass-on-glass nesting on execution surfaces.

## 4. Realtime market contract

The intended frontend path is:

```text
Socket.IO browser client v4.7
→ HTTPS/WSS API endpoint from NEXT_PUBLIC_API_URL
→ Cloudflare Worker router
→ NestJS WebSocket gateway
→ Redis Pub/Sub fan-out
→ PostgreSQL persistent market authority
```

The deck defines these event families:

| Event | Required fields |
|---|---|
| `quote_update` | symbol, lastPrice, change24h, volume24h |
| `kline_update` | symbol, interval, open, high, low, close, volume |
| `depth_update` | symbol, bids[], asks[] |
| `trade_update` | symbol, price, size, side |

Frontend states are `CONNECTING`, `LIVE`, `STALE`, and `DISCONNECTED`.
Reconnect uses exponential backoff from 1 second to 30 seconds with ±20%
jitter. The deck target is below 50ms p95 for live delivery; this is a design
target, not runtime proof.

## 5. Chart contract

- Library: Lightweight Charts 4.
- Background: transparent.
- Financial font: IBM Plex Mono.
- Up candle: `#22D3A6`.
- Down candle: `#FF5C7C`.
- Grid: `rgba(58,18,79,.30)`.
- Crosshair: `#48C0CC`.
- Crosshair label background: `#1A0C24`.
- Required chart inputs: authoritative candles, interval, freshness/status and
  current active symbol.
- Touch behavior: vertical page scroll preserved, horizontal chart drag and
  two-finger pinch enabled.

## 6. Motion and feedback

All interaction motion must be guarded by reduced-motion handling.

| Pattern | Timing/behavior |
|---|---|
| Button press | 100ms, scale `.97`, shadow intensifies |
| Contained ripple | 150ms, opacity `.15` to `0` |
| Tab illumination | 180ms spring/edge-light movement |
| Active navigation glow | 200ms fade |
| Row selection | 80ms immediate background transition |
| Modal entry | 220ms enter easing, translateY 20px to 0 |
| Drawer slide | 250ms, translateX -100% to 0 |
| Success flash | 150ms border pulse, scale 1.02 and back |
| Error shake | 200ms, ±3px for two cycles |
| Trade confirmation | 250ms scale 1.02 plus restrained violet glow |

## 7. Controls and buttons

- Minimum height: 44px.
- Standard radius: 12px.
- Primary background: linear-gradient(135deg, `#6D41FF`, `#9B55FF`).
- Hover: brightness 1.08.
- Pressed: scale `.97`, stronger violet shadow.
- Focus: 2px `#B996FF` outline plus soft ring.
- Disabled: opacity `.40`, no glow.
- Loading: opacity `.70` with spinner.
- Buy: `rgba(34,211,166,.15)` / `#22D3A6`.
- Sell: `rgba(255,92,124,.15)` / `#FF5C7C`.

## 8. Asset icon contract

The corrected frontend catalog is **53 assets**, not the PPTX heading's stale
57 count:

```text
17 Crypto + 20 Stocks + 9 Forex + 7 Metals = 53
```

Icon source order:

1. Simple Icons CDN for supported crypto and stocks.
2. jsDelivr coin-logo fallback for crypto.
3. Deterministic text initials when no approved image exists.

Forex and metals use text initials with deterministic material/flag colors.
Never fabricate a logo or recolor an official logo into NEXI brand colors.

Recommended icon containers are 16px, 24px, 28px, 32px, 36px and 52px;
standard containers are circular with brand-color background opacity `.15` and
border opacity `.33`.

## 9. Typography and spacing

- UI font: Geist Sans.
- Financial data font: IBM Plex Mono.
- Financial values use tabular numerals.
- Heading tracking: approximately `-0.02em`.
- Body line-height: approximately `1.6`.
- Spacing grid: 4, 8, 12, 16, 20, 24, 32 and 48px.

Deck scale:

| Role | Geist Sans | IBM Plex Mono |
|---|---:|---:|
| Display/page title | 32px / 700 | 24px / 600 |
| Section heading | 24px / 600 | 16px / 500 |
| Card title | 18px / 600 | 14px / 500 |
| Body | 14px / 400 | 12px / 400 |
| Label | 12px / 500 | 11px / 400 |

## 10. Responsive frontend contract

| Viewport | Rule |
|---|---|
| 320px | scale .90, horizontal padding 12px, 44px navigation target |
| 360px | scale .95, horizontal padding 12px |
| 390px | scale 1.00, 48px navigation target |
| 430px | scale 1.05, horizontal padding 16px |
| 768px | 200px sidebar, no bottom navigation |
| 1024px | 220px sidebar, max content width 800px |
| 1440px | 240px sidebar, max content width 1160px |

Mobile bottom navigation is fixed, floating and safe-area-aware:

```css
bottom: calc(12px + env(safe-area-inset-bottom));
width: calc(100% - 32px);
max-width: 420px;
height: 72px;
border-radius: 22px;
backdrop-filter: blur(28px) saturate(160%);
```

The five primary mobile items are Dashboard, Spot, Options, Wallet and Earn.
Content must include bottom-dock scroll padding so the dock never hides data.

## 11. Repository connections

Graphify and Codebase Memory connect this specification to:

- `app/styles/nexi-tokens.generated.css`
- `app/globals.css`
- `app/components/NexiPrimitives.tsx`
- `app/components/AppHeader.tsx`
- `app/components/BottomNav.tsx`
- `app/components/NavigationDrawer.tsx`
- `app/components/RealtimeTradingChart.tsx`
- `app/components/TradingChart.tsx`
- `app/lib/market-stream.ts`
- `app/lib/asset-registry.ts`
- `app/components/AssetIcon.tsx`
- `app/components/SymbolSelector.tsx`
- `app/dashboard/spot/page.tsx`
- `app/dashboard/binary/page.tsx`
- `app/dashboard/asset/[symbol]/page.tsx`
- `app/dashboard/wallet/components/AssetList.tsx`
- `backend/src/market/market-authority.service.ts`
- `backend/src/market/market-kline.contract.ts`
- `backend/src/redis/redis.service.ts`

This is a frontend design and interaction contract. It does not authorize
database changes, deployment, Cloudflare mutation, or financial rule changes.
