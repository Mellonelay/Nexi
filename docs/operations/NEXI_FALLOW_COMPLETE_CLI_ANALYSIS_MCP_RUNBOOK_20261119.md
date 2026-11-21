# NEXI Fallow — Complete CLI, Analysis and MCP Runbook
**Reconstructed 2026-11-19.** Primary sources: official Fallow documentation, live installed CLI help and the persistent NEXI MCP session. This is a new runbook, not a claim that the missing 2026-11-16 file was restored.

## 1. Current VM evidence and authority
- Repository: `/home/mellonelay1999/workspaces/Nexi`; observed Git HEAD `c7f64d8`. Backend `backend/` (NestJS/Prisma7), Public `frontend/` (Next.js), Admin `Admin/` (TanStack/Vite).
- Fallow executable: `/usr/local/bin/fallow`, **3.42.0**; `fallow --version` reported a signed verified package. MCP executable: `/usr/local/bin/fallow-mcp`.
- Actual active session: `@nexi-fallow`, supplied by `/home/mellonelay1999/.local/bin/fallow-mcp-shared`, distinct from the plain launcher path. MCPC `/usr/local/bin/nexi-mcpc`, version **0.8.0**.
- Live checks: session ping succeeded; `tools-list --json` returned **38 tools**; `project_info` executed successfully and reported 588 analyzed files plus NestJS/Jest/TypeScript/Prisma/Next.js/Vite/TanStack/Playwright plugins.
- **Scope:** Fallow supplies deterministic module-graph, dead-code, dependency, duplication, complexity, boundary and impact signals; not runtime correctness. The older 97-page official-doc archive has not been recovered.
- Authority: latest owner > applicable `AGENTS.md` > current Git/source/runtime evidence > Graphify source graph > Knowledge MCPC > historical notes. Never delete dynamic Nest routes, exported APIs or financial records from dead-code labels alone.

## 2. Mandatory workflow
1. Inspect current task, HEAD, dirty files and applicable AGENTS.md. Don't modify an active unrelated worktree.
2. First run bounded task-specific queries on `@nexi-knowledge`, then `@nexi-graphify-live` for owner, producer→consumer and graph impact. Verify Graphify's graph matches source HEAD; current source wins.
3. Choose minimal Fallow tools for the decision: `guard` pre-edit; `inspect_target`, `trace_file`, `trace_export`, `symbol_impact` for dependencies; `audit` for changed-file gate; `check_health`, `find_dupes` for maintainability. Prefer bounded analysis, not repeated full scans.
4. Validate suspected issues against exact current source and legitimate dynamic consumers. Separate confirmed structural evidence, candidate security risk, and unverified assumptions.
5. Implement only authorized causal owner/source repair, preserve ledger/outbox atomicity, and run scoped verification according to latest owner instructions. Do not auto-fix or install hooks without approval.
6. Record precise command/tool, source revision, scope, config, finding ID, runtime proof where relevant, and remaining unknowns.

## 3. Official CLI — ready-to-use commands
```bash
cd /home/mellonelay1999/workspaces/Nexi
git status --short
git rev-parse HEAD
fallow --version
fallow --help
fallow schema
fallow list --format json
fallow workspaces --format json

# Before code changes: static policy and dependency context
fallow guard backend/src/admin/admin.service.ts --format json
fallow inspect --file backend/src/admin/admin.service.ts --format json
fallow architecture --cycles --format json
fallow architecture --boundaries --changed-since HEAD~1 --format json

# Change-relevant or targeted analysis, NOT mandatory full passes each time
fallow dead-code --changed-since HEAD~1 --format json
fallow dead-code --format json
fallow dupes --format json
fallow health --hotspots --targets --format json
fallow health --ownership --format json
fallow health --coverage-gaps --format json
fallow flags --format json
fallow security --format json

# When investigating exact candidates before removal
fallow dead-code --trace backend/src/admin/admin.service.ts:SomeExport
fallow dead-code --trace-dependency some-package
fallow dead-code --type-aware --symbol-impact backend/src/admin/admin.service.ts:SomeExport
fallow dupes --trace 'dup:<actual-fingerprint>'

# Audit vs human review: different purposes
fallow audit --base origin/main --format json
fallow review --base origin/main --brief
fallow review --base origin/main --walkthrough-guide --format json

# PREVIEW only: no source-changing fixes in runbook recovery
fallow fix --dry-run --format json
```
All refs and symbol names above are *examples*. Resolve the actual merge-base, names, source and scopes before using them. Prefer `--format json` for machine output. CLI exit 1 may represent a quality gate finding; inspect schema and stderr rather than treating every nonzero as execution failure.

### What each mode proves, and what it does not
- `dead-code` analyzes reachable imports and exports; TypeScript type-aware consumers may need the opt-in semantic companion. Dynamic routing/reflection, generated code and external library consumers require manual evidence.
- `architecture` finds cycles, forbidden boundaries and policy violations. `--shared-state` inventories supported static writes/reads but cannot prove runtime races or execution order.
- `health` scores complexity and hotspots. `--coverage-gaps` is static reachability, **not measured test coverage**. Exact per-function CRAP requires real coverage.
- `audit` compares changed code to Git base, default `new-only`. `--gate all` includes inherited findings. `review` is an orientation/decision surface, not a CI gate.
- `security` yields candidates needing verification of attacker-controlled inputs and reachable sinks; severity alone is not exploitability proof.
- `similar-code` is opt-in/local model; `mutation` runs actual tests and has an independent permission boundary. No auto downloads, telemetry activation or hook setup.

