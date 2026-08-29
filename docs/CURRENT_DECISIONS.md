# CURRENT NEXI DECISIONS

- D1 is the target application/financial durable relational authority.
- Aiven Valkey remains realtime/cache/Streams infrastructure.
- R2/Data Catalog/Pipelines own high-volume historical market archive.
- Cloudflare Worker is routing/bridge infrastructure, not business authority.
- NestJS domain services remain business authority.
- Public frontend and Admin remain separate applications.
- Admin uses canonical `/admin/*` surface.
- Support is direct in-app user <-> Admin/operator support.
- Learn remains one existing product slice; do not add School.
- Announcements remain independent.
- B8 Communications product contracts already exist.
- DEXI is reference evidence only.
- Exactly 53 canonical market assets.
- Backend source/build/test/runtime authority is the VM workspace `/root/workspaces/nexi-authoritative-20260823`.
- Windows is authoritative for frontend/Admin; Windows backend content is a synchronized checkpoint/mirror, not the backend execution authority.
- Production deployment remains unauthorized until staging acceptance passes.

## Staging-only Mining verification decision — 2026-08-28

- `MINING_STAGING_POLICY=APPROVED`; `PRODUCTION_MINING_POLICY=UNDECIDED`.
- Staging plan economics: Basic `0.005`, Pro `0.010`, Whale `0.015` daily yield decimals; bounds and lockups are recorded in the staging verification receipt.
- Accrual uses completed UTC 24-hour periods and simple non-compounding principal-based reward calculation.
- Staging verification does not authorize automatic renewal, normal early user cancellation, scheduler/B7 enablement, or production economic promotion.
- Synthetic staging financial and Admin fixtures are authorized only through existing canonical identity, RBAC, ledger, and domain mechanisms.
