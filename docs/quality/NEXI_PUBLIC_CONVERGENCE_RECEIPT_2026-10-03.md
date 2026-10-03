# NEXI Public convergence evidence receipt — 2026-10-03

This is bounded supporting evidence. NEXI_PRODUCTION_COMPLETION_LEDGER.md remains the sole completion controller.

## Candidate identity and scope

Baseline local main ce63ea00b16ee8b34b2de1b28bdc815be5c4d977; durable GitHub main 45a06dc09fe094b31e75c81105c4eb1ab7954ebb. Three pre-existing local documentation/kernel commits and October-3 authority edits are preserved. Production remains be50529-geometry-prod until explicitly recorded promotion. Source changes: TradingChart metric presentation; Wallet body identity; 36 asset SVG replacements plus ADA contrast; Mining, Loans, Support, Settings, Messages, Announcement copy and Asset Detail formatting. No chart math, canonical 53-asset identity, backend financial policy, database or Admin mutation.

## Deterministic evidence inspected

- Canonical dependency owner: /srv/nexi/public/shared/node_modules. Candidate build: /srv/nexi/public/build-public-convergence-20261003-0510. All 46 changed frontend files byte-match its snapshot, recorded in /tmp/nexi-public-source-build-match-20261003.json.
- Typegen/typecheck passed; full ESLint has no errors and existing warnings. Latest Mining normalization typecheck passed.
- 20 focused tests passed in focused-tests-candidate.log; communications-contract passed separately from its required repository-relative context in /tmp/nexi-public-communications-contract-20261003.log. The earlier incorrect build-directory invocation is not reported as a product failure or hidden.
- Fallow /tmp/nexi-public-final-fallow-20261003.json: WARN; zero introduced dead-code/complexity findings. Socket-cleanup duplication attributed to changed Support dependencies is byte-equivalent to existing HEAD cleanup. No suppression or unrelated refactor.
- Initial Turbopack invocation failed because the shared node_modules symlink lay outside its default root. Existing NEXT_TURBOPACK_ROOT override /srv/nexi/public is used for the corrected build; no framework/config source repair was needed.

## Structural and perceptual limits

Graphify Cloud impact index is bound to 45a06dc; it locates existing SMA/EMA/indicator calls, not candidate proof. Current direct source establishes consumers Spot, Margin, Options and Asset Detail. The weak generated Cloudflare resize edge is not accepted as a frontend consumer link. Source artwork contact sheet was actually inspected at 28/36/64px, including updated distinguishable metal silhouettes and ADA contrast. The read-only candidate reviewer did not implement the changes; its source and contact-sheet findings support the candidate, not deployed acceptance.

## Binary causal blocker

Production GET /binary/config returned 200 with empty arrays. BinaryService.getConfig filters D1 configuration through isBinaryPairAvailable. Current source and deployed ed26973f ancestor have settlementPolicy.enabled=false, approvalStatus=UNAPPROVED, capabilities.binary=false and supportedBinaryDurations=[]. No later approved settlement policy was found in current authority. Cloudflare remote D1 query failed 7403; rows absent versus disabled remains UNKNOWN. The dependency requires real approved settlement/capability/configuration truth, not hardcoded mock durations/payouts. Backend configuration was not mutated.

## Runtime acceptance

PENDING: canonical build completion, exact Git candidate/fan-in, immutable release promotion, real authenticated Chrome affected-route interaction, and Polypane affected presentation breadth. Completed be50529 geometry proof is reused except affected chart-presentation checks. Protected financial, Mining/Loans, communications write lifecycles, privileged Admin and owner acceptance remain outside any screen-render completion claim.
