# NEXI Public Mobile-first UI and Frontend ↔ Backend Integration Reference

**Research date:** 2026-11-08\
**Purpose:** Engineering reference for the upcoming consolidated UI/source repair phase. This document consolidates two supplied research files: `NEXI_PUBLIC_MOBILE_FIRST_UI_RESEARCH_20261108.md` (105 lines) and `NEXI_PUBLIC_PROVEN_EXCHANGE_UI_COMPONENT_STANDARD_20261108.md` (84 lines). The full files remain the primary detail.\
**Authority:** Current owner decisions and `frontend/DESIGN.md` → current source/contracts/tests/runtime → official framework/accessibility references → external examples. This is not implementation or browser evidence.

## Current product boundary

- Public: mobile-first responsive Next.js 16 / React 19 / Tailwind CSS 3, Geist, NEXI dark/violet/cyan design tokens, safe-area-aware shell and five destinations: Dashboard, Spot/Margin, Options, Wallet, Earn.
- Admin: separate desktop-first React/TanStack/Vite/Nitro conventions. Do not impose Public phone layouts on Admin.
- Backend/NestJS owns authorization, product/catalog policy, actual balances, order/settlement state and durable writes. Public/Admin consume canonical contracts; visual controls do not establish business truth.
- Keep observed source findings, owner requirements, design proposals, and runtime acceptance results distinct. Re-check current source before modifying because the research cited GitHub main SHA `2fbc1538ea456d13d7c05b7efd38d2f0050a83ba`, not a verified current deployment.

## Confirmed read-only source findings from cited checkout

These are source findings at the cited revision, not current runtime claims:

1. Shared `frontend/app/components/PagePrimitives.tsx` Metric truncates its financial value (`truncate`).
2. Wallet Summary in `frontend/app/dashboard/wallet/page.tsx` forces three columns at narrow widths; user screenshots show values like `5,000.00...`. The source layout and screenshot agree with the clipping hypothesis; exact rendered CSS was not measured.
3. Wallet asset rows/header squeeze asset plus Available/Locked/Total into four columns and truncate values.
4. “Account not opened” reflects missing scope balances and conflates ledger scope/account existence with a market catalog asset, deposit-enabled asset, or zero holding.
5. A native All/Crypto/Stocks/Metals/Forex filter exists; six scope tabs already use a bounded horizontal rail. These controls should be evaluated for behavior and legibility, not described as absent.
6. Existing positive elements to preserve: DESIGN.md identity/tokens, Geist, Tailwind mappings, five-destination dock, stacked mobile shell, safe-area rules, quick-action touch height and current category control.

Owner-required Wallet semantics: market/catalog visibility, supported deposit networks, real custody holdings, and scope ledger existence are distinct facts. Show zero/unavailable/unsupported/unpriced distinctly. Never invent balances or supported deposit networks. Overview should make supported markets discoverable; Funding and Spot use their respective backend-owned catalogs; Margin/Options/Finance remain USDT-focused under the current model.

## Component contracts: adopt, adapt, and prove

| Area | NEXI contract | Acceptance evidence |
|---|---|---|
| Money/metrics | Never ellipsize authoritative monetary values. Preserve precision and unit. Separate value, currency and valuation caveat. Prefer full-width Total with adaptive Available/Locked layout; no accounting/rounding change in a visual fix. `tabular-nums` stabilizes digit spacing but does not solve clipping. | Check 0, 5,000, 51,700, 1,000,000.12345678 and long localized values at narrow widths and text zoom. |
| Asset list | Phone uses compact, vertically scrollable list/cards; desktop may use columns. Search/filter uses backend market categories. Keep ticker/name/icon, balance and locked/committed detail readable. Distinguish market instruments from custody assets. | Browse all supported catalog entries; independently verify actual holdings, zero balances and deposit availability from API/backend contract. |
| Navigation/shell | Keep the five labeled bottom destinations, selected state, safe-area clearance and spacing. A bounded tabs/ticker rail may scroll; the document should not develop accidental horizontal overflow. | 320/360/390/412/430 CSS px, short-height, keyboard, rotation, 200% text resizing. |
| Chart/order book | Responsive chart container with resize lifecycle; phone chart and ticket stack. Use current lightweight-charts v4 API as source currently records ^4.1; do not paste v5 constructors blindly. Keep critical prices/depth legible. | Resize/rotate/tab change, no-data/live/stale states, actual timeframes and source-backed feed status. |
| Order ticket/status | Validate and review actual order values. Render truthful pending/accepted/rejected/partial/filled/cancelled states. Do not turn an infrastructure/settlement failure into a user loss or success. | Check UI against API/order/ledger/history readback; avoid duplicate submissions and reconcile uncertain responses before retry. |
| Options countdown/settlement | Countdown derives from authoritative expiry and synchronized server time. At zero show SETTLING while result is unknown; show SETTLED only on canonical outcome. A timer is presentation, not settlement authority. | Delayed settlement, background/resume, clock drift, reconnect and final Admin/Public/ledger readback. |
| Sheets/forms/toasts | Responsive bottom sheet/drawer with safe area and internal scroll; preserve labels, errors, draft, focus and action clearance. Important financial errors persist with recoverable details. | Keyboard/focus, safe area, short viewport, loading/timeout/retry, dock overlap. |
| Realtime | Mutation success invalidates/refetches account-scoped queries; stale socket state does not override a newer durable read. Reconnect replays/resnapshots with IDs/cursor and reconciles unread/positions/order state. | Disconnect/reconnect, duplicate/out-of-order event, REST resnapshot and current account cache isolation. |
| Admin | Keep the established desktop-first workspace density and permission-filtered navigation. Backend role enforcement remains decisive. | Desktop widths and authorized roles; Public mobile screenshots do not count as Admin acceptance. |

