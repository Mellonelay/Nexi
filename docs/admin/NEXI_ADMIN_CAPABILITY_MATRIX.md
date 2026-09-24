# NEXI Admin Capability Matrix

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state authority:** `NEXI_CURRENT_STATE.md` + `NEXI_PRODUCTION_COMPLETION_LEDGER.md`
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Capability matrix
| Domain | Required controls | Required evidence |
|---|---|---|
| Users/KYC | status, verification, roles, restrictions, sessions, entitlements | authorization and audit tests |
| Frontend control | route/feature visibility, labels, ordering, maintenance messages | public propagation browser proof |
| Assets/networks | identity, network metadata, address/QR, limits, fees, enablement | contract and negative tests |
| Spot | pairs, order types, precision, limits, fees, source, status, orders/trades | command/API/runtime evidence |
| Binary | pairs, durations, payouts, limits, exposure, pricing, settlement review | sandbox/production boundary proof |
| Wallet/ledger | balances, postings, reconciliation, governed adjustments | invariant and audit evidence |
| Deposits/withdrawals | records, queue, approve/reject, tx hash, status | state-machine and authorization tests |
| Mining/loans | products, terms, eligibility, positions, applications, repayment | ledger integration evidence |
| Support/messages | inbox, assignment, priority, notes, replies, escalation | persistence and delivery proof |
| Content/notifications | create, schedule, audience, publish/archive, delivery/read | browser and contract proof |
| Governance | Admin accounts, roles, flags, config history, health, audit | negative authorization and review |

## Scope policy
Broad controls are specified now. Execution safety is refined through RBAC, environment gates, approvals, reason capture, audit, and production restrictions; controls are not silently removed from the target architecture.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
