# NEXI Shared Contracts Program

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Historical charter reference:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md` (not the current product or completion authority)
**Current source/navigation authority:** `docs/README.md` and current GitHub `main`; old ledger is historical
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Mission
Create one versioned contract authority consumed by public web, Admin, API, tests, and event producers/consumers. Frontend and Admin must not invent independent payload shapes.

## Required contract families
Identity/session; user/role; asset/network; market pair/capability; quote/provenance; Spot order/trade; Binary config/position; wallet/balance/ledger; deposit/withdrawal/transfer/conversion; mining; loans; support/messages; announcements/Learn; notifications; feature flags; Admin commands; audit; health/operations.

## Contract properties
Runtime validation, generated/shared TypeScript types, stable identifiers, explicit optionality, numeric-unit conventions, timestamps/time zones, pagination/filtering, API/event versioning, error envelopes, authorization metadata, idempotency metadata, and backward-compatibility policy.

## Package target
`packages/contracts` after the workspace migration gate. Existing `backend/src/contracts` is source material, not automatically canonical.

## Verification
Schema parse tests, malformed-input tests, producer/consumer compatibility tests, API/WebSocket parity, version migration tests, generated-type drift checks, and browser evidence that displayed authoritative values match contract responses.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
