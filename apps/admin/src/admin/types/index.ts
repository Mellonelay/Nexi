// NEXI Admin Control Plane — shared domain types.
// Shared Admin domain types; the live provider maps these from the canonical API.

export type Environment = "DEVELOPMENT" | "SANDBOX" | "PRODUCTION";

export type RoleId =
  | "readonly_operator"
  | "support_agent"
  | "kyc_reviewer"
  | "finance_operator"
  | "market_operator"
  | "content_manager"
  | "security_auditor"
  | "sandbox_operator"
  | "super_admin";

export type Permission =
  | "overview.view"
  | "users.view"
  | "users.restrict"
  | "users.entitlements"
  | "kyc.view"
  | "kyc.decide"
  | "sessions.view"
  | "sessions.revoke"
  | "frontend.view"
  | "frontend.edit"
  | "navigation.view"
  | "navigation.edit"
  | "localization.view"
  | "localization.edit"
  | "flags.view"
  | "flags.edit"
  | "assets.view"
  | "assets.edit"
  | "networks.view"
  | "networks.edit"
  | "feeds.view"
  | "feeds.edit"
  | "spot.view"
  | "spot.edit"
  | "spot.pause"
  | "spot.cancel_order"
  | "binary.view"
  | "binary.edit"
  | "binary.settle"
  | "settlements.view"
  | "exposure.view"
  | "wallets.view"
  | "ledger.view"
  | "deposits.view"
  | "deposits.confirm"
  | "withdrawals.view"
  | "withdrawals.approve"
  | "reconciliation.view"
  | "reconciliation.resolve"
  | "mining.view"
  | "mining.edit"
  | "loans.view"
  | "loans.edit"
  | "support.view"
  | "support.reply"
  | "messages.view"
  | "announcements.view"
  | "announcements.publish"
  | "learn.view"
  | "learn.publish"
  | "notifications.view"
  | "notifications.send"
  | "admins.view"
  | "admins.edit"
  | "roles.view"
  | "roles.edit"
  | "approvals.view"
  | "approvals.decide"
  | "audit.view"
  | "health.view"
  | "health.acknowledge"
  | "maintenance.view"
  | "maintenance.edit"
  | "sandbox.view"
  | "sandbox.force";

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: RoleId | "unassigned";
  mfaEnabled?: boolean;
  mfaState?: "enabled" | "disabled" | "unknown";
  lastActiveAt: string;
  status?: "active" | "suspended" | "invited" | "unknown";
  roleAssignments?: Array<{
    id: string;
    roleId: RoleId;
    assignedBy?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  sessions?: Array<{
    id: string;
    surface: "ADMIN";
    createdAt: string;
    lastUsedAt: string;
    absoluteExpiresAt: string;
    idleExpiresAt: string;
    revokedAt: string | null;
    active: boolean;
  }>;
}

export type ApprovalDecision = "pending" | "approved" | "rejected" | "expired";

export interface ApprovalRequest {
  id: string;
  requestedBy: string;
  requestedByRole: RoleId | "unassigned";
  requestedAt: string;
  action: string;
  target: string;
  targetId: string;
  scope: "identity" | "finance" | "markets" | "governance" | "sandbox";
  status: ApprovalDecision;
  reason: string;
  before?: unknown;
  after?: unknown;
  expiresAt?: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionReason?: string;
  auditId?: string;
}

export type MaintenanceScope = "global" | "route" | "market" | "pair";
export type MaintenanceWindowStatus = "scheduled" | "active" | "completed" | "cancelled";

export interface MaintenanceWindow {
  id: string;
  scope: MaintenanceScope;
  target: string;
  status: MaintenanceWindowStatus;
  scheduledAt: string;
  endsAt: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  environment?: Environment;
  correlationId?: string | null;
}

export type UserStatus = "active" | "restricted" | "frozen" | "closed";
export type KycStatus = "unverified" | "pending" | "approved" | "rejected" | "more_info";

