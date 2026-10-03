---
name: worker0-codescene
description: Operate CodeScene CLI and MCP for Code Health, delta reviews, hotspots, technical-debt prioritization, ownership, refactoring risk, and AI-generated-code safeguards.
---
# Worker-0 CodeScene

Use CodeScene when the question is maintainability and Code Health risk rather than general topology.

CLI owns local git delta analysis, single-file review/check, and deterministic hook-style quality gates.
MCP owns Code Health review/score, branch change-set analysis, hotspots, technical-debt goals, ownership, and guided refactoring context.

Authentication state is separate from installation. Prefer stored OAuth/session login; use access token only as fallback where required.

Quality loop:
baseline -> targeted refactor -> rerun same measure -> focused tests/runtime checks -> parent completion claim.

Do not treat a Code Health score as runtime correctness.
Read references/commands.md.

## Vendor skill integration

CodeScene MCP currently exposes nine official workflow Skills. Route to them when the task is specifically configuration, installation, Code Health explanation, guided refactoring, business case, debt prioritization, risk-based testing, ownership, or AI-generated-code safeguarding.

The Worker-0 wrapper owns global CLI/MCP surface selection and Astra evidence boundaries; vendor Skills own their specific CodeScene workflow.

## NEXI mandatory integration

Follow ~/.agents/skills/nexi-codescene-quality-gates/SKILL.md for the 10.0 target, per-file review, pre-commit safeguard and HEAD/base PR safeguard. The organized nine-skill list and live MCP/CLI scope are in its references/capabilities.md. Preserve existing auth, paused work and production acceptance boundaries.
