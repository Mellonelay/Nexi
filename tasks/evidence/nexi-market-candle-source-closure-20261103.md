# NEXI market candle and Public source closure — 2026-11-03

## Scope and disposition

Source closure batch completed and pushed; no deployment, service restart, browser acceptance, financial operation, or database mutation was performed. BullMQ/Valkey remains the backend durable-job transport; the “worker” in the chart reconnect path is the browser Web Worker in `frontend/public/market-stream-worker.js`. Backend market ingest uses its existing in-process bounded queue and Valkey publication/Gateway path; no market-specific BullMQ processor was found, and none was added.

## Source and Git

- Source batch commits: `0640cd253e04a71df3a9578884d5b919bd9f16d2` and `d2db8ec8e017745ce1c1f3c001cff517bbbf583e`.
- Final source paths: backend market ingest/DTO/Kline service/types and focused Jest tests; frontend chart components, realtime hook, stream module/tests and browser worker; `frontend/tests/frontend-convergence.test.mjs`.
- Reconnect buffering and replay are bounded, generation/symbol/interval scoped, deterministic, and stale/final/provider revision aware. Candle freshness is distinct from quote freshness; ticker ticks do not mutate provider OHLC. Aggregated bars retain explicit lineage/finality. Ticker-only non-Binance quote aggregation publishes through the existing Kline Valkey/Gateway route with source-labelled provenance.
- Push used owner-account normal `git push origin main`; exit 0. Fetch confirmed local `HEAD` = `origin/main` = `d2db8ec8e017745ce1c1f3c001cff517bbbf583e`. `git diff --check origin/main...HEAD` exited 0. Tracked working tree clean. Existing untracked historical backups/generated artifacts were preserved and not staged.

## Verification receipts

| Check | Result | Scope / limitation |
| --- | --- | --- |
| Frontend market-stream Node tests | exit 0; 14/14 | Includes reconnect ordering, revisions, stale Kline status, bounded replay, worker behavior |
| Frontend TypeScript | exit 0; job `job_9301aaf33551` | `tsc --noEmit` at source SHA `d2db8ec` |
| Frontend scoped ESLint | exit 0 | Four changed TS/TSX files; no output/warnings |
| Backend market Kline Jest | exit 0; 11/11; job `job_ef17c0c8e099` | Backend files unchanged from tested commit `991a36760eab2c2349ae87d045661cf30535235e` through `d2db8ec` (verified `git diff --quiet`, exit 0) |
| Backend ingest and Gateway ordering Jest | passed in grouped run `job_8a80b0ffd441` | The grouped command had exit 1 because the Kline suite then exposed three fixture/expectation failures; those were repaired and the Kline suite rerun successfully |
| Backend build TypeScript | exit 0; job `job_3c2eb4e0e0c4` | Backend market sources unchanged after tested SHA |
| Fallow MCP changed-file check | returned successfully; origin/main scope 7 frontend files; no unused exports/types or React/Next issue counts | Shallow clone caveat; 3 unused-file candidates are dynamic worker/test entry points not imported through the static graph. Root-wide MCP invocation was degraded by absent root `node_modules`; no policy rule packs configured |
| Fallow MCP `trace_file` | reachable | `useRealtimeMarket` is imported by `RealtimeTradingChart`; hook imports API, market data and stream modules |
| Local Fallow targeted hook report | error-severity gate pass; 0 findings | Boundary warnings and policy rule packs not configured; no whole-repository cleanup attempted |
| Graphify local statistics | 7,590 nodes / 19,859 edges / 431 communities; built SHA matches `d2db8ec` | Static topology only |
| GitHub Actions for `d2db8ec` | React Doctor success; VPS Source CI and CodeQL were in progress at checkpoint | Exact run IDs: `41705222822`, `41705222827`, `41705222837`; final status must be read from GitHub |
| VM Kernel / Evolver | status healthy; scoped preflight `abstain` with null lesson/procedure | No signed verifier or evidence-backed lesson promotion |

The earlier frontend typecheck job `job_c9462e3243e4` predates reconnect buffering and is not used as final proof. Backend ESLint is not configured in this checkout; the prior attempt exited 2 with “no configuration file found”. Fallow audit could not create its base worktree (permission denied), so no audit result is claimed.

## Public/mobile acceptance boundary

Existing Public mobile source fixes were retained. Bounded source review found no additional established gap in Binance book/trades, Wallet/Convert, CoinGecko detail/provenance, account identity, Options navigation, dock or safe-area layout. Current-SHA screenshots, browser interaction at the required viewport/safe-area matrix, and authenticated wallet acceptance remain untested; older screenshots are not current-source proof. No browser acceptance is claimed.

## Continuity

All existing untracked backup/generated files remain untouched and unstaged. No Evolver lesson was promoted. Source implementation is complete; the remaining source-level external gate is exact-SHA GitHub Actions completion, followed only by separately authorized browser/runtime acceptance.