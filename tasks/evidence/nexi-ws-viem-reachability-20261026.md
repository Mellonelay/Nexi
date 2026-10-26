# Backend `viem` → `ws` reachability — 2026-10-26

## Scope and identity

- Repository: `/home/mellonelay1999/workspaces/Nexi`
- Source HEAD: `1e2d28dcdc3ad303d1f20cdef11c3137d2d98127` (same as `origin/main` at check)
- Scope: only the nested `ws@8.18.3` dependency path under Backend `viem` and the affected inbound-fragmented-frame condition in [GHSA-96hv-2xvq-fx4p](https://github.com/websockets/ws/security/advisories/GHSA-96hv-2xvq-fx4p).

## Design and source evidence

The advisory describes memory exhaustion when a peer sends many very small WebSocket fragments/data chunks to a vulnerable `ws` receiver; the patched 8.x version is `8.21.0`.

Graphify's promoted graph was queried before source search. It is indexed at the same source SHA but its `viem`-focused query did not materialize the Backend `viem` caller path. Targeted source search then found one Backend import: `backend/src/auth/wallet-auth.service.ts:3` imports only `getAddress` and `verifyMessage` from `viem`. The corresponding service uses these for address normalization and SIWE signature verification; it does not call viem WebSocket transport APIs. Search of Backend source found no `webSocket()` call. The separate direct `new WebSocket(url)` at `backend/src/market/binance-spot.adapter.ts:90` creates the outbound Binance client, not the affected inbound receiver.

Backend's NestJS WebSocket gateways are separately owned by the application transport path; their presence does not establish that viem's nested `ws` package processes inbound frames. This scoped source review therefore does **not demonstrate** the vulnerable viem receiver path as reachable from Backend application entrypoints. It does not clear every `ws` dependency finding or establish the complete runtime dependency graph.

## Manifest and lock interpretation

- `backend/package.json` pins `viem` `2.44.4` and declares a nested override for `viem.ws` to `8.21.0` (lines 61–73).
- `backend/package-lock.json` records the `node_modules/viem` package entry with a `ws` dependency value of `8.18.3` (around lines 11946–11965). The package-key search found the `node_modules/viem` and root `node_modules/ws` records, but no `node_modules/viem/node_modules/ws` record.
- These manifest/lock entries alone do not prove which package a live Node resolver loads for a viem import. Runtime resolution was not verified. A pinned npm metadata probe stalled in `D` state while waiting on ext4 metadata I/O; it was terminated as an agent-owned probe. No install, build, application test, or service action was performed.

## Skill and method record

- `nexi-work-kernel` and its routing matrix: selected the Backend security/dependency path and preserved the single-checkout, single-writer boundary.
- `using-agent-skills`: selected `security-and-hardening`, `dependency-audit`, and `documentation-and-adrs` for scoped advisory reachability and evidence recording.
- `security-and-hardening`: applied the rule to triage high findings by reachable vulnerable conditions and not apply forced dependency remediation automatically.
- `dependency-audit`: applied its package-manager/lockfile authority rule; this was a single-path reachability question, so no broad inventory scan or new dependency tool was invoked.
- `documentation-and-adrs`: preserved the distinction between source reachability, lock metadata, installed runtime resolution, and unknowns.
- The NEXI Capability Router was not exposed as a callable skill/tool in this child environment; the installed Kernel routing matrix supplied the specialist route.

## Disposition

No package or source files were changed. Do not force another override based solely on the installed package finding: this source review did not demonstrate the affected viem ingress. Keep the lock/runtime-resolution distinction visible. If runtime resolution is still material after host I/O recovers, verify it with the pinned Node 24 executable and canonical Backend dependency store; do not install or rebuild for that read.

## Fresh canonical-store resolver check — 2026-10-26 14:56 UTC

The pinned `/opt/nexi/runtime/node-v24.21.0/bin/node` ran a read-only `createRequire(...).resolve("ws")` probe from three package manifests in `/srv/nexi/backend/shared/node_modules`:

| Resolver parent | Resolved package | Version |
| --- | --- | --- |
| `viem/package.json` | `viem/node_modules/ws/index.js` | 8.18.3 |
| `engine.io/package.json` | root `node_modules/ws/index.js` | 8.21.0 |
| `socket.io-adapter/package.json` | `socket.io-adapter/node_modules/ws/index.js` | 8.18.3 |

The command exited 0. This replaces the earlier `runtime resolution unverified` statement only for Node resolution from these canonical shared-store package paths. It does not prove the running process loaded those modules, an affected inbound receiver is reached, or the complete dependency graph is clear. Combined with the source call-path review above, no `viem` inbound WebSocket receiver was demonstrated; no package edit, install, build, test, service action, or release was warranted.
