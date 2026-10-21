# NEXI ADMIN — IMPLEMENTATION CONTRACT MAP (A–F)
Status: SOURCE-MAPPED, NOT IMPLEMENTED. 2026-10-21. Current Worker-0 source HEAD 6da08471ef200b6cadf96ef3d49ed85fc0f12fc4 plus preserved local Admin changes. Graphify CLI graph: graphify-out/graph.json (6128 nodes, 16999 edges, 250 communities; 7.1 MB; graph_stats confirmed against 6da0847); local mcpc @nexi-graphify v0.9.92, mcpc v0.7.0. Static topology supports, but cannot replace live source/tests. Owner intent outranks stale wording. **NOT A WORK HANDOFF OR APPROVAL TO IMPLEMENT/DEPLOY.**

## Decisions and naming
NEXI is an educational DEXI reconstruction. Keep concise visible labels: Clients; Binary Trading; Ongoing Trades; Settings; Binary Trading Control; Normal / Win / Lose. Remove global Test/Production selection from ordinary navigation. Preserve internal authorization, audit, provider provenance and ledger ownership without burdening the operator with infrastructure labels. Eight compact homes; specialized operations become tabs, drawers, detail paths rather than deleted backend features. Do not introduce a second settlement engine or silently overwrite canonical market quotes.

## Source facts and unfinished work matrix
| ID | Visible owner/place | Existing source and backend authority | Verified vs absent | Smallest future change | Proof |
|---|---|---|---|---|---|
| A01 | Admin navigation and layout | Admin/src/admin/config/navigation.ts; components/shell/AdminShell.tsx; routes/__root.tsx; router.tsx | Local 8-group NAV changed; 33 nav entries + /reconciliation file route not in menu; most secondary routes still shown as direct links, not contextual tabs | Compact group entry points, contextual tabs, responsive drawer; preserve direct URLs, permission-aware routing | route inventory; typed navigation; per-role link tests; browser |
| A02 | Admin action context | Admin/src/admin/session/session.tsx, routes/sandbox.tsx, admin/data/provider.ts, nexi-api-provider.ts, NestJS admin RBAC | Global selector removed locally; session still initializes SANDBOX; many mutations pass context.environment; sandbox route can set it | Define explicit per-action context, avoid hidden state controlling all actions; maintain correct server permissions | mutation context tests and exact server authorization |
| A03 | Clients > Client Detail | routes/users.tsx, provider.getUser/listUsers, Admin API /admin/users | User directory/detail exists; no evidenced durable account Binary Normal/Win/Lose preference | Define account mode DTO/read/update; SQLite policy with version, actor/audit; display saved default | update/reload, eligibility, repeated and concurrent changes |
| A04 | Trading > Binary > Ongoing Trades | routes/binary.tsx PositionsPanel, provider.listBinaryPositions, /admin/binary/positions | Existing positions list and provider-triggered settlement; no evidenced position mode update API | Position detail control, guard open/unsettled, versioned override and effective mode readback | stale/settled rejection, direct API/DB/readback tests |
| A05 | Binary Normal/Win/Lose authority | backend/src/binary/binary.service.ts; sandbox/sandbox-scenario.service.ts; sandbox-execution.service.ts; admin/admin.service.ts | Existing directive lookup can select WIN/LOSS before normal provider path; executed sandbox commands can be account-targeted and optionally position-targeted; admin request/execute reject NODE_ENV=production; they are NOT the requested general account/position contract | Decide/reuse smallest single durable policy authority and settle path; resolve precedence (position > account > Normal), expiry and per-position concurrency without broad rewrites; retain canonical ledger atomic settlement | focused expiry, idempotency, audit and payout test receipts |
| A06 | Binary chart/result consistency | binary.service.ts settlement; Public frontend/app/dashboard/binary/page.tsx and price/candle readers, backend quote gateway | Current sandboxExpiryPrice selects settlement price; full chart evolution to match selection before expiry NOT evidenced | Trace actual chart quote/candle consumer; scope reproducible research chart stream separately from provider feed; recover after refresh | chart+result consistency, user isolation, reconnect |
| A07 | Trading > Binary > Settings | routes/binary.tsx PairsPanel; provider.updateBinaryPair; /admin/binary/config and risk/pairs | Source has five-duration per-pair config, payout and stake capability; field-level deployed parity unverified | Make five boxes/duration, payout/min/max/enable clear and editable where DTO supports; do not assume arbitrary new duration accepted | Admin mutate -> DB -> Public config readback; invalid values |
| A08 | Markets | routes/assets.tsx, market-feeds.tsx; provider.listAssets/listMarkets; /admin/market/assets, market/feeds, feed status; MarketPair/provider config | 53 asset catalog reference and provider mapping are existing design; current persistence/readback not checked | Preserve accessible 53-asset management and price-data source controls under Markets | list/search/update/readback and feed provenance |
| A09 | Wallet & Finance | routes/wallets.tsx/networks.tsx/deposits.tsx/withdrawals.tsx/ledger.tsx; Admin controller wallet-networks, currencies, addresses, deposits/withdrawals, ledger | Different backend writers/authority; /reconciliation is non-nav unavailable placeholder | Put deposit addresses, networks and wallet/account review in intelligible tabs, preserve separate backend contracts; keep Ledger and queues | context/link and readback, no direct ledger writes |
| A10 | Mining/Loans | routes/mining.tsx, loans.tsx; Admin /mining-plans POST/PATCH and /loan-plans POST/PATCH | Config APIs exist; persisted rates/limits and Public parity not verified this run | Preserve plans edit/read and inspect field-level Public consume path | create/edit/disable/refresh/Public readback |
| A11 | Communications > Messages | routes/messages.tsx; provider.listMessages, listMessageModeration, resolveMessageModeration; /communications/admin/messages; communications service/gateway | Current UI is list + moderation, **no Admin chat composer/reply workflow evidenced**. communications.controller.ts offers POST /communications/messages (authenticated user), GET /communications/conversations and GET /communications/admin/messages (Admin read), but no explicit Admin-specific thread reply route; inspect role and recipient semantics before reuse. Support ticket reply exists at /admin/tickets/:id/reply but is different | Map canonical conversation/read/send endpoints and permission; implement two-panel conversation list/thread/reply/unread using existing service where supported; moderation secondary tab | Admin send -> Public receive -> reply -> Admin read; reconnect/history |
| A12 | Communications remainder | support, notifications, announcements, learn routes + corresponding provider methods | Existing features maintained | Group logically without removing publication/approval capabilities | route/provider/action parity |
| A13 | Public settings | routes/frontend-control.tsx/navigation.tsx/localization.tsx/feature-flags.tsx | Controls exist as separate destinations | Merge navigation presentation into Public App Settings, preserve distinct API owners and validation | Admin edit -> Public readback |
| A14 | Governance and System | admins/roles/approvals/audit/health/maintenance; /reconciliation hidden | Specialized routes exist. /reconciliation is not complete system | Group in Administration & Settings; no fabricated reconciliation capability | permission and route/direct-URL verification |

