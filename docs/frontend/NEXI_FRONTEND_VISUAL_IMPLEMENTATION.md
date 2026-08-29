# NEXI Frontend Visual Implementation

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Authority
Implement the synchronized Deep Liquid Violet system: black-violet canvas, layered violet surfaces, selective liquid glass, restrained cyan, Geist UI typography, IBM Plex Mono financial data, official asset identities, and readable opaque execution surfaces.

## Shared implementation targets
Design tokens, app shell, left hamburger/drawer, desktop sidebar, five-item mobile navigation, language selector, headers, tabs, active-pair panel, quote rows, Asset Detail header/stats/About/actions, financial tables, chart/timeframe surfaces, order books, forms, status badges, modals/drawers, toast/error surfaces, skeletons, empty states, and maintenance screens.

## Locked navigation visual rules
The drawer opens from the left at approximately 82–86vw with a 320px maximum width, dimmed backdrop, scroll lock, backdrop tap close, swipe-left close, route-selection close, safe-area support, focus trap, Escape close, correct `aria-expanded`/`aria-controls`, keyboard navigation, visible focus treatment, minimum touch targets, and reduced-motion support. Tablet keeps a left drawer at an appropriate width. Desktop uses a persistent or collapsible left sidebar, never a right-side application menu. The mobile bottom bar contains only Dashboard, Spot, Options, Wallet, and Earn.

## Locked trading-flow visual rules
Keep the approved Deep Liquid Violet Dashboard as the visual anchor. Asset Detail is a professional market-detail surface with a TradingView-style chart feel: clear asset identity, readable price/change, stable timeframe controls, chart-first hierarchy, dense-but-legible stats, and category-appropriate About content. Spot uses Hyperliquid-like chart-first structural clarity plus exchange-style order entry, without copying branding or futures/perpetual clutter. Binary uses the same chart seriousness with clear duration, stake, payout, Long/Short, positions, and history. Wallet uses an exchange asset-center structure with portfolio, actions, asset list, per-asset detail, and history; it is not a Hyperliquid trading screen. Preserve existing typography, palette, row anatomy, Active Pair card, category tabs, and bottom navigation while allowing vertical scroll and safe-area padding.

Stitch work is the next navigation-aware visual sequence: approved Dashboard with menu control, left drawer open state, language-selection state, revised five-item bottom navigation, mobile/desktop variants; then Asset Detail design, Spot visual refinement, Binary visual refinement, and Wallet asset-center refinement. Stitch output supplies visual evidence only; backend market truth, capabilities, prices, payouts, balances, networks, locale profile persistence, and runtime behavior remain outside Stitch authority.

## Responsive targets
320, 360, 390, and 430px mobile widths plus tablet/desktop. Use dynamic viewport units, safe-area insets, touch targets of at least 44px, stable numeric columns, and no horizontal scrolling for the five Quotes Hub tabs at 320px.

## Visual references
Repository-local images belong under `docs/design/reference`. Each must be classified as APPROVED TARGET, STRUCTURAL REFERENCE, HISTORICAL, or REJECTED. Prose and approved images jointly govern implementation; Stitch output is not runtime authority.

## Prohibitions
No generic bento dashboard, flat graphite/amber regression, casino/banking styling, excessive glass nesting, invented logos, fabricated data, continuous pulse/glow, or cloned exchange identity.

## Verification
For each route capture mobile and desktop screenshots, interaction states, data-state variants, accessibility/focus behavior, relevant console/network evidence, and visual-diff approval against the authority. For this flow specifically, verify `/dashboard` row tap, `/dashboard/asset/[symbol]`, Spot handoff, Binary handoff, shared pair continuity, 320/360/390/430px widths, vertical scroll, fixed navigation, and absence of horizontal overflow.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
