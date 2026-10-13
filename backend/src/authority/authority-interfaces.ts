export interface LedgerPostingCommand {
  accountId: string;
  asset: string;
  amount: string;
  referenceType: string;
  referenceId: string;
  idempotencyKey: string;
  correlationId?: string;
  economicGroup?: string;
  metadata?: Record<string, unknown>;
}
export interface PairedTransferCommand {
  debitAccountId: string;
  creditAccountId: string;
  asset: string;
  amount: string;
  referenceType: string;
  referenceId: string;
  idempotencyKey: string;
  correlationId?: string;
  economicGroup?: string;
  sameUserTransfer?: { userId: string; fromScope: string; toScope: string };
  internalTransfer?: {
    transferId: string;
    fromUserId: string;
    toUserId: string;
  };
  marginActivity?: {
    activityId: string;
    userId: string;
    accountId: string;
    type: string;
    status: string;
    details: Record<string, unknown>;
  };
}
export interface LedgerMutationResult {
  postingId: string;
  accountId: string;
  available: string;
  locked: string;
  replayed: boolean;
}
export interface WalletLedgerAuthority {
  reserve(command: LedgerPostingCommand): Promise<LedgerMutationResult>;
  release(command: LedgerPostingCommand): Promise<LedgerMutationResult>;
  settle(command: LedgerPostingCommand): Promise<LedgerMutationResult>;
  credit(command: LedgerPostingCommand): Promise<LedgerMutationResult>;
  debit(command: LedgerPostingCommand): Promise<LedgerMutationResult>;
  compensate(command: LedgerPostingCommand): Promise<LedgerMutationResult>;
  pairedTransfer(command: PairedTransferCommand): Promise<{ debitPostingId: string; creditPostingId: string; replayed: boolean }>;
  reconcile(accountId: string, asset: string): Promise<{ available: string; locked: string }>;
}
export interface SettlementAuthority { settle(positionId: string, idempotencyKey: string): Promise<{ settlementId: string; auditReference: string }>; }
