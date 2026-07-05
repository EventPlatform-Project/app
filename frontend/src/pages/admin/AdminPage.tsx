import { useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck,
  Users as UsersIcon,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Mail,
  Calendar,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { userService, type UserProfile, type UserRole } from '@/services/userService'

const ROLE_BADGE: Record<UserRole, string> = {
  ADMINISTRATEUR: 'bg-red-500/15 text-red-300 border-red-500/30',
  ORGANISATEUR: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  PARTICIPANT: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
}

/**
 * Admin panel (route: /admin).
 * Access is limited by ProtectedRoute to realm role ADMINISTRATEUR.
 * Backend also enforces the check via @PreAuthorize on GET /api/users.
 */
export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')

  async function fetchUsers() {
    try {
      setLoading(true)
      setError(null)
      const list = await userService.getAllUsers()
      setUsers(list)
    } catch (e) {
      const anyErr = e as { response?: { status?: number } }
      if (anyErr?.response?.status === 403) {
        setError('Accès refusé : rôle ADMINISTRATEUR requis.')
      } else {
        setError('Impossible de charger la liste des utilisateurs.')
      }
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter(u => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
      if (!q) return true
      return (
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(q)
      )
    })
  }, [users, query, roleFilter])

  const counts = useMemo(
    () => ({
      total: users.length,
      admins: users.filter(u => u.role === 'ADMINISTRATEUR').length,
      organisateurs: users.filter(u => u.role === 'ORGANISATEUR').length,
      participants: users.filter(u => u.role === 'PARTICIPANT').length,
    }),
    [users],
  )

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-red-400" />
            <h1 className="text-2xl font-bold text-slate-100">Panel Admin</h1>
          </div>
          <p className="text-sm text-slate-500">
            Gestion des utilisateurs. Réservé aux administrateurs.
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          onClick={fetchUsers}
          disabled={loading}
          icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          iconPosition="left"
        >
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total" value={counts.total} icon={<UsersIcon className="w-4 h-4" />} />
        <StatTile label="Administrateurs" value={counts.admins} tone="red" />
        <StatTile label="Organisateurs" value={counts.organisateurs} tone="amber" />
        <StatTile label="Participants" value={counts.participants} tone="emerald" />
      </div>

      {/* Filters */}
      <div className="bg-orbit-surface border border-orbit-border rounded-2xl p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <Input
            label="Rechercher"
            placeholder="Nom, email, nom d'utilisateur…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            prefix={<Search className="w-3.5 h-3.5" />}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Rôle</label>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as UserRole | 'ALL')}
            className="h-9 rounded-lg border border-orbit-border bg-orbit-surface2 px-3 text-sm text-slate-200 outline-none focus:border-orbit-primary focus:ring-1 focus:ring-orbit-primary/30"
          >
            <option value="ALL">Tous</option>
            <option value="ADMINISTRATEUR">Administrateur</option>
            <option value="ORGANISATEUR">Organisateur</option>
            <option value="PARTICIPANT">Participant</option>
          </select>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-orbit-surface border border-orbit-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement des utilisateurs…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">Aucun utilisateur trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-orbit-surface2 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Utilisateur</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Rôle</th>
                  <th className="px-4 py-3 text-left font-medium">Créé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orbit-border">
                {filtered.map(u => {
                  const displayName =
                    (u.firstName || u.lastName)
                      ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                      : u.username
                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(displayName?.[0] ?? '?').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-200 font-medium truncate">{displayName}</p>
                            <p className="text-xs text-slate-500 truncate">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${ROLE_BADGE[u.role]}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon?: React.ReactNode
  tone?: 'red' | 'amber' | 'emerald'
}) {
  const toneCls =
    tone === 'red'
      ? 'text-red-300'
      : tone === 'amber'
      ? 'text-amber-300'
      : tone === 'emerald'
      ? 'text-emerald-300'
      : 'text-slate-100'
  return (
    <div className="bg-orbit-surface border border-orbit-border rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        {icon} {label}
      </div>
      <p className={`text-2xl font-bold ${toneCls}`}>{value}</p>
    </div>
  )
}
