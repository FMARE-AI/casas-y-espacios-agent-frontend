import apiClient from '../lib/axios'
import type { BehaviorAlert, PaginatedAlerts } from '../types'

type AlertListParams = { reviewed?: boolean; advisor_id?: string; limit?: number; offset?: number }

export const alertsService = {

  async list(params?: AlertListParams): Promise<PaginatedAlerts> {
    const { data } = await apiClient.get('/api/v1/panel/behavior-alerts/', { params })
    return data.data
  },

  async markReviewed(alertId: string): Promise<{ alert: BehaviorAlert }> {
    const { data } = await apiClient.patch(`/api/v1/panel/behavior-alerts/${alertId}/review`)
    return data.data
  },
}

