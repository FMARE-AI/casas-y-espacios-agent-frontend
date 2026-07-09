import axios from 'axios'
import apiClient from '../lib/axios'
import type { DashboardMetrics } from '../types'

const ZERO_METRICS: DashboardMetrics = {
  activas: 0,
  escaladas: 0,
  en_atencion: 0,
  tiempo_promedio_min: 0,
  bot_ok_pct: 0,
  capacidad_actual: 0,
  capacidad_total: 0,
}

export const metricsService = {
  async getMetrics(): Promise<DashboardMetrics | null> {
    try {
      const response = await apiClient.get('/api/v1/panel/metrics')
      return response.data.data.metrics
    } catch (error) {
      // 403 FORBIDDEN: Devolver null silenciosamente
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        return null
      }

      // 500 SUPABASE_ERROR u otros fallos: Devolver métricas en cero sin romper el panel
      return ZERO_METRICS
    }
  },
}

