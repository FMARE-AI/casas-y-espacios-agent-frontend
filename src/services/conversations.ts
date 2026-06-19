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
    try {
      const { data } = await apiClient.get('/api/v1/panel/conversations', { params })
      return data.data
    } catch {
      const mockConversation: Conversation = {
        id: 'demo',
        status: 'escalada',
        bot_activo: false,
        channel: 'administrativa',
        last_activity: new Date().toISOString(),
        client: {
          id: 'client-1',
          phone_number: '+57 312 456 7890',
          full_name: 'Carlos Mendoza',
          document_id: '1.020.456.789',
          client_type: 'inquilino',
        },
        escalation: {
          id: 'esc-489-demo-uuid',
          reason: 'frustracion_detectada',
          summary: 'El cliente presenta alta molestia tras 3 días sin agua caliente. Reporta fuga parcial inundando el piso. El bot no logró clasificar la dirección correctamente.',
          escalated_at: new Date().toISOString(),
          advisor: {
            id: 'hardcoded',
            email: 'admin@casasyespacios.co',
            full_name: 'Admin',
            role: 'admin',
            area: 'ambas',
            max_conversations: 10,
            active_conversations: 1,
            availability_status: 'available',
            is_active: true,
          },
        },
      }
      return {
        conversations: [mockConversation],
        total: 1,
        limit: 10,
        offset: 0,
      }
    }
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
    if (id === 'demo') {
      return {
        message: {
          id: `msg-mock-${Date.now()}`,
          wam_id: null,
          direction: 'outbound_advisor',
          msg_type: 'text',
          content: text,
          media_url: null,
          media_mime_type: null,
          media_size_bytes: null,
          timestamp: new Date().toISOString(),
          delivered_via: 'whatsapp',
        },
      }
    }
    const { data } = await apiClient.post(
      `/api/v1/panel/conversations/${id}/reply`,
      { text }
    )
    return data.data
  },

  async replyMedia(id: string, file: File): Promise<{ message: Message }> {
    if (id === 'demo') {
      const type = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : 'document'
      return {
        message: {
          id: `msg-mock-${Date.now()}`,
          wam_id: null,
          direction: 'outbound_advisor',
          msg_type: type as any,
          content: file.name,
          media_url: URL.createObjectURL(file),
          media_mime_type: file.type,
          media_size_bytes: file.size,
          timestamp: new Date().toISOString(),
          delivered_via: 'whatsapp',
        },
      }
    }
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
    if (id === 'demo') {
      return {
        message: {
          id: `msg-mock-${Date.now()}`,
          wam_id: null,
          direction: 'outbound_advisor',
          msg_type: 'audio',
          content: '',
          media_url: URL.createObjectURL(blob),
          media_mime_type: blob.type,
          media_size_bytes: blob.size,
          timestamp: new Date().toISOString(),
          delivered_via: 'whatsapp',
        },
      }
    }
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
