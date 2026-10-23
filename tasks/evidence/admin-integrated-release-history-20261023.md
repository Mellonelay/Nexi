# NEXI Admin/Public source and release handover

**Updated:** 2026-10-23
**Repository:** `/home/mellonelay1999/workspaces/Nexi`
**Branch:** `main`
**Source release:** `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`
**Public build identity:** `6507cf16a8cd863048b12aa56b23fd43435695ec`
**Documentation baseline before this handover:** `3d54bfe6cc052d5e199ffa46c0ab925e05dec717`

This record covers the completed Admin/Public integration, focused source checks, release evidence, and current acceptance boundary. The source SHA and runtime build identities are distinct from this documentation-only history update.

## Completed source work

- **Admin workspaces and navigation:** compact eight-workspace primary navigation, contextual subroutes, permission-aware navigation, preserved deep links and session identity. `/sandbox` is hidden from the visible navigation but its guarded source route remains. `Trading → Binary` opens Ongoing Positions.
- **Binary controls:** account default Normal/Win/Lose remains in Client Detail. The separate Default/Normal/Win/Lose override is limited to eligible open positions and uses the canonical backend settlement, version/audit, SQLite/Prisma, Ledger/Activity/EventOutbox, and readback paths. Normal market settlement remains the default.
- **Quotes and Public settings:** category visibility/order is allowlisted against the existing 53-asset catalog; the Admin cannot hide the last visible category. Public normalization distinguishes a valid explicit selection from missing or malformed config. Supported locale overrides use existing keys/locales and bundled fallback strings. Approved navigation/route-state and banner controls use allowlisted API reads and real Public consumers. Generic feature flags have no approved named Public consumer and remain excluded.
- **Messages:** Admin conversation/history/moderation controls use the existing Communications service. Admin message history/moderation endpoints enforce authenticated Admin surface, role, and `messages.view`; moderation mutations also require `messages.send`, and the UI reflects those permissions. Public messages use existing conversation/send/read/realtime routes. Support remains separate.
- **Shared builds:** the four applicable `AGENTS.md` files now document the canonical Worker-0 build paths and the three separate app-specific dependency stores. Backend, Public and Admin stores are not merged. The Admin shared-store/Corepack invocation avoids an unintended dependency installation through pnpm's pre-run verifier.

### Canonical package and build ownership

| Surface | Runtime/build root | Dependency authority | Canonical production build |
|---|---|---|---|
| Backend | `/srv/nexi/backend`, output `/srv/nexi/backend/dist`, `nexi-api.service` | Backend `package-lock.json`; `/srv/nexi/backend/shared/node_modules` | From `/srv/nexi/backend`, with Node `24.21.0`: `npm run build` |
| Public | `/srv/nexi/public/current`, output `/srv/nexi/public/current/.next`, `nexi-public.service` | Public `package-lock.json`; `/srv/nexi/public/current/node_modules` links to `/srv/nexi/public/shared/node_modules` | From `/srv/nexi/public/current`: `./node_modules/.bin/next build --webpack && node scripts/prepare-standalone-assets.mjs` |
| Admin | Real directory `/srv/nexi/admin/current` (not a symlink), `nexi-admin.service` | `Admin/pnpm-lock.yaml`; pinned pnpm `12.14.0`; `/srv/nexi/admin/shared/node_modules` | `NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current corepack pnpm@12.14.0 --config.verify-deps-before-run=false run build`; use the existing `~/.local/bin/nexi-admin-with-secrets` wrapper when release Sentry credentials are required. |

The Public and Admin source `node_modules` paths and Backend runtime module path must retain their own surface-specific shared-store links. Do not merge package stores, install from source checkouts, create alternate build roots, or overwrite a running artifact with a diagnostic build. Full stop/sync/build/restart/recovery sequencing is in the root and surface `AGENTS.md` files. Commit `3d54bfe6cc052d5e199ffa46c0ab925e05dec717` records these path corrections; no package manifest, lockfile, or application source was changed by that documentation commit.

Key implementation commits on `main`:

| Commit | Scope |
|---|---|
| `84b5b2dee3c6fc3e50233e21bc359da4c23bf414` | Initial Admin integration source frontier |
| `0107eccca1f6990bef579ea9c2e43ca89423ddbe` | Public Settings integration |
| `24cf931ced0535a6793253a8bf53e87bdaeff34f` | Quotes last-visible-category validation |
| `d163bfa85479fb7efb465a8a675141cdc4e50f17` | Approved eight-workspace/Binary visual contract |
| `8977545dfca13f83d6bd63b4bcd4fe069d3ce2c9` | Overview, Binary defaults, Messages UI refinements |
| `c74b3c02c948ceac2df92a76acc4f3c5c19c540d` | Admin Messages permission enforcement and release source |
| `3d54bfe6cc052d5e199ffa46c0ab925e05dec717` | Canonical build/dependency documentation |

