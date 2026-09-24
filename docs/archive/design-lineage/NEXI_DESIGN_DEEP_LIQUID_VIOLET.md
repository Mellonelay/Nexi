---
version: alpha
name: NEXI
description: Dark-first, mobile-first multi-asset fintech platform with a deep liquid-violet visual language

colors:
  canvas: "#050508"
  background: "#09060E"
  surface: "#100A18"
  surface-raised: "#171022"
  surface-high: "#21152F"
  surface-dim: "#0B0711"
  surface-bright: "#302044"
  surface-container-lowest: "#07040B"
  surface-container-low: "#0E0915"
  surface-container: "#15101E"
  surface-container-high: "#1D1429"
  surface-container-highest: "#291A39"
  surface-variant: "#291A39"

  border-subtle: "#2B2037"
  border-strong: "#49335E"
  outline: "#9A8BAA"
  outline-variant: "#51425F"

  text-primary: "#F8F6FF"
  text-secondary: "#C3BBD0"
  text-muted: "#8C8299"
  on-surface: "#F2ECFA"
  on-surface-variant: "#CFC4DC"
  on-background: "#F2ECFA"

  primary: "#8B5CF6"
  primary-hover: "#A375FF"
  primary-pressed: "#7446D8"
  primary-container: "#2A1742"
  on-primary: "#FFFFFF"
  on-primary-container: "#E8D9FF"
  surface-tint: "#8B5CF6"
  inverse-primary: "#D7C0FF"

  secondary: "#7DF9FF"
  secondary-hover: "#A2FCFF"
  secondary-pressed: "#55DCE5"
  secondary-muted: "#12373E"
  secondary-container: "#173B43"
  on-secondary: "#002F33"
  on-secondary-container: "#C8FCFF"

  tertiary: "#98FCE4"
  tertiary-container: "#124137"
  on-tertiary: "#00382E"
  on-tertiary-container: "#C5FFF1"

  focus: "#A995FF"
  info: "#7DF9FF"
  success: "#22D3A6"
  warning: "#F2C94C"
  error: "#FF5C7C"
  buy: "#22D3A6"
  sell: "#FF5C7C"
  on-error: "#FFFFFF"
  error-container: "#561626"
  on-error-container: "#FFD9E0"

  inverse-surface: "#F0EAF7"
  inverse-on-surface: "#271F30"

  primary-fixed: "#E8D9FF"
  primary-fixed-dim: "#CCAEFF"
  on-primary-fixed: "#25004D"
  on-primary-fixed-variant: "#5E2FA5"

  secondary-fixed: "#C8FCFF"
  secondary-fixed-dim: "#8EF4FA"
  on-secondary-fixed: "#002023"
  on-secondary-fixed-variant: "#00545B"

  tertiary-fixed: "#C5FFF1"
  tertiary-fixed-dim: "#8DEBD7"
  on-tertiary-fixed: "#002019"
  on-tertiary-fixed-variant: "#005143"

typography:
  display-lg:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: -0.015em
  title-lg:
    fontFamily: Geist
    fontSize: 17px
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 450
    lineHeight: 1.5
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 450
    lineHeight: 1.5
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: 450
    lineHeight: 1.45
    letterSpacing: 0em
  label-lg:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: 0.01em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: 0.04em
  data-lg:
    fontFamily: IBM Plex Mono
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.02em
    fontFeature: '"tnum" 1, "zero" 1'
  data-md:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: -0.01em
    fontFeature: '"tnum" 1, "zero" 1'
  data-sm:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0em
    fontFeature: '"tnum" 1, "zero" 1'

rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px
  DEFAULT: 0.75rem

spacing:
  micro: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  screen: 16px
  section: 20px
  touch: 44px
  touch-target: 44px

components:
  app-shell:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: 0px

  glass-shell:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 16px

  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 16px

  panel-raised:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 16px

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px

  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px

  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px

  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px

  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px

  tab:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 8px
    height: 40px

  tab-active:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 8px
    height: 40px

  quote-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.data-md}"
    rounded: "{rounded.none}"
    padding: 12px
    height: 58px

  quote-row-selected:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.text-primary}"
    typography: "{typography.data-md}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 58px

  active-pair:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.data-lg}"
    rounded: "{rounded.md}"
    padding: 14px
    height: 60px

  duration-option:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.data-md}"
    rounded: "{rounded.sm}"
    padding: 8px
    height: 44px

  bottom-navigation:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.lg}"
    padding: 8px
    height: 68px
---

# NEXI Design System

## Overview

NEXI is a dark-first, mobile-first, multi-asset financial platform. Its visual identity combines deep liquid-violet atmosphere with precise institutional data presentation.

The interface must feel advanced, expensive, fast, tactile, and technically credible. It should evoke a next-generation trading instrument without becoming a casino, gaming product, generic crypto dashboard, or decorative cyberpunk concept.

The design uses two layers:

1. **Atmosphere layer** — deep black-purple canvas, restrained liquid-glass depth, soft violet illumination, and limited cyan reflections.
2. **Execution layer** — more opaque surfaces for quote rows, order books, charts, wallet balances, forms, tables, and financial controls.

## Colors

