# NEXI final VM consolidation — 2026-10-25

## Outcome

Authorized runtime restoration is complete. The three production services are active on the pinned Node.js 24.21.0 runtime. Existing artifacts and independent dependency stores were reused. No application build, package installation, migration, SQLite write, financial action, or data deletion occurred in this campaign. Source checkout HEAD remained `e356a00885da9517fe8c32df12dde3e6a3e49688`; the existing deployed artifact marker remains `ace72accfe815abf5ba20df26ee57c76898d0cab`. They identify different things and are not claimed equal.

## Runtime and artifact proof

- Pinned runtime: `/opt/nexi/runtime/node-v24.21.0/bin/node` reports v24.21.0; its npm reports 11.19.0. The required Corepack `pnpm@12.14.0` resolves to 12.14.0.
- Backend unit executes the pinned Node with `/srv/nexi/backend/dist/src/main.js`.
- Public unit executes pinned npm `start` with Node 24 first on `PATH`; its child process resolves the pinned Node. Existing Public working directory and `/etc/nexi/public.env` remain configured.
- Admin unit executes pinned Node with `/srv/nexi/admin/current/server/index.mjs`. Existing Admin working directory and environment file remain configured.
- Unit files passed `systemd-analyze verify`; systemd was daemon-reloaded. Pre-change copies are `/etc/systemd/system/nexi-public.service.pre-node24-20261025` and `/etc/systemd/system/nexi-admin.service.pre-node24-20261025`.
- At final check, all three services were `active`, `NRestarts=0`, and their `MainPID` executable paths resolved to the pinned Node binary. Backend PID 3333918, Public PID 3334254, Admin PID 3334255 were observed in the last status sample.
- Existing canonical artifacts were present: Backend `dist/src/main.js`; Public `.next/BUILD_ID` = `ace72accfe815abf5ba20df26ee57c76898d0cab`; Admin `server/index.mjs`. No alternate output was created.
- Dependency stores remain separate: `/srv/nexi/backend/shared/node_modules`, `/srv/nexi/public/shared/node_modules`, `/srv/nexi/admin/shared/node_modules`, with each app workspace linked to its own store. Required Nest, Prisma, Next, and TanStack packages resolved from their expected stores.
- `https://api.nexitrading.app/readyz` returned HTTP 200 with `READY`, SQLite true, Redis true. `https://www.nexitrading.app/dashboard` returned 200. Admin `/` redirected to `/overview`, which returned 200. The bare apex `nexitrading.app` probe failed DNS resolution; `www` is the configured Public hostname and passed.
- Existing Chrome DevTools observations showed Public `/auth/me`, `/wallet/overview`, `/wallet/activity`, Socket.IO and config requests reaching the canonical API with 200 responses. Admin Messages reached protected API routes but received 401 in the observed browser session; authenticated Admin operation is not proved by this check.
- Initial API readiness briefly returned 502 during Nest startup; it settled to READY after initialization. The services then remained active without restarts. Do not infer authenticated product acceptance from readiness or route status.

## Protected storage and runtime candidates

No candidate was removed. At final disk check `/` had 4,951,826,432 bytes available (91% used); this campaign reclaimed zero bytes.

| Candidate | Prior measured size | Decision |
|---|---:|---|
| `~/.cache/rdc-npx-upgrade/_npx` | 255 MB | Preserve: active Desktop Commander executable resolves inside it. |
| `~/.npm/_npx` | 250 MB | Preserve: active Context7 and BrowserStack MCP processes resolve inside it. |
| `~/.cache/node/corepack` | 120 MB | Preserve: pinned Corepack/pnpm runtime is required and was verified. |
| `~/.cache/pnpm/v12` | 263 MB | Preserve: no complete consumer/ownership proof that makes this cache safely removable. |
| `/srv/nexi/backend/rollback` | 193 MB | Preserve as production recovery material. |

`/usr/bin/node` and `/usr/local/bin/node` are Node 18.20.4 and have active process consumers; they were not removed. No separate Node 22 installation was found in the common runtime locations inspected. No claim is made about uninspected paths. Retired service files were not activated or deleted.

## Engineering correctness and capability evidence

The user-requested knowledge-first sequence was applied to the remaining infrastructure/documentation work: installed versions and official service contracts were checked, the expected service commands and preserved environment were compared with effective units, confirmed runtime gaps were corrected, and only focused runtime/configuration proof was performed.

