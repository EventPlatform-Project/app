import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellRing,
  UserPlus,
  UserCog,
  UserMinus,
  Search,
  CheckCheck,
  Trash2,
  RefreshCw,
  Circle,
  Radio,
  X,
  Filter,
} from 'lucide-react'
import { Card, CardBody, Input, Badge } from '@/components/ui'
import { useNotifications, formatTimeAgo, type LiveNotification } from '@/hooks/useNotifications'
import { cn } from '@/utils/cn'

// ─── Type meta table ─────────────────────────────────────────────────────────

interface TypeMeta {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string // text
  bg: string    // background tint
}

const TYPE_META: Record<string, TypeMeta> = {
  USER_CREATED: {
    label: 'New user',
    icon: UserPlus,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  USER_UPDATED: {
    label: 'User updated',
    icon: UserCog,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  USER_DELETED: {
    label: 'User removed',
    icon: UserMinus,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
}

const FALLBACK_META: TypeMeta = {
  label: 'Event',
  icon: Bell,
  color: 'text-slate-300',
  bg: 'bg-slate-500/10',
}

function metaFor(type: string): TypeMeta {
  return TYPE_META[type] ?? FALLBACK_META
}

// ─── Filter tabs ─────────────────────────────────────────────────────────────

type TabId = 'all' | 'unread' | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED'

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'USER_CREATED', label: 'New users' },
  { id: 'USER_UPDATED', label: 'Updates' },
  { id: 'USER_DELETED', label: 'Removals' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const {
    connected,
    notifications,
    unreadCount,
    refresh,
    markRead,
    markAllRead,
    clear,
  } = useNotifications()

  const [tab, setTab] = useState<TabId>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<LiveNotification | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return notifications.filter(n => {
      // Tab filter
      if (tab === 'unread' && n.read) return false
      if (tab !== 'all' && tab !== 'unread' && n.type !== tab) return false

      // Search filter
      if (q) {
        const haystack = [
          n.message,
          n.username,
          n.email,
          n.firstName,
          n.lastName,
          n.role,
          n.type,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [notifications, tab, search])

  const counts = useMemo(
    () => ({
      total: notifications.length,
      unread: unreadCount,
      created: notifications.filter(n => n.type === 'USER_CREATED').length,
      updated: notifications.filter(n => n.type === 'USER_UPDATED').length,
      deleted: notifications.filter(n => n.type === 'USER_DELETED').length,
    }),
    [notifications, unreadCount],
  )

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return
    setBusy(true)
    try {
      await markAllRead()
    } finally {
      setBusy(false)
    }
  }

  async function handleClearAll() {
    if (notifications.length === 0) return
    if (!confirm('Delete all notifications? This cannot be undone.')) return
    setBusy(true)
    try {
      await clear()
      setSelected(null)
    } finally {
      setBusy(false)
    }
  }

  async function handleRowClick(n: LiveNotification) {
    setSelected(n)
    if (!n.read) {
      await markRead(n.id)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orbit-primary/10 text-orbit-primary flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Notifications</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Real-time events pushed via RabbitMQ &amp; SSE
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full',
              connected
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-slate-500/10 text-slate-400',
            )}
            title={connected ? 'Connected to live stream' : 'Reconnecting…'}
          >
            <Radio className={cn('w-3 h-3', connected && 'animate-pulse')} />
            {connected ? 'Live' : 'Offline'}
          </span>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>

          <button
            onClick={handleMarkAllRead}
            disabled={busy || unreadCount === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Mark all as read"
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>

          <button
            onClick={handleClearAll}
            disabled={busy || notifications.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Delete all"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear all</span>
          </button>
        </div>
      </motion.div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Total" value={counts.total} tint="bg-slate-500/10" text="text-slate-200" />
        <StatTile label="Unread" value={counts.unread} tint="bg-orbit-primary/10" text="text-orbit-primary-light" />
        <StatTile label="New users" value={counts.created} tint="bg-emerald-500/10" text="text-emerald-400" />
        <StatTile
          label="Updates"
          value={counts.updated + counts.deleted}
          tint="bg-blue-500/10"
          text="text-blue-400"
        />
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <Input
            prefix={<Search className="w-4 h-4" />}
            placeholder="Search by name, email, message…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0 mr-1" />
          {TABS.map(t => {
            const active = tab === t.id
            const count =
              t.id === 'all' ? counts.total :
              t.id === 'unread' ? counts.unread :
              t.id === 'USER_CREATED' ? counts.created :
              t.id === 'USER_UPDATED' ? counts.updated :
              t.id === 'USER_DELETED' ? counts.deleted : 0
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-orbit-primary/15 text-orbit-primary-light'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                )}
              >
                {t.label}
                <span
                  className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                    active
                      ? 'bg-orbit-primary/25 text-orbit-primary-light'
                      : 'bg-white/5 text-slate-500',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────────────── */}
      <Card>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Bell className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">
                {notifications.length === 0
                  ? 'No notifications yet — they will show up here in real time.'
                  : 'No notifications match your filter.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-orbit-border">
              <AnimatePresence initial={false}>
                {filtered.map(n => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    onClick={() => handleRowClick(n)}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ── Details drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <DetailsDrawer
            notification={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  tint,
  text,
}: {
  label: string
  value: number
  tint: string
  text: string
}) {
  return (
    <div className="rounded-xl border border-orbit-border bg-orbit-surface p-4">
      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={cn('w-2 h-2 rounded-full', tint)} />
        <span className={cn('text-2xl font-bold', text)}>{value}</span>
      </div>
    </div>
  )
}

function NotificationRow({
  n,
  onClick,
}: {
  n: LiveNotification
  onClick: () => void
}) {
  const meta = metaFor(n.type)
  const Icon = meta.icon
  const displayName =
    [n.firstName, n.lastName].filter(Boolean).join(' ') ||
    n.username ||
    n.email ||
    'Unknown'

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-start gap-4 px-4 py-4 text-left hover:bg-white/5 transition-colors',
          !n.read && 'bg-orbit-primary/[0.04]',
        )}
      >
        {/* Unread dot */}
        <div className="flex-shrink-0 pt-1.5">
          {!n.read ? (
            <Circle className="w-2 h-2 fill-orbit-primary text-orbit-primary" />
          ) : (
            <div className="w-2 h-2" />
          )}
        </div>

        {/* Icon */}
        <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', meta.bg)}>
          <Icon className={cn('w-5 h-5', meta.color)} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={cn(
                  'text-sm truncate',
                  n.read ? 'text-slate-300' : 'text-slate-100 font-medium',
                )}
              >
                {n.message}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {displayName}
                {n.email && <span className="text-slate-600"> · {n.email}</span>}
              </p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                {formatTimeAgo(n.createdAt)}
              </span>
              <Badge variant={badgeVariantFor(n.type)}>{meta.label}</Badge>
            </div>
          </div>
        </div>
      </button>
    </motion.li>
  )
}

function badgeVariantFor(type: string): 'success' | 'info' | 'danger' | 'neutral' {
  if (type === 'USER_CREATED') return 'success'
  if (type === 'USER_UPDATED') return 'info'
  if (type === 'USER_DELETED') return 'danger'
  return 'neutral'
}

function DetailsDrawer({
  notification,
  onClose,
}: {
  notification: LiveNotification
  onClose: () => void
}) {
  const meta = metaFor(notification.type)
  const Icon = meta.icon
  const displayName =
    [notification.firstName, notification.lastName].filter(Boolean).join(' ') ||
    notification.username ||
    '—'

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
      <motion.aside
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.2 }}
        className="fixed right-0 top-0 h-screen w-full sm:w-[420px] bg-orbit-surface2 border-l border-orbit-border z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-orbit-border sticky top-0 bg-orbit-surface2/95 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', meta.bg)}>
              <Icon className={cn('w-4.5 h-4.5', meta.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">{meta.label}</p>
              <p className="text-[11px] text-slate-500">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Message
            </p>
            <p className="text-sm text-slate-200 leading-relaxed">{notification.message}</p>
          </div>

          <DetailField label="User" value={displayName} />
          <DetailField label="Username" value={notification.username} mono />
          <DetailField label="Email" value={notification.email} />
          <DetailField label="Role" value={notification.role} />
          <DetailField label="User ID" value={notification.userId} mono small />
          <DetailField label="Notification ID" value={notification.id} mono small />
          <DetailField label="Type" value={notification.type} mono />

          {notification.payload && Object.keys(notification.payload).length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Raw payload
              </p>
              <pre className="text-xs text-slate-300 bg-orbit-surface border border-orbit-border rounded-lg p-3 overflow-x-auto">
                {JSON.stringify(notification.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  )
}

function DetailField({
  label,
  value,
  mono = false,
  small = false,
}: {
  label: string
  value: string | null | undefined
  mono?: boolean
  small?: boolean
}) {
  if (value == null || value === '') return null
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p
        className={cn(
          'text-slate-200 break-all',
          small ? 'text-xs' : 'text-sm',
          mono && 'font-mono',
        )}
      >
        {value}
      </p>
    </div>
  )
}