export interface User {
  id: string;
  email: string;
  displayName: string;
  country: string;
  status: UserStatus;
  kyc: KycStatus;
  tier: "T0" | "T1" | "T2" | "T3";
  createdAt: string;
  lastLoginAt: string;
  entitlements: { spot: boolean; binary: boolean; mining: boolean; loans: boolean };
  restrictions: string[];
  sandbox?: boolean;
}

export const USER_RESTRICTION_TAGS = [
  "trading_disabled",
  "withdrawals_blocked",
  "deposits_blocked",
  "compliance_hold",
  "aml_review",
  "account_closed",
] as const;
export type UserRestrictionTag = (typeof USER_RESTRICTION_TAGS)[number];

export interface KycReview {
  id: string;
  userId: string;
  submittedAt: string;
  documentType: "passport" | "id_card" | "drivers_license";
  country: string;
  status: KycStatus;
  reviewer?: string;
  notes?: string;
}

export interface Session {
  id: string;
  userId: string;
  ip: string;
  device: string;
  location: string;
  createdAt: string;
  lastSeenAt: string;
  active: boolean;
}

export type AssetCategory = "crypto" | "stablecoin" | "fiat_proxy" | "stock" | "forex" | "metal";

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  order: number;
  visible: boolean;
  spot: boolean;
  binary: boolean;
  mining: boolean;
  loans: boolean;
}

export interface MiningPlan {
  id: string;
  name: string;
  currency: string;
  lockupPeriod: number;
  dailyYield: string;
  minDeposit: string;
  maxDeposit: string;
  isActive: boolean;
}

