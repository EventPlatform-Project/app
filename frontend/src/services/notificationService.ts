import axios, { type InternalAxiosRequestConfig } from 'axios'
import keycloak from '@/lib/keycloak'
import type { LiveNotification } from '@/hooks/useNotifications'

/**
 * REST client for the Node.js notification-service.
 *
 * Notes:
 *  - We use a **dedicated axios instance** (not the shared `@/lib/api`) so
 *    that anonymous callers can still fetch the public read endpoints
 *    (GET /api/notifications, GET /api/notifications/unread-count).
 *  - Requests go through the API Gateway on `/api/notifications`. The
 *    gateway lets anonymous GETs pass through but requires a valid JWT for
 *    everything else (POST / PATCH / DELETE), so this interceptor attaches
 *    a fresh Bearer token whenever the user is authenticated.
 */
const BASE_URL =
  (import.meta.env.VITE_API_GATEWAY_URL as string | undefined) ??
  'http://localhost:8888'

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach a fresh Keycloak Bearer token when we have one. Without this the
// API gateway rejects PATCH / DELETE with 401 for logged-in users too, since
// only GET /api/notifications/** is anonymous.
http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (keycloak.authenticated && keycloak.token) {
    try {
      await keycloak.updateToken(30)
    } catch {
      /* let the request go without a fresh token; server will 401 */
    }
    config.headers = config.headers ?? {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${keycloak.token}`
  }
  return config
})

const PATH = '/api/notifications'

export interface ListOptions {
  limit?: number
  skip?: number
  unreadOnly?: boolean
}

export const notificationService = {
  /** List recent notifications (newest first). */
  list: async (opts: ListOptions = {}): Promise<LiveNotification[]> => {
    const params: Record<string, string> = {}
    if (opts.limit != null) params.limit = String(opts.limit)
    if (opts.skip != null) params.skip = String(opts.skip)
    if (opts.unreadOnly) params.unreadOnly = 'true'
    const { data } = await http.get<LiveNotification[]>(PATH, { params })
    return Array.isArray(data) ? data : []
  },

  /** Unread count (used by the sidebar badge). */
  unreadCount: async (): Promise<number> => {
    const { data } = await http.get<{ count: number }>(`${PATH}/unread-count`)
    return data.count ?? 0
  },

  /** Mark a single notification as read. */
  markRead: async (id: string): Promise<LiveNotification> => {
    const { data } = await http.patch<LiveNotification>(`${PATH}/${id}/read`)
    return data
  },

  /** Mark every unread notification as read. */
  markAllRead: async (): Promise<number> => {
    const { data } = await http.patch<{ modified: number }>(`${PATH}/read-all`)
    return data.modified ?? 0
  },

  /** Wipe the collection (dev-only endpoint on the backend). */
  clearAll: async (): Promise<number> => {
    const { data } = await http.delete<{ deleted: number }>(PATH)
    return data.deleted ?? 0
  },
}
