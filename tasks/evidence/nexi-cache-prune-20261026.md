# Bounded npm execution cache cleanup — 2026-10-26

## Scope and authority

The owner authorized clearing cache and other clearly unnecessary files while deferring backup capacity and rollback preparation until after engineering. This action removed only inactive, regenerable `npm exec` cache entries. It did not alter application dependencies, package-manager runtimes, production artifacts, rollback archives, databases, or application data.

## Exact paths removed

| Path | File bytes |
|---|---:|
| `/home/mellonelay1999/.npm/_npx/2778af9cee32ff87` | 0 |
| `/home/mellonelay1999/.npm/_npx/8575099a62bea334` | 126,696,261 |
| `/home/mellonelay1999/.npm/_npx/5834814a68760709` | 935,847 |
| `/home/mellonelay1999/.npm/_npx/32026684e21afda6` | 0 |
| `/home/mellonelay1999/.npm/_npx/02566d9bbd85b975` | 0 |
| **Total logical file bytes removed** | **127,632,108 (about 121.7 MiB)** |

Before deletion, `du -sh` reported about 158 MiB for the 8575099 cache, 1.2 MiB for the 5834814 cache, and 4 KiB for each of three empty entries. The allocated-space estimate is therefore about 159.2 MiB; `df -h` is rounded to tenths of a GB and showed free space rise from 3.3 GB to 3.5 GB.

Each directory resolved directly under the `_npx` cache root, and a bounded `/proc/*/cmdline` check found no process using its `node_modules` tree. The directories are regenerable `npm exec` caches. The remaining `_npx/eea2bd7412d4593b` cache was retained because the active Context7 MCP process uses it.

## Preserved state and result

- `/home/mellonelay1999/.cache/rdc-npx-upgrade/_npx` was retained because Desktop Commander was actively running from it.
- `/home/mellonelay1999/.cache/pnpm/v12` and `/home/mellonelay1999/.cache/node/corepack` were retained as package-manager/Corepack state.
- Application dependency stores, current builds, and Backend rollback artifacts were not changed.
- Root filesystem readback changed from 3.3 GB free / 94% used to 3.5 GB free / 93% used.
- Current lightweight process sample found no BrowserStack process. Chrome DevTools MCP bridges and the Codex daemon were left running; they are distinct processes and were not cleanup targets.
- RAM available was 5.4 GiB with 2.5 GiB swap free. I/O pressure remained elevated (`/proc/pressure/io` avg10: `some=45.38`, `full=40.15`) although Backend PID 3333918 was runnable in the later sample.

## Limits

This small cache cleanup does not complete owner-deferred backup/rollback preparation or authorize deployment. About 3.5 GB free is sufficient for bounded source edits and focused checks using existing dependencies; it is not a guarantee that large in-place application builds or release preparation are safe under current disk pressure. No builds, installs, service changes, or tests were run as part of this cleanup.
