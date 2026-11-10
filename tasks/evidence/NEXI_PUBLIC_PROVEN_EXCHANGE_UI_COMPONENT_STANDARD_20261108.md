# NEXI Public — Verified Exchange UI Component Reference Standard
**Research date:** 2026-11-08\
**Scope:** Mobile-first responsive Next.js/React Public UI. Research and recommendations; NOT implemented or browser-verified. Admin remains desktop-first.\
**Classification:** `PRIMARY STANDARD`, `PRODUCTION DESIGN SYSTEM`, `OPEN-SOURCE EXAMPLE`, `DESIGN INSPIRATION`, `NEXI PROPOSAL`.

## Executive judgment
There is no single ISO/W3C or exchange-industry specification for a mobile trading app's cards, padding, charts, or buttons. Reuse (1) WCAG 2.2 and mobile usability guidance for baseline requirements; (2) Coinbase CDS and Material Design for documented patterns; (3) official shadcn/Base UI and TradingView docs for component behavior; (4) dYdX v4-web as a substantial exchange frontend example; (5) CheetahExchangeWeb and quant-order-book as secondary open-source examples; and (6) design galleries as inspiration only. Preserve NEXI's existing brand and React/Next/Tailwind primitives, avoiding wholesale framework adoption.

## Source verification
| Source | What actually verified | Status/weight |
|---|---|---|
| [Coinbase CDS](https://cds.coinbase.com/) and [Table](https://cds.coinbase.com/components/data-display/Table/) | documented React/React Native tokens and components; table docs expressly recommend mobile list views for complex data | PRODUCTION DESIGN SYSTEM — strong |
| [dYdX v4-web](https://github.com/dydxprotocol/v4-web) | actual React frontend and trading UI; [official frontend technical explanation](https://www.dydx.xyz/blog/v4-deep-dive-front-end) | OPEN SOURCE EXCHANGE — strong reference |
| [dYdX v4-chain](https://github.com/dydxprotocol/v4-chain) | chain and indexer, not primary web UI | DO NOT ROUTE UI RESEARCH HERE |
| [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi) | responsive autoSize/ResizeObserver, remove(), financial chart API | PRIMARY COMPONENT CONTRACT |
| [shadcn Drawer](https://ui.shadcn.com/docs/components/drawer), [Toast](https://ui.shadcn.com/docs/components/sonner), [Progress](https://ui.shadcn.com/docs/components/progress) | accessible composable primitives; current docs show Base UI Drawer; older versions may use Vaul | PRIMARY COMPONENT DOCS (version-specific) |
| [Radix Progress](https://www.radix-ui.com/primitives/docs/components/progress) | progressbar accessibility and states | PRIMARY PRIMITIVE DOCS |
| [Material Design navigation](https://m3.material.io/components/navigation-bar/guidelines) | mobile bottom navigation 3–5 primary destinations | PRODUCTION GUIDANCE |
| [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines) | keyboard/focus, 44px mobile targets, responsive interactions, nonblocking overlays | PROFESSIONAL GUIDANCE |
| [W3C WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | 320 CSS px reflow; exceptions for necessary two-dimensional layouts | FORMAL ACCESSIBILITY STANDARD |
| [Uizard crypto template](https://uizard.io/templates/mobile-app-templates/crypto-nft-mobile-app/) | explicit screens: sign-in, profile, home, wallet, convert, portfolio, crypto and NFT | TEMPLATE / INSPIRATION |
| [UX Pilot](https://uxpilot.ai/mobile-design-templates/crypto-exchange-ui) | marketing description of wallet, transfer, history, market trends | TEMPLATE / INSPIRATION |
| [FrontDEX Figma](https://www.figma.com/community/file/1081520624421222872/crypto-trading-ui-kit-frontdex-4-0-0-alpha-3) | community listing/title verifiable, internal components and license not fully inspected | LIMITED VERIFICATION |
| [Binance heuristics case study](https://medium.com/@jonasprzysucha/case-study-redesigning-binanceapp-using-heuristics-analysis-ba824764daa0) | 2024 independent bootcamp case study: clutter, ticker recognition, header and navigation simplification | SECONDARY UX INSPIRATION; not official Binance standard |
| [CheetahExchangeWeb](https://github.com/CheetahExchange/CheetahExchangeWeb) | README documents React 19/Vite/Zustand, chart/order form/order book, mobile layouts; small project, not verified major deployment | SECONDARY SOURCE EXAMPLE |
| [quant-order-book](https://github.com/nssanta/quant-order-book) | JavaScript/Vite, chart/order book/heatmaps and 5-tab responsive UI; separate from full exchange wallet | SECONDARY SPECIALIZED EXAMPLE |

## Fixed NEXI owner decisions
- NEXI Public is mobile-first responsive Next.js/React; desktop Admin has separate conventions.
- Keep NEXI dark/violet/cyan visual identity, Geist type, Tailwind v3 in current source, existing component owners and five bottom destinations Dashboard, Spot/Margin, Options, Wallet, Earn.
- Source of truth: current `frontend/DESIGN.md`, applicable AGENTS.md and live app source. Proposals here must be reconciled before acceptance.
- Preserve financial truth and precision, honest status labels, real backend trading and settlement semantics. UI cannot make an incomplete settlement appear successful.

## Practical NEXI component contract (recommendations, not universal measurements)
| Component | Default geometry/presentation | Required behavior and states | Proof |
|---|---|---|---|
| **Global shell/navigation** | Mobile 12–16 px horizontal padding, 5 labeled bottom destinations, safe-area clearance; one main vertical reading column | Stable across routes; no cover-up of primary CTA; focus and back behavior; keyboard accessible | 320/360/390/430 px, short-height, zoom, long translations |
| **Wallet balances/metric cards** | Dominant Total value full width; Available/Locked below in 2 columns if content fits, else stack; numeric digits tabular | Never ellipsize authoritative balances; preserve unit and precision; distinguish estimated valuation from native balances | 0; 5,000; 51,700; 1,000,000.12345678; 200% text |
| **Asset lists vs tables** | On phone, one row with asset logo+symbol+name and primary balance; supporting fields via second line/details; desktop columns allowed | Separate holdings, custody-supported assets, market symbols; correct category filter and zero states | all 53 market pairs plus USDT catalog without fabricated wallet holdings |
| **Bottom sheet/selector** | Bottom anchor, safe-area padding, content max-height bounded by `dvh`, interior scroll, persistent close/action area | Overlay, focus management, Escape/cancel, body scroll boundaries; don't unconditionally disable all touch interaction | keyboard, mobile tall/short viewport, nested scroll, dismiss |
| **Toast and persistent alert** | Toast in safe-area visible region not covering bottom CTA/dock; limited stack | Success is brief; important financial error retains recoverable detail and accessible notification center; no fixed 4s mandate | delayed response, repeated event, dismiss/action |
| **Status badge** | Compact label+semantic contrast, not color only | PENDING/OPEN/FILLED/PARTIAL/CANCELLED/SETTLING/SETTLED/FAILED reflect real state machine | late update, stale network, repeated events |
| **Skeleton/spinner** | Skeleton shape closely approximates final layout; avoid abrupt height changes | loading vs stale vs error vs unavailable distinguished; progress indeterminate when cannot measure | latency/no data/connection loss |
| **Progress bar** | thin visual line + readable label where meaningful | derive fraction from canonical event data, clamp [0,1], expose progressbar semantics; reduce motion | 0%, 50%, 100%, unknown |
| **Countdown** | fixed-width/tabular digits, minutes:seconds or seconds per context; always visible in active position | Deadline is server-authoritative; display derived from server expiry and synchronized time, refresh on visibility/resume; client timer is display mechanism only; after zero show settling until canonical result | background tab, reload, clock drift, delayed settlement |
| **Chart** | phone chart prominent with bounded height, own resize container and accessible pair/timeframe; avoid fixed desktop-only dimensions | TradingView `autoSize` or documented resize; teardown old instance; indicators/timeframes and prices read correctly; controls don't overlap graph | 320px, rotate, tab switch, 1m/1h/1d, empty live data |
| **Order book** | phone condensed price and size rows, aggregate/depth on secondary line or tab, bounded internal scrolling | consistent tick/precision, `tabular-nums`, spread and bids/asks meaningful; do not crop critical columns; optional depth bars background behind foreground text | rapid updates, large numbers, zero book |
| **Order ticket** | stacked controls on narrow phone, explicit asset/unit labels, large primary Buy/Sell buttons; fixed button action area above dock | distinct Spot/Limit/Market/Options modes, input validation, review, pending, accepted, rejected, fill, cancel; avoid misleading success from optimistic UI | small stake, large stake, invalid balance, server failure |
| **Result/history** | compact status card with trade type, pair, stake, entry, expiry, result, credited amount | differentiate rejected submission, cancelled order, expired position, settlement pending, actual loss and infrastructure failure; link to history | order accepted vs settled, delayed settlement, reconnect |

### Numerical targets — NEXI proposal
- Mobile screen horizontal insets `12–16px`; major panel padding `12–16px`; section gaps `12–16px`; tight inline gaps `4–8px`; keep consistent spacing tokens (4/8/12/16/24/32).
- Body text `14–16px` if readability permits; primary input text at least `16px`; labels `12–13px` when practical; financial headline `22–28px` depending on width; avoid 9px critical information.
- Primary tap targets approximately `44x44 CSS px` or more (Vercel guideline). Compact icon can be 18–22px within larger target.
- Trade form inputs may be about 44–48px tall, not a mandatory universal 48px.
- 320px CSS reflow without loss of content for ordinary UI. Interactive charts and genuinely two-dimensional grids may be bounded scroll regions under WCAG exception, but important action labels and financial values must remain legible.
- Do not require `z-index:9999`, `toast=4000ms`, `touch-action:none` on every sheet, a fixed aspect ratio for every chart, or `setInterval` as a financial clock. These are not industry standards.

## Existing source-level issues, observed in the earlier read-only NEXI audit
These refer to the checkout previously read during this conversation; refresh source before editing and do not claim a latest runtime check.
1. `frontend/app/components/PagePrimitives.tsx` shared `Metric` uses `truncate` directly on numeric values.
2. `frontend/app/dashboard/wallet/page.tsx` renders WalletSummary using mobile `grid-cols-3`; large USDT values are visibly ellipsized on narrow devices.
3. `WalletAssetRow` uses a four-column tight mobile grid and truncates monetary cells, contrary to mobile list recommendations.
4. Wallet assets currently tie `accountExists` and view eligibility together, producing “Account not opened” entries that conflate wallet account scope with tradable market visibility.
5. `frontend/DESIGN.md` already defines mobile-first shell, 320px through 430px checks, 5-item dock, Geist, spacing/height targets and no critical financial clipping. Implementation must be checked against this existing authority rather than replacing it.
6. A displayed Options settlement failure is an application lifecycle issue separate from countdown visual geometry; never cover financial faults by swapping the displayed badge.

## Source-to-NEXI adoption strategy
**Adopt:** CDS mobile list principle; dYdX order lifecycle/UI state concepts; TradingView chart public API; accessible Drawer/Toast/Progress primitive contracts; WCAG reflow, Vercel target/focus/zoom guidelines; Material 3 five-item labeled navigation.
**Adapt:** NEXI-specific spacing, fonts, dark colors, token system, asset taxonomy, settlement semantics, product-appropriate data density and mobile forms.
**Do not adopt blindly:** sample code from Figma galleries, vendor branding, screenshots, proprietary exchange pixels, old package-specific APIs, backend models from unrelated protocols, unverified industry claims and unlicensed components.

## Minimal acceptance matrix for UI component standards
For each component and each screen: 320 / 360 / 390 / 430 CSS px and short-height, real account monetary values, very large number, long asset name, selected/disabled/loading/stale/error/success, 200% text zoom, virtual keyboard (forms), interrupted network/reconnect, and bottom-dock clearance. Test a shared primitive thoroughly once and test affected consumers with scoped spot checks. Source proof and browser proof must remain distinct; Cloud Browser screenshots are not mobile-emulation proof.

## Recommended delivery sequence
1. Finish the already-active functional browser acceptance evidence collection; keep source changes separate.
2. Adopt this reference matrix as *proposed* UI standards. Reconcile against `frontend/DESIGN.md` and owner-approved visual references before implementation.
3. Fix shared layout primitives (Metric, mobile financial asset row, safe-area sheets, common number formatting) before route-by-route cosmetics.
4. Fix specialized chart/order/Options lifecycle presentation only against actual states and documented contracts.
5. Run scoped 320/360/390/430 rendered acceptance and functional regression. One consolidated coordinated release after owner approval, not iteration per screenshot.

## Research limits
The Uizard/UXPilot pages are marketing templates, not evidence of usage in major production exchanges. Figma community internal component definitions/license were not accessible in retrieved content. CheetahExchange is small by GitHub metadata and its README's 'responsive' claim is not a verified field benchmark. Quant Order Book is an analytics-oriented visualization, not a full exchange frontend. dYdX v4-chain is not its web frontend. Parallel web search/research returned insufficient account credit; Exa/Context7 and official primary pages were used instead. No files in NEXI repo, services, deployments or browser sessions were modified in this research.
