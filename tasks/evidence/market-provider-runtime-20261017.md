# Market provider runtime and focused repair — 2026-10-17

**Observation window:** 15:11–15:20 UTC
**Source checkout:** `/home/mellonelay1999/workspaces/Nexi`, `main`, HEAD `af0f8cc5c45301aa9f8ef6cd898d2f82d24cd747` before this uncommitted repair.
**Runtime:** `nexi-api.service`, PID `1749407`, Node `24.21.0`, started `2026-10-17 10:08:14 UTC`; `/srv/nexi/backend/dist/src/main.js` SHA-256 `95f8934947e2a4bb7df6e7beacc5ea57e20ede1de78930bd5c899a2d71997608`. No service restart or deployment occurred.

## Live API observations

All requests below were read-only HTTPS GETs to `api.nexitrading.app`; no credentials were sent.

| Request | Result at observation | Evidence |
|---|---|---|
| `/readyz` | HTTP 200, `READY`, database and Redis healthy, authority `SQLite` | Runtime binding only; not global data-parity proof |
| `/market/prices` | HTTP 200, 53 symbols | BTCUSDT, ETHUSDT and ADAUSDT were `LIVE` from Binance WebSocket with observation times within one second. USDRUB was `STALE`, Yahoo `rest:chart:1d`, observed `2026-10-16T21:00:38Z`, received `2026-10-17T15:11:53Z`; its `sessionState` was incorrectly reported as `OPEN`. AAPLUSDT, EURUSD and XAUUSD were `UNAVAILABLE` with `CLOSED` / `MARKET_CLOSED`. `XAUUSDT` was absent; the canonical metal symbol is XAUUSD. |
| `/market/depth?symbol=BTCUSDT&limit=20` | HTTP 200, `LIVE`, Binance Spot REST, 20 bid and 20 ask levels | `observedAt=2026-10-17T15:11:47.081Z` |
| `/market/trades?symbol=BTCUSDT&limit=50` | HTTP 200, 50 Binance Spot trades | Trade timestamps were current; prior bounded check confirmed ascending order. |
| `/spot/orderbook?pair=BTCUSDT` | HTTP 200, `UNAVAILABLE`, empty book, source `nexi-internal-spot` | This is the internal NEXI Spot order book, not Binance reference depth. |
| `/spot/market-trades?pair=BTCUSDT` | HTTP 200, empty list | This is internal NEXI Spot execution history, not public provider trades. |
| `/spot/margin/quote?pair=BTCUSDT` | HTTP 200, `LIVE`, Binance Spot WebSocket | Margin quote path is distinct from internal Spot orders/history. |

The five historical D1/SQLite catalog/config differences were rechecked with project-local Wrangler 4.127.1 read-only `SELECT *` queries and SQLite opened in `mode=ro`. All primary-key sets and counts match: MarketAsset 55, MarketAssetCapability 55, MarketPair 53, MarketProviderConfig 9, MarketProviderSymbol 270. The only differing column is `updatedAt`, in 55, 55, 53, 5, and 126 rows respectively (244 rows total). No provider/config content difference was found. Wrangler reported zero rows written. This resolves the five content mismatches as timestamp-only drift; it is not a quiesced global D1/SQLite watermark.

## USD/RUB cause and source change

The public MOEX ISS response for `USD000UTSTOM` returned `LAST=83.73`, `SYSTIME=2026-10-16 23:55:02`, and `TRADINGSTATUS=N` during the Saturday observation window. MOEX's Currency59 status reference defines `N` as “Not traded right now”; the reference also defines `C` as closed and `B` as a break: <https://ftp.moex.com/pub/ClientsAPI/ASTS/Bridge_Interfaces/Currency/Currency59_Broker_English.htm>. The adapter previously requested only `LAST/BID/OFFER/TIME/SYSTIME`, so it discarded the exchange status and emitted an unqualified delayed ticker. That left the API presenting the stale Yahoo fallback with `sessionState=OPEN`.

`backend/src/market/moex-usdrub.adapter.ts` now requests `TRADINGSTATUS`. MOEX `N`, `C`, and `B` produce the existing closed-session marker; a `T` trading status remains open. Unknown status values are ignored instead of being promoted as a quote. The existing authority path turns the closed marker into `UNAVAILABLE` with `sessionState=CLOSED` and `reason=MARKET_CLOSED`; no new API event shape or frontend change was introduced.

