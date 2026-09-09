import type { AdminDataProvider, ConsequentialContext, MutationResult } from "./provider";
import type {
  User,
  KycReview,
  KycStatus,
  Session,
  MarketFeed,
  BinaryDuration,
  BinaryPair,
  Asset,
  Network,
  SpotPair,
  SupportTicket,
  AuditEvent,
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
  FeatureFlag,
  ReconciliationItem,
  ReconciliationStatus,
  RoleId,
  Permission,
  ApprovalRequest,
  MaintenanceWindow,
  MaintenanceScope,
  MiningPlan,
  LoanPlan,
  MiningSubscriptionAdmin,
  LoanApplicationAdmin,
  Announcement,
  AdminMessage,
  AdminNotification,
  AdminLearnArticle,
} from "../types";
import { ROLES } from "../config/roles";
import {
  USERS,
  KYC_REVIEWS,
  SESSIONS,
  ASSETS,
  NETWORKS,
  FEEDS,
  SPOT_PAIRS,
  SPOT_ORDERS,
  BINARY_PAIRS,
  BINARY_POSITIONS,
  TICKETS,
  AUDIT_EVENTS,
  FLAGS,
  ANNOUNCEMENTS,
  HEALTH,
  ADMIN_ACCOUNTS,
} from "./fixtures";
import { AUDIT_EVENTS_GOV, APPROVAL_REQUESTS, MAINTENANCE_WINDOWS } from "./fixtures-governance";
import {
  PUBLIC_ROUTES,
  QUOTES_CATEGORIES,
  PUBLIC_BANNERS,
  INCIDENT_MESSAGES,
  SUPPORT_ENTRY_POINTS,
  NAV_ITEMS,
  TRANSLATION_KEYS,
  SETTLEMENT_RECORDS,
  EXPOSURE_ROWS,
} from "./fixtures-batch2";
import {
  WALLETS_B3,
  LEDGER_B3,
  DEPOSITS_B3,
  WITHDRAWALS_B3,
  RECONCILIATION_ITEMS,
} from "./fixtures-batch3";

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const wait = (ms = 120) => new Promise<void>((r) => setTimeout(r, ms));

