# NEXI Cloudflare Backend Operator Runbook

**Authority date:** 2026-09-17 (Myanmar time)
**Status:** CURRENT backend runtime/operator authority

## Authority

- GitHub `main` = durable source authority.
- Cloudflare Worker + Container = the only active backend execution/runtime authority.
- NestJS = business/domain authority inside the Cloudflare backend.
- D1 = durable application/financial relational truth.
- Ledger = accounting truth.
- EventOutbox = durable publication boundary.
- Aiven Valkey = realtime/cache/Streams only.
- Queues = delivery/retry; Workflows = orchestration; Worker = edge/routing.
- Worker 0 / VM = operator, recovery, source-analysis, and tooling plane only. It must not host a competing backend runtime after the 2026-09-17 convergence.

## Permanent Cloudflare documentation gate

Before implementing, configuring, deploying, or making configuration-driven debugging changes to any Cloudflare product:

`TASK -> IDENTIFY PRODUCT -> READ CURRENT OFFICIAL DOCS -> INSPECT CURRENT WRANGLER/MCP HELP -> RECONCILE WITH NEXI CONFIG -> OPERATE -> VERIFY`

This applies to Workers, Wrangler, Containers, D1, Queues, Workflows, R2, Pipelines, Durable Objects, bindings, secrets, routes/domains, versions/deployments/rollback, observability/logging, networking, and any later Cloudflare product.

Never retry a failed Wrangler command blindly. Read the actual error, re-check the exact product docs/help, identify the causal owner, and retry only when justified. Capability discovery does not grant mutation authority.

## Current operator baseline discovered during convergence

The repository manifests and lockfile pin Wrangler `4.127.1`. During the 2026-09-17 transition, the repo-local binary was absent and the verified installed global operator was `4.129.0`; upstream help advertised a newer release. These are volatile facts. Do not silently update the repository pin. Before consequential work, discover the currently callable Wrangler version and exact subcommand help again.

Current source config: `cloudflare-container-bootstrap/wrangler.jsonc`.
Current Worker identity: `nexi-staging`.
Current Container application identity: `nexi-api-staging`.
Public API authority: `https://api.nexitrading.app`.

Do not freeze version IDs, instance IDs, image digests, process IDs, account IDs, or secret values in permanent operating instructions; discover them live.

## Wrangler / Cloudflare operator matrix

| Command / feature | Purpose | Safe inspection | Mutation / production impact | NEXI rule / common failure mode |
|---|---|---|---|---|
| `wrangler whoami` | Authentication/account/scopes | `wrangler whoami` | Read-only | Verify account/auth before operator work; never print tokens. |
| `wrangler deploy` | Upload Worker/config and optionally Container rollout | `wrangler deploy --help`; use dry-run only when supported for the exact intended validation | High | Read Workers + Containers deploy docs first. `--containers-rollout` can alter Container rollout semantics. |
| `wrangler versions list/view/upload/deploy` | Inspect or stage/version Worker code | `versions list`, `versions view <id> --json` | `upload`/`deploy` mutate | A Version is not necessarily the active Deployment; inspect deployment status separately. |
| `wrangler deployments list/status` | Inspect active/past deployment state | `deployments status`, `deployments list` | Read-only | Use this for active Worker truth, not Git timestamps. |
| `wrangler rollback [version-id]` | Create a new deployment from an older Worker version | `rollback --help` only | Immediate production routing impact | Official docs state rollback becomes active across routes/domains; require explicit authorization. |
| `wrangler tail` | Live Worker logs | `tail --help` | Read-only runtime observation | Tail is telemetry, not source truth. Bound filters/duration. |
| `wrangler secret list/put/delete/bulk` | Worker secrets | `secret list` | `put/delete/bulk` mutate protected config | Never echo secret values to chat/docs/logs/source. Deploys do not imply secret deletion semantics; check current docs. |
| `wrangler d1 list/info/execute/export/time-travel/migrations` | D1 operator path | `d1 list`, `d1 info`; bounded read-only `d1 execute --remote` SQL where justified | Execute/migrations/time-travel may mutate | D1 is canonical durable application/financial truth. Use migrations for schema. Never substitute VM SQLite. |
| `wrangler queues list/info` + queue consumer controls | Queue inventory/config/delivery | `queues list`, `queues info <name>` | create/update/delete/pause/resume/purge mutate | Queues deliver/retry only; never financial authority. Purge is destructive. |
| `wrangler workflows list/describe/instances` | Workflow inventory/runtime | `workflows list`, `workflows describe <name>`, bounded instance reads | trigger/terminate/delete mutate | Workflows orchestrate; they do not own originating financial truth. |
| `wrangler r2 bucket list` / object operations | R2 inventory and objects | `r2 bucket list` | object put/delete, bucket create/delete mutate | R2 owns approved objects/archive, not ledger truth. Protect deposit proofs. |
| `wrangler pipelines list/get` | Pipeline state/config | `pipelines list`, `pipelines get <name>` | setup/create/update/delete/stream/sink changes mutate | Current CLI marks Pipelines commands open beta; re-read docs/help before use. |
| `wrangler containers list/info/instances` | Container application/instance truth | `containers list`, `containers info <app> --json`, `containers instances <app> --json` | Read-only | Container state is runtime evidence; app ID and instance ID are different. |
| `wrangler containers ssh <INSTANCE_ID>` | Official shell transport to a running Container | inspect `containers ssh --help`; use OpenSSH ProxyCommand for a normal shell | Shell commands can mutate live runtime | Requires matching `authorized_keys` and Cloudflare write access. SSH does not expose a public port, does not start a stopped Container, and alone does not keep it alive. |
| `wrangler containers build/push` | Build/push Container image | help/config inspection | High | Container image must correspond to GitHub source; verify and reconcile source before/after rollout. |
| Worker routes/custom domains | Edge routing | inspect current deployment/API/domain state | High | Current Wrangler has no standalone `wrangler routes` family; route/domain semantics live in config/deploy/API. Read current docs/schema first. |
| Cloudflare MCP `docs` | Current official documentation search | read-only | None | Use before Cloudflare operations when exact semantics may drift. |
| Cloudflare MCP OpenAPI search | Current API schema discovery | read-only | None | Search schema before API execution. |
| Cloudflare MCP API executor | Direct Cloudflare API operation | GET/read-only requests where justified | Can be destructive | Use only after schema/docs and explicit mutation authority. |

