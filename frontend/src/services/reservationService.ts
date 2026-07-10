import api from '@/lib/api'

export interface CreateReservationRequest {
  eventId: number
  userId: string // Changé en string pour matcher Keycloak
}

export interface ReservationResponse {
  id: number
  eventId: number
  userId: string
  createdAt: string // Match le backend Java
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | string
  seatNumber?: number | null
}

const RESERVATIONS = '/api/reservations'

export const reservationService = {
  createReservation: async (request: CreateReservationRequest): Promise<ReservationResponse> => {
    const response = await api.post<ReservationResponse>(RESERVATIONS, request)
    return response.data
  },

  getAllReservations: async (): Promise<ReservationResponse[]> => {
    const response = await api.get<ReservationResponse[]>(RESERVATIONS)
    return response.data
  },

  getReservationsByUser: async (userId: string): Promise<ReservationResponse[]> => {
    const response = await api.get<ReservationResponse[]>(`${RESERVATIONS}/user/${userId}`)
    return response.data
  },

  getReservationsByEvent: async (eventId: number): Promise<ReservationResponse[]> => {
    const response = await api.get<ReservationResponse[]>(`${RESERVATIONS}/event/${eventId}`)
    return response.data
  },

  getReservationById: async (id: number): Promise<ReservationResponse> => {
    const response = await api.get<ReservationResponse>(`${RESERVATIONS}/${id}`)
    return response.data
  },

  confirmReservation: async (id: number): Promise<ReservationResponse> => {
    const response = await api.put<ReservationResponse>(`${RESERVATIONS}/${id}/confirm`)
    return response.data
  },

  cancelReservation: async (id: number): Promise<ReservationResponse> => {
    const response = await api.put<ReservationResponse>(`${RESERVATIONS}/${id}/cancel`)
    return response.data
  },
}