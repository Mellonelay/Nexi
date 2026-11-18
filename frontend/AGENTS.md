# Public frontend engineering contract

Inherits ../AGENTS.md; current visual owner is DESIGN.md.

- Source frontend/app: Next.js 16 App Router/React 19; package.json + package-lock.json are dependency authority. Preserve frontend/node_modules -> /srv/nexi/public/shared/node_modules and single output /srv/nexi/public/current; never run npm ci in the checkout or create duplicate .next/build trees. Production build/service restart are separately authorized.
- Mobile-first **Web3 wallet DApp browser** is the primary real-world target, not a native Android/iOS app. Use real injected provider/SIWE chain 1, safe-area/visual viewport, keyboard, focus, chart resizing and five-destination dock. Browser/emulation/source testing are distinct proof.
- DESIGN.md and latest explicit owner decisions control layout and chart indicators. Do not reproduce historical image concepts or old contradictory route notes. Keep full, truthful amounts, correct account scope and history; 53 market instruments are not 53 depositable wallet balances.
- Wallet: Funding, Spot, Margin, Options/BINARY, Finance; do not fabricate provider quote/depth, balance, network, Activity or customer success. Backend controls durations, payout, permissions, settlement and persisted state. Sandbox candle display remains isolated from shared market feeds and ledger.
- Source changes follow component -> API/DTO -> NestJS/SQLite owner -> Admin/Activity readback as relevant. Use framework-native App Router patterns and installed-version documentation. No automatic wallet signing, finance requests, builds or deployment.
