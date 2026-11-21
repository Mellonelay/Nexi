# NEXI CodeScene — Complete CLI and MCP Code Health Runbook
**Reconstructed 2026-11-19 from official vendor docs and live VM inspection.** This is not the former November 17 file; no historical assessment result is silently carried forward.

## 1. Verified VM state
- NEXI checkout: `/home/mellonelay1999/workspaces/Nexi`, observed commit `c7f64d8`; preserve active worktree modifications.
- CodeScene MCP executable: `/usr/local/bin/cs-mcp`, version **1.5.20**. `cs-mcp --cli-version` reported bundled CLI **1.0.58**, built November 9.
- Separate user-local CodeScene CLI: `/home/mellonelay1999/.local/bin/cs`; its help ran and advertised `delta`, `review`, `check`, `auth`, `rules-config` and other commands. Bundled CLI version does **not** independently prove version of the user-local binary.
- Persistent MCPC session: `@nexi-codescene` from `/home/mellonelay1999/.local/bin/codescene-mcp-shared`. Live ping succeeded. `tools-list --json` exposed **28 tools**.
- Real read-only canaries: `get_config` returned a response; `list_skills` enumerated **9 CodeScene specialist skills**. Version notice: **MCP 1.5.22 available**; installed MCP remains **1.5.20**, no update performed.
- A successful ping, config call, or list_skills **does not prove CodeScene Cloud project authorization or a current health check**. OAuth is separate from CLI session context. No project-level health analysis was run for this runbook.

## 2. Responsibility and NEXI engineering sequence
CodeScene detects code-health/maintainability risks (large functions, nesting, complexity, cohesion, hotspots), supports refactoring review and business-case estimation. It is NOT the financial integrity verifier, TypeScript compiler, runtime acceptance system, or Graphify dependency graph.

1. Inspect latest owner instructions, `AGENTS.md`, HEAD, dirty files, proof and task. Query Knowledge MCPC and Graphify source impact before editing.
2. Use **Fallow** for structural graph risk (unused code, cycles, boundaries, duplication) and **CodeScene** for maintainability/change-health risk. Use CodeScene project hotspots when project ID and account authorization are verified.
3. Prefer `code_health_review` for a bounded file or `cs delta` for actual changed code. Do not run full change-set MCP repeatedly when it times out.
4. Inspect exact implementation and producer→consumer contracts; change only causal owner. Never refactor Ledger/Posting/Outbox merely to improve a score.
5. Run appropriate focused verification if latest owner and repository rules permit; compare same file, rules, version and base. Classify structural facts vs assessment vs runtime proof.
6. Do not install hooks, modify rules, enable telemetry, initiate OAuth, switch accounts or deploy as a side effect of a runbook review.

## 3. CodeScene CLI — official command reference
```bash
cd /home/mellonelay1999/workspaces/Nexi
git rev-parse HEAD
git status --short
/home/mellonelay1999/.local/bin/cs version
/home/mellonelay1999/.local/bin/cs --help
/home/mellonelay1999/.local/bin/cs auth status --output-format json

# File-specific health checks
/home/mellonelay1999/.local/bin/cs review backend/src/admin/admin.service.ts --output-format json
/home/mellonelay1999/.local/bin/cs check backend/src/admin/admin.service.ts

# Delta of current modifications, staged files, or correct branch base
/home/mellonelay1999/.local/bin/cs delta --output-format json --include-metadata
/home/mellonelay1999/.local/bin/cs delta --staged --output-format json --include-metadata
/home/mellonelay1999/.local/bin/cs delta origin/main --output-format json --include-metadata

# Policy inspection before any rule edit
/home/mellonelay1999/.local/bin/cs rules-config --help
/home/mellonelay1999/.local/bin/cs check-rules --help
/home/mellonelay1999/.local/bin/cs docs git-hooks

# Check installed MCP and its embedded CLI
/usr/local/bin/cs-mcp --version
/usr/local/bin/cs-mcp --cli-version
```
The `origin/main` and file paths are **syntax examples**; verify their existence and whether they apply to the current branch. `cs delta` compares working tree/commits, while `--staged` targets the index. JSON output has different verbosity from human mode and can emphasize newly introduced issues. `cs review` gives file-level JSON, `cs check` lint-style feedback. A quality-regression exit must be distinguished from CLI failure.

### Authentication
- Official CodeScene CLI: `cs auth login --no-browser` for headless interactive sign-in; `cs auth status`, `cs auth list-accounts` and `cs auth logout` are distinct commands.
- CodeScene MCP: use its `login` tool only when explicitly needed/approved; it stores a local OAuth session. `CS_ACCESS_TOKEN` is fallback; `CS_ONPREM_URL` only for on-prem instances. Never paste a token into docs or MCP config and never print token-bearing environment values.
- CLI auth and MCP auth are independent capability claims. `get_config` or `list_skills` returning data does not establish successful remote project calls.

## 4. Persistent MCP — exact usage
```bash
MCPC=/usr/local/bin/nexi-mcpc
"$MCPC" --json
"$MCPC" @nexi-codescene ping
"$MCPC" @nexi-codescene tools-list --json
"$MCPC" @nexi-codescene tools-get code_health_review
"$MCPC" @nexi-codescene tools-get analyze_change_set
"$MCPC" @nexi-codescene tools-get list_technical_debt_hotspots_for_project
"$MCPC" @nexi-codescene tools-call get_config '{}' --json
"$MCPC" @nexi-codescene tools-call list_skills '{}' --json
# Example only; not an assertion that an analysis has executed:
"$MCPC" @nexi-codescene tools-call code_health_review '{"file_path":"/home/mellonelay1999/workspaces/Nexi/backend/src/admin/admin.service.ts"}' --json
"$MCPC" @nexi-codescene tools-call analyze_change_set '{"base_ref":"origin/main","git_repository_path":"/home/mellonelay1999/workspaces/Nexi"}' --json
```
Use `tools-get` before argument-dependent calls and inspect actual required/optional fields. Avoid full change-set review if a focused code-health review is sufficient. Reuse active MCP session rather than creating conflicting new servers.

