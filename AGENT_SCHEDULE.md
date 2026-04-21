# 🤖 Jules Skill-Based Agent Schedule & Automation Workflow

This document outlines the strategic schedule, skill allocation, and continuous audit workflow for Jules to complete the Dexi Style platform.

## 📅 1. Agent Schedule & Skill Mapping

Based on the Full-Spectrum Audit Report, development will be split into four distinct phases. Jules will configure its internal logic to focus on specific "skills" during each phase.

### Phase 1: Security & Foundation (Weeks 1-2)
**Active Jules Persona:** *Security Engineer & Backend Architect*
**Focus:** Authentication, Validation, and Data Integrity.

*   **Task 1.1:** Enforce strict JWT Guard across all controllers (removing `test-user` fallbacks).
*   **Task 1.2:** Refactor `WalletService` to support cross-module Prisma transactions (`tx`).
*   **Task 1.3:** Implement `@nestjs/throttler` for rate limiting on trading endpoints.
*   **Task 1.4:** Add strict `class-validator` DTOs to all incoming API requests.
*   **Verification:** Run static analysis to ensure no endpoints are exposed without `JwtAuthGuard`.

### Phase 2: Live Data & Oracles (Weeks 3-4)
**Active Jules Persona:** *Integration Specialist & Frontend Engineer*
**Focus:** Real-time WebSockets, Pricing Data, UI Binding.

*   **Task 2.1:** Build `PriceOracleService` connecting to Binance/OKX WebSockets.
*   **Task 2.2:** Broadcast live prices via `EventsGateway`.
*   **Task 2.3:** Update frontend `useMarketData.ts` to consume the live feed.
*   **Task 2.4:** Wire `TradingChart.tsx` to live candlestick data.
*   **Verification:** End-to-end test verifying frontend chart matches backend broadcasted prices.

### Phase 3: Core Engine Optimization (Weeks 5-6)
**Active Jules Persona:** *Performance & Systems Engineer*
**Focus:** Event-Driven Architecture, Redis, Scalability.

*   **Task 3.1:** Migrate Spot Matching Engine from Node thread to Redis (or microservice).
*   **Task 3.2:** Refactor Binary Settlement from a 1-second DB cron to Redis Keyspace Notifications / BullMQ.
*   **Task 3.3:** Build real-time Liquidation Engine worker for Perpetual Contracts.
*   **Task 3.4:** Implement Redis caching for user balances and active order books.
*   **Verification:** Load testing the matching engine and binary settlement with 1000+ concurrent simulated users.

### Phase 4: Blockchain & Polish (Weeks 7-8)
**Active Jules Persona:** *Web3 Engineer & UX Specialist*
**Focus:** Real crypto integrations, Accessibility, Polish.

*   **Task 4.1:** Integrate Wallet-as-a-Service (e.g., Tatum/Fireblocks) for on-chain deposits.
*   **Task 4.2:** Implement automated withdrawal broadcasting.
*   **Task 4.3:** Apply `.Jules/palette.md` UX/Accessibility learnings across the frontend.
*   **Task 4.4:** Write Jest unit tests for all financial math logic (`SpotService`, `ContractService`).
*   **Verification:** Successful end-to-end simulated deposit and withdrawal on testnet.

---

## ⚙️ 2. Continuous Audit Configuration

To prevent the accumulation of technical debt, a **Continuous Audit** strategy is established. This will be enforced via GitHub Actions and pre-commit hooks.

### Continuous Audit Rules

1.  **Strict Auth Check:** No controller route may be added without `@UseGuards(JwtAuthGuard)` or an explicit `@Public()` decorator.
2.  **No Mock Data in Production Code:** The word `TODO` or `mock` in critical logic paths (`*service.ts`) will trigger a warning.
3.  **Financial Precision:** All financial calculations must be verified or use a precision library (e.g., `decimal.js`). Direct floating-point math on balances is highly scrutinized.
4.  **UX/A11y Standards:** All new frontend components must pass standard accessibility checks (e.g., `eslint-plugin-jsx-a11y`). Icon-only buttons must have `aria-label`.

### Jules Automated Workflow integration
When requested by the user, Jules will:
1. Scan git diffs before submission against the rules above.
2. Review PRs with a focus on atomic transaction safety in the `WalletService`.
3. Provide weekly reports on the platform's completeness percentage based on the Phase Schedule.
