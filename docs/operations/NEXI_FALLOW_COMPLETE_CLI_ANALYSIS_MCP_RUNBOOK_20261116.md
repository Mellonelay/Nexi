# NEXI — Complete Fallow Analysis, CLI, Configuration, Integrations & MCP Runbook

**2026-11-16 | Verified Fallow 3.42.0 signed CLI | 97 official pages captured | Source-first, read-only.**

Sources: https://fallow.tools/docs/ and https://github.com/fallow-rs/fallow . Companion source capture: docs/operations/NEXI_FALLOW_OFFICIAL_DOCS_COVERAGE_20261116.json (URLs, page hashes, extracted text and examples).

## 1. Scope and authority

Fallow is a Rust-native JavaScript/TypeScript analyzer: dead code, dependency hygiene, cycles, architecture boundaries, duplication, complexity/health, semantic overlap, security candidates, and optional TypeScript symbol-aware evidence. It complements Graphify source topology and CodeScene maintainability, and does not establish runtime behavior.

NEXI SOURCE-FIRST: until authorized source and Backend/Public/Admin producer-to-consumer integration closes, do not run application tests, lint/typecheck campaigns, builds, browser acceptance, service restarts, deployments, migrations, or financial mutations. Read-only static Fallow source analysis is allowed when it answers a bounded source question. Do not execute mutation tests or auto-fix, or promote CI gates, during this phase.

Canonical checkout: /home/mellonelay1999/workspaces/Nexi. Existing .fallowrc.jsonc defines Public/frontend, Backend/backend, Admin/Admin zones; boundary-violation is warn. Existing ignore patterns cover backend/src/prisma/d1-client/**, Admin/src/routeTree.gen.ts, .github/codeql/tests/**, and **/*.gen.ts. Preserve policy and current dirty worktree.

## 2. Safe source-first commands

```bash
cd /home/mellonelay1999/workspaces/Nexi
fallow --version
fallow doctor --help
fallow list --help
fallow guard --help
fallow inspect --help
fallow dead-code --help
fallow architecture --help
fallow dupes --help
fallow health --help
fallow trace --help
fallow security --help
```

For an actual authorized bounded source question, use the installed command-specific --help, --format json and --quiet where supported, redirect full output to /tmp, parse JSON before summarizing, and preserve command, exit code, source SHA, config SHA, version, severity, source locations and omitted evidence. Do not truncate JSON strings before parsing.

```bash
# Examples: read-only static source questions (not executed in this run)
fallow dead-code --trace src/api.ts:Client --format json --quiet
fallow dead-code --trace-dependency some-package --format json --quiet
fallow guard frontend/app/dashboard/wallet/page.tsx --format json --quiet
fallow architecture --format json --quiet
fallow dupes --format json --quiet
fallow health --hotspots --targets --format json --quiet
fallow inspect --file frontend/app/dashboard/wallet/page.tsx --format json --quiet
fallow trace --path frontend/app backend/src --format json --quiet
```

Example paths/symbols are illustrative; confirm existence and exact installed flags. No scan is claimed executed here.

## 3. Decision workflows

**Dead code:** Locate exact Graphify L0 owner/L1 dependents; Fallow trace symbol/dependency; inspect dynamic imports, Next routes, Nest DI/decorators, public exports, external API users, Socket.IO handlers, Prisma schema, queues and Admin/Public consumers. A syntactic unused result is not deletion authorization. Preserve historical retained Fallow candidates unless new proof changes them.

**Type-aware:** Default Rust syntax pass is fast and does not require TS compiler. Optional fallow-type-aware at the exact same version (3.42.0) resolves aliases/reexports, exact symbol consumers, affected tests and package API leakage. Evidence complete/partial/unavailable is not interchangeable; best-effort preserves findings and complete can fail closed. This is not tsc diagnostics or typed lint. Do not install the companion during this documentation task.

```bash
# Installation reference only; not executed
npm install --save-dev fallow-type-aware@3.42.0
# Once available and authorized:
fallow type-aware status --format json --quiet
fallow dead-code --type-aware --symbol-impact src/api.ts:Client --format json --quiet
fallow dead-code --type-aware --type-aware-require complete --format json --quiet
```

**Architecture:** Use guard before a scoped source edit and architecture to inspect cycles/boundary warnings; maintain three separate source surfaces with HTTP/realtime contracts, not cross-surface source imports. Do not silently promote warn to error.

**Duplication:** Inspect clone fingerprints with dupes --trace dup:<fingerprint>; identical shapes can have different financial permissions, idempotency or accounting semantics. Similar-code is opt-in and advisory.

**Health/CRAP:** Use hotspots, targets, ownership and complexity to prioritize; CRAP/coverage requires real coverage evidence and is not permission to run tests during source-first. viz is a generated code map, not application browser acceptance.

**Security:** security produces candidate findings for verification, not proof of exploit. Preserve SIWE mainnet, Ledger/Outbox single-writer, withdrawal and account-authorization guards.

**Auto-fix/mutation/CI:** fix can mutate application code; mutation can run tests; CI can enforce gates. All deferred until owner phase permits. Dry-run is a preview, not a blanket authorization.

**MCP and agents:** CLI is the primary universal interface; optional fallow-mcp provides structured tools. Verify the actual registered @nexi-fallow connection and current tool schemas before invocation; do not assume old 38-tool inventory remains current. Agent Skills, Codex app, Claude hooks, Node bindings, editors, and CI are distinct integrations; none is automatically installed by writing this runbook.

## 4. Complete official docs topic coverage

The following is a page-by-page operational index. Each page includes its official URL, purpose, section headings, and a short representative command excerpt where documented. The companion JSON contains the retrieved text and source hashes. This index is not a verbatim copy of the official site.

## 5. Getting started

### Fallow: codebase analysis for TypeScript and JavaScript

**Official:** https://fallow.tools/docs/

**Purpose (source excerpt):** Fallow is codebase analysis for TypeScript and JavaScript. It reports unused code, duplication, complexity, and architecture drift from one graph of your repo.

**Covered operations:** Start here; What fallow helps you do; Pick your workflow; Understand the two layers; See also

## 6. Analysis

### Static analysis for TypeScript and JavaScript

**Official:** https://fallow.tools/docs/analysis

**Purpose (source excerpt):** Static analysis for TypeScript and JavaScript with fallow: unused code, duplication, complexity, architecture boundaries, styling drift, and runtime coverage.

**Covered operations:** Static analysis; Runtime analysis; Supporting topics; See also

### Remove unused exports and dependencies automatically

**Official:** https://fallow.tools/docs/analysis/auto-fix

**Purpose (source excerpt):** Remove unused exports, dependencies, enum members, and catalog entries from TypeScript and JavaScript with one command. Preview each change before you apply it.

**Covered operations:** Recommended workflow; What gets fixed; Incomplete analysis; auto_fixable is per-finding, not per action type; JSON output; See also

**Documented example:**
```text
fallow fix --dry-run --format json
```

### Enforce architecture boundaries in TypeScript

**Official:** https://fallow.tools/docs/analysis/boundaries

**Purpose (source excerpt):** Enforce architecture boundaries in TypeScript and JavaScript. Define which directories may import from which, and fallow reports each import that breaks a rule.

**Covered operations:** Quick start with presets; Presets; Source root detection; Custom zones and rules; How zones work; Re-export chains; Auto-discovered feature zones; Subtree scope (root); Overriding preset zones; Suppressing violations; Output formats; See also

**Documented example:**
```text
fallow architecture --boundaries
```

