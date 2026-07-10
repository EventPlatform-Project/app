import axios from 'axios'
import type { LiveNotification } from '@/hooks/useNotifications'

/**
 * REST client for the Node.js notification-service.
 *
 * Notes:
 *  - We use a **dedicated axios instance** (not the shared `@/lib/api`)
 *    because the notification-service is public: it doesn't validate the
 *    Keycloak JWT, and adding one would just be extra noise. It also lets
 *    us call the service from unauthenticated pages if needed.
 *  - Requests still go through the API Gateway on `/api/notifications`.
 */
const BASE_URL =
  (import.meta.env.VITE_API_GATEWAY_URL as string | undefined) ??
  'http://localhost:8888'

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
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
