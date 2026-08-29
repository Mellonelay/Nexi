# NEXI Admin RBAC and Audit Model

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Identity boundary
Admin identities, cookies/tokens, session lifetime, MFA policy, API namespace, and deployment boundary are separate from public users. Public credentials cannot authorize Admin commands.

## Permission model
Define granular permissions by query, command, domain, environment, and scope. Suggested roles include Read-only Operator, Support Agent, KYC Reviewer, Finance Operator, Market Operator, Content Manager, Security Auditor, Sandbox Operator, and Super Admin; final grants must follow least privilege.

## Consequential-command envelope
Every consequential command includes actor ID, role/permission, target, environment, reason, idempotency key, request/correlation ID, before-state reference, requested change, approval context where required, result, and immutable audit ID.

## Approval rules
Ledger adjustment, withdrawal approval, role escalation, production maintenance, market intervention, configuration affecting settlement, and sandbox boundary changes require explicit confirmation; selected actions may require dual approval.

## Audit behavior
Audit is append-only, queryable, exportable, timestamped, redacted, and linked to domain records. Audit writes cannot be optional side effects for financial or authorization changes.

## Tests
Role-permission matrix tests, cross-user/cross-environment denial, session revocation, reason-required validation, duplicate-command idempotency, audit completeness, and browser unauthorized-state evidence.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
