# NEXI S5 Public Zod Reachability Review — 2026-10-26

## Scope and source identity

- Reviewed the Public wallet dependency path only, for the supplied `npm audit --omit=dev --json` result. The parent reports **21 findings: 0 critical, 12 high, 9 moderate**. The review did not rerun the audit.
- Source checkout: `main`, `HEAD=56da6ce67d7f53410fae9d66d777967793b94fc3` (matches the current-state note). The working tree was already broadly dirty before this receipt. In particular, `frontend/package.json` and `frontend/package-lock.json` are modified and not committed at this HEAD; many unrelated owner docs/task files are modified and untracked. The assigned receipt path was absent before this write. Preserve all of that state.
- Therefore the SHA identifies the checkout, while the audit is specific to the **current working-tree manifest/lock**, not provably the committed lock at that SHA. The lock diff contains more than the Sentry correction and x402 cleanup, so do not describe the audit as a committed-HEAD-only result.
- Audit fix hint: npm reports `wagmi@3.7.9`, which is a semver-major move from Public's declared `wagmi ^2.19.5` / resolved `2.19.5`. This is not evidence that the major is compatible. No forced Zod override or connector change is justified by `fixAvailable` alone.

## Version and dependency evidence

Manifest versions: `frontend/package.json:17,21,46` declares `@coinbase/wallet-sdk ^4.3.7`, `@rainbow-me/rainbowkit ^2.2.10`, and `wagmi ^2.19.5`; the current working lock resolves `wagmi 2.19.5` and `@wagmi/connectors 6.2.0` (`frontend/package-lock.json:8372,18201`). `frontend/package-lock.json` is lockfile v3.

The current working lock contains these production Zod copies relevant to the reported chain:

- `zod 3.25.76`, reached in lock metadata as `wagmi → @wagmi/connectors → @base-org/account → @coinbase/cdp-sdk → zod` (`frontend/package-lock.json:371,483,18642`). `@coinbase/cdp-sdk` also lists `abitype 1.0.6` as a dependency and Zod as a dependency; `abitype`'s own lock entry describes Zod as an optional peer, not as an array parser (`frontend/package-lock.json:488-500,523-541`).
- `@reown/appkit-wallet 1.8.19` carries nested `zod 3.22.4`; the lock path is `wagmi → @wagmi/connectors → @walletconnect/ethereum-provider 2.24.0 → @reown/appkit 1.8.19 → @reown/appkit-wallet → zod` (`frontend/package-lock.json:4672,5084-5099,8526`).
- `porto` has nested `zod 4.6.7` (`frontend/package-lock.json:15485`), above the supplied patched version. `@wagmi/cli`'s Zod `4.4.3` is development-only and outside the reported `--omit=dev` scope (`frontend/package-lock.json:8362`).

These are lock graph paths, not proof that each dependency's module executes in a production browser bundle. No installed package source or deployed bundle was inspected; installed-source/lock agreement and actual bundle inclusion remain unknown.

## Graphify and source path

Commands run before source search:

- `graphify query "Public wallet connector dependency path from app source through @coinbase/cdp-sdk, abitype, @reown/appkit-wallet, @reown/appkit*, @walletconnect/ethereum-provider, @wagmi/connectors, wagmi, and Zod array parsing exposure"`
- `graphify query "Public dependency configuration for wagmi connectors and Zod schemas, app source imports and attacker-controlled parse inputs" --budget 7000`
- `graphify explain "frontend/app/lib/wagmi.ts"`
- `graphify explain "WalletConnectControl.tsx"`
- `graphify path "wagmi.ts" "connectors"` and `graphify path "WalletConnectControl.tsx" "wagmi.ts"` (both returned one-hop paths).
- `graphify explain "connectors"`
- `graphify path "frontend/app/lib/wagmi.ts" "frontend/app/components/WalletConnectControl.tsx"` and `graphify path "frontend/app/lib/wagmi.ts" "@walletconnect/ethereum-provider"` (both returned no directed path for those exact queried labels).

The graph maps `WalletConnectControl.tsx` to `wagmi.ts`, `wagmi.ts` to its `connectors` declaration, and identifies the control's consumers, including the Public wallet page. It did not connect the exact package-node labels to those source nodes. Source confirms the client-side path: `frontend/app/lib/wagmi.ts:1-5,13-22` configures `coinbaseWallet()` and `injected()`; `frontend/app/providers.tsx:12-13,39` installs that config in `WagmiProvider`; `frontend/app/components/WalletConnectControl.tsx:4-5,62-70,98-100` consumes `useConnect` and presents its connectors. The runtime selection is based on discovered injected wallets plus Coinbase Wallet. There is no `walletConnect()` connector configured in `wagmi.ts`, although the lock includes WalletConnect/Reown through `@wagmi/connectors`' dependency graph. The `@base-org/account`/CDP SDK path likewise appears in the package lock but is not named as a configured connector in app source.

