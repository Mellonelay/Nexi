# NEXI GitHub source security closure — updated evidence (2026-10-28)

Scope: GitHub source only. **NOT a production deployment, runtime acceptance, or complete security clearance.**

## Source identity and verified changes
- Baseline after source changes: `0173675d2c88b6ec6f29ecfcc039e45e5ffad041` (PR #81 merged). A final documentation PR may advance `main`.
- PRs #69–#73, #77, #78, #81 merged. PR #78 upgraded Backend Prisma CLI/client/SQLite adapter together to 7.10.1; regenerated the bundled client using an isolated matching toolchain, then passed a disposable SQLite smoke query. PR #81 upgraded the compatible Backend lockfile transitive versions `@babel/core` to 7.29.7 and `picomatch` to 2.3.2. The superseded Dependabot PRs #74–#76, #79–#80 were closed.
- Final post-PR #81 `main` runs: Source CI [40679605764](https://github.com/Mellonelay/Nexi/actions/runs/40679605764) **success**; CodeQL [40679605749](https://github.com/Mellonelay/Nexi/actions/runs/40679605749) **success**. PR #81 checks passed, including custom CodeQL positive/negative fixtures, CodeQL JS/Python/Actions, Backend, Graphify, Fallow, CodeScene and Seer; no review threads.
- All source changes were GitHub-only; no production build, deployment, service restart, live SQLite mutation, migration, queue mutation, or economic operation.

## Dependency registry, refreshed after PR #81
Initial 85 open alerts -> 48 after PR #73 -> 6 after PR #78 -> **4 open (0 critical, 1 high, 1 medium, 2 low)** after PR #81.

| Alert | Severity | Package, source owner | Disposition |
| --- | --- | --- | --- |
| [#279](https://github.com/Mellonelay/Nexi/security/dependabot/279) | High | `zod`, `frontend/package-lock.json` | **BLOCKED_BY_UPSTREAM_COMPATIBILITY**: wallet SDKs `@coinbase/cdp-sdk` and `@reown/appkit-wallet` still require Zod v3, while advisory patched release is 4.6.6. Blind override to v4 would endanger wallet authentication; requires upstream support or dedicated multi-wallet compatibility tests. |
| [#245](https://github.com/Mellonelay/Nexi/security/dependabot/245) | Moderate | `uuid`, `frontend/package-lock.json` | **RETAINED_PENDING_COMPATIBILITY**: `@metamask/sdk` dependency chain requires v8; patched release 11.1.1 is major. Needs verified compatible upstream release or wallet regression tests. |
| [#286](https://github.com/Mellonelay/Nexi/security/dependabot/286) | Low | `deepmerge`, `backend/package-lock.json` | **NO_PATCH_AVAILABLE** per current advisory. |
| [#287](https://github.com/Mellonelay/Nexi/security/dependabot/287) | Low | `deepmerge`, `frontend/package-lock.json` | **NO_PATCH_AVAILABLE** per current advisory. |

These are unresolved alerts; no suppressions or misleading zero-alert claim.

## CodeQL registry discrepancy requiring further disposition
- Earlier source-revision full-branch SARIF review: **38 findings**, individual historical ledger at `tasks/evidence/nexi-codeql-open-alert-ledger-20261028.csv` (33 generated/vendor, four scoped false positives, one workflow warning). **It is not the complete current GitHub alert registry.**
- Current GitHub open CodeQL alert registry queried 2026-10-28: **354 alerts**. Grouping by rule: 327 `js/property-access-on-non-object`; 6 automatic-semicolon-insertion; 5 Python imprecise assert; 3 Python unused-local-variable; 2 JS HTTP-to-file-access; 2 Python unused-import; nine other singleton rules (total 354).
- Current CodeQL workflows succeed but success does not mean zero alerts. Samples of newly filed `js/property-access-on-non-object` alerts #264 and #421 point at `Prisma.Decimal` and `Role.USER` respectively, imported through generated Prisma runtime contracts. This suggests an extraction/modeling issue after the generated-client refresh, but **all 327 are not yet proven false positives**. Their line-level individual dispositions remain outstanding. Do not automatically dismiss severity `error`.
- Existing custom NEXI rules for retired Cloudflare runtime and client-side database imports pass their regression fixtures. Proposed financial/guard rules remain unimplemented pending reliable exception maps; static analysis cannot replace ledger/settlement/authorization integration tests.

## Dead code, graph and limitations
- Fallow 3.30.0: historical after PR #73 118 candidate warnings (34 files, 31 exports, 8 types, 36 private-type leaks, 5 class members, 2 generated Next imports, 2 duplicate exports; zero unused dependencies), at `tasks/evidence/nexi-fallow-candidate-ledger-20261028.csv`. Candidates are conservatively retained because dynamic entrypoints, NestJS DI, tests, generated code and partial root dependency resolution prevent proof of safe deletion. No claim all are dead.
- Graphify CI passed at PR #81 and final `main`. Local/Cloud graph index identity has **not** been proven equal to final SHA; no graph-derived runtime conclusion.
- **Closure status: PARTIAL / NOT OWNER-ACCEPTED.** Remaining source tasks: reconcile the 354 current CodeQL alerts individually or by defensible evidenced common cause; resolve or explicitly accept Zod high and UUID moderate wallet SDK risk; verify Graphify final index; capture outstanding rule-coverage limits. No production release authorized.
