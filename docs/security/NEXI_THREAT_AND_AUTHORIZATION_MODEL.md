# NEXI Threat and Authorization Model

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Historical charter reference:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md` (not the current product or completion authority)
**Current source/navigation authority:** `docs/README.md` and current GitHub `main`; old ledger is historical
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Primary actors
Anonymous visitor, authenticated user, support agent, KYC reviewer, market operator, finance operator, content manager, security auditor, sandbox operator, Super Admin, backend service, market provider, and attacker.

## Primary threats
Credential/session theft, horizontal/vertical privilege escalation, API/WS spoofing, stale or manipulated market data, replay/duplicate financial commands, ledger tampering, unsafe Admin changes, sandbox leakage, content/attachment abuse, secret exposure, dependency compromise, denial of service, and audit suppression.

## Authorization model
Default deny; explicit permission plus resource ownership/scope; separate Admin namespace and session; environment-aware permissions; high-risk confirmation/approval; reason required; service-to-service identity; revocation and security-event visibility.

## Sandbox policy
Forced outcomes, payout override, mock movement, balance override, deterministic scenarios, and hazard profiles are NON_PRODUCTION ONLY, disabled by default, visibly labeled, role/environment/account scoped, reason-required, and audited.

## Evidence
Threat-to-control matrix, role-permission tests, cross-tenant denial, token/session revocation, API/WS negative tests, sandbox-production isolation tests, and independent Risk Reviewer findings.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
