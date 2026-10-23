# Admin/Public cross-surface integration evidence — 2026-10-23

## Scope and authority

- Repository: `/home/mellonelay1999/workspaces/Nexi`, branch `main`.
- Source HEAD and `origin/main`: `146a40b4a9e74cae8a0d71b8ab9cf07b4e25e997`.
- Working tree was already dirty at intake. This record preserves, but does not commit or push, the current Messages changes listed below.
- This is a source/topology and proof-reuse pass. No deploy, service restart, promoted SQLite write/migration, live message, financial mutation, or browser action was performed.

## Worker-0 Graphify MCP receipt

Used the existing `mcpc @nexi-graphify` session (Graphify server 0.9.92); no reconnect or service restart.

- `graph_stats`: 6,429 nodes, 17,747 edges, 35 communities; 94% extracted, 6% inferred, 0% ambiguous.
- Bounded `query_graph` searches covered Communications, Binary controls, and Public Settings. The broad searches returned many unrelated candidates, so only named nodes/source edges were retained as navigation evidence.
- Extracted path: `CommunicationsController` → `communications.controller.ts` → `CommunicationsService`.
- The `AdminDataProvider` → `CommunicationsController` shortest path used inferred `God nodes` references. It is **not** proof of HTTP request wiring; the provider endpoint strings and controller routes were checked in source instead.
- Graphify confirms candidate ownership and traversal only. It does not establish authorization behavior, persistence, runtime, or rendered UI behavior.

## Current source integration map

| Capability | Admin/Public source | Backend/persistence source | Evidence and boundary |
|---|---|---|---|
| Admin Messages | `Admin/src/routes/messages.tsx`; `Admin/src/admin/data/nexi-api-provider.ts` calls `/communications/admin/messages`, `/communications/messages/:id/read`, and moderation paths. | `backend/src/communications/communications.controller.ts` guards Admin history/moderation reads with JWT, ADMIN surface, role, and `messages.view`; moderation mutation additionally requires `messages.send`. Controller delegates to `CommunicationsService`. | Current diff adds UI permission disabling and endpoint guard metadata tests. Public Messages page calls `/communications/messages` and `/communications/conversations`, sends via the existing endpoint, and refreshes on message sent/read events. Support remains separate in `frontend/app/dashboard/support/page.tsx`. Source integration is established; live thread/reply/browser flow is not claimed here. |
| Binary research controls | `Admin/src/routes/binary.tsx` uses the selected-position `DEFAULT/NORMAL/WIN/LOSS` override; provider methods call `/admin/binary/config`, `/admin/binary/positions`, and the position `research-control` endpoint. Account default is exposed through the Admin client-detail provider path. | `backend/src/admin/admin.controller.ts` and `admin.service.ts` own default/override writes; the canonical Binary service and SQLite/Prisma state own settlement semantics. | Graphify found the Binary DTO/service/UI and prior source proofs. This pass did not re-run Binary tests because those sources and their recorded proof are unchanged. Current production migration/runtime state is not inferred from this source pass. |
| Public Settings | `NexiAdminApiProvider` persists route, quote-category, banner, and localization configuration through the existing Admin system-config contract. | `backend/src/app.controller.ts` exposes allowlisted Public reads for navigation, routes, banners, quote categories, and localization. | Existing Public consumers are `public-navigation.ts`, `PublicRouteGate.tsx`, `PublicBanners.tsx`, `public-quote-categories.ts`, and `LocaleProvider.tsx`. Current task records contain the focused validation/readback proof. No named Public feature-flag consumer is defined; generic Admin flags remain private/out of scope. |

## Current uncommitted Messages delta

Files present dirty at intake:

- `Admin/src/routes/messages.tsx`
- `backend/src/communications/communications.controller.ts`
- `backend/src/communications/communications.module.ts`
- `backend/test/communications/message-read.spec.ts`
- `backend/test/communications/admin-message-permissions.spec.ts` (new)
- `frontend/tests/communications-contract.test.mjs`

The changes close a demonstrated permission gap in Admin message moderation reads/writes, align the controls with `messages.send`, correct the Public contract test's relative OpenAPI fixture path, and make the message-read test disable its mocked bridge instead of mutating process-global environment. The controller metadata tests cover role/surface/permission guard declarations. No source beyond these bounded Messages files was added in this pass.

## Verification reused and limitations

- Reused prior execution output from this same implementation session: focused backend Communications tests **17/17**, Admin provider tests **9/9**, Public Communications/UI contract tests **5/5**, backend build-scope TypeScript, Admin TypeScript, and Public TypeScript passed. These tests were not repeated during this Graphify/documentation continuation because the tested source boundary was unchanged. The prior raw terminal output is not copied into this record; these are reused session receipts, not newly executed tests.
- Reused Worker Fallow changed-scope analysis: 21 findings total; no unresolved imports, cycles, re-export cycles, or boundary violations. It flagged the explicitly invoked Public Node test file as unreachable from application-entry reachability and reported 20 unused-dependency findings in unchanged manifests. Those are not treated as regressions or a clean repository-wide policy pass; no rule packs were configured.
- `git diff --check` was run before this record and passed; it is run again after this documentation edit.
- Browser thread/reply interaction, deployed revision alignment, live authenticated API behavior, Public realtime delivery, and owner acceptance remain unverified in this evidence slice.