### CRAP scores for TypeScript with Vitest coverage

**Official:** https://fallow.tools/docs/analysis/crap-scores-vitest

**Purpose (source excerpt):** Get CRAP scores per function for a TypeScript or JavaScript project with Vitest. Configure Vitest coverage, run fallow health, and gate new CRAP in CI.

**Covered operations:** Configure Vitest; Run the analysis; Coverage file resolution; Coverage from another checkout; Provider differences; Read the results; Actions; Gate new CRAP in CI; Show mutation scores next to CRAP; Monorepos; One coverage file for all packages; One coverage file per package; See also

**Documented example:**
```text
CRAP = CC^2 * (1 - cov/100)^3 + CC
```

### Find unused CSS Modules classes and Tailwind tokens

**Official:** https://fallow.tools/docs/analysis/css-analysis

**Purpose (source excerpt):** Find unused CSS Module classes and Tailwind tokens, and stop false unused-file reports for stylesheets. Fallow resolves SCSS partials, @use, and @forward.

**Covered operations:** SCSS import resolution; CSS Module class tracking; Tailwind CSS integration; @plugin directive (Tailwind v4); Unused Tailwind v4 @theme tokens; Classes in server-side templates; Token blast-radius (token_consumers); Tailwind v3 config; CSS @import tracking; Styling health grade; Value drift over exact repetition; Confidence and scope; Common patterns that just work; See also

**Documented example:**
```text
@use 'sass:color';
@use 'variables';
@use 'mixins/responsive';

@forward 'tokens' show $primary, $secondary;
```

### Find unused exports and dead code in TypeScript

**Official:** https://fallow.tools/docs/analysis/dead-code

**Purpose (source excerpt):** Find unused files, exports, and dependencies to delete from a TypeScript or JavaScript project. Fallow also reports circular dependencies and unused members.

**Covered operations:** Issue types; Filtering by issue type; Findings in unused files; Optional props that callers never supply; Parameters that each call passes in one way; Output formats; Incremental analysis; Baseline comparison; Debugging; How it works; Script binary analysis; Formatter and linter targets; File utilities; Turn off entry points for a command

**Documented example:**
```text
fallow dead-code
```

### Debug fallow findings and false positives

**Official:** https://fallow.tools/docs/analysis/debugging

**Purpose (source excerpt):** Debug fallow findings: trace why an export, file, dependency, or clone is reported or missed, profile slow runs, and fix the common false positives.

**Covered operations:** Tracing export usage; Tracing file edges; Tracing dependency usage; Tracing duplication clones; Performance profiling; Process time; Work counts; Parallel parse timing; Cache behavior; A refused cache says so; Common false positives; Dynamic imports with runtime values; Convention-based exports; Dependency injection frameworks

**Documented example:**
```text
fallow dead-code --trace src/utils/format.ts:formatCurrency
```

### Detect duplicate code in JavaScript and TypeScript

**Official:** https://fallow.tools/docs/analysis/duplication

**Purpose (source excerpt):** Detect duplicate code in TypeScript and JavaScript. Fallow finds copy-pasted code and shows which copies to extract first, with the same binary and config.

**Covered operations:** Why built-in duplication matters; Detection modes; Near-miss clones; Thresholds and limits; Minimum occurrences; Spread-aware ranking; Reviewed clone groups; Clone families; Cross-language detection; Ignoring imports; Symlinked files; Incremental analysis; Baseline comparison; Debugging

**Documented example:**
```text
fallow dupes
```

### Analyze Vue, Svelte, Astro, MDX, and HTML files

**Official:** https://fallow.tools/docs/analysis/file-types

**Purpose (source excerpt):** Vue, Svelte, Astro, MDX, and HTML support: fallow counts files that only these file types, GraphQL, or CSS reference as used, with no plugin or config.

**Covered operations:** See also

**Documented example:**
```text
<!DOCTYPE html>
<html>
 <head>
 <link rel="stylesheet" href="./styles/main.css" />
 <link rel="modulepreload" href="./vendor/lodash.js" />
```

### Known limitations and false positives of fallow

**Official:** https://fallow.tools/docs/analysis/limitations

**Purpose (source excerpt):** Known limitations of fallow: where it can miss a finding or report a false positive, and how to work around it for runtime patterns and framework edge cases.

**Covered operations:** See also

**Documented example:**
```text
{
 "compilerOptions": {
 "isolatedModules": true
 }
}
```

### Analyze production code only, without tests

**Official:** https://fallow.tools/docs/analysis/production-mode

**Purpose (source excerpt):** Production mode limits fallow findings to the code you ship. It excludes test files, story files, and devDependencies, and flags type-only dependencies.

**Covered operations:** What changes in production mode; Type-only dependency detection; Per-analysis production mode; See also

**Documented example:**
```text
fallow dead-code --production
```

### Find cold code with production runtime coverage

**Official:** https://fallow.tools/docs/analysis/runtime-coverage

**Purpose (source excerpt):** Runtime coverage shows which functions production traffic runs and which never run. Fallow merges it into fallow health, so you delete cold code on evidence.

**Covered operations:** What it tells you; Summary fields; Finding fields; Optimization target fields; Confidence thresholds; Static coverage vs runtime coverage; Accepted input; Production coverage: getting source attribution; First-run workflow; Review changed code; Trial and watermark behavior; See also

**Documented example:**
```text
fallow license activate --trial --email you@company.com
fallow coverage setup
fallow health --runtime-coverage ./coverage
```

### Find semantically similar functions in TypeScript

**Official:** https://fallow.tools/docs/analysis/similar-code

**Purpose (source excerpt):** Find similar functions in JavaScript and TypeScript that may do the same job under other names and syntax. A pinned local model finds them; a person decides.

**Covered operations:** Set up the local model; Find candidates; Focus the search; Inspect before judging; Record a separate verdict; Use it with an agent; Configure project defaults; Where it does not run; See also

**Documented example:**
```text
npm install --save-dev fallow-similar-code@<fallow version>
```

### Type-aware unused code checks for TypeScript

**Official:** https://fallow.tools/docs/analysis/type-aware

**Purpose (source excerpt):** Type-aware analysis confirms with the TypeScript checker that a symbol is unused before you delete it, with evidence for symbol usage and affected tests.

**Covered operations:** What this does not replace; Conservative results; Svelte virtual-module exports; Persistent configuration; Performance; Installation; Experimental tsrs backend; See also

**Documented example:**
```text
fallow type-aware status --format json --quiet
fallow dead-code --unused-class-members --type-aware --format json --quiet
fallow fix --type-aware --dry-run --format json --quiet
fallow dead-code --type-aware --symbol-impact src/api.ts:Client --format json --quiet
fallow health --type-aware --type-coupling --format json --quiet
```

## 7. Configuration

### Configuration

**Official:** https://fallow.tools/docs/configuration

**Purpose (source excerpt):** The Configuration pages of the Fallow documentation.

### Configure architecture boundaries and zones

**Official:** https://fallow.tools/docs/configuration/boundaries

**Purpose (source excerpt):** Architecture boundaries for TypeScript and JavaScript. Fallow reports each import that crosses a layer. Start from a built-in preset or define your own zones.

**Covered operations:** Presets; tsconfig rootDir detection; Custom zones; Auto-discovered zones; Custom rules; Type-only imports across boundaries; Merging presets with custom config; Example: override a preset zone; Boundary coverage; Forbidden calls; Inspecting boundaries; Common patterns; See also

