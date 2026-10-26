# API readiness timeout and host pressure — 2026-10-26

## Observation window

Approximately 2026-10-26 11:41 UTC; the precise collection time was not recorded.

## Observed evidence

- All three systemd services were active with `NRestarts=0`.
- A local API readiness request to `127.0.0.1:3002/readyz` timed out after 6 seconds and reported HTTP `000`.
- Public had previously returned HTTP 200, as recorded in the prior handoff; this was not rechecked in this observation.
- Backend API PID `3333918` was in `Dsl` state and ran `/opt/nexi/runtime/node-v24.21.0/bin/node`.
- `/proc/pressure/io`: `some` avg10/avg60/avg300 = `98.97/98.65/98.31`; `full` = `85.41/80.38/79.21`.
- `/proc/pressure/memory`: `some` avg10/avg60/avg300 = `92.75/70.02/71.73`; `full` = `83.00/58.90/58.94`.
- `MemAvailable` was approximately `1.0 GiB`; `SwapFree` was approximately `244 MiB`.
- Current disk check reported `3.6 GB` free.
- A Graphify cloud query at commit `1e2d28d` was approximately six hours old and did not surface the readiness call chain. Its age and scope do not establish a source cause.

## Disposition and limits

No restart, deployment, or cleanup was performed. No source defect or root cause is confirmed by these observations. `ROLLBACK_PREPARATION=OWNER_DEFERRED`.

This receipt records the observations and their limits; it does not claim recovery, diagnosis, or application-code change. No sensitive data is included.

## Follow-up observation — 2026-10-26 11:43 UTC

A bounded process/wait-state check still found API PID `3333918` in `Dsl` state at `folio_wait_bit_common`. It also found `kswapd0` in `D` state and Chrome PID `2814039` in `Dl` at `folio_wait_bit_common`, so the API was not the only process waiting on memory-backed I/O. `/proc/pressure/io` remained high (`some avg10/60/300=96.23/96.88/97.41`, `full=82.31/80.49/78.38`). This supports host-wide pressure as the immediate environment condition, but does not identify its initiating cause. No readiness probe, service restart, deployment, or cleanup was performed in this follow-up.

## Follow-up observation — 2026-10-26 11:46 UTC

`vmstat 1 3` showed `swpd=3,975,056 kB` of `SwapTotal=4,194,300 kB`. Samples two and three reported `si/so=184/3,876` and `16/3,648 kB/s`, I/O wait of `97%` and `84%`, and blocked-process counts of `15` and `3`. This corroborates active swap/reclaim and severe I/O pressure during the sample, without identifying which workload initiated it or proving a persistent hardware/storage fault. No service intervention or cleanup was performed.

## Fresh runtime recheck — 2026-10-26 11:57 UTC

- All three systemd units reported `active/running` with `NRestarts=0`.
- API PID `3333918` remained in `Dsl` state; local `/readyz` timed out after 5 seconds (HTTP `000`). Near-simultaneous wait-channel observations differed: `/proc/3333918/wchan` returned `rq_qos_wait`, while `ps` reported `folio_wait_bit_common`.
- I/O PSI `some` avg10/60/300 was `99.18/98.59/97.93`; `full` was `91.35/86.33/82.50`. Memory PSI `some` was `98.04/76.19/71.17`; `full` was `90.51/67.36/60.52`.
- `MemAvailable` was `860,436 kB`; `SwapFree` was `15,660 kB`; root had `3.6 GB` available.

These observations show continued severe host pressure and an unresponsive API, but do not establish the initiating workload or a code defect. No restart, deployment, cleanup, or rollback preparation was performed; recovery remains unverified and `ROLLBACK_PREPARATION=OWNER_DEFERRED`.

## Fresh runtime recheck — 2026-10-26 12:00 UTC

- All three systemd units remained `active/running` with `NRestarts=0`.
- API PID `3333918` remained `Dsl` at `folio_wait_bit_common`; local `/readyz` timed out after 5 seconds (HTTP `000`).
- I/O PSI `some` avg10/60/300 was `99.17/98.96/98.39`; `full` was `70.95/75.84/79.83`. Memory PSI `some` was `88.36/77.24/73.79`; `full` was `65.55/60.49/60.82`.
- `MemAvailable` was `758,292 kB`; `SwapFree` was `352 kB`; root had `3.6 GB` available.

The API remains unavailable despite its active systemd state. These measurements show a critically constrained host with nearly exhausted swap, but do not establish the initiating workload or root cause. No service restart, deployment, cleanup, or rollback preparation was performed. Recovery is unverified; `ROLLBACK_PREPARATION=OWNER_DEFERRED`.

## Fresh runtime recheck — 2026-10-26 14:56 UTC

