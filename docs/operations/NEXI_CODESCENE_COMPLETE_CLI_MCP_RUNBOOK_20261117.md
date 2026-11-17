# NEXI — CodeScene CLI, MCP and Change-Risk Operations Runbook

**Date:** 2026-11-17. **Scope:** NEXI Backend, Public and Admin. **Status:** operational reference, not an acceptance certificate.
**Authority:** current owner decisions > live repository / all four `AGENTS.md` files > current source and proof > verified installed tool schemas > official CodeScene docs > dated reports.
**Source closure:** `SOURCE_CLOSED` was recorded at `a71270f77c842db3c96e47f985836b4686e718c7`, with `ce8de785dcb0` a subsequent documentation-only commit. This authorizes bounded post-source review only; it does not establish tested/deployed/browser-accepted behavior. The old November 6 deployed services must not be mistaken for this source.

## 1. Exact installed routes and security

- CodeScene CLI: `/home/mellonelay1999/.local/bin/cs` (observed **1.0.58**, 2026-11-17), run under the checkout owner `mellonelay1999` with its existing OAuth credential. Do **not** use bare `cs` under a root/agent shell whose HOME/PATH is different.
- Local MCP: `/usr/local/bin/nexi-mcpc @nexi-codescene`, installed server reported **28 tools**. `tools-list` discovers; `tools-get NAME` supplies authoritative signatures; `tools-call NAME ...` executes. `tools-list --full` is expensive; use on demand.
- Source repository: `/home/mellonelay1999/workspaces/Nexi`. Protect existing 184 untracked recovery/evidence assets and all financial/runtime state. Check `git rev-parse HEAD` and `git status --porcelain` first.
- Credentials: never run `cs auth status --output-format json` into a report/log: it **can expose a refresh token**. For auth readiness rely on MCP `verify_installation` or redact credential fields before returning output. Never print or paste tokens. Use `cs auth login --no-browser` only if live verification proves login is required.
- NEXI Source Graph: `graphify-out/graph.json` / `@nexi-graphify-live` locates producer/consumer dependencies; separate `@nexi-knowledge` holds reference rules. CodeScene's Git/health hotspot findings never replace source owner or Ledger proof.

## 2. Evidence intent and gate

**Question → one tool → actionable source finding → affected-owner inspection → disposition.**
- `Fallow`: import/export reachability, duplicate candidates, dependency/architecture constraints, framework entrypoint discovery. Its finding is **not deletion permission**.
- `CodeScene`: change-related Code Health degradation, file-level readability/complexity and hotspots weighted by actual development activity. A 1.21 score is not proof of a functional defect or automatic reason to refactor a financial service before release.
- `NestJS Doctor` and `React Doctor`: versioned framework-specific warnings/errors, with their exact checked scope. Run once for relevant scope; distinguish warnings from errors.
- `Sentry`: runtime/release telemetry. Its CLI and remote OAuth MCP sessions are separate. No invented deployment readiness from scanner results.
- Apply narrow fixes only to **demonstrated** correctness/security/integration defects, or owner-directed refactoring; avoid broad auto-fix, mass dead-code removal, entire financial-service rewrites and new framework scaffolding.
- No deployment, financial mutations, migrations, retrying durable jobs or browser acceptance as a side effect of diagnostics. Build and application runtime acceptance are separately controlled.

## 3. Quick preflight (read only)

```bash
cd /home/mellonelay1999/workspaces/Nexi
git rev-parse HEAD; git status --short
sudo -u mellonelay1999 -H /home/mellonelay1999/.local/bin/cs version
sudo -u mellonelay1999 -H /usr/local/bin/nexi-mcpc @nexi-codescene tools-list
sudo -u mellonelay1999 -H /usr/local/bin/nexi-mcpc @nexi-codescene tools-get verify_installation
sudo -u mellonelay1999 -H /usr/local/bin/nexi-mcpc @nexi-codescene tools-call verify_installation '{"git_repository_path":"/home/mellonelay1999/workspaces/Nexi"}'
```
Use `tools-get` on each selected MCP operation to verify live schema. Installation success means plumbing works, **not** that project health is acceptable or CodeScene Cloud project analysis is current.

## 4. CLI command map (official)

