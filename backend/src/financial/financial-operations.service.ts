import { BadRequestException, Injectable, NotFoundException, Optional, ServiceUnavailableException } from '@nestjs/common';
import { Gate2ConversionQuoteState, Gate2DepositState, Gate2WithdrawalState, Prisma } from '../prisma/d1-client';
import { randomUUID } from 'node:crypto';
import { D1FinancialCommandGateway, type D1MarketPairRow } from '../d1/d1-financial-command.gateway';
import { LocalDepositProofStore } from './local-deposit-proof.store';
import { assertNonNegativeDecimal, assertPositiveDecimal, decimalProduct } from '../gate2/gate2-rules';

export interface DepositObservation { userId: string; asset: string; network: string; address: string; txHash: string; amount: string; confirmations: number; requiredConfirmations: number; observationKey: string; provider: 'deterministic-test'; }
export interface WithdrawalInput { asset: string; network: string; address: string; amount: string; idempotencyKey: string; }
export interface TransferInput { toUserId?: string; toUserCode?: number; asset: string; amount: string; idempotencyKey: string; }
export interface ConversionQuoteInput { fromAsset: string; toAsset: string; amount: string; quoteKey: string; }
type ConversionAssets = Pick<ConversionQuoteInput, 'fromAsset' | 'toAsset'>;
type ConversionRateRequest = ConversionAssets & { rateKey: string };
type ConversionMarketPair = ConversionAssets & { pair: D1MarketPairRow; inverted: boolean };
type ConversionMarketRate = { price: string; inverted: boolean };
type ConversionRateSource = { rate: Prisma.Decimal; provider: string; source: string; evidenceId: string };
export interface DepositClaimInput { asset: string; network: string; depositAddressId: string; claimedAmount: string; proofObjectKey: string; txHash?: string; idempotencyKey: string; }

@Injectable()
export class FinancialOperationsService {
  constructor(private readonly d1: D1FinancialCommandGateway, @Optional() private readonly localProofs?: LocalDepositProofStore) {}

  async observeDeposit(input: DepositObservation): Promise<any> {
    if (input.provider !== 'deterministic-test') throw new ServiceUnavailableException('External deposit providers are disabled in Gate 2');
    assertPositiveDecimal(input.amount);
    if (!Number.isInteger(input.confirmations) || input.confirmations < 0 || !Number.isInteger(input.requiredConfirmations) || input.requiredConfirmations <= 0) throw new BadRequestException('Confirmation counts are invalid');
    if (!await this.d1.hasAssetCapability(input.asset, input.network, 'deposit')) throw new BadRequestException('deposit capability is unavailable');
    const deposit: any = await this.d1.upsertDepositObservation(input);
    if (deposit.userId !== input.userId) throw new BadRequestException('Deposit ownership mismatch');
    if (deposit.state === Gate2DepositState.CREDITED && deposit.creditPostingId) return { deposit, credited: false, providerLive: false };
    return { deposit: await this.d1.creditDepositAtomic(String(deposit.id), 'Deposit observation reached confirmation threshold', undefined, `gate2:deposit:credit:${deposit.id}`), credited: true, providerLive: false };
  }

  private hasWithdrawalCapability(config: Awaited<ReturnType<D1FinancialCommandGateway['getWalletAssetNetworkConfig']>>): boolean {
    return Boolean(config) && [
      config?.assetActive,
      config?.withdrawEnabled,
      config?.networkActive,
      config?.networkWithdrawEnabled,
    ].every((value) => Number(value) === 1);
  }

  private assertWithdrawalCapability(config: Awaited<ReturnType<D1FinancialCommandGateway['getWalletAssetNetworkConfig']>>): void {
    if (!this.hasWithdrawalCapability(config)) throw new BadRequestException('withdraw capability is unavailable');
  }

