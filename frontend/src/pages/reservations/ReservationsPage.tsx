import React, { useEffect, useState, useMemo } from 'react'
import {
  Calendar,
  ClipboardList,
  Users,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  ChevronRight,
  ArrowLeft,
  Hash,
  MapPin,
  Star,
  AlertCircle,
  BadgeCheck,
  RefreshCw,
} from 'lucide-react'
import { eventService } from '@/services/eventService'
import { userService, type UserSummary } from '@/services/userService'
import type { Event } from '@/types/event'

// ─── Backup static data for testing (in case backend is offline) ──────────────

const BACKUP_EVENTS = [
  {
    id: 1,
    title: 'React Summit 2025 [Test]',
    description: 'La plus grande conférence React en Afrique du Nord. Workshops, talks et networking.',
    category: 'Technologie',
    maxPlaces: 200,
    availablePlaces: 45,
    status: 'ACTIVE',
    organizerId: 'feten-id',
    schedules: [{ date: '2025-09-15', room: 'Amphi Tunis', startTime: '09:00', endTime: '18:00', speaker: 'Feten Ben Ali' }],
  },
  {
    id: 2,
    title: 'Workshop Docker & Kubernetes [Test]',
    description: 'Formation intensive sur la conteneurisation et l\'orchestration pour les équipes DevOps.',
    category: 'Formation',
    maxPlaces: 30,
    availablePlaces: 8,
    status: 'ACTIVE',
    organizerId: 'bedis-id',
    schedules: [{ date: '2025-08-22', room: 'Salle 204 Sfax', startTime: '09:00', endTime: '17:00', speaker: 'Bedis Karray' }],
  },
  {
    id: 3,
    title: 'Hackathon IA & Innovation [Test]',
    description: '48h de code intensif autour de l\'intelligence artificielle et du machine learning.',
    category: 'Atelier',
    maxPlaces: 100,
    availablePlaces: 0,
    status: 'COMPLET',
    organizerId: 'rawen-id',
    schedules: [{ date: '2025-10-05', room: 'Technopole Sousse', startTime: '10:00', endTime: '22:00', speaker: 'Rawen Jlassi' }],
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

interface Reservation {
  id: number
  eventId: number
  eventTitle: string
  eventDate: string
  eventLocation: string
  userId: number
  userName: string
  reservationDate: string
  status: ReservationStatus
}

// ─── Static reservations list (pre-populated) ─────────────────────────────────
let nextResId = 10
const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 1,
    eventId: 1,
    eventTitle: 'React Summit 2025 [Test]',
    eventDate: '2025-09-15',
    eventLocation: 'Amphi Tunis',
    userId: 42,
    userName: 'Farah Mansouri',
    reservationDate: '2025-07-01',
    status: 'CONFIRMED',
  },
  {
    id: 2,
    eventId: 2,
    eventTitle: 'Workshop Docker & Kubernetes [Test]',
    eventDate: '2025-08-22',
    eventLocation: 'Salle 204 Sfax',
    userId: 42,
    userName: 'Farah Mansouri',
    reservationDate: '2025-07-03',
    status: 'PENDING',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<ReservationStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'En attente',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: <Clock size={14} />,
  },
  CONFIRMED: {
    label: 'Confirmé',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    icon: <BadgeCheck size={14} />,
  },
  CANCELLED: {
    label: 'Annulé',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    icon: <XCircle size={14} />,
  },
}

const CATEGORY_COLORS: Record<string, string> = {
  Technologie: 'bg-violet-500/10 text-violet-400',
  Formation: 'bg-blue-500/10 text-blue-400',
  Atelier: 'bg-cyan-500/10 text-cyan-400',
  Conférence: 'bg-orange-500/10 text-orange-400',
  Networking: 'bg-pink-500/10 text-pink-400',
}

