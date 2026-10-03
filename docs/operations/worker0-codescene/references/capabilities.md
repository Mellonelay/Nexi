# CodeScene skill and capability list

## Contents

1. Responsibility split
2. Nine official skills
3. CLI and MCP operations
4. Authentication and projects
5. ACE and privacy
6. Updates and evidence

## Responsibility split

CodeScene measures maintainability; Graphify maps consumers, dependencies, causal paths and blast radius; Fallow supplies bounded static findings. Direct source establishes implementation. Tests and production/browser evidence establish behavior. None substitutes for the others.

Record repository, branch, HEAD/base ref, working/staged paths, score before/after, quality-gate result and eligible/checked-file counts. Default CLI hooks detect introduced issues/regressions; separately inspect scores to establish the owner's 10.0 target.

## Nine official skills

Read the selected workflow for a normal task; deliberate documentation audits may read all nine. Worker-0 uses `~/.agents/skills/<name>/SKILL.md` and existing Codex mirrors. Source: [official skills](https://github.com/codescene-oss/codescene-mcp-server/tree/main/skills).

| Task | Skill | Operation and evidence |
|---|---|---|
| Install/update/register | installing-and-activating-codescene-mcp | Binary, transport, auth and repository guidance; merge into existing AGENTS.md |
| Configure/troubleshoot | configuring-codescene-mcp | Masked `get_config`, authorized `set_config`, effective source and restart when required |
| Explain metric | explaining-code-health | Fundamentals/productivity tools; static explanation is not project analysis |
| Refactor file | guiding-refactoring-with-code-health | Review + score baseline; 3–5 small steps, re-review/re-score |
| Justify investment | making-the-business-case-for-code-health | File-scoped modeled ranges, not guaranteed NEXI outcomes |
| Rank project debt | prioritizing-technical-debt | Correct project → hotspots/goals → file drilldown → ranked incremental plans |
| Identify reviewers | routing-work-with-code-ownership | Project/path ownership signal, not absolute authority |
| Safeguard AI edits | safeguarding-ai-generated-code | Per-file review → pre-commit safeguard → HEAD/base branch safeguard |
| Choose tests | risk-based-testing-with-code-health | Current change set first, hotspot overlap second, concrete scenarios and open risks |

## CLI and MCP operations

### CLI

Use installed `cs` and current help; avoid duplicate dependency trees.

```bash
cs version
cs version --updates
cs auth status --output-format json
cs review path/to/file.ts --output-format json
cs review BASE_SHA:./path/to/file.ts --output-format json
cs delta --file path/to/file.ts --output-format json --include-metadata
cs delta --staged --output-format json --include-metadata
cs delta --git-hook --staged
cs delta BASE_REF HEAD --output-format json --include-metadata
cs check path/to/file.ts
cs docs
cs docs git-hooks
cs docs file-name
cs check-rules path/to/file.ts
cs rules-config validate --format json
```

Plain `cs delta` defaults to exit 0 even with findings. Use the hook form or inspect gate JSON; `--error-on-warnings` is an explicit strict form. Review JSON score null means no scorable code. `cs docs` lists topics; observed CLI rejects `cs docs --help` and has no standalone `cs refactor` command. Rules edits change scoring: never suppress findings to manufacture PASS.

### Persistent MCP

```bash
mcpc @nexi-codescene grep 'safeguard|review|change_set' -E
mcpc --json @nexi-codescene tools-get pre_commit_code_health_safeguard
mcpc --json @nexi-codescene tools-call code_health_review file_path:=/absolute/repo/file.ts
mcpc --json @nexi-codescene tools-call pre_commit_code_health_safeguard git_repository_path:=/absolute/repo
mcpc --json @nexi-codescene tools-call analyze_change_set git_repository_path:=/absolute/repo base_ref:=BASE_REF
mcpc --json @nexi-codescene tools-call verify_installation git_repository_path:=/absolute/repo
```

Use stdin JSON for complex inputs. Bound remote API calls with an external process deadline as well as the client timeout. Preserve handles; timeout does not prove bridge death or justify repeating a mutation.

Local: `code_health_score`, `code_health_review`, `pre_commit_code_health_safeguard`, `analyze_change_set`, `code_health_refactoring_business_case`.

Project: `select_project`; `list_technical_debt_hotspots_for_project` and `_for_project_file`; `list_technical_debt_goals_for_project` and `_for_project_file`; `code_ownership_for_path`. Pass actual `project_id` and schema-defined paths.

Management: `verify_installation`, masked `get_config`, authorized `set_config`, login/logout/switch_account. Skills: `list_skills`, `get_skill_manifest`, `download_skill`, `sync_skills`, prompts and `skill://<name>/SKILL.md` resources. Download/sync writes files; inspect ownership before overwrite.

Usage: `show_mcp_usage_overview` combines lifetime aggregates and latest 250 events, requires API access and proves only returned data. It is not an overall performance benchmark.

## Authentication and projects

Reuse existing credentials. Client environment overrides stored config. PAT/standalone access_token takes precedence and blocks OAuth login. For Cloud OAuth account changes use `switch_account`, not `set_config(account_id)` alone. Tool registration changes may require restart; enabled_tools changes require it. Never expose tokens.

Project tools require Core/API access; local analysis works with a valid local/standalone license. `select_project` lists names/IDs; configured defaults may lock selection. Confirm NEXI mapping before hotspots/goals/ownership. An unavailable API is a bounded blocker, not proof of an empty project.

## ACE and privacy

ACE is optional and requires an additional license. The public guide documents JavaScript, TypeScript and Java, and Large Method, Deep Nested Logic, Bumpy Road, Complex Conditional and Complex Method. Check current availability before use. No ACE tool was present in the observed 28-tool MCP catalog.

Local Code Health analysis and remote ACE are different paths. ACE sends minimal snippets to an automatic refactoring service; the vendor says they are not persisted or used for training. Do not generalize local-analysis privacy claims to ACE. Do not auto-apply it from installation alone: review the diff, test behavior and remeasure. Vendor fact-checking claims do not replace NEXI tests.

## Updates and evidence

Check versions, disk and process owners; preserve browser/auth/candidate state. Back up binaries. Use official `cs update`, recording the exact string including SNAPSHOT. Verify official MCP release archive digest and contained binary checksum, then atomically install. Restart only the affected session. Verify local analysis, existing auth/API checks and schema.

Record requested-source coverage, upstream commit/digests, changed skills/config, native tool receipts, unread linked media and untested optional features. Cache docs; do not claim linked videos/papers were read. Respect current upstream Docker retirement guidance for new installations.

Official references:

- [CLI](https://codescene.io/docs/cli/index.html) and [command reference](https://codescene.io/docs/cli/command-reference.html)
- [MCP](https://codescene.io/docs/developer-tools/mcp/codescene-mcp-server.html) and [tools](https://github.com/codescene-oss/codescene-mcp-server/blob/main/docs/tools.md)
- [Authentication](https://github.com/codescene-oss/codescene-mcp-server/blob/main/docs/authentication.md) and [configuration](https://github.com/codescene-oss/codescene-mcp-server/blob/main/docs/configuration-options.md)
- [ACE](https://codescene.io/docs/auto-refactor/index.html)
