import type { AdvisorSchedule } from '../types'

type CreateScheduleData = { label: string; start_time: string; end_time: string; days_of_week: number[] }
type UpdateScheduleData = { label?: string; start_time?: string; end_time?: string; days_of_week?: number[]; is_active?: boolean }

export const schedulesService = {

  async list(): Promise<{ schedules: AdvisorSchedule[] }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 10')
  },

  async create(_data: CreateScheduleData): Promise<{ schedule: AdvisorSchedule }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 10')
  },

  async update(_id: string, _data: UpdateScheduleData): Promise<{ schedule: AdvisorSchedule }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 10')
  },

  async remove(_id: string): Promise<void> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 10')
  },
}