- Use `{colors.canvas}` and `{colors.background}` for the deepest page layers.
- Use `{colors.surface}`, `{colors.surface-raised}`, and `{colors.surface-high}` to create clear depth.
- Use `{colors.primary}` for primary interaction, selected tabs, active navigation, and high-priority actions.
- Use `{colors.secondary}` and `{colors.tertiary}` only for supporting information, focus, live-data emphasis, and restrained visual energy.
- Use buy/sell colors only for genuine financial direction or transaction state.
- Do not recolor official asset or company logos into NEXI colors.

Avoid amber as the primary brand color, rainbow gradients, full-screen purple haze, bright cyan everywhere, and glowing every border.

## Typography

Use Geist for product UI, labels, navigation, controls, headings, and body copy.

Use IBM Plex Mono only for prices, balances, quantities, percentages, timestamps, identifiers, order-book values, and other financial data.

Maintain stable numeric widths with tabular numerals.

Do not use decorative science-fiction display fonts or tiny compressed labels.

## Layout

NEXI is mobile-first and must work at:

- 320px
- 360px
- 390px
- 430px

Use dynamic viewport height and safe-area-aware spacing. The interface must remain usable inside multichain wallet browsers with reduced visible height and browser chrome.

The public application contains exactly 11 primary routes:

1. Dashboard
2. Spot Trading
3. Option / Binary
4. Wallet
5. Earn / Mining
6. Loan
7. Support
8. Announcement
9. Learn
10. Messages
11. Settings

On mobile, the stable bottom navigation contains Dashboard, Spot, Options, Wallet, and More. More exposes the remaining routes.

## Elevation & Depth

Use layered black-purple surfaces, restrained backdrop blur, subtle internal highlights, and thin violet borders.

Glass is for shell-level hierarchy and selected panels. Dense financial execution surfaces must remain sufficiently opaque and readable.

Avoid glass-on-glass nesting, large blur fields, heavy shadows, floating decorative orbs, and giant neon halos.

## Shapes

Use controlled 8–16px geometry. Compact execution rows may remain square or minimally rounded.

Do not use oversized pill cards or mix unrelated radius systems.

## Components

### Header

Use a compact original NEXI monogram, near-white NEXI wordmark, search, notifications, and account access.

### Active Pair

Present the selected instrument in a compact elevated panel with official asset identity, instrument pair, and selection affordance. Do not fabricate price or movement.

### Quotes Hub

Dashboard is the Quotes Hub.

Its tabs are exactly:

1. Favorites
2. Crypto
3. Metal
4. Forex
5. Shares

All five tabs must remain visible simultaneously at 320px without horizontal scrolling.

Quote columns are:

- Asset
- Price
- 24h Change

Use official asset/company logos where accurate. Use neutral fallbacks rather than invented logos.

### Trading Surfaces

Spot and Option / Binary screens use the same shared Active Pair. Charts, order books, countdowns, forms, and histories must use stable dimensions suitable for later Canvas, WebGL, Worker, or WASM-backed implementation.

### Wallet

Wallet domains are:

- Overview
- Spot Wallet
- Option Wallet
- Funding Wallet
- Financial Wallet

### Data States

Use restrained skeletons or em dashes for unbound data.

Canonical screens show one coherent state at a time. Loading, empty, stale, disconnected, unavailable, and error states are separate states, not displayed simultaneously.

## Motion & Visual Haptics

Use short, restrained feedback:

- selected tab edge glow;
- pressed-state compression;
- contained ripple;
- selected-row edge pulse;
- subtle active-navigation illumination.

Do not use continuous pulsing, excessive glow, or decorative motion.

## Logo and Asset Marks

NEXI uses an original geometric N monogram and a near-white wordmark.

Crypto assets use recognizable official/current marks where available. Equity instruments use current company marks. Forex uses pair codes and restrained flag markers. Metals use chemical-symbol glyphs such as Au, Ag, Pt, Pd, Al, and Cu.

Never invent a fake asset logo.

## Do's and Don'ts

Do:

- combine premium liquid-violet atmosphere with sharp execution surfaces;
- use high information density with readable hierarchy;
- preserve exact product structure;
- use official asset identities;
- maintain stable financial columns;
- design for wallet-browser safe areas;
- keep public, backend, and Admin authority visually separate.

Don't:

- fabricate prices, balances, percentage changes, PNL, payouts, or live status;
- expose provider, WebSocket, heartbeat, cache, freshness, polling, or backend diagnostics;
- add leverage, contracts, futures, margin, liquidation, C2C, or copy trading to the current NEXI public scope;
- show Admin or sandbox controls inside the public application;
- clone Hyperliquid, Binance, dYdX, or another exchange;
- use generic bento dashboards, excessive glass, casino styling, or gaming visuals.

## Product Contract

Dashboard is the Quotes Hub, not a twelfth route.

One shared Active Pair connects Dashboard, Spot Trading, Option / Binary, and related chart surfaces.

Option / Binary supports backend-configured durations:

- 30 seconds
- 60 seconds
- 180 seconds
- 240 seconds
- 480 seconds

Wallet transfers and all financial movements must later map to backend ledger records.

The multichain wallet access gate is a separate pre-application surface. It may be designed later using this same visual authority.

Admin is a separate role-gated application and is not part of the public 11-item navigation.
