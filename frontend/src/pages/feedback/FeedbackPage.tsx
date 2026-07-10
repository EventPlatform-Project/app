import { useEffect, useMemo, useState } from 'react'
import {
  Star,
  Send,
  Loader2,
  AlertCircle,
  MessageSquare,
  Trash2,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/auth/AuthContext'
import {
  feedbackService,
  type CreateFeedbackRequest,
  type FeedbackResponse,
} from '@/services/feedbackService'

/**
 * Feedback page. Any authenticated user can:
 *  - post a new feedback (subject, message, optional 1..5 rating)
 *  - view every feedback ever posted
 *  - delete their own feedback (admins can delete anyone's, enforced server-side)
 */
export default function FeedbackPage() {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole('ADMINISTRATEUR')

  // Form state
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // List state
  const [feedback, setFeedback] = useState<FeedbackResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'mine'>('all')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function loadList() {
    try {
      setLoading(true)
      setListError(null)
      const items =
        filter === 'mine'
          ? await feedbackService.listMine()
          : await feedbackService.list()
      console.debug('[feedback] loaded', items.length, 'items', items)
      setFeedback(Array.isArray(items) ? items : [])
    } catch (e) {
      const err = e as { response?: { status?: number } }
      if (err?.response?.status === 401) {
        setListError('Vous devez être connecté pour voir les feedbacks.')
      } else {
        setListError('Impossible de charger les feedbacks.')
      }
      console.error('[feedback] load failed', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setFormError(null)
    setFormSuccess(null)
    setSubmitting(true)
    try {
      const body: CreateFeedbackRequest = {
        subject: subject.trim(),
        message: message.trim(),
        rating: rating ?? undefined,
      }
      const created = await feedbackService.create(body)
      setFeedback((prev) => [created, ...prev])
      setSubject('')
      setMessage('')
      setRating(null)
      setFormSuccess('Merci ! Votre feedback a été enregistré.')
    } catch (e) {
      const err = e as { response?: { status?: number; data?: { error?: string } } }
      const status = err?.response?.status
      if (status === 400) {
        setFormError(err?.response?.data?.error ?? 'Champs invalides.')
      } else if (status === 401) {
        setFormError('Session expirée, veuillez vous reconnecter.')
      } else {
        setFormError("L'envoi a échoué. Réessayez.")
      }
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(fb: FeedbackResponse) {
    if (!confirm(`Supprimer le feedback « ${fb.subject} » ?`)) return
    setDeletingId(fb.id)
    try {
      await feedbackService.remove(fb.id)
      setFeedback((prev) => prev.filter((x) => x.id !== fb.id))
    } catch (e) {
      const err = e as { response?: { status?: number } }
      if (err?.response?.status === 403) {
        alert("Vous n'avez pas le droit de supprimer ce feedback.")
      } else if (err?.response?.status === 404) {
        setFeedback((prev) => prev.filter((x) => x.id !== fb.id))
      } else {
        alert('La suppression a échoué.')
      }
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  const avg = useMemo(() => {
    const rated = feedback.filter((f) => typeof f.rating === 'number')
    if (rated.length === 0) return null
    const sum = rated.reduce((acc, f) => acc + (f.rating ?? 0), 0)
    return sum / rated.length
  }, [feedback])

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-bold text-slate-100">Feedback</h1>
          </div>
          <p className="text-sm text-slate-500">
            Partagez votre avis sur la plateforme. Réservé aux utilisateurs connectés.
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          onClick={loadList}
          disabled={loading}
          icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          iconPosition="left"
        >
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatTile label="Total" value={feedback.length} icon={<MessageSquare className="w-4 h-4" />} />
        <StatTile
          label="Note moyenne"
          value={avg == null ? '—' : avg.toFixed(1)}
          icon={<Star className="w-4 h-4" />}
          tone="amber"
        />
        <StatTile
          label="Utilisateur"
          value={user?.username ?? '—'}
          icon={<UserIcon className="w-4 h-4" />}
        />
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-orbit-surface border border-orbit-border rounded-2xl p-5 mb-6 space-y-3"
      >
        <h2 className="text-sm font-semibold text-slate-200 mb-2">Nouveau feedback</h2>

        <Input
          label="Sujet *"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ce que vous aimez, ce qui pourrait être amélioré…"
          maxLength={160}
          required
        />

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Message *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez votre retour en détail…"
            required
            maxLength={2000}
            rows={4}
            className="w-full rounded-lg border border-orbit-border bg-orbit-surface2 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary focus:ring-1 focus:ring-orbit-primary/30 resize-y min-h-[100px]"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>Optionnel : notez de 1 à 5 étoiles</span>
            <span>{message.length}/2000</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Note</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating((prev) => (prev === n ? null : n))}
                aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    rating != null && n <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
            {rating != null && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="ml-2 text-[11px] text-slate-500 hover:text-slate-300 underline"
              >
                effacer
              </button>
            )}
          </div>
        </div>

        {formError && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-2.5 text-xs">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        {formSuccess && (
          <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg p-2.5 text-xs">
            <Star className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 fill-current" />
            <span>{formSuccess}</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!canSubmit}
            icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            iconPosition="left"
          >
            {submitting ? 'Envoi…' : 'Envoyer'}
          </Button>
        </div>
      </form>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-3">
        <TabButton active={filter === 'all'} onClick={() => setFilter('all')}>
          Tous les feedbacks
        </TabButton>
        <TabButton active={filter === 'mine'} onClick={() => setFilter('mine')}>
          Les miens
        </TabButton>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        ) : listError ? (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{listError}</span>
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm bg-orbit-surface border border-orbit-border rounded-2xl">
            {filter === 'mine'
              ? "Vous n'avez pas encore publié de feedback."
              : 'Aucun feedback pour le moment. Soyez le premier !'}
          </div>
        ) : (
          <>
            {feedback.map((fb) => {
              const isMine = fb.userId === user?.id
              const canDelete = isMine || isAdmin
              return (
                <div
                  key={fb.id}
                  className="bg-orbit-surface border border-orbit-border rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                          {(fb.username?.[0] ?? '?').toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-slate-200 truncate">
                          {fb.username ?? 'Anonyme'}
                          {isMine && (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-orbit-primary-light bg-orbit-primary/15 px-1.5 py-0.5 rounded-full">
                              Moi
                            </span>
                          )}
                        </p>
                        <span className="text-[11px] text-slate-500 flex-shrink-0">
                          {formatDate(fb.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100 mb-1">{fb.subject}</h3>
                      {fb.rating != null && (
                        <div className="flex items-center gap-0.5 mb-1.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`w-3.5 h-3.5 ${
                                n <= fb.rating!
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-slate-400 whitespace-pre-wrap break-words">
                        {fb.message}
                      </p>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(fb)}
                        disabled={deletingId === fb.id}
                        title="Supprimer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10 disabled:opacity-40 transition-colors flex-shrink-0"
                      >
                        {deletingId === fb.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  tone?: 'amber'
}) {
  const toneCls = tone === 'amber' ? 'text-amber-300' : 'text-slate-100'
  return (
    <div className="bg-orbit-surface border border-orbit-border rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        {icon} {label}
      </div>
      <p className={`text-2xl font-bold ${toneCls}`}>{value}</p>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'bg-orbit-primary/20 text-orbit-primary-light border border-orbit-primary/40'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
      }`}
    >
      {children}
    </button>
  )
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
    if (diffSec < 60) return `${diffSec}s`
    const min = Math.floor(diffSec / 60)
    if (min < 60) return `il y a ${min} min`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `il y a ${hr} h`
    return d.toLocaleDateString('fr-FR')
  } catch {
    return ''
  }
}