## 4. MCPC connection and tool-schema workflow
```bash
MCPC=/usr/local/bin/nexi-mcpc
"$MCPC" --json
"$MCPC" help --skill
"$MCPC" @nexi-knowledge ping
"$MCPC" @nexi-graphify-live ping
"$MCPC" @nexi-fallow ping
"$MCPC" @nexi-fallow tools-list --json
"$MCPC" @nexi-fallow tools-get inspect_target
"$MCPC" @nexi-fallow tools-get audit
"$MCPC" @nexi-fallow tools-get trace_export
"$MCPC" @nexi-fallow tools-call project_info '{}' --json
"$MCPC" @nexi-fallow logs -n 20
```
Use `tools-call <name> '<JSON object>' --json` after reading `tools-get` for exact optional and required arguments; prefer actual source-file paths and explicit root if the shared wrapper points at an unexpected working directory. Never blindly close/restart the existing session. A CLI installation alone does not prove MCP callability or authentic source coverage.

## 5. Full LIVE MCP tool inventory (captured 2026-11-19)
The following required-field inventory was retrieved from the running `@nexi-fallow` server; version changes can alter schemas. Some tools mutate state (especially `fix_apply`), so obtaining a schema is NOT authorization to call them.

| MCP tool | Required arguments |
|---|---|
| `analyze` | none |
| `audit` | none |
| `check_changed` | `since` |
| `check_health` | none |
| `check_runtime_coverage` | `coverage` |
| `code_execute` | `code` |
| `decision_surface` | none |
| `fallow_explain` | `issue_type` |
| `feature_flags` | none |
| `find_dupes` | none |
| `find_similar_code` | none |
| `fix_apply` | none |
| `fix_preview` | none |
| `get_blast_radius` | `coverage` |
| `get_cleanup_candidates` | `coverage` |
| `get_cloud_runtime_context` | `repo` |
| `get_hot_paths` | `coverage` |
| `get_importance` | `coverage` |
| `get_token_blast_radius` | none |
| `guard` | `files` |
| `impact` | none |
| `impact_all` | none |
| `impact_closure` | `path` |
| `inspect_similar_code` | `candidate_id`, `snapshot` |
| `inspect_target` | `target` |
| `list_boundaries` | none |
| `list_suppressions` | none |
| `project_info` | none |
| `recommend` | none |
| `security_candidates` | none |
| `symbol_impact` | `file` |
| `trace_clone` | none |
| `trace_dependency` | `package_name` |
| `trace_error` | `trace` |
| `trace_export` | `file`, `export_name` |
| `trace_file` | `file` |
| `trace_import_path` | `from`, `to` |
| `trace_symbol` | `file`, `export_name` |
## 6. Advanced operational routing
- Structural discovery: `project_info`, `list_boundaries`, `trace_file`, `trace_export`, `trace_dependency`, `trace_import_path`, `trace_clone`.
- Change guard: `guard` before changes; `audit` and `check_changed` afterwards; `decision_surface` for source-anchored review judgments.
- Special evidence: `get_blast_radius` and other `coverage`-requiring calls need **real input coverage**, not invented data; `inspect_similar_code` requires a real candidate and snapshot.
- `code_execute` supports a bounded read-only Fallow JS analysis adapter, not arbitrary VM shell or write actions.
- Fallow type-aware results, repo graph results and machine-quality scores complement but never replace actual compiler/build/browsers and financial source verification.

## 7. Failure handling and proof
- `mcpc --json` → `ping` → `tools-list` → `tools-get` → tool call. If disconnected, inspect wrapper/config/logs and use CLI for scoped fallback. Do not re-register duplicate servers.
- Wrong files: inspect `fallow list --format json`, parser diagnostics, package/workspace resolution and ignored files. The 588-file count is a snapshot, not a NEXI total.
- Partial run: mark output TRUNCATED/INCOMPLETE and preserve previous findings; a missing finding in a scoped run is UNKNOWN, not fixed.
- Findings before deletion: verify symbol consumers, runtime entrypoints, API exports and source-specific allowlists.
- Report: `TASK | HEAD | TOOL VERSION | MCPC/CLI ACTION | SCOPE | FINDING-ID | SOURCE PROOF | ACTION | VERIFICATION | UNKNOWN`.

## 8. Current official sources reviewed
- https://fallow.tools/docs/integrations/mcp/
- https://fallow.tools/docs/cli/health/
- https://fallow.tools/docs/cli/audit/
- https://fallow.tools/docs/cli/architecture/
- https://fallow.tools/docs/cli/workspaces/
- https://fallow.tools/docs/cli/schema/
- https://fallow.tools/docs/cli/dead-code/
- https://fallow.tools/docs/cli/guard/
- https://fallow.tools/docs/cli/security/
- https://fallow.tools/docs/analysis/limitations/
- Full NEXI MCPC manual: `/srv/nexi/engineering-knowledge/20261110/KNOWLEDGE_MCPC_OPERATING_GUIDE.md`.
