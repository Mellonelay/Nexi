# NEXI coordinated release checkpoint — 2026-10-23 15:10 UTC

## Outcome

The reviewed local `main` application batch at `3bb57e02ea921531975124ce2c827382a9f1ec6b` was built and deployed once per changed surface in Backend → Public → Admin order. All three release markers now match that source SHA. Focused browser checks passed after deployment. This is a release checkpoint, not final product or owner acceptance.

## Source and repository

- Application release SHA: `3bb57e02ea921531975124ce2c827382a9f1ec6b` (`main`). The application batch is the nine local commits from `8084d860d9672c4de5c3bdbee2b96513db4b2b14` through that SHA; `origin/main` was not changed and no push was performed.
- Before this receipt, `git status` was clean and `git diff --check` passed. The nine-commit range contained 21 tracked files (+728/-23), including the Admin layout/status repair, Public authenticated-request cache directives, Backend authenticated-response cache headers, focused tests, and prior evidence/task records.
- The user-level `~/.codex` and `~/.agents` paths are outside the NEXI Git repository and neither is a Git checkout. They are not included in this NEXI commit.
- Protection status was reconciled to 70 locked, 0 unlocked, 0 missing. The four state/task documents and this receipt do not occur in the protection manifest; no protected file was edited in this checkpoint.

## Focused source checks reused for the release

- Backend: `NODE_OPTIONS=--experimental-vm-modules ./node_modules/.bin/jest --runInBand src/auth/jwt-auth.guard.spec.ts` — 1/1 passed.
- Public: `node --test app/lib/auth-session.test.mjs` — 8/8 passed; Node emitted a non-failing `MODULE_TYPELESS_PACKAGE_JSON` warning.
- Admin: `node --experimental-strip-types --test test/nexi-api-provider-reorder.test.mjs` — 10/10 passed. The focused Admin TypeScript check also exited successfully in the preceding source verification.
- These are focused checks; no unchanged broad suite was repeated. The user-approved TEST_ONLY content corrections documented in the preceding browser receipt were not altered in this release.

## Release evidence

| Surface | Previous marker | New marker / build identity | Artifact SHA-256 | Service after release |
|---|---|---|---|---|
| Backend | `c74b3c02c948ceac2df92a76acc4f3c5c19c540d` | `3bb57e02ea921531975124ce2c827382a9f1ec6b` | `dist/src/main.js`: `95f8934947e2a4bb7df6e7beacc5ea57e20ede1de78930bd5c899a2d71997608` | `nexi-api.service` active, PID 2894518 |
| Public | `6507cf16a8cd863048b12aa56b23fd43435695ec` | marker and `.next/BUILD_ID`: `3bb57e02ea921531975124ce2c827382a9f1ec6b` | `.next/standalone/server.js`: `6d8331d4544579eebe014f9f29b9cbc27f616aac49840462c04692b37885616f` | `nexi-public.service` active, PID 2896172 |
| Admin | `c74b3c02c948ceac2df92a76acc4f3c5c19c540d` | `NEXI_RELEASE_SHA`: `3bb57e02ea921531975124ce2c827382a9f1ec6b` | `server/index.mjs`: `7d80703d4fe254cdf903218567720661fc05cf175dba239dc973082caa80df7b` | `nexi-admin.service` active, PID 2896962 |

Builds used only the canonical outputs and their dedicated dependency stores. Backend used Node 24.21.0/npm 11.19.0 at `/srv/nexi/backend`; Public used its existing store at `/srv/nexi/public/current` and then prepared standalone assets; Admin used pnpm 12.14.0 from the committed `Admin/` checkout to `/srv/nexi/admin/current`. Release variables were aligned to the application release SHA without recording secret values.

- Current HTTPS checks: API `/ops/ready` 200; Public `/dashboard`, `/dashboard/wallet`, and `/api/market/prices` 200; Admin `/overview` and `/messages` 200. Admin root redirects (307) as expected.
- Free space after rollout: 3.4 GiB (94% used).
- Exact current-release rollback snapshots were retained and had been restore-tested with ownership/ACL/xattr comparison before release: Backend `rollback-backend-c74b3c02-to-3bb57e0-20261023.tar.gz`, SHA-256 `0600ea3f48a0154918f4e20daee3e22002501f78a7b5434f6ff4faaba602f307`; Public `rollback-public-6507cf16-to-3bb57e0-20261023.tar.gz`, SHA-256 `9a7263aa1e7034ed99a4fac5a48cd7259f3ff9334d051878348244a0daee92c8`; Admin `rollback-admin-c74b3c02-to-3bb57e0-20261023.tar.gz`, SHA-256 `4b576302fe2b4d025d36972eb0b730ae0d919b128b4246f6e19681dda620296d`.

## Browser and Sentry evidence