The detailed changed-file map and cross-surface receipt are in [`admin-public-cross-surface-integration-20261023.md`](admin-public-cross-surface-integration-20261023.md). Task chronology remains in [`tasks/plan.md`](../plan.md), [`tasks/todo.md`](../todo.md), and [`NEXI_PROOF_REUSE_REGISTER.md`](../../NEXI_PROOF_REUSE_REGISTER.md).

## Cross-surface ownership and Graphify evidence

The current Worker-0 `@nexi-graphify` MCP session is live (Graphify server `0.9.92`). A fresh `graph_stats` call against this checkout returned **6,454 nodes, 17,634 edges, 269 communities, 94% extracted, 6% inferred, 0% ambiguous**, built at `3d54bfe6cc052d5e199ffa46c0ab925e05dec717` (the checkout HEAD at inspection).

| Flow | Admin | NestJS/backend | Public | Evidence boundary |
|---|---|---|---|---|
| Messages | `Admin/src/routes/messages.tsx` → `Admin/src/admin/data/nexi-api-provider.ts` | `backend/src/communications/communications.controller.ts` → `CommunicationsService`, with Admin JWT/surface/role/permission guards | `frontend/app/dashboard/messages/page.tsx` uses existing conversations/send/read/realtime endpoints; `frontend/app/dashboard/support/page.tsx` remains a distinct Support flow | Graphify extracted the controller → service ownership path. Its Admin-provider → controller connection was inferred in the prior query and is corroborated by direct endpoint strings/source, not treated as a Graphify-extracted HTTP edge. |
| Binary controls | `Admin/src/routes/binary.tsx`, client details, and `Admin/src/admin/data/nexi-api-provider.ts` | `backend/src/admin/admin.controller.ts` / `admin.service.ts` plus canonical Binary settlement and SQLite/Prisma state | Existing eligible research presentation and result consumers in `frontend/` | Graphify located related UI/service nodes. A shortest path also traversed a test and `node:fs`; that is not a meaningful runtime call path. Use the direct source and tests as the integration proof. |
| Public settings | Admin provider persists the existing settings contract | `backend/src/app.controller.ts` exposes allowlisted reads | `frontend/app/lib/public-navigation.ts`, `PublicRouteGate.tsx`, `PublicBanners.tsx`, `public-quote-categories.ts`, and `LocaleProvider.tsx` consume the supported values | Graphify found source candidates; the current shortest path between route gate and controller traversed auth/test nodes. The direct contract is verified from source and focused tests, not inferred from that path. |

Graphify is structural navigation evidence only; it does not prove runtime wiring, permissions, persistence behavior, or rendered UI. The detailed MCP receipt and source path list are linked above.

## Source-level verification receipts

These are existing successful, scoped results recorded in the task evidence. They were **reused rather than rerun** during this documentation/handover work because the relevant source was unchanged.

| Area | Recorded checks |
|---|---|
| Initial integration | Backend build-scope TypeScript; 7 focused backend suites / 51 tests; disposable SQLite regression 19/19; Admin and Public TypeScript; Public Binary chart tests 6/6; `git diff --check`. |
| Public Settings | AppController/controller tests 7/7; disposable-SQLite Admin-write/Public-readback 2/2; Public locale/message/settings tests 6/6; backend/Admin/Public TypeScript; Admin category-fallback SSR self-check; changed-file Public ESLint (no errors; one existing LocaleProvider warning). |
| Quotes last-visible rule | Disposable SQLite persistence/readback/rejection 3/3; AppController tests 7/7; Public settings tests 3/3; backend/Admin/Public TypeScript; changed Admin ESLint; `git diff --check`. |
| Admin route/Binary visual contract | Admin TypeScript; changed-file ESLint and Prettier; provider/navigation/route contract suite 5/5; `git diff --check`. |
| Overview/Messages UI | Admin TypeScript; provider/UI suite 9/9; changed-file ESLint, Prettier and `git diff --check`. |
| Messages integration | Backend Communications/guard tests 17/17 during implementation and focused 11/11 pre-release; Admin provider/UI 9/9; Public Communications/UI contracts 5/5 and focused contract 1/1; backend build-scope, Admin and Public TypeScript. |
| Changed-code structural checks | Fallow review recorded 21 findings, with zero unresolved imports, cycles, re-export cycles, or boundary violations. One directly invoked Public Node test was reported unreachable from application-entry reachability; 20 unused dependencies were in unchanged manifests; no rule packs were configured. Earlier phase-specific Fallow results and known inherited findings remain in the plan. |

