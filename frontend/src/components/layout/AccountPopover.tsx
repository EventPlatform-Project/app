import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
  Mail,
  LogOut,
  Fingerprint,
  KeyRound,
  Copy,
  Check,
  BadgeCheck,
  Calendar,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { userService, type UserProfile } from '@/services/userService'
import { cn } from '@/utils/cn'

const KEYCLOAK_ACCOUNT_URL = `${
  import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180'
}/realms/${import.meta.env.VITE_KEYCLOAK_REALM || 'microservices-realm'}/account`

const ROLE_TONE: Record<string, string> = {
  ADMINISTRATEUR: 'bg-red-500/15 text-red-300 border-red-500/30',
  ORGANISATEUR: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  PARTICIPANT: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
}

/**
 * Popover anchored to the topbar avatar. Shows Keycloak identity, role,
 * account metadata and quick actions (profile, admin panel, keycloak account,
 * logout). Fetches the local users-service profile lazily on first open.
 */
export function AccountPopover() {
  const { user, hasRole, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Lazy-load local profile on first open
  useEffect(() => {
    if (!open || profile || loadingProfile) return
    let cancelled = false
    setLoadingProfile(true)
    userService
      .syncCurrentUser()
      .then(p => {
        if (!cancelled) setProfile(p)
      })
      .catch(err => {
        console.warn('Could not load local profile in AccountPopover:', err)
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, profile, loadingProfile])

  if (!user) return null

  const displayName =
    (profile?.firstName || profile?.lastName)
      ? `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
      : (user.firstName || user.lastName)
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : user.username
  const displayEmail = profile?.email ?? user.email ?? '—'
  const initials = (
    (profile?.firstName?.[0] ?? user.firstName?.[0] ?? user.username?.[0] ?? '?') +
    (profile?.lastName?.[0] ?? user.lastName?.[0] ?? '')
  ).toUpperCase()

  const primaryRole = profile?.role
    ?? user.roles.find(r => ['ADMINISTRATEUR', 'ORGANISATEUR', 'PARTICIPANT'].includes(r))
    ?? user.roles[0]
    ?? 'PARTICIPANT'
  const roleTone = ROLE_TONE[primaryRole] ?? 'bg-slate-500/15 text-slate-300 border-slate-500/30'

  async function copyToClipboard(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(label)
      setTimeout(() => setCopiedField(null), 1500)
    } catch {
      /* ignored */
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'ml-2 flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-colors',
          'hover:bg-white/5',
          open && 'bg-white/5',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center text-white text-xs font-bold border border-white/10">
          {initials || 'U'}
        </div>
        <div className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-xs font-semibold text-slate-200 max-w-[140px] truncate">
            {displayName}
          </span>
          <span className="text-[10px] text-slate-500 max-w-[140px] truncate">{primaryRole}</span>
        </div>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-slate-500 transition-transform duration-200 hidden md:inline',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-orbit-surface2 border border-orbit-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-br from-orbit-primary/10 via-transparent to-orbit-accent/10 border-b border-orbit-border">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center text-white text-sm font-bold border border-white/10 flex-shrink-0">
                  {initials || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-100 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{displayEmail}</span>
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        roleTone,
                      )}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {primaryRole}
                    </span>
                    {profile && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                        <BadgeCheck className="w-3 h-3" />
                        Synchronisé
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expand toggle */}
              <button
                type="button"
                onClick={() => setExpanded(x => !x)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 py-1.5 rounded-md hover:bg-white/5 transition-colors"
              >
                {expanded ? 'Masquer les détails' : 'Afficher les détails'}
                <ChevronDown
                  className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')}
                />
              </button>
            </div>

            {/* Expanded details */}
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-b border-orbit-border"
                >
                  <div className="p-4 space-y-3">
                    {loadingProfile && !profile && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Chargement du profil…
                      </div>
                    )}

                    <DetailRow
                      icon={<UserIcon className="w-3.5 h-3.5" />}
                      label="Nom d'utilisateur"
                      value={profile?.username ?? user.username}
                      onCopy={() =>
                        copyToClipboard('username', profile?.username ?? user.username)
                      }
                      copied={copiedField === 'username'}
                    />

                    <DetailRow
                      icon={<Fingerprint className="w-3.5 h-3.5" />}
                      label="ID Keycloak"
                      value={user.id}
                      mono
                      truncate
                      onCopy={() => copyToClipboard('id', user.id)}
                      copied={copiedField === 'id'}
                    />

                    {profile?.createdAt && (
                      <DetailRow
                        icon={<Calendar className="w-3.5 h-3.5" />}
                        label="Membre depuis"
                        value={new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      />
                    )}

                    {user.roles.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                          <ShieldCheck className="w-3 h-3" />
                          Tous les rôles Keycloak
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map(r => (
                            <span
                              key={r}
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-md border',
                                ROLE_TONE[r] ?? 'text-slate-400 border-orbit-border bg-orbit-surface',
                              )}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="p-1.5">
              <MenuItem
                to="/profile"
                icon={<UserIcon className="w-4 h-4" />}
                label="Mon Profil"
                description="Voir et modifier mes informations"
                onClick={() => setOpen(false)}
              />
              {hasRole('ADMINISTRATEUR') && (
                <MenuItem
                  to="/admin"
                  icon={<ShieldCheck className="w-4 h-4" />}
                  label="Panel Admin"
                  description="Gestion des utilisateurs"
                  onClick={() => setOpen(false)}
                  tone="danger"
                />
              )}
              <MenuItem
                href={KEYCLOAK_ACCOUNT_URL}
                external
                icon={<KeyRound className="w-4 h-4" />}
                label="Compte Keycloak"
                description="Changer mot de passe, 2FA…"
                onClick={() => setOpen(false)}
              />
            </div>

            {/* Logout */}
            <div className="p-1.5 border-t border-orbit-border">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------- Subcomponents ----------

function DetailRow({
  icon,
  label,
  value,
  mono,
  truncate,
  onCopy,
  copied,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
  truncate?: boolean
  onCopy?: () => void
  copied?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p
          className={cn(
            'text-xs text-slate-300 flex-1 min-w-0',
            mono && 'font-mono',
            truncate && 'truncate',
          )}
          title={value}
        >
          {value}
        </p>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="p-1 text-slate-500 hover:text-slate-200 rounded transition-colors flex-shrink-0"
            title="Copier"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  )
}

function MenuItem({
  to,
  href,
  external,
  icon,
  label,
  description,
  onClick,
  tone,
}: {
  to?: string
  href?: string
  external?: boolean
  icon: React.ReactNode
  label: string
  description?: string
  onClick?: () => void
  tone?: 'default' | 'danger'
}) {
  const cls = cn(
    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
    tone === 'danger'
      ? 'text-red-300 hover:bg-red-500/10'
      : 'text-slate-300 hover:bg-white/5 hover:text-slate-100',
  )

  const content = (
    <>
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate">{label}</span>
        {description && (
          <span className="block text-[11px] text-slate-500 truncate">{description}</span>
        )}
      </span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        onClick={onClick}
        className={cls}
      >
        {content}
      </a>
    )
  }
  return (
    <Link to={to!} onClick={onClick} className={cls}>
      {content}
    </Link>
  )
}
