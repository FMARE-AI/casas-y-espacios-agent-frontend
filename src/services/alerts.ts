import apiClient from '../lib/axios'
import type { BehaviorAlert, PaginatedAlerts } from '../types'

export const alertsService = {

  async list(params?: {
    reviewed?: boolean
    advisor_id?: string
    limit?: number
    offset?: number
  }): Promise<PaginatedAlerts> {
    const { data } = await apiClient.get('/api/v1/panel/behavior-alerts', { params })
    return data.data
  },

  async markReviewed(id: string): Promise<{ alert: BehaviorAlert }> {
    const { data } = await apiClient.patch(
      `/api/v1/panel/behavior-alerts/${id}/review`
    )
    return data.data
  },
}
