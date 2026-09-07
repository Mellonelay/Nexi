import { cn } from '../lib/cn'

interface OrderBookProps {
  symbol?: string
  currentPrice?: number
  className?: string
}

function formatPrice(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Presentation shell only. Authoritative depth rows are rendered by the Spot surface
 * after they are read from the backend. This component must never synthesize bids,
 * asks, trades, or availability labels.
 */
export function OrderBook({ symbol = '', currentPrice, className }: OrderBookProps) {
  return (
    <div className={cn('nexi-execution-surface overflow-hidden rounded-xl', className)}>
      <div className="flex items-center justify-between border-b border-[#2B2037] px-3 py-2">
        <span className="text-xs font-semibold text-[#F8F6FF]">Order Book</span>
        {symbol ? <span className="text-[10px] text-[#55546A]">{symbol}</span> : null}
      </div>
      {currentPrice !== undefined && Number.isFinite(currentPrice) ? (
        <div className="border-b border-[#2B2037] px-3 py-2 font-mono text-sm font-bold text-[#48C0CC]">
          ${formatPrice(currentPrice)}
        </div>
      ) : null}
      <div className="flex min-h-40 items-center justify-center px-4 py-8 text-center text-sm text-[#8C8299]">
        No order-book data yet.
      </div>
    </div>
  )
}
