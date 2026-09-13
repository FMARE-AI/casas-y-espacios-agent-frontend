import apiClient from '../lib/axios'
import { withSignal } from './requestConfig'
import type { PaginatedClients } from '../types'

type ClientListParams = { q?: string; limit?: number; offset?: number }

export const clientsService = {

  async list(params?: ClientListParams, signal?: AbortSignal): Promise<PaginatedClients> {
    const { data } = await apiClient.get('/api/v1/panel/clients', withSignal({ params }, signal))
    return data.data
  },
}
