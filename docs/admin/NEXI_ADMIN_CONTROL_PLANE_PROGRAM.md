# NEXI Admin Control Plane Program

> **Historical specification / superseded as live authority (2026-10-14).** This document preserves earlier requirements and rationale, not current deployment or completion status. Apply current owner decisions, current GitHub `main`, and [documentation authority](../README.md) before using any older rule or phase gate. Preserve still-applicable financial/security invariants.


**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Historical charter reference:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md` (not the current product or completion authority)
**Current source/navigation authority:** `docs/README.md` and current GitHub `main`; old ledger is historical
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Mission
Create a separate role-gated Admin application. Reuse useful controls from the embedded `/dashboard/admin` page, but do not keep Admin inside the public route tree.

## A0 Independent shell
Separate routing/deployment/session boundary, Admin login, RBAC-aware navigation, environment indicator, unauthorized states, high-risk confirmation, reason fields, and audit context.

## A1 Operations overview
User/session counts, market feed health, Spot/Binary health, settlement backlog, database/Redis health, failed jobs, pending withdrawals, support backlog, maintenance and alerts.

## A2 Users and KYC
Search, filters, profile/status, KYC review, roles, restrictions, sessions, entitlements, wallet/trading/mining/loan/support/audit summaries.

## A3 Assets, networks and markets
Currencies, symbols, networks, deposit addresses/QR, limits/fees/confirmations, visibility, pair category/order, Spot/Binary capabilities, source and maintenance state.

## A4–A9 Operations
A4 Spot administration; A5 Binary administration; A6 Wallet/Ledger/Deposits/Withdrawals; A7 Mining/Loans; A8 Support/Messages/Content/Notifications; A9 Admin accounts, permissions, flags, audit, security events, health and sandbox governance.

## Every Admin phase must define
Operator outcome, routes, tables/forms/drawers/modals, search/filter/pagination, query/command contracts, permissions, reason/approval rules, audit events, empty/loading/error/unauthorized states, safeguards, tests, browser evidence, and rollback.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
