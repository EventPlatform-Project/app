import { Link } from 'react-router-dom'
import { ShieldAlert, Home } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/auth/AuthContext'

export default function ForbiddenPage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
      <div className="w-20 h-20 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-red-400" />
      </div>
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Accès refusé</h1>
      <p className="text-slate-400 max-w-md mb-2">
        Vous n'avez pas les droits nécessaires pour consulter cette page.
      </p>
      {user && (
        <p className="text-xs text-slate-500 mb-6">
          Connecté en tant que <span className="text-slate-300">{user.username}</span> — rôles :{' '}
          <span className="text-slate-300">{user.roles.join(', ') || 'aucun'}</span>
        </p>
      )}
      <div className="flex gap-3">
        <Link to="/welcome">
          <Button icon={<Home className="w-4 h-4" />} iconPosition="left">
            Retour à l'accueil
          </Button>
        </Link>
        <Button variant="outline" onClick={() => logout()}>
          Se déconnecter
        </Button>
      </div>
    </div>
  )
}
