# NEXI Production Repository Blueprint

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Decision
Evolve the existing repository into a production-shaped workspace without deleting or duplicating working code. Target applications are `apps/web`, `apps/admin`, and `apps/api`; target shared packages are `contracts`, `domain`, `config`, `ui`, `auth`, `observability`, and `testing`.

## Current evidence
The repository currently has three package roots: root utilities, `backend`, and `cloudflare-container-bootstrap`; the public Next.js app is nested at `cloudflare-container-bootstrap/dexi-frontend`; Admin is embedded at `app/dashboard/admin`; no workspace declaration is present.

## Required topology
- `apps/web`: the existing 11-route public application.
- `apps/admin`: a separate role-gated Admin Control Plane.
- `apps/api`: NestJS authoritative backend/runtime.
- `packages/*`: versioned shared contracts, domain primitives, config, UI, auth, observability, and tests.
- `infrastructure/*`, `tests/*`, `scripts/*`, `docs/*`, `work/*`: deployment, verification, continuity, and operations.

## Migration policy
No source move occurs before dependency, import, deployment, and rollback maps exist. Each current path receives one action: KEEP IN PLACE, WRAP, EXTRACT, MOVE, REPLACE, DEPRECATE, or REMOVE LATER. During migration only one implementation may be active for each runtime responsibility.

## Workspace gates
One package-manager authority, one lockfile policy, root lint/type/test/build scripts, environment templates, clean-install instructions, and separately recorded web/API/Admin baselines are required before feature migration.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