## Source-to-owner graph (real boundaries)
```mermaid
flowchart LR
  NAV["navigation.ts + AdminShell"] --> ROOT["TanStack Router / RouteGuard"]
  ROOT --> UX["Routes: users / binary / messages / settings"]
  UX --> P["AdminDataProvider contract"]
  P --> C["NexiAdminApiProvider"]
  C --> N["NestJS AdminController / CommunicationsController"]
  N --> S["AdminService / BinaryService / CommunicationsService"]
  S --> DB["VPS SQLite via legacy-named adapters"]
  S --> OUT["Ledger/Activity/Audit/EventOutbox"]
  OUT --> PUB["Public readback + Socket.IO"]
```

## Dependency order: future implementation, NOT started
1. Repair A02 action-context semantics first, with server contract proofs. Navigation label changes must not accidentally send a hidden SANDBOX context for routine Admin actions.
2. Complete A01 contextual workspaces without deleting routes or hand-editing generated routeTree.gen.ts; preserve AdminDataProvider and the existing TanStack Start plugin wrapper.
3. Design and test one backend Binary policy contract (A03-A06): account default, position override, exact effective precedence, lifecycle and durable settlement. Keep normal provider path unchanged. Existing sandbox form is not adequate evidence of the final feature.
4. Complete A07 and A10 field-level Admin→backend→Public configuration parity, and A08/A09 preservation, without rewriting finance.
5. Add A11 two-way Messages interface on an evidenced communications contract; don't repurpose ticket reply blindly.
6. Verify A12-A14, focused type/lint/tests, then separate release and browser acceptance per owner instructions.