The Public source search found no app-owned Zod import or Zod `.parse`/`safeParse` call. This fact alone does **not** clear the transitive advisory. The configured wallet adapters interact with provider-controlled values, but the reviewed source and lock metadata do not identify an unbounded Zod array schema on the selected Coinbase/injected path, nor establish whether package entrypoints or bundled connector modules reach one. No test or exploit request was run.

SIWE remains a separate app flow: `frontend/app/components/WalletConnectControl.tsx:29` calls `completeWalletSiwe`; `frontend/app/lib/wallet-siwe.ts:43-77` requests a challenge, checks chain/account consistency, signs the server challenge, then verifies it. The existing owner contract is to preserve provider selection and SIWE separation; no connector behavior was changed. Relevant design evidence: `tasks/NEXI_FINAL_CLOSURE_ROADMAP_20261026.md:25`, `docs/architecture/CROSS_SURFACE_FEATURE_MAP.md:27-32`, and `docs/quality/NEXI_BROWSER_ACCEPTANCE_MATRIX.md:101,132`.

## Advisory finding

**GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404 — High — UNABLE TO DETERMINE whether reachable through the selected Public wallet runtime path.** The GitHub-reviewed advisory says affected Zod versions are `<4.6.6`; the defect is an unbounded array schema accumulating validation issues for many invalid elements, enabling memory exhaustion. Its conditions require attacker-controlled, sufficiently large invalid array data to reach that parser. The current production lock has Zod `3.25.76` and nested `3.22.4` below the stated patched version, so the dependency condition is present. Lock ancestry connects those copies to the wagmi connector package graph, while Public source activates Coinbase Wallet and injected connectors and does not configure WalletConnect or Base Account explicitly. Available source does not tie either vulnerable array parser to a configured connector's attacker-controlled input; package source and production bundle membership were not inspected. Thus exploitability is neither demonstrated nor ruled out by this review. [GitHub-reviewed advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)

The prior 2026-10-25 triage receipt said Zod 3 did not match the then-understood affected implementation. This review uses the later reviewed advisory range `<4.6.6` and supersedes that version-range rationale; it does not upgrade dependencies or assert a reproduced exploit. The parent-reported 12 high package rows are propagated dependency-chain rows for this Zod advisory, not 12 independent source-level vulnerabilities, according to the existing triage record (`tasks/evidence/nexi-security-dependency-triage-20261025.md:82,84`). No other unique high advisory was supplied in the audit detail available to this lane; the raw audit JSON was not retained here, so an unseen additional advisory cannot be excluded.

## Result and next action

**Conclusion:** the production lock contains two Zod versions below the advisory's stated fixed version on transitive connector paths; source activates Coinbase and injected wallet integrations but does not expose a demonstrated unbounded Zod array parse from attacker-controlled values. Reachability is **unable to determine** without version-matched package source or an exact build/bundle trace. Keep the 12 high audit rows open; do not suppress them or call the audit clear.

Safe next action: have the dependency owner inspect the exact locked `@wagmi/connectors`, Coinbase/Base, WalletConnect/Reown and Zod package entrypoints (and determine actual production bundle inclusion) against the advisory's `ZodArray` parse path and untrusted input origin. Only then evaluate a compatible package-level fix while preserving the current connector selection and SIWE contract. Treat `wagmi@3.7.9` as a breaking-change candidate requiring explicit API/behavior compatibility review; do not force a global Zod override speculatively.

## Limits and change boundary

This is source/lock reachability evidence, not an exploit test, full npm audit review, complete tree-shaking/bundle analysis, installed dependency-source match, deployment check, or runtime proof. Graphify is structural evidence and its package-to-source directed paths were incomplete. The npm audit counts and `fixAvailable` are parent-provided; the raw audit JSON is unavailable to this lane. No source code, manifest, lockfile, task plan/todo, git index/history/remotes, cache, service, production, or application data was changed. Only this receipt was written. No build, test, install, audit rerun, deployment, or runtime check was performed.

## Follow-up — configured connectors and deployed client artifact

The primary integration owner inspected the existing canonical Public shared store and deployed client bundle after the initial lane. This follow-up narrows the earlier `UNABLE TO DETERMINE` conclusion for the current wallet path; it does not turn the npm audit into a clean result or prove the unbuilt dirty source.