## 2026-10-23 pre-release verification

- Backend focused tests rerun against the current Messages changes: 3 suites, 11/11 tests passed (`message-read`, Admin message permission metadata, and existing Admin governance fallback).
- Admin direct TypeScript check and changed-file ESLint passed through the existing `Admin/node_modules` link. `pnpm exec`'s default pre-run dependency verifier attempted an install and failed because the intentional shared-store symlink is not a physical workspace-hoist directory; it did not replace the link or change the lockfile. Context7's current pnpm documentation confirmed `verifyDepsBeforeRun=false` disables that pre-run install. The same command-line setting was verified with a harmless `pnpm exec` probe. Admin manifests and `pnpm-lock.yaml` are unchanged from the last successful shared-store build, so the canonical production build uses the setting without installing.
- Public Communications contract test passed (1/1). This is a test-fixture path correction only; no Public production source or artifact needs rebuilding.
- Fresh unauthenticated HTTPS probes returned `/readyz` 200, `/communications/admin/messages` 401, and `/communications/admin/messages/moderation` 401. `/admin/messages` is POST-only; its GET probe returned 404 as expected.
- Build, commit, deployment and release-health evidence remain pending at this checkpoint.

## 2026-10-23 deployment and runtime verification

- **SOURCE:** `c74b3c02c948ceac2df92a76acc4f3c5c19c540d` (`fix: enforce Admin messages permissions`) is pushed to `main`. The code commit is the deployed application identity; later evidence-only commits do not require rebuilding.
- **BACKEND BUILD / DEPLOY:** Canonical `npm run build` completed in `/srv/nexi/backend` with the existing backend shared dependency link. Only the two reviewed Communications controller/module source files were synchronized. `/srv/nexi/backend/RELEASE_SHA` and `SENTRY_RELEASE` identify `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`. `nexi-api.service` is active (PID 2781380, NRestarts=0); API `/readyz` is 200 with SQLite and Redis ready.
- **ADMIN BUILD / DEPLOY:** Canonical Admin pnpm 12.14.0 from the existing Corepack cache used `/srv/nexi/admin/shared/node_modules`, `NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current`, and the existing 1Password build wrapper. Vite client, SSR, and Nitro passed. `NEXI_RELEASE_SHA` and Sentry environment identify the same source SHA. `nexi-admin.service` is active (PID 2782262, NRestarts=0); local and HTTPS `/overview` and HTTPS `/messages` returned 200; the built Messages JavaScript bundle returned 200.
- **PUBLIC REUSE:** No Public production source changed in this task, so Public was not rebuilt or restarted. The existing `.next/BUILD_ID` remains `6507cf16a8cd863048b12aa56b23fd43435695ec`; Public redirects `/` to `/dashboard`, which returned 200. All five Public Settings API endpoints returned 200 after the Backend release.
- **MESSAGES BOUNDARY:** Unauthenticated `GET /communications/admin/messages`, `GET /communications/admin/messages/moderation`, and `POST /admin/messages` each returned 401. These probes did not submit or alter a message. Authenticated thread/reply behavior is reserved for the browser acceptance phase.
- **DATABASE / ROLLBACK:** The guarded migration runner's prior read-only receipt reported `ALREADY_APPLIED schema_matches=yes`; this release made no promoted SQLite write. Backend rollback `/srv/nexi/backend/rollback/rollback-backend-9473e13-to-c74b3c0-20261023.tar.gz` SHA-256 `8844810330ede0c6f8cf28da2c6cc5ceeccd2db219190cfd4e71e265dc77d842`. Admin rollback `/srv/nexi/admin/shared/rollback-admin-8977545-to-c74b3c0-20261023.tar.gz` SHA-256 `f914d03f723b10a058ba87d5930e885166d9908731936430d7f2b00e594080e6`. Both privileged disposable extraction/rsync rehearsals passed with contents, ownership, ACL/xattrs, and Admin shared-dependency symlink preserved. Retain both until owner acceptance.
- **SENTRY:** Client, SSR, and Nitro artifact bundles were uploaded and processed for exact release `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`; release details link the matching Git commit. The exact-release 24-hour issue search found no errors. The uploader still reported some generated scripts without auto-detected source-map references; complete source-map coverage is not claimed. Sentry has no deploy record for this release.
- **BROWSER:** No browser interaction was performed in this release pass. Authenticated desktop/mobile behavior, actual message thread/reply, visual comparison, and owner acceptance remain for the designated browser phase. No Public feature-flag contract was inferred.