## 5. Full LIVE CodeScene MCP inventory (28 tools)
The table was generated from `@nexi-codescene tools-list --json`, not from memory; required parameters are a subset of each exact `tools-get` contract. `login`, `logout`, account/project switches, `set_config`, rule mutation, skill downloads/synchronization and safeguard operations may change state and require approval.

| MCP tool | Required arguments |
|---|---|
| `analyze_change_set` | `base_ref`, `git_repository_path` |
| `code_health_refactoring_business_case` | `file_path` |
| `code_health_review` | `file_path` |
| `code_health_score` | `file_path` |
| `code_ownership_for_path` | `project_id`, `path` |
| `download_skill` | `skill_name`, `destination_dir` |
| `explain_code_health` | none |
| `explain_code_health_productivity` | none |
| `get_config` | none |
| `get_skill_manifest` | `skill_name` |
| `list_skills` | none |
| `list_technical_debt_goals_for_project` | `project_id` |
| `list_technical_debt_goals_for_project_file` | `file_path`, `project_id` |
| `list_technical_debt_hotspots_for_project` | `project_id` |
| `list_technical_debt_hotspots_for_project_file` | `file_path`, `project_id` |
| `login` | none |
| `logout` | none |
| `pre_commit_code_health_safeguard` | `git_repository_path` |
| `rules_config_list_thresholds` | `language` |
| `rules_config_set_rule` | `rule_name`, `enabled` |
| `rules_config_set_threshold` | `threshold_name`, `value` |
| `rules_config_validate` | none |
| `select_project` | none |
| `set_config` | `key`, `value` |
| `show_mcp_usage_overview` | none |
| `switch_account` | none |
| `sync_skills` | `destination_dir` |
| `verify_installation` | `git_repository_path` |
## 6. Capability decision matrix
| Task | Primary CodeScene evidence | Required cross-check |
|---|---|---|
| Score specific function/file | `code_health_review`, `code_health_score` | Actual source and matching configuration |
| Analyze current diff | `analyze_change_set` or CLI `cs delta` | Git base / changed files |
| Discover prioritized hotspots | `list_technical_debt_hotspots_for_project` | Verified account/project ID, freshness |
| Ownership/debt goals | `code_ownership_for_path`, `list_technical_debt_goals_for_project` | Repo ownership and application behavior |
| Estimate refactoring business value | `code_health_refactoring_business_case` | Estimates only, not NEXI ROI proof |
| Explore tool guidance | `list_skills`, `get_skill_manifest`, `explain_code_health` | Skill selection/read != execution |

## 7. Working with Fallow, Graphify, Knowledge and Sentry
- `@nexi-knowledge` answers task-specific current project contracts; `@nexi-graphify-live` identifies source owner/dependency paths (static graph can lag HEAD); **Fallow** validates structural reachability/duplication/boundaries; **CodeScene** supplies Code Health; **Sentry** supplies runtime incident evidence when properly authenticated. Do not pretend one replaces the others.
- Backend ledger, journal, options settlement, SIWE and outbox require production-oriented correctness proof beyond Code Health. Admin authorization and mobile Public geometry require their own tests/acceptance.
- Concentrate on changed, risk-ranked units. No speculative redesign because Fallow or CodeScene rated complexity as high.
- Keep tools read-only for review; CodeScene `rules_config_set_rule`/`rules_config_set_threshold` may disable quality controls, so never invoke automatically.
- Build/deploy/financial DB mutations, external wallet transactions, and authentication changes remain separate authorization boundaries.

## 8. Diagnostics / proof
- Transport: `mcpc --json`, `ping`, `tools-list`, `tools-get`, `logs -n 20`; then a harmless `get_config` canary. If Cloud data calls fail, check account, project ID, OAuth and roles; no speculative login.
- Version drift: installed 1.5.20 vs offered 1.5.22. Do not silently upgrade active NEXI tools.
- CLI path mismatch: verify user-local `cs` and bundled `cs-mcp --cli-version` separately.
- Quality evaluation: same source SHA, rule settings, CLI/MCP version, Git comparison and project scope required for before/after score comparison.
- Record: `HEAD | TOOL/COMMAND | AUTH LEVEL | PROJECT/SCOPE | SCORE/HOTSPOT/FINDING | SOURCE PROOF | VERIFIED EFFECT | NEXT`.
- Report partial results honestly: current runbook authoring verified installed tools and canaries, **not** all 28 project operations or NEXI code-quality acceptance.

## 9. Official documentation reviewed
- https://codescene.io/docs/developer-tools/mcp/codescene-mcp-server.html
- https://codescene.io/docs/cli/index.html
- https://codescene.io/docs/cli/command-reference.html
- https://github.com/codescene-oss/codescene-mcp-server
- https://github.com/codescene-oss/codescene-mcp-server/tree/main/skills
- https://codescene.io/docs/configuration/oauth2-authorizations.html
- NEXI reference: `/srv/nexi/engineering-knowledge/20261110/KNOWLEDGE_MCPC_OPERATING_GUIDE.md`.
