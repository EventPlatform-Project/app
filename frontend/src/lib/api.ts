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

// --- Response interceptor: on 401 -> force re-login ---
api.interceptors.response.use(
  r => r,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Session expired / invalid: kick back to the Keycloak login page.
      // Redirect only if we were supposed to be authenticated.
      if (keycloak.authenticated) {
        keycloak.login({ redirectUri: window.location.origin + window.location.pathname })
      }
    }
    return Promise.reject(error)
  },
)

export default api
