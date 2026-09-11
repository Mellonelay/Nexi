'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Bell, CheckCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react'
import { cn } from '../lib/cn'
import { io } from 'socket.io-client'
import api, { apiBaseUrl } from '../lib/api'
import { getAccessToken } from '../lib/auth-session'

type NotificationCategory = 'All' | 'Trading' | 'Wallet' | 'Account' | 'System'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'trade'
  sourceType: string
  category: Exclude<NotificationCategory, 'All'>
  title: string
  message: string
  time: string
  read: boolean
}

const CATEGORIES: NotificationCategory[] = ['All', 'Trading', 'Wallet', 'Account', 'System']

function categoryForType(type: string): Exclude<NotificationCategory, 'All'> {
  const value = type.toUpperCase()
  if (/(SPOT|ORDER|TRADE|MARGIN|BINARY|OPTION|POSITION|SETTLEMENT)/.test(value)) return 'Trading'
  if (/(DEPOSIT|WITHDRAW|TRANSFER|CONVERT|WALLET|BALANCE|LEDGER)/.test(value)) return 'Wallet'
  if (/(KYC|SESSION|PROFILE|AUTH|LOGIN|SECURITY|VERIF|REFERRAL|VIP)/.test(value)) return 'Account'
  return 'System'
}

const TYPE_CONFIG = {
  success: { icon: CheckCircle, color: '#22D3A6', bg: 'rgba(34,211,166,0.1)' },
  warning: { icon: AlertTriangle, color: '#FB9212', bg: 'rgba(251,146,18,0.1)' },
  info:    { icon: Info,         color: '#48C0CC', bg: 'rgba(72,192,204,0.1)' },
  trade:   { icon: TrendingUp,   color: '#A797E8', bg: 'rgba(167,151,232,0.1)' },
}

interface NotificationsPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const shouldReduceMotion = useReducedMotion()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const [category, setCategory] = useState<NotificationCategory>('All')
  const loadRequestRef = useRef(0)
  const readRequestIds = useRef(new Set<string>())
  const unreadCount = notifications.filter(n => !n.read).length
  const visibleNotifications = category === 'All'
    ? notifications
    : notifications.filter((notification) => notification.category === category)

  const loadNotifications = useCallback(async () => {
    const requestId = ++loadRequestRef.current
    setLoading(true)
    setFailed(false)
    try {
      const { data } = await api.get('/communications/notifications', { params: { page: 1, limit: 25 } })
      if (requestId !== loadRequestRef.current) return
      const rows = Array.isArray(data) ? data : Array.isArray(data?.notifications) ? data.notifications : []
      setNotifications(rows.map((item: Record<string, unknown>) => {
        const sourceType = String(item.type ?? 'SYSTEM')
        return {
          id: String(item.id ?? ''),
          type: item.type === 'success' || item.type === 'warning' || item.type === 'trade' ? item.type : 'info',
          sourceType,
          category: categoryForType(sourceType),
          title: String(item.title ?? 'Notification'),
          message: String(item.body ?? ''),
          time: item.createdAt ? new Date(String(item.createdAt)).toLocaleString() : '—',
          read: Boolean(item.readAt),
        }
      }))
    } catch {
      if (requestId !== loadRequestRef.current) return
      setNotifications([])
      setFailed(true)
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      loadRequestRef.current += 1
      return
    }
    void loadNotifications()
  }, [loadNotifications, open, retryNonce])

  useEffect(() => {
    if (!open || typeof window === 'undefined') return
    const token = getAccessToken()
    if (!token) return
    const socket = io(`${apiBaseUrl}/communications`, {
      auth: { token },
      transports: ['polling', 'websocket'],
      tryAllTransports: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      reconnectionDelayMax: 8_000,
    })
    let connectedOnce = false
    const handleConnect = () => {
      const recovered = connectedOnce
      connectedOnce = true
      if (recovered) void loadNotifications()
    }
    const handleEvent = (message: unknown) => {
      if (!message || typeof message !== 'object') return
      const event = (message as { event?: unknown }).event
      if (!event || typeof event !== 'object') return
      const type = String((event as { type?: unknown }).type ?? '')
      if (type === 'NOTIFICATION_SENT' || type === 'NOTIFICATION_READ') void loadNotifications()
    }
    socket.on('connect', handleConnect)
    socket.on('communications.event', handleEvent)
    return () => {
      socket.off('connect', handleConnect)
      socket.off('communications.event', handleEvent)
      socket.disconnect()
    }
  }, [loadNotifications, open])

  const markRead = async (id: string) => {
    if (readRequestIds.current.has(id)) return
    readRequestIds.current.add(id)
    try {
      await api.post(`/communications/notifications/${id}/read`)
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item))
    } catch { /* keep the authoritative unread state when the command fails */ }
    finally { readRequestIds.current.delete(id) }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-[70] bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
            onClick={onClose}
          />

          {/* Panel — slides in from right */}
          <motion.aside
            id="nexi-notifications-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            className="fixed right-0 top-0 bottom-0 z-[71] w-[320px] max-w-[90vw] nexi-drawer flex flex-col"
            initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
            animate={{ x: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
            transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--nexi-border-subtle)]">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#6d41ff]" />
                <span className="font-semibold text-[#F8F6FF]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#6d41ff] text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8299] hover:text-[#F8F6FF] hover:bg-white/10 transition-colors"
                aria-label="Close notifications"
              >
                <X size={16} />
              </button>
            </div>

            <div className="border-b border-[var(--nexi-border-subtle)] px-3 py-2">
              <div className="nexi-scroll-rail flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Notification categories">
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={category === item}
                    onClick={() => setCategory(item)}
                    className={cn(
                      'min-h-9 shrink-0 rounded-lg border px-3 text-xs font-semibold transition-colors',
                      category === item
                        ? 'border-[#8B5CF6] bg-[#2A1742] text-white'
                        : 'border-[#2B2037] bg-[#171022] text-[#A99DB8] hover:text-white',
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto py-2">
              {loading && <p className="px-4 py-6 text-sm text-[#8C8299]">Loading notifications…</p>}
              {!loading && failed && <div className="px-4 py-6 text-sm text-[#8C8299]"><p>Notifications unavailable.</p><button type="button" onClick={() => setRetryNonce((value) => value + 1)} className="mt-3 min-h-11 font-semibold text-[#A995FF] underline-offset-4 hover:underline">Retry</button></div>}
              {!loading && !failed && visibleNotifications.length === 0 && <p className="px-4 py-6 text-sm text-[#8C8299]">{notifications.length === 0 ? 'No notifications available.' : `No ${category.toLowerCase()} notifications.`}</p>}
              {!loading && !failed && visibleNotifications.map(notif => {
                const cfg = TYPE_CONFIG[notif.type]
                const Icon = cfg.icon
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => { if (!notif.read) void markRead(notif.id) }}
                    className={cn(
                      'flex gap-3 px-4 py-3 border-b border-[#2B2037]/60 last:border-0 transition-colors',
                      !notif.read && 'bg-[#6d41ff]/5'
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: cfg.bg }}
                    >
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[#F8F6FF] leading-snug">{notif.title}</p>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6d41ff] flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-[#8C8299] leading-5 mt-0.5">{notif.message}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#55546A]"><span>{notif.time}</span><span className="uppercase tracking-[0.08em]">{notif.sourceType}</span></div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[var(--nexi-border-subtle)]">
              <p className="text-center text-[11px] leading-5 text-[#8C8299]" role="status">
                Mark all as read is unavailable until the backend exposes a bulk read contract.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
