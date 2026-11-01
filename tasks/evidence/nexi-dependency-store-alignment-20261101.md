# NEXI dependency-store alignment — 2026-11-01

Scope: four repository AGENTS.md instruction files and canonical dependency stores, source-only changes. GitHub/VM source at intake: `fd26369c0775a4dbc32b444f394d76f7e386a92f`.

AGENTS.md SHA-256: 6116c65698651236feb672ae753a2f5dcb2052cff2dc68af59ef751af619c382
backend/AGENTS.md SHA-256: 6c5e477d97d1c83644ded002814a08d498275df28116b4ff3609efa78c3a8aaf
frontend/AGENTS.md SHA-256: cfcc23cc4fd65ce626b5fbfda433f21689d409eaf61deec44d19122d865c00f3
Admin/AGENTS.md SHA-256: d54223f8d83ccdc3a088b15e002157bec8f79a6e3cd872d6b183ae6bef40a875

Backend, Public and Admin source node_modules are separate symlinks to /srv/nexi/backend/shared/node_modules, /srv/nexi/public/shared/node_modules and /srv/nexi/admin/shared/node_modules. Both Backend and Public runtime node_modules links resolve to their respective stores. All three services used /opt/nexi/runtime/node-v24.21.0/bin/node. Runtime npm 11.19.0; pinned Admin pnpm 12.14.0. Root disk 83% used (10G free) at inspection.

All 54 Backend and 36 Public direct manifest dependency entries matched their installed package versions and npm lockfiles. Admin's 76 direct manifest entries matched installed store versions, importer specifiers, and the existing @lovable.dev/vite-tanstack-config patch.

Confirmed defect: tracked Admin/pnpm-lock.yaml had a root importer for pnpm executable only, while actual Admin package.json has 76 dependency entries. That tracked form predated this inspection and was visible in GitHub commit 26265ffa5bf3d910cef336f2ae5c7eeb715e75d6. Admin/node_modules/.pnpm/lock.yaml contained the complete correctly resolved 76-entry manifest and patch. Restored the tracked lockfile byte-for-byte from that installed lock, SHA-256 b674d0c3f12818d5cf0d27aa8d9290413bad23fbf6a99b19698f345b5ef62ea7.

No npm/pnpm install, package upgrade, dependency-store mutation, service restart, build, or deployment was performed. This is dependency consistency evidence, not a security, integration-test or production acceptance claim. Previous Backend notification Jest failure is still an independent unclosed source frontier.
