# NEXI Final Handover — 2026-08-31

## Authority and current checkout

- Repository: `Mellonelay/Dexi_Style`
- Local root: `/workspace/scratch/6d20f852cdb1/nexi-work`
- Branch: `codex/vm-unpushed-recovery-20260830`
- Current local HEAD: `b25ac72 Complete market contracts and provider synchronization`
- Working tree: clean at handover creation
- Intended remote: `https://github.com/Mellonelay/Dexi_Style.git`
- GitHub push status: not uploaded; HTTPS authentication is unavailable in this runtime.

The active checkout is implementation authority. Historical VM workspaces, old graphs, exported chats, and handover text are supporting evidence only.

## Work completed and checkpointed

The current branch contains the previously completed source work for:

- D1 runtime configuration and D1 financial-command routing.
- Legacy Prisma client inertness in D1 mode.
- Wallet authentication and financial correction routing through D1 authority.
- D1 loan submission outbox emission.
- D1 mining paths using durable EventOutbox emission.
- Public/Admin boundary isolation and public API token handling.
- Cloudflare worker/container binding and environment contract updates.
- Market provider and Kline contract updates, including Public Asset Detail integration.
- OpenAPI artifact updates and market contract tests.
- Backend, Public frontend, and Admin build checks previously passing for the touched packages.

The latest local commit `b25ac72` contains the current market contract/provider synchronization batch. Earlier source checkpoint history in this checkout includes `92411b8` and `804191f`.

## Graphify evidence

Graphify 0.9.53 is available through the managed offline launcher:

```bash
/opt/codex/runtimes/codex-primary-runtime/dependencies/python/bin/uvx --offline --from graphifyy graphify
```

The installed project integrations include `.claude/` and `.codex/` Graphify skills/hooks in the earlier environment checkpoint. The local active-checkout graph was refreshed with:

- 618 files
- 9,491 nodes
- 20,965 edges in the final raw refresh
- 605 communities after clustering

Folder projections:

| Surface | Code files | Nodes | Edges | Main hubs |
|---|---:|---:|---:|---|
| Backend | 288 | 2,611 | 7,645 | D1FinancialCommandGateway, AdminService, MarketAuthorityService |
| Public | 108 | 726 | 1,488 | API client, authoritative state, asset registry, market hook |
| Admin | 128 | 1,376 | 4,146 | AdminDataProvider, NexiAdminApiProvider, admin session/query context |

The Graphify MCP default graph was also queried without `project_path`:

- 6,561 nodes
- 14,816 edges
- 0 communities

That MCP graph is not tied to the active checkout and must remain reference-only. The local Graphify evidence is recorded in `docs/acceptance/GRAPHIFY_OMNIPOTENT_RECONCILIATION.md`.

Important topology findings:

1. `D1FinancialCommandGateway` is the principal financial and cross-domain authority hub.
2. Public market data has a coherent source path through the API client, asset registry, market state, and market pages.
3. `apps/admin` is the canonical Admin build tree.
4. Root `src` duplicates substantial Admin code and remains an unresolved structural reconciliation item.
5. SQL/D1 files were not fully indexed by Graphify because `tree_sitter_sql` was unavailable offline. Direct schema/migration inspection remains required.

## Fallow evidence

Fallow 3.21.0 is usable through:

```bash
npx --yes fallow
```

The advisory scan found complexity hotspots, duplicated Admin trees, dead-code candidates, one circular dependency, and unused-dependency candidates. These are not deletion authority. The most important confirmed structural signal is the duplicate root `src` / `apps/admin/src` topology; it must be reconciled against deployment and CI usage before any removal.

## Acceptance status

Source work is not yet `SOURCE_ACCEPTANCE_PASS`. The acceptance ledger is:

`docs/acceptance/NEXI_SOURCE_ACCEPTANCE_LEDGER.md`

Remaining source-level work:

- Finish the ledger row-by-row for every Public, Backend, Admin, API, D1, ledger, outbox, queue/workflow, Valkey/Socket.IO, Cloudflare, and configuration requirement.
- Directly inspect and reconcile all D1 migrations/schema files; Graphify SQL extraction is incomplete.
- Resolve or formally quarantine the duplicate root Admin tree.
- Verify every financial/durable command has D1 authority, idempotency, audit, and EventOutbox behavior, including overdue-loan processing.
- Reconcile generated OpenAPI against both Public and Admin consumers.
- Complete source-level Socket.IO/Valkey producer, consumer, reconnect, and REST-recovery mapping.
- Run final focused builds/tests after remaining repairs, then final directed Graphify refresh and graph diff.

## Explicitly deferred to owner runtime pass

These are not source-completion evidence and remain deferred:

- Live BiQuote quotes/Klines for all required assets and intervals.
- Gate/Yahoo live fallback behavior.
- Fresh runtime quotes for all 53 assets.
- Live D1/cache persistence observation.
- Live Socket.IO/Valkey delivery and reconnect behavior.
- Cloudflare deployed-service behavior.
- VM Playwright/browser/mobile acceptance.
- Final production acceptance against live infrastructure.

## Required continuation sequence

1. Authenticate GitHub and push the local branch:

   ```bash
   git push -u origin codex/vm-unpushed-recovery-20260830
   ```

2. Confirm the remote branch contains `b25ac72`.
3. Continue source-only repairs from the unresolved ledger rows.
4. After each dependency-closed repair: focused verification, `git diff --check`, local Graphify update/diff, commit, and push.
5. Declare source acceptance only when every non-runtime ledger row is `PROVEN` and only owner-deferred runtime/browser rows remain.
6. Then perform the owner-controlled live/runtime/browser pass.

## Prohibited continuation mistakes

- Do not replace the active checkout with the stale MCP graph.
- Do not claim runtime success from static provider mappings.
- Do not delete the duplicate Admin tree solely from Fallow output.
- Do not treat generated declarations as architectural authorities.
- Do not skip D1 schema inspection because the application build passes.
- Do not rerun already-proven tests unless a dependency changed.
- Do not stop after another market-only batch while unresolved acceptance domains remain.
