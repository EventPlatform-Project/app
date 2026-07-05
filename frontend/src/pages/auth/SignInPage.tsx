import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, ArrowRight, LogIn } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/auth/AuthContext'

/**
 * Local "landing" for authentication. It does NOT collect credentials;
 * instead it redirects the browser to Keycloak's hosted login page
 * (Authorization Code + PKCE) via keycloak-js.
 */
export function SignInPage() {
  const { initialized, authenticated, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const from = location.state?.from || '/welcome'

  // If already authenticated, get out of this page immediately.
  useEffect(() => {
    if (initialized && authenticated) navigate(from, { replace: true })
  }, [initialized, authenticated, navigate, from])

  const redirectUri = window.location.origin + from

  return (
    <div className="min-h-screen bg-orbit-bg flex">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orbit-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-orbit-accent/8 blur-[100px] rounded-full" />
      </div>

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-orbit-border relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm overflow-hidden border border-slate-700">
            <img src="/espritlogo.jpg" alt="Esprit Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <span className="text-slate-100 font-semibold text-xl tracking-tight">
            esprit<span className="text-orbit-primary-light">Event</span>
          </span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-slate-100 mb-4 leading-tight">
            Plateforme événementielle{' '}
            <span className="text-gradient">sécurisée par Keycloak</span>
          </h2>
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            L'authentification, l'inscription et la gestion des rôles sont assurées par notre serveur
            d'identité central. Cliquez sur « Se connecter » pour être redirigé vers la page sécurisée.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'OIDC', label: 'Standard sécurité' },
              { value: 'PKCE', label: 'Flux autorisé' },
              { value: 'SSO', label: 'Single Sign-On' },
              { value: 'RBAC', label: 'Contrôle par rôle' },
            ].map(stat => (
              <div key={stat.label} className="bg-orbit-surface/60 border border-orbit-border rounded-xl p-4">
                <p className="text-xl font-bold text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-700">
          Propulsé par Keycloak — realm <code className="text-slate-500">microservices-realm</code>
        </p>
      </div>

      {/* Right panel — CTA */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-orbit-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-100 font-semibold text-lg">espritEvent</span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-orbit-primary/15 border border-orbit-primary/30 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-orbit-primary-light" />
          </div>

          <h1 className="text-2xl font-bold text-slate-100 mb-1">Connexion sécurisée</h1>
          <p className="text-slate-500 text-sm mb-8">
            Vous serez redirigé vers la page d'authentification Keycloak pour vous connecter en toute sécurité.
          </p>

          <div className="space-y-3">
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => login(redirectUri)}
              disabled={!initialized}
              icon={<LogIn className="w-4 h-4" />}
              iconPosition="left"
            >
              Se connecter avec Keycloak
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => register(redirectUri)}
              disabled={!initialized}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Créer un compte
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-orbit-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="text-xs text-slate-600 bg-orbit-bg px-3">informations</span>
            </div>
          </div>

          <ul className="text-xs text-slate-500 space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1 h-1 rounded-full bg-orbit-primary" />
              Authentification via OpenID Connect (Authorization Code + PKCE)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1 h-1 rounded-full bg-orbit-primary" />
              Session fédérée avec tous les microservices
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1 h-1 rounded-full bg-orbit-primary" />
              Rôles : ADMINISTRATEUR, ORGANISATEUR, PARTICIPANT
            </li>
          </ul>

          <p className="text-center text-xs text-slate-500 mt-8">
            Vous n'avez pas de compte ?{' '}
            <Link to="/sign-up" className="text-orbit-primary-light hover:text-orbit-accent transition-colors font-medium">
              Inscrivez-vous
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
