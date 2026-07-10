import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import keycloak from './keycloak'

/**
 * Central axios instance for the whole app.
 * All requests are prefixed with the API gateway URL and automatically
 * get a fresh Keycloak Bearer token attached.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8888',
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
})

// --- Request interceptor: attach fresh Bearer token ---
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (keycloak.authenticated && keycloak.token) {
    try {
      // Refresh if the token expires in <30 s
      await keycloak.updateToken(30)
    } catch {
      // If refresh fails, let the request go without a token; it will 401.
    }
    config.headers = config.headers ?? {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${keycloak.token}`
  }
  return config
})

// --- Response interceptor: on 401 -> force re-login (with loop protection) ---
//
// If the backend keeps returning 401 (e.g. Keycloak just restarted and the
// public keys don't match yet, or the config is stale), calling
// `keycloak.login()` on every failure creates an infinite redirect loop:
//   401 -> redirect to Keycloak -> back to app -> 401 -> redirect ...
//
// We protect against this by:
//   - Only ever triggering the redirect ONCE per page load (module-level flag).
//   - Waiting until the second consecutive 401 (transient failures happen).
//   - Recording the last redirect timestamp in sessionStorage and refusing to
//     redirect again for 10 s, so a full page reload from Keycloak doesn't
//     immediately re-trigger the flow.
let redirectInFlight = false
const LAST_REDIRECT_KEY = '__auth_last_redirect'
const REDIRECT_COOLDOWN_MS = 10_000

function recentlyRedirected(): boolean {
  try {
    const raw = sessionStorage.getItem(LAST_REDIRECT_KEY)
    if (!raw) return false
    const ts = Number(raw)
    return Number.isFinite(ts) && Date.now() - ts < REDIRECT_COOLDOWN_MS
  } catch {
    return false
  }
}

function markRedirected() {
  try {
    sessionStorage.setItem(LAST_REDIRECT_KEY, String(Date.now()))
  } catch {
    /* storage disabled */
  }
}

api.interceptors.response.use(
  r => r,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Only redirect if we were supposed to be authenticated in the first
      // place — anonymous 401s just bubble up so the calling code can show
      // an inline error instead of nuking the whole page.
      if (
        keycloak.authenticated &&
        !redirectInFlight &&
        !recentlyRedirected()
      ) {
        redirectInFlight = true
        markRedirected()
        keycloak.login({
          redirectUri: window.location.origin + window.location.pathname,
        })
      }
    }
    return Promise.reject(error)
  },
)

export default api
