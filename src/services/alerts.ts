import type { BehaviorAlert, PaginatedAlerts } from '../types'

const MOCK_ALERTS: BehaviorAlert[] = []

export const alertsService = {

  async list(_params?: {
    reviewed?: boolean
    advisor_id?: string
    limit?: number
    offset?: number
  }): Promise<PaginatedAlerts> {
    // TODO: integrate GET /behavior-alerts/
    return { alerts: MOCK_ALERTS, total: 0 }
  },

  async markReviewed(_id: string): Promise<{ alert: BehaviorAlert }> {
    // TODO: integrate PATCH /behavior-alerts/{id}/review
    throw new Error('markReviewed: not integrated yet')
  },
}