| CLI | Use | Read-only interpretation |
|---|---|---|
| `cs version` | installed binary fingerprint | Version only |
| `cs auth status` | OAuth readiness | Do **not** print raw JSON/token |
| `cs delta BASE CURRENT` | commit-to-commit change health; `--file` restricts | Set exact base revision; report checked-file count and gates; no matching changes ≠ pass |
| `cs delta --staged` | staged diff precommit | Zero staged files means zero scope |
| `cs delta BASE CURRENT --output-format json --include-metadata` | bounded machine summary | JSON reports only new issues; inspect metadata |
| `cs review FILE` / `cs review --file-list list.txt` | detailed Code Health of existing files | Use JSON/JSONL for bounded batch |
| `cs check FILE` / `--file-list` | lint-style file issues | Not equivalent to compiler/test |
| `cs check-rules FILE` | effective file-level custom rules | Read only |
| `cs rules-config validate` / `list-thresholds --language JavaScript --format json` | inspect rule configuration | **Do not** call set-rule/set-threshold without owner-approved policy change |
| `cs docs TOPIC` | local help on `git-hooks`, `code-health-rules`, etc. | Reference |
| `cs auth login --no-browser` | only when auth genuinely missing | Interactive OAuth; never export credential |

Example from the checkout, for a historically changed file:
```bash
sudo -u mellonelay1999 -H /home/mellonelay1999/.local/bin/cs review backend/src/admin/admin.service.ts
sudo -u mellonelay1999 -H /home/mellonelay1999/.local/bin/cs delta 7a5aa7f ce8de785 --output-format json --include-metadata
```
CAUTION: the latter has potentially large scope, so use a bounded timeout and metadata. It may take longer than an MCP round trip; record timeout as incomplete, not a quality pass.

## 5. Complete installed CodeScene MCP inventory (28)

**Local source/change (safe read operations):**
- `verify_installation(git_repository_path)`: Git, auth, API, CLI and MCP preflight.
- `analyze_change_set(base_ref,git_repository_path)`: compare current HEAD to a real base; gates + file-count metadata; do not substitute `main` when HEAD is main.
- `pre_commit_code_health_safeguard(git_repository_path)`: staged/working safeguards, only meaningful with actual changes.
- `code_health_review(file_path)`: detailed score and code smells for one file.
- `code_health_score(file_path)`: score-only; use review when diagnosis needed.
- `code_health_refactoring_business_case(file_path,target_code_health?)`: optional prioritization, not financial correctness.
- `explain_code_health(context?)`, `explain_code_health_productivity(context?)`: explanatory references.
- `rules_config_validate(config_path?)`, `rules_config_list_thresholds(language,config_path?)`: read-only policy inspection.

**Project / Cloud intelligence (only if the NEXI CodeScene project is discoverable and current):**
- `select_project()`, `get_config(key?)`: identify configured project/account.
- `list_technical_debt_hotspots_for_project(project_id)` and `..._for_project_file(file_path,project_id)`: latest analyzed hotspots, severity + revision frequency; stale Cloud analysis ≠ current HEAD.
- `list_technical_debt_goals_for_project(project_id)` and `..._for_project_file(file_path,project_id)`: prior debt goals; do not mutate goal configuration.
- `code_ownership_for_path(path,project_id)`: human knowledge concentration; not proof of Git file ownership.
- `show_mcp_usage_overview()`: official tool selection guidance.

**Session/skill/config, with side effects to avoid during quality review:**
- `list_skills()`, `get_skill_manifest(skill_name)`: inspect only.
- `download_skill(destination_dir,skill_name,overwrite?)`, `sync_skills(destination_dir,overwrite?)`: write files, never routine review.
- `login()`, `logout()`, `switch_account(account_id?,name?)`, `set_config(key,value)`: mutate auth/session/config.
- `rules_config_set_rule(...)`, `rules_config_set_threshold(...)`: change quality policy; forbidden without explicit approval.

All MCP names/signatures here match the 2026-11-17 tool listing; `tools-get` controls if changed. Cloud reports like `refactoring-targets`, `architectural-hotspots`, `change-coupling`, `key-person-risk` and `mcp-safeguard-insights` are **early-access server-dependent prompts**, not automatically among these 28 installed tools. Do not fabricate invocation.

## 6. NEXI bounded review recipe