## Exact acceptance evidence (future)
- Navigation: all existing routes/direct links still work for permitted roles; smaller viewport, selected context, search/filter/refresh/back all work.
- Binary: choose account default Normal/Win/Lose and read after reload; open eligible position and override before settlement; version/race/closed-position tests; selected result, quote/candle display and History/Ledger/Activity agree after refresh. No duplicate settlement or second finance writer.
- Settings: duration/payout/min/max/enable, Mining and Loans parameters persist and show correctly in Public; values invalid under backend rule rejected.
- Messages: two-way Admin↔Public reply/history and unread/reconnect behavior, plus moderation independent from chat.
- Source checks: Admin tsc + focused ESLint previously passed only for the initial four-file change, not these new features; Graphify/Fallow are static; actual Nest backend tests and browser acceptance remain undone.
- Release: source SHA, build artifact, deployment identity and release-matched Sentry are different proof classes; no deployment is authorized by this map.

## Conflict / known gaps
- Older docs say 34 sidebar entries; correct is 33 visible nav entries + 1 non-nav named /reconciliation route.
- Some prior documents say new eight-workspace IA is only proposed. Current VM has uncommitted eight-group code; contextual tabs remain proposed.
- The existing docs use prolonged 'simulation' names, despite owner preferring 'Binary Trading Control' in visible UI. Use simple UI labels, clear internal contracts.
- Requirement of near-expiry coherent chart changes is owner-stated historical reference, NOT an existing NEXI verified chart API.
- Owner has not authorized handing over this package yet; WORK_SSH_NEXT_EXECUTION_HANDOFF_2026-10-21.md remains draft, not controlling.
- No current deployed Admin identity or authenticated runtime acceptance was checked in this mapping pass.

## Per-workspace exact disposition
These are 33 registered links **currently grouped under eight headers**, not eight single links yet. Keep existing URL and permission even when making secondary items contextual:
- Overview: /overview; /health cross-link.
- Clients: /users primary; /kyc and /sessions inside client area.
- Trading: /binary and /spot primary; /settlements, /exposure and /sandbox contextual; keep /sandbox URL as compatibility only until its commands are replaced by verified account/position controls.
- Wallet & Finance: /wallets primary; /networks, /deposits, /withdrawals, /ledger contextual.
- Markets: /assets primary; /market-feeds contextual.
- Products: /mining and /loans.
- Communications: /messages primary; /support, /notifications, /announcements, /learn contextual.
- Administration & Settings: /frontend-control primary; /navigation, /localization, /feature-flags, /admins, /roles, /approvals, /audit, /health, /maintenance contextual.
- /reconciliation: preserve file/deep link, hide as existing unavailable placeholder. No reconciliation API to invent.

## Graph and tool evidence / exact boundaries
- Local Graphify CLI `god-nodes --top 12`: financial gateway (299 links), `AdminDataProvider` (143), `NexiAdminApiProvider` (142), `AdminService` (105), `AdminController` (101). They are hubs, **not** single responsibility owners for all actions.
- Local `mcpc @nexi-graphify` v0.7.0 → Graphify MCP 0.9.92: `graph_stats`, `get_neighbors`, `god_nodes` return valid results with default timeout; 10 MCP tools discovered. A BinaryService label was ambiguous: use `backend/src/binary/binary.service.ts::BinaryService` or exact graph node ID; do not choose test symbols.
- Fallow `guard` inspected `navigation.ts` and `AdminShell.tsx` and found no boundary violations; this is not proof of live navigation behavior.
- Canonical source-only `backend/src/sandbox/sandbox-scenario.service.ts`: mode finder supports executed command scoped by account and optionally position, with expiration; `backend/src/admin/admin.service.ts` and `backend/src/sandbox/sandbox-execution.service.ts` reject controls in `NODE_ENV=production`. No UI rename changes that constraint.
- `Admin/src/admin/session/session.tsx` still defaults environment to SANDBOX. `AdminShell.tsx` still shows `EnvironmentBadge`; previous change removed selector only. Do not declare environment architecture corrected.
- Communications: `Admin/src/routes/messages.tsx` renders moderation and read-only message tables, while `backend/src/communications/communications.controller.ts` owns authenticated message send/read/list and Admin message read/moderation. Admin-to-client two-way composer/permissions remain to be verified.
- Retired Cloudflare app runtime must not be resurrected merely from `D1*` legacy names.

## Closeout status and next source proofs
A01-A14 are documented with concrete file ownership and expected proof, but **A01-A14 are not all implemented or runtime verified**. Next targeted proof required: exact Binary account/position policy DTO/storage/version and price chart consumer; per-resource Admin/Public setting parity; Admin two-way message command+permission. After these contracts are settled, full UI integration, focused tests, deployment and browser checks can occur without replaying previously owner-accepted financial campaigns. The separate WORK_SSH handoff file remains a draft; it is not activated.
