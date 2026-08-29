# NEXI Backend Runtime Requirements

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Configuration
Validate all required environment variables at startup without printing secrets. Separate local, test, sandbox, staging, and production settings; production cannot enable sandbox outcome controls.

## Runtime services
PostgreSQL connection/readiness, Redis connection/adapter readiness, API listener, WebSocket namespaces, market ingestion, scheduled settlement/rewards, health/readiness endpoints, graceful shutdown, and bounded retry/backoff.

## API behavior
Versioned typed DTOs, runtime validation, stable error codes, authorization guards, ownership checks, pagination/filtering, idempotency headers for consequential commands, rate limits, request/correlation IDs, and no raw internal exception leakage.

## Observability
Structured logs with redaction, latency/error metrics, database/Redis/market/settlement health, business-event counters, trace propagation, and alerts for ledger mismatch, settlement backlog, stale market feeds, withdrawal backlog, and repeated authorization failures.

## Baselines
Record install, lint, format check, type/build, unit, integration, contract, database migration, runtime smoke, WebSocket smoke, and shutdown behavior separately from the public frontend and Cloudflare adapter.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
