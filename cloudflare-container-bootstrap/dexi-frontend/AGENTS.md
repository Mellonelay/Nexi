# NEXI Public Frontend — Agent Contract

## Scope and authority
This file governs only the canonical Public frontend at this directory.
GitHub `main` is durable source authority. ChatGPT is the parent/controller. Worker 0 is the execution/evidence plane.

Current backend authority is:
`Public -> Cloudflare Worker -> Cloudflare Container -> NestJS -> D1 / Ledger / EventOutbox`.

Never use a VM-local NestJS process as production truth. Never add frontend-owned financial, market, settlement, authorization, or ledger authority.
Current owner decisions outrank old screenshots, old chats, old frontend programs, archived docs, and generated concept images.

## Current owner correction — market work
Do not reopen broad market-provider reliability work during frontend completion merely from historical stale-provider counts.
The backend market system is substantially working; a stale provider by itself is not a blocker. A fresh production-visible defect such as the current BrowserStack Galaxy S24 Spot `MARKET ERROR` is an active acceptance defect and must be diagnosed through the causal frontend/backend/realtime owner before broad provider architecture is reopened.
Frontend-visible market status is only:
- `Live`
- `Error`
- `Closed`

Internal transport/recovery states may remain richer, but do not expose stale/disconnected/provider diagnostics as new product statuses.
## Product mode
NEXI Public is an **Operate-mode financial workspace**, not a marketing site and not a redesign sandbox.

Preserve the accepted recent mobile visual family:
- Quotes Hub
- Spot/Margin
- Options/Binary
- Wallet chooser sheet
- Wallet

Those five accepted screenshots are visual-reference evidence, then current source/runtime semantics apply.
Explicitly rejected as visual authority:
- `nexi_deep_liquid_violet_trading_concept.png`
- `nexi_synthesized_spot_direction.png`
- old September V2/V3 concepts when they conflict with later owner decisions

Do not redesign completed screens from taste alone.
Use screenshots to check hierarchy, density, spacing, composition, and interaction intent; use current source/runtime for functional truth.

## Stack
Current package authority:
- Next.js `16.3.5`
- React / React DOM `19.3.0`
- TypeScript 5
- ESLint 9 + `eslint-config-next` 16.3.5
- Tailwind CSS 3.3
- Lightweight Charts 4
- TanStack Query 5
- Socket.IO client 4.7
- RainbowKit / wagmi / viem for wallet integration
- Node.js `>=20.9.0`

Do not describe this frontend as Next.js 12 or 14. Read `package.json` before framework-sensitive work.
## Next.js App Router rules
This app uses the App Router. Prefer framework conventions over custom plumbing.

Default to Server Components. Add `'use client'` only where interactivity, browser APIs, wallet state, realtime subscriptions, or client-only libraries require it.
Do not move an entire route tree to the client merely because one child is interactive.

Use:
- `layout.tsx` for persistent shell
- `page.tsx` for route UI
- `loading.tsx` for meaningful route-segment loading states
- `error.tsx` for recoverable segment errors
- `not-found.tsx` for missing route/resource UI
- `global-error.tsx` only for root-level catastrophic failure
- Route Handlers only as thin frontend/BFF adapters, never domain authority

Current repo scan found no route-level `loading.tsx`, `error.tsx`, or `not-found.tsx`; add them only where they improve a real user path, not mechanically everywhere.

Use the Metadata API from layouts/pages rather than manual title/meta composition for new work.
Keep the root viewport contract explicit and mobile-safe.
## Next.js optimization rules
Use `next/link` for app navigation and `next/navigation` for App Router navigation state.
Use `next/image` for real image assets when its optimization model fits; do not replace chart/canvas/SVG/icon rendering just to use it.
Prefer `next/font` for new or revised font-loading work, but do not churn the existing Geist setup without a measured reason.

Use `next/dynamic` for heavy client-only modules when it materially lowers initial client cost. The trading chart is an established example.
Do not blanket-apply dynamic imports to small controls.

Do not blanket `no-store` every fetch. Realtime market and identity-sensitive reads may require it; stable public content should use the narrowest correct cache policy.
Do not introduce ISR or caching for financial/user truth unless the backend contract explicitly permits it.

Before framework-sensitive changes, verify behavior against the current official Next.js documentation for the installed 16.x line:
- https://nextjs.org/docs/app
- https://nextjs.org/docs/app/api-reference/cli/next
- https://nextjs.org/docs/app/getting-started/project-structure
- https://nextjs.org/docs/app/getting-started/server-and-client-components

