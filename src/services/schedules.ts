import apiClient from '../lib/axios'
import { AxiosError } from 'axios'
import type { AdvisorSchedule } from '../types'

export interface CreateScheduleData {
  label: string
  start_time: string
  end_time: string
  days_of_week: number[]
}

export interface UpdateScheduleData {
  label?: string
  start_time?: string
  end_time?: string
  days_of_week?: number[]
  is_active?: boolean
}

const BASE = '/api/v1/panel/schedules'

export function getScheduleErrorCode(err: unknown): string | null {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
      return (detail as { code?: string }).code ?? null
    }
  }
  return null
}

export const schedulesService = {
  async list(): Promise<{ schedules: AdvisorSchedule[] }> {
    const { data } = await apiClient.get(`${BASE}/`)
    return data.data
  },

  async create(payload: CreateScheduleData): Promise<{ schedule: AdvisorSchedule }> {
    const { data } = await apiClient.post(`${BASE}/`, payload)
    return data.data
  },

  async update(id: string, payload: UpdateScheduleData): Promise<{ schedule: AdvisorSchedule }> {
    const { data } = await apiClient.patch(`${BASE}/${id}`, payload)
    return data.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`)
  },
}
