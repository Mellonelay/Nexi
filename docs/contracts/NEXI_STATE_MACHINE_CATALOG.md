# NEXI State Machine Catalog

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Historical charter reference:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md` (not the current product or completion authority)
**Current source/navigation authority:** `docs/README.md` and current GitHub `main`; old ledger is historical
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Required state machines
- Market feed: LOADING → LIVE ↔ STALE → ERROR/UNAVAILABLE, with recovery.
- Spot order: CREATED → OPEN → PARTIALLY_FILLED → FILLED or CANCELED/REJECTED.
- Binary position: OPEN → EXPIRED → SETTLEMENT_PENDING → WIN/LOSS/DRAW or FAILED_REVIEW.
- Ledger transaction: PENDING → PROCESSING → CONFIRMED or FAILED/REJECTED/COMPENSATED.
- Deposit: DETECTED → CONFIRMING → CREDITED or FAILED/REVIEW.
- Withdrawal: REQUESTED → REVIEW → APPROVED → BROADCAST → CONFIRMED or REJECTED/FAILED.
- Mining: ACTIVE → COMPLETED/CANCELLED/PAUSED.
- Loan: PENDING → APPROVED/REJECTED → ACTIVE → PAID/OVERDUE.
- Ticket/message/content/notification lifecycles with delivery/read/publication states.

## Rules
Transitions are explicit, authorized, timestamped, idempotent, audited where consequential, and rejected when invalid. UI labels derive from state-machine contracts rather than ad hoc booleans.

## Verification
Transition-table unit tests, forbidden-transition tests, concurrent-command tests, recovery/retry tests, event ordering tests, and persisted-state/browser consistency evidence.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
