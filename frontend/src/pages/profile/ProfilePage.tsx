import { useEffect, useState, type FormEvent } from 'react'
import { User, Mail, ShieldCheck, Save, LogOut, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/auth/AuthContext'
import { userService, type UserProfile } from '@/services/userService'

/**
 * Displays and updates the local profile record for the currently authenticated
 * Keycloak user. On first render we call POST /api/users/sync so the users-service
 * ensures a local record exists (needed when the user just registered directly on
 * the Keycloak-hosted registration page).
 */
export default function ProfilePage() {
  const { user, logout } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        // Ensures local record exists, then returns it
        const p = await userService.syncCurrentUser()
        if (cancelled) return
        setProfile(p)
        setFirstName(p.firstName ?? '')
        setLastName(p.lastName ?? '')
      } catch (e) {
        if (!cancelled) setError('Impossible de charger votre profil. Veuillez réessayer.')
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await userService.updateMyProfile({ firstName, lastName })
      setProfile(updated)
      setSuccess('Profil mis à jour avec succès.')
    } catch (err) {
      setError('Échec de la mise à jour du profil.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Mon Profil</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ces informations proviennent de Keycloak et du service Utilisateurs.
        </p>
      </div>

      {/* Identity header card */}
      <div className="bg-orbit-surface border border-orbit-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center text-white text-xl font-bold">
            {(user?.firstName?.[0] ?? user?.username?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-100 truncate">
              {profile?.firstName || profile?.lastName
                ? `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
                : profile?.username ?? user?.username}
            </p>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {profile?.email ?? user?.email ?? '—'}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium bg-orbit-primary/15 text-orbit-primary-light px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              {profile?.role ?? '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Errors / success banners */}
      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg p-3 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Editable form */}
      <form onSubmit={handleSubmit} className="bg-orbit-surface border border-orbit-border rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-200">Informations personnelles</h2>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom d'utilisateur"
                value={profile?.username ?? ''}
                prefix={<User className="w-3.5 h-3.5" />}
                readOnly
                disabled
                hint="Géré par Keycloak"
              />
              <Input
                label="Email"
                value={profile?.email ?? ''}
                prefix={<Mail className="w-3.5 h-3.5" />}
                readOnly
                disabled
                hint="Géré par Keycloak"
              />
              <Input
                label="Prénom"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Votre prénom"
              />
              <Input
                label="Nom"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="submit"
                size="md"
                loading={saving}
                icon={<Save className="w-4 h-4" />}
                iconPosition="left"
              >
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => logout()}
                icon={<LogOut className="w-4 h-4" />}
                iconPosition="left"
              >
                Se déconnecter
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
