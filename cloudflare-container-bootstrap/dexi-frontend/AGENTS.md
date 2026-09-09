# NEXI Public Frontend — Current Instructions

## Authority
- GitHub `main` is the durable source authority for Public Frontend and the rest of NEXI.
- The current synchronized VM/RDC checkout is the execution workspace for this task; historical Windows/Codespace/old-VM trees are evidence only.
- Backend/API/D1/Cloudflare contracts must be read from the same accepted source frontier; do not use stale mirrors as contract authority.
- Preserve unrelated parallel work and reconcile unique accepted changes before fan-in. Production mutation requires explicit owner approval.

## Current stage
The existing design and route surfaces are preserved; this is production-path integration work, not a redesign.
Frontend work proceeds only from the current acceptance-matrix frontier, reusing proven unchanged contracts and closing only unresolved dependencies. Runtime/browser acceptance remains downstream of code-to-code closure.

## Preserve
Preserve Next.js 14, React 18, TypeScript 5, Tailwind 3, the existing Deep Liquid Violet design authority, public route scope, Dashboard/Quotes Hub, Spot/Margin, Binary/Options, Wallet, Mining, Loans, Messages, Support, Learn, Settings, localization, and existing responsive behavior unless a verified contract defect requires a targeted change.
The backend owns prices, balances, payouts, PnL, settlement, authorization, lifecycle truth, and operational configuration. Frontend must render explicit loading/live/stale/unavailable/error states rather than fabricate data.

## Parallel Frontend lane
Start from the existing hubs: `app/lib/api.ts`, `wallet-auth.ts`, `product-states.ts`, market/realtime hooks, route-level API calls, and tests.
Reconcile request/response types, auth/session storage, idempotency/error handling, lifecycle enums, pagination/filtering, file/upload contracts, and realtime reconnect/recovery against confirmed backend behavior. Do not invent final routes that do not yet exist.
The current production default `apiBaseUrl` fallback of `/api` is a client deployment decision to validate at the final join; do not assume it is correct for the final domain topology until deployment routing is frozen.
Keep wallet challenge/verify/me/logout contracts synchronized with backend auth. Do not expose secrets in browser configuration.
Keep Aiven/Socket.IO as realtime transport only; recover authoritative state from backend/D1-backed reads after reconnect.

## Graphify
Use the currently installed VM Graphify against the current repository graph; historical frontend graph counts are evidence only and must not be treated as current topology without refresh. Current hubs previously included `authoritativeValue()`, `api`, `useLocale()`, `findAsset()`, `SpotPage()`, `useMarketData()`, and `resolveEndpointTemplate()`.
After a coherent code batch run `graphify update . --no-cluster`; use `affected`, `path`, and `explain` for targeted impact. Reclustering is only needed when community/God-node analysis matters.

## Contract evidence
Use actual VM controller/DTO/OpenAPI material for contract changes. Feed API Documentation Checker/API Impact Mapper concrete endpoint/schema evidence, not progress summaries.
Until `/docs-json` is deployed and frozen, mark uncertain client assumptions explicitly and keep adapters isolated so final contract deltas are cheap.

## Validation
Use the existing package manifest/lockfile and scripts. Run focused typecheck/lint/unit/browser tests for changed surfaces, including 320/360/390/430 mobile widths plus desktop, keyboard/focus, no horizontal overflow, and current locale requirements when UI behavior changes.
Do not redesign completed screens merely because the backend contract changes. Adapt data, state, errors, auth, and realtime behavior with the smallest coherent change.
