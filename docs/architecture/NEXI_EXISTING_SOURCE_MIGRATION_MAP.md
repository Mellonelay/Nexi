# NEXI Existing Source Migration Map

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Current-to-target map
| Current path | Target role | Initial action |
|---|---|---|
| `cloudflare-container-bootstrap/dexi-frontend` | `apps/web` | KEEP IN PLACE, then staged MOVE after import/build map |
| `cloudflare-container-bootstrap/dexi-frontend/app/dashboard/admin` | `apps/admin` reference | EXTRACT reusable controls; remove public route only after replacement is verified |
| `backend` | `apps/api` | KEEP IN PLACE, then staged MOVE after Prisma/build/deploy map |
| `backend/src/contracts` | `packages/contracts` seed | REVIEW, NORMALIZE, EXTRACT |
| `backend/src/authority` | `packages/domain`/API authority seed | KEEP and implement; do not treat interfaces as runtime proof |
| `cloudflare-container-bootstrap` | infrastructure adapter | KEEP; separate Worker/container deployment concerns from app source |
| root `package.json` | workspace authority candidate | MODIFY only after package-manager decision |

## Known exclusions
`backend/src/contract` and leverage/contract Prisma models are out of current product scope. Do not extend them; isolate and remove only in an approved cleanup stage.

## Required pre-move evidence
Import graph, package dependency graph, Prisma path impact, Docker/Cloudflare build context impact, environment path impact, test path impact, staged copy/move sequence, rollback commands, and clean build before and after each migration gate.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
