import api from '@/lib/api'

/**
 * Client for the feedback-service microservice (Java/Spring, port 8091).
 * All calls go through the API gateway on /api/feedback and require a JWT.
 */

export interface FeedbackResponse {
  id: number
  userId: string
  username: string | null
  subject: string
  message: string
  rating: number | null
  createdAt: string
}

export interface CreateFeedbackRequest {
  subject: string
  message: string
  /** Optional 1..5 star rating. */
  rating?: number | null
}

const FEEDBACK = '/api/feedback'

export const feedbackService = {
  /** Post a new feedback as the currently authenticated user. */
  create: async (body: CreateFeedbackRequest): Promise<FeedbackResponse> => {
    const { data } = await api.post<FeedbackResponse>(FEEDBACK, body)
    return data
  },

  /** All feedback entries (any authenticated user can browse). */
  list: async (): Promise<FeedbackResponse[]> => {
    const { data } = await api.get<FeedbackResponse[]>(FEEDBACK)
    return data
  },

  /** Feedback authored by the current user only. */
  listMine: async (): Promise<FeedbackResponse[]> => {
    const { data } = await api.get<FeedbackResponse[]>(`${FEEDBACK}/mine`)
    return data
  },

  /** Fetch one entry by id. */
  getById: async (id: number): Promise<FeedbackResponse> => {
    const { data } = await api.get<FeedbackResponse>(`${FEEDBACK}/${id}`)
    return data
  },

  /**
   * Delete a feedback. The backend allows the author or an administrator;
   * anyone else gets a 403.
   */
  remove: async (id: number): Promise<void> => {
    await api.delete(`${FEEDBACK}/${id}`)
  },
}