**Documented example:**
```text
{
 "boundaries": {
 "preset": "bulletproof"
 }
}
```

### Fallow environment variables for CI and editors

**Official:** https://fallow.tools/docs/configuration/environment

**Purpose (source excerpt):** Fallow environment variables set defaults for a whole CI job, editor, or MCP server. Reference for FALLOW_FORMAT, FALLOW_QUIET, and the other variables.

**Covered operations:** FALLOW_FORMAT; FALLOW_QUIET; FALLOW_BIN; FALLOW_EXTENDS_TIMEOUT_SECS; FALLOW_CACHE_DIR; One cache directory for several projects; FALLOW_CACHE_MAX_SIZE; One cache directory for several projects; FALLOW_PACKAGE_BASELINES; FALLOW_AUDIT_BASE; FALLOW_AUDIT_CACHE_MAX_AGE_DAYS; FALLOW_IMPACT_STORE_MAX_AGE_DAYS; FALLOW_UPDATE_CHECK; NO_COLOR and CLICOLOR_FORCE

**Documented example:**
```text
export FALLOW_FORMAT=json
fallow dead-code # Outputs JSON without --format flag
```

### Configure fallow with .fallowrc.json or fallow.toml

**Official:** https://fallow.tools/docs/configuration/overview

**Purpose (source excerpt):** Configure fallow for a TypeScript or JavaScript project. Fallow runs with no config. Add .fallowrc.json or fallow.toml to set entry points, ignores, and rules.

**Covered operations:** Config file formats; Full example; Path globs; Config fields; Matching; Unmatched-entry warning; Matching; Glob patterns; URL extends; Unmatched config patterns; Redundant config entries; Override rules with no effect; Requested rules that are off; JSON Schema

**Documented example:**
```text
fallow init # Creates .fallowrc.json
fallow init --toml # Creates fallow.toml
```

### Set fallow rule severity to error, warn or off

**Official:** https://fallow.tools/docs/configuration/rules

**Purpose (source excerpt):** Fallow rule severity decides what fails the CI build. Set each issue type to error, warn, or off, and adopt fallow in CI one issue type at a time.

**Covered operations:** Severity levels; Configuration; Available rule names; Complexity rules; Levels in CI formats; Exit codes; See also

**Documented example:**
```text
{
 "rules": {
 "unused-files": "error",
 "unused-exports": "warn",
 "unused-types": "off",
```

### Suppress fallow findings with inline comments

**Official:** https://fallow.tools/docs/configuration/suppression

**Purpose (source excerpt):** Suppress a fallow false positive with a fallow-ignore comment, a JSDoc tag such as @public or @internal, or @expected-unused. The rule stays on for other code.

**Covered operations:** JSDoc visibility tags; @expected-unused JSDoc tag; Comment syntax; Suppressing complexity findings; Reference; Multi-kind markers and typos; Documenting suppressions with a reason; Issue type tokens; When to use suppression; Config-level vs inline suppression; See also

**Documented example:**
```text
/** @public */
export function createClient() {
 // Not imported anywhere in this repo, but consumed by users of the library
}

```

### Configure fallow for a monorepo with workspaces

**Official:** https://fallow.tools/docs/configuration/workspaces

**Purpose (source excerpt):** Monorepo analysis with no workspace setup. Fallow detects npm, yarn, pnpm, and Deno workspaces, resolves cross-package imports, and supports per-package config.

**Covered operations:** Workspace auto-detection; Nested pnpm projects; Missing pattern directories; Deno workspaces; Cross-workspace imports; Nested package manifests; Workspace dependency declarations; Pnpm content-addressable store; Workspace aliases; Gitignored workspace members; Package exports resolution; Output directory mapping; Per-package tsconfig.json; Scoping output to workspaces

**Documented example:**
```text
{
 "workspaces": [
 "packages/*",
 "apps/*"
 ]
```

## 8. Integrations

### Fallow integrations: agents, editors, and CI

**Official:** https://fallow.tools/docs/integrations

**Purpose (source excerpt):** Get fallow findings in your coding agent, your editor, and CI. Connect fallow through MCP, VS Code, Neovim, GitHub Actions, and GitLab CI.

**Covered operations:** Recommended starting point; See also

### Fallow Agent Skills for Claude Code and Cursor

**Official:** https://fallow.tools/docs/integrations/agent-skills

**Purpose (source excerpt):** Install the fallow Agent Skills in Claude Code, Cursor, Windsurf, or Gemini CLI. Your coding agent then runs fallow with the right flags and reads the output.

**Covered operations:** What's included; Installation; What agents can do after installation; Find cleanup opportunities; Clean up dependencies; Detect duplication; Auto-fix; CI setup; Debug false positives; Skills vs MCP vs CLI; See also

**Documented example:**
```text
/plugin marketplace add fallow-rs/fallow-skills
/plugin install fallow@fallow-skills
```

### Code health badge for your README

**Official:** https://fallow.tools/docs/integrations/badges

**Purpose (source excerpt):** Add a code health badge to your README. fallow shows the health score and letter grade of your project in a shields.io-compatible SVG badge.

**Covered operations:** Hosting the badge; Option 1: Commit to your repo; Option 2: Publish from CI (recommended); Option 3: Shields.io endpoint; Private repositories; Monorepo badges; Technical details; See also

**Documented example:**
```text
fallow health --format badge > badge.svg
```

### Fallow in GitHub Actions and GitLab CI

**Official:** https://fallow.tools/docs/integrations/ci

**Purpose (source excerpt):** Run fallow in GitHub Actions or GitLab CI on every pull request. Get SARIF upload, Code Quality reports, inline review comments, and baselines for changed code.

**Covered operations:** PR/MR comments; Consuming review envelopes from your own code; Duplication checks; Health checks; Exit codes; Mutation testing; Isolating parallel review jobs; Binary verification; PR/MR-only analysis; Gates; Degraded and empty analysis; Severity-aware PR gate (audit); Detecting silent failures; The three tracks together

**Documented example:**
```text
fallow: 8 issues found

Dead Code (3 issues)
| Type | File | Symbol | Line |
|------|------|--------|------|
```

### Claude Code hooks to block commits that fail fallow

**Official:** https://fallow.tools/docs/integrations/claude-hooks

**Purpose (source excerpt):** A Claude Code PreToolUse hook runs fallow audit before git commit or git push. When the audit fails, the hook blocks the command and sends the findings back.

**Covered operations:** Install it in one command; Install globally for every repo; Choose the harness; Keep .claude/ out of Git; Installer flags; Deprecated fallow setup-hooks; Run from a subdirectory; Commit or push in another worktree; Gate semantics; Block message; Comparison base; Version floor; Inspect hook state; Remove it

**Documented example:**
```text
fallow hooks install --target agent
```

### Fallow app for Codex: code health dashboard

**Official:** https://fallow.tools/docs/integrations/codex-app

**Purpose (source excerpt):** The fallow app for the Codex desktop app shows a code health dashboard, a Code Health tab per thread, a branch audit, a cleanup form, and a config editor.

**Covered operations:** Install; What the app adds; Settings; Known behavior in Codex; Security; See also

**Documented example:**
```text
codex plugin marketplace add fallow-rs/fallow-skills
codex plugin add fallow@fallow-skills
```

### MCP server for Claude Code, Cursor, and Windsurf

**Official:** https://fallow.tools/docs/integrations/mcp

**Purpose (source excerpt):** Connect fallow to Claude Code, Cursor, or Windsurf through MCP or the CLI. Your agent gets repeatable answers on unused code, duplication, and complexity.

