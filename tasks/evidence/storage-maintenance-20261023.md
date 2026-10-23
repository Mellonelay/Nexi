# Worker-0 storage maintenance receipt — 2026-10-23

## Scope

The owner requested a quick, evidence-led cleanup using the attached prior-day snapshot, especially duplicate dependencies, caches, and unnecessary archives. This receipt records the bounded cleanup and what was intentionally retained. No source dependencies, lockfiles, live build artifacts, application data, SQLite files, or services were changed.

Snapshot: `/home/mellonelay1999/.codex/attachments/d06f98b8-c603-4d32-ba49-9ae247ffa4af/Disk-space -export.json` (`gdu v5.37.0`, collected 2026-10-22 15:38:47 UTC; 1,318,782 entries). The snapshot was treated as a lead list, not current filesystem truth: several snapshot paths had already disappeared by the live check.

## Cleanup performed

| Path | Before | Action | Post-check |
|---|---:|---|---|
| `/srv/nexi/public/current/.next/cache/webpack` | 1,043,682,946 bytes | Removed only this regenerable Next.js Webpack build cache directory. `.next` output, `BUILD_ID`, and all other `.next` contents were preserved. | Directory absent; Public dashboard still returned HTTP 200 and `BUILD_ID` remained `6507cf16a8cd863048b12aa56b23fd43435695ec`. |
| `/home/mellonelay1999/.npm/_cacache` | About 177 MB | Ran `npm cache clean --force`; this package download cache was removed. | `_cacache` absent; `_npx` tool package cache preserved (91 MB). |
| `/var/cache/apt/archives` | Download cache | Ran `sudo -n apt-get clean`; only APT package archives were cleared. | 48 KB remains. |

The root filesystem reached 0 available bytes during the cleanup window. The first post-cleanup measurement was 54,704,824,320 bytes total, 51,010,740,224 used, and 1,343,414,272 available (98% used). At final closeout it measured 54,704,824,320 total, 50,411,823,104 used, and 1,942,331,392 available (97% used; about 1.81 GiB). The additional free space appeared between checks; its cause is not attributed to a specific cleanup. Because cache removal and live filesystem writes overlapped, no single net-reclaimed figure is inferred from beginning/end `df` values.

## Dependency stores and duplicate candidates

The three production stores remain separate and correctly linked:

| Consumer | Canonical store | Measured size |
|---|---|---:|
| Backend runtime `/srv/nexi/backend/node_modules` | `/srv/nexi/backend/shared/node_modules` | 664 MB |
| Public source `frontend/node_modules` | `/srv/nexi/public/shared/node_modules` | 1.8 GB |
| Admin source `Admin/node_modules` | `/srv/nexi/admin/shared/node_modules` | 935 MB |

The checkout-only `backend/node_modules` is a separate 726 MB Node 22 dependency tree. It was retained because source tests run with Node `22.23.2` (ABI 127), while the backend service uses Node `24.21.0` (ABI 137). The native `better-sqlite3` smoke had already shown that loading across these ABIs fails; replacing this tree with a symlink to the runtime store would break the source-side native module. Manifests and lockfiles match the runtime dependency versions, but that does not make the native module ABI-compatible.

The previous-day snapshot also listed generated/source-tree dependency or build paths that no longer existed at inspection time; they were not recreated or cleaned again. A fresh `/tmp/ipbl-audit-20261023/repo` checkout was present with a clean feature branch and freshly installed 563 MB `node_modules`, and no active process referenced it. It was retained because it is a separate project checkout with its own branch/evidence, and current task ownership does not establish that it is disposable. No NEXI app dependency store was merged or removed.

## Retained caches, archives, and application data

- Admin and Backend rollback archives remain in their canonical rollback stores until owner acceptance; both passed restoration rehearsal (checksums are in [`admin-integrated-release-history-20261023.md`](admin-integrated-release-history-20261023.md)).
- Promoted SQLite, WAL/SHM, financial/migration backups, and logs/evidence were preserved.
- `/tmp/nexi-admin-devtools-20261021-01` (445 MB) and `/tmp/nexi-chrome-cdp.Tc0OcQ` (157 MB) were preserved as browser profiles/session state.
- `/tmp/fastembed_cache` (109 MB) was preserved for Graphify's active embedding tooling; `/tmp/fallow-audit-base-cache-*` (34 MB) was preserved because a Fallow review process was live.
- `/tmp/node-compile-cache` (85 MB), `/tmp/jest_rs` (56 MB), pnpm/Corepack/uv caches, and `~/.npm/_npx` (91 MB) were retained as regenerable developer/build/tooling caches. This pass did not purge broad `/tmp` contents or tool caches while their precise active ownership was not established.
- Snapshot-only `/srv/current`, `/srv/.next`, `/srv/trace-build`, `/srv/nexi/node_modules`, `/srv/nexi/node_modules.pnpm-preserved`, and workspace-root `node_modules` candidates were absent in the live tree, so no action was needed.

## Service and source integrity checks