export interface LoanPlan {
  id: string;
  name: string;
  durationDays: number;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

export interface MiningSubscriptionAdmin {
  id: string;
  userId: string;
  userEmail?: string;
  planName?: string;
  amount: string;
  currency: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  totalRewards: string;
}

export interface LoanApplicationAdmin {
  id: string;
  userId: string;
  userEmail?: string;
  amount: string;
  currency: string;
  status: string;
  durationDays: number;
  totalRepayment: string;
  createdAt: string;
  dueDate?: string | null;
  collateral?: string | null;
  collateralImg?: string | null;
  approvedAt?: string | null;
}

export interface Network {
  id: string;
  name: string;
  assetSymbol: string;
  chainId: string;
  contract?: string;
  decimals: number;
  explorer: string;
  minDeposit: string;
  minWithdrawal: string;
  withdrawalFee: string;
  confirmations: number;
  maxDeposit?: string;
  maxWithdrawal?: string;
  depositEnabled?: boolean;
  withdrawEnabled?: boolean;
  currencyId?: number;
  enabled: boolean;
}

export type FeedStatus = "LIVE" | "STALE" | "UNAVAILABLE" | "DISABLED";

export interface MarketFeed {
  id: string;
  pair: string;
  provider: string;
  fallback?: string;
  latencyMs: number;
  ageMs: number;
  status: FeedStatus;
}

export type SpotOrderType = "market" | "limit" | "stop_limit";

export interface SpotPair {
  id: string;
  symbol: string;
  base: string;
  quote: string;
  enabled: boolean;
  buy: boolean;
  sell: boolean;
  supports: SpotOrderType[];
  tpSl: boolean;
  pricePrecision: number;
  sizePrecision: number;
  minNotional: string;
  maxNotional: string;
  feeBps: number;
  provider: string;
  maintenance: boolean;
}

export interface SpotOrder {
  id: string;
  userId: string;
  pair: string;
  side: "buy" | "sell";
  type: SpotOrderType;
  price?: string;
  size: string;
  filled: string;
  status: "open" | "filled" | "cancelled" | "rejected";
  createdAt: string;
}

/** Binary durations are backend-configured positive seconds. */
export type BinaryDuration = number;

export interface BinaryDurationConfiguration {
  sourceDurationSeconds: number;
  durationSeconds: number;
  payoutBps: number;
  minStake: string;
  maxStake: string;
  enabled: boolean;
}

export interface BinaryPair {
  id: string;
  symbol: string;
  enabled: boolean;
  /** payout in bps by duration */
  payoutBps: Record<BinaryDuration, number>;
  durationConfigs?: BinaryDurationConfiguration[];
  minStake: string;
  maxStake: string;
  exposureCap: string;
  exposureUsed: string;
  settlementDelayMs: number;
  maintenance: boolean;
}

export interface BinaryPosition {
  id: string;
  userId: string;
  pair: string;
  /** public terminology */
  direction: "long" | "short";
  duration: BinaryDuration;
  stake: string;
  openPrice: string;
  strikeAt: string;
  status: "open" | "won" | "lost" | "error";
  payout?: string;
}

/** Internal side mapping for Binary. Public shows long/short. */
export function mapBinaryInternal(dir: "long" | "short"): "UP" | "DOWN" {
  return dir === "long" ? "UP" : "DOWN";
}

export type WalletDomain = "overview" | "spot" | "option" | "funding" | "financial";

export type WalletStatus = "active" | "frozen" | "closed" | "maintenance";

export interface WalletRow {
  id: string;
  userId: string;
  domain: WalletDomain;
  asset: string;
  available: string;
  locked: string;
  /** Estimated USDT value at last update. */
  estimatedValue?: string;
  updatedAt?: string;
  status?: WalletStatus;
}

export type LedgerOperationType =
  "deposit" | "withdrawal" | "trade" | "settlement" | "adjustment" | "fee" | "reward";

export type LedgerStatus = "posted" | "reversed" | "pending";

export interface LedgerEntry {
  id: string;
  ts: string;
  userId?: string;
  domain: WalletDomain;
  asset: string;
  amount: string;
  type: LedgerOperationType;
  refId: string;
  note?: string;
  /** Positive side of the entry (empty for zero). */
  debit?: string;
  credit?: string;
  /** Optional running balance after posting (mock only). */
  balance?: string;
  status?: LedgerStatus;
  reason?: string;
}

export type DepositStatus =
  "detected" | "confirming" | "confirmed" | "credited" | "failed" | "orphaned";

export interface Deposit {
  id: string;
  userId: string;
  asset: string;
  network: string;
  amount: string;
  txHash: string;
  confirmations: number;
  requiredConfirmations: number;
  status: DepositStatus;
  createdAt: string;
  detectedAt?: string;
  creditedAt?: string;
  failureReason?: string;
}

export type WithdrawalRiskState = "clean" | "review" | "flagged" | "blocked";
export type WithdrawalApprovalState =
  "pending_review" | "additional_review" | "approved" | "rejected";
export type WithdrawalProcessingState =
  "queued" | "processing" | "broadcast" | "completed" | "failed" | "cancelled";
export type WithdrawalStatus =
  "pending" | "approved" | "broadcast" | "confirmed" | "rejected" | "cancelled";

export interface Withdrawal {
  id: string;
  userId: string;
  asset: string;
  network: string;
  amount: string;
  destination: string;
  status: WithdrawalStatus;
  createdAt: string;
  approver?: string;
  /** Optional Batch 3 fields — populated for new fixtures. */
  fee?: string;
  txHash?: string;
  riskState?: WithdrawalRiskState;
  approvalState?: WithdrawalApprovalState;
  processingState?: WithdrawalProcessingState;
  reviewNote?: string;
}

export type ReconciliationSeverity = "info" | "warning" | "critical";
export type ReconciliationStatus = "open" | "investigating" | "resolved" | "dismissed" | "reopened";
export type ReconciliationMismatchType =
  | "wallet_vs_ledger"
  | "deposit_credit_variance"
  | "withdrawal_broadcast_variance"
  | "internal_transfer_gap"
  | "provider_fee_variance"
  | "unknown_credit";

export interface ReconciliationNote {
  id: string;
  ts: string;
  actor: string;
  body: string;
}

export interface ReconciliationItem {
  id: string;
  mismatchType: ReconciliationMismatchType;
  asset: string;
  accountRef: string;
  userId?: string;
  expected: string;
  observed: string;
  variance: string;
  severity: ReconciliationSeverity;
  status: ReconciliationStatus;
  owner?: string;
  createdAt: string;
  updatedAt: string;
  linkedRefs: string[];
  notes: ReconciliationNote[];
}

export type TicketStatus = "open" | "pending_user" | "resolved" | "escalated";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  messages: { id: string; author: string; internal: boolean; body: string; ts: string }[];
}

