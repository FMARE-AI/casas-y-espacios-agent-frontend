import apiClient from '../lib/axios'
import type { PaginatedClients } from '../types'

type ClientListParams = { q?: string; limit?: number; offset?: number }

export const clientsService = {

  async list(params?: ClientListParams): Promise<PaginatedClients> {
    const { data } = await apiClient.get('/api/v1/panel/clients', { params })
    return data.data
  },
}
