# NEXI Admin — TanStack Architecture and Operator Route Map

Status: source-grounded documentation, 2026-10-21. Source baseline: `6da08471ef200b6cadf96ef3d49ed85fc0f12fc4`. Proposed eight-workspace IA is **not implemented by this document**. Runtime/browser parity and new Binary simulation contracts are **not verified**.

## 1. Authority and architecture

Current owner decisions > scoped direct proof > GitHub main > deployed artifacts > graph/static findings > history. Preserve established NEXI architecture: Name.com DNS -> VPS Nginx -> separate Admin TanStack Start/React and Public Next.js surfaces -> NestJS API/Socket.IO. Promoted VPS SQLite (Prisma 7 / better-sqlite3) owns durable application state; LedgerAccount/LedgerPosting accounting, EventOutbox/EventInbox durable publication/deduplication, SQLite job/workflow journals durable async state; BullMQ/Aiven Valkey job transport, Valkey Streams/Socket.IO realtime and cache. Cloudflare application Worker/Container/D1/Queues/Workflows are retired. Do not infer current D1 use from a legacy class name.

Admin source is `Admin/`; Public source `frontend/`; backend `backend/`. This is a docs-only route/architecture mapping, **not** authority to change production financial state, deploy, restart, rewrite API contracts, or implement outcome manipulation.

## 2. Actual TanStack stack and ownership

- `package.json`: `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/router-plugin`, `@tanstack/react-query`, React 19, Vite and Sentry TanStack integration. Versions are lockfile/source scoped; do not upgrade by following latest docs without a separate compatibility decision.
- `vite.config.ts` calls `@lovable.dev/vite-tanstack-config`, which already wires the TanStack Start/router/React plugins and Nitro node-server preset. **Do not add another `tanstackRouter()` or `tanstackStart()` plugin** based on a generic Vite Router example.
- `src/router.tsx` creates a new QueryClient per router instance, imports `src/routeTree.gen.ts`, enables scroll restoration and zero default preload stale time. The generated tree is tooling-owned: never hand-edit.
- `src/routes/__root.tsx` establishes QueryClientProvider -> AdminSessionProvider -> AdminDataProviderScope -> AdminAuthGate -> AdminShell -> Outlet. This is the page-shell/auth/data boundary, not backend authorization.
- `src/admin/config/navigation.ts` declares sidebar groups, labels, permissions and sandbox visibility. `src/admin/components/shell/AdminShell.tsx` renders navigation. Nav grouping is not identical to filesystem routes; preserve explicit deep links and permission checks.
- `src/admin/data/provider.ts` is the AdminDataProvider contract. `src/admin/data/context.tsx` currently constructs `NexiAdminApiProvider` as the configured provider, with client sessionStorage token access. `src/admin/data/nexi-api-provider.ts` maps backend calls; `useAdminQuery` currently provides subscription-driven async reads. **Do not assert these routes already use TanStack Query for every fetch merely because QueryClientProvider is present.** LocalMockAdminProvider remains only for explicit local/demo contexts, not silent live fallback.
- `src/routes/*.tsx` use `createFileRoute` and per-route guards. The source root and index files are framework routing infrastructure rather than sidebar destinations.

TanStack Start is a full-stack React framework, not merely a SPA router. Its loaders may execute in server and client contexts; keep credentials/secrets in deliberate server-only primitives and retain NestJS as NEXI's business/API authority. Do not create parallel Start database/financial endpoints simply because server functions are available.

## 3. Source route inventory: 33 sidebar destinations + 1 non-sidebar named route

This inventory comes from `RoutePath` in `src/admin/config/navigation.ts`, reconciled to `src/routes/*.tsx`. There are **33** registered sidebar operator destinations and **34** named route files besides `index.tsx` and `__root.tsx`. The earlier browser-visible **33** excluded `/reconciliation`, which has a route file but is currently absent from NAV_GROUPS/RoutePath. `src/routes/index.tsx` is the index path and `__root.tsx` is the root, not additional sidebar destinations.

| Proposed operator workspace | Canonical existing destination paths | Notes |
| --- | --- | --- |
| Overview | `/overview` | Operations overview; health cross-link |
| Clients | `/users`, `/kyc`, `/sessions` | Directory and selected-client context |
| Trading | `/spot`, `/binary`, `/settlements`, `/exposure`, `/sandbox` | Binary open positions vs pair settings; governed corrections; simulation research context |
| Wallet & Finance | `/wallets`, `/networks`, `/ledger`, `/deposits`, `/withdrawals` | Network configuration and wallet list have different backend ownership; `/reconciliation` exists but is not a NAV_GROUPS destination |
| Markets | `/assets`, `/market-feeds` | 53 asset identities, feed mappings and freshness |
| Products | `/mining`, `/loans` | Rates and lifecycle where backend contract supports them; referrals/VIP not verified |
| Communications | `/support`, `/messages`, `/announcements`, `/learn`, `/notifications` | Distinguish two-way private conversations, tickets, outbound notifications and content publication |
| Administration & Settings | `/admins`, `/roles`, `/approvals`, `/audit`, `/frontend-control`, `/navigation`, `/localization`, `/feature-flags`, `/health`, `/maintenance` | Public configuration, governance, system operations |

Total mapped sidebar destinations: 1 + 3 + 5 + 5 + 2 + 2 + 5 + 10 = **33**. `/reconciliation` is the **34th named filesystem route**, not a sidebar entry. The intended navigation is eight primary workspaces with tabs and contextual cross-links, not loss of any existing function. Keep all current URLs stable until an approved migration maps redirects/deep links.

## 4. Future TanStack routing contract (requirements, not existing implementation)