- The current source lock resolves `wagmi 2.19.5`, `@wagmi/connectors 6.2.0`, `@coinbase/cdp-sdk 1.58.0`, `@base-org/account 2.4.0`, `@reown/appkit-wallet 1.8.19`, Zod `3.25.76`, nested Zod `3.22.4`, and WalletConnect provider `2.24.0` (`frontend/package-lock.json`). The canonical Public shared store matches these package versions except WalletConnect provider, which is `2.26.0`; therefore shared-store code is not treated as byte-for-byte source-lock proof.
- `frontend/app/lib/wagmi.ts` configures only `coinbaseWallet()` and `injected()`; it does not configure `baseAccount()` or `walletConnect()`. `WalletConnectControl` consumes the configured connectors via `useConnect`. The installed `@wagmi/connectors` source shows that the Base Account and WalletConnect implementations load `@base-org/account` and `@walletconnect/ethereum-provider` through separate dynamic imports (`dist/esm/baseAccount.js:114`, `dist/esm/walletConnect.js:210-211`). No app call site selects either connector.
- The installed `@reown/appkit-wallet@1.8.19` source includes Zod array schemas in `dist/esm/src/W3mFrameSchema.js`; `@reown/appkit` imports its frame provider. These files belong to the unconfigured WalletConnect/AppKit branch. The configured Coinbase wallet connector implementation uses the Coinbase wallet SDK; no Zod array schema or CDP SDK import was found in the inspected Coinbase connector source. This is source from the existing shared store, not the exact package-lock tarball bytes.
- A bounded search of `/srv/nexi/public/current/.next/static/chunks` for `W3mFrameSchema`, `@reown/appkit-wallet`, `@walletconnect/ethereum-provider`, and `walletConnect` returned no matches. This is a string-marker check of the currently deployed client bundle, not a tree-shaking proof for a future build of the current dirty checkout.

**Current-path conclusion: NOT DEMONSTRATED REACHABLE.** The vulnerable Zod versions remain in the current working lock and the Zod 3.22.4 copy has unbounded array schemas in the unconfigured Reown frame path. The configured connectors do not call that WalletConnect/AppKit branch, and the inspected deployed chunks contain none of its searched markers. The Coinbase/CDP lock ancestry does not itself demonstrate a Zod array parse from attacker-controlled input. Keep the audit rows visible as transitive lock findings; do not suppress them, claim an audit-clean result, or perform a major Wagmi/Zod upgrade from this evidence. Reassess if wallet connector configuration or the Public artifact changes.

This follow-up inspected existing files only. It did not modify code, manifests, lockfiles, dependency stores, build artifacts, services, production state, or application data; no tests, installs, builds, or deploys were run.

## Follow-up — installed CDP SDK schema path check (2026-10-26)

This bounded follow-up inspected the canonical Public shared dependency store after the earlier source/bundle review:

- Public source config `frontend/app/lib/wagmi.ts` registers `coinbaseWallet()` and `injected()` only; there is no app call to `baseAccount()` or `walletConnect()`. The live source lock and shared store resolve `@wagmi/connectors@6.2.0`, `@coinbase/wallet-sdk@4.3.7`, `@base-org/account@2.4.0`, `@coinbase/cdp-sdk@1.58.0`, and top-level `zod@3.25.76`.
- The installed `@wagmi/connectors/dist/esm/baseAccount.js:114` dynamically imports `@base-org/account`; the configured Coinbase Wallet path instead dynamically imports `@coinbase/wallet-sdk` in `dist/esm/coinbaseWallet.js`. The inspected Coinbase Wallet SDK source had no Zod array-schema/parse path. No app-owned Zod parser/import was found in `frontend/app`.
- The installed CDP SDK does contain Zod array schemas, including `z.array(z.any())` in `_cjs/policies/solanaSchema.js:53` and multiple array schemas in `_cjs/policies/evmSchema.js`. These are package-source candidates, but this review did not establish a call from NEXI's configured Coinbase/injected connector path or an attacker-controlled input reaching those schemas. Their presence is not by itself proof of app reachability.
- A targeted marker search of the current deployed Public client chunks for `createBaseAccountSDK`, `@base-org/account`, `@coinbase/cdp-sdk`, `ZodArray`, `W3mFrameSchema`, and `walletConnect` returned no matches. This string-marker check is not a complete bundle reachability proof and describes the deployed artifact, not unbuilt working-tree source.
- Graphify query and VibeDoctor trace were used as navigation only. The VibeDoctor project scan is dated 2026-10-25 and was not treated as current defect evidence.

**Result:** no new causal Public source defect was demonstrated; no code or dependency change is justified. Keep GHSA-mrhx-c7xc-m3w5 transitive lock findings visible and unresolved for this release scope. Reassess if Base Account/payment functionality or connector configuration is introduced, or if a current built artifact includes this path. No exploit, package audit, test, build, install, service action, or deployment was run.
