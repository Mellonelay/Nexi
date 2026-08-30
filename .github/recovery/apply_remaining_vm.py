from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        if new in text:
            return text
        raise SystemExit(f"recovery marker missing: {label}")
    return text.replace(old, new, 1)


# Prisma top-of-book schema fields recovered from the VM.
p = Path("backend/prisma/schema.prisma")
s = p.read_text()
s = replace_once(
    s,
    "  low24h     Decimal?   @db.Decimal(38, 18)\n  observedAt DateTime",
    "  low24h     Decimal?   @db.Decimal(38, 18)\n  bid        Decimal?   @db.Decimal(38, 18)\n  ask        Decimal?   @db.Decimal(38, 18)\n  spread     Decimal?   @db.Decimal(38, 18)\n  observedAt DateTime",
    "MarketQuoteSnapshot top-of-book",
)
s = replace_once(
    s,
    "  low24h     Decimal?         @db.Decimal(38, 18)\n  state      MarketQuoteState",
    "  low24h     Decimal?         @db.Decimal(38, 18)\n  bid        Decimal?         @db.Decimal(38, 18)\n  ask        Decimal?         @db.Decimal(38, 18)\n  spread     Decimal?         @db.Decimal(38, 18)\n  state      MarketQuoteState",
    "MarketQuoteLatest top-of-book",
)
p.write_text(s)


# Public six-digit NEXI transfer contract recovered from the VM.
p = Path("backend/src/financial/financial-operations.dto.ts")
s = p.read_text()
s = replace_once(
    s,
    "import { IsString, Length, Matches } from 'class-validator';",
    "import { IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';",
    "financial DTO imports",
)
s = replace_once(
    s,
    "  @IsString() @Length(1, 128) toUserId!: string;",
    "  @IsOptional() @IsString() @Length(1, 128) toUserId?: string;\n  @IsOptional() @IsInt() @Min(100000) @Max(999999) toUserCode?: number;",
    "six-digit recipient DTO",
)
p.write_text(s)

p = Path("backend/src/financial/financial-operations.service.ts")
s = p.read_text()
s = replace_once(
    s,
    "export interface TransferInput { toUserId: string; asset: string; amount: string; idempotencyKey: string; }",
    "export interface TransferInput { toUserId?: string; toUserCode?: number; asset: string; amount: string; idempotencyKey: string; }",
    "TransferInput",
)
old = """  async transfer(userId: string, input: TransferInput) {
    this.assertIdempotencyKey(input.idempotencyKey);
    if (userId === input.toUserId) throw new BadRequestException('Internal transfer accounts must differ');
    const amount = assertPositiveDecimal(input.amount);"""
new = """  async transfer(userId: string, input: TransferInput) {
    this.assertIdempotencyKey(input.idempotencyKey);
    let toUserId = input.toUserId?.trim();
    if (!toUserId && input.toUserCode !== undefined) {
      const recipient = this.d1?.isEnabled()
        ? await this.d1.getUserByUserCode(input.toUserCode)
        : await this.prisma.user.findUnique({ where: { userCode: input.toUserCode }, select: { id: true } });
      toUserId = recipient?.id ? String(recipient.id) : undefined;
    }
    if (!toUserId) throw new NotFoundException('Transfer recipient not found');
    if (userId === toUserId) throw new BadRequestException('Internal transfer accounts must differ');
    const amount = assertPositiveDecimal(input.amount);"""
s = replace_once(s, old, new, "transfer recipient resolution")
start = s.find("  async transfer(userId: string, input: TransferInput) {")
end = s.find("  async createConversionQuote", start)
if start < 0 or end <= start:
    raise SystemExit("transfer method bounds missing")
chunk = s[start:end].replace("input.toUserId", "toUserId")
chunk = chunk.replace("let toUserId = toUserId?.trim();", "let toUserId = input.toUserId?.trim();")
s = s[:start] + chunk + s[end:]
p.write_text(s)


# D1 public user-code lookup required by transfer resolution.
p = Path("backend/src/d1/d1-financial-command.gateway.ts")
s = p.read_text()
if "async getUserByUserCode(" not in s:
    marker = "  async getUserById(userId: string): Promise<Record<string, unknown> | null> {"
    method = '''  async getUserByUserCode(userCode: number): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id","userCode","email","displayName","role" FROM "User" WHERE "userCode"=? LIMIT 1`,
      [userCode],
    );
    return result.results[0] ?? null;
  }

'''
    if marker not in s:
        raise SystemExit("D1 getUserById marker missing")
    s = s.replace(marker, method + marker, 1)
