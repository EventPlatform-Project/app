import api from '@/lib/api'
import { Event, Schedule } from '../types/event'

// All requests go through the central `api` axios instance, which automatically
// prefixes the gateway URL and attaches the current Keycloak Bearer token.
const EVENTS = '/api/events'

export const eventService = {
  // Récupérer tous les événements
  getAllEvents: async (): Promise<Event[]> => {
    const response = await api.get(`${EVENTS}/all`)
    return response.data
  },

  // Créer un événement
  createEvent: async (event: Event): Promise<Event> => {
    const response = await api.post(`${EVENTS}/create`, event)
    return response.data
  },

  // Détails d'un événement
  getEventDetails: async (id: number): Promise<Event> => {
    const response = await api.get(`${EVENTS}/${id}`)
    return response.data
  },

  // Supprimer un événement
  deleteEvent: async (id: number): Promise<string> => {
    const response = await api.delete(`${EVENTS}/${id}`)
    return response.data
  },

  // Ajouter un programme (Schedule)
  addSchedule: async (eventId: number, schedule: Schedule): Promise<Schedule> => {
    const response = await api.post(`${EVENTS}/${eventId}/schedules`, schedule)
    return response.data
  },
}
