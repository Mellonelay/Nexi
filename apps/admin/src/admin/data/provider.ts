import type {
  User,
  KycReview,
  KycStatus,
  Session,
  Asset,
  Network,
  MarketFeed,
  SpotPair,
  SpotOrder,
  BinaryPair,
  BinaryPosition,
  BinaryDuration,
  WalletRow,
  LedgerEntry,
  Deposit,
  Withdrawal,
  SupportTicket,
  AuditEvent,
  FeatureFlag,
  Announcement,
  AdminMessage,
  AdminNotification,
  AdminLearnArticle,
  AdminLearnCategory,
  HealthCheck,
  AdminUser,
  Environment,
  RoleId,
  Permission,
  UserStatus,
  UserRestrictionTag,
  PublicRoute,
  PublicRouteState,
  QuotesCategory,
  PublicBanner,
  IncidentMessage,
  SupportEntryPoint,
  NavItem,
  NavSurface,
  TranslationKey,
  Locale,
  SettlementRecord,
  SettlementState,
  ExposureRow,
  ReconciliationItem,
  ApprovalRequest,
  ApprovalDecision,
  MaintenanceWindow,
  MaintenanceScope,
  MiningPlan,
  LoanPlan,
  MiningSubscriptionAdmin,
  LoanApplicationAdmin,
} from "../types";

export interface ConsequentialContext {
  actor: string;
  role: RoleId;
  environment: Environment;
  reason: string;
}

export interface MutationResult {
  ok: boolean;
  auditId: string;
}

export interface AdminIdentity {
  id: string;
  email: string;
  roleId: RoleId | null;
  roleLabel: string | null;
  effectivePermissions: Permission[];
  roleMappingStatus: "ASSIGNED" | "UNASSIGNED_ADMIN_REQUIRES_ROLE_ASSIGNMENT" | string;
}