  private assertWithdrawalAmountWithinLimits(amount: ReturnType<typeof assertPositiveDecimal>, minimum: ReturnType<typeof assertPositiveDecimal>, maximum: ReturnType<typeof assertPositiveDecimal>): void {
    if (amount.lt(minimum) || amount.gt(maximum)) throw new BadRequestException('Withdrawal amount is outside configured limits');
  }

  private async configuredWithdrawalFee(asset: string, network: string, amount: ReturnType<typeof assertPositiveDecimal>) {
    const config = await this.d1.getWalletAssetNetworkConfig(asset, network);
    this.assertWithdrawalCapability(config);
    const minimum = assertPositiveDecimal(String(config.minWithdrawal));
    const maximum = assertPositiveDecimal(String(config.maxWithdrawal));
    this.assertWithdrawalAmountWithinLimits(amount, minimum, maximum);
    return assertNonNegativeDecimal(String(config.withdrawalFee));
  }

  async requestWithdrawal(userId: string, input: WithdrawalInput): Promise<any> {
    this.assertIdempotencyKey(input.idempotencyKey);
    const amount = assertPositiveDecimal(input.amount);
    const fee = await this.configuredWithdrawalFee(input.asset, input.network, amount);
    const existing = await this.d1.getWithdrawal(input.idempotencyKey);
    if (existing) {
      if (String(existing.userId) !== userId) throw new BadRequestException('Withdrawal ownership mismatch');
      return { withdrawal: existing, replayed: true, providerLive: false };
    }
    return { withdrawal: await this.d1.reserveWithdrawal({ userId, asset: input.asset, network: input.network, address: input.address, amount: amount.toString(), fee: fee.toString(), reservedAmount: amount.add(fee).toString(), requestKey: input.idempotencyKey, reserveKey: `gate2:withdrawal:reserve:${input.idempotencyKey}`, providerState: 'DETERMINISTIC_TEST_NON_LIVE' }), replayed: false, providerLive: false };
  }

