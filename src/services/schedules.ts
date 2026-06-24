import type { AdvisorSchedule } from '../types'

const MOCK_SCHEDULES: AdvisorSchedule[] = []

export const schedulesService = {

  async list(): Promise<{ schedules: AdvisorSchedule[] }> {
    // TODO: integrate GET /schedules/
    return { schedules: MOCK_SCHEDULES }
  },

  async create(payload: {
    label: string
    start_time: string
    end_time: string
    days_of_week: number[]
  }): Promise<{ schedule: AdvisorSchedule }> {
    // TODO: integrate POST /schedules/
    const schedule: AdvisorSchedule = {
      id: `mock-${Date.now()}`,
      label: payload.label,
      start_time: payload.start_time,
      end_time: payload.end_time,
      days_of_week: payload.days_of_week,
      is_active: true,
    }
    return { schedule }
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
    // TODO: integrate PATCH /schedules/{id}
    const schedule: AdvisorSchedule = {
      id,
      label: payload.label ?? '',
      start_time: payload.start_time ?? '00:00',
      end_time: payload.end_time ?? '00:00',
      days_of_week: payload.days_of_week ?? [],
      is_active: payload.is_active ?? true,
    }
    return { schedule }
  },

  async delete(_id: string): Promise<void> {
    // TODO: integrate DELETE /schedules/{id}
  },
}
