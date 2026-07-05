import api from '@/lib/api'

// Event type mirrors the Ms-Event Event entity as returned via users-service.
// Kept local to avoid a circular import with @/types/event (same shape).
export interface UserEvent {
  id: number
  title: string
  description: string
  category: string
  maxPlaces: number
  availablePlaces: number
  organizerId: string
  status: string
  schedules?: unknown[]
}

export type UserRole = 'ADMINISTRATEUR' | 'ORGANISATEUR' | 'PARTICIPANT'

export interface UserProfile {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
  createdAt?: string
}

/**
 * Lightweight user representation returned by GET /api/users/organizers.
 * Safe to display to any authenticated user (no email / timestamps).
 */
export interface UserSummary {
  id: string
  username: string
  firstName?: string
  lastName?: string
  role: UserRole
}

export interface UserUpdateRequest {
  firstName?: string
  lastName?: string
}

const USERS = '/api/users'

export const userService = {
  /** Current user profile from the local users-service DB. */
  getMyProfile: async (): Promise<UserProfile> => {
    const { data } = await api.get<UserProfile>(`${USERS}/profile`)
    return data
  },

  updateMyProfile: async (body: UserUpdateRequest): Promise<UserProfile> => {
    const { data } = await api.put<UserProfile>(`${USERS}/profile`, body)
    return data
  },

  /** Admin-only: list all users. */
  getAllUsers: async (): Promise<UserProfile[]> => {
    const { data } = await api.get<UserProfile[]>(USERS)
    return data
  },

  /**
   * Lightweight list of users allowed to organize events (ORGANISATEUR + ADMINISTRATEUR).
   * Accessible to any authenticated user; used to populate the organizer picker
   * when creating an event.
   */
  getOrganizers: async (): Promise<UserSummary[]> => {
    const { data } = await api.get<UserSummary[]>(`${USERS}/organizers`)
    return data
  },

  /**
   * Events organized by the currently authenticated user.
   * Delegates to users-service GET /api/users/events, which itself calls the
   * events microservice via Feign (with JWT propagated).
   * <p>
   * Returns an empty array when the user organizes no events (users-service
   * normalizes the events-service 404 into an empty list on the backend).
   */
  getMyEvents: async (): Promise<UserEvent[]> => {
    const { data } = await api.get<UserEvent[]>(`${USERS}/events`)
    return data
  },

  /**
   * Ensure a local UserEntity exists for the currently authenticated Keycloak user.
   * Safe to call on every login. Returns the (possibly newly-created) local profile.
   */
  syncCurrentUser: async (): Promise<UserProfile> => {
    const { data } = await api.post<UserProfile>(`${USERS}/sync`)
    return data
  },
}
