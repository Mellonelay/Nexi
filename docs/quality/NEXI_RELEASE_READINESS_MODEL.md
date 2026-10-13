# NEXI Release Readiness Model

> **Historical specification / superseded as live authority (2026-10-14).** This document preserves earlier requirements and rationale, not current deployment or completion status. Apply current owner decisions, current GitHub `main`, and [documentation authority](../README.md) before using any older rule or phase gate. Preserve still-applicable financial/security invariants.


**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Historical charter reference:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md` (not the current product or completion authority)
**Current source/navigation authority:** `docs/README.md` and current GitHub `main`; old ledger is historical
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Readiness gates
Scope/charter, design conformance, workspace/build, database/migrations, API/contracts, financial invariants, authorization/security, observability/alerts, browser/E2E, performance, backup/recovery, deployment/rollback, evidence completeness, and explicit human approval.

## Required release artifacts
Versioned build artifacts, dependency/lockfile manifest, migration plan, configuration diff without secrets, test report, browser evidence index, security findings/disposition, operational dashboards/runbooks, backup/restore evidence, deployment sequence, rollback trigger and procedure.

## Blockers
Unknown migration outcome, failing or skipped critical tests, unresolved high-severity authorization/financial issue, missing audit/ledger trace, sandbox leakage, stale/unverified market authority, no rollback, environment ambiguity, or unsupported completion claims.

## Decision states
NOT_READY, READY_FOR_SANDBOX, READY_FOR_STAGING, READY_FOR_RELEASE_REVIEW, APPROVED_FOR_RELEASE. Only explicit authorized review advances to production deployment.

## Independent review
Risk Reviewer and Quorum are used when impact or uncertainty warrants. The native Codex parent reconciles evidence and never promotes a plan, invocation, screenshot, or partial test to release proof.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
