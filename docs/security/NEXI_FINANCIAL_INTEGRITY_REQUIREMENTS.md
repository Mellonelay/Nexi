# NEXI Financial Integrity Requirements

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Core invariants
No negative balance unless explicitly modeled; available and locked reconcile to ledger; one idempotency key causes at most one effective mutation; every domain event traces to postings; duplicate/retry/concurrency cannot duplicate value; administrative corrections are ledger-backed and auditable.

## Spot integrity
Funds are reserved before order acceptance; fills, fees, refunds and asset transfer are atomic or recoverably coordinated; partial fills preserve correct remaining reserve; cancellation releases only remaining reserve.

## Binary integrity
Stake reserve precedes OPEN; entry/expiry prices include source and timestamp; configuration version is captured; settlement is deterministic for the recorded inputs; payout/refund postings and position state commit idempotently.

## Treasury integrity
Deposits require network/confirmation evidence; withdrawals enforce limits, fees, ownership, status transitions and approval policy; transaction hashes and reconciliation remain traceable.

## Verification
Property/invariant tests, concurrency races, duplicate command tests, crash recovery, reconciliation mismatch injection, authorization denial, and complete domain-to-ledger trace samples.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