function nextId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export class LocalMockAdminProvider implements AdminDataProvider {
  private users = clone(USERS);
  private kyc = clone(KYC_REVIEWS);
  private sessions = clone(SESSIONS);
  private assets = clone(ASSETS);
  private networks = clone(NETWORKS);
  private feeds = clone(FEEDS);
  private spotPairs = clone(SPOT_PAIRS);
  private spotOrders = clone(SPOT_ORDERS);
  private binaryPairs = clone(BINARY_PAIRS);
  private binaryPositions = clone(BINARY_POSITIONS);
  private wallets = clone(WALLETS_B3);
  private ledger = clone(LEDGER_B3);
  private deposits = clone(DEPOSITS_B3);
  private withdrawals = clone(WITHDRAWALS_B3);
  private reconciliation = clone(RECONCILIATION_ITEMS);
  private tickets = clone(TICKETS);
  private admins = clone(ADMIN_ACCOUNTS);
  private audit = clone([...AUDIT_EVENTS, ...AUDIT_EVENTS_GOV]);
  private approvals = clone(APPROVAL_REQUESTS);
  private maintenanceWindows = clone(MAINTENANCE_WINDOWS);
  private rolePerms: Record<RoleId, Permission[]> = Object.fromEntries(
    Object.entries(ROLES).map(([id, def]) => [id, Array.from(def.permissions)]),
  ) as Record<RoleId, Permission[]>;
  private flags = clone(FLAGS);
  private announcements = clone(ANNOUNCEMENTS);
  private health = clone(HEALTH);
  private publicRoutes = clone(PUBLIC_ROUTES);
  private quotesCategories = clone(QUOTES_CATEGORIES);
  private banners = clone(PUBLIC_BANNERS);
  private incidents = clone(INCIDENT_MESSAGES);
  private supportEntry = clone(SUPPORT_ENTRY_POINTS);
  private navItems = clone(NAV_ITEMS);
  private translations = clone(TRANSLATION_KEYS);
  private settlements = clone(SETTLEMENT_RECORDS);
  private exposure = clone(EXPOSURE_ROWS);
  private miningPlans: MiningPlan[] = [
    {
      id: "mining_demo_1",
      name: "USDT 30D",
      currency: "USDT",
      lockupPeriod: 30,
      dailyYield: "0.001",
      minDeposit: "100",
      maxDeposit: "100000",
      isActive: true,
    },
  ];
  private loanPlans: LoanPlan[] = [
    {
      id: "loan_demo_1",
      name: "Standard 30D",
      durationDays: 30,
      interestRate: 0.1,
      minAmount: 100,
      maxAmount: 100000,
      isActive: true,
    },
  ];
  private miningSubscriptions: MiningSubscriptionAdmin[] = [];
  private loanApplications: LoanApplicationAdmin[] = [];
  private listeners = new Set<() => void>();

  private notify() {
    for (const l of this.listeners) l();
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  async listMiningPlans() {
    await wait();
    return clone(this.miningPlans);
  }
  async createMiningPlan(payload: Omit<MiningPlan, "id">, ctx: ConsequentialContext) {
    await wait();
    const row = { ...payload, id: nextId("mining") };
    this.miningPlans.push(row);
    return this.audited("mining.plan_create", row.id, ctx, null, row);
  }
  async updateMiningPlan(
    id: string,
    patch: Partial<Omit<MiningPlan, "id">>,
    ctx: ConsequentialContext,
  ) {
    await wait();
    const row = this.miningPlans.find((item) => item.id === id);
    if (!row) return { ok: false, auditId: "" };
    const before = clone(row);
    Object.assign(row, patch);
    return this.audited("mining.plan_update", id, ctx, before, row);
  }
  async listLoanPlans() {
    await wait();
    return clone(this.loanPlans);
  }
  async createLoanPlan(payload: Omit<LoanPlan, "id">, ctx: ConsequentialContext) {
    await wait();
    const row = { ...payload, id: nextId("loan") };
    this.loanPlans.push(row);
    return this.audited("loans.plan_create", row.id, ctx, null, row);
  }
  async updateLoanPlan(
    id: string,
    patch: Partial<Omit<LoanPlan, "id">>,
    ctx: ConsequentialContext,
  ) {
    await wait();
    const row = this.loanPlans.find((item) => item.id === id);
    if (!row) return { ok: false, auditId: "" };
    const before = clone(row);
    Object.assign(row, patch);
    return this.audited("loans.plan_update", id, ctx, before, row);
  }

  async listMiningSubscriptions() {
    await wait();
    return clone(this.miningSubscriptions);
  }

  async listLoanApplications() {
    await wait();
    return clone(this.loanApplications);
  }

  async approveLoanApplication(id: string, ctx: ConsequentialContext) {
    await wait();
    const row = this.loanApplications.find((item) => item.id === id);
    if (!row) return { ok: false, auditId: "" };
    const before = clone(row);
    row.status = "ACTIVE";
    return this.audited("loans.application_approve", id, ctx, before, row);
  }

  async rejectLoanApplication(id: string, ctx: ConsequentialContext) {
    await wait();
    const row = this.loanApplications.find((item) => item.id === id);
    if (!row) return { ok: false, auditId: "" };
    const before = clone(row);
    row.status = "REJECTED";
    return this.audited("loans.application_reject", id, ctx, before, row);
  }

  private audited(
    action: string,
    target: string,
    ctx: ConsequentialContext,
    before: unknown,
    after: unknown,
    result: "ok" | "failed" = "ok",
  ): MutationResult {
    const ev: AuditEvent = {
      id: nextId("aud"),
      ts: new Date().toISOString(),
      actor: ctx.actor,
      role: ctx.role,
      environment: ctx.environment,
      action,
      target,
      reason: ctx.reason,
      before: clone(before),
      after: clone(after),
      correlationId: nextId("cor"),
      result,
    };
    this.audit.unshift(ev);
    this.notify();
    return { ok: result === "ok", auditId: ev.id };
  }

  /* ---------- Users ---------- */
  async listUsers() {
    await wait();
    return clone(this.users);
  }
  async getUser(id: string) {
    await wait();
    return clone(this.users.find((u) => u.id === id));
  }
  async setUserStatus(id: string, status: UserStatus, ctx: ConsequentialContext) {
    await wait();
    const u = this.users.find((x) => x.id === id);
    if (!u) return { ok: false, auditId: "" };
    const before = { status: u.status };
    u.status = status;
    return this.audited("users.set_status", id, ctx, before, { status });
  }
  async updateUserEntitlements(
    id: string,
    entitlements: User["entitlements"],
    ctx: ConsequentialContext,
  ) {
    await wait();
    const u = this.users.find((x) => x.id === id);
    if (!u) return { ok: false, auditId: "" };
    const before = { entitlements: clone(u.entitlements) };
    u.entitlements = clone(entitlements);
    return this.audited("users.update_entitlements", id, ctx, before, { entitlements });
  }
  async updateUserRestrictions(
    id: string,
    restrictions: UserRestrictionTag[],
    ctx: ConsequentialContext,
  ) {
    await wait();
    const u = this.users.find((x) => x.id === id);
    if (!u) return { ok: false, auditId: "" };
    const before = { restrictions: [...u.restrictions] };
    u.restrictions = [...restrictions];
    return this.audited("users.update_restrictions", id, ctx, before, {
      restrictions: [...restrictions],
    });
  }
  async setUserSandbox(id: string, sandbox: boolean, ctx: ConsequentialContext) {
    await wait();
    const u = this.users.find((x) => x.id === id);
    if (!u) return { ok: false, auditId: "" };
    const before = { sandbox: !!u.sandbox };
    u.sandbox = sandbox;
    return this.audited(sandbox ? "users.mark_sandbox" : "users.unmark_sandbox", id, ctx, before, {
      sandbox,
    });
  }

  /* ---------- KYC ---------- */
  async listKyc() {
    await wait();
    return clone(this.kyc);
  }
  async decideKyc(
    id: string,
    decision: Exclude<KycStatus, "unverified" | "pending">,
    ctx: ConsequentialContext,
  ) {
    await wait();
    const r = this.kyc.find((x) => x.id === id);
    if (!r) return { ok: false, auditId: "" };
    const before = { status: r.status };
    r.status = decision;
    r.reviewer = ctx.actor;
    const u = this.users.find((x) => x.id === r.userId);
    if (u) u.kyc = decision;
    return this.audited("kyc.decide", id, ctx, before, { status: decision });
  }
  async assignKycReviewer(id: string, reviewer: string, ctx: ConsequentialContext) {
    await wait();
    const r = this.kyc.find((x) => x.id === id);
    if (!r) return { ok: false, auditId: "" };
    const before = { reviewer: r.reviewer ?? null };
    r.reviewer = reviewer;
    return this.audited("kyc.assign_reviewer", id, ctx, before, { reviewer });
  }
  async updateKycNotes(id: string, notes: string, ctx: ConsequentialContext) {
    await wait();
    const r = this.kyc.find((x) => x.id === id);
    if (!r) return { ok: false, auditId: "" };
    const before = { notes: r.notes ?? "" };
    r.notes = notes;
    return this.audited("kyc.update_notes", id, ctx, before, { notes });
  }

  /* ---------- Sessions ---------- */
  async listSessions() {
    await wait();
    return clone(this.sessions);
  }
  async revokeSession(id: string, ctx: ConsequentialContext) {
    await wait();
    const s = this.sessions.find((x) => x.id === id);
    if (!s) return { ok: false, auditId: "" };
    const before = { active: s.active };
    s.active = false;
    return this.audited("sessions.revoke", id, ctx, before, { active: false });
  }
  async revokeUserSessions(userId: string, ctx: ConsequentialContext) {
    await wait();
    const affected = this.sessions.filter((s) => s.userId === userId && s.active);
    const beforeIds = affected.map((s) => s.id);
    for (const s of affected) s.active = false;
    return this.audited(
      "sessions.revoke_all",
      userId,
      ctx,
      { activeSessions: beforeIds },
      { revoked: beforeIds.length },
    );
  }

  /* ---------- Markets ---------- */
  async listAssets() {
    await wait();
    return clone(this.assets);
  }
  async toggleAssetVisibility(id: string, ctx: ConsequentialContext) {
    await wait();
    const a = this.assets.find((x) => x.id === id);
    if (!a) return { ok: false, auditId: "" };
    const before = { visible: a.visible };
    a.visible = !a.visible;
    return this.audited("assets.toggle_visibility", id, ctx, before, { visible: a.visible });
  }
  async listNetworks() {
    await wait();
    return clone(this.networks);
  }
  async toggleNetwork(id: string, ctx: ConsequentialContext) {
    await wait();
    const n = this.networks.find((x) => x.id === id);
    if (!n) return { ok: false, auditId: "" };
    const before = { enabled: n.enabled };
    n.enabled = !n.enabled;
    return this.audited("networks.toggle", id, ctx, before, { enabled: n.enabled });
  }
  async listFeeds() {
    await wait();
    return clone(this.feeds);
  }
  async setFeedStatus(id: string, status: MarketFeed["status"], ctx: ConsequentialContext) {
    await wait();
    const f = this.feeds.find((x) => x.id === id);
    if (!f) return { ok: false, auditId: "" };
    const before = { status: f.status };
    f.status = status;
    return this.audited("feeds.set_status", id, ctx, before, { status });
  }

  /* ---------- Spot ---------- */
  async listSpotPairs() {
    await wait();
    return clone(this.spotPairs);
  }
  async listSpotOrders() {
    await wait();
    return clone(this.spotOrders);
  }
  async pauseSpotPair(id: string, paused: boolean, ctx: ConsequentialContext) {
    await wait();
    const p = this.spotPairs.find((x) => x.id === id);
    if (!p) return { ok: false, auditId: "" };
    const before = { maintenance: p.maintenance };
    p.maintenance = paused;
    return this.audited(paused ? "spot.pause_pair" : "spot.resume_pair", id, ctx, before, {
      maintenance: paused,
    });
  }
  async cancelSpotOrder(id: string, ctx: ConsequentialContext) {
    await wait();
    const o = this.spotOrders.find((x) => x.id === id);
    if (!o) return { ok: false, auditId: "" };
    const before = { status: o.status };
    o.status = "cancelled";
    return this.audited("spot.cancel_order", id, ctx, before, { status: "cancelled" });
  }
  async getMarginConfiguration() {
    await wait();
    return { maintenanceRatio: 0.5, leverages: [2, 3, 5] };
  }
  async updateMarginConfiguration(
    config: { maintenanceRatio: number; leverages: number[] },
    ctx: ConsequentialContext,
  ) {
    await wait();
    return this.audited("spot.margin_config", "isolated-margin", ctx, {}, config);
  }

  /* ---------- Binary ---------- */
  async listBinaryPairs() {
    await wait();
    return clone(this.binaryPairs);
  }
  async listBinaryPositions() {
    await wait();
    return clone(this.binaryPositions);
  }
  async pauseBinaryPair(id: string, paused: boolean, ctx: ConsequentialContext) {
    await wait();
    const p = this.binaryPairs.find((x) => x.id === id);
    if (!p) return { ok: false, auditId: "" };
    const before = { maintenance: p.maintenance };
    p.maintenance = paused;
    return this.audited(paused ? "binary.pause_pair" : "binary.resume_pair", id, ctx, before, {
      maintenance: paused,
    });
  }
  async settleBinaryPosition(id: string, ctx: ConsequentialContext) {
    await wait();
    const p = this.binaryPositions.find((x) => x.id === id);
    if (!p) return { ok: false, auditId: "" };
    const before = { status: p.status };
    // The local mock has no market-quote authority; model a successful canonical
    // settlement without exposing an outcome selector in the Admin contract.
    p.status = "won";
    return this.audited("binary.settle_position", id, ctx, before, { status: p.status });
  }

  /* ---------- Finance ---------- */
  async listWallets() {
    await wait();
    return clone(this.wallets);
  }
  async listLedger() {
    await wait();
    return clone(this.ledger);
  }
  async listDeposits() {
    await wait();
    return clone(this.deposits);
  }
  async confirmDeposit(id: string, ctx: ConsequentialContext) {
    await wait();
    const d = this.deposits.find((x) => x.id === id);
    if (!d) return { ok: false, auditId: "" };
    if (d.status === "credited" || d.status === "confirmed") {
      return this.audited(
        "deposits.confirm",
        id,
        ctx,
        { status: d.status },
        { rejected: "already_confirmed" },
        "failed",
      );
    }
    const before = { status: d.status, confirmations: d.confirmations };
    d.status = "confirmed";
    d.confirmations = Math.max(d.confirmations, d.requiredConfirmations);
    return this.audited("deposits.confirm", id, ctx, before, {
      status: d.status,
      confirmations: d.confirmations,
    });
  }
  async creditDeposit(id: string, ctx: ConsequentialContext) {
    await wait();
    const d = this.deposits.find((x) => x.id === id);
    if (!d) return { ok: false, auditId: "" };
    if (d.status === "credited") {
      return this.audited(
        "deposits.credit",
        id,
        ctx,
        { status: d.status },
        { rejected: "already_credited" },
        "failed",
      );
    }
    const before = { status: d.status, creditedAt: d.creditedAt };
    const nowIso = new Date().toISOString();
    d.status = "credited";
    d.creditedAt = nowIso;
    // Append a linked ledger entry to preserve the audit chain.
    this.ledger.unshift({
      id: `lg_${d.id}_credit`,
      ts: nowIso,
      userId: d.userId,
      domain: "spot",
      asset: d.asset,
      amount: `+${d.amount}`,
      credit: d.amount,
      debit: "0",
      type: "deposit",
      refId: d.id,
      status: "posted",
      reason: `Deposit ${d.id} credited by ${ctx.actor}`,
    });
    return this.audited("deposits.credit", id, ctx, before, {
      status: d.status,
      creditedAt: nowIso,
    });
  }
  async failDeposit(id: string, reason: string, ctx: ConsequentialContext) {
    await wait();
    const d = this.deposits.find((x) => x.id === id);
    if (!d) return { ok: false, auditId: "" };
    const before = { status: d.status, failureReason: d.failureReason };
    d.status = "failed";
    d.failureReason = reason;
    return this.audited("deposits.fail", id, ctx, before, {
      status: d.status,
      failureReason: reason,
    });
  }

  async listWithdrawals() {
    await wait();
    return clone(this.withdrawals);
  }
  async decideWithdrawal(id: string, decision: "approved" | "rejected", ctx: ConsequentialContext) {
    await wait();
    const w = this.withdrawals.find((x) => x.id === id);
    if (!w) return { ok: false, auditId: "" };
    const before = {
      status: w.status,
      approvalState: w.approvalState,
      processingState: w.processingState,
    };
    w.status = decision;
    w.approver = ctx.actor;
    w.approvalState = decision === "approved" ? "approved" : "rejected";
    if (decision === "rejected") w.processingState = "cancelled";
    else if (w.processingState === "queued") w.processingState = "processing";
    return this.audited(
      decision === "approved" ? "withdrawals.approve" : "withdrawals.reject",
      id,
      ctx,
      before,
      { status: w.status, approvalState: w.approvalState, processingState: w.processingState },
    );
  }
  async requestWithdrawalReview(id: string, ctx: ConsequentialContext) {
    await wait();
    const w = this.withdrawals.find((x) => x.id === id);
    if (!w) return { ok: false, auditId: "" };
    const before = { approvalState: w.approvalState, reviewNote: w.reviewNote };
    w.approvalState = "additional_review";
    w.reviewNote = ctx.reason;
    return this.audited("withdrawals.request_review", id, ctx, before, {
      approvalState: w.approvalState,
      reviewNote: ctx.reason,
    });
  }
  async setWithdrawalProcessing(
    id: string,
    processing: "processing" | "completed" | "failed",
    ctx: ConsequentialContext,
  ) {
    await wait();
    const w = this.withdrawals.find((x) => x.id === id);
    if (!w) return { ok: false, auditId: "" };
    const before = { processingState: w.processingState, status: w.status, txHash: w.txHash };
    w.processingState = processing;
    if (processing === "completed") {
      w.status = "confirmed";
      if (!w.txHash)
        w.txHash = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;
    } else if (processing === "failed") {
      w.status = "rejected";
    } else if (processing === "processing") {
      w.status = "approved";
    }
    return this.audited(`withdrawals.mark_${processing}`, id, ctx, before, {
      processingState: w.processingState,
      status: w.status,
      txHash: w.txHash,
    });
  }

  async listReconciliation() {
    await wait();
    return clone(this.reconciliation);
  }
  async assignReconciliationOwner(id: string, owner: string, ctx: ConsequentialContext) {
    await wait();
    const r = this.reconciliation.find((x) => x.id === id);
    if (!r) return { ok: false, auditId: "" };
    const before = { owner: r.owner ?? null };
    r.owner = owner;
    r.updatedAt = new Date().toISOString();
    if (r.status === "open") r.status = "investigating";
    return this.audited("reconciliation.assign", id, ctx, before, { owner, status: r.status });
  }
  async setReconciliationStatus(
    id: string,
    status: ReconciliationStatus,
    ctx: ConsequentialContext,
  ) {
    await wait();
    const r = this.reconciliation.find((x) => x.id === id);
    if (!r) return { ok: false, auditId: "" };
    const before = { status: r.status };
    r.status = status;
    r.updatedAt = new Date().toISOString();
    return this.audited(`reconciliation.set_status:${status}`, id, ctx, before, { status });
  }
  async addReconciliationNote(id: string, body: string, ctx: ConsequentialContext) {
    await wait();
    const r = this.reconciliation.find((x) => x.id === id);
    if (!r) return { ok: false, auditId: "" };
    const before = { noteCount: r.notes.length };
    const note = {
      id: `rn_${Math.random().toString(36).slice(2, 8)}`,
      ts: new Date().toISOString(),
      actor: ctx.actor,
      body,
    };
    r.notes = [...r.notes, note];
    r.updatedAt = note.ts;
    return this.audited("reconciliation.add_note", id, ctx, before, {
      noteCount: r.notes.length,
      addedNoteId: note.id,
    });
  }

  /* ---------- Support ---------- */
  async listTickets() {
    await wait();
    return clone(this.tickets);
  }
  async replyTicket(id: string, body: string, internal: boolean, ctx: ConsequentialContext) {
    await wait();
    const t = this.tickets.find((x) => x.id === id);
    if (!t) return { ok: false, auditId: "" };
    const before = { messages: t.messages.length };
    t.messages.push({
      id: nextId("m"),
      author: ctx.actor,
      internal,
      body,
      ts: new Date().toISOString(),
    });
    t.updatedAt = new Date().toISOString();
    return this.audited("support.reply", id, ctx, before, {
      messages: t.messages.length,
      internal,
    });
  }
  async setTicketStatus(id: string, status: SupportTicket["status"], ctx: ConsequentialContext) {
    await wait();
    const t = this.tickets.find((x) => x.id === id);
    if (!t) return { ok: false, auditId: "" };
    const before = { status: t.status };
    t.status = status;
    return this.audited("support.set_status", id, ctx, before, { status });
  }

  /* ---------- Governance ---------- */
  async listAdmins() {
    await wait();
    return clone(this.admins);
  }
  async listAudit() {
    await wait();
    return clone(this.audit);
  }
  async listFlags() {
    await wait();
    return clone(this.flags);
  }
  async toggleFlag(key: string, ctx: ConsequentialContext) {
    await wait();
    const f = this.flags.find((x) => x.key === key);
    if (!f) return { ok: false, auditId: "" };
    const before = { enabled: f.enabled };
    f.enabled = !f.enabled;
    f.updatedAt = new Date().toISOString();
    return this.audited("flags.toggle", key, ctx, before, { enabled: f.enabled });
  }
  async updateFlag(
    key: string,
    patch: Partial<
      Pick<
        FeatureFlag,
        "description" | "enabled" | "env" | "rolloutPct" | "roleTargets" | "userTargets"
      >
    >,
    ctx: ConsequentialContext,
  ) {
    await wait();
    const f = this.flags.find((x) => x.key === key);
    if (!f) return { ok: false, auditId: "" };
    const before: Partial<FeatureFlag> = {
      description: f.description,
      enabled: f.enabled,
      env: f.env,
      rolloutPct: f.rolloutPct,
      roleTargets: f.roleTargets ? [...f.roleTargets] : undefined,
      userTargets: f.userTargets ? [...f.userTargets] : undefined,
    };
    Object.assign(f, patch);
    f.updatedAt = new Date().toISOString();
    return this.audited("flags.update", key, ctx, before, patch);
  }
  async listAnnouncements() {
    await wait();
    return clone(this.announcements);
  }
  async createAnnouncement(
    payload: { title: string; body: string; published?: boolean },
    ctx: ConsequentialContext,
  ) {
    const item: Announcement = {
      id: nextId("announcement"),
      title: payload.title,
      body: payload.body,
      status: payload.published ? "published" : "draft",
      locale: "en",
      publishedAt: payload.published ? new Date().toISOString() : undefined,
    };
    this.announcements.unshift(item);
    return this.audited("announcements.create", item.id, ctx, {}, item);
  }
  async updateAnnouncement(
    id: string,
    payload: { title?: string; body?: string; published?: boolean },
    ctx: ConsequentialContext,
  ) {
    await wait();
    const item = this.announcements.find((row) => row.id === id);
    if (!item) return { ok: false, auditId: "" };
    const before = clone(item);
    if (payload.title !== undefined) item.title = payload.title;
    if (payload.body !== undefined) item.body = payload.body;
    if (payload.published !== undefined) {
      item.status = payload.published ? "published" : "draft";
      item.publishedAt = payload.published ? new Date().toISOString() : undefined;
    }
    return this.audited("announcements.update", id, ctx, before, item);
  }
  async publishAnnouncement(id: string, ctx: ConsequentialContext) {
    return this.updateAnnouncement(id, { published: true }, ctx);
  }
  async listMessages(): Promise<AdminMessage[]> {
    await wait();
    return [];
  }
  async listNotifications(): Promise<AdminNotification[]> {
    await wait();
    return [];
  }
  async sendNotification(
    payload: { userId: string; type: string; title: string; body: string },
    ctx: ConsequentialContext,
  ) {
    await wait();
    return this.audited("notifications.send", payload.userId, ctx, {}, payload);
  }
  async listLearnArticles(): Promise<AdminLearnArticle[]> {
    await wait();
    return [];
  }
  async createLearnArticle(
    payload: { slug: string; title: string; body: string; status?: string },
    ctx: ConsequentialContext,
  ) {
    await wait();
    return this.audited("learn.create", payload.slug, ctx, {}, payload);
  }
  async updateLearnArticle(
    id: string,
    payload: { title?: string; body?: string; status?: string },
    ctx: ConsequentialContext,
  ) {
    await wait();
    return this.audited("learn.update", id, ctx, {}, payload);
  }
  async publishLearnArticle(id: string, ctx: ConsequentialContext) {
    await wait();
    return this.audited("learn.publish", id, ctx, {}, { status: "PUBLISHED" });
  }
  async listHealth() {
    await wait();
    return clone(this.health);
  }
  async setAdminStatus(
    id: string,
    status: "active" | "suspended" | "invited",
    ctx: ConsequentialContext,
  ) {
    await wait();
    const a = this.admins.find((x) => x.id === id);
    if (!a) return { ok: false, auditId: "" };
    const before = { status: a.status ?? "active" };
    a.status = status;
    return this.audited("admins.set_status", id, ctx, before, { status });
  }
  async setAdminRole(id: string, role: RoleId, ctx: ConsequentialContext) {
    await wait();
    const a = this.admins.find((x) => x.id === id);
    if (!a) return { ok: false, auditId: "" };
    const before = { role: a.role };
    a.role = role;
    return this.audited("admins.set_role", id, ctx, before, { role });
  }
  async listRoleDefinitions() {
    await wait();
    return Object.entries(this.rolePerms).map(([id, perms]) => ({
      id: id as RoleId,
      label: ROLES[id as RoleId].label,
      description: ROLES[id as RoleId].description,
      permissions: [...perms] as Permission[],
    }));
  }
  async updateRolePermission(
    roleId: RoleId,
    permission: Permission,
    enabled: boolean,
    ctx: ConsequentialContext,
  ) {
    await wait();
    const current = this.rolePerms[roleId];
    if (!current) return { ok: false, auditId: "" };
    const before = { [permission]: current.includes(permission) };
    if (enabled && !current.includes(permission)) {
      current.push(permission);
    } else if (!enabled) {
      const idx = current.indexOf(permission);
      if (idx !== -1) current.splice(idx, 1);
    }
    return this.audited("roles.edit", roleId, ctx, before, { [permission]: enabled });
  }
  async listApprovals() {
    await wait();
    return clone(
      [...this.approvals].sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
      }),
    );
  }
  async decideApproval(id: string, decision: "approved" | "rejected", ctx: ConsequentialContext) {
    await wait();
    const a = this.approvals.find((x) => x.id === id);
    if (!a) return { ok: false, auditId: "" };
    if (a.status !== "pending") return { ok: false, auditId: a.auditId ?? "" };
    if (a.requestedBy === ctx.actor) {
      return this.audited(
        "approvals.self_approval_denied",
        id,
        ctx,
        { status: a.status },
        { status: a.status, rejected: "self_approval" },
        "failed",
      );
    }
    const before = { status: a.status };
    a.status = decision;
    a.decidedBy = ctx.actor;
    a.decidedAt = new Date().toISOString();
    a.decisionReason = ctx.reason;
    const result = this.audited(`approvals.decide:${decision}`, id, ctx, before, {
      status: decision,
      decidedBy: ctx.actor,
    });
    a.auditId = result.auditId;
    return result;
  }
  async listMaintenanceWindows() {
    await wait();
    return clone(
      [...this.maintenanceWindows].sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      ),
    );
  }
  async scheduleMaintenanceWindow(
    payload: {
      scope: MaintenanceScope;
      target: string;
      scheduledAt: string;
      endsAt: string;
      reason: string;
    },
    ctx: ConsequentialContext,
  ) {
    await wait();
    const id = nextId("maint");
    const win: MaintenanceWindow = {
      id,
      scope: payload.scope,
      target: payload.target,
      status: "scheduled",
      scheduledAt: payload.scheduledAt,
      endsAt: payload.endsAt,
      reason: payload.reason,
      createdBy: ctx.actor,
      createdAt: new Date().toISOString(),
    };
    this.maintenanceWindows.unshift(win);
    return this.audited(
      "maintenance.schedule",
      id,
      ctx,
      { status: null },
      { status: "scheduled", scope: payload.scope, target: payload.target },
    );
  }
  async cancelMaintenanceWindow(id: string, ctx: ConsequentialContext) {
    await wait();
    const w = this.maintenanceWindows.find((x) => x.id === id);
    if (!w || (w.status !== "scheduled" && w.status !== "active"))
      return { ok: false, auditId: "" };
    const before = { status: w.status };
    w.status = "cancelled";
    w.cancelledAt = new Date().toISOString();
    w.cancelledBy = ctx.actor;
    w.cancelReason = ctx.reason;
    return this.audited("maintenance.cancel", id, ctx, before, { status: "cancelled" });
  }

  /* ---------- Batch 2 · Markets extensions ---------- */
  async updateAsset(
    id: string,
    patch: Partial<Pick<Asset, "name" | "order" | "spot" | "binary" | "mining" | "loans">>,
    ctx: ConsequentialContext,
  ) {
    await wait();
    const a = this.assets.find((x) => x.id === id);
    if (!a) return { ok: false, auditId: "" };
    const before: Partial<Asset> = {
      name: a.name,
      order: a.order,
      spot: a.spot,
      binary: a.binary,
      mining: a.mining,
      loans: a.loans,
    };
    Object.assign(a, patch);
    return this.audited("assets.update", id, ctx, before, patch);
  }
  async reorderAssets(orderMap: Record<string, number>, ctx: ConsequentialContext) {
    await wait();
    const before: Record<string, number> = {};
    for (const a of this.assets) {
      if (orderMap[a.id] !== undefined) {
        before[a.id] = a.order;
        a.order = orderMap[a.id];
      }
    }
    return this.audited("assets.reorder", "assets", ctx, before, orderMap);
  }
  async updateNetwork(
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
      >
    >,
    ctx: ConsequentialContext,
  ) {
    await wait();
    const n = this.networks.find((x) => x.id === id);
    if (!n) return { ok: false, auditId: "" };
    const before: Partial<Network> = {
      contract: n.contract,
      decimals: n.decimals,
      explorer: n.explorer,
      minDeposit: n.minDeposit,
      minWithdrawal: n.minWithdrawal,
      withdrawalFee: n.withdrawalFee,
      confirmations: n.confirmations,
    };
    Object.assign(n, patch);
    return this.audited("networks.update", id, ctx, before, patch);
  }
  async failoverFeed(id: string, ctx: ConsequentialContext) {
    await wait();
    const f = this.feeds.find((x) => x.id === id);
    if (!f) return { ok: false, auditId: "" };
    if (!f.fallback)
      return this.audited(
        "feeds.failover",
        id,
        ctx,
        { provider: f.provider },
        { rejected: "no_fallback" },
        "failed",
      );
    const before = { provider: f.provider, fallback: f.fallback, status: f.status };
    const oldPrimary = f.provider;
    f.provider = f.fallback;
    f.fallback = oldPrimary;
    f.status = "LIVE";
    f.latencyMs = Math.max(30, Math.floor(f.latencyMs * 0.7));
    f.ageMs = 0;
    return this.audited("feeds.failover", id, ctx, before, {
      provider: f.provider,
      fallback: f.fallback,
      status: f.status,
    });
  }
  async updateSpotPair(
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
  ) {
    await wait();
    const p = this.spotPairs.find((x) => x.id === id);
    if (!p) return { ok: false, auditId: "" };
    const before: Partial<SpotPair> = {
      enabled: p.enabled,
      buy: p.buy,
      sell: p.sell,
      supports: [...p.supports],
      tpSl: p.tpSl,
      pricePrecision: p.pricePrecision,
      sizePrecision: p.sizePrecision,
      minNotional: p.minNotional,
      maxNotional: p.maxNotional,
      feeBps: p.feeBps,
      provider: p.provider,
    };
    Object.assign(p, patch);
    return this.audited("spot.update_pair", id, ctx, before, patch);
  }
  async updateBinaryPair(
    id: string,
    patch: Partial<
      Pick<BinaryPair, "enabled" | "minStake" | "maxStake" | "exposureCap" | "settlementDelayMs">
    > & { payoutBps?: Partial<Record<BinaryDuration, number>> },
    ctx: ConsequentialContext,
  ) {
    await wait();
    const p = this.binaryPairs.find((x) => x.id === id);
    if (!p) return { ok: false, auditId: "" };
    const before: Record<string, unknown> = {
      enabled: p.enabled,
      minStake: p.minStake,
      maxStake: p.maxStake,
      exposureCap: p.exposureCap,
      settlementDelayMs: p.settlementDelayMs,
      payoutBps: { ...p.payoutBps },
    };
    if (patch.payoutBps) {
      const payoutBps = { ...p.payoutBps };
      for (const [duration, payout] of Object.entries(patch.payoutBps)) {
        if (payout !== undefined) payoutBps[Number(duration)] = payout;
      }
      p.payoutBps = payoutBps;
    }
    const { payoutBps: _pb, ...rest } = patch;
    Object.assign(p, rest);
    return this.audited("binary.update_pair", id, ctx, before, patch);
  }

  /* ---------- Batch 2 · Settlements ---------- */
  async listSettlements() {
    await wait();
    return clone(this.settlements);
  }
  async correctSettlement(id: string, outcome: SettlementState, ctx: ConsequentialContext) {
    await wait();
    const s = this.settlements.find((x) => x.id === id);
    if (!s) return { ok: false, auditId: "" };
    const before = { state: s.state, notes: s.notes ?? "" };
    s.state = outcome;
    s.settledAt = new Date().toISOString();
    s.notes = `${s.notes ? s.notes + " · " : ""}Corrected by ${ctx.actor}`;
    return this.audited("settlements.correct", id, ctx, before, { state: outcome });
  }

  /* ---------- Batch 2 · Exposure ---------- */
  async listExposure() {
    await wait();
    return clone(this.exposure);
  }

  /* ---------- Batch 2 · Frontend Control ---------- */
  async listPublicRoutes() {
    await wait();
    return clone(this.publicRoutes);
  }
  async setPublicRouteState(
    id: string,
    state: PublicRouteState,
    message: string | undefined,
    ctx: ConsequentialContext,
  ) {
    await wait();
    const r = this.publicRoutes.find((x) => x.id === id);
    if (!r) return { ok: false, auditId: "" };
    const before = { state: r.state, unavailableMessage: r.unavailableMessage };
    r.state = state;
    if (state === "maintenance" || state === "hidden") {
      r.unavailableMessage = message ?? r.unavailableMessage;
    } else if (state === "public" || state === "authenticated") {
      r.unavailableMessage = message ?? undefined;
    }
    return this.audited("frontend.route_state", id, ctx, before, {
      state,
      unavailableMessage: r.unavailableMessage,
    });
  }
  async reorderPublicRoutes(orderMap: Record<string, number>, ctx: ConsequentialContext) {
    await wait();
    const before: Record<string, number> = {};
    for (const r of this.publicRoutes) {
      if (orderMap[r.id] !== undefined) {
        before[r.id] = r.order;
        r.order = orderMap[r.id];
      }
    }
    return this.audited("frontend.routes_reorder", "public_routes", ctx, before, orderMap);
  }

  async listQuotesCategories() {
    await wait();
    return clone(this.quotesCategories);
  }
  async toggleQuotesCategory(id: string, ctx: ConsequentialContext) {
    await wait();
    const c = this.quotesCategories.find((x) => x.id === id);
    if (!c) return { ok: false, auditId: "" };
    const before = { visible: c.visible };
    c.visible = !c.visible;
    return this.audited("frontend.quotes_category_toggle", id, ctx, before, { visible: c.visible });
  }
  async reorderQuotesCategories(orderMap: Record<string, number>, ctx: ConsequentialContext) {
    await wait();
    const before: Record<string, number> = {};
    for (const c of this.quotesCategories) {
      if (orderMap[c.id] !== undefined) {
        before[c.id] = c.order;
        c.order = orderMap[c.id];
      }
    }
    return this.audited(
      "frontend.quotes_category_reorder",
      "quotes_categories",
      ctx,
      before,
      orderMap,
    );
  }

  async listBanners() {
    await wait();
    return clone(this.banners);
  }
  async setBannerActive(id: string, active: boolean, ctx: ConsequentialContext) {
    await wait();
    const b = this.banners.find((x) => x.id === id);
    if (!b) return { ok: false, auditId: "" };
    const before = { active: b.active };
    b.active = active;
    return this.audited("frontend.banner_active", id, ctx, before, { active });
  }
  async upsertBanner(banner: PublicBanner, ctx: ConsequentialContext) {
    await wait();
    const existing = this.banners.find((x) => x.id === banner.id);
    if (existing) {
      const before = clone(existing);
      Object.assign(existing, banner);
      return this.audited("frontend.banner_update", banner.id, ctx, before, banner);
    }
    const created = { ...banner, id: banner.id || nextId("bn") };
    this.banners.push(created);
    return this.audited("frontend.banner_create", created.id, ctx, {}, created);
  }

  async listIncidents() {
    await wait();
    return clone(this.incidents);
  }
  async setIncidentActive(id: string, active: boolean, ctx: ConsequentialContext) {
    await wait();
    const i = this.incidents.find((x) => x.id === id);
    if (!i) return { ok: false, auditId: "" };
    const before = { active: i.active };
    i.active = active;
    return this.audited("frontend.incident_active", id, ctx, before, { active });
  }

  async listSupportEntryPoints() {
    await wait();
    return clone(this.supportEntry);
  }
  async updateSupportEntryPoint(
    id: string,
    patch: Partial<Pick<SupportEntryPoint, "label" | "target" | "channel" | "visible" | "order">>,
    ctx: ConsequentialContext,
  ) {
    await wait();
    const s = this.supportEntry.find((x) => x.id === id);
    if (!s) return { ok: false, auditId: "" };
    const before: Partial<SupportEntryPoint> = {
      label: s.label,
      target: s.target,
      channel: s.channel,
      visible: s.visible,
      order: s.order,
    };
    Object.assign(s, patch);
    return this.audited("frontend.support_entry_update", id, ctx, before, patch);
  }

  /* ---------- Batch 2 · Navigation ---------- */
  async listNavItems() {
    await wait();
    return clone(this.navItems);
  }
  async updateNavItems(surface: NavSurface, items: NavItem[], ctx: ConsequentialContext) {
    await wait();
    const before = this.navItems
      .filter((n) => n.surface === surface)
      .map((n) => ({
        id: n.id,
        order: n.order,
        visible: n.visible,
        audience: n.audience,
        label: n.label,
      }));
    this.navItems = [
      ...this.navItems.filter((n) => n.surface !== surface),
      ...items.map((it) => ({ ...it, surface })),
    ];
    return this.audited(
      "navigation.update",
      `nav:${surface}`,
      ctx,
      before,
      items.map((n) => ({
        id: n.id,
        order: n.order,
        visible: n.visible,
        audience: n.audience,
        label: n.label,
      })),
    );
  }

  /* ---------- Batch 2 · Localization ---------- */
  async listTranslationKeys() {
    await wait();
    return clone(this.translations);
  }
  async updateTranslationValue(
    id: string,
    locale: Locale,
    value: string,
    ctx: ConsequentialContext,
  ) {
    await wait();
    const t = this.translations.find((x) => x.id === id);
    if (!t) return { ok: false, auditId: "" };
    const before = { [locale]: t.values[locale] ?? null };
    if (value === "") {
      delete t.values[locale];
    } else {
      t.values[locale] = value;
    }
    t.updatedAt = new Date().toISOString();
    t.editor = ctx.actor;
    return this.audited("localization.update", id, ctx, before, { [locale]: value });
  }

  async applySandboxOverride(
    payload: Parameters<AdminDataProvider["applySandboxOverride"]>[0],
    ctx: ConsequentialContext,
  ) {
    await wait();
    if (ctx.environment !== "SANDBOX") {
      return this.audited(
        "sandbox.force_result",
        payload.target,
        ctx,
        { requested: payload },
        { rejected: "not_sandbox" },
        "failed",
      );
    }
    return this.audited("sandbox.force_result", payload.target, ctx, { mode: "normal" }, payload);
  }

  async executeSandboxCommand(commandId: string, ctx: ConsequentialContext) {
    await wait();
    return this.audited(
      "sandbox.executed",
      commandId,
      ctx,
      { commandId },
      { commandId, status: "EXECUTED" },
    );
  }
}

export const localProvider = new LocalMockAdminProvider();