**Covered operations:** Why agents need fallow; CLI: the primary agent interface; MCP: structured tool calling; Available MCP tools; Rust workspaces; Runtime source-map confidence; Review parameters that each call passes in one way; Review optional props absent from callers; Notable tool parameters; Structured actions in tool responses; Command-level next_steps[]; Run-level warnings[]; Resources; Combined output from bare fallow

**Documented example:**
```text
# Full dead code analysis with JSON output
fallow dead-code --format json

# Only check changed files (great for agent PR workflows)
fallow dead-code --changed-since main --format json
```

### Fallow for Neovim: LSP diagnostics

**Official:** https://fallow.tools/docs/integrations/neovim

**Purpose (source excerpt):** Set up fallow in Neovim with the built-in LSP client. See unused code, duplication, circular dependencies, and complexity as you edit, with code actions.

**Covered operations:** What works; Installation; Configuration; Issue-type toggles; Scope to changed files; Parse the project at startup; Project session between saves; Binary resolution; Verifying the setup; See also

**Documented example:**
```text
vim.lsp.config("fallow", {
 cmd = { "fallow-lsp" },
 filetypes = { "javascript", "typescript", "javascriptreact", "typescriptreact" },
 root_markers = { ".fallowrc.json", "package.json", ".git" },
 init_options = {
```

### Fallow Node.js bindings: programmatic API

**Official:** https://fallow.tools/docs/integrations/node-bindings

**Purpose (source excerpt):** Call fallow from Node.js code with the NAPI bindings. Get typed results and the same JSON envelopes as the CLI, with no CLI subprocess and no JSON parsing.

**Covered operations:** Install; Basic usage; API; Shared options; Dead-code options; Architecture options; Duplication options; Similar-code options; Feature flag options; Complexity / health options; Structured errors; When to use bindings vs the CLI; Limitations; See also

**Documented example:**
```text
npm install @fallow-cli/fallow-node
```

### VS Code extension for unused code and duplication

**Official:** https://fallow.tools/docs/integrations/vscode

**Purpose (source excerpt):** The fallow VS Code extension shows unused code, duplication, complexity hotspots, and boundary violations as you edit. Fix them with one-click quick fixes.

**Covered operations:** Features; Codebase intelligence surfaces; Installation; Status bar; Diagnostics; Related information; Finding ids; Severity levels; Tree views; Fix preview; Config autocomplete; Commands; Adopting fallow on a legacy codebase; See also

**Documented example:**
```text
git push origin refs/tags/fallow-baseline
git add .vscode/settings.json
git commit -m "chore: set fallow baseline"
```

## 9. Explanations

### How fallow analysis works

**Official:** https://fallow.tools/docs/explanations

**Purpose (source excerpt):** How fallow analysis works: why fallow reports a finding, so you can trust it and act on it. Covers production data, linters, health, duplication, and dead code.

**Covered operations:** See also

### Dead code findings explained: what to fix first

**Official:** https://fallow.tools/docs/explanations/dead-code

**Purpose (source excerpt):** Dead code findings in fallow explained: what each issue type means, which to fix first, and which are safe to keep, including class members and cycles.

**Covered operations:** Issue types; Unused files; Unused exports; Unused types; Private type leaks; Deprecated exports in use; Unused dependencies; Unused devDependencies; Unused optionalDependencies; Unused enum members; Unused class members; Unused namespace members; Unused store members; Unresolved imports

**Documented example:**
```text
type Props = { label: string; }; // private to the module

export function Component(p: Props): void {} // public, but Props leaks
```

### Duplicate code explained: clone groups and families

**Official:** https://fallow.tools/docs/explanations/duplication

**Purpose (source excerpt):** Duplicate code reports explained: how to read fallow dupes clone groups and families, how clone detection works, and which duplicated code to extract first.

**Covered operations:** Clone types; Detection modes in detail; Key metrics; Duplication percentage; Token count and line count; Instance count; Clone groups and families; Clone groups; Clone families; When duplication is acceptable; Interpreting --threshold results; How suffix-array detection works; Limitations; JSON _meta object

**Documented example:**
```text
● Duplicates (1 clone groups)

 196 lines 2 instances dup:6f87acd9
 src/lib/dutch-holidays.ts:193-388
 src/lib/dutch-holidays.ts:389-584
```

### Fallow vs ESLint, Biome, and oxlint

**Official:** https://fallow.tools/docs/explanations/fallow-vs-linters

**Purpose (source excerpt):** Fallow vs ESLint, Biome, and oxlint: a linter checks one file at a time, and fallow checks the project graph. Find what a linter misses and run both in CI.

**Covered operations:** Three pillars of code quality; Formatter; Linter; Codebase intelligence; What each tool finds; Detailed comparison; Unused exports; Unused files; Circular dependencies; Architecture boundary violations; Recommended CI pipeline; What to use when; See also

**Documented example:**
```text
fallow dead-code --unused-exports
```

### Code complexity and hotspot metrics explained

**Official:** https://fallow.tools/docs/explanations/health

**Purpose (source excerpt):** Code complexity metrics explained: what each value in fallow health output means, how fallow computes it, and how to find hotspots and refactoring targets.

**Covered operations:** Complexity metrics; Cyclomatic complexity; Cognitive complexity; Complexity density; Cyclomatic vs cognitive: a code example; Function names; Effect code; Synthetic <template> and <component> findings; File length; File health scores; Maintainability Index (MI); Fan-in, fan-out, and dead code ratio; Coupling concentration; Risk profiles

**Documented example:**
```text
cyclomatic-population:functions:count=1,sum=1,max=1
cyclomatic-population:modules:count=1,sum=31,max=31
cyclomatic-population:templates:count=0,sum=0,max=null
```

### Static analysis vs runtime coverage for dead code

**Official:** https://fallow.tools/docs/explanations/static-vs-runtime

**Purpose (source excerpt):** Static analysis vs production data: static analysis shows what is connected, production data shows what ran. Know which findings need production data.

**Covered operations:** What static intelligence sees; What static intelligence cannot see; What production data adds; Where they meet: fallow health; Mental model; Free vs paid layer; See also

### Fallow telemetry and privacy

**Official:** https://fallow.tools/docs/explanations/telemetry

**Purpose (source excerpt):** Fallow telemetry is opt-in and off by default. It sends no identifiers, and you can print the exact payload before you consent. Check what it sends.

**Covered operations:** What is never collected; Inspect what is sent; What is collected; Agent source; Transport and server privacy; Disabling everywhere; See also

**Documented example:**
```text
FALLOW_TELEMETRY=inspect fallow audit --format json --quiet
```

## 10. Frameworks

### Frameworks

**Official:** https://fallow.tools/docs/frameworks

**Purpose (source excerpt):** The Frameworks pages of the Fallow documentation.

### Built-in fallow plugins for Next.js, Vite and Jest

**Official:** https://fallow.tools/docs/frameworks/built-in

**Purpose (source excerpt):** Built-in fallow plugins detect Next.js, Vite, Jest, Tailwind, ESLint, and many other tools, so fallow knows the files and exports that each tool uses.

**Covered operations:** Jest configs; Nx run-commands targets; TypeORM migrations; Classes and enums that a library reads by reflection; OpenTelemetry SDK classes; Alchemy stacks; Webpack config directories; Webpack inline loader requests; Vite+; Egg.js and tegg; Module Federation; Runtime remotes; Trace the Federation source; Limits and diagnostics

