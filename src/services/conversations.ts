import apiClient from '../lib/axios'
import type {
  Conversation,
  PaginatedConversations,
  PaginatedMessages,
  Message,
} from '../types'

export const conversationsService = {

  async list(params?: {
    status?: string
    channel?: string
    limit?: number
    offset?: number
  }): Promise<PaginatedConversations> {
    const { data } = await apiClient.get('/api/v1/panel/conversations', { params })
    return data.data
  },

  async getById(id: string): Promise<{
    conversation: Conversation
    messages: Message[]
    total_messages: number
  }> {
    const { data } = await apiClient.get(`/api/v1/panel/conversations/${id}`)
    return data.data
  },

  async getMessages(
    id: string,
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedMessages> {
    const { data } = await apiClient.get(
      `/api/v1/panel/conversations/${id}/messages`,
      { params }
    )
    return data.data
  },

  async replyText(id: string, text: string): Promise<{ message: Message }> {
    const { data } = await apiClient.post(
      `/api/v1/panel/conversations/${id}/reply`,
      { text }
    )
    return data.data
  },

  async replyMedia(id: string, file: File): Promise<{ message: Message }> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await apiClient.post(
      `/api/v1/panel/conversations/${id}/reply/media`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data.data
  },

  async replyAudio(id: string, blob: Blob): Promise<{ message: Message }> {
    const form = new FormData()
    form.append('file', blob, 'audio.webm')
    const { data } = await apiClient.post(
      `/api/v1/panel/conversations/${id}/reply/audio`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data.data
  },

  async assign(id: string): Promise<{ escalation: object }> {
    const { data } = await apiClient.patch(
      `/api/v1/panel/conversations/${id}/assign`
    )
    return data.data
  },

  async returnToBot(id: string): Promise<{ conversation: Conversation }> {
    const { data } = await apiClient.patch(
      `/api/v1/panel/conversations/${id}/return-bot`
    )
    return data.data
  },
}
