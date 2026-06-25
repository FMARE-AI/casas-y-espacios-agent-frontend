import apiClient from '../lib/axios'
import type { DashboardMetrics } from '../types'

export const metricsService = {

  async getMetrics(): Promise<{ metrics: DashboardMetrics }> {
    const { data } = await apiClient.get('/api/v1/panel/metrics')
    return data.data
  },
}