No test or application build was repeated for this handover-only edit. The canonical Admin/Backend production build results and release checks below remain from the prior release receipt.

## Build, release, and runtime evidence

- **Backend:** canonical build completed in `/srv/nexi/backend`; backend release marker and `SENTRY_RELEASE` were recorded as `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`.
- **Admin:** canonical Vite client, SSR, and Nitro build completed in `/srv/nexi/admin/current`, using pinned pnpm `12.14.0`, `Admin/pnpm-lock.yaml`, `/srv/nexi/admin/shared/node_modules`, `NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current`, and the existing secret-injection wrapper. Admin release marker matched `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`.
- **Public:** no Public production source changed in the Messages release, so the existing artifact was reused without rebuild/restart; `.next/BUILD_ID` was `6507cf16a8cd863048b12aa56b23fd43435695ec`.
- **Runtime checks in the release receipt:** Backend `/readyz` returned 200; five Public Settings reads returned 200; Admin `/overview`, `/messages`, and the Messages bundle returned 200. Unauthenticated protected Admin Messages probes returned 401. All three services were active and reported zero restarts at that recorded check.
- **Database:** guarded runner read-only receipt said migration `0017` was already applied and schema matched. No production migration or database write occurred in the release pass.
- **Rollback:** Backend archive SHA-256 `8844810330ede0c6f8cf28da2c6cc5ceeccd2db219190cfd4e71e265dc77d842`; Admin archive SHA-256 `f914d03f723b10a058ba87d5930e885166d9908731936430d7f2b00e594080e6`. Both passed privileged restoration rehearsals; keep them through owner acceptance.
- **Sentry:** three Admin bundles were processed for the exact `c74b3c0…` release and the reviewed 24-hour issue search found no errors. Some generated scripts lacked auto-detected source-map references; full source-map association is not established. No Sentry deploy record was found.

These runtime facts are from the dated release receipt, not a fresh production inspection in this handover turn.

## Completion state and next owner phase

| State | Status |
|---|---|
| `SOURCE_IMPLEMENTED` | Completed for the listed Admin/Binary/Messages/Public Settings source contracts at their cited commits. |
| `STATICALLY_VALIDATED` | Completed for the focused checks listed above; repository-wide lint cleanliness is not claimed. |
| `TESTED` | Completed for the recorded focused tests; unchanged suites were reused, not rerun in this handover. |
| `INTEGRATED` | Admin and Backend release at `c74b3c0…`; Public artifact reused at `6507cf16…`, per dated release evidence. |
| `DEPLOYED` / `RUNTIME_VERIFIED` | Recorded as complete in the release receipt; not rechecked during this handover turn. |
| `BROWSER_VERIFIED` | Incomplete: authenticated Admin/Public desktop/mobile acceptance and actual Messages thread/reply interactions remain for the designated browser phase. |
| `OWNER_ACCEPTED` | Not recorded. |

The next phase is the owner's designated authenticated browser acceptance against the deployed release. Verify the actual current release before testing; cover eight-workspace navigation/deep links, Binary account default and eligible position override, Quotes visibility/order and final-visible restriction, route/banner and localization settings, Messages thread/reply and Support separation, refresh persistence, permission/error states, and responsive layouts. Do not infer browser proof from source, Graphify, screenshots, or HTTP responses.

## Skills and workflow receipts

For source/release phases, the task records document use of NEXI Work Kernel as lifecycle owner, Capability Router for capability selection, Agent Skills workflow selection, Ponytail for bounded changes, backend/Admin/Public specialists, Graphify MCP, and Fallow. This handover turn actually read the Handoff and Context Handoff skills, Agent Skills `using-agent-skills`, Git workflow skill, and repository Graphify instructions; it invoked the Context Handoff `assess` command and live Worker-0 Graphify MCP. Generic Data Analytics and Vibe Coding methods were not invoked because this was a documentation/Git handover rather than analytics or implementation work.

## Git and preserved working state

At intake, `HEAD` and `origin/main` were both `3d54bfe6cc052d5e199ffa46c0ab925e05dec717`. This handover is documentation-only and does not change application code, generated artifacts, dependencies, services, or SQLite. The related release-history record is being committed separately. Existing task/current-state edits that also contain unrelated operational notes are left out of this handover commit to preserve their original working-tree state.
