import apiClient from '../lib/axios'
import type { PaginatedConversations, PaginatedMessages, Message, Conversation } from '../types'

type ConversationListParams = { status?: string; channel?: string; limit?: number; offset?: number }
type PaginationParams = { limit?: number; offset?: number }
type CloseConversationData = { resolution_type?: string; resolution_notes?: string | null; client_satisfied?: string }
type AssignResponse = { escalation: { id: string; advisor_id: string; advisor_name: string } }
type ReturnToBotResponse = { conversation: Conversation }
type CloseResponse = { conversation: Conversation }

export const conversationsService = {

  async list(params?: ConversationListParams): Promise<PaginatedConversations> {
    const { data } = await apiClient.get('/api/v1/panel/conversations/', { params })
    return data.data
  },

  async getById(id: string): Promise<{ conversation: Conversation; messages: Message[]; total_messages: number }> {
    const { data } = await apiClient.get(`/api/v1/panel/conversations/${id}`, {
      params: { limit: 50, offset: 0 },
    })
    const conversation = data.data.conversation
    return {
      conversation,
      messages: conversation.messages || [],
      total_messages: conversation.total_messages || 0,
    }
  },

  async getMessages(id: string, params?: PaginationParams): Promise<PaginatedMessages> {
    const { data } = await apiClient.get(`/api/v1/panel/conversations/${id}/messages`, { params })
    return data.data
  },

  async replyText(_id: string, _text: string): Promise<{ message: Message }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 6')
  },

  async replyMedia(_id: string, _file: File, _caption?: string): Promise<{ message: Message }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 6')
  },

  async replyAudio(_id: string, _file: Blob): Promise<{ message: Message }> {
    throw new Error('NOT IMPLEMENTED — pendiente Tarea 6')
  },

  async assign(id: string): Promise<AssignResponse> {
    const { data } = await apiClient.patch(`/api/v1/panel/conversations/${id}/assign`)
    return data.data
  },

  async returnToBot(id: string): Promise<ReturnToBotResponse> {
    const { data } = await apiClient.patch(`/api/v1/panel/conversations/${id}/return-bot`)
    return data.data
  },

  async close(id: string, body?: CloseConversationData): Promise<CloseResponse> {
    const { data } = await apiClient.patch(`/api/v1/panel/conversations/${id}/close`, body ?? {})
    return data.data
  },
}
