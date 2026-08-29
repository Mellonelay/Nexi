# NEXI Local Development and Services

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Current baseline
Windows 11 ARM64 and PowerShell 7 are authoritative. WSL is not assumed. Existing package roots are root utilities, `backend`, `cloudflare-container-bootstrap`, and nested `dexi-frontend`.

## Required local workflow
One setup command, one environment validation command, one service-start command, one validation command, and one bounded shutdown command after workspace foundation. Commands must not print secret values.

## Service readiness
PostgreSQL schema/migration state, Redis ping/adapter, API health/readiness, WebSocket handshake, frontend route, Admin route, market-feed status, and background-job status.

## Data policy
Provide documented test/sandbox fixtures and idempotent seeds. Never use destructive reset scripts by default. Database reset, migration rollback, or seed replacement requires explicit confirmation and backup/restore guidance.

## Troubleshooting evidence
Record process IDs, ports, health responses, sanitized errors, exact failed stage, and one next action. Do not repeatedly start duplicate servers or model/CLI sessions.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