**Documented example:**
```text
Active plugins:
 - nextjs
 - vite
 - vitest
 - playwright
```

### Write a custom fallow plugin in JSON or TOML

**Official:** https://fallow.tools/docs/frameworks/custom-plugins

**Purpose (source excerpt):** A custom fallow plugin stops false positives from an internal framework or unknown tool. Declare entry points, config files, and used exports in JSON or TOML.

**Covered operations:** Quick start; Supported formats; Detection strategies; Used exports; Used class members; Manifest-derived entries; Discovery order; Using the plugins config field; Examples; React Router; Internal tooling; Repo tooling that does not ship; JSON Schema; See also

**Documented example:**
```text
{
 "enablers": ["my-framework", "@myorg/"] // prefix matching with trailing /
}
```

### React and Next.js static analysis with fallow

**Official:** https://fallow.tools/docs/frameworks/react

**Purpose (source excerpt):** React and Next.js static analysis that finds wrong client and server directives, colliding routes, dead server actions, and unused or drilled props.

**Covered operations:** React Server Components directive rules; invalid-client-export; mixed-client-server-barrel; misplaced-directive; unused-server-action; Next.js App Router route rules; route-collision; dynamic-segment-name-conflict; React component health; Component render fan-in; unused-component-prop (React arm); prop-drilling (opt-in, default off); thin-wrapper (opt-in, default off); duplicate-prop-shape (opt-in, default off)

**Documented example:**
```text
{
 "rules": {
 "prop-drilling": "warn",
 "thin-wrapper": "warn",
 "duplicate-prop-shape": "warn"
```

## 11. CLI commands and schemas

### CLI reference

**Official:** https://fallow.tools/docs/cli

**Purpose (source excerpt):** The CLI reference pages of the Fallow documentation.

### fallow agent: set up Claude Code, Codex and Cursor

**Official:** https://fallow.tools/docs/cli/agent

**Purpose (source excerpt):** Set up fallow for Claude Code, Codex, and Cursor with one command. It installs AGENTS.md, the skill, the MCP server, and a commit and push gate.

**Covered operations:** Detection; What each step writes; Markers, idempotency, and uninstall; Options; Output; Gate readiness; See also

**Documented example:**
```text
fallow agent install --dry-run # show the plan first
fallow agent install # wire every detected harness
fallow agent status --format json
```

### fallow architecture: cycles, boundaries and shared state

**Official:** https://fallow.tools/docs/cli/architecture

**Purpose (source excerpt):** Find import cycles and boundary violations, or inspect an opt-in shared-state inventory in TypeScript and JavaScript projects.

**Covered operations:** Options; Selection; Scoping; Shared-state inventory; Relation to fallow dead-code; Example output; Exit codes; Baselines; Render a saved result; Examples; Bare fallow; See also

**Documented example:**
```text
fallow architecture
fallow architecture --cycles
fallow architecture --boundaries --changed-since main
```

### fallow audit: quality gate for pull requests

**Official:** https://fallow.tools/docs/cli/audit

**Purpose (source excerpt):** Quality gate for pull requests. fallow audit gives one pass, warn, or fail verdict for the changed files from dead code, complexity, and duplication checks.

**Covered operations:** Options; Base ref; Diff scoping; Gate; Output; Review brief; Scoping; Thresholds; Runtime coverage; Baselines; Verdict; JSON contract: which fields are severity-aware; Examples; Example output

**Documented example:**
```text
fallow audit
```

### fallow baselines prune: remove stale baseline entries

**Official:** https://fallow.tools/docs/cli/baselines

**Purpose (source excerpt):** Remove stale entries from committed fallow baselines. One whole-project run prunes the dead-code, health, and duplication baselines and never adds an entry.

**Covered operations:** What prune changes; Which files; Whole-project scope; Mode of the file; Skipped files; Pre-commit hook; Options; Exit codes; JSON output

**Documented example:**
```text
fallow baselines prune
```

### fallow ci: post PR and MR feedback from CI

**Official:** https://fallow.tools/docs/cli/ci

**Purpose (source excerpt):** Reference for fallow ci: post or update the sticky PR comment, post inline reviews, resolve fixed review threads, and post GitHub Check Runs from rendered fallow output.

**Covered operations:** Input files; Authentication; ci plan-pr-comment; ci post-pr-comment; ci post-review; ci reconcile-review; ci post-check-run; Exit codes; See also

**Documented example:**
```text
fallow dead-code --format pr-comment-github --quiet > fallow-comment.md
fallow ci post-pr-comment --provider github --pr 42 \
 --body fallow-comment.md --marker-id fallow-results
```

### fallow ci-template: print or vendor the GitLab CI template

**Official:** https://fallow.tools/docs/cli/ci-template

**Purpose (source excerpt):** Print the fallow GitLab CI template, or vendor it with its helper scripts into your repository so pipelines run without a download from GitHub.

**Covered operations:** ci-template gitlab; Options; See also

**Documented example:**
```text
fallow ci-template gitlab # print the template on stdout
fallow ci-template gitlab --vendor # write the template and the helper scripts
fallow ci-template gitlab --vendor ci-dir # write them below another directory
```

### fallow cloud: log in to Fallow Cloud from the CLI

**Official:** https://fallow.tools/docs/cli/cloud

**Purpose (source excerpt):** Log in to Fallow Cloud from the CLI without copying an API key. fallow cloud login runs the device flow and stores a read-only key in the OS keychain.

**Covered operations:** Log in; Where the key goes; Key order; Log out; See also

**Documented example:**
```text
fallow cloud login
fallow cloud logout
```

### fallow config: print the resolved configuration

**Official:** https://fallow.tools/docs/cli/config

**Purpose (source excerpt):** Print the resolved fallow configuration and the file that fallow loaded, to find out why a setting is not applied. It works like eslint --print-config.

**Covered operations:** Options; Exit codes; Examples; Verify which config the LSP/CLI picked up; Use an explicit config file; Pipe to jq for further inspection; Detect "no config" in scripts; See also

**Documented example:**
```text
fallow config
```

### fallow config-schema: print the config JSON Schema

**Official:** https://fallow.tools/docs/cli/config-schema

**Purpose (source excerpt):** Print the JSON Schema of the fallow config file. Use it for editor autocomplete and validation of .fallowrc.json, .fallowrc.jsonc, and fallow.toml.

**Covered operations:** Use the schema in your editor; Options; Related schema commands; See also

**Documented example:**
```text
fallow config-schema
fallow config-schema > schema.json
```

### fallow coverage: find unused code with runtime coverage

**Official:** https://fallow.tools/docs/cli/coverage

**Purpose (source excerpt):** Runtime coverage shows which code runs in production and which code you can delete. fallow coverage analyzes it and uploads source maps and the inventory.

**Covered operations:** setup; Flags; Fallow Cloud plan; What setup detects automatically; Agent-readable JSON; Generated recipe; Typical flow; analyze; Analyze flags; review-packet; Review-packet flags; deployment-changes; Deployment-changes flags; Exit codes of the cloud reads

**Documented example:**
```text
fallow coverage setup # resumable first-run flow
fallow coverage setup --cloud # Fallow Cloud plan: beacon, CI steps, one commit SHA
fallow coverage analyze --cloud --repo owner/repo
fallow coverage upload-inventory # push a static function inventory
fallow coverage upload-source-maps # upload build source maps for bundled code
```

### fallow dead-code: find unused exports and dependencies

**Official:** https://fallow.tools/docs/cli/dead-code

