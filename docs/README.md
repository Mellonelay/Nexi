# NEXI Documentation Authority Map

This directory contains current contracts plus historical lineage. File presence does not imply current authority.

## Current decision path

For substantial NEXI work, use this order:

1. Current explicit owner decisions.
2. Current runtime/tests for the claim they actually prove.
3. Current GitHub `main` source.
4. Direct platform state.
5. Deterministic graph/static/telemetry evidence.
6. Inference.
7. Historical docs, chats, handovers, exports, and archived analysis.

Core current files:
- `../AGENTS.md` — repository execution/governance contract.
- `../NEXI_CURRENT_STATE.md` — compact current durable truth.
- `../NEXI_PRODUCTION_COMPLETION_LEDGER.md` — sole production completion controller.
- `operations/NEXI_CAPABILITY_ROUTING.md` — NEXI capability/routing overlay.
- `infrastructure/` — current Cloudflare/backend operator and environment contracts.
- `contracts/` — API/event/state-machine contract material, subject to current source.
- `security/` — surviving security/financial-integrity requirements.
- `quality/NEXI_BROWSER_ACCEPTANCE_MATRIX.md` — current browser evidence contract.
- `../cloudflare-container-bootstrap/dexi-frontend/AGENTS.md` — Public frontend execution contract.
- `../cloudflare-container-bootstrap/dexi-frontend/DESIGN.md` — Public visual/interaction authority.

Global Worker-0 mechanics and browser tooling are not duplicated here:
- `/home/mellonelay1999/RDC_ONBOARDING.md`
- `/home/mellonelay1999/.agents/BROWSER_FABRIC.md`

## Chronology and supersessions

Use [the dated documentation and graph register](operations/NEXI_DOCUMENTATION_CHRONOLOGY.md) to distinguish current contracts, historical requirements, and evidence snapshots. The register is navigation/provenance, not another completion controller. Public geometry is closed by the ledger's 2026-10-02 receipt; full production acceptance remains open.

## Historical locations

- `archive/` — superseded analysis/design/program artifacts retained for provenance.
- `recovery/` — recovery/forensic handovers; never current authority by themselves.
- dated evidence inside older domain documents remains historical unless current source/runtime reconfirms it.

## Reuse rule

`PROVEN + UNCHANGED = REUSE`.

Do not restart a domain because an older document contains a stale SHA, phase name, or environment snapshot. Resolve conflicts against current owner decisions, current source, current runtime/platform evidence, and the production completion ledger.

## Browser/runtime rule

A browser claim that NEXI works must use the deployed Public generation and the real Cloudflare backend. Preserved authenticated Worker-0 Chrome is the primary NEXI product acceptance surface; Playwright and DevTools support that same profile/tab. Polypane provides secondary responsive breadth; BrowserStack provides targeted real-device/cross-browser evidence when that claim requires it. Do not duplicate acceptance passes or assume secondary sessions inherit wallet authentication.

## Maintenance rule

When durable truth changes, update `NEXI_CURRENT_STATE.md`. When durable completion evidence changes, update the production ledger. Archive or clearly mark superseded planning/recovery material rather than allowing it to compete as a second controller.
