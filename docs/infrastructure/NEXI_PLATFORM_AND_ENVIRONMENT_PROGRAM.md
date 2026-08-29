# NEXI Platform and Environment Program

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Environment model
Define local, test, sandbox, staging, and production. Each environment has explicit API/Admin/Web origins, database/Redis resources, market providers, feature flags, secret scopes, deployment identity, logging destination, and sandbox capability policy.

## Configuration policy
Commit `.env.example`-style templates only; validate required variables at startup; never log secrets; document ownership and rotation; fail closed for missing financial or authorization configuration.

## Workspace services
Public web, Admin, API, PostgreSQL, Redis, market adapter, background jobs, and optional Cloudflare/container adapters must start through documented local orchestration with readiness checks and deterministic ports.

## CI/CD gates
Clean install, formatting, lint, type check, unit, integration, contract, migration, production builds, browser smoke, security checks, artifact manifest, staged deployment, post-deploy verification, and rollback readiness.

## Human gates
Credential changes, infrastructure creation, deployment, production migration, DNS/network changes, and destructive resource actions require current explicit approval.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
