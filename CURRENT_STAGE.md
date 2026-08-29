# NEXI CURRENT STAGE

LAST_UPDATED: 2026-08-29

## ROLE
This is the active execution baton only. It does not override authoritative source, fresh runtime evidence, `AGENTS.md`, or an explicit current owner decision.

## SOURCE AUTHORITY SPLIT
- Backend + Cloudflare + runtime: `/root/workspaces/nexi-authoritative-20260823` on `sg-edge-01`.
- Public Frontend: `C:\trae_projects\Dexi_style_TraeWV\cloudflare-container-bootstrap\dexi-frontend` on Windows.
- Admin: `C:\trae_projects\Dexi_style_TraeWV\apps\admin` on Windows.
- Windows backend files are checkpoint/reference mirrors only and remain unsynchronized during active VM implementation.

## CURRENT OBJECTIVE
Run three bounded lanes in parallel: finish backend/application authority and contracts on the VM; prepare the Windows Public Frontend against confirmed current API/realtime behavior; and prepare the Windows Admin against confirmed canonical `/admin/*` behavior. Client lanes may implement adapters, contract types, error/loading states, tests, and production-path wiring now, but must not invent missing backend behavior. Final client freeze waits for the VM OpenAPI/runtime join.

Do not restart broad architecture discovery, DEXI reconstruction, Cloudflare inventory, Admin redesign, frontend redesign, or Neon/PostgreSQL architecture.

## FRESH STAGING RUNTIME
Verified 2026-08-29 from `sg-edge-01`:
- canonical Wrangler: `4.127.1`
- `GET /readyz` -> HTTP 200; database=true; redis=true; authority=D1
- `GET /ops/ready` -> HTTP 503; deployed image still uses stale PostgreSQL readiness implementation
- `GET /docs-json` -> HTTP 404; current Swagger/OpenAPI source is not deployed yet
- Container app `nexi-api-staging` -> active, version 38, one instance
- Container image digest -> `sha256:46e6103d226d2a4564d8b5b9f84a2a7299ea12733c9e3bf5644f693b53f89f53`
- Production changed: NO

Canonical conclusion: D1 bridge/readiness PASS. `/ops/ready` failure is a stale deployed readiness path, not evidence that D1 is broken.
## CURRENT APPLICATION-LANE PROGRESS
Confirmed in current VM source:
- canonical D1 schema exists with 84 tables; migrations current; recent `PRAGMA quick_check` reported `ok`.
- Communications uses D1 when enabled.
- Support tickets/replies, Persistent Messages, and Learn authoring have durable EventOutbox integration.
- EventOutbox record/claim/lease/publish/retry/dead-letter implementation exists.
- D1FinancialCommandGateway contains broad financial/Admin D1 operations and many atomic EventOutbox statements.
- additional D1-backed Admin reads and session-revocation/audit paths exist.
- Swagger bootstrap exists in source with `/docs` and `/docs-json` targets.
- 19 NestJS controllers currently have `@ApiTags`.

## REMAINING APPLICATION GAPS
Do not report these as complete until source + focused verification proves them:
1. classify and close remaining active Prisma/PostgreSQL runtime bypasses without blindly deleting intentional disabled/compatibility branches.
2. complete consequential EventOutbox coverage across financial/application mutations.
3. complete canonical D1 financial lifecycle closure for Deposit, Withdrawal, Transfer, Conversion, Spot, Isolated Margin, Binary/Options, Mining, and Loans.
4. implement the NestJS `_internal/workflows/*` command endpoints required by the Cloudflare Withdrawal, Mining, and Loan Workflows.
5. finish Admin live-provider parity against canonical `/admin/*`; remove critical live-mode gaps/mock-only authority without rebuilding Admin.
6. finish realtime EventOutbox/Aiven Streams/Socket.IO recovery, reconnect, dedupe, and contract semantics.
7. complete API request/response/auth/RBAC/error/idempotency/pagination/lifecycle/realtime documentation and generate/freeze the final OpenAPI artifact.
8. verify no critical staging endpoint remains PostgreSQL/Neon-authoritative.

## OPENAPI STATUS
`OPENAPI_CONTRACT_STATUS=PARTIAL`.
Controller tagging and bootstrap are implemented, but current semantic decorator/contract coverage is still incomplete and `/docs-json` is not deployed/runtime-verified.
## PLATFORM LANE READY FOR JOIN
Cloudflare-side source has been prepared and dry-run verified for:
- continuous Container lifecycle policy without self-stop recovery loops;
- Worker private bridges;
- existing Queue consumer/signed NestJS ingress;
- Withdrawal, Mining, and Loan durable Workflow orchestration contracts;
- current Wrangler bindings/types/config parsing.

Do not deploy the Workflow join until the matching NestJS Workflow command endpoints exist. A Worker-only rollout before that join would publish a knowingly incomplete integration.

## GRAPHIFY STATUS
VM Graphify CLI and Codex/agents skills are `0.9.51`. The VM graph was refreshed after recent backend changes with `graphify update . --no-cluster`: 6,367 nodes / 14,654 edges. Treat later source edits as requiring another fast refresh before graph-dependent reasoning.
Windows Graphify CLI/project Codex skill are `0.9.51`. Public Frontend graph is refreshed and reclustered: 873 nodes / 1,422 edges / 92 communities. Admin now has its own current code graph: 1,376 nodes / 3,842 edges / 105 communities.
`graphify check-update .` exit 0 is not sufficient proof of AST freshness. Use fast `graphify update . --no-cluster` after coherent code batches, then targeted `affected` / `path` / `explain`; recluster only when community/God-node analysis matters.

## NEXT EXECUTION ORDER
G1-VM. Continue backend D1/financial/EventOutbox/Workflow/OpenAPI/Postgres-bypass closure on authoritative VM.
G1-FRONTEND. In parallel on Windows, reconcile the existing Public Frontend adapters/types/auth/errors/lifecycle/realtime behavior against confirmed current backend source and record unresolved contract dependencies; do not redesign UI or edit backend.
G1-ADMIN. In parallel on Windows, reconcile `NexiAdminApiProvider` against confirmed canonical `/admin/*`, classify every provider method as live/partial/unsupported/local-only, remove stale PostgreSQL assumptions, and make live mode fail closed rather than fall back to mock.
G2. Refresh only the graph plane changed by each lane and run bounded impact/path validation.
G3. Join after VM Workflow commands + OpenAPI/runtime contract are ready; use generated `/docs-json` plus concrete controller/DTO evidence for API Documentation Checker and API Impact Mapper.
G4. Canonical Container image build and coordinated staging Worker/Container join.
G5. Verify `/readyz`, `/ops/ready`, `/docs-json`, EventOutbox->Queue->Inbox, Workflows, Aiven/Socket.IO, and critical authenticated flows.
G6. Apply final contract deltas to Frontend/Admin, then cross-surface staging QA and Neon-free acceptance.
G7. Production review/deployment only after explicit owner approval.

PRODUCTION_CHANGED=NO