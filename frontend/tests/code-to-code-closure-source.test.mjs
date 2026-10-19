import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const repo = new URL('../../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, repo), 'utf8');
const hasAll = (text, needles) => {
  for (const needle of needles) assert.ok(text.includes(needle), `missing source edge: ${needle}`);
};

const assetRegistry = read('frontend/app/lib/asset-registry.ts');
const assetDetail = read('frontend/app/dashboard/asset/[symbol]/page.tsx');
const realtime = read('frontend/app/hooks/useRealtimeMarket.ts');
const marketProxy = read('frontend/app/api/market/klines/route.ts');
const marketContract = read('backend/src/market/market-kline.contract.ts');
const marketController = read('backend/src/market/market-kline.controller.ts');
const spotPublic = read('frontend/app/dashboard/spot/page.tsx');
const marginApi = read('frontend/app/lib/margin-api.ts');
const binaryPublic = read('frontend/app/dashboard/binary/page.tsx');
const walletPublic = read('frontend/app/dashboard/wallet/page.tsx');
const walletReadback = [
  'async function readAuthority',
  'const response = await api.get(endpoint)',
  'readAuthority(walletEndpoint',
  'readAuthority(activityEndpoint',
  "loadWalletData('/wallet/me', '/wallet/activity')",
];
const depositPublic = read('frontend/app/dashboard/wallet/components/DepositModal.tsx');
const withdrawPublic = read('frontend/app/dashboard/wallet/components/WithdrawModal.tsx');
const transferPublic = read('frontend/app/dashboard/wallet/components/TransferModal.tsx');
const convertPublic = read('frontend/app/dashboard/wallet/components/ConvertModal.tsx');
const miningPublic = read('frontend/app/dashboard/mining/page.tsx');
const loansPublic = read('frontend/app/dashboard/loans/page.tsx');
const spotController = read('backend/src/spot/spot.controller.ts');
const spotService = read('backend/src/spot/spot.service.ts');
const marginController = read('backend/src/spot/margin.controller.ts');
const marginService = read('backend/src/spot/margin.service.ts');
const binaryController = read('backend/src/binary/binary.controller.ts');
const binaryService = read('backend/src/binary/binary.service.ts');
const financialController = read('backend/src/financial/financial-operations.controller.ts');
const financialService = read('backend/src/financial/financial-operations.service.ts');
const miningController = read('backend/src/mining/mining.controller.ts');
const miningService = read('backend/src/mining/mining.service.ts');
const loansController = read('backend/src/loans/loans.controller.ts');
const loansService = read('backend/src/loans/loans.service.ts');
const adminController = read('backend/src/admin/admin.controller.ts');
const adminService = read('backend/src/admin/admin.service.ts');
const adminRbac = read('backend/src/admin/admin-rbac.ts');
const adminProvider = read('Admin/src/admin/data/nexi-api-provider.ts');
const d1 = read('backend/src/d1/d1-financial-command.gateway.ts');
const sandboxScenario = read('backend/src/sandbox/sandbox-scenario.service.ts');
const sandboxExecution = read('backend/src/sandbox/sandbox-execution.service.ts');

function countArrayEntries(source, name, tuple = false) {
  const pattern = tuple
    ? new RegExp(`const ${name}(?:[^=]*)= \\[([\\s\\S]*?)\\];`)
    : new RegExp(`const ${name} = \\[([\\s\\S]*?)\\] as const;`);
  const body = source.match(pattern)?.[1];
  assert.ok(body, `cannot parse ${name}`);
  return tuple ? (body.match(/\['/g) ?? []).length : (body.match(/'[^']+'/g) ?? []).length;
}

test('A02 Dashboard/market data: canonical 53 assets × required seven Public Kline intervals are wired', () => {
  const crypto = assetRegistry.match(/const crypto = \[([\s\S]*?)\] as const;/)?.[1];
  assert.ok(crypto);
  const cryptoCount = (crypto.match(/\['[A-Z0-9]+',/g) ?? []).length;
  const stockCount = countArrayEntries(assetRegistry, 'stocks');
  const forexCount = countArrayEntries(assetRegistry, 'forex');
  const metalCount = countArrayEntries(assetRegistry, 'metals', true);
  assert.equal(cryptoCount + stockCount + forexCount + metalCount, 53);
  const required = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
  for (const interval of required) {
    assert.ok(marketContract.includes(`'${interval}'`), `backend missing ${interval}`);
    assert.ok(assetDetail.includes(`'${interval}'`), `Public Asset Detail missing ${interval}`);
  }
  hasAll(realtime, ['new URLSearchParams({ symbol, interval, limit: "240" })', '/api/market/klines']);
  hasAll(marketProxy, ['/market/klines', 'symbol', 'interval']);
  hasAll(marketController, ['@Get("klines")', 'MarketKlineQueryDto']);
});

test('A03 Asset Detail: canonical market state → chart → Spot/Binary navigation is wired', () => {
  hasAll(assetDetail, ['useMarketData()', 'useActiveInstrument()', '<RealtimeTradingChart', '/dashboard/spot?symbol=', '/dashboard/binary?symbol=', 'findAsset(']);
});

test('A04 Spot: Public command/readback + Nest/D1/outbox/realtime + Admin control are wired', () => {
  hasAll(spotPublic, ["api.post('/spot/order'", "api.get('/spot/orderbook'", "api.get('/spot/market-trades'", 'io(`${apiBaseUrl}/spot`']);
  hasAll(spotController, ['@Post("order")', '@Get("orderbook")', '@Get("market-trades")']);
  hasAll(spotService, ['this.d1.reserveSpotOrder', 'this.d1.getSpotOrder', 'emitOrderBookUpdate']);
  hasAll(d1, ['eventType: "SPOT_ORDER_RESERVED"', 'async reserveSpotOrder']);
  hasAll(adminProvider, ['/admin/spot/orders', '/admin/spot/pairs/maintenance']);
});

test('A05 Isolated Margin: Public ↔ Nest ↔ D1 ledger path + Admin risk config/readback are wired', () => {
  hasAll(marginApi, ['/spot/margin/quote', '/spot/margin/positions', '/spot/margin/positions/mark']);
  hasAll(spotPublic, ['openMarginPosition', 'listMarginPositions', 'getMarginQuote', 'closeMarginPosition']);
  hasAll(marginController, ['@Post("positions")', '@Get("positions")', '@Post("transfer")']);
  hasAll(marginService, ['this.d1', 'listMarginPositions']);
  hasAll(adminProvider, ['/admin/spot/margin/config']);
});

test('A06 Binary normal settlement: Public position/readback + D1/outbox/realtime + Admin config are wired', () => {
  hasAll(binaryPublic, ["api.post('/binary/position'", "api.get('/binary/positions/current')", "api.get('/binary/positions/history')", 'binary_position_update']);
  hasAll(binaryController, ['@Post("position")', '@Get("positions/current")', '@Get("positions/history")']);
  hasAll(binaryService, ['openPositionOnD1', 'emitPositionUpdate']);
  hasAll(d1, ['eventType: "BINARY_POSITION_OPENED"', 'listBinaryPositions']);
  hasAll(adminProvider, ['/admin/binary/config', '/admin/binary/positions']);
});

test('A07 Binary forced_win: governed directive reaches D1 settlement and Public recovery surface', () => {
  hasAll(sandboxScenario, ['forced_win', 'WIN']);
  hasAll(sandboxExecution, ['forced_win']);
  hasAll(binaryPublic, ["api.get('/binary/positions/history')", 'binary_position_update']);
  hasAll(adminController, ['@Post("sandbox/controls")', '@Post("sandbox/controls/:id/execute")']);
});

test('A08 Binary forced_loss: governed directive reaches D1 settlement and Public recovery surface', () => {
  hasAll(sandboxScenario, ['forced_loss', 'LOSS']);
  hasAll(sandboxExecution, ['forced_loss']);
  hasAll(binaryPublic, ["api.get('/binary/positions/history')", 'binary_position_update']);
  hasAll(adminController, ['@Post("sandbox/controls")', '@Post("sandbox/controls/:id/execute")']);
});

test('A09 Wallet Deposit: Public claim → Admin decision → D1 ledger/outbox → wallet/activity readback is wired', () => {
  hasAll(depositPublic, ['/financial/deposit-destinations', '/financial/deposit-proof-intents', '/financial/deposit-claims']);
  hasAll(financialController, ['@Post("deposit-claims")', '@Get("deposit-claims")']);
  hasAll(d1, ['async creditDepositClaim', 'eventType: "DEPOSIT_CREDITED"']);
  hasAll(adminProvider, ['/admin/deposits/', '/credit']);
  hasAll(walletPublic, walletReadback);
});

test('A10 Withdrawal: Public request → Admin decision → D1/outbox → Public/wallet readback is wired', () => {
  hasAll(withdrawPublic, ["api.post('/financial/withdrawals'"]);
  hasAll(financialController, ['@Post("withdrawals")', '@Get("withdrawals")']);
  hasAll(d1, ['eventType: "WITHDRAWAL_RESERVED"', 'eventType: "WITHDRAWAL_APPROVED"', 'eventType: "WITHDRAWAL_SETTLED"']);
  hasAll(adminProvider, ['/admin/withdrawals/']);
  hasAll(walletPublic, walletReadback);
});

test('A11 Transfer: Public command → D1 paired ledger/outbox → wallet activity recovery is wired', () => {
  hasAll(transferPublic, ["api.post('/financial/transfers'"]);
  hasAll(financialController, ['@Post("transfers")', '@Get("transfers")']);
  hasAll(financialService, ['async transfer(', 'this.d1.pairedTransfer']);
  hasAll(d1, ['eventType: "TRANSFER_COMPLETED"', 'async pairedTransfer']);
  hasAll(walletPublic, walletReadback);
});

test('A12 Convert: Public quote/accept → D1 atomic ledger/outbox → wallet recovery is wired', () => {
  hasAll(convertPublic, ['/financial/conversion/quote', '/financial/conversion/accept']);
  hasAll(financialController, ['@Post("conversion/quote")', '@Post("conversion/accept")']);
  hasAll(financialService, ['async createConversionQuote(', 'async acceptConversion(', 'this.d1.acceptConversion']);
  hasAll(d1, ['eventType: "CONVERSION_ACCEPTED"', 'async acceptConversion']);
  hasAll(walletPublic, walletReadback);
});

test('A13 Mining/Earn: Public lifecycle → D1 ledger/outbox/realtime → Admin/readback is wired', () => {
  hasAll(miningPublic, ['/mining/summary', '/mining/rewards/', 'api.post(subscribeEndpoint', 'api.post(path']);
  hasAll(miningController, ['@Post("subscribe")', '@Post("redeem")', '@Post("cancel")']);
  hasAll(miningService, ['d1.subscribeMining', "this.redis.publish('nexi:b7:mining'"]);
  hasAll(d1, ['eventType: "MINING_SUBSCRIPTION_OPENED"', 'eventType: "MINING_REWARD_POSTED"']);
  hasAll(adminProvider, ['/admin/mining-plans', '/admin/mining/subscriptions']);
});

test('A14 Loans: Public apply/repay → D1 ledger/outbox/realtime → Admin/readback is wired', () => {
  hasAll(loansPublic, ["api.get('/loans/plans')", "api.post('/loans/apply'", "api.post('/loans/repay'", '/loans/my/']);
  hasAll(loansController, ['@Post("apply")', '@Post("repay")']);
  hasAll(loansService, ['this.d1', "this.redis.publish('nexi:b7:loans'"]);
  hasAll(d1, ['eventType: "LOAN_APPLICATION_SUBMITTED"', 'eventType: "LOAN_APPROVED"', 'async repayLoan']);
  hasAll(adminProvider, ['/admin/loan-plans', '/admin/loans/applications']);
});

test('A21 Admin RBAC: route permissions are explicit and backed by canonical role authority', () => {
  hasAll(adminRbac, ['approvals.decide', 'withdrawals.approve', 'spot.edit', 'binary.settle']);
  hasAll(adminController, ['@RequireAdminPermission("approvals.decide")', '@RequireAdminPermission("withdrawals.approve")']);
});

test('A22 Admin governance/approval: independent decision → D1 audit → governed execution path is wired', () => {
  hasAll(adminProvider, ['/admin/governance/commands', 'approve', 'reject']);
  hasAll(adminController, ['@Post("governance/commands")', '@Post("governance/commands/:id/approve")', '@Post("governance/commands/:id/reject")']);
  hasAll(d1, ['async createGovernanceCommand', 'async decideGovernanceCommand', 'The requester cannot approve their own command', 'GOVERNANCE_COMMAND_REQUESTED', 'AdminGovernanceApproval']);
  hasAll(d1, ['An independently approved financial correction command is required', 'FINANCIAL_CORRECTION_EXECUTED']);
});

test('A23 Admin market controls: Admin mutations reach canonical backend/D1 market truth consumed by Public', () => {
  hasAll(adminProvider, ['/admin/market/assets/visibility', '/admin/market/networks/visibility', '/admin/market/feeds/status']);
  hasAll(adminController, ['@Post("market/assets/visibility")', '@Post("market/networks/visibility")', '@Post("market/feeds/status")']);
  hasAll(d1, ['CURRENCY_CONFIGURATION_UPDATED']);
  hasAll(assetDetail, ['useMarketData()', 'matchedItem?.provider']);
});

test('A24 Admin financial controls: governed correction reaches D1 ledger/audit/outbox and canonical readback', () => {
  hasAll(adminController, ['@Post("financial-corrections")', '@Get("ledger")', '@Get("wallets")']);
  hasAll(adminService, ['async applyFinancialCorrection']);
  hasAll(d1, ['async applyAdminFinancialCorrection', 'FINANCIAL_CORRECTION_EXECUTED', 'eventOutboxStatement']);
  hasAll(adminProvider, ['/admin/ledger', '/admin/wallets']);
});
