import apiClient from '../lib/axios'
import type { Advisor, AvailabilityStatus } from '../types'

export const advisorsService = {

  async getMe(): Promise<{ advisor: Advisor }> {
    const { data } = await apiClient.get('/api/v1/panel/advisors/me')
    return data.data
  },

  async updateMe(payload: {
    full_name?: string
    current_password?: string
    new_password?: string
  }): Promise<{ advisor: Advisor }> {
    const { data } = await apiClient.patch('/api/v1/panel/advisors/me', payload)
    return data.data
  },

  async updateAvailability(
    status: AvailabilityStatus,
    minutesUntil?: number | null
  ): Promise<{ availability_status: AvailabilityStatus }> {
    const { data } = await apiClient.patch(
      '/api/v1/panel/advisors/me/availability',
      { availability_status: status, minutes_until: minutesUntil ?? null }
    )
    return data.data
  },

  async list(params?: {
    role?: string
    area?: string
    is_active?: boolean
  }): Promise<{ advisors: Advisor[] }> {
    const { data } = await apiClient.get('/api/v1/panel/advisors', { params })
    return data.data
  },

  async create(payload: {
    email: string
    password: string
    full_name: string
    role: string
    area: string
    max_conversations: number
  }): Promise<{ advisor: Advisor }> {
    const { data } = await apiClient.post('/api/v1/panel/advisors', payload)
    return data.data
  },

  async update(
    id: string,
    payload: {
      full_name?: string
      role?: string
      area?: string
      max_conversations?: number
      is_active?: boolean
    }
  ): Promise<{ advisor: Advisor }> {
    const { data } = await apiClient.patch(`/api/v1/panel/advisors/${id}`, payload)
    return data.data
  },
}
