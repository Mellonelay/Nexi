# NEXI Current Product Scope Authority

**Effective:** 2026-08-19  
**Authority:** Current owner instruction, superseding stale scope wording in
older prompts, receipts, generated graphs, roadmap checkpoints, and memory
summaries.

## Canonical product wording

The public trading experience has two pages:

1. **Spot/Margin** — one page and one shared market context. It contains:
   - ordinary Spot order execution;
   - isolated Spot Margin positions;
   - LONG and SHORT directions;
   - exactly 2x, 3x, and 5x leverage.
2. **Options** — a separate page. Its backend implementation/domain name is
   Binary/Microtrade; its public label is **Options** and its user-facing
   actions remain Long and Short.

The existing route `/dashboard/spot` is the Spot/Margin page. The existing
route `/dashboard/binary` is the Options page. The route name `binary` is an
implementation compatibility detail, not the preferred public label.

## Explicit exclusions

Cross margin, futures, perpetual contracts, portfolio margin, C2C, and copy
trading remain excluded.

## Authority reconciliation

This document is the short current-scope anchor. It overrides stale statements
that say Margin is retired or that Options/Binary is only Binary. Historical
receipts and dated archaeology remain unchanged as provenance, but cannot
override this scope. Future source, schema, route, Admin, Graphify, and
Codebase Memory work must use the canonical wording above.

## Current source evidence

- `cloudflare-container-bootstrap/dexi-frontend/app/dashboard/spot/page.tsx`
  contains the `SPOT`/`MARGIN` surface selector, isolated-margin workspace,
  LONG/SHORT controls, and 2x/3x/5x controls.
- `cloudflare-container-bootstrap/dexi-frontend/app/dashboard/binary/page.tsx`
  renders the separate Options page and uses the Binary API contract.
- `backend/src/spot/margin.service.ts` contains the isolated-margin domain
  implementation and reuses the Spot order and Ledger authorities.
- `backend/src/binary/binary.service.ts` contains the Options/Binary domain
  implementation and settlement lifecycle.

## Important implementation status

The frontend terminology, margin implementation, and backend `SpotModule`
controller registration are present in source. Runtime route and browser proof
remain separate gates and must not be inferred from source registration.
