# NEXI Ledger and Settlement Architecture

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state authority:** `NEXI_CURRENT_STATE.md` + `NEXI_PRODUCTION_COMPLETION_LEDGER.md`
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Ledger invariant
Every financial mutation is an attributable posting with account/wallet domain, asset, signed amount, reference type/id, idempotency key, actor/source, environment, status, timestamp, and audit linkage. Available plus locked balances must reconcile to postings.

## Required commands
Reserve, release, debit, credit, settle, compensate, transfer, reconcile, and governed Admin adjustment. Commands must be atomic, idempotent, authorized, and return stable posting/transaction identifiers.

## Wallet domains
Overview is an aggregation; Spot, Option, Funding, and Financial are distinct ledger accounts. Internal transfer is paired debit/credit posting, never direct JSON balance mutation.

## Spot settlement
Order reserve, partial fill, fee, price-improvement refund, base/quote transfer, cancellation release, and final order state must share an atomic or recoverably coordinated transaction boundary.

## Binary settlement
Open position reserves stake; expiry obtains authoritative price; settlement determines WIN/LOSS/DRAW; postings release/settle principal and payout/refund; position and ledger state commit idempotently with recovery for interrupted settlement.

## Reconciliation and evidence
Scheduled and on-demand reconciliation, mismatch alerts, immutable correction workflow, duplicate-command tests, concurrency tests, crash-recovery tests, and ledger-to-domain traceability are mandatory.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
