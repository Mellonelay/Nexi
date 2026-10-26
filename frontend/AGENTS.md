# CURRENT OWNER BUILD/TOOLCHAIN OVERRIDE — 2026-10-25

The only Public build is `/srv/nexi/public/current/.next`, built from `/srv/nexi/public/current` using its symlink to `/srv/nexi/public/shared/node_modules`. No worktrees, isolated copies, dev/preview builds, `npm install` or `npm ci` in the source checkout. Use pinned `/opt/nexi/runtime/node-v24.21.0/bin/node` and its npm path for next authorized build and runtime service; verify systemd ExecStart before claiming alignment. First map design and contracts across NestJS/Admin consumers; use framework-local Next CLI (`next typegen`, diagnostics) where relevant; tests verify implementation, not determine architecture by trial and error. Reuse unchanged proof. All three services were intentionally stopped by the owner for maintenance on 2026-10-25; do not infer active status from historical receipts.

## External engineering references

For Public work, choose the exact domain bundle in `/home/mellonelay1999/.codex/reference-libraries/NEXI_Engineering_Reference_Library_v3.1/NEXI_Engineering_Reference_Library_v3.1/`, using its `graphify-out/wiki/index.md` and `graphify-out/GRAPH_REPORT.md` for navigation. Check installed versions, official framework contracts, and current source before applying a reference; CONTRACT/ADAPT/STUDY are dispositions, not approval. Graphify is navigation/reference evidence, not semantic or runtime proof.

# CURRENT OWNER BROWSER OVERRIDE — 2026-10-26

For the paired NEXI Codex CLI, use the existing Worker-0 Chrome DevTools MCP session on CDP `127.0.0.1:5858` for site rendering, interaction, network, console and viewport evidence. Do not route this VM task through ChatGPT Work's browser, Polypane/CDP 5859, Playwright MCP, or a duplicate browser session. For a MetaMask approval, inspect `list_pages`; use `select_page` and a fresh `take_snapshot` only if the extension page is exposed in that same DevTools session. Never navigate directly to a `chrome-extension://` URL. If the extension prompt is not exposed, stop at that boundary and report it; do not claim authentication completed. Wallet signing and financial actions remain separately authorized.

## CANONICAL PUBLIC BUILD — 2026-10-23

Follow the root `AGENTS.md` **Canonical Worker-0 Build and Release Contract** for the shared release sequence. Public source is the canonical checkout's `frontend/`; dependency authority is `frontend/package.json` plus `frontend/package-lock.json`. `frontend/node_modules` and `/srv/nexi/public/current/node_modules` must resolve to `/srv/nexi/public/shared/node_modules`. Keep this store separate from Admin and Backend. Normal builds reuse the verified store. If the locked dependency set changed or required packages are absent, verify the store recovery path, stop only `nexi-public.service`, stage the committed Public `package.json` and `package-lock.json` into `/srv/nexi/public/shared`, then run `npm ci --no-audit --no-fund` there with the Public runtime-compatible Node/npm. Never run `npm ci` from `frontend/` or `/srv/nexi/public/current`, and verify both links after store reconstruction.

`/srv/nexi/public/current` is the only Public build/runtime directory and must remain a real directory. Its generated Next output is `/srv/nexi/public/current/.next`; do not create candidate, temporary, copied, or alternate build roots. For the one final production build, verify the exact source SHA, running artifact and tested rollback, stop only `nexi-public.service`, sync committed Public source into `current` without replacing the dependency link, then run from `/srv/nexi/public/current`:

```bash
./node_modules/.bin/next build --webpack && node scripts/prepare-standalone-assets.mjs
```

This explicit command is the canonical Worker-0 build: it uses the required Webpack mode and runs the package's standalone-assets step. Restart only Public after a successful build. Verify the release marker, actual HTTPS pages and API consumers, process stability, and Sentry release/source-map association before moving to another surface. Keep the verified rollback until acceptance; restore it if defined health checks fail.

# NEXI Public Frontend — Agent Contract

## Scope and authority
This file governs only the canonical Public frontend at this directory.
GitHub `main` is durable source authority. ChatGPT is the parent/controller. Worker 0 is the execution/evidence plane.

