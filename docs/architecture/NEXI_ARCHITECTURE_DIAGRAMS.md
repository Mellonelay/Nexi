# NEXI Architecture and Workflow Diagrams

These Mermaid diagrams are versioned source documentation and render in GitHub Markdown. They describe current responsibility boundaries and approved flows, **not proof that every edge has passed runtime acceptance**. Verify actual source paths and deployed release identity before consequential changes.

## 1. Runtime and data ownership

```mermaid
flowchart LR
  U["Public Next.js"] --> E["Cloudflare Worker edge"]
  A["Admin Control Plane"] --> E
  E --> C["Cloudflare Container"]
  C --> N["NestJS Domain Authority"]
  N --> D[("Cloudflare D1")]
  N --> V[("Aiven Valkey")]
  N --> R[("Private R2")]
  N --> Q["Queues and Workflows"]
  D --> L["Ledger and Activity"]
  D --> O["EventOutbox"]
  N -. "errors, traces, logs" .-> S["Sentry"]
  U -. "browser telemetry" .-> S
  A -. "browser telemetry" .-> S
```

NestJS and D1 own domain and durable truth respectively; the Ledger is accounting truth, EventOutbox publication truth, Valkey cache/realtime only, and Public/Admin have no direct financial database write authority. Cloudflare Observability remains disabled; Sentry SDK provides telemetry.

## 2. Financial accounts and transaction topology

```mermaid
flowchart TD
  W["Authenticated wallet / SIWE"] --> F["Funding"]
  F --> X["Convert: zero separate commission"]
  X --> F
  F <--> SP["Spot"]
  F <--> MG["Margin: transferable USDT only"]
  F <--> OP["Options: USDT only"]
  F <--> FI["Finance"]
  SP <--> MG
  SP <--> OP
  SP <--> FI
  MG <--> OP
  MG <--> FI
  OP <--> FI
  F --> T["Separate NEXI user-to-user transfer"]
  SP --> TP["Spot orders and fills"]
  MG --> MP["Margin collateral, debts and positions"]
  OP --> BP["Binary reserves and WIN/LOSS settlement"]
  FI --> FP["Mining and Loan lifecycles"]
  T --> L["D1 Ledger and Activity"]
  TP --> L
  MP --> L
  BP --> L
  FP --> L
  L --> E["Durable EventOutbox"]
```

**Constraint:** arrows between account pairs denote eligible transfer directions only, subject to account ownership, asset support, available funds, and reserve/loan restrictions. They do **not** imply that committed collateral or liabilities are freely movable, or that transfer automatically converts assets. User-facing Margin/Options transferable assets are USDT; legitimate non-USDT Margin liabilities remain accounted for internally. Overview aggregates genuine balances in estimated USDT equivalent without minting USDT or double counting.

## 3. Backend / Public / Admin feature responsibility

```mermaid
flowchart LR
  P["Public routes and state"] --> API["Guarded NestJS APIs"]
  A["Admin RBAC and audited controls"] --> API
  API --> MA["Markets, Asset Detail and provider data"]
  API --> FI["Wallet, Spot, Margin, Binary and Finance"]
  API --> AC["SIWE, KYC, VIP and Referral"]
  API --> CO["Communications, Support and Learn"]
  MA --> DB[("D1 and market-provider records")]
  FI --> DB
  AC --> DB
  CO --> DB
  API --> OUT["EventOutbox, Queues and realtime delivery"]
```

Use [cross-surface feature matrix](CROSS_SURFACE_FEATURE_MAP.md) for exact domain-to-route ownership and [Backend](../backend/README.md), [Public](../frontend/README.md), [Admin](../admin/README.md) for source paths.

## 4. Release, observability and acceptance sequence

```mermaid
flowchart TD
  G["GitHub main: authoritative source"] --> B["Backend Worker and Container"]
  G --> P["Public canonical production build"]
  G --> A["Admin canonical production build"]
  B --> R["Record actual artifact identity"]
  P --> R
  A --> R
  R --> S["Sentry SDK release, source maps and deploy"]
  S --> Q["Current error, trace, log, metric and Replay verification"]
  Q --> F{"Confirmed defect?"}
  F -- Yes --> C["Repair causal owner and focused proof"]
  C --> G
  F -- No --> T["One consolidated Polypane + DevTools + Coinbase Wallet acceptance"]
```

The arrows represent the release procedure, **not a requirement to use one Git SHA for differently built artifacts**. Public, Backend and Admin runtime releases must each match their own actual build source. Browser validation is planned after source closure and deployment, using the existing authorized wallet profile rather than an obsolete MetaMask harness.

## 5. Current documentation lifecycle

```mermaid
flowchart TD
  O["Current owner decision"] --> S["Current GitHub source and runtime evidence"]
  S --> R["Single owning domain document"]
  R --> M["Backend/Public/Admin cross-surface map"]
  M --> D["Relevant diagram and workflow"]
  D --> V["Focused link/contract verification"]
  V --> C["Git commit and provenance"]
  H["Historical phase ledgers and archives"] -. "lineage only" .-> R
```

Historical docs are recoverable from Git; do not revive them as live completion controllers. Update diagrams when architecture or routing changes, not for each transient process/release timestamp.

**Interactive companion:** [NEXI Architecture and Documentation Ownership mind map](https://mindmapai.app/canvas/d694e5a692fd022ace0b80cc4a437239956fb6bbb5cb833ffd00b1235783abda/edit) (owner-saved MindMap AI project; access may require its original account). Mapify can render the [documentation index](../README.md) as a hierarchy, but Git-hosted Markdown and Mermaid remain durable source authority.
