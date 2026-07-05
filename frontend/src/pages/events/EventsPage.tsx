import React, { useEffect, useMemo, useState } from 'react'
import { eventService } from '@/services/eventService'
import { userService, type UserSummary } from '@/services/userService'
import { useAuth } from '@/auth/AuthContext'
import type { Event } from '@/types/event'
import {
  Calendar,
  Plus,
  X,
  Tag,
  Users,
  Info,
  UserCircle2,
  AlertCircle,
  ShieldCheck,
  Filter,
} from 'lucide-react'

/** Empty form template — extracted so we can reset without duplication. */
const emptyForm = (organizerId: string) => ({
  title: '',
  description: '',
  category: 'Technologie',
  maxPlaces: 100,
  availablePlaces: 100,
  organizerId,
  status: 'ACTIVE',
})

/** Nicely formats a user for display in the organizer picker / event card. */
function displayUser(u: UserSummary | undefined): string {
  if (!u) return 'Inconnu'
  const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
  return full || u.username
}

const EventsPage = () => {
  const { user, hasRole } = useAuth()

  // Role-based visibility flags.
  //   - ADMINISTRATEUR & PARTICIPANT can see every event (read-all)
  //   - ORGANISATEUR only sees the events they organize
  const isOrganisateurOnly = hasRole('ORGANISATEUR') && !hasRole('ADMINISTRATEUR')

  // ----- Data state -----
  const [events, setEvents] = useState<Event[]>([])
  const [organizers, setOrganizers] = useState<UserSummary[]>([])
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true)
  const [loadingOrganizers, setLoadingOrganizers] = useState<boolean>(false)
  const [organizerError, setOrganizerError] = useState<string | null>(null)
  const [eventsError, setEventsError] = useState<string | null>(null)

  // ----- Form state -----
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(() => emptyForm(user?.id ?? ''))
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Lookup map: Keycloak id -> UserSummary. Used to show a friendly name
  // instead of a raw UUID on each event card.
  const organizerById = useMemo(() => {
    const m = new Map<string, UserSummary>()
    for (const u of organizers) m.set(u.id, u)
    return m
  }, [organizers])

  // ----- Initial data fetch -----
  // Re-fetch when the authenticated user changes (login / logout / role change).
  useEffect(() => {
    fetchEvents()
    // Also load organizers up-front so we can decorate each event card with a
    // friendly organizer name / avatar instead of the raw Keycloak UUID.
    fetchOrganizers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isOrganisateurOnly])

  useEffect(() => {
    // Default organizerId to the currently authenticated user (when known)
    setFormData(prev => ({ ...prev, organizerId: prev.organizerId || user?.id || '' }))
  }, [user?.id])

  /**
   * Fetch events applying role-based filtering:
   * <ul>
   *   <li><b>ORGANISATEUR</b>: calls users-service {@code GET /api/users/events},
   *     which forwards the JWT via Feign to the events-service and returns only
   *     events owned by the caller. The Ms-Event filtering happens server-side.</li>
   *   <li><b>Others</b>: fetches the full list from events-service directly.</li>
   * </ul>
   */
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true)
      setEventsError(null)

      const data = isOrganisateurOnly
        ? ((await userService.getMyEvents()) as unknown as Event[])
        : await eventService.getAllEvents()

      setEvents(data)
    } catch (error) {
      console.error('Erreur lors du chargement des événements :', error)
      setEventsError(
        isOrganisateurOnly
          ? "Impossible de charger vos événements depuis le service utilisateurs."
          : "Impossible de charger la liste des événements.",
      )
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }

  const fetchOrganizers = async () => {
    try {
      setLoadingOrganizers(true)
      setOrganizerError(null)
      const list = await userService.getOrganizers()
      setOrganizers(list)

      // If the current user is themselves an organizer/admin and formData is
      // empty, pre-select them. Otherwise pre-select the first organizer.
      setFormData(prev => {
        if (prev.organizerId && list.some(o => o.id === prev.organizerId)) return prev
        const selfMatch = list.find(o => o.id === user?.id)
        return { ...prev, organizerId: selfMatch?.id ?? list[0]?.id ?? '' }
      })
    } catch (err) {
      console.error('Erreur lors du chargement des organisateurs :', err)
      setOrganizerError(
        "Impossible de charger la liste des organisateurs. Vérifiez que le service utilisateurs est démarré.",
      )
    } finally {
      setLoadingOrganizers(false)
    }
  }

  const openForm = () => {
    setShowForm(true)
    setSubmitError(null)
    // Refresh organizers when opening the form in case a new user just registered
    if (organizers.length === 0) fetchOrganizers()
  }

  const closeForm = () => {
    setShowForm(false)
    setFormData(emptyForm(user?.id ?? ''))
    setSubmitError(null)
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'maxPlaces' || name === 'availablePlaces'
          ? Math.max(0, parseInt(value || '0', 10))
          : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!formData.organizerId) {
      setSubmitError('Veuillez sélectionner un organisateur.')
      return
    }
    if (!formData.title.trim()) {
      setSubmitError('Le titre est obligatoire.')
      return
    }

    try {
      setSubmitting(true)
      // availablePlaces defaults to maxPlaces on the backend, but we send both
      // to be explicit — this matches the events-service create flow.
      const payload: Event = {
        ...formData,
        availablePlaces: formData.maxPlaces,
      }
      await eventService.createEvent(payload)
      closeForm()
      fetchEvents()
    } catch (error) {
      console.error(error)
      setSubmitError("Erreur lors de l'enregistrement de l'événement.")
    } finally {
      setSubmitting(false)
    }
  }

  const canPickAnyOrganizer = hasRole('ADMINISTRATEUR')

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="text-orbit-primary" />
            {isOrganisateurOnly ? 'Mes Événements' : 'Gestion des Événements'}
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            {isOrganisateurOnly ? (
              <>
                <Filter size={14} className="text-orbit-primary-light" />
                <span>
                  Filtré par votre compte via <code className="text-slate-300">users-service</code> →
                  <code className="text-slate-300"> events-service</code>
                </span>
              </>
            ) : (
              <span>Gérez et créez des événements en temps réel sur Ms-Event.</span>
            )}
          </p>
        </div>
        <button
          onClick={showForm ? closeForm : openForm}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
            showForm
              ? 'bg-red-500/20 text-red-500 border border-red-500/50'
              : 'bg-orbit-primary text-white hover:bg-orbit-primary-light'
          }`}
        >
          {showForm ? (
            <>
              <X size={18} /> Annuler
            </>
          ) : (
            <>
              <Plus size={18} /> Nouvel Événement
            </>
          )}
        </button>
      </div>

      {/* FORMULAIRE DE CRÉATION */}
      {showForm && (
        <div className="bg-orbit-surface border border-orbit-border p-6 rounded-2xl mb-8 shadow-2xl animate-in fade-in zoom-in duration-200">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Info size={18} className="text-orbit-primary-light" /> Détails du nouvel événement
          </h2>

          {submitError && (
            <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Title + Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 ml-1">Titre</label>
                <input
                  name="title"
                  type="text"
                  placeholder="Titre de l'événement"
                  className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-white outline-none focus:border-orbit-primary"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 ml-1">Catégorie</label>
                <select
                  name="category"
                  className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-white outline-none focus:border-orbit-primary"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="Technologie">Technologie</option>
                  <option value="Formation">Formation</option>
                  <option value="Atelier">Atelier</option>
                  <option value="Conférence">Conférence</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 ml-1">Description</label>
              <textarea
                name="description"
                placeholder="Description détaillée..."
                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-white h-24 outline-none focus:border-orbit-primary"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            {/* Row 2: Organizer + Max places */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* --- Organizer picker (bound to Keycloak user id) --- */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 ml-1 flex items-center gap-1.5">
                  <UserCircle2 size={12} />
                  Organisateur
                  {!canPickAnyOrganizer && (
                    <span
                      className="ml-1 text-[10px] text-slate-600 italic"
                      title="Seuls les administrateurs peuvent créer un événement au nom d'un autre utilisateur"
                    >
                      (vous)
                    </span>
                  )}
                </label>
                <select
                  name="organizerId"
                  disabled={loadingOrganizers || (!canPickAnyOrganizer && !!user?.id)}
                  className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-white outline-none focus:border-orbit-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  value={formData.organizerId}
                  onChange={handleInputChange}
                  required
                >
                  {loadingOrganizers && <option>Chargement…</option>}
                  {!loadingOrganizers && organizers.length === 0 && (
                    <option value="">Aucun organisateur disponible</option>
                  )}
                  {!loadingOrganizers &&
                    organizers.map(o => (
                      <option key={o.id} value={o.id}>
                        {displayUser(o)} · {o.role}
                        {o.id === user?.id ? ' (vous)' : ''}
                      </option>
                    ))}
                </select>
                {organizerError && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {organizerError}
                  </p>
                )}
                {formData.organizerId && (
                  <p className="text-[10px] text-slate-600 mt-0.5 font-mono truncate">
                    ID Keycloak : {formData.organizerId}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 ml-1">Nombre de places max</label>
                <input
                  name="maxPlaces"
                  type="number"
                  min={1}
                  className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-white outline-none focus:border-orbit-primary"
                  value={formData.maxPlaces}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || loadingOrganizers}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enregistrement…' : "Enregistrer l'événement"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events fetch error */}
      {eventsError && !loadingEvents && (
        <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{eventsError}</span>
        </div>
      )}

      {/* GRILLE D'AFFICHAGE */}
      {loadingEvents ? (
        <div className="flex justify-center p-20">
          <p className="text-orbit-primary animate-pulse">Connexion au Microservice...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          {isOrganisateurOnly
            ? "Vous n'organisez encore aucun événement. Créez-en un pour commencer."
            : "Aucun événement pour l'instant."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map(event => {
            const organizer = organizerById.get(event.organizerId)
            return (
              <div
                key={event.id}
                className="bg-orbit-surface border border-orbit-border p-6 rounded-2xl hover:border-orbit-primary/50 transition-all group shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="p-2 bg-orbit-primary/10 rounded-lg text-orbit-primary-light">
                    <Tag size={20} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 px-2 py-1 rounded">
                    {event.status}
                  </span>
                </div>
                <h3 className="text-slate-100 font-bold text-lg mb-2 group-hover:text-orbit-primary-light transition-colors">
                  {event.title}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-6">{event.description}</p>

                <div className="pt-4 border-t border-orbit-border space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users size={16} />
                      <span className="text-xs font-medium">
                        {event.availablePlaces} / {event.maxPlaces} places
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
                      {event.category}
                    </span>
                  </div>

                  {/* Organizer footer with role badge if known */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {(organizer?.firstName?.[0] ?? organizer?.username?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-300 truncate">
                        {organizer ? displayUser(organizer) : (
                          <span className="text-slate-500 italic font-mono text-[10px]">
                            {event.organizerId}
                          </span>
                        )}
                      </p>
                      {organizer?.role && (
                        <p className="text-[9px] text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          {organizer.role}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default EventsPage
