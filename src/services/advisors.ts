import apiClient from '../lib/axios'
import type { Advisor, AvailabilityStatus } from '../types'

type UpdateMeData = { full_name?: string; current_password?: string; new_password?: string; avatar_url?: string; must_change_password?: boolean }
type AdvisorListParams = { role?: string; area?: string; is_active?: boolean }
type CreateAdvisorData = { email: string; password: string; full_name: string; role: string; area: string; max_conversations?: number }
type UpdateAdvisorData = { full_name?: string; role?: string; area?: string; max_conversations?: number; is_active?: boolean }

export const advisorsService = {

  async getMe(): Promise<{ advisor: Advisor }> {
    const { data } = await apiClient.get('/api/v1/panel/advisors/me')
    return data.data
  },

  async updateMe(_data: UpdateMeData): Promise<{ advisor: Advisor }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 9')
  },

  async updateAvailability(_status: AvailabilityStatus, _minutesUntil?: number | null): Promise<{ availability_status: AvailabilityStatus }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 9')
  },

  async list(_params?: AdvisorListParams): Promise<{ advisors: Advisor[] }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 8')
  },

  async create(_data: CreateAdvisorData): Promise<{ advisor: Advisor }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 8')
  },

  async update(_id: string, _data: UpdateAdvisorData): Promise<{ advisor: Advisor }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 8')
  },
}
