# NEXI Worker-0 CLI Catalog

Purpose: durable responsibility map for local CLIs/operator tools. Versions and callability are discovered live; this is not a frozen version inventory.

| Tool | Primary NEXI responsibility | Use / avoid | Preferred invocation | Authority limit / related tool | Live status |
|---|---|---|---|---|---|
| `git` | source state/history/diff | use for source frontier; not deployment truth | `git status`, `git log`, `git diff` | GitHub `main` is durable authority | `git --version` |
| `gh` | GitHub repo/PR/CI/auth | use for GitHub operations | `gh auth status`, `gh repo view` | serialize final fan-in | `gh --version` |
| `agent-kernel` | durable approved governance, memory, architecture contracts | use for durable global/project policy and context; not task-phase state | `agent-kernel status`, `doctor`, `sync` | does not own Get-Fable lifecycle or Riqor evidence | `agent-kernel --version` |
| `get-fable` | engineering lifecycle routing, recovery, host hooks/skills | use for phase/card/recovery; do not make it durable global memory authority | `get-fable route`, `doctor`, targeted install | complements Agent Kernel + Riqor | `get-fable --version` |
| `riqor` | evidence run, freshness, ordered trace, completion admissibility | use when mutation/evidence freshness matters | `riqor status --json`, `run status`, `doctor --json` | evidence gate, not implementation owner | `riqor version --json` |
| `no-mistakes` | Git/change-safety proxy installed by Get-Fable | use only as bounded quality gate | `no-mistakes ...` | supporting guard, not source/runtime truth | `no-mistakes --version` |
| `worker0-graph-analyze` | deterministic Omnipotent analysis over Graphify graph.json | use only for L3 structural analysis | `worker0-graph-analyze <graph.json>` | candidates only; confirm in source/runtime | script canary |
| `graphify` | local graph extraction/update/query/path/impact | use change-driven; avoid full rebuild by default | `graphify check-update`, `graphify update`, targeted query/path | structural evidence only | `graphify --help` |
| `fallow` | TS/JS structural/dead/duplication/risk evidence | use focused/changed-scope; not runtime or typecheck | JSON/quiet agent mode | pairs with Graphify | `fallow --help` |
| `cs` / CodeScene | code health/hotspots/change-risk | use for maintainability prioritization | `cs --help` | not acceptance proof | `cs --help` |
| `context-dev` | external web/content research/extraction | use when repo is not authority | `context-dev --help` | official docs preferred for platform semantics | `context-dev --version` |
| Wrangler | Cloudflare backend/platform operator authority | official Cloudflare docs first; inspect live `--help`; prefer repo-pinned Wrangler when callable, otherwise use the explicitly verified current operator binary without changing source pins | from `cloudflare-container-bootstrap`, with explicit `--config wrangler.jsonc` for NEXI | Cloudflare runtime/operator evidence; never Ledger/D1 financial semantics owner | `wrangler --version` + exact subcommand `--help` |
| global `wrangler` | fallback Cloudflare operator when repo-local binary is absent | may be used only after version/help/docs verification; never silently change the repo pin | `wrangler --version`, exact subcommand `--help` | runtime operator only; GitHub remains source authority | `wrangler --version` |
| `sentry` | Sentry issues/events/traces/logs/releases/API | use for telemetry | `sentry auth status`, subcommand help | telemetry, not source truth | `sentry --version` |
| `avn` | Aiven service/project operations | use for Valkey service state | `avn service ...` | Valkey only, never financial truth | `avn --version` |
| `redis-cli` | protocol-level Valkey inspection | use only with authorized endpoint/credentials | bounded reads/stream checks | no financial authority | `redis-cli --version` |
| `codex` | substantial bounded implementation/refactor worker | use only when separate reasoning context helps | bounded packet | parent owns fan-in | `codex --version` / login status |
| `kilo` | substantial independent audit/verification or isolated implementation | use only when independence helps | bounded packet | parent owns fan-in | `kilo --version` / auth status |
| `nest` | Nest reference/scaffolding | use sparingly; project source/packages outrank global CLI | `nest --help` | not business authority itself | `nest --version` |
| `nestjs-doctor` | focused Nest diagnostics | use for concrete Nest health question | `nestjs-doctor --help` | diagnostic only | `nestjs-doctor --help` |
| `sg` / `ast-grep` | AST-aware source search/rewrite | use when syntax-aware matching beats text search | targeted rule/query | direct source truth remains canonical | `sg --version` |
| `semgrep` | targeted static/security analysis | use for scoped security/static evidence | focused rules/paths | finding != exploit proof | `semgrep --version` |
| `react-doctor` | React health/correctness diagnostics | use for focused frontend health | targeted project invocation | diagnostic only | `react-doctor --help` |
| `trivy` | dependency/container/filesystem/IaC security scan | use when security scope calls for it | targeted scan | not runtime exploit proof | `trivy --version` |
| `actionlint` | GitHub Actions validation | use for workflow changes | `actionlint <files>` | workflow syntax/static | `actionlint -version` |
| `shellcheck` | shell lint | use for changed shell scripts | `shellcheck <files>` | static only | `shellcheck --version` |
| `hadolint` | Dockerfile lint | use for Dockerfile changes | `hadolint <Dockerfile>` | static only | `hadolint --version` |
| `redocly` | OpenAPI lint/bundle | use for API spec changes | `redocly lint` | contract evidence | `redocly --version` |
| `oasdiff` | OpenAPI breaking-change diff | use when comparing contracts | `oasdiff ...` | contract evidence | `oasdiff version` |
| `hurl` | deterministic HTTP/API checks | use for reproducible request scenarios | `hurl <file>` | HTTP proof only | `hurl --version` |
| `hyperfine` | command benchmarking | use to compare execution strategies | `hyperfine ...` | performance measurement only | `hyperfine --version` |
| `node` / `npm` / `pnpm` | JS runtime/package commands | use project package manager/lockfile | project scripts | do not rebuild deps without task need | `node --version`, manager version |
| `python3` | automation/data/file analysis | prefer persistent REPL for iterative work | `python3 -i` | analysis tool | `python3 --version` |
| `uv` | Python tool/env/package management | use for Python tooling where configured | `uv ...` | not project authority | `uv --version` |
| `docker` | container inspection/build/runtime | use only when task requires container evidence | `docker ...` | not Cloudflare production authority | `docker version` |
| `jq` | JSON transforms | use for deterministic compact parsing | `jq ...` | data transform | `jq --version` |
| `rg` | fast exact content search | preferred exact text/code search | `rg ...` | source locator | `rg --version` |
| `fd` / `fdfind` | fast file discovery | use for names/paths | `fd ...` | source locator | `fd --version` |
| `curl` | HTTP diagnostics | use for bounded runtime/API evidence | `curl -i ...` | HTTP evidence only | `curl --version` |
| `playwright-cli` | Worker-0 deterministic local browser automation | use existing browser installation | `playwright-cli ...` | browser evidence | `playwright-cli --version` |
| project-local Playwright | repository test-runner path where configured | use only when project suite requires it | `npx playwright ...` | test evidence | local bin / package manifest |

## Current live presence note — volatile

A 2026-09-17 authority-transition canary confirmed the repo manifests/lockfile pin Wrangler `4.127.1`, while the repo-local `node_modules/.bin/wrangler` is absent. The installed global operator was `4.129.0` during convergence, and current upstream help advertised a newer release. These versions are volatile facts, not permanent authority. Do not auto-update or change the source pin merely to operate Cloudflare; verify the exact binary and help before each consequential task.

**Operator guard:** when the repo-local binary is absent, do not run bare `npx wrangler ...`; npm may fetch a newer Wrangler into an npx sandbox and silently change operator semantics. Use `npx --no-install wrangler ...` only when the repo-local binary exists; otherwise use the explicitly verified installed `wrangler` binary or a version-pinned isolated validation environment.

Cloudflare Container SSH is an official operator path. NEXI uses Wrangler as an OpenSSH ProxyCommand to the running Cloudflare Container instance when shell access is required; never expose a public SSH port and never treat the VM as the backend runtime.

Before consequential use, run only the exact tool's current `--help`/status command.

## Heavy-worker packets

Any Codex/Kilo packet must state: goal, allowed paths, forbidden paths, invariants, dependencies, required evidence, stop condition. Parent remains acceptance/fan-in authority.
