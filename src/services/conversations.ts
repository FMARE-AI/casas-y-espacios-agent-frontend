import apiClient from '../lib/axios'
import type { PaginatedConversations, PaginatedMessages, Message, Conversation } from '../types'

type ConversationListParams = { status?: string; channel?: string; limit?: number; offset?: number }
type PaginationParams = { limit?: number; offset?: number }
type CloseConversationData = { resolution_type?: string; resolution_notes?: string | null; client_satisfied?: string }
type AssignResponse = { escalation: { id: string; advisor_id: string; advisor_name: string } }
type ReturnToBotResponse = { conversation: Conversation }
type CloseResponse = { conversation: Conversation }
type TransferResponse = {
  escalation: { id: string; advisor_id: string; advisor_name: string; transfer_reason?: string | null }
}

export const conversationsService = {

  async list(params?: ConversationListParams): Promise<PaginatedConversations> {
    const { data } = await apiClient.get('/api/v1/panel/conversations/', { params })
    return data.data
  },

  async getById(id: string, limit = 50): Promise<{ conversation: Conversation; messages: Message[]; total_messages: number }> {
    const { data } = await apiClient.get(`/api/v1/panel/conversations/${id}`, {
      params: { limit, offset: 0 },
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

  async replyText(id: string, text: string): Promise<{ message: Message }> {
    const { data } = await apiClient.post(`/api/v1/panel/conversations/${id}/reply`, { text })
    return data.data
  },

  async replyMedia(id: string, file: File, caption?: string): Promise<{ message: Message }> {
    const formData = new FormData()
    formData.append('file', file)
    if (caption) {
      formData.append('caption', caption)
    }
    const { data } = await apiClient.post(`/api/v1/panel/conversations/${id}/reply/media`, formData)
    return data.data
  },

  async replyAudio(id: string, file: Blob): Promise<{ message: Message }> {
    const formData = new FormData()
    
    let audioFile = file
    let filename = 'voice_note.ogg'
    
    if (file.type.includes('mpeg') || file.type.includes('mp3')) {
      filename = 'voice_note.mp3'
      audioFile = new Blob([file], { type: 'audio/mpeg' })
    } else if (file.type.includes('mp4')) {
      filename = 'voice_note.mp4'
      audioFile = new Blob([file], { type: 'audio/mp4' })
    } else if (file.type.includes('ogg')) {
      filename = 'voice_note.ogg'
      audioFile = new Blob([file], { type: 'audio/ogg' })
    }

    formData.append('file', audioFile, filename)
    const { data } = await apiClient.post(`/api/v1/panel/conversations/${id}/reply/audio`, formData)
    return data.data
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

  async markAsSeen(conversationId: string): Promise<{ unread_count: number }> {
    const { data } = await apiClient.patch(`/api/v1/panel/conversations/${conversationId}/seen`)
    return data.data
  },

  async transfer(id: string, body: { target_advisor_id: string; reason?: string | null }): Promise<TransferResponse> {
    const { data } = await apiClient.post(`/api/v1/panel/conversations/${id}/transfer`, body)
    return data.data
  },
}