Use the project's installed Next CLI through package scripts or `npx --no-install next ...`.
Use `next typegen` before TypeScript verification when route types can change.
Use the current scripts as authority: `npm run typegen`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:ui`.
Do not revive removed `next lint` assumptions; lint is now the repository's ESLint 9 script.
## Visual system
Treat `DESIGN.md` in this directory as the current visual contract.
Read it before any visual, layout, responsive, chart-composition, wallet-sheet, navigation, or motion change.
Do not generate a replacement design system or a second frontend design authority.

Core identity:
- near-black OLED canvas
- Deep Liquid Violet interaction language
- thin luminous violet borders/edge light
- dense financial hierarchy
- cyan/green positive/live accents
- magenta/red negative/error accents
- restrained glass only where it clarifies shell/elevation
- execution surfaces stay crisp and readable

Do not introduce generic SaaS cards, excessive glass nesting, giant marketing headings, decorative gradients, or cinematic motion into trading/product surfaces.

Spot/Margin visual hierarchy:
`pair header -> Spot/Margin switch -> dominant K-line workspace -> execution/depth -> activity -> persistent five-tab dock`.

The chart is the main visual mass. Do not reintroduce oversized summary cards above it.
Keep the seven intervals: `1m 5m 15m 30m 1h 4h 1d`.
Keep indicator affordances aligned to the implemented chart contract.
## Component and folder organization
Prefer deep modules with clear ownership rather than larger route files accumulating unrelated responsibilities.

Current high-risk frontend hubs identified by static analysis include:
- `app/dashboard/binary/page.tsx`
- `app/dashboard/wallet/page.tsx`
- `app/components/WalletConnectControl.tsx`
- `app/state/active-instrument.ts`
- `app/lib/market-data.ts`
- `app/lib/market-stream.ts`

Do not refactor these just to satisfy a metric. When a touched change increases complexity, extract cohesive subcomponents/hooks/adapters behind a small interface.

Shared product primitives belong in a neutral shared location when they serve multiple domains. Avoid putting broadly reused primitives under a Wallet-owned path unless they are truly Wallet-specific.
Keep API adapters in `app/lib` or route handlers thin and typed.
Keep route pages focused on composition/orchestration, not large transport or normalization logic.

Fallow currently has no configured architecture-boundary zones. Until boundaries are added, enforce this contract manually and verify with Graphify/Fallow after structural edits.
## Runtime and data behavior
Frontend must render backend truth. Never fabricate:
- prices
- balances
- PnL
- payouts
- order status
- settlement
- wallet state
- authorization
- provider health

Realtime transport is not durable truth. After reconnect, recover authoritative state from backend/D1-backed reads.
Reject duplicate/out-of-order market events where the current contract already does so.

Wallet/SIWE and protected financial actions remain identity-gated.
Do not weaken wallet gates or auth checks to make browser tests easier.

## Accessibility and interaction
All interactive controls must be keyboard reachable and operable.
Prefer semantic `button`, `a`, `input`, `select`, and dialog primitives over click-handled divs.
Preserve visible focus and correct name/role/value semantics.
Mobile touch targets should be at least 44px where practical.
Sheets, dialogs, menus, and drawers must manage focus and dismiss behavior correctly.
Respect reduced-motion preferences; motion communicates state and hierarchy, never blocks task completion.
Charts/order books need text labels/status summaries sufficient to understand current state without relying only on color.
## Validation
For UI behavior changes, validate the rendered deployed app, not just compilation.

Before deployment, run only the focused deterministic source/build gates invalidated by the change. Final browser acceptance follows the global Browser Fabric:
- BrowserStack = real-browser / real-device runtime acceptance owner;
- Polypane = responsive / multi-viewport acceptance owner;
- Playwright / Chrome DevTools = supporting automation and diagnosis, not a separate mandatory acceptance stage.

Minimum affected-flow proof:
- typecheck / affected unit-contract tests / production build as required by the change;
- deployed `https://app.nexitrading.app` using the real `https://api.nexitrading.app` Cloudflare backend;
- BrowserStack evidence for relevant browser/device behavior;
- Polypane evidence for 320 / 360 / ~390 / 412-430 / tablet / desktop and short-height states where applicable;
- no horizontal overflow;
- keyboard/focus/accessibility behavior where affected;
- current locale behavior where affected;
- never a VM-local Nest substitute or disconnected mock for an end-to-end production claim

For reference-driven UI work keep a short mismatch ledger:
`accepted reference -> current render -> intentional deviation or actual defect`.

After coherent structural changes:
- refresh Graphify incrementally
- use affected/path/explain only for touched seams
- run Fallow on changed frontend paths
Do not run broad graph or static-analysis loops when the owner/path is already known.

## Git and parallel work
Re-read files before edits. Preserve owner deletions/reorganizations and other active-session work.
Do not restore archived/deleted frontend artifacts unless explicitly asked.
Do not run broad formatting across unrelated files.
Do not deploy or mutate production without explicit current owner authorization.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