p.write_text(s)


# Canonical Wallet page splice recovered from the VM.
p = Path("cloudflare-container-bootstrap/dexi-frontend/app/dashboard/wallet/page.tsx")
s = p.read_text()
s = replace_once(
    s,
    "import { actionCanSubmit, authoritativeValue, resolveEndpointTemplate } from '../../lib/product-states';",
    "import { authoritativeValue } from '../../lib/product-states';",
    "wallet product-state imports",
)
s = replace_once(
    s,
    "import WithdrawModal from './components/WithdrawModal';\nimport { DataStatePanel, Field, inputClass, Metric, PageShell, Panel, PanelHeading, PrimaryButton, SecondaryButton, StatusBadge, TabButton } from './components/ProductPrimitives';",
    "import WithdrawModal from './components/WithdrawModal';\nimport ConvertModal from './components/ConvertModal';\nimport { DataStatePanel, Metric, PageShell, Panel, PanelHeading, SecondaryButton, StatusBadge, TabButton } from './components/ProductPrimitives';",
    "wallet ConvertModal import",
)
s = replace_once(
    s,
    "  const [amount, setAmount] = useState('');\n\n  const readEndpoint = userId ? resolveEndpointTemplate(process.env.NEXT_PUBLIC_WALLET_READ_ENDPOINT || '/wallet/{userId}', { userId }) : null;\n  const activityEndpoint = userId ? resolveEndpointTemplate(process.env.NEXT_PUBLIC_WALLET_ACTIVITY_ENDPOINT || '/wallet/activity', { userId }) : null;\n  const depositEndpoint = process.env.NEXT_PUBLIC_WALLET_DEPOSIT_ENDPOINT;\n  const withdrawEndpoint = process.env.NEXT_PUBLIC_WALLET_WITHDRAW_ENDPOINT;\n  const convertEndpoint = process.env.NEXT_PUBLIC_CONVERSION_SUBMIT_ENDPOINT;\n  const actionEndpoint = action === 'Deposit' ? depositEndpoint : action === 'Withdraw' ? withdrawEndpoint : action === 'Convert' ? convertEndpoint : undefined;",
    "  const readEndpoint = userId ? '/wallet/me' : null;\n  const activityEndpoint = userId ? '/wallet/activity' : null;",
    "wallet canonical endpoints",
)
s = replace_once(
    s,
    "  const validAction = Boolean(currency.trim() && Number.isFinite(Number(amount)) && Number(amount) > 0);\n  const canSubmit = actionCanSubmit({ authenticated, valid: validAction, backendAvailable: state === 'LIVE' && Boolean(actionEndpoint) });\n",
    "",
    "wallet legacy action gate",
)
a = s.find("  const submitAction = async (event: React.FormEvent) => {")
b = s.find("  const accountSummary", a)
if a < 0 or b <= a:
    raise SystemExit("wallet legacy submit handler bounds missing")
s = s[:a] + s[b:]
s = replace_once(
    s,
    "const enabled = item === 'Transfer' || Boolean(item === 'Deposit' ? depositEndpoint : item === 'Withdraw' ? withdrawEndpoint : convertEndpoint);",
    "const enabled = authenticated && state === 'LIVE';",
    "wallet action enablement",
)
a = s.find("{action === 'Convert' && <form onSubmit={submitAction}")
if a >= 0:
    b = s.find("</form>}", a)
    if b <= a:
        raise SystemExit("legacy inline conversion form end missing")
    s = s[:a] + s[b + 8:]
s = replace_once(
    s,
    "<DepositModal isOpen={action === 'Deposit'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} />",
    "<DepositModal isOpen={action === 'Deposit'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />",
    "DepositModal wiring",
)
s = replace_once(
    s,
    "<WithdrawModal isOpen={action === 'Withdraw'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onWithdraw={submitWithdraw} />",
    "<WithdrawModal isOpen={action === 'Withdraw'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />",
    "WithdrawModal wiring",
)
s = replace_once(
    s,
    "<TransferModal isOpen={action === 'Transfer'} onClose={() => setAction(null)} />",
    "<TransferModal isOpen={action === 'Transfer'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />\n      <ConvertModal isOpen={action === 'Convert'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onCompleted={loadWallet} />",
    "Transfer/Convert modal wiring",
)
p.write_text(s)