1. Derive the authoritative path inventory from generated `routeTree.gen.ts`, `src/routes` and `navigation.ts`; detect inaccessible/hidden routes separately from nav count. Preserve file-based `createFileRoute` and type-safe `Link`/`navigate`.
2. Keep shareable directory filters, sort/page/status, selected pair and other nonsensitive navigable state in **validated URL search params** (`validateSearch`, preferably schema validation). Use `loaderDeps` when loader data depends on search. Never put tokens, secrets or private chat bodies in a URL.
3. For route data acquisition, review existing `useAdminQuery` and API-provider ownership before adopting route loaders or Query `ensureQueryData`. Introduce one canonical fetch/invalidation owner per resource, not a second unsynchronized cache. Mutations must invalidate/refetch affected views and be reconciled to authoritative NestJS responses.
4. Loaders are isomorphic; do not assume an ordinary `loader` is server-only. If Start server functions are needed for nonfinancial presentation concerns, keep typed server-only boundaries; NestJS remains application state owner.
5. Use route-level pending/error/not-found boundaries and deliberate auth/session-expiry handling; router guards are UX, not substitutes for NestJS RBAC. Avoid protected user data crossing SSR caches/accounts.
6. Use route-aware intent preloading and automatic code splitting only where actually supported by pinned Start/plugin versions; avoid additional plugins or hand-edited generated routing. Verify direct URL, browser back/forward, refresh, narrow viewport and failed API read.
7. Keep desktop a compact eight-workspace sidebar with sub-tabs, searches, contextual detail drawer; narrow widths use accessible drawer/full-screen detail. Preserve action confirmations, roles, environment, actor, reason and audit.

## 5. Functional owners and proposed interfaces

- Clients -> selected account -> Binary research policy: candidate `Normal`, `Simulated WIN`, `Simulated LOSS` default for future eligible **simulation** positions. The effective precedence and schema are **proposed**, not currently verified.
- Trading -> Binary -> Ongoing Positions: current `/binary` provides pair and position views; proposed test-position detail would show effective research mode and permit an authorized pre-settlement test override where backend authority exists. Do not substitute the `/sandbox` scenario-form API for an unverified per-position API.
- One NestJS policy/settlement authority must govern both controls if later approved. SQLite position/policy and audit durability; Ledger/Outbox as applicable; no independent Admin settlement calculation. Simulated chart/replay and result remain clearly separated from canonical market feeds, genuine accounts and Spot/Margin.
- Trading -> Binary Product Settings: retain pair eligibility, configured five durations (historically 30/60/180/280/420 seconds), payout and min/max stake. Historical 85% and 1–1000 are **not** current persisted-state proof. New allowed durations require compatible backend contract.
- Markets: preserve 53 assets (17 crypto/20 equities/9 forex/7 metals), market source mapping and feed freshness. Asset identity differs from product/pair eligibility.
- Wallet & Finance: keep canonical deposit destinations/network configuration distinct from wallet balances, deposit/withdrawal lifecycle and Ledger. No direct balance writes.
- Products: preserve Mining plan availability/limits/rates and Loans lifecycle; verify Admin-to-Public field parity before claiming completion.
- Communications: planned real two-way Admin/Public private Messages inbox, unread/thread/reply and supported attachment/history; separate from Support tickets, notifications, announcements and Learn. No fabricated realtime route.
- Public Website Settings: group navigation, feature flags, localization and frontend controls without implying every visual or financial behavior is mutable in Admin.

## 6. Existing-vs-proposed and acceptance

**Source-observed**: 33 sidebar destination paths plus one hidden /reconciliation named route; `/reconciliation` route outside menu; TanStack Start/Router stack, generated tree, root providers; `/binary` pair/position tabs; existing provider boundary.

**Proposed, requiring owner approval and backend contract proof**: eight-workspace regrouping, new client Binary defaults, per-open-position overrides, simulated market projection/chart replay, additional messaging UX, possible route-level loader/cache refactoring and referral/VIP navigation.

**Unknown**: exact deployed source identity, current persisted Binary settings, complete simulation API/schema, realtime event contracts, 34-route operator visibility by role, page-level browser acceptance. Historical DEXI/Axue behavior is a reference, not present-NEXI runtime proof.

Completion for future implementation: preserve all 33 existing sidebar destinations and the additional /reconciliation deep link; type-safe file routing, generated tree, URL navigation and refresh; provider-backed data and permission enforcement; source tests/build, scoped API readback and separate browser proof. SOURCE_IMPLEMENTED, TESTED, INTEGRATED, DEPLOYED, BROWSER_VERIFIED, OWNER_ACCEPTED are different statuses.

## 7. Documentation references

- TanStack Start overview: https://tanstack.com/start/latest/docs/framework/react/overview
- TanStack Start code execution: https://tanstack.com/start/latest/docs/framework/react/guide/code-execution-patterns
- TanStack Start production checklist: https://tanstack.com/start/latest/docs/framework/react/guide/production-checklist
- TanStack Router Vite install (generic; wrapper exception above): https://tanstack.com/router/latest/docs/installation/with-vite
- Router search params: https://tanstack.com/router/latest/docs/framework/react/guide/search-params
- Router data loading: https://tanstack.com/router/latest/docs/framework/react/guide/data-loading
- TanStack AI Agent Skills: https://tanstack.com/ai/latest/docs/getting-started/agent-skills — for **TanStack AI library agent skills**, not required for this Admin's Router/Start architecture. Do not install `@tanstack/ai` or Intent merely to use Router/Start.

See `docs/admin/README.md`, root `AGENTS.md`, `Admin/AGENTS.md`, relevant current-state and proof reuse docs. Historical Axue/DEXI comparison and proposed flow diagrams are design evidence, not verified code or deployment evidence.
