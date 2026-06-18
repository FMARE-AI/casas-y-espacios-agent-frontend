import apiClient from '../lib/axios'
import type { AdvisorSchedule } from '../types'

export const schedulesService = {

  async list(): Promise<{ schedules: AdvisorSchedule[] }> {
    const { data } = await apiClient.get('/api/v1/panel/schedules')
    return data.data
  },

  async create(payload: {
    label: string
    start_time: string
    end_time: string
    days_of_week: number[]
  }): Promise<{ schedule: AdvisorSchedule }> {
    const { data } = await apiClient.post('/api/v1/panel/schedules', payload)
    return data.data
  },

  async update(
    id: string,
    payload: {
      label?: string
      start_time?: string
      end_time?: string
      days_of_week?: number[]
      is_active?: boolean
    }
  ): Promise<{ schedule: AdvisorSchedule }> {
    const { data } = await apiClient.patch(`/api/v1/panel/schedules/${id}`, payload)
    return data.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/panel/schedules/${id}`)
  },
}
