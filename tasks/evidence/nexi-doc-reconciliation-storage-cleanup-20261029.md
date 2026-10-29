# NEXI Documentation Reconciliation and Storage Cleanup — 2026-10-29

## Scope and authority

This receipt records the owner's corrected follow-up scope: reconcile current NEXI documentation and remove verified stale temporary/cache data. The owner did not request browser acceptance in this follow-up. No source implementation, dependency install, build, service stop/restart, deployment, migration, financial operation, or test campaign was performed.

Canonical checkout was `main` at `c14b71d7504469ecadda8c34744752a7b0517c83`, matching `origin/main`, with a clean tree before these documentation changes. The repository is now intentionally dirty with documentation/evidence edits only.

## Cleanup performed and observed capacity

The cleanup removed individually identified temporary or regenerable items:

- Three dated `/tmp/fallow-audit-base-cache-*` cache directories (about 36.8 MiB combined, based on the recorded pre-removal `du` result).
- `/tmp/node-compile-cache`, `/tmp/v8-compile-cache-1000`, and stale pip build/install temporary directories.
- A stale Codex plugin marketplace staging clone and old marketplace snapshots; the current coordinator staging area was retained.
- APT package archives via `apt-get clean`.

The earlier recorded free-space reading was `2.1 GiB`; an intermediate `df -h /` sample rounded to `2.4G`. The latest `df -Pk /` read is 2,409,308 KiB (2.2977 GiB, approximately 2.30 GiB; `df -h /` rounds it to `2.3G`). The owner’s `5 GiB` target is **not met**. Individual before/after sizes for every removed temporary item were not retained, so these observations are not an itemized reclaimed-byte total.

## Retained data and remaining limit

The scan found larger active or authoritative data that cannot be classified as disposable cache by size alone: the active authenticated Chrome profile, another browser test profile with cookies/history, Codex session history and application-server files, canonical npm/pnpm/application dependency stores, active Graphify/Evolver tooling, release and rollback evidence, system logs, and the promoted VPS SQLite/financial database. These were retained. No rollback artifact was inspected, replaced, or deleted. `ROLLBACK_PREPARATION = OWNER_DEFERRED` remains as recorded.

No additional verified, non-sensitive cache large enough to close the remaining approximately 2.7 GiB gap was identified. Reaching 5 GiB would require a separate, path-specific retention decision for one or more of the retained user/session/tool/runtime datasets; deleting them merely by size would risk loss of sign-in state, recoverable work, release proof, or live application data.

## Documentation reconciliation

- Older release/browser records retain their original `2.1 GiB` measurement as a time-specific observation; an intermediate post-cleanup sample rounded to `2.4G`, and the latest exact reading is recorded above.
- Older “browser acceptance is next” rows and frontiers are preserved as historical evidence. They do not supersede the current owner-directed documentation/storage-only scope.
- `docs/operations/NEXI_CAPABILITY_ROUTING.md` contained a stale statement that live SQLite was empty while D1 remained populated. A dated supersession note now reconciles this with the current Prisma/SQLite financial authority.
- Detailed API and Graphify findings are in `nexi-cross-surface-contract-reconciliation-20261029.md`. The Graphify Q&A was saved to the local graph memory directory, but that new memory file has not been incorporated into the checked graph JSON.

## Verification boundary

Observed: `df -Pk /`; Git identity/status before documentation edits; inspected candidate cache paths before removal; read-only current source/document/Graphify analysis. Not rechecked here: systemd state, deployed release markers, public endpoints, Sentry issue access, or authenticated browser state. Existing release and partial browser receipts are reused without upgrading their proof classification.
