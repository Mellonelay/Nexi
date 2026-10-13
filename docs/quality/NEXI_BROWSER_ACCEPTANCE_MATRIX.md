# NEXI Browser Acceptance Matrix

**Status:** Current production browser-acceptance contract
**Authority reconciliation date:** 2026-10-03 (Asia/Yangon); requirements lineage began 2026-09-25.
**Browser workflow owner:** `/home/mellonelay1999/.agents/BROWSER_FABRIC.md`
**Completion decision:** current owner directive and directly verified source, deployed runtime and browser evidence; the old ledger is historical.

This document defines what browser evidence must prove. It does not own runtime architecture, completion status, or deployment authority.

## Production target

Browser acceptance for NEXI completion must exercise:
- deployed Public: `https://www.nexitrading.app`;
- real backend: `https://api.nexitrading.app`;
- Cloudflare Worker -> Cloudflare Container -> NestJS -> D1/Ledger/EventOutbox/Valkey paths applicable to the tested flow.

A local standalone frontend, mock backend, disconnected fixture, or VM-local NestJS process cannot prove end-to-end production behavior.
## Acceptance owners

- Polypane and Chrome DevTools are the primary responsive and live-browser acceptance environment.
- Recover the existing authenticated Coinbase Wallet and verify real SIWE signatures before protected Public flows.
- Chrome DevTools MCP supports DOM, network, console, response-header and viewport diagnostics in the actual session.
- The old standalone Chrome/MetaMask route and duplicated Playwright campaigns are historical, not current test authority.
- D1/Ledger correctness requires separate backend evidence; a browser screenshot does not prove accounting.

## Public coverage

Cover every applicable Public product path before owner manual acceptance:
Dashboard/Quotes Hub; Asset Detail; Spot/Margin; Options/Binary; Wallet; Earn/Mining; Loans; Support; Announcements; Learn; Messages; Settings.

Consumer market status vocabulary is `Live | Error | Closed`. Internal provider/recovery states may be richer but should not leak into ordinary consumer UI.
## Interaction and responsive coverage

For affected surfaces verify:
- 320 / 360 / ~390 / 412-430 mobile widths;
- representative tablet and desktop;
- short-height mobile where primary actions/dock interaction is material;
- no persistent horizontal page overflow;
- safe-area and dock clearance;
- loading / loaded / legitimate empty / error / retry / recovery states;
- keyboard/focus/semantic accessibility where applicable;
- no material framework overlay or relevant unexplained console/runtime error.

For trading paths verify Active Pair continuity, chart/timeframe behavior, Spot/Margin mode, Options/Binary state, order/depth/trades surfaces, reconnect/recovery where applicable, and truthful disabled/unavailable states.
## Identity-dependent coverage

Use controlled test identities where safe:
- controlled browser wallet for SIWE/session and protected wallet flows;
- controlled Admin identity for RBAC/protected Admin actions.

Do not weaken auth gates, use real funds, expose private keys, or fabricate balances/state to make browser tests pass. An owner deferral remains explicit and does not count as acceptance.

## Evidence record

Record only evidence needed to support the claim:
- deployed source/release identity;
- target URL + real backend target;
- verified Polypane/DevTools session, Coinbase Wallet identity and actual CSS viewport;
- tested flow and expected result;
- actual result;
- material network/console/runtime errors;
- screenshots/video when useful;
- defect classification;
- post-repair confirmation.

Browser evidence does not prove ledger correctness, financial invariants, authorization correctness, durable-state ownership, or accounting truth. Those require backend/domain evidence.
## Current handoff rule

Current owner acceptance and direct browser/runtime evidence own live pass/fail state; the retired ledger is historical only. This matrix intentionally does not duplicate transient results.
