# sg-edge-01 Runtime Worker Contract

## Authority split

- Windows `C:\trae_projects\Dexi_style_TraeWV` is the authoritative NEXI source and implementation workspace.
- `sg-edge-01` is the later Linux runtime, backend integration, PostgreSQL/Redis verification, container, Wrangler, Cloudflare, and operational verification worker.
- The VM copy is not an independent source authority. Do not move the authoritative repository to the VM.

## Authoritative device

- Device: `sg-edge-01`
- Remote Desktop Commander device ID: `b2804353-f16c-440b-8028-33e9c51b184c`
- Runtime: `/root/rdc-runtime`
- Platform: `/root/rdc-platform`
- Project workspace: `/root/workspaces/nexi`

## Stable capability and command inventory

Use native RDC actions first for bounded reads, searches, edits, configuration, processes, sessions, and evidence. Use reviewed `rdc-adapter` subcommands for browser, image, PDF, spreadsheet, archive, and schema work. Use persistent RDC process sessions for Graphify, Fallow, Node/npm, Prisma, PostgreSQL, Redis, systemd, and Wrangler when the approved phase reaches the VM gate.

Stable control-plane commands include:

- `rdc-status`
- `rdc-doctor --json`
- `rdc-self-test`
- `rdc-adapter capabilities`
- `rdc-drift check`
- `rdc-snapshot`
- `rdc-safe-run`
- `rdc-maintenance`

## Protected boundaries

- Do not modify sing-box, proxy services, network routing, persisted RDC identity, credentials, or production state.
- Do not print tokens, cookies, authorization headers, credentials, secret environment values, or complete credential-bearing URLs.
- No production deployment, destructive database action, credential change, or network/proxy mutation without explicit current-turn approval.
- Do not use Docker or WSL on the Windows source workspace.

## Connection preflight

1. List devices and select only the authoritative device ID above; never use the stale device ID.
2. Ping the selected device.
3. Read configuration and confirm the Linux shell, runtime version, service state, and bounded filesystem policy.
4. Read the current RDC handoff, onboarding, router, execution policy, and project/skill registries when recovering a session.
5. Run only the bounded status/doctor/self-test checks required by the active task.

## Runtime handoff

Keep source edits and source-side Graphify evidence on Windows. Transfer or synchronize only bounded runtime artifacts when the active integration gate requires it and the project policy permits it. Before VM execution, record the exact artifact boundary, command, environment class, approval boundary, expected evidence, and rollback/recovery action. PostgreSQL and Redis verification belongs to the SG-EDGE-01 integration gate; it does not retroactively make Windows B0.1 implementation or static verification incomplete.

## Evidence and completion rules

Keep `configured → discovered → trusted → authenticated → callable → invoked → completed → verified` distinct. A file, route, graph, successful command, or static check is not runtime or security proof. Runtime claims require fresh VM output; deployment claims require deployment evidence; authorization claims require positive and negative tests; completion claims require the applicable implementation, static, test, integration, runtime, security, and review evidence.
