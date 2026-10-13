# NEXI Cloudflare and Container Architecture

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Historical charter reference:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md` (not the current product or completion authority)
**Current source/navigation authority:** `docs/README.md` and current GitHub `main`; old ledger is historical
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Current evidence
`cloudflare-container-bootstrap` contains Wrangler 4, a Cloudflare Container binding/Durable Object, Dockerfiles, an Nginx config, and a nested Next.js frontend. This is a deployment adapter, not final domain authority.

## Target responsibilities
Cloudflare edge routing, TLS/origin protection, static/frontend delivery, container lifecycle, health routing, environment bindings, and approved caching. The NestJS API, database, Redis, and background jobs retain explicit runtime ownership.

## Required design decisions
Public/Admin/API domains, Worker versus container boundaries, image/build contexts, durable-object responsibility, WebSocket transport, health/readiness, secrets/bindings, network egress, scaling, persistence, logs/metrics, deployment sequence, and rollback.

## Migration rule
Do not relocate the nested frontend or backend into new build contexts until local builds, Docker builds, Wrangler dry validation, import paths, environment variables, and rollback are proven.

## Production gate
No deploy from this program pack. Later deployment requires explicit approval, artifact identity, environment diff, migration plan, health verification, browser/API smoke, and tested rollback.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