Current backend authority is:
Public → VPS Nginx → NestJS → promoted SQLite / Ledger / EventOutbox.

Verify the deployed VPS NestJS process and release before production claims. Never add frontend-owned financial, market, settlement, authorization, or ledger authority.
Current owner decisions outrank old screenshots, old chats, old frontend programs, archived docs, and generated concept images.

## Current owner correction — market work
Do not reopen broad market-provider reliability work during frontend completion merely from historical stale-provider counts.
The backend market system is substantially working; a stale provider by itself is not a blocker. Only a fresh production-visible defect reproduced in the current primary authenticated NEXI browser/runtime path is an active frontend acceptance defect; diagnose it through the causal frontend/backend/realtime owner before broad provider architecture is reopened. Historical or unauthenticated BrowserStack evidence is not a substitute for that proof.
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
The checked-in `package.json` and `package-lock.json` are the dependency authority. At the 2026-10-22 verification, the installed tree resolves Next.js `16.4.1`, React/React DOM `19.3.0`, TanStack Query `5.90.19`, and Socket.IO client `4.8.3`; `eslint-config-next` is pinned by the lockfile to the Next.js `16.4.1` line. Other dependency ranges and resolved versions must be read from those files rather than copied from this summary. Do not upgrade dependencies to refresh this note.

Node.js must be `>=20.9.0`; verify the package engine and current runtime before framework-sensitive work.

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

Frontend-local design intelligence is installed at `.agents/skills/ui-ux-pro-max/` (UI/UX Pro Max, Universal / Agent Standard). For bounded UI/UX work, read its `SKILL.md` and use `scripts/search.py` for focused evidence: exact style/UX/chart queries first, then the `nextjs` stack only for distinct implementation guidance. Reuse its local offline datasets; do not rerun broad design-system generation when the current NEXI design direction is already established. Never persist a generated `design-system/*/MASTER.md` unless the owner explicitly requests a new secondary artifact; `DESIGN.md` and current owner visual references remain authority.

Apply the skill as advisory evidence, not as a redesign mandate. Its generic Fintech/Crypto reasoning can conflict with NEXI's accepted Deep Liquid Violet identity; current owner decisions and `DESIGN.md` win. For web NEXI, use the skill's active `glassmorphism` guidance where it improves hierarchy, contrast, and elevation. Its `liquid-glass` entry is explicitly scoped to Apple platform materials (`swiftui|uikit|appkit`), so on Next.js/web borrow only restrained translucency/refraction/motion principles rather than claiming or mechanically reproducing Apple Liquid Glass. Its Next.js dataset is verified for 16.2 while this app is 16.3.5, so official current Next.js docs remain framework authority.

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

Realtime transport is not durable truth. After reconnect, recover authoritative state from Backend reads backed by promoted VPS SQLite.
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

PUBLIC BUILD AUTHORITY: Do not build this app during iterative repair. Finish all source changes and focused source checks first. The only generated Public build/runtime directory is `/srv/nexi/public/current`; do not create `build-*`, `releases/*`, candidate, temporary, rollback, worktree, or copied build-output directories under `/srv/nexi/public`. When the owner-selected source frontier is ready for the final integration pass, stop `nexi-public.service`, synchronize this canonical source into `/srv/nexi/public/current`, run the single production build there, restart the service, and verify deployed behavior.

Before deployment, run only the focused deterministic source/build gates invalidated by the change. Final browser acceptance uses the existing Worker-0 Chrome session through Chrome DevTools MCP at `127.0.0.1:5858`, as specified by the current global owner route and `docs/quality/NEXI_BROWSER_ACCEPTANCE_MATRIX.md`. Do not use Polypane, Playwright MCP, or a separate browser session for this workflow. Do not infer authenticated state unless it is observed in the same Chrome profile and confirmed by the relevant application/API response.

Minimum affected-flow proof:
- typecheck / affected unit-contract tests / production build as required by the change;
- Chrome DevTools rendered/interaction evidence for affected visual/responsive claims;
- same-profile Chrome session evidence when the affected claim requires wallet/application authentication;
- responsive evidence at the required CSS viewport probes in Chrome DevTools;
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