export interface AdminDataProvider {
  /** Reports whether an optional Admin operation has a canonical live authority. */
  supports?(operation: keyof AdminDataProvider): boolean;
  /** Live Admin authentication boundary. Mock providers may omit this. */
  login?(email: string, password: string): Promise<{ access_token: string; refresh_token?: string; user: Record<string, unknown> }>;
  /** Live Admin identity boundary. Mock providers may omit this. */
  getAdminIdentity?(): Promise<AdminIdentity>;
  /** Users */
  listUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  setUserStatus(id: string, status: UserStatus, ctx: ConsequentialContext): Promise<MutationResult>;
  updateUserEntitlements(
    id: string,
    entitlements: User["entitlements"],
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  updateUserRestrictions(
    id: string,
    restrictions: UserRestrictionTag[],
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  setUserSandbox(id: string, sandbox: boolean, ctx: ConsequentialContext): Promise<MutationResult>;

  /** KYC */
  listKyc(): Promise<KycReview[]>;
  decideKyc(
    id: string,
    decision: Exclude<KycStatus, "unverified" | "pending">,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  assignKycReviewer(
    id: string,
    reviewer: string,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  updateKycNotes(id: string, notes: string, ctx: ConsequentialContext): Promise<MutationResult>;

  /** Sessions */
  listSessions(): Promise<Session[]>;
  revokeSession(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  revokeUserSessions(userId: string, ctx: ConsequentialContext): Promise<MutationResult>;

  /** Markets */
  listAssets(): Promise<Asset[]>;
  toggleAssetVisibility(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  updateAsset(
    id: string,
    patch: Partial<Pick<Asset, "name" | "order" | "spot" | "binary" | "mining" | "loans">>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  reorderAssets(
    orderMap: Record<string, number>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  listNetworks(): Promise<Network[]>;
  toggleNetwork(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  updateNetwork(
    id: string,
    patch: Partial<
      Pick<
        Network,
        | "contract"
        | "decimals"
        | "explorer"
        | "minDeposit"
        | "minWithdrawal"
        | "withdrawalFee"
        | "confirmations"
        | "maxDeposit"
        | "maxWithdrawal"
        | "depositEnabled"
        | "withdrawEnabled"
      >
    >,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  addDepositAddress(
    currencyId: number,
    input: { network: string; address: string; label?: string },
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  disableDepositAddress(id: string, ctx: ConsequentialContext): Promise<MutationResult>;

  listFeeds(): Promise<MarketFeed[]>;
  setFeedStatus(
    id: string,
    status: MarketFeed["status"],
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  failoverFeed(id: string, ctx: ConsequentialContext): Promise<MutationResult>;

  /** Spot */
  listSpotPairs(): Promise<SpotPair[]>;
  listSpotOrders(): Promise<SpotOrder[]>;
  pauseSpotPair(id: string, paused: boolean, ctx: ConsequentialContext): Promise<MutationResult>;
  cancelSpotOrder(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  getMarginConfiguration(): Promise<{ maintenanceRatio: number; leverages: number[] }>;
  updateMarginConfiguration(
    config: { maintenanceRatio: number; leverages: number[] },
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  updateSpotPair(
    id: string,
    patch: Partial<
      Pick<
        SpotPair,
        | "enabled"
        | "buy"
        | "sell"
        | "supports"
        | "tpSl"
        | "pricePrecision"
        | "sizePrecision"
        | "minNotional"
        | "maxNotional"
        | "feeBps"
        | "provider"
      >
    >,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  /** Binary */
  listBinaryPairs(): Promise<BinaryPair[]>;
  listBinaryPositions(): Promise<BinaryPosition[]>;
  pauseBinaryPair(id: string, paused: boolean, ctx: ConsequentialContext): Promise<MutationResult>;
  settleBinaryPosition(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  updateBinaryPair(
    id: string,
    patch: Partial<
      Pick<BinaryPair, "enabled" | "minStake" | "maxStake" | "exposureCap" | "settlementDelayMs">
    > & {
      payoutBps?: Partial<Record<BinaryDuration, number>>;
      durationConfigs?: Array<{
        sourceDurationSeconds: number;
        durationSeconds: number;
        payoutBps: number;
        minStake: string;
        maxStake: string;
        enabled: boolean;
      }>;
    },
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  /** Settlements */
  listSettlements(): Promise<SettlementRecord[]>;
  correctSettlement(
    id: string,
    outcome: SettlementState,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  /** Exposure */
  listExposure(): Promise<ExposureRow[]>;

  /** Frontend Control */
  listPublicRoutes(): Promise<PublicRoute[]>;
  setPublicRouteState(
    id: string,
    state: PublicRouteState,
    message: string | undefined,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  reorderPublicRoutes(
    orderMap: Record<string, number>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  listQuotesCategories(): Promise<QuotesCategory[]>;
  toggleQuotesCategory(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  reorderQuotesCategories(
    orderMap: Record<string, number>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  listBanners(): Promise<PublicBanner[]>;
  setBannerActive(id: string, active: boolean, ctx: ConsequentialContext): Promise<MutationResult>;
  upsertBanner(banner: PublicBanner, ctx: ConsequentialContext): Promise<MutationResult>;

  listIncidents(): Promise<IncidentMessage[]>;
  setIncidentActive(
    id: string,
    active: boolean,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  listSupportEntryPoints(): Promise<SupportEntryPoint[]>;
  updateSupportEntryPoint(
    id: string,
    patch: Partial<Pick<SupportEntryPoint, "label" | "target" | "channel" | "visible" | "order">>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  /** Navigation */
  listNavItems(): Promise<NavItem[]>;
  updateNavItems(
    surface: NavSurface,
    items: NavItem[],
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  /** Localization */
  listTranslationKeys(): Promise<TranslationKey[]>;
  updateTranslationValue(
    id: string,
    locale: Locale,
    value: string,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  /** Finance */
  listWallets(): Promise<WalletRow[]>;
  listLedger(): Promise<LedgerEntry[]>;

  /** Products */
  listMiningPlans(): Promise<MiningPlan[]>;
  createMiningPlan(
    payload: Omit<MiningPlan, "id">,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  updateMiningPlan(
    id: string,
    patch: Partial<Omit<MiningPlan, "id">>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  listLoanPlans(): Promise<LoanPlan[]>;
  createLoanPlan(payload: Omit<LoanPlan, "id">, ctx: ConsequentialContext): Promise<MutationResult>;
  updateLoanPlan(
    id: string,
    patch: Partial<Omit<LoanPlan, "id">>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  listMiningSubscriptions(): Promise<MiningSubscriptionAdmin[]>;
  listLoanApplications(): Promise<LoanApplicationAdmin[]>;
  approveLoanApplication(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  rejectLoanApplication(id: string, ctx: ConsequentialContext): Promise<MutationResult>;

  listDeposits(): Promise<Deposit[]>;
  confirmDeposit(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  creditDeposit(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  failDeposit(id: string, reason: string, ctx: ConsequentialContext): Promise<MutationResult>;

  listWithdrawals(): Promise<Withdrawal[]>;
  decideWithdrawal(
    id: string,
    decision: "approved" | "rejected",
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  requestWithdrawalReview(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  setWithdrawalProcessing(
    id: string,
    processing: "processing" | "completed" | "failed",
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  listReconciliation(): Promise<ReconciliationItem[]>;
  assignReconciliationOwner(
    id: string,
    owner: string,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  setReconciliationStatus(
    id: string,
    status: "open" | "investigating" | "resolved" | "dismissed" | "reopened",
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  addReconciliationNote(
    id: string,
    body: string,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  /** Support */
  listTickets(): Promise<SupportTicket[]>;
  replyTicket(
    id: string,
    body: string,
    internal: boolean,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  setTicketStatus(
    id: string,
    status: SupportTicket["status"],
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  /** Governance */
  listAdmins(): Promise<AdminUser[]>;
  /** Optional read-only detail projection for live Admin providers. */
  getAdminDetail?(id: string): Promise<AdminUser>;
  listAudit(): Promise<AuditEvent[]>;
  listFlags(): Promise<FeatureFlag[]>;
  toggleFlag(key: string, ctx: ConsequentialContext): Promise<MutationResult>;
  updateFlag(
    key: string,
    patch: Partial<
      Pick<
        FeatureFlag,
        "description" | "enabled" | "env" | "rolloutPct" | "roleTargets" | "userTargets"
      >
    >,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  listAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(
    payload: { title: string; body: string; targeting?: unknown; published?: boolean; startsAt?: string; endsAt?: string },
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  updateAnnouncement(
    id: string,
    payload: { title?: string; body?: string; targeting?: unknown; published?: boolean; startsAt?: string; endsAt?: string },
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  publishAnnouncement(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  listMessages(): Promise<AdminMessage[]>;
  listNotifications(): Promise<AdminNotification[]>;
  sendNotification(
    payload: { userId: string; type: string; title: string; body: string },
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  listLearnArticles(): Promise<AdminLearnArticle[]>;
  listLearnCategories(): Promise<AdminLearnCategory[]>;
  createLearnCategory(
    payload: { slug: string; name: string; description?: string; sortOrder?: number; status?: string },
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  createLearnArticle(
    payload: { slug: string; title: string; body: string; summary?: string; status?: string; categoryId?: string; scheduledAt?: string; tags?: string[]; media?: Array<{ url: string; altText?: string; provider?: string; metadata?: unknown }> },
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  updateLearnArticle(
    id: string,
    payload: { title?: string; body?: string; summary?: string; status?: string; categoryId?: string; scheduledAt?: string; tags?: string[]; media?: Array<{ url: string; altText?: string; provider?: string; metadata?: unknown }> },
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  publishLearnArticle(id: string, ctx: ConsequentialContext): Promise<MutationResult>;
  listHealth(): Promise<HealthCheck[]>;

  /** Governance — admin accounts */
  setAdminStatus(
    id: string,
    status: "active" | "suspended" | "invited",
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  /** Optional until the live provider contract is connected. */
  setAdminRole?(id: string, role: RoleId, ctx: ConsequentialContext): Promise<MutationResult>;

  /** Governance — role permission matrix */
  listRoleDefinitions(): Promise<
    { id: RoleId; label: string; description: string; permissions: Permission[] }[]
  >;
  updateRolePermission(
    roleId: RoleId,
    permission: Permission,
    enabled: boolean,
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  /** Governance — approval queue */
  listApprovals(): Promise<ApprovalRequest[]>;
  decideApproval(
    id: string,
    decision: "approved" | "rejected",
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;

  /** Governance — maintenance windows */
  listMaintenanceWindows(): Promise<MaintenanceWindow[]>;
  scheduleMaintenanceWindow(
    payload: {
      scope: MaintenanceScope;
      target: string;
      scheduledAt: string;
      endsAt: string;
      reason: string;
    },
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  cancelMaintenanceWindow(id: string, ctx: ConsequentialContext): Promise<MutationResult>;

  /** Sandbox */
  applySandboxOverride(
    payload: {
      scope: "binary" | "spot" | "balance";
      target: string;
      mode: "normal" | "forced_win" | "forced_loss";
      seed?: string;
      expectedResult?: string;
      expiresAt?: string;
    },
    ctx: ConsequentialContext,
  ): Promise<MutationResult>;
  executeSandboxCommand(commandId: string, ctx: ConsequentialContext): Promise<MutationResult>;

  /** Subscription to audit stream (for UI refresh) */
  subscribe(fn: () => void): () => void;
}

export class NotConnectedError extends Error {
  constructor(method: string) {
    super(
      `NexiAdminApiProvider is a documented placeholder and is not connected. Method: ${method}`,
    );
    this.name = "NotConnectedError";
  }
}