**Purpose (source excerpt):** Find unused files, exports, dependencies, and types in TypeScript and JavaScript. fallow dead-code traces code from your entry points and reports the rest.

**Covered operations:** Options; Output; Filtering; Scoping; Type-aware TypeScript evidence; Incremental; Regression detection; Search visibility in traces; Plugin credits in traces; Examples; Gate on dependency findings; Fail only when a package is unused; Use --ci without the placement findings; Regression detection

**Documented example:**
```text
fallow dead-code
fallow check # Hidden alias for fallow dead-code
```

### fallow decision-surface: find the decisions to review

**Official:** https://fallow.tools/docs/cli/decision-surface

**Purpose (source excerpt):** Find the structural decisions in a code change that need a human judgment call. fallow decision-surface prints each one as a question with the expert to ask.

**Covered operations:** When to reach for it; What a decision is; What each decision carries; How an agent consumes it; Picking the comparison point; Options; Examples; Example output; JSON output; MCP tool; See also

**Documented example:**
```text
fallow decision-surface --base main
fallow decision-surface --base main --format json --quiet
fallow decision-surface --base main --max-decisions 5
```

### fallow doctor: check your project setup

**Official:** https://fallow.tools/docs/cli/doctor

**Purpose (source excerpt):** Check if fallow sees your project correctly before you trust its results. fallow doctor runs read-only checks on config, workspaces, plugins, and caches.

**Covered operations:** Checks; Options; Exit codes; Human output; JSON output; For agents; See also

**Documented example:**
```text
fallow doctor
fallow doctor --format json
```

### fallow dupes: find duplicate and copy-pasted code

**Official:** https://fallow.tools/docs/cli/dupes

**Purpose (source excerpt):** Find duplicate code in TypeScript and JavaScript projects. fallow dupes detects copy-pasted code blocks with suffix-array analysis and configurable thresholds.

**Covered operations:** Options; Detection; Output; Incremental; Monorepo scoping; Debugging; Detection modes; Ranking and JSON fields; Shown versus measured; Symlinked files; Exit codes; Examples; Example output; JSON output

**Documented example:**
```text
fallow dupes
```

### fallow explain: what a finding means and how to fix it

**Official:** https://fallow.tools/docs/cli/explain

**Purpose (source excerpt):** Learn what a fallow finding means and how to fix it. fallow explain prints the rationale, an example, fix guidance, and a docs link for one issue type.

**Covered operations:** Arguments; Output; MCP tool; See also

**Documented example:**
```text
fallow explain unused-export
fallow explain fallow/code-duplication --format json --quiet
```

### fallow fix: remove unused exports and dependencies

**Official:** https://fallow.tools/docs/cli/fix

**Purpose (source excerpt):** Remove unused exports and dependencies automatically. fallow fix edits your TypeScript and JavaScript files in place, with a dry-run preview and JSON output.

**Covered operations:** Options; What gets fixed; Catalog entries; Missing config file; On-disk drift protection; Low-confidence export removals; Incomplete source evidence; File encoding contract; Dry-run config diff; Examples; Example output; See also

**Documented example:**
```text
fallow fix
```

### fallow flags: find feature flags in your codebase

**Official:** https://fallow.tools/docs/cli/flags

**Purpose (source excerpt):** Find feature flags in TypeScript and JavaScript code to review and retire them. fallow flags detects environment variable gates, SDK calls, and config toggles.

**Covered operations:** Options; Output; Retirement; Scoping; Performance; CI; Regression; Detection categories; Flag names from a registry; Guards; Retirement report; Reasons; Flag age; Vendor flag state

**Documented example:**
```text
fallow flags
```

### Global CLI flags for every fallow command

**Official:** https://fallow.tools/docs/cli/global-flags

**Purpose (source excerpt):** Global CLI flags that work the same on every fallow command: project root, config, output format, scope, cache, workspaces, score, trend, and snapshot options.

**Covered operations:** Reference; Save destinations; Quiet runs; Parse error gate; Baseline growth gate; Path scope; Repository-root paths in CI formats; Request outcomes; Loaded config disclosure; Examples; Per-analysis production mode; Grouped output; Incremental caching; See also

**Documented example:**
```text
fallow dead-code --baseline fallow-baselines/dead-code.json \
 --fail-on-baseline-growth --baseline-base origin/main
```

### fallow guard: architecture rules for a file before you edit

**Official:** https://fallow.tools/docs/cli/guard

**Purpose (source excerpt):** Check the architecture rules for a file before you edit it. fallow guard reports the boundary zone, allowed imports, forbidden calls, and rule-pack policies.

**Covered operations:** Output; Files that do not exist yet; Paths outside every zone; Options; Exit codes; JSON output; Suppression tokens; For agents; See also

**Documented example:**
```text
fallow guard src/ui/App.ts
fallow guard src/ui/App.ts src/db/query.ts --format json
```

### fallow health: find complex code and refactoring targets

**Official:** https://fallow.tools/docs/cli/health

**Purpose (source excerpt):** Find complex functions and files and the best places to refactor first. fallow health combines cyclomatic and cognitive complexity, git churn, and coverage.

**Covered operations:** Options; Thresholds; Output; Section selection; Type-aware coupling; Mutation report; Health score options; Hotspot options; Scoping; Snapshots & trends; Baseline; Exit codes; File score metrics; Hotspot metrics

**Documented example:**
```text
fallow health
```

### fallow hooks: install Git and agent hooks

**Official:** https://fallow.tools/docs/cli/hooks

**Purpose (source excerpt):** Install, remove, and inspect the fallow-managed Git pre-commit hook and the Claude Code and Codex gate that runs fallow audit before git commit and git push.

**Covered operations:** hooks status; hooks install; Git target; Agent target; hooks uninstall; Exit codes; See also

**Documented example:**
```text
fallow hooks status
fallow hooks install --target git
fallow hooks install --target agent
fallow hooks uninstall --target agent
```

### fallow impact: a local report of fallow results

**Official:** https://fallow.tools/docs/cli/impact

**Purpose (source excerpt):** See what fallow has done in a project. fallow impact is a local-only report of current findings, the trend, commits stopped at the gate, and resolved findings.

**Covered operations:** Status bars; Across all your repos; What it tracks; The weekly digest; Storage and cleanup; Store from a newer fallow; JSON output; See also

**Documented example:**
```text
fallow impact enable # track this project (overrides the global default)
fallow impact # render the value report (also prints the store path)
fallow impact status # tracking state and history size
fallow impact statusline # print one stable line for a status bar
fallow impact disable # stop tracking this project (history is retained)
```

### fallow init: create a fallow config file

**Official:** https://fallow.tools/docs/cli/init

**Purpose (source excerpt):** Create a fallow config file with editor autocomplete and validation. fallow init generates a .fallowrc.json or fallow.toml file with schema support.

**Covered operations:** Options; Agent guide scaffold; Pre-commit hook; Prune baselines; Custom base branch; Gitignore; Output; See also

**Documented example:**
```text
fallow init
```

### fallow inspect: all context for one file or export

**Official:** https://fallow.tools/docs/cli/inspect

**Purpose (source excerpt):** Get all context for one file or export before you edit it: trace, dead code, duplication, complexity, security, and optional Fallow Cloud production data.

**Covered operations:** Target; Evidence flags; Output; Production data; Compact output; MCP parity; See also

**Documented example:**
```text
fallow inspect --file src/api.ts --format json --quiet
fallow inspect --symbol src/api.ts:fetchUser --format json --quiet
```