  async approveWithdrawal(id: string, reason: string, adminId = 'system', idempotencyKey = `approve:${id}`): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Review reason is required');
    const withdrawal: any = await this.d1.getWithdrawalById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.state === Gate2WithdrawalState.APPROVED) return { withdrawal, replayed: true, providerLive: false };
    if (withdrawal.state !== Gate2WithdrawalState.PENDING_REVIEW) throw new BadRequestException('Withdrawal is not pending review');
    return { withdrawal: await this.d1.approveWithdrawal(id, reason, adminId, idempotencyKey), replayed: false, providerLive: false };
  }

  async rejectWithdrawal(id: string, reason: string, adminId = 'system', idempotencyKey = `reject:${id}`): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Rejection reason is required');
    const withdrawal: any = await this.d1.getWithdrawalById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.state === Gate2WithdrawalState.REJECTED) return { withdrawal, replayed: true, providerLive: false };
    if (withdrawal.state !== Gate2WithdrawalState.PENDING_REVIEW) throw new BadRequestException('Withdrawal is not pending review');
    return { withdrawal: await this.d1.releaseWithdrawal(id, reason, adminId, 'REJECTED', idempotencyKey), replayed: false, providerLive: false };
  }

  async requestWithdrawalReview(id: string, reason: string, adminId: string, idempotencyKey: string): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Review reason is required');
    const withdrawal: any = await this.d1.getWithdrawalById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.state !== Gate2WithdrawalState.PENDING_REVIEW) throw new BadRequestException('Withdrawal is not pending review');
    return { withdrawal, replayed: false, providerLive: false };
  }

  async failWithdrawal(id: string, reason: string, adminId: string, idempotencyKey: string): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Failure reason is required');
    const withdrawal: any = await this.d1.getWithdrawalById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.state === Gate2WithdrawalState.FAILED) return { withdrawal, replayed: true, providerLive: false };
    if (withdrawal.state === Gate2WithdrawalState.SETTLED) throw new BadRequestException('Settled withdrawal cannot fail');
    return { withdrawal: await this.d1.releaseWithdrawal(id, reason, adminId, 'FAILED', idempotencyKey), replayed: false, providerLive: false };
  }

  async confirmDeposit(id: string, reason: string, adminId: string, idempotencyKey: string): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Confirmation reason is required');
    const deposit: any = await this.d1.getDeposit(id);
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.state === Gate2DepositState.CREDITED) return { deposit, replayed: true, providerLive: false };
    if (deposit.state === Gate2DepositState.REJECTED) throw new BadRequestException('Rejected deposit cannot be confirmed');
    return { deposit: await this.d1.creditDepositAtomic(id, reason, adminId, `gate2:deposit:credit:${idempotencyKey}`), replayed: false, providerLive: false };
  }

  async creditDeposit(id: string, reason: string, adminId: string, idempotencyKey: string): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Credit reason is required');
    const deposit: any = await this.d1.getDeposit(id);
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.state === Gate2DepositState.CREDITED) return { deposit, replayed: true, providerLive: false };
    if (Number(deposit.confirmations) < Number(deposit.requiredConfirmations)) throw new BadRequestException('Deposit confirmation threshold has not been reached');
    return { deposit: await this.d1.creditDepositAtomic(id, reason, adminId, `gate2:deposit:credit:${idempotencyKey}`), replayed: false, providerLive: false };
  }

  async failDeposit(id: string, reason: string, adminId: string, idempotencyKey: string): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Failure reason is required');
    const deposit: any = await this.d1.getDeposit(id);
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.state === Gate2DepositState.REJECTED) return { deposit, replayed: true, providerLive: false };
    if (deposit.state === Gate2DepositState.CREDITED) throw new BadRequestException('Credited deposit cannot be rejected');
    return { deposit: await this.d1.rejectDepositAtomic(id, reason, adminId, idempotencyKey), replayed: false, providerLive: false };
  }

  async settleWithdrawal(id: string, providerReceipt?: string, adminId?: string, reason?: string): Promise<any> {
    if (adminId && !reason?.trim()) throw new BadRequestException('Settlement reason is required');
    if (!providerReceipt || !providerReceipt.startsWith('deterministic:')) return { state: 'UNAVAILABLE', providerLive: false, reason: 'External provider disabled; no broadcast performed' };
    const withdrawal: any = await this.d1.getWithdrawalById(id);
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.state === Gate2WithdrawalState.SETTLED) return { withdrawal, replayed: true, providerLive: false };
    if (withdrawal.state !== Gate2WithdrawalState.APPROVED) throw new BadRequestException('Withdrawal is not approved');
    return { withdrawal: await this.d1.settleWithdrawalAtomic(id, providerReceipt, adminId, reason), replayed: false, providerLive: false };
  }

  async transferBetweenAccounts(userId: string, input: {
    sourceScope: string; destinationScope: string; asset: string; amount: string; idempotencyKey: string;
  }) {
    this.assertIdempotencyKey(input.idempotencyKey);
    const scopes = new Set(["MAIN", "SPOT", "MARGIN", "BINARY", "FINANCE"]);
    const sourceScope = input.sourceScope.trim().toUpperCase();
    const destinationScope = input.destinationScope.trim().toUpperCase();
    const asset = input.asset.trim().toUpperCase();
    if (!scopes.has(sourceScope) || !scopes.has(destinationScope)) throw new BadRequestException("Wallet account scope is unsupported");
    if (sourceScope === destinationScope) throw new BadRequestException("Wallet transfer accounts must differ");
    const amount = assertPositiveDecimal(input.amount);
    const [sourceSupported, destinationSupported] = await Promise.all([
      this.d1.isAssetSupportedForWalletScope(sourceScope, asset),
      this.d1.isAssetSupportedForWalletScope(destinationScope, asset),
    ]);
    if (!sourceSupported || !destinationSupported) throw new BadRequestException("Asset is not supported by both Wallet accounts");
    const [debit, credit] = await Promise.all([
      this.d1.getAccountForUser(userId, asset, sourceScope),
      this.d1.getAccountForUser(userId, asset, destinationScope),
    ]);
    const postings = await this.d1.pairedTransfer({
      debitAccountId: debit.id,
      creditAccountId: credit.id,
      asset,
      amount: amount.toString(),
      referenceType: "WALLET_ACCOUNT_TRANSFER",
      referenceId: input.idempotencyKey,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.idempotencyKey,
      economicGroup: input.idempotencyKey,
      sameUserTransfer: { userId, fromScope: sourceScope, toScope: destinationScope },
    });
    const [sourceBalance, destinationBalance] = await Promise.all([
      this.d1.getBalance(debit.id),
      this.d1.getBalance(credit.id),
    ]);
    const withTotal = (balance: { available: string; locked: string }) => ({
      ...balance,
      total: new Prisma.Decimal(balance.available).plus(balance.locked).toString(),
    });
    return {
      transfer: { asset, amount: amount.toString(), sourceScope, destinationScope, sourceAccountId: debit.id, destinationAccountId: credit.id },
      balances: { source: withTotal(sourceBalance), destination: withTotal(destinationBalance) },
      postings,
      replayed: postings.replayed,
    };
  }

  async transfer(userId: string, input: TransferInput) {
    this.assertIdempotencyKey(input.idempotencyKey);
    const toUserId = input.toUserId?.trim() ?? (input.toUserCode === undefined ? undefined : String((await this.d1.getUserByUserCode(input.toUserCode))?.id ?? ''));
    if (!toUserId) throw new NotFoundException('Transfer recipient not found');
    if (userId === toUserId) throw new BadRequestException('Internal transfer accounts must differ');
    const amount = assertPositiveDecimal(input.amount);
    const existing = await this.d1.getInternalTransfer(input.idempotencyKey);
    if (existing) {
      if (existing.fromUserId !== userId) throw new BadRequestException('Transfer ownership mismatch');
      return { transfer: existing, replayed: true };
    }
    const [from, to] = await Promise.all([this.d1.getUserById(userId), this.d1.getUserById(toUserId)]);
    if (!from || !to) throw new NotFoundException('Transfer user not found');
    const [debit, credit] = await Promise.all([this.d1.getAccountForUser(userId, input.asset), this.d1.getAccountForUser(toUserId, input.asset)]);
    const postings = await this.d1.pairedTransfer({ debitAccountId: debit.id, creditAccountId: credit.id, asset: input.asset, amount: amount.toString(), referenceType: 'GATE2_INTERNAL_TRANSFER', referenceId: input.idempotencyKey, idempotencyKey: input.idempotencyKey, correlationId: input.idempotencyKey, economicGroup: input.idempotencyKey, internalTransfer: { transferId: randomUUID(), fromUserId: userId, toUserId } });
    const transfer = await this.d1.getInternalTransfer(input.idempotencyKey);
    if (!transfer) throw new ServiceUnavailableException('D1 transfer record was not materialized');
    return { transfer, postings, replayed: false };
  }

  async createConversionQuote(userId: string, input: ConversionQuoteInput) {
    this.assertIdempotencyKey(input.quoteKey);
    const amount = assertPositiveDecimal(input.amount);
    const fromAsset = input.fromAsset.trim().toUpperCase();
    const toAsset = input.toAsset.trim().toUpperCase();
    if (fromAsset === toAsset) throw new BadRequestException('Conversion assets must differ');
    const existing = await this.d1.getConversionQuoteByKey(input.quoteKey);
    if (existing) {
      if (String(existing.userId) !== userId) throw new BadRequestException('Conversion quote ownership mismatch');
      return { quote: existing, replayed: true };
    }
    const rateKey = `gate2.conversion.rate.${fromAsset}.${toAsset}`;
    const conversionRate = await this.resolveConversionRate({ fromAsset, toAsset, rateKey });
    const quote = await this.d1.createConversionQuote({ id: randomUUID(), userId, fromAsset, toAsset, inputAmount: amount.toString(), rate: conversionRate.rate.toString(), outputAmount: decimalProduct(amount, conversionRate.rate).toString(), provider: conversionRate.provider, source: conversionRate.source, evidenceId: conversionRate.evidenceId, configurationVersion: 1, expiresAt: new Date(Date.now() + Number(process.env.NEXI_CONVERSION_QUOTE_TTL_MS ?? 30_000)).toISOString(), quoteKey: input.quoteKey });
    return { quote, replayed: false };
  }

  async acceptConversion(userId: string, quoteId: string, acceptanceKey: string) {
    this.assertIdempotencyKey(acceptanceKey);
    const quote: any = await this.d1.getConversionQuoteById(quoteId);
    if (!quote) throw new NotFoundException('Conversion quote not found');
    if (String(quote.userId) !== userId) throw new BadRequestException('Conversion quote ownership mismatch');
    if (String(quote.state) === Gate2ConversionQuoteState.ACCEPTED) {
      if (String(quote.acceptanceKey) !== acceptanceKey) throw new BadRequestException('Conversion quote already accepted');
      return { quote, replayed: true };
    }
    if (String(quote.state) !== Gate2ConversionQuoteState.OPEN) throw new BadRequestException('Conversion quote is not open');
    if (new Date(String(quote.expiresAt)).getTime() <= Date.now()) { await this.d1.expireConversionQuote(quoteId, userId); throw new BadRequestException('Conversion quote expired'); }
    return { quote: await this.d1.acceptConversion({ quoteId, userId, acceptanceKey, fromAsset: String(quote.fromAsset), toAsset: String(quote.toAsset), inputAmount: String(quote.inputAmount), outputAmount: String(quote.outputAmount) }), replayed: false };
  }

  getDepositDestinations() { return this.d1.listDepositDestinations(); }

  createDepositProofIntent(userId: string, contentType: string, byteSize: string) {
    const size = Number(byteSize);
    if (!/^image\/(png|jpeg|webp|gif)$/.test(contentType) || !Number.isSafeInteger(size) || size <= 0 || size > 10 * 1024 * 1024) throw new BadRequestException('Deposit proof must be an image no larger than 10MB');
    const key = `deposit-proofs/${userId}/${randomUUID()}`;
    return { key, uploadPath: `/storage/deposit-proof?key=${encodeURIComponent(key)}`, contentType, maxBytes: 10 * 1024 * 1024 };
  }

  authorizeDepositProofUpload(userId: string, key: string) {
    const prefix = `deposit-proofs/${userId}/`;
    if (!/^[0-9a-f-]{36}$/.test(key.startsWith(prefix) ? key.slice(prefix.length) : '')) throw new BadRequestException('Deposit proof key is invalid');
    return { authorized: true, key };
  }

  async submitDepositClaim(userId: string, input: DepositClaimInput) {
    this.assertIdempotencyKey(input.idempotencyKey);
    const amount = assertPositiveDecimal(input.claimedAmount);
    if (!input.proofObjectKey.trim()) throw new BadRequestException('Deposit proof is required');
    this.authorizeDepositProofUpload(userId, input.proofObjectKey.trim());
    if (process.env.NEXI_LOCAL_OBJECTS_ENABLED === 'true') {
      if (!this.localProofs || !await this.localProofs.head(input.proofObjectKey.trim())) {
        throw new BadRequestException('Deposit proof object is not available');
      }
    }
    const claim: any = await this.d1.submitDepositClaim({ id: randomUUID(), userId, asset: input.asset, network: input.network, depositAddressId: input.depositAddressId, claimedAmount: amount.toString(), proofObjectKey: input.proofObjectKey.trim(), txHash: input.txHash?.trim(), idempotencyKey: input.idempotencyKey });
    return { depositRequestId: claim.id, status: claim.state, claim, replayed: false };
  }

  getDepositClaims(userId: string) { return this.d1.listDepositClaims(userId); }
  getAdminDepositClaims() { return this.d1.listDepositClaims(); }
  async confirmDepositClaim(id: string, reason: string, adminId: string, idempotencyKey: string) { if (!reason?.trim()) throw new BadRequestException('Confirmation reason is required'); return { claim: await this.d1.updateDepositClaimState(id, 'APPROVED', adminId, reason, idempotencyKey), replayed: false }; }
  async creditDepositClaim(id: string, reason: string, adminId: string, idempotencyKey: string) { if (!reason?.trim()) throw new BadRequestException('Credit reason is required'); return { claim: await this.d1.creditDepositClaim(id, adminId, reason, idempotencyKey), replayed: false }; }
  async rejectDepositClaim(id: string, reason: string, adminId: string, idempotencyKey: string) { if (!reason?.trim()) throw new BadRequestException('Rejection reason is required'); return { claim: await this.d1.updateDepositClaimState(id, 'REJECTED', adminId, reason, idempotencyKey), replayed: false }; }
  getDeposits(userId: string) { return this.d1.listDeposits(userId); }
  getWithdrawals(userId: string) { return this.d1.listWithdrawals(userId); }
  getTransfers(userId: string) { return this.d1.listInternalTransfers(userId); }

  private async resolveConversionRate(request: ConversionRateRequest): Promise<ConversionRateSource> {
    const configuredRate = await this.d1.getSystemConfigValue(request.rateKey);
    if (configuredRate !== null) {
      return {
        rate: assertPositiveDecimal(configuredRate),
        provider: 'backend-config',
        source: request.rateKey,
        evidenceId: request.rateKey,
      };
    }
    return this.resolveMarketConversionRate(request);
  }

  private async resolveMarketConversionRate(assets: ConversionAssets): Promise<ConversionRateSource> {
    const pair = await this.getConversionMarketPair(assets);
    this.assertConversionPairDirection(pair);
    const marketQuote = await this.d1.getLiveMarketQuote(pair.pair.id);
    if (!marketQuote) throw new ServiceUnavailableException('Conversion market quote unavailable');
    return {
      rate: this.normalizeConversionMarketRate({ price: marketQuote.price, inverted: pair.inverted }),
      provider: marketQuote.provider,
      source: `${marketQuote.symbol}:${marketQuote.source}`,
      evidenceId: marketQuote.id,
    };
  }

  private async getConversionMarketPair(assets: ConversionAssets): Promise<ConversionMarketPair> {
    const directPair = await this.d1.getActiveMarketPair(`${assets.fromAsset}${assets.toAsset}`);
    if (directPair) return { ...assets, pair: directPair, inverted: false };
    const inversePair = await this.d1.getActiveMarketPair(`${assets.toAsset}${assets.fromAsset}`);
    if (!inversePair) throw new ServiceUnavailableException('Conversion market unavailable');
    return { ...assets, pair: inversePair, inverted: true };
  }

  private assertConversionPairDirection(direction: ConversionMarketPair): void {
    const expectedBase = direction.inverted ? direction.toAsset : direction.fromAsset;
    const expectedQuote = direction.inverted ? direction.fromAsset : direction.toAsset;
    if (direction.pair.baseAsset !== expectedBase) throw new ServiceUnavailableException('Conversion market unavailable');
    if (direction.pair.quoteAsset !== expectedQuote) throw new ServiceUnavailableException('Conversion market unavailable');
  }

  private normalizeConversionMarketRate(input: ConversionMarketRate): Prisma.Decimal {
    const marketRate = assertPositiveDecimal(input.price);
    if (!input.inverted) return marketRate;
    return assertPositiveDecimal(new Prisma.Decimal(1).div(marketRate).toDecimalPlaces(18, Prisma.Decimal.ROUND_DOWN));
  }

  private assertIdempotencyKey(key: string): void { if (!key || !/^[A-Za-z0-9._:-]{8,160}$/.test(key)) throw new BadRequestException('Idempotency key is invalid'); }
}
