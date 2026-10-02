# NEXI durable phase reconciliation

The skill checkpoint previously kept routing leases only in `/tmp`. Phase completion and ledger reconciliation were prose obligations without a mechanical check. The existing checkpoint now invokes `scripts/nexi_phase_checkpoint.py` for NEXI, stores skill fingerprints in persistent local state, and saves phase receipts in the existing continuity capsule.

## Authority and recovery

- `NEXI_CURRENT_STATE.md` and `NEXI_PRODUCTION_COMPLETION_LEDGER.md` remain the durable authorities. No additional completion ledger exists.
- `/home/mellonelay1999/nexi-work-current-checkpoint.json`: `workCycle` owns the active engineering phase; existing production/geometry fields retain product proof.
- `/home/mellonelay1999/nexi-phase-receipts/`: sealed evidence receipts, referenced by the capsule. They are evidence, not authorization or owner acceptance.
- `/home/mellonelay1999/.local/state/worker0-skill-continuity/`: cached skill selection/fingerprints; refresh affected entries on contract/authority/phase changes. Cache availability is not current authentication proof.
- Read the capsule, current authority and selected ledger row at recovery. Resume the saved active phase; do not overwrite completed product proof with an in-progress engineering phase.

## Entry and transitions

Use the installed `worker0-skill-checkpoint` with explicit `--phase` and a preserved `--session-id`. First gate entry also requires `--goal`, `--slice`, `--next-proof`. Later work steps in the same phase are no-op durable writes.

Before a phase change, save a small JSON receipt and pass `--phase-receipt /absolute/input.json`. The receipt closes the **previous** active phase, not the requested new phase:

```json
{
  "goal": "exact recovered workCycle goal",
  "slice": "exact recovered workCycle slice",
  "phase": "implementation",
  "outcome": "VERIFIED",
  "proof": "IMPLEMENTED and focused-tested; not runtime verified",
  "nextProof": "Verify affected runtime behavior",
  "evidence": ["/absolute/non-secret/evidence-file.json"],
  "reconciliation": {
    "NEXI_CURRENT_STATE.md": {
      "action": "UPDATED",
      "reason": "Specific durable truth and section updated"
    },
    "NEXI_PRODUCTION_COMPLETION_LEDGER.md": {
      "action": "UNCHANGED",
      "reason": "Selected row has no new completion proof at this phase"
    }
  }
}
```

`UPDATED` must match a changed file hash since phase entry; `UNCHANGED` requires an explicit reason and an unchanged hash. The parent updates exact affected sections before submitting the receipt. The gate snapshots both authorities and hashes evidence; a later authority/evidence change blocks reuse until the affected receipt is reconciled again.

`--reason completion` or `--stage completion` requires a receipt for the current final phase, in addition to earlier-phase closure. If entering completion for the first time, enter it, do the final reconciliation, then submit its receipt. A `BLOCKED_WITH_EVIDENCE` outcome preserves a genuine blocker without implying product completion. A new slice requires prior-phase closure plus its new goal/slice/next proof.

A file lock serializes gate writers and atomic replacement preserves the capsule. Other capsule writers must respect the same `.lock`; a byte comparison rejects observed external changes. An orphan receipt after an interrupted write is harmless; the capsule points only to accepted receipts. Never save credentials, tokens or raw sensitive logs as evidence.

## Graphify responsibilities

Use `graphify save-result` for specific verified useful/dead-end/corrected investigations and `graphify reflect --if-stale` for reusable lessons. Graph structure and lessons help locate owners; current source/tests/runtime prove behavior. Do not rebuild a graph just for a phase change. Cloud memories may require review before publication; pending memory is not shared recall or ledger proof.

The CLI reference is version-scoped; use installed help for flags. No Obsidian vault, watcher, cron, new service or parallel lifecycle engine is introduced.

## Limits and verification

This gate validates presence, hashes and declared reconciliation, not the semantic truth of arbitrary evidence or Markdown. The parent must inspect proof scope, selected ledger rows and source/deployed identity separately. `VERIFIED` means a phase receipt exists; it is not `DEPLOYED`, `RUNTIME_VERIFIED` or `OWNER_ACCEPTED`.

ChatGPT has no exposed mandatory phase/SessionEnd hook here. The gate enforces the standard checkpoint route, not actions that bypass it. Project instructions require that route; this is not a guarantee of automatic ledger edits by every future chat.

Run `cd scripts && python3 -m unittest -v test_nexi_phase_checkpoint.py`. Tests cover missing closeout, stale authorities/evidence, false reconciliation, rejected implicit acceptance, blocked proof, recovery, preserved product truth and final-phase closure. The installed wrapper is tested separately for a refused transition followed by successful receipt recovery.
