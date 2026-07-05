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

/**
 * Live notifications pushed by the notification-service (Node.js) over SSE.
 * The stream is fed by RabbitMQ messages published by users-service whenever
 * a new user account is created.
 */

export interface LiveNotification {
  id: string
  type: string
  userId: string | null
  username: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  role: string | null
  message: string
  userCreatedAt: string | null
  receivedAt: string
  /** Local flag — not sent by the server. */
  read?: boolean
}

interface NotificationsContextValue {
  connected: boolean
  notifications: LiveNotification[]
  unreadCount: number
  toast: LiveNotification | null
  markAllRead: () => void
  clear: () => void
  dismissToast: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

const GATEWAY_URL =
  (import.meta.env.VITE_API_GATEWAY_URL as string | undefined) ??
  'http://localhost:8888'

const STREAM_URL = `${GATEWAY_URL.replace(/\/+$/, '')}/api/notifications/stream`
const HISTORY_URL = `${GATEWAY_URL.replace(/\/+$/, '')}/api/notifications`

const MAX_KEEP = 50
const TOAST_MS = 5000
const RECONNECT_MS = 5000

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<LiveNotification[]>([])
  const [connected, setConnected] = useState(false)
  const [toast, setToast] = useState<LiveNotification | null>(null)

  const esRef = useRef<EventSource | null>(null)
  const reconnectRef = useRef<number | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  // ---- Load recent history once so the bell isn't empty on first open ---
  useEffect(() => {
    let cancelled = false
    fetch(HISTORY_URL)
      .then(r => (r.ok ? r.json() : []))
      .then((items: LiveNotification[]) => {
        if (cancelled || !Array.isArray(items)) return
        setNotifications(items.slice(0, MAX_KEEP).map(n => ({ ...n, read: true })))
      })
      .catch(() => {
        /* notification service may be down — silently ignore */
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ---- Open the SSE stream (auto-reconnect) ------------------------------
  const openStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }

    const es = new EventSource(STREAM_URL)
    esRef.current = es

    es.addEventListener('ready', () => setConnected(true))

    es.addEventListener('notification', (evt: MessageEvent<string>) => {
      try {
        const n = JSON.parse(evt.data) as LiveNotification
        n.read = false
        setNotifications(prev => [n, ...prev].slice(0, MAX_KEEP))
        setToast(n)
      } catch (err) {
        console.warn('[notifications] failed to parse SSE payload', err)
      }
    })

    es.onerror = () => {
      setConnected(false)
      es.close()
      esRef.current = null
      // Retry after a delay
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

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clear = useCallback(() => setNotifications([]), [])
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
      markAllRead,
      clear,
      dismissToast,
    }),
    [connected, notifications, unreadCount, toast, markAllRead, clear, dismissToast],
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