1. **Scope:** Verify HEAD, deployed SHA (separate), four AGENTS, changed source base and prior Nov17 diagnosis. Reuse prior unchanged, version-matched Fallow/Nest/React diagnostics. Do not use the 113 acceptance cases as static defect backlog.
2. **CLI + MCP:** Run CodeScene installation review; resolve `select_project` if supported. Use real source-diff baseline and `analyze_change_set`, plus targeted `code_health_review` across Backend Admin audit, Admin provider and Public wallet chart/auth controls. Avoid full no-scope `HEAD..HEAD` passes.
3. **Project context if available:** Evaluate hotspots and goals once; prioritize a real actively changed red hotspot over a stable red file. If no project is configured, report project trend/ownership/forecast unavailable; use local CLI instead.
4. **Fallow MCP:** Use configured three-surface boundaries and exact `check_changed`, `trace_file`, `find_dupes`, `audit` or `guard` relevant to a CodeScene risk; inspect the structural source owner before any removal.
5. **Specialists:** Reconcile meaningful NestJS Doctor correctness warnings, React Doctor warnings and CodeScene finding against current source/accepted design/financial safety; do not overfit aesthetic metrics.
6. **Disposition:** `PROVEN_CORRECTNESS_GAP` → smallest owner+consumer repair and affected recheck; `ADVISORY_MAINTAINABILITY` → document/defer unless owner approves; `FALSE_POSITIVE_OR_FRAMEWORK_ENTRY` → retain; `INSUFFICIENT_EVIDENCE` → narrow missing proof. Preserve old correct source, no unapproved financial modification.
7. **Sentry before deployment:** check CLI credentials **without exposing token**; check MCP OAuth separately; match each surface build-time/runtime Sentry release to its actually built Git SHA. Debug-ID presence != remote sourcemap upload != event symbolication. Stop on missing required release-scoped auth.
8. **Release boundary:** Review final tracked diff, artifacts, financial one-writer invariants and controlled canonical builds only after approved diagnostics and owner release authority. **Backend**: `/srv/nexi/backend`, build once there; **Public**: `/srv/nexi/public/current`, Webpack Next build + standalone-assets; **Admin**: source `Admin/`, build into `/srv/nexi/admin/current` with pinned pnpm and Sentry wrapper. Never build in source checkout, wipe dependency symlinks or use parallel builds.

## 7. Evidence receipt schema

`TASK | HEAD | BASE | TOOL+VERSION/SESSION | COMMAND/ARGS (redacted) | CHANGED FILES | SCOPE/CHECKED COUNT | EXIT/TIMEOUT | FINDINGS | SOURCE OWNER/CONSUMERS | DISPOSITION | PROOF CLASS | REMAINING RELEASE GATE`.

Use `SOURCE_REVIEWED`, `STATICALLY_ANALYZED`, `TESTED`, `BUILT`, `DEPLOYED`, `RUNTIME_VERIFIED`, `BROWSER_ACCEPTED` separately. CodeScene analysis alone never authorizes application restarts, migrations, retries or financial effects.

## 8. Official CodeScene reference set

- https://codescene.io/docs/ai-assistant/reports.html — early-access project insight reports
- https://codescene.io/docs/guides/index.html — focus-area taxonomy
- https://codescene.io/docs/guides/technical/prioritize-technical-debt.html — activity × health prioritization
- https://codescene.io/docs/guides/technical/hotspots.html — technical debt friction/hotspot map
- https://codescene.io/docs/guides/technical/code-health.html — health categories and trend meaning
- https://codescene.io/docs/guides/technical/augmented-analysis.html — goals/supervise/critical classification
- https://codescene.io/docs/guides/technical/change-coupling.html — co-change history, not static call graph
- https://codescene.io/docs/guides/technical/complexity-trends.html — evolution and complexity
- https://codescene.io/docs/guides/technical/xray.html — function-level hotspots
- https://codescene.io/docs/cli/command-reference.html — exact CLI syntax

**Adjacent NEXI refs:** `docs/operations/NEXI_FALLOW_COMPLETE_CLI_ANALYSIS_MCP_RUNBOOK_20261116.md`; `docs/operations/NEXI_GRAPHIFY_CLOUD_CLI_MCPC_RUNBOOK_20261116.md`; `docs/operations/NEXI_SENTRY_OBSERVABILITY.md`; `docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md`; root/Backend/Public/Admin `AGENTS.md`.

## 9. Applied 2026-11-17 bounded campaign receipt (source SHA `ce8de785dcb0c252720457a7bae53b9afd989eb4`)