### fallow license: activate a trial or license

**Official:** https://fallow.tools/docs/cli/license

**Purpose (source excerpt):** Activate a fallow trial or license to turn on continuous runtime coverage. fallow license also shows status, refreshes a license, or removes the local token.

**Covered operations:** Subcommands; activate; status; refresh; deactivate; Storage and precedence; Exit behavior; Grace period; Runtime coverage runs; Actionable error messages; Clock skew; See also

**Documented example:**
```text
fallow license status
```

### fallow list: show files, entry points and plugins

**Official:** https://fallow.tools/docs/cli/list

**Purpose (source excerpt):** Debug your fallow setup. fallow list shows the discovered files, entry points, active plugins, boundary zones, workspaces, and the import weight of each entry.

**Covered operations:** Options; Entry points; Startup import weight; The unit is source bytes; Imports that keep the most bytes eager; JSON output; Gate the startup weight in CI; Examples; Workspace diagnostics; Example output; See also

**Documented example:**
```text
fallow list
```

### fallow migrate: convert knip, jscpd or stylelint config

**Official:** https://fallow.tools/docs/cli/migrate

**Purpose (source excerpt):** Migrate from knip, jscpd, or stylelint to fallow and keep your settings. fallow migrate converts your existing configuration to the fallow config format.

**Covered operations:** Options; What it detects; Examples; See also

**Documented example:**
```text
fallow migrate
```

### Mutation testing with fallow mutation

**Official:** https://fallow.tools/docs/cli/mutation

**Purpose (source excerpt):** Mutation testing for JavaScript and TypeScript. fallow mutation changes your code, runs Vitest, node:test, or bun test, and reports changes no test detects.

**Covered operations:** Commands; Scope; Supplied patches; Copied and renamed files; Function scope; Source files; Plan without running code; Runner version in the plan; Run the tests; Runners; Runner config; Example output; Progress; Run options

**Documented example:**
```text
fallow mutation
```

### fallow plugin-check: debug a custom plugin

**Official:** https://fallow.tools/docs/cli/plugin-check

**Purpose (source excerpt):** See why a custom fallow plugin does not activate or seeds no entries. plugin-check is a read-only dry run that shows the matches of each manifestEntries rule.

**Covered operations:** What it reports; Warnings; Options; JSON output; See also

**Documented example:**
```text
fallow plugin-check
fallow plugin-check --format json
fallow plugin-check --format json --root packages/app
```

### fallow plugin-schema: print the plugin JSON Schema

**Official:** https://fallow.tools/docs/cli/plugin-schema

**Purpose (source excerpt):** Print the JSON Schema of external fallow plugin files. Use it for editor autocomplete and validation while you write a fallow-plugin file.

**Covered operations:** Use the schema in your editor; Options; See also

**Documented example:**
```text
fallow plugin-schema
fallow plugin-schema > plugin-schema.json
```

### fallow recommend: get a proposed fallow config

**Official:** https://fallow.tools/docs/cli/recommend

**Purpose (source excerpt):** Get a proposed fallow config for your project and review it before you write it. fallow recommend is read-only and explains each decision behind the proposal.

**Covered operations:** Decision tiers; Options; JSON output; See also

**Documented example:**
```text
fallow recommend
fallow recommend --format json
```

### fallow report: render saved results for CI

**Official:** https://fallow.tools/docs/cli/report

**Purpose (source excerpt):** Analyze once, then render every CI output from the saved JSON result. fallow report writes summaries, PR comments, annotations, and inline reviews.

**Covered operations:** Finding levels; Options; Mutation results; Exit code; See also

**Documented example:**
```text
fallow dead-code --type-aware --format json -o results.json
fallow report --from results.json --format github-annotations
fallow report --from results.json --format pr-comment-github > comment.md
fallow report --from results.json --format review-github > review.json
```

### fallow rule-pack: create, list, and test rule packs

**Official:** https://fallow.tools/docs/cli/rule-pack

**Purpose (source excerpt):** Manage declarative fallow rule packs (policy as code). Create a pack from a template, list the configured rules, and test a pack against your project.

**Covered operations:** rule-pack init; rule-pack list; rule-pack test; rule-pack schema; Options; See also

**Documented example:**
```text
fallow rule-pack init
fallow rule-pack test rule-packs/team-policy.jsonc
fallow rule-pack list --format json
```

### fallow rule-pack-schema: print the rule pack JSON Schema

**Official:** https://fallow.tools/docs/cli/rule-pack-schema

**Purpose (source excerpt):** Print the JSON Schema of fallow rule pack files. Use it for editor autocomplete and validation of the policy rules in a rule pack.

**Covered operations:** Use the schema in your editor; Options; See also

**Documented example:**
```text
fallow rule-pack-schema
fallow rule-pack-schema > rule-pack-schema.json
```

### fallow schema: print the capability manifest

**Official:** https://fallow.tools/docs/cli/schema

**Purpose (source excerpt):** Print the full fallow capability manifest as one JSON document: commands, issue types, MCP tools, plugins, and environment variables, for agents and tooling.

**Covered operations:** Top-level blocks; Issue type rows; Examples; See also

**Documented example:**
```text
fallow schema
```

### fallow security: find secret leaks and unsafe sinks

**Official:** https://fallow.tools/docs/cli/security

**Purpose (source excerpt):** Find security candidates in TypeScript and JavaScript: server secrets that reach client code, and untrusted values that reach dangerous sinks. Opt-in and local.

**Covered operations:** Options; Output; Scoping; Performance; Runtime coverage; Regression gate; Rule: client-server-leak; Rule: tainted-sink (catalogue); Sanitizer-aware suppression; Enabling categories; Suppression; Per-path severity; JSON output; Agent-actionable candidate record

**Documented example:**
```text
fallow security
```

### Verify fallow security candidates with an agent

**Official:** https://fallow.tools/docs/cli/security-agent-verification

**Purpose (source excerpt):** Verify fallow security candidates with a coding agent and keep only the survivors that a verifier cannot dismiss. fallow itself makes no model calls.

**Covered operations:** Inputs; Verifier packet; Prompt contract; Verdict schema; Finding identity migration; Render survivors; Caveats; See also

**Documented example:**
```text
fallow security --format json --surface --quiet > fallow-security.json
```

### fallow similar-code: find semantically similar functions

**Official:** https://fallow.tools/docs/cli/similar-code

**Purpose (source excerpt):** Reference for fallow similar-code: flags, subcommands, and exit codes. Find functions that may do the same job with a pinned local model, then inspect and review them.

**Covered operations:** Discovery options; Subcommands; Exit codes; See also

**Documented example:**
```text
fallow similar-code status
fallow similar-code setup --local
fallow similar-code --format json --quiet > similar-code.json
fallow similar-code inspect <CANDIDATE_ID> --candidates similar-code.json
fallow similar-code review --candidates similar-code.json --verdicts verdicts.json
```

### fallow suppressions: list every fallow-ignore comment

**Official:** https://fallow.tools/docs/cli/suppressions

**Purpose (source excerpt):** List every finding that your team chose to ignore, and why. fallow suppressions lists each fallow-ignore marker by file with its reason and a stale count.

**Covered operations:** Options; JSON output; MCP tool; See also

**Documented example:**
```text
fallow suppressions
```

### fallow telemetry: control opt-in telemetry

**Official:** https://fallow.tools/docs/cli/telemetry

**Purpose (source excerpt):** Control what fallow sends and see the exact payload first. fallow telemetry manages opt-in telemetry, off by default: status, enable, disable, or inspect.

