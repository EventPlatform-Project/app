import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { notificationService } from '@/services/notificationService'

/**
 * Live notifications pushed by the notification-service (Node.js) over SSE.
 * The stream is fed by RabbitMQ messages published by users-service whenever
 * a user event (created / updated / deleted) occurs.
 *
 * Contract with the backend (`src/models/Notification.js` on the server):
 *   { id, type, message, userId, username, email, firstName, lastName,
 *     role, read, createdAt, payload }
 */

export interface LiveNotification {
  id: string
  type: string
  message: string
  userId: string | null
  username: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  role: string | null
  read: boolean
  createdAt: string
  payload?: Record<string, unknown>
}

interface NotificationsContextValue {
  connected: boolean
  notifications: LiveNotification[]
  unreadCount: number
  toast: LiveNotification | null
  refresh: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  clear: () => Promise<void>
  removeLocal: (id: string) => void
  dismissToast: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

const GATEWAY_URL =
  (import.meta.env.VITE_API_GATEWAY_URL as string | undefined) ??
  'http://localhost:8888'

const STREAM_URL = `${GATEWAY_URL.replace(/\/+$/, '')}/api/notifications/stream`

const MAX_KEEP = 100
const TOAST_MS = 5000
const RECONNECT_MS = 5000

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<LiveNotification[]>([])
  const [connected, setConnected] = useState(false)
  const [toast, setToast] = useState<LiveNotification | null>(null)

  const esRef = useRef<EventSource | null>(null)
  const reconnectRef = useRef<number | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  // ---- Load recent history from REST (Mongo-persisted) --------------------
  const refresh = useCallback(async () => {
    try {
      const items = await notificationService.list({ limit: MAX_KEEP })
      setNotifications(items)
    } catch {
      /* notification service may be down — silently ignore */
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // ---- Open the SSE stream (auto-reconnect) ------------------------------
  const openStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }

    const es = new EventSource(STREAM_URL)
    esRef.current = es

    // Backend sends `event: hello` right after connect
    es.addEventListener('hello', () => setConnected(true))
    es.onopen = () => setConnected(true)

    es.addEventListener('notification', (evt: MessageEvent<string>) => {
      try {
        const raw = JSON.parse(evt.data) as LiveNotification
        // New live events are unread by default
        const n: LiveNotification = { ...raw, read: false }
        setNotifications(prev => {
          // Dedupe by id in case of reconnect replays
          const filtered = prev.filter(x => x.id !== n.id)
          return [n, ...filtered].slice(0, MAX_KEEP)
        })
        setToast(n)
      } catch (err) {
        console.warn('[notifications] failed to parse SSE payload', err)
      }
    })

    es.onerror = () => {
      setConnected(false)
      es.close()
      esRef.current = null
      if (reconnectRef.current == null) {
        reconnectRef.current = window.setTimeout(() => {
          reconnectRef.current = null
          openStream()
        }, RECONNECT_MS)
      }
    }
  }, [])

  useEffect(() => {
    openStream()
    return () => {
      if (esRef.current) esRef.current.close()
      esRef.current = null
      if (reconnectRef.current != null) {
        clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
    }
  }, [openStream])

  // ---- Auto-dismiss the toast --------------------------------------------
  useEffect(() => {
    if (toastTimerRef.current != null) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    if (toast) {
      toastTimerRef.current = window.setTimeout(() => setToast(null), TOAST_MS)
    }
    return () => {
      if (toastTimerRef.current != null) {
        clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
    }
  }, [toast])

  // ---- Actions (persisted server-side) -----------------------------------
  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    try {
      await notificationService.markRead(id)
    } catch {
      // Revert on failure
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: false } : n)))
    }
  }, [])

  const markAllRead = useCallback(async () => {
    const previous = notifications
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await notificationService.markAllRead()
    } catch {
      setNotifications(previous)
    }
  }, [notifications])

  const clear = useCallback(async () => {
    const previous = notifications
    setNotifications([])
    try {
      await notificationService.clearAll()
    } catch {
      setNotifications(previous)
    }
  }, [notifications])

  const removeLocal = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const unreadCount = useMemo(
    () => notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0),
    [notifications],
  )

  const value = useMemo<NotificationsContextValue>(
    () => ({
      connected,
      notifications,
      unreadCount,
      toast,
      refresh,
      markRead,
      markAllRead,
      clear,
      removeLocal,
      dismissToast,
    }),
    [
      connected,
      notifications,
      unreadCount,
      toast,
      refresh,
      markRead,
      markAllRead,
      clear,
      removeLocal,
      dismissToast,
    ],
  )

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>')
  return ctx
}

/** Small helper to format the "time ago" label on notifications. */
// eslint-disable-next-line react-refresh/only-export-components
export function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const min = Math.floor(diffSec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} h ago`
  const day = Math.floor(hr / 24)
  return `${day} d ago`
}