- Local `http://127.0.0.1:3002/readyz` returned HTTP 200 in 0.32 seconds with `status=READY`, `dependencies.database=true`, `dependencies.redis=true`, and `authority=SQLite`.
- `nexi-api`, `nexi-public`, and `nexi-admin` were each active/running with `NRestarts=0`; their MainPIDs were 3333918, 3334254, and 3334255. Backend's `/proc/3333918/exe` resolved to `/opt/nexi/runtime/node-v24.21.0/bin/node`.
- After the response, a bounded process sample again showed API PID 3333918 in `D` at `folio_wait_bit_common`. I/O PSI had improved to `some avg10=29.97%` and `full avg10=25.65%`; memory PSI was `some avg10=3.36%` and `full avg10=2.47%`. The adjacent D-state observation means sustained recovery is not established, although point-in-time endpoint readiness is verified.
- Root had 3.4 GB available. This observation does not identify why prior stalls occurred. No service action, build, deployment, storage cleanup, archive operation, migration, or data mutation was performed. `ROLLBACK_PREPARATION=OWNER_DEFERRED`; production release remains unauthorized.

## External route recheck — 2026-10-26 15:01 UTC

`curl` probes returned HTTP 200 for API `/readyz` (0.569 s), Public `/dashboard` (0.317 s), and Admin `/overview` (0.491 s). A same-minute systemd read showed all three units active/running with `NRestarts=0`: Backend PID 3333918, Public PID 3334254, Admin PID 3334255. Backend `/proc/3333918/exe` resolved to `/opt/nexi/runtime/node-v24.21.0/bin/node`; the Public/Admin process executables were not re-resolved in this sample. These are point-in-time HTTP/service results, not authenticated browser acceptance or sustained uptime. No service restart, deployment, build, data change, or cleanup occurred; `ROLLBACK_PREPARATION=OWNER_DEFERRED` remains in force.

## Fresh bounded recovery check — 2026-10-26 15:22 UTC

- HTTPS API `/readyz` returned HTTP 200 in 0.584 seconds with `status=READY`, SQLite and Redis ready, and SQLite authority. All three systemd units were active/running with `NRestarts=0`.
- The same bounded sample showed API PID `3333918` in `D` state at `folio_wait_bit_common`. I/O PSI avg10 was `some=32.90%`, `full=31.61%`; memory available was about 4.7 GiB and swap free about 2.7 GiB. Exact process-name checks found no `chrome` or `chromium`; the separately running DevTools bridge was not treated as a browser process.
- This closes only the observed API request as available. The D-state sample plus elevated I/O pressure means host/runtime recovery is not established. No additional incident investigation, service restart, build, deployment, storage cleanup, archive operation, migration, or data mutation was performed. `ROLLBACK_PREPARATION=OWNER_DEFERRED_UNTIL_ENGINEERING_COMPLETE` remains unchanged.

## Owner-requested recovery and resource snapshot — 2026-10-26 15:52–15:55 UTC

- API `/readyz` returned HTTP 200 in 526 ms with SQLite and Redis ready. At 15:54, the host reported 7.8 GiB RAM, 5.0 GiB available, 1.4 GiB swap used/2.6 GiB free, and root filesystem 46 GiB used/3.3 GiB free (94%). Load average was 1.97. CPU PSI avg10 was 2.83% `some` / 0% `full`; memory PSI avg10 was 3.84% `some` / 3.60% `full`; I/O PSI avg10 was 38.16% `some` / 36.87% `full` before the disk scan.
- All three services were active/running with `NRestarts=0`: API PID `3333918`, Public PID `3334254`, Admin PID `3334255`. A near-simultaneous API process read differed (`ps` showed `D`, `/proc/<pid>/status` showed `R`), so no sustained D-state is established. One-second cgroup CPU sample: API 48.3% of one core, Public and Admin 0.0%. Cgroup memory readings were API ~799 MB, Public ~82 MB, Admin ~19 MB; per-process RSS differs because the Public service has a child and RSS/cgroup accounting treat shared pages differently.
- Cumulative cgroup I/O counters since service start: API ~5.74 GB read / ~99.0 GB written; Public ~112 MB read / ~125 MB written; Admin ~37 MB read / ~44 MB written. These are lifetime counters, not disk allocation or current rates. The API is the cumulative I/O outlier, but this sample does not identify the responsible files or operation.
- A single read-only `du -x -h --max-depth=2 /` traversal entered `D` state. While it ran, I/O PSI avg10 rose to about 80% `some` / 76% `full`; after interrupting it, no `du` process remained and I/O PSI avg10 returned to about 37%/35%. The elevated I/O pressure was already present before the scan. The scan produced no directory-size output, so current disk-space attribution remains unknown. No further broad scan, cleanup, deletion, restart, or service change was performed.
- **Owner-directed disposition:** close the earlier runtime-stall incident as recovered within the verified scope of successful API readiness and a runnable API process sample. Residual elevated I/O PSI remains observable; its cause and sustained-uptime guarantee are not established. This disposition is not a claim that CPU/RAM are exhausted or that disk capacity caused the earlier stall.
- Long-running Codex, Graphify MCP, Desktop Commander, BrowserStack MCP, and Chrome DevTools bridge processes were present. They are not classified stale based on age alone; the browser bridge is not the Chrome browser process. No pre-existing service/tool process was stopped; only the stalled `du` scan was interrupted.
- Historical storage candidates are not fresh measurements and are not proven stale. Disk cleanup, rollback preparation and archive handling remain owner-deferred; no deletion was authorized or performed.