**Covered operations:** Subcommands; status; enable / disable; inspect; Precedence; Environment controls; Agent source; See also

**Documented example:**
```text
fallow telemetry status
```

### fallow trace: find callers and import paths

**Official:** https://fallow.tools/docs/cli/trace

**Purpose (source excerpt):** See what calls an exported symbol and what it calls before you change it, or how one module comes to import another. fallow trace uses the module graph.

**Covered operations:** Target; Options; How it works; Ambiguous star exports; Usage of a package; Import path between two modules; See also

**Documented example:**
```text
fallow trace src/api.ts:fetchUser --format json --quiet
fallow trace src/api.ts:fetchUser --callers --depth 2
fallow trace --path src/app.ts src/db.ts
fallow trace --dependency date-fns --format json --quiet
```

### fallow trace-error: map a stack trace to your code

**Official:** https://fallow.tools/docs/cli/trace-error

**Purpose (source excerpt):** Map a runtime stack trace to the definitions in your code. fallow trace-error resolves each frame against the module graph, without reading source maps.

**Covered operations:** What it refuses to do; Options; Human output; JSON output; Key fields; For agents; See also

**Documented example:**
```text
fallow trace-error crash.txt
cat crash.txt | fallow trace-error
fallow trace-error - --format json --quiet
```

### fallow type-aware: check the TypeScript companion

**Official:** https://fallow.tools/docs/cli/type-aware

**Purpose (source excerpt):** Check that the optional fallow-type-aware companion is installed and compatible before you use --type-aware. The status command does not analyze the project.

**Covered operations:** type-aware status; Options; See also

**Documented example:**
```text
fallow type-aware status
fallow type-aware status --format json --quiet
```

### fallow viz: visualize your codebase as an HTML map

**Official:** https://fallow.tools/docs/cli/viz

**Purpose (source excerpt):** Visualize dead code, duplication, boundary violations, and complexity in your codebase. fallow viz writes one HTML map with a treemap and an import graph.

**Covered operations:** The two views; The four lenses; Options; Text formats; See also

**Documented example:**
```text
fallow viz # writes fallow-viz.html and opens it in your browser
fallow viz --out map.html --no-open
fallow viz --viz-format dot # emit the import graph as Graphviz DOT
fallow viz --viz-format mermaid # emit the import graph as a Mermaid diagram
```

### fallow watch: dead code analysis on every save

**Official:** https://fallow.tools/docs/cli/watch

**Purpose (source excerpt):** Get dead code results each time you save a file. fallow watch re-runs dead code analysis in your TypeScript and JavaScript project when files change.

**Covered operations:** Examples; Options; Example output; See also

**Documented example:**
```text
fallow watch
```

### fallow workspaces: inspect monorepo workspace discovery

**Official:** https://fallow.tools/docs/cli/workspaces

**Purpose (source excerpt):** List the monorepo workspaces that fallow discovers, with diagnostics for malformed package.json files, unmatched globs, and missing tsconfig references.

**Covered operations:** Output; Options; See also

**Documented example:**
```text
fallow workspaces
fallow workspaces --format json
```

## 12. Migration

### Migration

**Official:** https://fallow.tools/docs/migration

**Purpose (source excerpt):** The Migration pages of the Fallow documentation.

### dependency-cruiser alternative: compare with fallow

**Official:** https://fallow.tools/docs/migration/from-dependency-cruiser

**Purpose (source excerpt):** Compare dependency-cruiser rules with fallow boundaries, cycles, and dependency checks for TypeScript and JavaScript. See which rules map and which have no fallow equivalent.

**Covered operations:** Rule mapping; Write the boundaries; Orphans and unused files; What dependency-cruiser does better; What fallow adds; Move a dependency-cruiser check to fallow; See also

**Documented example:**
```text
{
 "forbidden": [
 {
 "name": "ui-not-to-db",
 "severity": "error",
```

### jscpd alternative: migrate to fallow duplication

**Official:** https://fallow.tools/docs/migration/from-jscpd

**Purpose (source excerpt):** Migrate from jscpd to fallow. One command converts your jscpd config to fallow duplication settings for TypeScript and JavaScript. See how detection modes map.

**Covered operations:** Migration workflow; What gets migrated; Detection mode mapping; Other analyses; See also

**Documented example:**
```text
fallow dupes --mode strict
```

### knip alternative: migrate from knip to fallow

**Official:** https://fallow.tools/docs/migration/from-knip

**Purpose (source excerpt):** Migrate from knip to fallow. One command converts your knip config to a fallow config. See what the command migrates and what to check after the move.

**Covered operations:** Migration workflow; What gets migrated; Production entries; Per-workspace settings; Warnings and caveats; FAQ; See also

**Documented example:**
```text
Warning (1):
 [knip] `rules.unsued-files`: unknown knip issue type `unsued-files`; not migrated (suggestion: check for a typo or report the missing mapping at https://fallow.tools/docs/migration/from-knip/)
```

### madge alternative: compare madge with fallow

**Official:** https://fallow.tools/docs/migration/from-madge

**Purpose (source excerpt):** Compare madge with fallow for circular dependencies, orphan files, and dependency graphs in TypeScript and JavaScript. See which madge command maps to which fallow command.

**Covered operations:** Command mapping; Orphans and unused files; What madge does better; What fallow adds; Move a madge check to fallow; See also

**Documented example:**
```text
fallow architecture --cycles
```

### stylelint and fallow: migrate selector complexity rules

**Official:** https://fallow.tools/docs/migration/from-stylelint

**Purpose (source excerpt):** Convert the selector complexity rules of your stylelint config to fallow styling analysis. See what fallow migrates and which rules stay in stylelint.

**Covered operations:** Migration workflow; What gets migrated; Warnings and caveats; See also

**Documented example:**
```text
Warning (1):
 [stylelint] `rules`: no Stylelint rules object found to map (suggestion: keep Stylelint for formatting and syntax linting)
```

### ts-prune alternative: find unused exports with fallow

**Official:** https://fallow.tools/docs/migration/from-ts-prune

**Purpose (source excerpt):** Compare ts-prune with fallow for unused exports in TypeScript. See which ts-prune option maps to which fallow setting, and how the two tools resolve symbols.

**Covered operations:** Option mapping; How the two tools resolve symbols; What ts-prune does better; What fallow adds; Move a ts-prune check to fallow; See also

**Documented example:**
```text
fallow dead-code --unused-exports --type-aware
```

## 13. Coverage, provenance and verification status

**Captured:** 97 official pages. **Four 404 requests:** /docs/getting-started/installation, /docs/getting-started/quickstart, /docs/getting-started/adoption and /docs/cli/review. Correct canonical getting-started URLs /docs/installation, /docs/quickstart and /docs/adoption were captured. The installed CLI advertises review, but the guessed /docs/cli/review path did not exist; check installed help rather than inventing a docs URL.

**Verified:** signed Fallow 3.42.0 executable, existing three-surface policy file, successful official-site fetches, 97-page source archive. **Not verified/executed:** Fallow MCP invocation, optional type-aware companion installation, full repo scan, application tests/build/deployment. The page corpus may evolve; check installed --help and official docs for newly released features.

**Recommended reporting format:** TASK | FALLOW COMMAND / VERSION | SOURCE REVISION | CONFIG HASH | FINDING / LOCATION | GRAPH OWNER + CONSUMERS | SOURCE PROOF | UNKNOWN / NEXT. Do not call a static finding TESTED or DEPLOYED.
