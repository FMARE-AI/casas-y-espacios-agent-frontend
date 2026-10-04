import apiClient from '../lib/axios'
import { withSignal } from './requestConfig'
import type {
  AgentNotification,
  CloseNotificationBody,
  NotificationList,
  NotificationListParams,
} from '../types'

const BASE = '/api/v1/panel/notifications'

export const notificationsService = {

  async list(params?: NotificationListParams, signal?: AbortSignal): Promise<NotificationList> {
    const { data } = await apiClient.get(BASE, withSignal({ params }, signal))
    return data.data
  },

  async getById(id: string, signal?: AbortSignal): Promise<{ notification: AgentNotification }> {
    const { data } = await apiClient.get(`${BASE}/${encodeURIComponent(id)}`, withSignal({}, signal))
    return data.data
  },

  // The closing advisor comes from the JWT. A blank note is dropped instead of
  // sent — the backend would store it as null anyway.
  async close(id: string, body: CloseNotificationBody): Promise<{ notification: AgentNotification }> {
    const note = body.note?.trim()
    const payload: CloseNotificationBody = note ? { status: body.status, note } : { status: body.status }
    const { data } = await apiClient.patch(`${BASE}/${encodeURIComponent(id)}`, payload)
    return data.data
  },
}
