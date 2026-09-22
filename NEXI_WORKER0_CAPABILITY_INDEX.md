# NEXI Worker-0 Capability Index

Purpose: lightweight NEXI capability overlay for Worker 0. Global capability ownership lives in `/home/mellonelay1999/.agents/GLOBAL_CAPABILITY_INDEX.md`; read this file after `/home/mellonelay1999/RDC_ONBOARDING.md` only when the task needs NEXI-specific capability selection.

## Operating rule

`KNOWN CAPABILITY != REQUIRED CAPABILITY`.

Use the smallest precise owner that can answer the task. Reuse proven routing while unchanged. Discover mutable version/auth/schema/health only when consequential.

Do not preload the MCP catalog, CLI catalog, Graphify guide, DeepWiki guide, and browser guide at startup. Read only the specialist reference required for the current task.

## Fast routing matrix

| Need | Primary owner | Add only when useful |
|---|---|---|
| engineering workflow/method | Agent Skills `using-agent-skills` + phase skill | Agent Kernel for durable governance |
| optional lifecycle/recovery/delegation | Get-Fable | only when persistent lifecycle state materially helps |
| specialist domain expertise | selected Riqor specialist | never a proof/completion/controller gate |
| durable governance/architecture memory | Agent Kernel | project `.agent-kernel` overlay when present |
| exact file/text/path | native RDC filesystem/search, `rg`, `fd` | `ast-grep` for AST-aware matching |
| structured JSON/data/file analysis | persistent Python or Node | `jq` for simple transforms |
| Git source/history/PR | Git / GitHub CLI | Graphify only for structural impact |
| repository topology/ownership/path/blast radius | Graphify L0/L1 | direct source for implementation truth |
| advanced cross-view graph forensics | `graphify-multiview` L2/L3 | Fallow + CodeScene + DeepWiki + direct source/runtime; do not default to Omnipotent |
| semantic repository meaning/context | DeepWiki | direct source/tests/runtime for proof |
| TS/JS dead-code/change-safety/duplication | Fallow | Graphify when consumer topology is uncertain |
| hotspots/code health/change risk | CodeScene | Graphify for topology |
| current library/framework semantics | Context7 | official docs when platform-specific |
| NestJS framework/runtime diagnosis | repository-local Nest CLI + installed NestJS specialist skills | Nest Observe MCP when credentials exist; Cloudflare runtime/observability for deployed truth |
| broader external research | Context.dev / current official sources | Parallel/web research when needed |
| Cloudflare/D1/Queues/Workflows/R2/Pipelines/Containers | project Wrangler + Cloudflare tooling | Cloudflare docs/MCP for current semantics |
| Aiven/Valkey | `avn` + `redis-cli` | runtime/service evidence; never D1/Ledger/financial authority |
| runtime errors/traces/issues | Sentry + direct runtime/HTTP | source/tests to reproduce/corroborate |
| deterministic local browser flow | Playwright / `playwright-cli` | Chrome DevTools for deep inspection |
| responsive multi-viewport inspection | Polypane | Chrome DevTools MCP via CDP |
| DOM/a11y/network/performance browser debugging | Chrome DevTools MCP | Playwright for reproducible flow |
| real browser/device confirmation | BrowserStack | only after local candidate is stable |
| targeted frontend review guidance | Ponytail | not a browser/runtime authority |
| substantial bounded implementation/refactor | Codex | only when separate reasoning context materially helps |
| substantial independent audit/verification | Kilo | only when independent reasoning materially helps |

## Important combinations

- Graphify + Fallow = structural impact + TS/JS change-safety/dead-code evidence.
- Graphify + CodeScene = structural centrality/ownership + hotspot/change-risk.
- DeepWiki + Context7 = local implementation semantics + current framework/library semantics.
- RDC filesystem/search + Graphify = exact source + topology.
- Playwright + Chrome DevTools = deterministic flow + DOM/network/console/performance evidence.
- Polypane + Chrome DevTools = responsive multi-pane surface + inspection/control.
- Playwright -> Polypane/Chrome DevTools -> BrowserStack = local validation -> responsive/debugging -> selected real-device confirmation.
- Wrangler + Cloudflare MCP/docs = operator state + current platform semantics.
- `avn` + `redis-cli` = service control/state + protocol-level Valkey evidence.
- Sentry + direct runtime/HTTP = telemetry + reproduced behavior.
- Git/GitHub + Graphify = source frontier/history + structural impact.

Never invoke a combo merely because it exists. Each member must answer a distinct question.

## Routing canaries

- **A. Structural impact of `WalletService`** -> Graphify guide -> live Graphify status/schema if needed -> `affected` / path / impact -> direct source verification.
- **B. Semantic understanding of wallet deposit configuration** -> DeepWiki -> direct source -> backend/runtime proof only if the question requires behavior.
- **C. Dead TS code after frontend repair** -> Fallow + direct source; add Graphify only when structural consumer uncertainty remains.
- **D. Responsive Wallet drawer** -> Playwright / Polypane + Chrome DevTools; BrowserStack only when real-device confirmation is materially justified.
- **E. Cloudflare D1 state** -> project Wrangler / Cloudflare tooling; Graphify/DeepWiki are not platform authority.
- **F. Valkey stream state** -> Aiven / `redis-cli`; never D1/Ledger/financial authority.
- **G. Two-line known source fix** -> direct source/RDC + focused invalidated verification; no full capability discovery.

## Detailed references

- MCP surface: `NEXI_WORKER0_MCP_CATALOG.md`
- CLI/operator surface: `NEXI_WORKER0_CLI_CATALOG.md`
- Cloudflare backend/operator authority: `NEXI_CLOUDFLARE_BACKEND_OPERATOR_RUNBOOK.md`
- Browser fabric: `NEXI_WORKER0_BROWSER_FABRIC.md`
- Graphify: `NEXI_GRAPHIFY_COMPLETE_READING_AND_USAGE_GUIDE.md`
- DeepWiki: `NEXI_DEEPWIKI_COMPLETE_USAGE_GUIDE.md`
- Project router: `NEXI_CODEX_CAPABILITY_ROUTING.md`
- Worker mechanics: `/home/mellonelay1999/RDC_ONBOARDING.md`

## New-worker startup

1. Read `/home/mellonelay1999/RDC_ONBOARDING.md`.
2. Read this index.
3. Classify the complete owner task.
4. Emit the required compact `ROUTING` declaration.
5. Read only the relevant specialist guide/catalog.
6. Discover live status/schema only where needed.
7. Execute.

Do not turn capability knowledge into a new discovery phase.

## Authority boundary

ChatGPT is parent controller. GitHub `main` is durable source authority. Cloudflare Worker + Container is backend execution/runtime authority. RDC Worker 0 is an operator/recovery/tooling plane only and must not host a competing backend runtime. Tool availability does not expand mutation or production authority.

NestJS = business/domain authority. D1 = durable application/financial relational truth. Ledger = accounting truth. EventOutbox = durable publication boundary. Aiven Valkey = realtime/cache/Streams only. Queues = delivery/retry. Workflows = orchestration. Cloudflare Worker = edge/routing and Cloudflare Container = backend execution/runtime. Public/Admin = consumer/control surfaces.