## Responsive/a11y targets and evidence class

- WCAG 2.2 AA reflow is normative: ordinary content reflows at 320 CSS px and text can be resized to 200%; WCAG target-size criterion minimum is 24×24 CSS px subject to stated exceptions. NEXI’s ~44×44 CSS px primary target is a design choice informed by Vercel guidance, not the WCAG minimum.
- Suggested NEXI design targets, not universal law: 12–16px phone gutters; body 14–16px; primary monetary amount 22–28px where it fits; avoid 9–10px critical information; preserve Geist and existing spacing/radius tokens. Confirm against `frontend/DESIGN.md` and actual rendered content.
- Preserve the 5-destination dock, dark/violet/cyan identity, current shell and component owners; do not migrate the stack or clone Coinbase styling.
- Use lists instead of desktop financial tables on phone when the columns cannot fit. `min-w-0`, `minmax(0,1fr)` and wrapping solve intrinsic sizing only when semantic content remains visible; do not mask defects with broad `overflow-hidden`.
- No mobile emulation or device-level screenshot was performed in the attached source audit. Owner-supplied screenshots/screenscreenrecordings are visual observations, not a full viewport test matrix.

## Frontend ↔ backend investigation workflow

For each visible feature, establish a chain from real source and contracts:

```text
rendered Public route/component
→ state/query hook or API client
→ HTTP method + route + origin
→ Nest guard/DTO/controller
→ domain service/policy
→ Prisma/SQLite or ledger authority
→ durable event/outbox/job when applicable
→ REST/read model + Socket.IO/reconnect
→ Public/Admin query cache and rendered status
```

Use the local Graphify advanced runbook to locate path/impact candidates, then directly read source/DTO/OpenAPI and current relevant tests. Graphify EXTRACTED/INFERRED/AMBIGUOUS labels stay visible. For financial features, prove durable accounting and readback; do not infer results from page text or graph topology. For configuration, prove Admin persistence then the Public fetch/refresh/render path. For reconnect, compare durable REST state with event-derived state. Classify a missing graph edge as graph coverage uncertainty unless direct source proves a disconnect.

## Existing repository design and framework references

- NEXI design authority: [`frontend/DESIGN.md`](https://github.com/Mellonelay/Nexi/blob/main/frontend/DESIGN.md) and applicable `frontend/AGENTS.md`.
- [Next.js App Router data security](https://nextjs.org/docs/app/guides/data-security), [authentication](https://nextjs.org/docs/app/guides/authentication), [fonts](https://nextjs.org/docs/app/getting-started/fonts).
- [React state preservation/reset](https://react.dev/learn/preserving-and-resetting-state).
- [TanStack Query v5 invalidation](https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation) and [mutation invalidation](https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations).
- [Tailwind responsive design](https://tailwindcss.com/docs/responsive-design) and [numeric font variants](https://tailwindcss.com/docs/font-variant-numeric).
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html); [MDN CSS min-width](https://developer.mozilla.org/en-US/docs/Web/CSS/min-width).
- [Coinbase CDS table guidance](https://cds.coinbase.com/components/data-display/Table) for mobile list patterns; reference only, not NEXI brand authority.
- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines) for focus, responsive and target guidance.
- [Material Design navigation bar](https://m3.material.io/components/navigation-bar/guidelines) for five-destination bottom-navigation principles.
- [TradingView Lightweight Charts API](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi); verify APIs against the installed NEXI v4 dependency.
- [Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees) and [connection-state recovery](https://socket.io/docs/v4/connection-state-recovery).
- Context7 resolved the official `/vercel/next.js` library and returned the App Router data-security guide: server-only DAL, authorization checks, and safe minimal DTOs. Vercel official documentation search also returned Next data/caching and route-handler material. Specific cache directives require verifying the installed Next version and user/account-specific data semantics; never cache private financial data under a shared key.

## Repair/acceptance sequence

1. Preserve the existing 113-criterion matrix and prior browser/test evidence. Finish/close Phase A as explicitly directed before source repair; do not relabel untested criteria.
2. Start with shared Metric and Wallet Summary geometry, then mobile WalletAssetList and catalog/holdings/deposit semantics. Establish the correct backend contract before the UI renders asset counts or statuses.
3. Repair source-to-API wiring and durable status/readback for proven feature gaps (Options lifecycle, Spot/Margin accounting, Mining, Loans, Convert, withdrawal review, notifications/reconnect, Support). Keep confirmed UI faults separate from suspected backend cause.
4. Group by causal shared owner, not by screenshot. One reviewed repair batch; source/contract proof, focused tests, build/release proof and browser acceptance remain distinct.
5. Verify Public mobile at 320/360/390/412/430 CSS px, short height, safe-area and 200% text resize, using an actual emulated/device viewport for visual claims. Verify Admin under desktop widths. Compare persisted/API state with both surfaces.

## Source status

This reference was prepared from the two supplied 2026-11-08 research documents, official documentation links, a read-only source audit at the revision cited in the supplied research, and owner-supplied screenshots. It does **not** establish that any proposed UI change was implemented, that all 113 acceptance cases are complete, that a current runtime was checked, or that a deployment was verified. Research docs remain attached as complete inputs; this index consolidates the decisions needed for source repair.
