# NEXI Test and Verification Program

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Test layers
Unit, integration, contract, database, WebSocket, browser, visual regression, accessibility, security/authorization, concurrency/idempotency, recovery, performance/load, end-to-end, deployment smoke, and rollback proof.

## Baseline separation
Record root/workspace, public web, API, Admin, shared-contract, Cloudflare/container, and browser baselines separately. The website-cloner build is never NEXI evidence.

## Regulated requirements
Financial and privileged slices require negative authorization, malformed input, duplicate/retry, transaction rollback, invariant/reconciliation, audit completeness, failure recovery, runtime wiring, browser evidence, and independent review.

## Test data
Use explicit local/test/sandbox fixtures with provenance and cleanup. Never present fixture values as live. Destructive resets require approval.

## Completion report
Exact commands, versions, exit codes, test counts, failed/skipped tests, coverage where meaningful, runtime/API/WS evidence, browser screenshots, console/network evidence, residual risks, rollback, and verified status.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
