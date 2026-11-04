# NEXI Browser Acceptance v2 — Phase B Source Repair Supplement

Date: 2026-11-04
Task: `NEXI_BROWSER_ACCEPTANCE_V2_20261104`
Authority: current owner v2 directive; canonical checkout `/home/mellonelay1999/workspaces/Nexi`.
Primary Phase A register: `tasks/evidence/nexi-browser-acceptance-v2-20261104.md` (preserved unchanged; currently owned by root and not writable by the owner account). This supplement records the later source and validation frontier without modifying its chronology.

## Phase A gate and release identity

The feasible read-only browser sweep was completed before any source changes. Public source checkout and `origin/main` were `2a74ce1b60940221ddb53f95baf4ec04a1f6eac4` at intake. Deployed Public/Backend release remained `188fdba1b9e703f04f1c3fbe32186f7daa6dce22`; deployed Admin remained `111a5010f04a6592c290b0b0bc93240ab0cec69b`. No deployment, restart, financial mutation, privileged Admin mutation, message send or authenticated economic action occurred.

The Phase A release/UI/browser evidence, 32-destination Admin route table, run observations, and unresolved test gates remain in the primary register. Older statements there that Phase A remained open are historical checkpoints superseded by its later “Phase A gate closure — feasible read-only sweep” section.

## Confirmed defects and source repair

| Defect | Evidence and fix | Status |
|---|---|---|
| `NEXI-PUB-CHART-INDICATOR-CONTROLS` P2 | Spot wrapper explicitly passed `showIndicatorControls={false}` despite `TradingChart` defaulting controls on for `type="spot"`. Removed the override so the existing six-button indicator rail appears below the chart plot per `frontend/DESIGN.md`. | `frontend/app/dashboard/spot/page.tsx` SOURCE_IMPLEMENTED. Browser regression awaits a separately authorized release. |
| `NEXI-PUB-CHART-STALE-STATUS` P2 | The chart mapper collapsed `STALE` to generic `ERROR`; a live 1d Kline response had `dataState=STALE` and 91 valid ordered candles, yet UI showed “Market error.” Preserved `STALE` and `CONNECTION_LOST` states and added truthful “Stale market data” / “Reconnecting” chart overlays while leaving available candles visible. | `frontend/app/lib/market-data.ts` and `frontend/app/components/TradingChart.tsx` SOURCE_IMPLEMENTED. Browser regression awaits a separately authorized release. |

Regression coverage was updated in `frontend/app/lib/market-data.test.mjs` and `frontend/tests/frontend-convergence.test.mjs` for status mapping, stale/reconnecting copy, preserved historical candles, and Spot indicator defaults. P3 form autofill findings remain a candidate and were not included.

## Validation receipts

All commands ran as `mellonelay1999`, with Node `v24.21.0`, npm `11.19.0`, and `frontend/node_modules` resolving to `/srv/nexi/public/shared/node_modules`.

| Check | Result |
|---|---|
| `node --test app/lib/market-data.test.mjs tests/frontend-convergence.test.mjs tests/spot-contract.test.mjs` | Exit 0; 23/23 passed. Node emitted `MODULE_TYPELESS_PACKAGE_JSON` performance warnings for existing TypeScript modules. |
| `./node_modules/.bin/tsc --noEmit --incremental false` | Exit 0 against readable existing generated route types. |
| `npm run typecheck` (`next typegen && tsc ...`) | Exit 1 at `next typegen`, before TSC, with `EACCES` writing `frontend/.next/types/routes.d.ts`. The `.next` tree is root-owned (`root:root`); no chmod/chown/removal or generated-artifact cleanup was performed. |
| Changed-file ESLint | Exit 0, zero errors; five `react-hooks/set-state-in-effect` warnings in existing, unchanged Spot effects at lines 167, 216, 735, 844 and 1070. |
| React Doctor, changed lines | Exit 0; `--scope lines --base HEAD --no-lint --no-supply-chain --no-score --max-duration 45 --json-compact`; scanned 5 changed files, no issues. |
| `git diff --check` | Exit 0. |

One initial source-test assertion failed because the newly written regex over-escaped literal source text. It was replaced with direct string assertions; the final 23/23 run passed. The first unscoped React Doctor attempt lost its SentinelX connection without output and is not counted. A scoped invocation with file paths plus `--scope lines` was rejected by the CLI; the corrected invocation above passed.

## Tool and graph evidence

- SentinelX VM Kernel status: healthy; task-scoped preflight for `NEXI_BROWSER_ACCEPTANCE_V2_20261104`, frontend-chart-source / sentinelx-exec / shell-command / mellonelay1999-vm-owner / scoped-source-repair-tests-no-deploy-no-financial-mutation returned `abstain`. This is valid and no lesson was promoted.
- Server-issued Kernel run: `run_ec95b74e4ed54539b992` (implementation phase). Final completion event/checkpoint to be written after Git synchronization.
- `worker0-skill-route` and its checkpoint wrapper returned `RuntimeError: Current method/router unavailable: incremental-implementation`; relevant frontend debugging and code simplification instructions were read directly. This failed route selection did not block the actual bounded source work.
- `graphify` CLI 0.9.101. The root graph was stale: `graphify-out/graph.json` metadata `built_at_commit=0107eccca1f6990bef579ea9c2e43ca89423ddbe`; the nested 2026-11-03 report says `fa471750`. Initial query was broad/truncated (507 nodes); narrowed caller query returned 17 nodes and identified `SpotChartArea()` / `MarginWorkspace()` → `SpotRealtimeTradingChart()` → `RealtimeTradingChart`. Per frontend instructions, refresh once after the commit and check its built SHA before recording final topology.
- Browser tools were used during Phase A via existing `@nexi-chrome-readonly`; no post-fix browser action can establish the changed source because it is not deployed.

## Open proof and dependency

No fix is DEPLOYED or BROWSER_VERIFIED. Required follow-up: normal source commit/push and exact final SHA/CI reconciliation; then, after separate owner release authorization, deploy that SHA and perform one grouped chart regression on its new release. Current DevTools MCP cannot emulate the requested width matrix, touch gestures, WebSocket frames or persist screenshots to the repository. Economic/Admin acceptance remains blocked by the missing approved TEST identity, eligible deposit fixture, funding/stake amount, isolated Binary configuration boundary and lower-role identity. Historical route-load proof does not count as full Admin workflows.
