# NEXI Backend Authority Program

> **Current owner authority override — 2026-08-19:** Active trading scope is
> **Spot/Margin + Options**. Spot and isolated Margin share one page; Margin is
> limited to LONG/SHORT at 2x, 3x, and 5x. Options is the separate public page
> backed by Binary/Microtrade. Cross margin, futures, perpetual contracts,
> portfolio margin, C2C, and copy trading remain excluded. See
> `docs\implementation\NEXI_CURRENT_PRODUCT_SCOPE_AUTHORITY.md`.

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Mission
Turn the existing NestJS/Prisma code into the authoritative runtime for all three surfaces while preserving useful services and replacing scaffold-only authority with verified implementations.

## B0 Runtime foundation
Typed environment validation, API versioning, health/readiness, structured errors/logs, correlation IDs, PostgreSQL/Redis lifecycle, graceful shutdown, migration/seed policy, WebSocket lifecycle, metrics and traces.

## B1 Identity and authorization
Users, public/Admin sessions, access/refresh tokens, password policy, roles/permissions, ownership, KYC, 2FA, revocation, rate limits, security events, and negative authorization tests.

## B2 Market and asset authority
Assets, networks, categories, pairs, Spot/Binary capabilities, visibility, maintenance, price source/provenance/freshness, normalization, catalog APIs, and market events.

## B3 Wallet and ledger authority
Wallet domains, available/locked balances, invariant-backed postings, reserve/release/credit/debit/settle/compensate, idempotency, reconciliation, immutable history, and governed corrections.

## Current domain authority
B4 Spot/Margin; B5 Options/Binary; B6 deposits/withdrawals; B7 mining/loans;
B8 communications/content; B9 Admin queries/commands, feature flags,
approvals, configuration history, and audit emission. Margin is isolated only
and limited to 2x/3x/5x; `/lever` and cross-margin contract surfaces remain
excluded.

## B10 Production hardening
Backups/restores, disaster recovery, load/security/abuse tests, rate limits, dependency hardening, alerts/runbooks, deployment and rollback evidence.

## Phase contract
Each phase documents service ownership, data ownership, API/events, state machine, authorization, transaction/idempotency boundary, audit, observability, recovery, migrations, tests, and completion evidence.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
