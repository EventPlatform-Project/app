import api from '@/lib/api'

export interface CreateReservationRequest {
  eventId: number
  userId?: number
}

export interface ReservationResponse {
  id: number
  eventId: number
  userId: number
  reservationDate: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | string
}

const RESERVATIONS = '/api/reservations'

export const reservationService = {
  // Créer une réservation
  createReservation: async (request: CreateReservationRequest): Promise<ReservationResponse> => {
    const response = await api.post<ReservationResponse>(RESERVATIONS, request)
    return response.data
  },

  // Récupérer les réservations d'un utilisateur
  getReservationsByUser: async (userId: number): Promise<ReservationResponse[]> => {
    const response = await api.get<ReservationResponse[]>(`${RESERVATIONS}/user/${userId}`)
    return response.data
  },

  // Récupérer les réservations d'un événement
  getReservationsByEvent: async (eventId: number): Promise<ReservationResponse[]> => {
    const response = await api.get<ReservationResponse[]>(`${RESERVATIONS}/event/${eventId}`)
    return response.data
  },

  // Récupérer une réservation par son ID
  getReservationById: async (id: number): Promise<ReservationResponse> => {
    const response = await api.get<ReservationResponse>(`${RESERVATIONS}/${id}`)
    return response.data
  },

  // Confirmer une réservation (Admin / Organisateur)
  confirmReservation: async (id: number): Promise<ReservationResponse> => {
    const response = await api.put<ReservationResponse>(`${RESERVATIONS}/${id}/confirm`)
    return response.data
  },

  // Annuler une réservation (Participant / Admin)
  cancelReservation: async (id: number): Promise<ReservationResponse> => {
    const response = await api.put<ReservationResponse>(`${RESERVATIONS}/${id}/cancel`)
    return response.data
  },
}
