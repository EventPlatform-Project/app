import React, { useEffect, useMemo, useState } from 'react'
import {
  Ticket as TicketIcon,
  Hash,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  Filter,
  Calendar,
  X, // Pour fermer la modal
} from 'lucide-react'
import { ticketService, type TicketResponse } from '../../services/ticketService'
import { eventService } from '@/services/eventService'
import { reservationService, type ReservationResponse } from '@/services/reservationService'
import type { Event as EventItem } from '@/types/event'
import { useAuth } from '@/auth/AuthContext'

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  VALID: {
    label: 'Valide',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    icon: <CheckCircle2 size={14} />,
  },
  USED: {
    label: 'Utilisé',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: <Clock size={14} />,
  },
  CANCELLED: {
    label: 'Annulé',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    icon: <XCircle size={14} />,
  },
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return d
  }
}

export default function TicketsPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // "Ticket by event" filter — populated from ms-event.
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | 'ALL'>('ALL')

  // États pour la Modal du QR code
  const [selectedTicket, setSelectedTicket] = useState<TicketResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // États pour la modale "Ajouter un ticket" (choix de la réservation)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [reservationsLoading, setReservationsLoading] = useState(false)
  const [reservationsError, setReservationsError] = useState<string | null>(null)
  const [pickedReservationId, setPickedReservationId] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const loadTickets = async () => {
    if (!user?.id) {
      setTickets([])
      setLoading(false)
      return
    }
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await ticketService.getTicketsByUser(user.id)
      setTickets(data)
    } catch (err) {
      console.error('Erreur lors du chargement des tickets :', err)
      setErrorMsg('Impossible de charger vos tickets depuis le backend.')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * Open the "Ajouter un ticket" modal. Uses feign-backed
   * GET /api/reservations/user/{userId} to list the current user's
   * reservations so they can pick which one to generate a ticket for.
   */
  const openAddModal = async () => {
    if (!user?.id) return
    setIsAddOpen(true)
    setPickedReservationId(null)
    setGenerateError(null)
    setReservationsError(null)
    setReservationsLoading(true)
    try {
      const list = await reservationService.getReservationsByUser(user.id)
      setReservations(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('[tickets] failed to load reservations', err)
      setReservationsError('Impossible de charger vos réservations.')
      setReservations([])
    } finally {
      setReservationsLoading(false)
    }
  }

  const closeAddModal = () => {
    if (generating) return
    setIsAddOpen(false)
    setPickedReservationId(null)
    setGenerateError(null)
  }

  const handleGenerateTicket = async () => {
    if (!pickedReservationId) return
    setGenerating(true)
    setGenerateError(null)
    try {
      await ticketService.generateFromReservation(pickedReservationId)
      await loadTickets()
      setIsAddOpen(false)
      setPickedReservationId(null)
    } catch (err) {
      const anyErr = err as { response?: { status?: number; data?: unknown } }
      const status = anyErr?.response?.status
      if (status === 400) {
        setGenerateError('Requête invalide. La réservation est-elle annulée ?')
      } else if (status === 401) {
        setGenerateError('Session expirée, veuillez vous reconnecter.')
      } else if (status === 404) {
        setGenerateError('Réservation introuvable.')
      } else {
        setGenerateError('La génération du ticket a échoué.')
      }
      console.error('[tickets] generate failed', err)
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [user?.id])

  // Fetch event list once so the "Ticket by event" menu can label items.
  useEffect(() => {
    let cancelled = false
    eventService
      .getAllEvents()
      .then((list) => {
        if (!cancelled) setEvents(Array.isArray(list) ? list : [])
      })
      .catch((err) => {
        console.warn('[tickets] failed to load events for filter', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Group tickets by eventId — used both for the "by event" dropdown menu
  // and for the counts shown next to each entry.
  const ticketsByEvent = useMemo(() => {
    const map = new Map<number, TicketResponse[]>()
    for (const t of tickets) {
      const arr = map.get(t.eventId) ?? []
      arr.push(t)
      map.set(t.eventId, arr)
    }
    return map
  }, [tickets])

  // Menu options: every event the user has at least one ticket for,
  // fallback-labeled with "#eventId" if the event details couldn't load.
  const eventMenuItems = useMemo(() => {
    const eventById = new Map<number, EventItem>()
    for (const e of events) if (e.id != null) eventById.set(e.id as number, e)
    return Array.from(ticketsByEvent.entries())
      .map(([eventId, list]) => ({
        eventId,
        title: eventById.get(eventId)?.title ?? `Événement #${eventId}`,
        count: list.length,
      }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [ticketsByEvent, events])

  const visibleTickets = useMemo(() => {
    if (selectedEventId === 'ALL') return tickets
    return tickets.filter((t) => t.eventId === selectedEventId)
  }, [tickets, selectedEventId])

  // Set of reservation IDs that already have a ticket — used to disable them
  // in the "pick a reservation" modal so the same reservation can't be picked
  // twice (the backend also enforces this).
  const reservationIdsWithTicket = useMemo(
    () => new Set(tickets.map((t) => t.reservationId)),
    [tickets],
  )

  // Fast lookup of event title by id for the modal.
  const eventTitleById = useMemo(() => {
    const map = new Map<number, string>()
    for (const e of events) if (e.id != null) map.set(e.id as number, e.title ?? '')
    return map
  }, [events])

  const selectedEventTitle =
    selectedEventId === 'ALL'
      ? 'Tous les événements'
      : events.find((e) => e.id === selectedEventId)?.title ??
        `Événement #${selectedEventId}`

  return (
    <div className="p-6 min-h-screen relative">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <TicketIcon className="text-orbit-primary" />
            Mes Tickets
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Consultez vos tickets et leurs QR codes d'accès.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={openAddModal}
            disabled={loading || !user?.id}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orbit-primary hover:bg-orbit-primary-light text-white font-bold transition-all shadow-lg text-sm disabled:opacity-50"
          >
            <Plus size={18} />
            Ajouter un Ticket
          </button>
          <button
            onClick={loadTickets}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm max-w-4xl">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div><p className="font-semibold">Erreur</p><p className="text-slate-300 mt-0.5">{errorMsg}</p></div>
        </div>
      )}

      {/* --- FILTER: Ticket by event --- */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Filter size={14} />
          Ticket par événement
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedEventId('ALL')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              selectedEventId === 'ALL'
                ? 'bg-orbit-primary/20 text-orbit-primary-light border-orbit-primary/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent'
            }`}
          >
            <Calendar size={12} /> Tous
            <span className="ml-1 text-[10px] text-slate-500">({tickets.length})</span>
          </button>
          {eventMenuItems.map((item) => {
            const active = selectedEventId === item.eventId
            return (
              <button
                key={item.eventId}
                type="button"
                onClick={() => setSelectedEventId(item.eventId)}
                title={item.title}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors max-w-[240px] ${
                  active
                    ? 'bg-orbit-primary/20 text-orbit-primary-light border-orbit-primary/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent'
                }`}
              >
                <Calendar size={12} className="flex-shrink-0" />
                <span className="truncate">{item.title}</span>
                <span className="ml-1 text-[10px] text-slate-500 flex-shrink-0">
                  ({item.count})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* --- GRID DES TICKETS --- */}
      <div className="bg-slate-900/60 border border-orbit-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-orbit-border flex items-center gap-2">
          <TicketIcon size={16} className="text-orbit-primary-light" />
          <span className="font-semibold text-slate-200 text-sm">
            {selectedEventTitle} {loading ? '...' : `(${visibleTickets.length})`}
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="text-orbit-primary animate-spin" />
            <p className="text-sm text-slate-500">Chargement...</p>
          </div>
        ) : visibleTickets.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <TicketIcon size={40} className="mx-auto mb-3 opacity-30" />
            {selectedEventId === 'ALL'
              ? 'Aucun ticket. Cliquez sur "Ajouter un Ticket" pour tester.'
              : `Aucun ticket pour ${selectedEventTitle}.`}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {visibleTickets.map((ticket) => {
              const meta = STATUS_META[ticket.status] || STATUS_META.VALID;
              return (
                <div key={ticket.id} className="rounded-xl border border-orbit-border bg-slate-900/40 p-4 flex flex-col gap-3 group hover:border-orbit-primary/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                      <Hash size={11} /> {ticket.ticketNumber}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${meta.bg} ${meta.color} flex items-center gap-1`}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Réservation: <span className="text-slate-200">#{ticket.reservationId}</span></p>
                    <p>Événement: <span className="text-slate-200">#{ticket.eventId}</span></p>
                    <p>Généré le: <span className="text-slate-200">{formatDate(ticket.generatedAt)}</span></p>
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => { setSelectedTicket(ticket); setIsModalOpen(true); }}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-orbit-primary hover:text-white transition-all border border-slate-700"
                    >
                      <QrCode size={14} /> Voir le QR Code
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* --- MODAL AJOUTER UN TICKET (Choix de la réservation) --- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-orbit-border w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-orbit-border">
              <div>
                <h3 className="text-slate-100 font-bold text-lg flex items-center gap-2">
                  <Plus size={18} className="text-orbit-primary-light" />
                  Générer un ticket
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choisissez la réservation pour laquelle générer un ticket.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                disabled={generating}
                aria-label="Fermer"
                className="text-slate-500 hover:text-slate-200 disabled:opacity-40 -mr-1 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
              {reservationsLoading ? (
                <div className="py-10 flex items-center justify-center gap-2 text-slate-500 text-sm">
                  <RefreshCw size={16} className="animate-spin" />
                  Chargement des réservations…
                </div>
              ) : reservationsError ? (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3 text-xs">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{reservationsError}</span>
                </div>
              ) : reservations.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Vous n'avez pas encore de réservation. Créez-en une depuis la
                  page « Réservations » pour pouvoir générer un ticket.
                </div>
              ) : (
                <ul className="space-y-2">
                  {reservations.map((res) => {
                    const already = reservationIdsWithTicket.has(res.id)
                    const cancelled =
                      typeof res.status === 'string' &&
                      res.status.toUpperCase() === 'CANCELLED'
                    const disabled = already || cancelled
                    const active = pickedReservationId === res.id
                    const title = eventTitleById.get(res.eventId) ?? `Événement #${res.eventId}`
                    return (
                      <li key={res.id}>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => setPickedReservationId(res.id)}
                          className={`w-full text-left rounded-xl border p-3 transition-colors ${
                            active
                              ? 'border-orbit-primary/50 bg-orbit-primary/10'
                              : disabled
                              ? 'border-slate-800 bg-slate-900/40 opacity-50 cursor-not-allowed'
                              : 'border-slate-700 bg-slate-900/40 hover:border-orbit-primary/40 hover:bg-slate-900/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-slate-200 text-sm font-semibold truncate">
                                {title}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Réservation #{res.id}
                                {res.seatNumber != null && (
                                  <> · Place {res.seatNumber}</>
                                )}
                                <> · Statut {res.status}</>
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              {already && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  Ticket existant
                                </span>
                              )}
                              {cancelled && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30">
                                  Annulée
                                </span>
                              )}
                              {active && !disabled && (
                                <CheckCircle2 size={16} className="text-orbit-primary-light" />
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {generateError && (
                <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-2.5 text-xs">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{generateError}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-orbit-border bg-slate-900/60">
              <button
                type="button"
                onClick={closeAddModal}
                disabled={generating}
                className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-slate-100 hover:bg-white/5 disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleGenerateTicket}
                disabled={!pickedReservationId || generating}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-orbit-primary hover:bg-orbit-primary-light text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Génération…
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Générer le ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DU TICKET --- */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-orbit-border w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            
            {/* Header Modal */}
            <div className="bg-orbit-primary p-6 text-center relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <TicketIcon className="text-white" size={24} />
              </div>
              <h3 className="text-white font-bold text-lg">Votre Billet Digital</h3>
              <p className="text-white/70 text-xs mt-1">Smart Event Platform</p>
            </div>

            {/* Corps Modal */}
            <div className="p-8 flex flex-col items-center">
              <div className="bg-white p-3 rounded-2xl mb-6 shadow-xl">
                {/* Affichage direct du QR code en Base64 */}
                <img 
                  src={`data:image/png;base64,${selectedTicket.qrCode}`} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>

              <div className="text-center space-y-1 mb-6">
                <p className="text-orbit-primary font-mono font-bold text-xl tracking-widest">
                  {selectedTicket.ticketNumber}
                </p>
                <p className="text-slate-500 text-xs uppercase tracking-tighter">Scannez ce code à l'entrée</p>
              </div>

              <div className="w-full border-t border-dashed border-slate-700 pt-6 space-y-3">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Détenteur</span>
                    <span className="text-slate-200 font-medium">{(user as any)?.name || 'Invité'}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Événement</span>
                    <span className="text-slate-200 font-medium">#{selectedTicket.eventId}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Statut</span>
                    <span className="text-emerald-400 font-bold">VALIDE</span>
                 </div>
              </div>
            </div>

            {/* Footer Modal */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="w-full py-4 bg-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-700 transition-colors border-t border-orbit-border"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}