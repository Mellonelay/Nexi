# NEXI Security Program

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

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
