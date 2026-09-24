# NEXI Domain and Service Boundaries

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state authority:** `NEXI_CURRENT_STATE.md` + `NEXI_PRODUCTION_COMPLETION_LEDGER.md`
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Domain ownership
- Identity: users, credentials, sessions, roles, KYC, security events.
- Market: assets, networks, pairs, quotes, provenance, freshness, capabilities.
- Wallet/Ledger: wallet domains, balances, postings, reservations, reconciliation.
- Spot: orders, matching, fills, fees, cancellation, trade history.
- Binary: configuration, positions, exposure, expiry, settlement and history.
- Treasury: deposits, withdrawals, networks, confirmations, approvals.
- Financial products: mining subscriptions/rewards and loans/repayment.
- Communications: support, messages, notifications, announcements, Learn content.
- Governance: Admin commands, feature flags, configuration history, audit, sandbox scenarios.

## Boundary rules
No domain directly rewrites another domain's balances or lifecycle state. Financial domains request ledger postings through the ledger authority. Market data is consumed through a normalized price authority. Admin invokes explicit commands with actor, reason, environment, idempotency key, and audit linkage.

## Existing-source guidance
Preserve working Nest modules and services, but remove cross-domain shortcuts during slice implementation. Empty `ledger`, `settlement`, `audit`, `notification`, `risk`, and `sandbox` modules are boundaries only, not implemented authority.

## Integration events
Use versioned events for durable state changes and scoped WebSocket messages for user-facing live state. Event consumers must be idempotent, observable, replay-safe where required, and forbidden from fabricating missing source data.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
