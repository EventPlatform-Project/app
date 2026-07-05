import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, UserPlus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/auth/AuthContext'

/**
 * Sign-up landing. The actual registration form is hosted by Keycloak.
 * Requires "User registration" to be enabled on the realm's login settings.
 */
export function SignUpPage() {
  const { initialized, authenticated, register, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (initialized && authenticated) navigate('/welcome', { replace: true })
  }, [initialized, authenticated, navigate])

  const redirectUri = window.location.origin + '/welcome'

  return (
    <div className="min-h-screen bg-orbit-bg flex items-center justify-center p-6 relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-orbit-primary/8 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-orbit-accent/8 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-700 overflow-hidden">
            <img src="/espritlogo.jpg" alt="Esprit" className="w-full h-full object-contain p-0.5" />
          </div>
          <span className="text-slate-100 font-semibold">espritEvent</span>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-orbit-accent/15 border border-orbit-accent/30 flex items-center justify-center mb-4">
          <UserPlus className="w-6 h-6 text-orbit-accent-light" />
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-1">Créer un compte</h1>
        <p className="text-slate-500 text-sm mb-8">
          La création de compte se fait sur notre serveur d'authentification Keycloak.
          Vous serez redirigé, puis renvoyé automatiquement ici une fois inscrit.
        </p>

        <div className="space-y-3">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => register(redirectUri)}
            disabled={!initialized}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            S'inscrire sur Keycloak
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => login(redirectUri)}
            disabled={!initialized}
            icon={<ShieldCheck className="w-4 h-4" />}
            iconPosition="left"
          >
            J'ai déjà un compte — Se connecter
          </Button>
        </div>

        <div className="mt-8 bg-orbit-surface/60 border border-orbit-border rounded-xl p-4">
          <p className="text-xs font-medium text-slate-300 mb-2">À noter</p>
          <ul className="text-xs text-slate-500 space-y-1.5">
            <li>• Rôle attribué par défaut : <span className="text-slate-300">PARTICIPANT</span></li>
            <li>• Un profil local sera créé automatiquement à la première connexion</li>
            <li>• Contactez un administrateur pour changer de rôle</li>
          </ul>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          Vous avez déjà un compte ?{' '}
          <Link to="/sign-in" className="text-orbit-primary-light hover:text-orbit-accent transition-colors font-medium">
            Connectez-vous
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