Regression coverage was added to `backend/test/market/non-crypto-market.adapters.spec.ts` for closed, trading, and unknown-status responses. The focused suite passed **17/17** using the service Node binary (`/opt/nexi/runtime/node-v24.21.0/bin/node`) and Jest `--runInBand`. An initial attempt with the interactive Node 22 failed before tests because Nest 12 ESM modules require the service Node 24 runtime; rerunning under Node 24 passed. The local source repair is **implemented and tested, not built, deployed, or runtime-verified**.

## Other market-path evidence and remaining work

- Local Graphify CLI was refreshed after the source edit; a focused query found the MOEX adapter, router, ingest handler and market module. The hosted Graphify MCP index was stale at commit `36d5332` and was not used for current-source conclusions. Direct source inspection confirmed provider callback → bounded ingest queue → `MarketAuthorityService.ingestQuote`.
- Fallow `inspect_target` linked the adapter to the router, module and test; it found zero dead-code issues. It reported existing high complexity in `poll` and an SSRF candidate because `fetch` receives a constructed URL. Source review confirmed the host is the fixed `https://iss.moex.com`, with fixed path and symbol; the candidate is not user-controlled. No refactor or suppression was added.
- API logs repeatedly report queue saturation dropping reference `trade` events. These events are published through Valkey to `market.reference.trade` / `market.reference.depth`; they are realtime-only and not durable financial records. Depth is a full Binance top-20 snapshot and REST depth/trades are available, but client gap detection, replay, and resynchronization after pressure remain unproven. Do not claim the realtime recovery gate passed.
- A separate 8-second live Socket.IO probe at 15:23 UTC connected over WebSocket and received 90 `market_quote`, 28 `market_kline`, 403 `market.reference.trade`, 78 `market.reference.depth`, and one `market_snapshot` event; it observed no increasing tradeId gap within that interval. This is a short delivery sample, not a forced queue-pressure or reconnect/replay test, and does not prove recovery from dropped events.
- No API service restart, source build, deployment, financial operation, D1 mutation, frontend edit, Git commit, or push occurred. Existing dirty Wrangler and untracked Admin pnpm files remain untouched.

**Next:** finish the market realtime gap/recovery acceptance and remaining backend proof; run the coordinated source build/deployment only after the coherent repair set is ready, then verify the deployed USDRUB closed-session response and current market recovery.

## 2026-10-17 BiQuote catalog and returned-quote coverage recheck

**Observation:** 15:40–15:48 UTC, Saturday. Read-only public GETs to BiQuote and `api.nexitrading.app`; no credentials or writes. The current NEXI canonical non-crypto universe is 36 assets (20 stocks, 9 FX, 7 metals).

- `GET https://biquote.io/api/symbols` returned HTTP 200 and 2,061 catalog records. Every NEXI non-crypto asset has a catalog representation: 16 ordinary stock tickers plus `AMERICANEXPRESS`, `DISUSDT`, `UBERUSDT`, and `SONYUSDT`; all 9 FX pairs including `USDRUB`; and all 7 metals. Thus catalog representation is 36/36.
- A symbol-keyed `GET /api/latest` probe across 45 exact names and candidates returned quotes for 35 names. The 16 ordinary mapped stocks, 8 FX pairs other than USD/RUB, and 7 metals (31 total) returned retained quotes marked `marketState=closed`, `stale=true`, with source timestamps on Friday 2026-10-16. This is the expected closed-market last-quote behavior, not missing coverage.
- `DISUSDT`, `UBERUSDT`, and `SONYUSDT` each returned a quote from `aggr`; these provide quote responses for the three corresponding NEXI stock assets. The exact legacy BiQuote names `DISNEY`, `UBER`, and `SONY` did not return a latest quote in this snapshot.
- `AMERICANEXPRESS` is listed as a Stock catalog entry (`source=MT5-2`) but has no current tick: latest returned HTTP 404; tick history was `[]`; OHLC returned `bars: []`. It is the only NEXI non-crypto asset with no returned quote among the tested mappings/aliases. NEXI itself returned an AXP quote from its active Gate fallback at the later 15:47 UTC observation.
- Exact `USDRUB` is listed, but latest returned HTTP 404 with last quote 2025-06-20; its history and OHLC contain old records. `USDRUB_HKN` returned a current quote (source `hakandoviz`) at the observation. NEXI runtime still uses MOEX as USD/RUB primary; its own public response was stale Yahoo data marked OPEN before the unbuilt MOEX status repair.
- Current NEXI `/market/provider-state` shows 31 configured BiQuote symbols, matching the 16+8+7 mapping. NEXI `/market/prices` independently returned Gate quotes for AXP, Disney, Uber and Sony, so those assets are not missing from NEXI's overall market response. No provider configuration or source mapping was changed in this research pass.

