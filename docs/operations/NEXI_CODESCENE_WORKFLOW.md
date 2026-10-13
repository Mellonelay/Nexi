# NEXI CodeScene workflow

> **Historical specification / superseded as live authority (2026-10-14).** This document preserves earlier requirements and rationale, not current deployment or completion status. Apply current owner decisions, current GitHub `main`, and [documentation authority](../README.md) before using any older rule or phase gate. Preserve still-applicable financial/security invariants.


Follow the existing NEXI Work Kernel and [the organized CodeScene skills and capabilities](worker0-codescene/references/capabilities.md). Apply [the quality-gate skill](worker0-codescene/SKILL.md) for AI code changes.

The corresponding Worker-0 install is ~/.agents/skills/nexi-codescene-quality-gates; worker0-codescene remains its CLI/MCP execution wrapper. The stored global-integration-patch.json records the bounded installed governance additions, not another controller or inventory.

Mandatory checks: per-file review after AI edits, pre_commit_code_health_safeguard before commits, analyze_change_set before PRs, and the deterministic staged hook scripts/hooks/codescene-pre-commit. Target 10.0; coverage and target remain separate from non-regression.