export interface AuditEvent {
  id: string;
  ts: string;
  actor: string;
  role: RoleId | "unassigned";
  environment: Environment | "UNSPECIFIED";
  action: string;
  target: string;
  reason: string;
  before?: unknown;
  after?: unknown;
  correlationId: string;
  result: "ok" | "failed" | "unknown";
}

export interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  env: Environment;
  updatedAt: string;
  rolloutPct?: number;
  roleTargets?: RoleId[];
  userTargets?: string[];
}

/* ---------- Batch 2 · Platform & Markets ---------- */

export const LOCALES = ["en", "zh-CN", "ko", "ru", "es", "ms"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
  ko: "한국어",
  ru: "Русский",
  es: "Español",
  ms: "Bahasa Melayu",
};

export type PublicRouteState = "public" | "authenticated" | "hidden" | "maintenance";

export interface PublicRoute {
  id: string;
  path: string;
  label: string;
  state: PublicRouteState;
  unavailableMessage?: string;
  order: number;
}

export interface QuotesCategory {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface PublicBanner {
  id: string;
  message: string;
  severity: "info" | "warning" | "critical";
  active: boolean;
  scope: "global" | "spot" | "binary" | "wallets";
  startsAt?: string;
  endsAt?: string;
}

export interface IncidentMessage {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  active: boolean;
  postedAt: string;
  environment?: Environment;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  correlationId?: string | null;
}

export interface SupportEntryPoint {
  id: string;
  label: string;
  target: string;
  channel: "chat" | "ticket" | "email" | "faq";
  visible: boolean;
  order: number;
}

export type NavSurface = "bottom" | "drawer";
export type NavAudience = "public" | "authenticated" | "vip" | "internal";

export interface NavItem {
  id: string;
  surface: NavSurface;
  label: string;
  target: string;
  audience: NavAudience;
  order: number;
  visible: boolean;
}

export interface TranslationKey {
  id: string;
  namespace: string;
  key: string;
  defaultValue: string;
  values: Partial<Record<Locale, string>>;
  updatedAt: string;
  editor?: string;
}

export type SettlementState =
  "open" | "settling" | "win" | "loss" | "draw" | "refund" | "failed" | "cancelled" | "error";

export interface SettlementRecord {
  id: string;
  positionId: string;
  userId: string;
  pair: string;
  direction: "long" | "short";
  duration: BinaryDuration;
  stake: string;
  openPrice: string;
  settlePrice?: string;
  state: SettlementState;
  settledAt?: string;
  payout?: string;
  notes?: string;
}

export type ExposureStatus = "ok" | "warning" | "over_limit";

export interface ExposureRow {
  id: string;
  pair: string;
  product: "spot" | "binary";
  used: string;
  cap: string;
  utilisation: number;
  status: ExposureStatus;
}

export interface Announcement {
  id: string;
  title: string;
  body?: string;
  status: "draft" | "scheduled" | "published" | "archived";
  locale: string;
  scheduledAt?: string;
  publishedAt?: string;
}

export interface AdminMessage {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  deliveryState: string;
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
}

export interface AdminLearnArticle {
  id: string;
  slug: string;
  title: string;
  body: string;
  status: string;
  updatedAt: string;
}

export interface HealthCheck {
  id: string;
  name: string;
  status: "ok" | "degraded" | "down";
  latencyMs: number;
  updatedAt: string;
}