function formatDate(d: string) {
  if (!d || d === 'N/A') return 'À définir'
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return d
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

type View = 'events' | 'reservations'

export default function ReservationsPage() {
  const [view, setView] = useState<View>('events')
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS)

  // Real data state
  const [events, setEvents] = useState<Event[]>([])
  const [organizers, setOrganizers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  // Reserve modal state
  const [reservingEventId, setReservingEventId] = useState<number | null>(null)
  const [reserveEventIdInput, setReserveEventIdInput] = useState('')
  const [reserveSuccess, setReserveSuccess] = useState<string | null>(null)
  const [reserveError, setReserveError] = useState<string | null>(null)

  // ── Fetch real data from microservices ──────────────────────────────────────
  const loadRealData = async () => {
    setLoading(true)
    setErrorMsg(null)
    setUsingFallback(false)
    try {
      // 1. Fetch organizers list (users-service)
      try {
        const orgs = await userService.getOrganizers()
        setOrganizers(orgs)
      } catch (err) {
        console.warn('Could not load organizers from users-service:', err)
      }

      // 2. Fetch all events (events-service)
      const realEvents = await eventService.getAllEvents()
      setEvents(realEvents)
    } catch (err) {
      console.error('Could not fetch events from gateway/backend:', err)
      setErrorMsg('Impossible de charger les événements réels du backend. Chargement des données de test.')
      setUsingFallback(true)
      setEvents(BACKUP_EVENTS as Event[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRealData()
  }, [])

  // Create lookup for organizers names
  const organizerMap = useMemo(() => {
    const map = new Map<string, string>()
    organizers.forEach((o) => {
      const name = `${o.firstName ?? ''} ${o.lastName ?? ''}`.trim()
      map.set(o.id, name || o.username)
    })
    return map
  }, [organizers])

  // ── Reserve action ──────────────────────────────────────────────────────────
  const handleReserve = (event: Event) => {
    if (!event.id) return
    if (event.status !== 'ACTIVE' || event.availablePlaces === 0) return
    setReservingEventId(event.id)
    setReserveEventIdInput(String(event.id))
    setReserveSuccess(null)
    setReserveError(null)
  }

  const confirmReservation = (event: Event) => {
    if (!event.id) return
    const idNum = parseInt(reserveEventIdInput, 10)
    if (isNaN(idNum) || idNum !== event.id) {
      setReserveError("L'ID de l'événement ne correspond pas. Veuillez vérifier.")
      return
    }

    const alreadyReserved = reservations.some(
      (r) => r.eventId === event.id && r.status !== 'CANCELLED',
    )
    if (alreadyReserved) {
      setReserveError('Vous avez déjà une réservation active pour cet événement.')
      return
    }

    // Schedule extraction
    const firstSchedule = event.schedules && event.schedules.length > 0 ? event.schedules[0] : null
    const eventDate = firstSchedule?.date ?? 'N/A'
    const eventLocation = firstSchedule?.room ?? 'À définir'

    const newReservation: Reservation = {
      id: nextResId++,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: eventDate,
      eventLocation: eventLocation,
      userId: 42,
      userName: 'Farah Mansouri',
      reservationDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
    }
    setReservations((prev) => [newReservation, ...prev])
    setReserveSuccess(`Réservation créée avec succès pour « ${event.title} » ! (ID: ${newReservation.id})`)
    setReserveError(null)
    setTimeout(() => {
      setReservingEventId(null)
      setReserveSuccess(null)
    }, 2500)
  }

  const cancelReservation = (id: number) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r)),
    )
  }

  const acceptReservation = (id: number) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'CONFIRMED' } : r)),
    )
  }

  return (
    <div className="p-6 min-h-screen">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ClipboardList className="text-orbit-primary" />
            Réservations — Farah
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {view === 'events'
              ? 'Parcourez les événements disponibles en direct de Ms-Event et réservez.'
              : 'Gérez toutes les réservations, changez leur statut.'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {view === 'events' && (
            <button
              onClick={loadRealData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors shadow"
              title="Rafraîchir les événements"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          )}

          <button
            onClick={() => setView(view === 'events' ? 'reservations' : 'events')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              view === 'reservations'
                ? 'bg-orbit-primary text-white hover:bg-orbit-primary-light'
                : 'bg-slate-800 border border-orbit-primary/50 text-orbit-primary-light hover:bg-orbit-primary/10'
            }`}
            id="toggle-reservations-btn"
          >
            {view === 'events' ? (
              <>
                <ClipboardList size={16} />
                Voir les réservations
                {reservations.length > 0 && (
                  <span className="ml-1 bg-orbit-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {reservations.length}
                  </span>
                )}
              </>
            ) : (
              <>
                <ArrowLeft size={16} />
                Retour aux événements
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── NOTIFICATIONS / ERROR MESSAGES ─────────────────────────────────── */}
      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl p-4 text-sm max-w-4xl">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Note de Test</p>
            <p className="text-slate-300 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ── EVENTS TABLE ───────────────────────────────────────────────────── */}
      {view === 'events' && (
        <div className="bg-slate-900/60 border border-orbit-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-orbit-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-orbit-primary-light" />
              <span className="font-semibold text-slate-200 text-sm">
                Liste des événements {loading ? '...' : `(${events.length})`}
              </span>
            </div>
            {usingFallback && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                Données locales
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="text-orbit-primary animate-spin" />
              <p className="text-sm text-slate-500">Chargement des événements réels...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              Aucun événement disponible actuellement.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-orbit-border bg-slate-900/40">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Événement</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Catégorie</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lieu</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Places</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, idx) => {
                    const isActive = event.status === 'ACTIVE' && event.availablePlaces > 0
                    const isReserving = reservingEventId === event.id

                    // Extract schedule details
                    const firstSchedule = event.schedules && event.schedules.length > 0 ? event.schedules[0] : null
                    const eventDate = firstSchedule?.date ?? 'N/A'
                    const eventLocation = firstSchedule?.room ?? 'À définir'
                    const organizerName = organizerMap.get(event.organizerId) ?? `Organisateur (${event.organizerId})`

                    return (
                      <React.Fragment key={event.id ?? idx}>
                        {/* ── Main row ── */}
                        <tr
                          className={`border-b border-orbit-border/50 transition-colors ${
                            isReserving ? 'bg-orbit-primary/5' : idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'
                          } hover:bg-white/5`}
                        >
                          {/* ID */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 font-mono text-slate-500 text-xs">
                              <Hash size={11} />
                              {event.id}
                            </span>
                          </td>

                          {/* Title + description */}
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <p className="font-semibold text-slate-100 truncate">{event.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate" title={event.description}>
                                {event.description || 'Aucune description disponible.'}
                              </p>
                              <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                                <span className="text-slate-500">Organisateur:</span> {organizerName}
                              </p>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wide ${
                                CATEGORY_COLORS[event.category] ?? 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {event.category || 'Général'}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1.5 text-slate-300 text-xs whitespace-nowrap">
                              <Calendar size={13} className="text-slate-500" />
                              {formatDate(eventDate)}
                            </span>
                          </td>

                          {/* Location */}
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1.5 text-slate-400 text-xs whitespace-nowrap">
                              <MapPin size={13} className="text-slate-500" />
                              {eventLocation}
                            </span>
                          </td>

                          {/* Places */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Users size={13} className="text-slate-500" />
                              <div>
                                <span
                                  className={`text-xs font-bold ${
                                    event.availablePlaces === 0
                                      ? 'text-red-400'
                                      : event.availablePlaces < 20
                                      ? 'text-amber-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  {event.availablePlaces}
                                </span>
                                <span className="text-xs text-slate-600"> / {event.maxPlaces}</span>
                                {/* mini progress bar */}
                                <div className="w-16 h-1 mt-1 rounded-full bg-slate-700 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      event.availablePlaces === 0
                                        ? 'bg-red-500'
                                        : event.availablePlaces < 20
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{
                                      width: `${
                                        ((event.maxPlaces - event.availablePlaces) / event.maxPlaces) * 100
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status badge */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${
                                event.status === 'ACTIVE'
                                  ? event.availablePlaces === 0
                                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : event.status === 'COMPLET'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                  : 'bg-slate-700/50 text-slate-400 border-slate-600/30'
                              }`}
                            >
                              {event.availablePlaces === 0 && event.status === 'ACTIVE' ? (
                                <><XCircle size={11} /> COMPLET</>
                              ) : event.status === 'ACTIVE' ? (
                                <><CheckCircle2 size={11} /> ACTIF</>
                              ) : (
                                <><XCircle size={11} /> {event.status}</>
                              )}
                            </span>
                          </td>

                          {/* Reserve button */}
                          <td className="px-6 py-4 text-right">
                            {!isReserving ? (
                              <button
                                id={`reserve-btn-${event.id}`}
                                onClick={() => handleReserve(event)}
                                disabled={!isActive}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                  isActive
                                    ? 'bg-orbit-primary text-white hover:bg-orbit-primary-light shadow-lg hover:shadow-orbit-primary/30 hover:scale-105'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                                }`}
                              >
                                <Ticket size={13} />
                                {isActive ? 'Réserver' : 'Indisponible'}
                              </button>
                            ) : (
                              <button
                                onClick={() => setReservingEventId(null)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
                              >
                                Annuler
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* ── Inline reservation form row ── */}
                        {isReserving && (
                          <tr className="border-b border-orbit-primary/20 bg-orbit-primary/5">
                            <td colSpan={8} className="px-6 py-5">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-orbit-primary/20 flex items-center justify-center">
                                    <Hash size={16} className="text-orbit-primary-light" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-400 mb-1">
                                      Confirmez l'ID de l'événement pour réserver
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <input
                                        id={`event-id-input-${event.id}`}
                                        type="number"
                                        value={reserveEventIdInput}
                                        onChange={(e) => setReserveEventIdInput(e.target.value)}
                                        placeholder="ID événement"
                                        className="w-32 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-white text-sm outline-none focus:border-orbit-primary font-mono"
                                      />
                                      <button
                                        id={`confirm-reserve-btn-${event.id}`}
                                        onClick={() => confirmReservation(event)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orbit-primary text-white text-sm font-bold hover:bg-orbit-primary-light transition-all shadow hover:shadow-orbit-primary/30"
                                      >
                                        <CheckCircle2 size={15} />
                                        Confirmer
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Feedback messages */}
                                {reserveError && (
                                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
                                    <AlertCircle size={13} />
                                    {reserveError}
                                  </div>
                                )}
                                {reserveSuccess && (
                                  <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-lg animate-pulse">
                                    <BadgeCheck size={13} />
                                    {reserveSuccess}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── RESERVATIONS LIST ──────────────────────────────────────────────── */}
      {view === 'reservations' && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {(
              [
                { status: 'PENDING', label: 'En attente', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                { status: 'CONFIRMED', label: 'Confirmées', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                { status: 'CANCELLED', label: 'Annulées', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
              ] as const
            ).map(({ status, label, color, bg }) => (
              <div
                key={status}
                className={`rounded-xl border p-4 flex items-center justify-between ${bg}`}
              >
                <div>
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>
                    {reservations.filter((r) => r.status === status).length}
                  </p>
                </div>
                <div className={`${color} opacity-60`}>
                  {STATUS_META[status].icon && (
                    <span className="scale-150 block">
                      {status === 'PENDING' ? <Clock size={22} /> : status === 'CONFIRMED' ? <BadgeCheck size={22} /> : <XCircle size={22} />}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-slate-900/60 border border-orbit-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-orbit-border flex items-center gap-2">
              <ClipboardList size={16} className="text-orbit-primary-light" />
              <span className="font-semibold text-slate-200 text-sm">
                Toutes les réservations ({reservations.length})
              </span>
            </div>

            {reservations.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
                Aucune réservation pour l'instant.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orbit-border bg-slate-900/40">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Rés.</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Événement</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Événement</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisateur</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date réservation</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((res, idx) => {
                      const meta = STATUS_META[res.status]
                      return (
                        <tr
                          key={res.id}
                          className={`border-b border-orbit-border/50 transition-colors hover:bg-white/5 ${
                            idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'
                          }`}
                        >
                          {/* Reservation ID */}
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                              <Hash size={11} />
                              {res.id}
                            </span>
                          </td>

                          {/* Event info */}
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-100">{res.eventTitle}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDate(res.eventDate)}
                              <span className="mx-1">·</span>
                              <MapPin size={10} />
                              {res.eventLocation}
                            </p>
                          </td>

                          {/* Event ID */}
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs bg-orbit-primary/10 text-orbit-primary-light px-2 py-1 rounded border border-orbit-primary/20">
                              #{res.eventId}
                            </span>
                          </td>

                          {/* User */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                {res.userName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs text-slate-200 font-medium">{res.userName}</p>
                                <p className="text-[10px] text-slate-600 font-mono">ID: {res.userId}</p>
                              </div>
                            </div>
                          </td>

                          {/* Reservation date */}
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-400">{formatDate(res.reservationDate)}</span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${meta.bg} ${meta.color}`}
                            >
                              {meta.icon}
                              {meta.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {res.status !== 'CONFIRMED' && res.status !== 'CANCELLED' && (
                                <button
                                  id={`accept-res-${res.id}`}
                                  onClick={() => acceptReservation(res.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all hover:scale-105"
                                  title="Accepter la réservation"
                                >
                                  <CheckCircle2 size={13} />
                                  Accepter
                                </button>
                              )}
                              {res.status !== 'CANCELLED' && (
                                <button
                                  id={`cancel-res-${res.id}`}
                                  onClick={() => cancelReservation(res.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all hover:scale-105"
                                  title="Annuler la réservation"
                                >
                                  <XCircle size={13} />
                                  Annuler
                                </button>
                              )}
                              {res.status === 'CANCELLED' && (
                                <span className="text-xs text-slate-600 italic">Aucune action</span>
                              )}
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
      )}
    </div>
  )
}
