# NEXI System Architecture

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state authority:** `NEXI_CURRENT_STATE.md` + `NEXI_PRODUCTION_COMPLETION_LEDGER.md`
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Three primary surfaces
1. Public NEXI frontend: presentation, interaction, local display state, and the exact 11-route product.
2. Authoritative backend/runtime: identity, markets, wallets, ledger, Spot, Binary, content, communications, audit, and configuration.
3. Separate Admin Control Plane: governed commands and queries over backend authority.

## Control chain
`Admin UI → Admin API → domain authority/configuration → public API/events → public UI`.

## Architectural rules
- Public and Admin authentication/session boundaries are separate.
- Backend contracts, database records, and events are authoritative; clients never invent financial truth.
- Shared Active Pair connects Quotes Hub, Spot, Binary, charts, and related consumers.
- REST handles durable queries/commands; WebSocket handles live updates with reconnect, freshness, and authorization rules.
- Cloudflare and containers are deployment adapters, not domain authority.
- D1 owns durable application/financial relational data; Aiven Valkey supports ephemeral transport/cache/coordination only where explicitly defined.

## Required cross-cutting capabilities
Typed configuration, runtime validation, idempotency, transaction boundaries, immutable audit linkage, health/readiness, structured logs, metrics/traces, failure recovery, environment separation, and explicit sandbox-only boundaries.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