- `nexi-api.service`, `nexi-public.service`, and `nexi-admin.service` were active after cleanup; none was restarted.
- Backend and Admin release markers remain `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`; Public `BUILD_ID` remains `6507cf16a8cd863048b12aa56b23fd43435695ec`.
- HTTPS `https://www.nexitrading.app/dashboard` returned HTTP 200 after deleting the Webpack cache.
- Source checkout was clean before documentation updates at `0939c1b7c264b0218250418ed3dc2d8b007948da`; no application source or lockfile was changed by this maintenance.

## Result and limits

This bounded pass freed enough space to restore roughly 1.25 GiB available on the 51 GiB root volume while removing the largest confirmed disposable production build cache and package download cache. No service interruption or data mutation was observed. A broad archive purge, live dependency replacement, full temporary-directory cleanup, storage-capacity redesign, and independent database backup/restore test were not part of this pass. The latest filesystem value is a point-in-time measurement and can change as builds, logs, or active sessions write data.

## Targeted cleanup pass — 2026-10-23

The owner then authorized removing the unused Waggle installation and old NEXI build/cache artifacts. Before deletion, the root filesystem reported 54,704,824,320 bytes total, 50,532,814,848 used, and 1,821,339,648 available. The GDU v5.37.0 export counted 1,212,172 entries. The scan attributed 2,409,013,248 allocated bytes to the ignored repository-root `node_modules`; the root project had no app `src` or `index.html`, no active Vite/Next/Nest build process referenced the tree, and Public/Admin source dependencies already resolve to their canonical shared stores. The tracked root manifests and lockfile were retained.

| Path | Measured before removal | Action |
|---|---:|---|
| `/home/mellonelay1999/.local/share/uv/tools/waggle-mcp` | 1,428,557,824 allocated bytes | `uv tool uninstall waggle-mcp`; both `waggle` and `waggle-mcp` executables disappeared. No separate Waggle data/config path was found in the inspected user config/data directories. |
| Repository-root `node_modules` | 2,409,013,248 allocated bytes | Removed the ignored, noncanonical root install. Kept `package.json` and `package-lock.json`; the install can be reconstructed if a root-only workflow later requires it. |
| `frontend/.next` | 36,864 allocated bytes | Removed source-tree build residue; canonical Public output `/srv/nexi/public/current/.next` was preserved. |
| `backend/dist` | 4,915,200 allocated bytes | Removed source-tree build output; canonical Backend output `/srv/nexi/backend/dist` was preserved. |
| `Admin/.output` | Absent | No action. |
| `/tmp/node-compile-cache` | 89,063,424 bytes | Removed after checking for active process references. |
| `/tmp/jest_rs` | 58,368,000 bytes | Removed after checking for active process references. |
| `/tmp/fallow-audit-base-cache-abe37fc83e905be0-root-abe37fc83e905be0` | 35,512,320 bytes | Removed after checking for active process references. |
| `/tmp/nexi-admin-review.GplWjj` | 1,380,352 bytes | Removed obsolete temporary Admin review output after checking for active process references. |
| `/tmp/nexi-storage-20261023.json` | 94,543,872 bytes | Removed the root-owned temporary full-tree export after extracting the summary evidence. |

Across this pass, `df` free space rose to 6,008,401,920 bytes (89% used). The measured increase is about 4.19 GB; it is a before/after filesystem delta, not a per-file reclamation guarantee because ordinary filesystem writes continued. No full rescan was run after deletion.

### Preservation and verification

- `uv tool list` no longer lists Waggle, and neither Waggle executable resolves. The uv shared cache is only 36 KB; no broad `uv cache clean` was run.
- Source `frontend/node_modules`, `Admin/node_modules`, and runtime `/srv/nexi/backend/node_modules` still resolve respectively to `/srv/nexi/public/shared/node_modules`, `/srv/nexi/admin/shared/node_modules`, and `/srv/nexi/backend/shared/node_modules`.
- Canonical release markers remain Backend/Admin `c74b3c02c948ceac2df92a76acc4f3c5c19c540d` and Public `6507cf16a8cd863048b12aa56b23fd43435695ec`. All three systemd services were active after cleanup; no service restart, build, test, deployment, or database operation occurred.
- Promoted SQLite/WAL/SHM, financial and migration backups, production outputs, app-specific dependency stores, active browser profiles, Graphify's `/tmp/fastembed_cache`, active RDC cache, and Backend/Admin rollback archives were retained.
- `uv cache prune` was not run because its cache was only 36 KB and shared by other tools. Other global Node installs, Codex release binaries, package stores, rollback trees, system logs, and unidentified temporary paths were not treated as disposable merely because they were large.

Skills actually read/applied for this pass: NEXI Work Kernel, Capability Router, Agent Skills `using-agent-skills` and `incremental-implementation`, Ponytail, and `nexi-workspace-memory`. Tool evidence: `gdu v5.37.0`, `uv 0.12.10`, `uv tool uninstall`, filtered `/proc` process-reference checks, canonical path/symlink checks, systemd active-state checks, and `df -B1 /`. Official uv documentation confirmed `uv tool uninstall` removes the installed tool environment and `uv cache prune` removes unused shared cache entries; the latter was not needed here.