| Capability | Invoked result and boundary |
|---|---|
| NEXI Work Kernel / Capability Router | Routed this as bounded infrastructure consolidation, runtime verification, evidence reconciliation, and documentation closure; one semantic writer remained primary. |
| `using-agent-skills` | Read its discovery/lifecycle instructions; selected and applied only task-fit methods below. |
| Vibe Coding `infra-ops-polish` workflow | Retrieved and followed the ordered implement → incident recovery check → patch check workflow. |
| Vibe Coding `incident-recovery-check` and `patch-checking` | Read the specific workflows and applied their restart stability, before/after state, and narrow-diff checks. |
| Graphify | Queried the existing graph before source browsing; remote file-neighbor mappings for Public Messages, Admin Messages, Backend CommunicationsController, and EventOutboxService were pinned to source SHA `e356a00885da9517fe8c32df12dde3e6a3e49688`. This establishes structural edges only, not runtime or business correctness. A separate requested path query returned no path and was not treated as proof. |
| VibeDoctor | Queried project, status, graph, source trace, and a sanitized two-unit check. Unit check result was score 100 / safe / no findings for two files only. Project scan was dated 2026-10-25 14:47 UTC and had no source commit SHA, so it is not treated as a current-source verdict. Its reported TanStack 1.168.26 and seroval 1.5.4 versions differ from current Admin lock versions 1.169.1 and 1.6.9; Public lock confirms Sentry 10.73.0. No dependency change was made. Graph trace's route/finding counts are not considered reliable source proof. |
| Semgrep 1.176.1 | Added `semgrep/nexi-architecture.yml` with one explicit rule against direct Prisma/SQLite imports from Public/Admin source. Direct scan of `frontend/app` and `Admin/src` passed with no findings; a negative fixture produced the expected finding. `semgrep --test` itself crashed with `IndexError: tuple index out of range`, so the rule runner is not claimed passed. |
| Existing OpenAPI contract test | Reused the recorded focused `frontend/tests/communications-contract.test.mjs` result because the related source and OpenAPI contract were unchanged. No OpenAPI generation was run because its script creates a temporary SQLite preview DB, outside the authorized proof scope. |
| CodeQL eligibility | `Mellonelay/Nexi` is a private personal-account repository; no local CodeQL CLI or workflow is configured. GitHub's hosted private-repository prerequisite is an eligible organization plan with Code Security enabled, so no hosted CodeQL claim is made. [GitHub eligibility documentation](https://docs.github.com/en/code-security/reference/code-scanning/troubleshoot-analysis-errors/private-repository-enablement). |

Screenshot-derived defect classes were mapped to distinct evidence: route/OpenAPI comparison for nonexistent endpoints; explicit authorization rules plus source review for missing guards; transaction ownership plus persistence proof for Outbox atomicity; state-contract assertions for reversed transitions and empty UI state; normalization contracts for SQLite booleans; framework lifecycle checks for Socket.IO; and executable reconnect/readiness observation for recovery/startup behavior. Static scanning and Graphify do not prove these behaviors on their own.

## Evidence and storage inventory classification

The read-only basename reference pass found 79 tracked receipts under `tasks/evidence`: 61 are referenced by tracked documentation, and 18 are unreferenced by basename. This heuristic can miss indirect references, so no unreferenced file is considered deletable solely from this result.

- `CURRENT_ACTIVE_PROOF`: this receipt for the bounded 2026-10-25 service/runtime restoration.
- `REFERENCED_HISTORICAL_PROOF`: the 61 receipts referenced by tracked documentation. Preserve as historical evidence.
- `SUPERSEDED_BUT_REFERENCED`: none newly removed or independently reclassified; preserve any artifact already marked superseded in place.
- `SUPERSEDED_UNREFERENCED`: none proven safe to delete.
- `GENERATED_RECREATABLE`: none proven safe to delete; JSON/log format alone is insufficient evidence of regeneration authority.
- `UNKNOWN_OWNER`: the following 18 unreferenced receipts remain preserved pending owner/source-of-generation confirmation:

  - `admin-integration-release-readiness-20261022.md`
  - `authenticated-financial-acceptance-frontier-20261018.md`
  - `checkpoint-1149.json`
  - `four-lifecycle-authenticated-http-20261019.json`
  - `kv-current-inventory.json`
  - `local-table-inventory.json`
  - `margin-close-guard-local-sqlite-20261018.md`
  - `migration-fallow-measured-review.json`
  - `migration-fallow-review.json`
  - `migration-measured-coverage.json`
  - `nexi-mindmap-v3-reference-20261023.md`
  - `nexi-release-manifest-bdb2400-20261023.md`
  - `nexi-successor-execution-roadmap-20261023.md`
  - `nexi-successor-proof-frontier-20261023.md`
  - `rdc-runtime-reconciliation-20261018.md`
  - `source-schema-raw.json`
  - `sqlite-internal-sequence-reconciliation.json`
  - `valkey-stage-runtime.json`

This campaign did not delete evidence, cache candidates, rollback artifacts, databases, or application data.

## Git and limits

At campaign start the application-source checkpoint was `e356a00885da9517fe8c32df12dde3e6a3e49688` on `main`; no application code or deployed artifact was changed. Owner-preexisting dirty documents and instructions remain present. This receipt and the Semgrep rule/fixture were created during this campaign; overlapping dirty files were not discarded. Only those three campaign-owned files are staged for the local documentation/static-rule commit. No push, application build, migration, dependency installation, or application deployment was performed.

The bare apex DNS probe was not resolved as it is outside the canonical Public hostname verified here. Admin authenticated Messages and Sentry issue enumeration remain unverified (the observed Admin API response was 401; Sentry issue listing access was previously 403). These do not negate service process or public route restoration.
