'use client'

import { useMemo } from 'react'
import { cn } from '../lib/cn'

interface OrderBookEntry {
  price: number
  size: number
  total: number
}

interface OrderBookProps {
  symbol?: string
  currentPrice?: number
  className?: string
}

// Generate deterministic mock order book
function generateOrderBook(midPrice: number, levels = 10) {
  const spread = midPrice * 0.0002
  const asks: OrderBookEntry[] = []
  const bids: OrderBookEntry[] = []

  let askTotal = 0
  let bidTotal = 0

  for (let i = 0; i < levels; i++) {
    const askPrice = midPrice + spread + i * midPrice * 0.0001 + Math.random() * midPrice * 0.00005
    const askSize = 0.1 + Math.random() * 2.5
    askTotal += askSize
    asks.push({ price: askPrice, size: askSize, total: askTotal })

    const bidPrice = midPrice - spread - i * midPrice * 0.0001 - Math.random() * midPrice * 0.00005
    const bidSize = 0.1 + Math.random() * 2.5
    bidTotal += bidSize
    bids.push({ price: bidPrice, size: bidSize, total: bidTotal })
  }

  return { asks: asks.reverse(), bids, maxTotal: Math.max(askTotal, bidTotal) }
}

function formatPrice(p: number) {
  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatSize(s: number) {
  return s.toFixed(4)
}

export function OrderBook({ symbol = 'BTC', currentPrice = 67420, className }: OrderBookProps) {
  const { asks, bids, maxTotal } = useMemo(
    () => generateOrderBook(currentPrice),
    [currentPrice]
  )

  const spread = asks[asks.length - 1].price - bids[0].price
  const spreadPct = ((spread / currentPrice) * 100).toFixed(3)

  return (
    <div className={cn('nexi-execution-surface rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2B2037]">
        <span className="text-xs font-semibold text-[#F8F6FF]">Order Book</span>
        <span className="text-[10px] text-[#55546A]">Mock · UNAVAILABLE</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1.5 border-b border-[#2B2037]">
        <span className="text-[10px] font-semibold text-[#55546A]">Price (USDT)</span>
        <span className="text-[10px] font-semibold text-[#55546A] text-right">Size ({symbol})</span>
        <span className="text-[10px] font-semibold text-[#55546A] text-right">Total</span>
      </div>

      {/* Asks (sell orders) — shown top, red */}
      <div className="relative">
        {asks.map((ask, i) => {
          const depthPct = (ask.total / maxTotal) * 100
          return (
            <div key={i} className="relative grid grid-cols-3 px-3 py-[3px] hover:bg-[#FF5C7C]/5 transition-colors cursor-pointer">
              {/* Depth bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#FF5C7C]/8"
                style={{ width: `${depthPct}%` }}
              />
              <span className="relative font-mono text-[11px] text-[#FF5C7C]">{formatPrice(ask.price)}</span>
              <span className="relative font-mono text-[11px] text-[#C3BBD0] text-right">{formatSize(ask.size)}</span>
              <span className="relative font-mono text-[11px] text-[#55546A] text-right">{formatSize(ask.total)}</span>
            </div>
          )
        })}
      </div>

      {/* Spread */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0B0711] border-y border-[#2B2037]">
        <span className="font-mono text-sm font-bold text-[#48C0CC]">${formatPrice(currentPrice)}</span>
        <span className="text-[10px] text-[#55546A]">Spread {formatPrice(spread)} ({spreadPct}%)</span>
      </div>

      {/* Bids (buy orders) — shown bottom, green */}
      <div className="relative">
        {bids.map((bid, i) => {
          const depthPct = (bid.total / maxTotal) * 100
          return (
            <div key={i} className="relative grid grid-cols-3 px-3 py-[3px] hover:bg-[#22D3A6]/5 transition-colors cursor-pointer">
              {/* Depth bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#22D3A6]/8"
                style={{ width: `${depthPct}%` }}
              />
              <span className="relative font-mono text-[11px] text-[#22D3A6]">{formatPrice(bid.price)}</span>
              <span className="relative font-mono text-[11px] text-[#C3BBD0] text-right">{formatSize(bid.size)}</span>
              <span className="relative font-mono text-[11px] text-[#55546A] text-right">{formatSize(bid.total)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}