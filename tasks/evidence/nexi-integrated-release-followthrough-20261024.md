# NEXI integrated release follow-through — 2026-10-24

## Outcome

The Admin Learn category status defect is fixed, built, deployed, and verified through the authenticated Admin UI and Public readback. The previously implemented NestJS shutdown repair is deployed and passed one controlled service restart/readiness check. No Admin/Public/Backend source work beyond the reviewed Admin fix was needed in this continuation.

## Source and release identities

- Source commit: `b3103ad7b07937616815b487efa212b324bdbce2` (`fix(admin): correct Learn category status transition`). It is on local `main` and `origin/main`.
- Admin: canonical `/srv/nexi/admin/current`, marker `NEXI_RELEASE_SHA=b3103ad7b07937616815b487efa212b324bdbce2`; service active, PID `2996878`, `NRestarts=0`.
- Backend: existing deployed marker `20d10c4d85bb733ae4bba680ad919fc35b98e344`, which includes the committed NestJS Communications and Redis adapter shutdown fixes; service active, PID `2997666`, `NRestarts=0` after the controlled restart.
- Public: unchanged build ID `3bb57e02ea921531975124ce2c827382a9f1ec6b`; service active, PID `2896172`, `NRestarts=0`.
- Retained Admin rollback: `/srv/nexi/admin/shared/rollback-admin-20d10c4-to-b3103ad-20261024.tar`, SHA-256 `2ad8cb02d537d751a88fa9329cd14e4e646c8dc4e8bb222af8fe950db11c74a4`. Archive integrity and restoration comparison were verified before replacement.

## Admin Learn defect and acceptance

The status button supplied the desired state where the backend compare-and-set contract requires `expectedStatus=current` and `status=target`. The helper `Admin/src/admin/data/learn-category-status.ts` now returns the correct pair; `Admin/src/routes/learn.tsx` passes the category's actual current status and uses that helper. `Admin/test/nexi-api-provider-reorder.test.mjs` covers ACTIVE→INACTIVE and INACTIVE→ACTIVE.

The first browser request after deployment still returned 409 because the already-open page had retained the old Learn JavaScript chunk. A cache-bypassing page reload fetched `learn-DJmDHx_Z.js`. In the authenticated existing Chrome session (Chrome DevTools MCP at 127.0.0.1:5858), the Admin category PATCH returned 200, the page read back `INACTIVE`, and the UI displayed “Category hidden from Public Learn.” The action used the existing audited Admin control and its reason field; no direct database mutation or article publication was made. Public `GET /communications/learn/categories` returned 200 with `[]`. The category remains available for the two unchanged draft test articles in Admin, but is no longer exposed as an active Public category.

The authenticated Admin page exposed the eight workspace links (Overview, Clients, Trading, Wallet & Finance, Markets, Products, Communications, Administration & Settings); `/sandbox` was absent from navigation. This was a current rendered-navigation check, not a full eight-workspace interaction or responsive screenshot campaign. Admin messages and Support remain distinct routes. No controlled Messages conversation existed, so send/reply/history/reconnect was not tested.

## Backend shutdown and readiness

The explicit restart of `nexi-api.service` completed in 6 seconds at systemd level. The old PID logged MarketIngest shutdown, `beforeApplicationShutdown`, Socket.IO Redis adapter closure, `onApplicationShutdown`, and the final runtime-handle stage; systemd deactivated it successfully instead of killing it after the old timeout. The replacement process bound `127.0.0.1:3002` about 61 seconds after start. HTTPS probes during that startup interval received transient 502s; after the listener was ready, `/ops/ready` returned 200 with `database=true` and `redis=true`. The service remained active with `NRestarts=0`. No second restart was attempted.

After readiness, unauthenticated `/admin/me` and `/communications/admin/learn/categories` each returned 401. Admin `/overview` and `/learn` returned 200. Following a Public Learn reload, the Socket.IO polling handshake/poll returned 200; no pushed event or reconnect sequence was exercised. The reloaded Public Learn page showed no published lessons and the unauthenticated/verify-wallet state, so this does not verify wallet identity or authenticated Public journeys.

## Verification actually run

- `cd Admin && node --experimental-strip-types --test test/nexi-api-provider-reorder.test.mjs` — PASS, 11/11.
- `cd Admin && ./node_modules/.bin/tsc --noEmit --incremental false` — PASS, no diagnostics.
- `cd Admin && ./node_modules/.bin/eslint src/routes/learn.tsx src/admin/data/learn-category-status.ts` — the new helper had no findings; existing `learn.tsx` emitted 46 Prettier formatting errors. The file already contains broad formatting drift; this was not treated as a clean ESLint pass, and no unrelated formatting sweep was made.
- `git diff --check` — PASS.
- Graphify: `graphify update . --no-cluster` — exit 0, 6,648 nodes / 18,059 edges; SQL parser warning and 107 files without symbols. `graphify affected "learnCategoryStatusUpdate" --depth 2` found the Learn route/helper, its focused test, Page, and route tree. This is topology evidence, not behavior proof.
- Fallow: changed-file review reported a medium review signal; bounded audit passed with 0 dead-code and 0 introduced-complexity findings, while reporting 7 inherited complexity findings. Dependency classification was incomplete because the repository-root `node_modules` is absent; no dependency changed.
- CodeScene MCP: authenticated `pre_commit_code_health_safeguard` returned `quality_gates=passed`, 3 files checked, 3 eligible, `no-issues-found`.
- Sentry: Admin upload created client, SSR, and Nitro bundles `b5be204c-00a3-5261-abae-293b24ea81e6`, `dab565c7-c29a-51a2-b80b-8f61bfe43825`, and `20f46375-62ac-53fb-b5fe-6a5dcf7b2d1f`. Exact release search for `b3103ad7b07937616815b487efa212b324bdbce2` in `mellonelay/nexi` found no error events in the sampled 24 hours. Source-map association remains partial; full coverage is not claimed.
- Canonical Admin build: from `Admin/`, used pinned Corepack pnpm `12.14.0`, the Admin shared dependency store, the existing secret wrapper, and `NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current`. Vite client, SSR, and Nitro completed with exit 0. No dependency install or Public/Backend rebuild was performed for this Admin-only source delta.

## Skills and tools applied

The current continuation reused previously opened NEXI Kernel, Capability Router, `using-agent-skills`, Ponytail, TDD, Git workflow, React/TanStack, and NestJS/SQL contracts. For current verification, the Browser Testing with DevTools skill was opened and applied. Native Worker-0 shell and canonical Admin build wrapper were used; Chrome DevTools MCP 5858 verified the authenticated Admin UI and Public readback; Graphify CLI, Fallow CLI, authenticated CodeScene MCP, Sentry MCP, `worker0-protect status`, systemd/journalctl, and HTTP checks produced the results above. Skill discovery/registration alone is not claimed as invocation.

## Remaining acceptance

- Controlled same-thread Public Messages creation, Admin reply, Public readback, refresh persistence, reconnect, and role behavior require an approved test conversation fixture. No customer was contacted.
- Lower-role Admin permission checks and an eligible OPEN Binary position fixture remain unavailable/unverified.
- Broader Public wallet/provider, KYC, realtime-event/reconnect, and responsive-reference cases remain for the owner browser phase. No wallet signature or financial operation was performed.
- The four economic gates remain `OWNER_ACCEPTED_UNTESTED`. Final owner acceptance is open.