**CodeScene:** Local CLI v1.0.58, MCP v1.5.20; `verify_installation` 6/6 PASS including OAuth, API and CLI. Project is configured as ID 84341. Its latest Cloud analysis reports three hotspots: financial command gateway (Code Health 1.34, 47 revisions), Admin API provider (5.66, 31 revisions) and Backend Admin service (2.58, 21 revisions). Cloud scores describe that analysis snapshot and differ from the live local source assessment. Project goal list was empty. Targeted MCP `code_health_review` on current source: Backend Admin service 1.21, Admin API provider 4.39, Public WalletConnectControl 7.52. The unbounded `analyze_change_set` MCP call comparing `7a5aa7f` against current HEAD **timed out at 110 seconds**; never classify it as PASS or FAIL. The official `cs delta` CLI restricted to three actual changed files **completed** with metadata status `issues-found`, 3 modified/eligible/checked files. Admin service decreased from 1.57 to 1.21 due to several complex/nested methods; Admin provider stayed 4.39; Public WalletConnectControl stayed 7.52 with a marginal complexity/line increase. These are source maintainability findings; no functional defect was established by score alone.

**Fallow:** `@nexi-fallow` MCP `check_changed` and production `audit` against `7a5aa7f` executed. Reported Fallow engine version **3.30.0** (do not conflate with old CLI/other receipts stating 3.42.0). Audit covered 351 changed files; default `new-only` verdict **FAIL** with 28 *inherited* dead-code candidates (5 exports and 23 Admin provider class methods; 0 newly introduced), 266 complexity findings (27 introduced, 199 inherited), 70 duplication groups (16 introduced, 54 inherited). No unresolved imports, boundary violations or unused files in the changed-source report. Potential unused Admin class methods may be interface/indirection consumers; do not delete them from the provider without actual caller/interface evidence. The default static gate's FAIL means technical-debt policy not passed; it is not equivalent to a verified runtime or financial defect.

**Framework doctors:** Direct `nestjs-doctor` 0.9.10 on the Backend changed-file scope against `7a5aa7f` completed with score **86/100**, 0 errors and 87 warnings (14 security classification, 73 correctness classification) in that wider scope. The inspected `getAdminIdentity` security warning refers to the controller method returning an object; current service explicitly maps a limited set of identity fields rather than returning the raw D1/Prisma row, so that particular diagnostic is not an established leak. Other warnings remain advisory/unclassified, not zero. Direct `react-doctor` 0.9.18 scans of the Public and Admin scoped changes found 4 and 10 changed files respectively, but reported **0 analyzed files** and 0 diagnostics with `--no-lint --no-supply-chain --no-score`. Do **not** present this as all changed React code clean. Prior broader warning about WalletConnectControl remains source-relevant and CodeScene's 7.52 review corroborates its complexity.

**Sentry pre-release preparation:** `sentry-cli` 3.8.2 authenticates to org `mellonelay`, project `nexi` and successfully lists existing releases. Backend `src/instrument.ts` reads `SENTRY_RELEASE`; Public `next.config.js` uses `withSentryConfig` with build-time `SENTRY_AUTH_TOKEN` and release; Admin Vite `sentryTanstackStart` uses build-time token and `VITE_SENTRY_RELEASE`. The existing `nexi-admin-with-secrets` wrapper successfully provided a Sentry build token (boolean checked without printing). `@nexi-sentry` MCPC session restart did **not** cure `Authentication required by server`; its interactive OAuth is a distinct outstanding session boundary. CLI release abilities do not imply remote MCP OAuth is connected. No new SHA-specific release, source-map upload or symbolication proof yet because no new build/deploy has run.

**Execution boundary:** The review created only this runbook in the repository, no application source patch, no application build, no service restart, no SQLite/financial mutation, no new release/deployment and no browser acceptance. Classify CodeScene/Fallow maintainability issues separately from demonstrated correctness/security faults. Source-first closure is a **recorded source-phase decision**, not proof of deployment; actual release remains separate.

**Next owner-controlled technical gate:** Prior to a coordinated new release, decide whether the static introduced complexity/duplication gate is advisory or must be made green (which would require **source changes** and invalidate some proof). Reconcile any concretely demonstrable security/correctness regression narrowly; verify the exact Build/Sentry credential path for Backend/Public/Admin and use the four canonical `AGENTS.md` paths. If required, complete Sentry MCPC interactive OAuth separately. Only then stop old application processes, perform the one canonical Backend → Public → Admin build and promotion, verify actual build markers / SDK release / sourcemap upload / health, and schedule the independently authorized 113-case authenticated browser acceptance.
