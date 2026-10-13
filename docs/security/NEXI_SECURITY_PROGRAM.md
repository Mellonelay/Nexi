# NEXI Security Program

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Historical charter reference:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md` (not the current product or completion authority)
**Current source/navigation authority:** `docs/README.md` and current GitHub `main`; old ledger is historical
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Scope
Security spans public identity, Admin identity, APIs, WebSockets, database, Redis, market providers, financial commands, content, infrastructure, dependencies, observability, and sandbox separation.

## Required controls
Threat modeling, least privilege, separate public/Admin sessions, MFA for privileged roles, ownership checks, runtime schema validation, secure headers/CORS/CSRF policy, rate limits, abuse controls, secrets isolation, dependency scanning, audit, secure logging/redaction, backups, incident response, and rollback.

## Financial surfaces
Wallet, ledger, Spot, Binary, deposits, withdrawals, mining, loans, and Admin adjustments use idempotency, transaction boundaries, authorization, reason capture, immutable evidence, reconciliation, and negative tests.

## Security gates
Architecture threat review before implementation; authorization tests before integration; secret/dependency review before deployment; defensive red-team and residual-risk review before release.

## Boundary
This is an educational sandbox product, but realistic controls are still required. Sandbox capability never weakens production authorization or audit expectations.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
