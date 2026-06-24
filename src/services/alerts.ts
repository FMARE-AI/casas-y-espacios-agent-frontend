import type { BehaviorAlert, PaginatedAlerts } from '../types'

type AlertListParams = { reviewed?: boolean; advisor_id?: string; limit?: number; offset?: number }

export const alertsService = {

  async list(_params?: AlertListParams): Promise<PaginatedAlerts> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 11')
  },

  async markReviewed(_alertId: string): Promise<{ alert: BehaviorAlert }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 11')
  },
}
