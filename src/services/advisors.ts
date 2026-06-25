import apiClient from '../lib/axios'
import type { Advisor, AvailabilityStatus } from '../types'

type UpdateMeData = { full_name?: string; current_password?: string; new_password?: string; avatar_url?: string; must_change_password?: boolean }
type AdvisorListParams = { role?: string; area?: string; is_active?: boolean }

type CreateAdvisorData = {
  email: string
  password: string
  full_name: string
  role: string
  area: string
  specialty?: string | null
  max_conversations?: number
}

type UpdateAdvisorData = {
  full_name?: string
  role?: string
  area?: string
  specialty?: string | null
  max_conversations?: number
  is_active?: boolean
}

export const advisorsService = {

  async getMe(): Promise<{ advisor: Advisor }> {
    const { data } = await apiClient.get('/api/v1/panel/advisors/me')
    return data.data
  },

  async updateMe(data: UpdateMeData): Promise<{ advisor: Advisor }> {
    const response = await apiClient.patch('/api/v1/panel/advisors/me', data)
    return response.data.data
  },

  async updateAvailability(status: AvailabilityStatus, minutes?: number | null): Promise<{ availability_status: AvailabilityStatus }> {
    const { data } = await apiClient.patch('/api/v1/panel/advisors/me/availability', {
      availability_status: status,
      minutes: minutes ?? null,
    })
    return data.data
  },

  async list(params?: AdvisorListParams): Promise<{ advisors: Advisor[] }> {
    const { data } = await apiClient.get('/api/v1/panel/advisors', { params })
    return data.data
  },

  async create(payload: CreateAdvisorData): Promise<{ advisor: Advisor }> {
    const { data } = await apiClient.post('/api/v1/panel/advisors', payload)
    return data.data
  },

  async update(id: string, payload: UpdateAdvisorData): Promise<{ advisor: Advisor; warning?: string | null }> {
    const { data } = await apiClient.patch(`/api/v1/panel/advisors/${id}`, payload)
    return data.data
  },
}