# Exact behavior of recovered ConvertModal.
p = Path("cloudflare-container-bootstrap/dexi-frontend/app/dashboard/wallet/components/ConvertModal.tsx")
p.write_text("""'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Array<{ symbol: string }>;
  selectedCurrency: string;
  onCompleted?: () => void | Promise<void>;
}

type Quote = { id: string; fromAsset: string; toAsset: string; inputAmount: string; outputAmount: string; rate: string; expiresAt: string };

export default function ConvertModal({ isOpen, onClose, currencies, selectedCurrency, onCompleted }: ConvertModalProps) {
  const symbols = currencies.map((item) => item.symbol);
  const [fromAsset, setFromAsset] = useState(selectedCurrency || symbols[0] || 'USDT');
  const [toAsset, setToAsset] = useState(symbols.find((item) => item !== selectedCurrency) || 'USDT');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);

  const requestQuote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (fromAsset === toAsset || !amount || Number(amount) <= 0) return;
    setBusy(true);
    try {
      const response = await api.post<{ quote: Quote }>('/financial/conversion/quote', { fromAsset, toAsset, amount, quoteKey: `conversion-quote:${crypto.randomUUID()}` });
      setQuote(response.data.quote);
    } catch { toast.error('An authoritative conversion rate is not available for this pair.'); }
    finally { setBusy(false); }
  };

  const accept = async () => {
    if (!quote) return;
    setBusy(true);
    try {
      await api.post('/financial/conversion/accept', { quoteId: quote.id, acceptanceKey: `conversion-accept:${crypto.randomUUID()}` });
      toast.success('Conversion completed.');
      setQuote(null);
      await onCompleted?.();
      onClose();
    } catch { toast.error('This conversion could not be accepted.'); }
    finally { setBusy(false); }
  };

  if (!isOpen) return null;
  return <AnimatePresence><div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.button type="button" aria-label="Close conversion dialog" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm"/><motion.section role="dialog" aria-modal="true" aria-labelledby="convert-title" initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}} className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-300/20 bg-[#121022] shadow-2xl"><div className="flex items-center justify-between border-b border-violet-300/10 p-6"><h2 id="convert-title" className="text-xl font-bold text-white">Convert</h2><button type="button" onClick={onClose} aria-label="Close conversion dialog" className="inline-flex h-11 w-11 items-center justify-center text-[#C3BBD0]"><X size={22}/></button></div>{quote ? <div className="space-y-4 p-6"><div className="rounded-xl border border-[#2B2037] bg-[#171022] p-4"><p className="text-sm text-[#C3BBD0]">{quote.inputAmount} {quote.fromAsset} → <strong className="text-white">{quote.outputAmount} {quote.toAsset}</strong></p><p className="mt-2 text-xs text-[#8C8299]">Rate {quote.rate} · expires {new Date(quote.expiresAt).toLocaleTimeString()}</p></div><button type="button" disabled={busy} onClick={()=>void accept()} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy?'Converting…':'Accept quote'}</button><button type="button" onClick={()=>setQuote(null)} className="min-h-11 w-full rounded-xl border border-[#2B2037] text-[#C3BBD0]">Request another quote</button></div> : <form onSubmit={requestQuote} className="space-y-4 p-6"><label className="block text-xs text-[#C3BBD0]">From<select className="nexi-input mt-1 w-full" value={fromAsset} onChange={(e)=>setFromAsset(e.target.value)}>{symbols.map((s)=><option key={s}>{s}</option>)}</select></label><label className="block text-xs text-[#C3BBD0]">To<select className="nexi-input mt-1 w-full" value={toAsset} onChange={(e)=>setToAsset(e.target.value)}>{symbols.map((s)=><option key={s}>{s}</option>)}</select></label><label className="block text-xs text-[#C3BBD0]">Amount<input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(e)=>setAmount(e.target.value)} required/></label><button type="submit" disabled={busy||fromAsset===toAsset} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy?'Quoting…':'Get authoritative quote'}</button></form>}</motion.section></div></AnimatePresence>;
}
""")