**Interpretation:** BiQuote catalog coverage is 36/36; returned-quote coverage is 35/36 when `USDRUB_HKN` is counted as the USD/RUB pair. AXP/`AMERICANEXPRESS` remains the sole quote-data gap in this probe. This does not assert that each symbol is configured in NEXI or that all quote products have equal market-session behavior.

**Probe correction:** `/api/latest` returns an object keyed by symbol, not an array. An initial parser assumed an array; it was corrected, then results were cross-checked against the full symbol catalog and individual quote/history/OHLC requests for missing candidates. No runtime provider configuration or service was changed.

**Remaining market proof:** The MOEX `TRADINGSTATUS` source repair remains tested but not built/deployed. The queue intentionally drops best-effort reference trade/depth events at capacity; public REST trade/depth endpoints provide fresh read-back, but consumer gap detection/recovery after forced queue pressure has not yet been demonstrated. The source frontend reconnect path reanchors chart candles from REST; no frontend file was changed.

## 2026-10-17 status-code correction, queue-pressure read-back, and workflow

- **MOEX schema check:** Current official MOEX Currency53 documentation defines `TRADINGSTATUS` values N, O, C, F, B, T, I, S, A, a, b, p, and P. Here S means Opening Auction; “operations suspended” is a different field (`TSecStatus`). Therefore only N (not traded), C (closed), and B (break) map to the closed-session state. Unknown codes are ignored. Equities-only L/D/E are not accepted. Source: [MOEX Currency53 reference](https://ftp.moex.com/pub/ClientsAPI/ASTS/Bridge_Interfaces/MarketData/Currency53_Info_English.htm).
- **Focused test:** `backend/test/market/non-crypto-market.adapters.spec.ts` now covers closed N, active T, active opening-auction S, and unknown status. Node 24.21.0 Jest JSON run exited 0: **18 tests passed, 1 suite passed**. Structured result: `/tmp/nexi-market-adapters-20261017.json` (ephemeral; not a repository receipt).
- **Fallow:** `inspect_target` confirms the adapter is consumed by the provider router and market module and covered by the focused test. No dead-code findings. It reports existing complexity in `poll` / `intervalPlan`, plus an SSRF candidate at the fixed MOEX host; direct source confirms both URL origin and path are fixed, so no user-controlled SSRF path was found. No unrelated refactor/suppression was made.
- **Read-back after observed pressure:** API journal recorded a dropped reference trade at 15:52:04 UTC. At 15:53 UTC, read-only `GET /readyz`, `/market/prices`, `/market/depth?symbol=BTCUSDT&limit=20`, and `/market/trades?symbol=BTCUSDT&limit=50` all returned HTTP 200 and passed schema assertions. The depth response contained 20 bids and 20 asks with a current observation timestamp; trade response contained 50 records spanning 15:52:48–15:53:14 UTC. This proves fresh REST read-back after a queue drop. It does not prove event replay or automatic client refetch after a Socket.IO gap.
- **Feasible execution sequence:** (1) finish provider/source contract and focused test; (2) build the backend once after source repair closure; (3) deploy through the existing API runtime only; (4) verify `/readyz`, deployed USD/RUB market state, live quote/depth/trade snapshots, and source/artifact identity; (5) continue authenticated financial/workflow gates using existing authorized identities; (6) stop only at explicit external blockers for test-balance authority and independent encrypted backup destination/key custody. Queue drops remain limited to reference market events; never replay them as financial work.
- **Current limit:** source is still unbuilt/undeployed. Exact Socket.IO missed-event replay remains unsupported by the current v1 contract (`snapshot-on-connect-exact-replay-deferred`). No frontend or financial state changed.
