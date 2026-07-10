import api from '@/lib/api'

export interface TicketResponse {
  id: number
  reservationId: number
  userId: string // Changé en string pour correspondre à Keycloak/Backend
  eventId: number
  ticketNumber: string
  qrCode: string
  status: 'VALID' | 'USED' | 'CANCELLED' | string
  generatedAt: string
  usedAt?: string | null
}

const TICKETS = '/api/tickets'

export const ticketService = {
  // Récupérer tous les tickets d'un utilisateur
  getTicketsByUser: async (userId: string | number): Promise<TicketResponse[]> => {
    const response = await api.get<TicketResponse[]>(`${TICKETS}/user/${userId}`)
    return response.data
  },

  // Créer (générer) un nouveau ticket manuel pour le test
  createTicket: async (data: any): Promise<TicketResponse> => {
    const response = await api.post<TicketResponse>(`${TICKETS}/create`, data)
    return response.data
  },

  // Récupérer un ticket par son ID
  getTicketById: async (id: number): Promise<TicketResponse> => {
    const response = await api.get<TicketResponse>(`${TICKETS}/${id}`)
    return response.data
  },

  // Récupérer le ticket lié à une réservation
  getTicketByReservation: async (reservationId: number): Promise<TicketResponse> => {
    const response = await api.get<TicketResponse>(`${TICKETS}/reservation/${reservationId}`)
    return response.data
  },

  // Marquer un ticket comme utilisé
  useTicket: async (id: number): Promise<TicketResponse> => {
    const response = await api.put<TicketResponse>(`${TICKETS}/${id}/use`)
    return response.data
  },

  // URL pour voir le ticket visuel
  getViewUrl: (id: number): string => {
    const base = api.defaults.baseURL ?? ''
    return `${base}${TICKETS}/${id}/view`
  },

  // URL directe du QR code
  getQrCodeUrl: (id: number): string => {
    const base = api.defaults.baseURL ?? ''
    return `${base}${TICKETS}/${id}/qrcode`
  },
}
