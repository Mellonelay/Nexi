# NEXI Backend Instructions

## Project context

These rules extend the repository-root `AGENTS.md` and govern the authoritative NestJS backend under `backend\`.

Read before backend work:

1. `..\docs\NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`
2. `..\docs\implementation\NEXI_MASTER_IMPLEMENTATION_ROADMAP.md`
3. `..\docs\implementation\NEXI_CURRENT_PROGRAM_STATUS.md`
4. `..\docs\backend\NEXI_BACKEND_AUTHORITY_PROGRAM.md`

Current baton:

```text
B1=RUNTIME_VERIFIED_BASELINE_RECONCILED
B2=DOMAIN_INTEGRATED
B3=DOMAIN_INTEGRATED
GATE1=COMPLETE
B4=DOMAIN_INTEGRATED
B5=DOMAIN_INTEGRATED
B6=DOMAIN_INTEGRATED
GATE2=COMPLETE_ACCEPTED
REALIGNMENT_SOURCE_PHASE=ACTIVE
NEXT=SOURCE_REALIGNMENT_P0_P8
```

Preserve B2 market authority and B3 ledger authority. Gate 2 must consume them rather than rebuild them.

Current trading scope is **Spot/Margin + Options**. Spot and isolated Margin
share one page; Margin is limited to LONG/SHORT at 2x, 3x, and 5x. Options is
the separate public page backed by Binary/Microtrade. Cross margin, futures,
perpetual contracts, portfolio margin, C2C, and copy trading remain excluded.
See `..\docs\implementation\NEXI_CURRENT_PRODUCT_SCOPE_AUTHORITY.md`.

## Backend rules

- Preserve NestJS 10, Prisma 7, PostgreSQL, Redis, JWT, Swagger, Socket.IO, current module ownership, and explicit request/response contracts.
- Preserve authorization, ownership, validation, exact monetary precision, idempotency, transaction boundaries, append-only ledger integrity, reconciliation, audit linkage, sandbox isolation, and public/Admin separation.
- PostgreSQL owns durable market/financial truth. Redis is ephemeral cache, transport, locking and coordination only.
- Missing or failed values use explicit unavailable/error behavior; never fabricate prices, balances, PNL, payouts, settlement or success.
- One native Codex parent owns backend planning, mutation, debugging, testing, integration and evidence. Child-agent delegation is disabled.
- State the exact backend write scope before material mutation and preserve working user code.
- Use focused checks during implementation and one combined real integration gate after each coherent roadmap milestone.

Normal bounded source edits and tests are allowed within an approved Goal. Prisma schema/migrations, packages/lockfiles, credentials, environment, infrastructure, destructive operations, production state and deployment require explicit current-turn approval.

