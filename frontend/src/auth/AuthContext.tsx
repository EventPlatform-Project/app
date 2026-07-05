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
import keycloak from '@/lib/keycloak'

/** Roles known to the backend (Keycloak realm roles). */
export type AppRole = 'ADMINISTRATEUR' | 'ORGANISATEUR' | 'PARTICIPANT'

export interface AuthUser {
  id: string          // Keycloak sub (== users-service UserEntity.id)
  username: string
  email?: string
  firstName?: string
  lastName?: string
  roles: string[]     // realm roles (uppercase, e.g. 'ADMINISTRATEUR')
}

interface AuthContextValue {
  initialized: boolean
  authenticated: boolean
  user: AuthUser | null
  token: string | undefined
  login: (redirectUri?: string) => void
  register: (redirectUri?: string) => void
  logout: (redirectUri?: string) => void
  hasRole: (role: AppRole | string) => boolean
  hasAnyRole: (...roles: (AppRole | string)[]) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// --- Session persistence keys ---------------------------------------------
// Storing the refresh token in localStorage lets us restore the Keycloak
// session on a hard refresh WITHOUT relying on the silent-check-sso iframe
// (which is blocked by Keycloak's CSP `frame-ancestors 'self'` by default).
const STORAGE_TOKEN = 'kc_token'
const STORAGE_REFRESH = 'kc_refresh_token'
const STORAGE_ID = 'kc_id_token'

function loadStoredTokens() {
  try {
    return {
      token: localStorage.getItem(STORAGE_TOKEN) ?? undefined,
      refreshToken: localStorage.getItem(STORAGE_REFRESH) ?? undefined,
      idToken: localStorage.getItem(STORAGE_ID) ?? undefined,
    }
  } catch {
    return { token: undefined, refreshToken: undefined, idToken: undefined }
  }
}

function persistTokens() {
  try {
    if (keycloak.token) localStorage.setItem(STORAGE_TOKEN, keycloak.token)
    if (keycloak.refreshToken) localStorage.setItem(STORAGE_REFRESH, keycloak.refreshToken)
    if (keycloak.idToken) localStorage.setItem(STORAGE_ID, keycloak.idToken)
  } catch {
    /* storage disabled */
  }
}

function clearStoredTokens() {
  try {
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_REFRESH)
    localStorage.removeItem(STORAGE_ID)
  } catch {
    /* ignored */
  }
}

function extractRoles(): string[] {
  const realmRoles = (keycloak.tokenParsed as { realm_access?: { roles?: string[] } } | undefined)
    ?.realm_access?.roles ?? []
  return realmRoles.map(r => r.toUpperCase())
}

function extractUser(): AuthUser | null {
  const tp = keycloak.tokenParsed as
    | {
        sub?: string
        preferred_username?: string
        email?: string
        given_name?: string
        family_name?: string
      }
    | undefined

  if (!tp?.sub) return null

  return {
    id: tp.sub,
    username: tp.preferred_username ?? tp.email ?? tp.sub,
    email: tp.email,
    firstName: tp.given_name,
    lastName: tp.family_name,
    roles: extractRoles(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [tokenTick, setTokenTick] = useState(0) // triggers re-render on token refresh
  const initRan = useRef(false)

  // ---- Initial Keycloak bootstrap (runs once) --------------------------------
  useEffect(() => {
    if (initRan.current) return
    initRan.current = true

    const stored = loadStoredTokens()

    keycloak
      .init({
        // No iframe SSO check (CSP-blocked by default). Instead we restore the
        // session by feeding Keycloak the tokens we persisted in localStorage.
        // If they're expired, keycloak-js will silently refresh them using the
        // refresh_token via a direct fetch (no iframe involved).
        onLoad: undefined,
        pkceMethod: 'S256',
        checkLoginIframe: false,
        token: stored.token,
        refreshToken: stored.refreshToken,
        idToken: stored.idToken,
      })
      .then(auth => {
        setAuthenticated(auth)
        setUser(auth ? extractUser() : null)
        if (auth) {
          persistTokens()
        } else {
          // Stored tokens were invalid (e.g. refresh_token expired) — flush them
          // so we don't keep retrying with junk on every reload.
          clearStoredTokens()
        }
      })
      .catch(err => {
        console.error('Keycloak init failed:', err)
        clearStoredTokens()
        setAuthenticated(false)
        setUser(null)
      })
      .finally(() => setInitialized(true))

    // Auth lifecycle callbacks ------------------------------------------------
    keycloak.onAuthSuccess = () => {
      setAuthenticated(true)
      setUser(extractUser())
      persistTokens()
    }
    keycloak.onAuthRefreshSuccess = () => {
      persistTokens()
      setTokenTick(t => t + 1)
    }
    keycloak.onAuthRefreshError = () => {
      clearStoredTokens()
      setAuthenticated(false)
      setUser(null)
    }
    keycloak.onAuthLogout = () => {
      clearStoredTokens()
      setAuthenticated(false)
      setUser(null)
    }
    keycloak.onAuthError = () => {
      clearStoredTokens()
      setAuthenticated(false)
      setUser(null)
    }
    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then(refreshed => {
          if (refreshed) {
            persistTokens()
            setTokenTick(t => t + 1)
          }
        })
        .catch(() => {
          clearStoredTokens()
          setAuthenticated(false)
          setUser(null)
        })
    }
  }, [])

  const login = useCallback((redirectUri?: string) => {
    keycloak.login({ redirectUri: redirectUri ?? window.location.origin + '/welcome' })
  }, [])

  const register = useCallback((redirectUri?: string) => {
    keycloak.register({ redirectUri: redirectUri ?? window.location.origin + '/welcome' })
  }, [])

  const logout = useCallback((redirectUri?: string) => {
    clearStoredTokens()
    keycloak.logout({ redirectUri: redirectUri ?? window.location.origin + '/sign-in' })
  }, [])

  const hasRole = useCallback(
    (role: string) => (user?.roles ?? []).includes(role.toUpperCase()),
    [user],
  )

  const hasAnyRole = useCallback(
    (...roles: string[]) => roles.some(r => hasRole(r)),
    [hasRole],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      authenticated,
      user,
      token: keycloak.token,
      login,
      register,
      logout,
      hasRole,
      hasAnyRole,
    }),
    // tokenTick forces re-eval of keycloak.token when refreshed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialized, authenticated, user, login, register, logout, hasRole, hasAnyRole, tokenTick],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
