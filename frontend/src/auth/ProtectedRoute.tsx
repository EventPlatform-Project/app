import { useEffect, type ReactNode } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuth, type AppRole } from './AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  /** If provided, user must have at least one of these realm roles. */
  roles?: (AppRole | string)[]
  /**
   * What to do on unauthenticated:
   *   'login'    -> redirect straight to Keycloak login (default)
   *   'sign-in'  -> redirect to the local /sign-in page (which then triggers Keycloak)
   */
  onUnauthenticated?: 'login' | 'sign-in'
}

export function ProtectedRoute({
  children,
  roles,
  onUnauthenticated = 'sign-in',
}: ProtectedRouteProps) {
  const { initialized, authenticated, hasAnyRole, login } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (initialized && !authenticated && onUnauthenticated === 'login') {
      login(window.location.origin + location.pathname + location.search)
    }
  }, [initialized, authenticated, onUnauthenticated, login, location])

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-orbit-bg">
        <div className="text-slate-400 text-sm">Chargement de la session…</div>
      </div>
    )
  }

  if (!authenticated) {
    if (onUnauthenticated === 'login') {
      // login() side effect above will redirect; render nothing meanwhile
      return null
    }
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }

  if (roles && roles.length > 0 && !hasAnyRole(...roles)) {
    return <Navigate to="/forbidden" replace />
  }

  return <>{children}</>
}