## Official Container SSH path

Current official Cloudflare documentation supports Wrangler-authenticated SSH into a running Container when a matching public key is configured in `authorized_keys`.

Interactive Wrangler form:

```bash
wrangler containers ssh <INSTANCE_ID>
```

OpenSSH proxy form used by NEXI operator tooling:

```bash
ssh -o 'ProxyCommand=wrangler containers ssh %h --config /path/to/wrangler.jsonc --stdio' \
  cloudchamber@<INSTANCE_ID>
```

For a specific operator key, add the normal OpenSSH `-i` / `IdentitiesOnly=yes` options without exposing private-key material. Container shell access is a runtime/operator seam, not a second source authority. Any legitimate source repair performed there must be reconciled to GitHub `main` when the bounded task finishes.

## Backend source-edit closure

For a legitimate backend source change:

`READ OFFICIAL CLOUDFLARE DOCS IF PLATFORM-INVOLVED -> INSPECT LIVE CLOUDFLARE STATE -> CHANGE CANONICAL SOURCE / OR BOUNDED LIVE REPAIR WHEN REQUIRED -> VERIFY ON CLOUDFLARE -> RECONCILE EXACT SOURCE TO GITHUB MAIN -> PUSH -> CONFIRM NO CLOUDFARE-ONLY SOURCE DRIFT`

A VM-local NestJS process is never used as backend acceptance proof. Local builds/tests/static analysis may prove source properties only.

## Safe read-only production checks

Typical read-only sequence, after docs/help freshness check:

```bash
wrangler whoami
wrangler deployments status --config wrangler.jsonc
wrangler versions list --config wrangler.jsonc
wrangler containers list --config wrangler.jsonc
wrangler containers info <APP_ID> --config wrangler.jsonc --json
wrangler containers instances <APP_ID> --config wrangler.jsonc --json
wrangler d1 list --config wrangler.jsonc
wrangler queues list --config wrangler.jsonc
wrangler workflows list --config wrangler.jsonc
wrangler r2 bucket list --config wrangler.jsonc
wrangler pipelines list --config wrangler.jsonc
curl -fsS https://api.nexitrading.app/health
curl -fsS https://api.nexitrading.app/readyz
```

The command existing is not proof that the resource is integrated correctly. Match proof scope to claim scope.

## Failure discipline

- Authentication error -> inspect `whoami`, current OAuth/profile semantics, and official auth docs; do not re-authenticate blindly.
- Unknown command/flag -> current `wrangler <family> --help` + official docs; do not reuse historical syntax.
- Container SSH raw protocol in a non-TTY tool -> use the documented OpenSSH ProxyCommand/`--stdio` path instead of respawning or exposing a port.
- Container not running -> inspect application/instance state; SSH does not start stopped instances.
- D1 error -> confirm database binding/name, `--remote` semantics, migration state, and exact SQL; never switch to VM SQLite as workaround.
- Deploy/rollout error -> inspect the actual Worker version/deployment and Container application/instance state before retrying.
- Pipelines error -> re-check current beta docs/help and live resource state.

## Official documentation consulted for this authority transition

- https://developers.cloudflare.com/workers/wrangler/
- https://developers.cloudflare.com/workers/wrangler/commands
- https://developers.cloudflare.com/workers/wrangler/configuration
- https://developers.cloudflare.com/containers/guides/ssh
- https://developers.cloudflare.com/workers/wrangler/commands/containers/
- https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/
- https://developers.cloudflare.com/queues/configuration/configure-queues/
- https://developers.cloudflare.com/workflows/reference/wrangler-commands

For D1, R2, Pipelines, Queues, Workflows, Containers, Workers, or other Cloudflare work after this transition, open the relevant current product documentation again before mutation; this list is evidence of this transition, not a permanent substitute for fresh documentation.
