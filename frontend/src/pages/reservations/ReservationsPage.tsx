import React, { useEffect, useState, useMemo } from 'react'
import {
  Calendar,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { eventService } from '@/services/eventService'
import { userService, type UserSummary, type UserProfile } from '@/services/userService'
import { reservationService, type ReservationResponse } from '@/services/reservationService'
import { useAuth } from '@/auth/AuthContext'
import type { Event } from '@/types/event'

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: { label: 'En attente', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: <Clock size={14} /> },
  CONFIRMED: { label: 'Confirmé', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 size={14} /> },
  CANCELLED: { label: 'Annulé', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <XCircle size={14} /> },
}

function formatDate(d: string | undefined) {
  if (!d || d === 'N/A') return 'À définir'
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return d }
}

export default function ReservationsPage() {
  const { user, hasRole } = useAuth()
  const [view, setView] = useState<'events' | 'reservations'>('events')
  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [reservingEventId, setReservingEventId] = useState<number | null>(null)
  const [reserveSuccess, setReserveSuccess] = useState<string | null>(null)
  const [reserveError, setReserveError] = useState<string | null>(null)

  const fetchReservations = async () => {
  if (!user?.id) return;
  try {
    let data: ReservationResponse[] = [];
    
    // Si Admin, on essaie de tout récupérer
    if (hasRole('ADMINISTRATEUR')) {
      data = await reservationService.getAllReservations();
    } else {
      // Sinon juste pour l'utilisateur
      data = await reservationService.getReservationsByUser(user.id);
    }
    
    console.log("Réservations reçues :", data); // <--- AJOUTE CE LOG pour déboguer
    setReservations(data);
  } catch (err) {
    console.error("Erreur fetchReservations:", err);
    setErrorMsg('Erreur lors du chargement des réservations');
  }
};

  const loadRealData = async () => {
    setLoading(true)
    try {
      const realEvents = await eventService.getAllEvents()
      setEvents(realEvents)
      if (hasRole('ADMINISTRATEUR')) {
        const allUsers = await userService.getAllUsers()
        setUsers(allUsers)
      }
      await fetchReservations()
    } catch (err) { setErrorMsg('Erreur backend') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (user?.id) loadRealData() }, [user?.id])

  const userMap = useMemo(() => {
    const map = new Map<string, string>()
    users.forEach((u) => map.set(u.id, `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.username))
    return map
  }, [users])

  const confirmReservation = async (event: Event) => {
    if (!event.id || !user?.id) return
    try {
      setReserveError(null)
      // FIX : Envoi de l'ID utilisateur pour éviter l'erreur 400
      const newRes = await reservationService.createReservation({ 
        eventId: event.id, 
        userId: user.id 
      })
      setReserveSuccess(`Réservé ! ID: ${newRes.id}`)
      await fetchReservations()
      setTimeout(() => { setReservingEventId(null); setReserveSuccess(null) }, 2000)
    } catch (err: any) {
      setReserveError(err.response?.data?.error || 'Erreur réservation')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-8">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ClipboardList /> Réservations
        </h1>
        <button onClick={() => setView(view === 'events' ? 'reservations' : 'events')} className="bg-orbit-primary px-4 py-2 rounded-lg text-white text-sm">
          {view === 'events' ? 'Mes Réservations' : 'Événements'}
        </button>
      </div>

      {view === 'events' ? (
        <div className="bg-slate-900 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="p-4">Événement</th>
                <th className="p-4">Places</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <React.Fragment key={ev.id}>
                  <tr className="border-b border-slate-800 text-white">
                    <td className="p-4">{ev.title}</td>
                    <td className="p-4">{ev.availablePlaces}/{ev.maxPlaces}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setReservingEventId(ev.id!)} className="bg-orbit-primary px-3 py-1 rounded text-xs">Réserver</button>
                    </td>
                  </tr>
                  {reservingEventId === ev.id && (
                    <tr className="bg-slate-800/50">
                      <td colSpan={3} className="p-4">
                        <button onClick={() => confirmReservation(ev)} className="bg-emerald-600 px-4 py-1 rounded text-xs text-white mr-4">Confirmer</button>
                        <button onClick={() => setReservingEventId(null)} className="text-slate-400 text-xs">Annuler</button>
                        {reserveError && <span className="text-red-400 ml-4 text-xs">{reserveError}</span>}
                        {reserveSuccess && <span className="text-emerald-400 ml-4 text-xs">{reserveSuccess}</span>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Événement</th>
                <th className="p-4">Date Réservation</th>
                <th className="p-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res) => (
                <tr key={res.id} className="border-b border-slate-800 text-white">
                  <td className="p-4 text-slate-500">#{res.id}</td>
                  <td className="p-4">{events.find(e => e.id === res.eventId)?.title || res.eventId}</td>
                  <td className="p-4 text-slate-400">{formatDate(res.createdAt)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] ${STATUS_META[res.status]?.bg} ${STATUS_META[res.status]?.color}`}>
                      {STATUS_META[res.status]?.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
