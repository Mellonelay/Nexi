# NEXI Phase Dependency Graph

> **Historical specification / superseded as live authority (2026-10-14).** This document preserves earlier requirements and rationale, not current deployment or completion status. Apply current owner decisions, current GitHub `main`, and [documentation authority](../README.md) before using any older rule or phase gate. Preserve still-applicable financial/security invariants.


**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state authority:** `NEXI_CURRENT_STATE.md` + `NEXI_PRODUCTION_COMPLETION_LEDGER.md`
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Primary dependency graph
`Authority + Classification → Workspace/Tooling Audit → Shared Contracts/Foundation`.

`Shared Contracts → F0 Web Foundation → F1 Dashboard → F2 Spot and F3 Binary → F4–F9 → F10`.

`Shared Contracts + B0 Runtime → B1 Identity/RBAC → B2 Market → B3 Ledger → B4 Spot + B5 Binary + B6 Treasury + B7 Products → B8 Communications → B9 Admin Authority → B10 Hardening`.

`A0 Admin Shell + B1 Identity + Contracts → A1–A3 → A4–A8 → A9 Governance`.

`Web/Admin/API slices → contract/integration tests → browser matrix → security review → operations/observability → Cloudflare/container preparation → release review`.

## Regulated/high-assurance nodes
B1, B3–B7, B9; A2–A7 and A9; Wallet/Spot/Binary public flows; schema migrations; production/sandbox boundary; deployment/release.

## Blocking gates
No live financial submission before market, identity, capability and ledger authority. No consequential Admin action before RBAC, reason, idempotency and audit. No source move before migration/rollback map. No release before recovery and rollback proof.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