- Used the existing Chrome DevTools MCP session `@nexi-chrome-devtools`, connected to the local Chrome endpoint on port 5858. Existing Public and Admin tabs were kept; no profile/cookie reset occurred. Invoked `list_pages`, `navigate_page`, `take_snapshot`, `wait_for`, `click`, and `list_network_requests`.
- Public tab after reload remained on `/dashboard/wallet`. Network recorded `/auth/refresh` 201, `/auth/me` 200, `/wallet/overview` 200, `/wallet/activity` 200, Public navigation/routes/localization reads 200/304, and Socket.IO polling 200. The page snapshot showed the Wallet view and five account tabs. No account values were inspected, no signature prompt was approved, and no transaction was initiated. The authenticated API flow worked with the existing session; the earlier raw diagnostic fetch that bypassed the app interceptor remains distinct from the authenticated app request.
- Admin tab displayed the sign-in page after the intentional reload. Per the owner's standing instruction, the saved form was submitted with the Sign in control; the tab returned to an authenticated Super Admin session with Admin API connected and eight workspace links. `/announcements` rendered the TEST_ONLY acceptance announcement as `DRAFT`; no publish or other mutation was made. This is a bounded browser check, not full Admin visual acceptance.
- Sentry search for `release:3bb57e02ea921531975124ce2c827382a9f1ec6b` in project `nexi`, last 24 hours, returned no error events. Admin client/SSR/Nitro artifact bundles uploaded for this release. Some generated Admin scripts had no auto-detected source-map reference; complete source-map coverage is not claimed. The Public build did not emit a source-map upload receipt.

## Rollout warnings and recovery

- Backend stop exceeded the unit's 30-second stop timeout; systemd killed the old process after shutdown hooks logged their progress. The new PID started, readiness returned 200, and the service is stable. The timeout was not changed; graceful shutdown remains an operational follow-up.
- Public briefly returned 502 while its service was starting. The local runtime and subsequent HTTPS checks returned 200. Its build completed with warnings about optional `@react-native-async-storage/async-storage` and 27 traced files outside the configured tracing root; standalone preparation completed and the verified routes work. These warnings were retained for later review rather than hidden.
- An initial Admin build invocation from the repository root failed because that directory did not resolve `vite`. The previous Admin archive was restored and the service verified healthy. The canonical build was then run from `Admin/` and completed successfully; the new release is active.
- First HTTPS requests after Public/Admin starts also raced startup and returned 502; delayed fresh checks passed. No database migration, production content change, financial operation, balance mutation, wallet signature, or message send occurred during the rollout.

## Acceptance frontier for the next session

- `P2.1` — `SOURCE_IMPLEMENTED`, `TESTED`, `DEPLOYED`, and the existing-session app path is `BROWSER_VERIFIED` for refresh/auth/wallet reads. The full root cause of the earlier diagnostic 401 was not reproduced as a persistent session defect; do not claim this proves every provider/session edge case.
- `P1.1` — Admin mobile layout fix is deployed. Full post-release comparison against the approved visual reference remains open; desktop authenticated route evidence is bounded to Binary/Announcements.
- `P1.*` — Complete Admin workspace interaction/persistence, lower-role denial with an authorized identity, and selected eligible Binary-position inspection remain open/fixture-limited.
- `P2.*` — Complete Public routes and responsive/accessibility states, provider compatibility (EIP-1193/EIP-6963/Coinbase/WalletConnect), KYC/service flows, market freshness/reconnect, and read-only Wallet actions. Wallet signatures and financial writes remain owner-authorized actions.
- `P2.6` — The TEST_ONLY Learn category remains active because the current supported Admin/API path has no category-status mutation. Implement a reviewed endpoint/control in a later bounded source task, or obtain the distinct data-operation authorization; no direct database edit was made.
- `P3.2` — End-to-end Public/Admin Messages remains fixture/authority-limited: no controlled test conversation existed, so no customer conversation was created or messaged.
- `P5.*` — Preserve rollback archives and investigate the Backend graceful-stop timeout. Four owner-accepted economic gates remain `OWNER_ACCEPTED_UNTESTED`; no test or result status was promoted.
- Overall Public/Admin owner acceptance remains open. This checkpoint is a precise restart point, not completion of the full acceptance campaign.

## Post-release cache cleanup and final route check — 2026-10-23 15:28 UTC

- Removed only cache/output created by the release build: Public `/srv/nexi/public/current/.next/cache/webpack` (8 files, about 1,011 MiB) and `.next/cache/.tsbuildinfo` (803,938 bytes); Admin `/srv/nexi/admin/shared/node_modules/.nitro/vite/services/ssr` (117 generated files, about 2.9 MiB) and its `last-build.json`.
- Kept the deployed Backend `dist`, Public `.next` artifact, Admin `current` runtime and `.nitro/nitro.json`, all dependency packages/stores, Admin's older `.nitro` cache content, Public's older SWC cache, rollback archives, and unrelated `/tmp` session/evidence files. Public `.next/cache` remains about 24 KiB.
- After cleanup, all three services were active; release markers and Public build ID still matched `3bb57e02ea921531975124ce2c827382a9f1ec6b`; API readiness, Public dashboard/wallet, and Admin Overview/Messages returned HTTP 200. Free space measured 4,676,288,512 bytes.
- Before publishing this follow-up, `git fetch origin main` found no divergence: `origin/main` was `8084d860d9672c4de5c3bdbee2b96513db4b2b14`, with ten local commits ahead. The user authorized pushing this reviewed checkpoint.
