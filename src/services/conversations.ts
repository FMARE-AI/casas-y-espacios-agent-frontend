import apiClient from '../lib/axios'
import type {
  Conversation,
  PaginatedConversations,
  PaginatedMessages,
  Message,
} from '../types'

// ── MOCK DATA FOR OFFLINE / FALLBACK DEVELOPMENT ──────────────────

const MOCK_CONVERSATIONS: Conversation[] = [
  {
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
      id: 'esc-1',
      reason: 'frustracion_detectada',
      summary: 'El cliente presenta alta molestia tras 3 días sin agua caliente. Reporta fuga parcial inundando el piso. El bot no logró clasificar la dirección correctamente.',
      escalated_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      advisor: null,
    },
  },
  {
    id: 'conv-maria',
    status: 'escalada',
    bot_activo: false,
    channel: 'administrativa',
    last_activity: new Date().toISOString(),
    client: {
      id: 'client-2',
      phone_number: '+57 300 987 6543',
      full_name: 'María Camila Restrepo',
      document_id: '43.120.987',
      client_type: 'propietario',
    },
    escalation: {
      id: 'esc-2',
      reason: 'solicitud_asesor',
      summary: 'Propietaria solicita liquidación del mes de Mayo ya que no ve reflejado el pago de su inmueble en su extracto bancario.',
      escalated_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      advisor: null,
    },
  },
  {
    id: 'conv-jorge',
    status: 'activa',
    bot_activo: false,
    channel: 'administrativa',
    last_activity: new Date().toISOString(),
    client: {
      id: 'client-3',
      phone_number: '+57 315 222 3344',
      full_name: 'Jorge Eliécer Gaitán',
      document_id: '19.450.320',
      client_type: 'inquilino',
    },
    escalation: {
      id: 'esc-3',
      reason: 'soporte_pago',
      summary: 'El inquilino reporta problemas al subir el comprobante de pago por el portal de PSE y solicita ayuda con cuentas bancarias directas.',
      escalated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      advisor: {
        id: 'hardcoded',
        email: 'admin@casasyespacios.co',
        full_name: 'Admin',
        role: 'admin',
        area: 'ambas',
        max_conversations: 10,
        active_conversations: 1,
        availability_status: 'available',
        avatar_url: null,
        is_active: true,
      },
    },
  },
  {
    id: 'conv-valentina',
    status: 'escalada',
    bot_activo: false,
    channel: 'administrativa',
    last_activity: new Date().toISOString(),
    client: {
      id: 'client-4',
      phone_number: '+57 310 555 6677',
      full_name: 'Valentina Gómez',
      document_id: '1.152.190.220',
      client_type: 'inquilino',
    },
    escalation: {
      id: 'esc-4',
      reason: 'no_clasificado',
      summary: 'El bot escaló porque la cliente repitió en varias ocasiones preguntas sobre la penalidad exacta por terminación de contrato antes del vencimiento. El bot no supo responder.',
      escalated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      advisor: null,
    },
  },
  {
    id: 'conv-juan',
    status: 'activa',
    bot_activo: false,
    channel: 'administrativa',
    last_activity: new Date().toISOString(),
    client: {
      id: 'client-5',
      phone_number: '+57 311 777 8899',
      full_name: 'Juan Fernando Quintero',
      document_id: '71.555.222',
      client_type: 'propietario',
    },
    escalation: {
      id: 'esc-5',
      reason: 'mantenimiento_urgente',
      summary: 'Propietario reporta olor a gas en la cocina y solicita autorización para enviar un técnico autorizado de urgencia cobrándolo a la cuenta del mes.',
      escalated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      advisor: {
        id: 'advisor-andres',
        email: 'andres@casasyespacios.co',
        full_name: 'Andrés',
        role: 'asesor',
        area: 'administrativa',
        max_conversations: 3,
        active_conversations: 1,
        availability_status: 'available',
        avatar_url: null,
        is_active: true,
      },
    },
  },
  {
    id: 'conv-roberto',
    status: 'cerrada',
    bot_activo: true,
    channel: 'administrativa',
    last_activity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    client: {
      id: 'client-6',
      phone_number: '+57 320 888 9900',
      full_name: 'Roberto Gómez Bolaños',
      document_id: '2.500.400',
      client_type: 'inquilino',
    },
    escalation: null,
  },
  {
    id: 'conv-cerrada-2',
    status: 'cerrada',
    bot_activo: false,
    channel: 'administrativa',
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    client: {
      id: 'client-7',
      phone_number: '+57 301 234 5678',
      full_name: 'Lucía Fernández Ríos',
      document_id: '52.890.123',
      client_type: 'propietario',
    },
    escalation: {
      id: 'esc-c2',
      reason: 'solicitud_asesor',
      summary: 'Propietaria solicitó detalle del último pago de arriendo. El asesor verificó en SIMI y envió el comprobante por correo.',
      escalated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      advisor: {
        id: 'advisor-diana',
        email: 'diana@casasyespacios.co',
        full_name: 'Diana Ospina',
        role: 'asesor',
        area: 'administrativa',
        max_conversations: 3,
        active_conversations: 3,
        availability_status: 'available',
        avatar_url: null,
        is_active: true,
      },
    },
  },
  {
    id: 'conv-cerrada-3',
    status: 'cerrada',
    bot_activo: true,
    channel: 'administrativa',
    last_activity: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    client: {
      id: 'client-8',
      phone_number: '+57 315 444 5566',
      full_name: 'Hernán Darío Ospina',
      document_id: '15.320.780',
      client_type: 'inquilino',
    },
    escalation: null,
  },
  {
    id: 'conv-cerrada-4',
    status: 'cerrada',
    bot_activo: false,
    channel: 'administrativa',
    last_activity: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    client: {
      id: 'client-9',
      phone_number: '+57 312 999 0011',
      full_name: 'Valentina Cárdenas Mora',
      document_id: '1.098.765.432',
      client_type: 'inquilino',
    },
    escalation: {
      id: 'esc-c4',
      reason: 'mantenimiento_urgente',
      summary: 'Inquilina reportó daño en la tubería de agua fría del baño principal. El asesor abrió orden SIMI y coordinó visita técnica para el día siguiente.',
      escalated_at: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
      advisor: {
        id: 'advisor-andres',
        email: 'andres@casasyespacios.co',
        full_name: 'Andrés Morales',
        role: 'asesor',
        area: 'administrativa',
        max_conversations: 3,
        active_conversations: 1,
        availability_status: 'available',
        avatar_url: null,
        is_active: true,
      },
    },
  },
  {
    id: 'conv-cerrada-5',
    status: 'cerrada',
    bot_activo: false,
    channel: 'administrativa',
    last_activity: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    client: {
      id: 'client-10',
      phone_number: '+57 317 222 3344',
      full_name: 'Gabriel Moreno Peña',
      document_id: '79.450.188',
      client_type: 'propietario',
    },
    escalation: {
      id: 'esc-c5',
      reason: 'soporte_pago',
      summary: 'Propietario consultó sobre descuento de administración aplicado al mes de abril. El asesor explicó la resolución de la asamblea y envió acta.',
      escalated_at: new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString(),
      advisor: {
        id: 'advisor-diana',
        email: 'diana@casasyespacios.co',
        full_name: 'Diana Ospina',
        role: 'asesor',
        area: 'administrativa',
        max_conversations: 3,
        active_conversations: 3,
        availability_status: 'available',
        avatar_url: null,
        is_active: true,
      },
    },
  },
]

const MOCK_MESSAGES: Record<string, Message[]> = {
  demo: [
    {
      id: 'm1',
      wam_id: 'wam-1',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Hola, buenos días. Tengo un problema urgente.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'm2',
      wam_id: 'wam-2',
      direction: 'outbound_bot',
      msg_type: 'text',
      content: '¡Hola! Bienvenido al canal de soporte de Casas y Espacios. Por favor indícame tu número de documento y el motivo de tu consulta.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'm3',
      wam_id: 'wam-3',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Mi cédula es 1.020.456.789. El apartamento 402 del edificio Las Flores lleva 3 días sin agua caliente. La tubería del calentador tiene una fuga y se está inundando el piso.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'm4',
      wam_id: 'wam-4',
      direction: 'outbound_bot',
      msg_type: 'text',
      content: 'Entiendo tu reporte sobre falta de agua caliente. ¿Podrías confirmar la dirección exacta o el número de contrato?',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'm5',
      wam_id: 'wam-5',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Ya les dije que es en el Edificio Las Flores Apto 402. ¡Se está dañando la madera del suelo, respondan rápido por favor!',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
  ],
  'conv-maria': [
    {
      id: 'mm1',
      wam_id: 'wam-m1',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Hola, soy María Camila Restrepo, propietaria del apto 301 de la Calle 100. Quisiera saber por qué no me han depositado lo de este mes.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mm2',
      wam_id: 'wam-m2',
      direction: 'outbound_bot',
      msg_type: 'text',
      content: 'Hola Sra. María Camila, analizando su historial veo que el arrendatario ya pagó el día 5. Déjeme validar la liquidación bancaria.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mm3',
      wam_id: 'wam-m3',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Sí, pero ya es 23 y no tengo el depósito en mi Bancolombia. Por favor, comuníquenme con un asesor de cartera.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
  ],
  'conv-jorge': [
    {
      id: 'mj1',
      wam_id: 'wam-j1',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Buenos días, estoy intentando pagar el arriendo del apartamento 501 por PSE pero el portal me sale caído.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mj2',
      wam_id: 'wam-j2',
      direction: 'outbound_bot',
      msg_type: 'text',
      content: 'Hola Jorge, lamentamos el inconveniente. Puedes pagar mediante transferencia a nuestra cuenta de ahorros Davivienda.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mj3',
      wam_id: 'wam-j3',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Ya hice la transferencia, pero no me deja adjuntar la imagen en el chat. ¿Me pueden confirmar si la recibieron?',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mj4',
      wam_id: 'wam-j4',
      direction: 'outbound_advisor',
      msg_type: 'text',
      content: 'Hola Jorge, gusto en saludarte. Soy el asesor de soporte. Puedes enviarnos el comprobante por este medio en formato de archivo, o me indicas la referencia del depósito para validarlo de inmediato en nuestro extracto.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
  ],
  'conv-valentina': [
    {
      id: 'mv1',
      wam_id: 'wam-v1',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Hola, tengo una pregunta sobre mi contrato. El contrato vence en Octubre pero me tengo que mudar el mes que viene por trabajo.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mv2',
      wam_id: 'wam-v2',
      direction: 'outbound_bot',
      msg_type: 'text',
      content: 'Entiendo. La terminación anticipada suele acarrear una penalidad estipulada en la cláusula 12 de tu contrato de arrendamiento.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 54 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mv3',
      wam_id: 'wam-v3',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Sí, pero quiero saber si me cobran 1, 2 o 3 meses de multa si aviso hoy mismo. El contrato no lo tengo a la mano.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mv4',
      wam_id: 'wam-v4',
      direction: 'outbound_bot',
      msg_type: 'text',
      content: 'Lo siento, no puedo consultar la penalidad exacta sin los datos del contrato físico. ¿Deseas esperar a un asesor humano?',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mv5',
      wam_id: 'wam-v5',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Sí por favor, conéctenme con alguien ya.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
  ],
  'conv-juan': [
    {
      id: 'mju1',
      wam_id: 'wam-ju1',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Hola, soy Juan Fernando Quintero. Los inquilinos del apartamento 102 me acaban de llamar diciendo que huele mucho a gas en la cocina.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mju2',
      wam_id: 'wam-ju2',
      direction: 'outbound_bot',
      msg_type: 'text',
      content: 'Hola Sr. Juan Fernando, en caso de sospecha de fuga de gas se debe cerrar la válvula de paso principal y comunicarse con la línea de emergencia de Vanti de inmediato.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 74 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mju3',
      wam_id: 'wam-ju3',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Sí, ya llamaron. Vanti va a mandar un técnico pero si es un daño interno me toca pagar a mí. ¿Ustedes tienen un plomero de confianza que pueda ir a revisar?',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mju4',
      wam_id: 'wam-ju4',
      direction: 'outbound_advisor',
      msg_type: 'text',
      content: 'Hola Sr. Juan, buenos días. Ya asigné a Andrés de nuestro equipo para que revise nuestro listado de técnicos aliados en la zona. Nos comunicaremos con el inquilino para coordinar la visita urgente.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
  ],
  'conv-roberto': [
    {
      id: 'mr1',
      wam_id: 'wam-r1',
      direction: 'inbound',
      msg_type: 'text',
      content: 'Hola, quería confirmar si ya recibieron la copia de mi cédula para renovar el contrato.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
    {
      id: 'mr2',
      wam_id: 'wam-r2',
      direction: 'outbound_bot',
      msg_type: 'text',
      content: 'Hola Roberto, sí. Hemos verificado tu documento y la renovación ha quedado aprobada. Te enviaremos el contrato digital a tu correo.',
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      delivered_via: 'whatsapp',
    },
  ],
}

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
      let filtered = [...MOCK_CONVERSATIONS]
      if (params?.status) {
        filtered = filtered.filter(c => c.status === params.status)
      }
      if (params?.channel) {
        filtered = filtered.filter(c => c.channel === params.channel)
      }
      const limit = params?.limit ?? 10
      const offset = params?.offset ?? 0
      const chunk = filtered.slice(offset, offset + limit)
      return {
        conversations: chunk,
        total: filtered.length,
        limit,
        offset,
      }
    }
  },

  async getById(id: string): Promise<{
    conversation: Conversation
    messages: Message[]
    total_messages: number
  }> {
    try {
      const { data } = await apiClient.get(`/api/v1/panel/conversations/${id}`)
      return data.data
    } catch {
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === id) || MOCK_CONVERSATIONS[0]
      const msgs = MOCK_MESSAGES[id] || MOCK_MESSAGES['demo'] || []
      return {
        conversation: conv,
        messages: msgs,
        total_messages: msgs.length,
      }
    }
  },

  async getMessages(
    id: string,
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedMessages> {
    try {
      const { data } = await apiClient.get(
        `/api/v1/panel/conversations/${id}/messages`,
        { params }
      )
      return data.data
    } catch {
      const msgs = MOCK_MESSAGES[id] || MOCK_MESSAGES['demo'] || []
      return {
        messages: msgs,
        total: msgs.length,
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
      }
    }
  },

  async replyText(id: string, text: string): Promise<{ message: Message }> {
    if (id === 'demo' || id.startsWith('conv-')) {
      const newMsg: Message = {
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
      }
      if (!MOCK_MESSAGES[id]) {
        MOCK_MESSAGES[id] = []
      }
      MOCK_MESSAGES[id].push(newMsg)
      return { message: newMsg }
    }
    const { data } = await apiClient.post(
      `/api/v1/panel/conversations/${id}/reply`,
      { text }
    )
    return data.data
  },

  async replyMedia(id: string, file: File): Promise<{ message: Message }> {
    if (id === 'demo' || id.startsWith('conv-')) {
      const type: 'image' | 'video' | 'document' = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : 'document'
      const newMsg: Message = {
        id: `msg-mock-${Date.now()}`,
        wam_id: null,
        direction: 'outbound_advisor',
        msg_type: type,
        content: file.name,
        media_url: URL.createObjectURL(file),
        media_mime_type: file.type,
        media_size_bytes: file.size,
        timestamp: new Date().toISOString(),
        delivered_via: 'whatsapp',
      }
      if (!MOCK_MESSAGES[id]) {
        MOCK_MESSAGES[id] = []
      }
      MOCK_MESSAGES[id].push(newMsg)
      return { message: newMsg }
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
    if (id === 'demo' || id.startsWith('conv-')) {
      const newMsg: Message = {
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
      }
      if (!MOCK_MESSAGES[id]) {
        MOCK_MESSAGES[id] = []
      }
      MOCK_MESSAGES[id].push(newMsg)
      return { message: newMsg }
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
    if (id === 'demo' || id.startsWith('conv-')) {
      const conv = MOCK_CONVERSATIONS.find(c => c.id === id)
      if (conv) {
        conv.status = 'activa'
        if (conv.escalation) {
          conv.escalation.advisor = {
            id: 'hardcoded',
            email: 'admin@casasyespacios.co',
            full_name: 'Admin',
            role: 'admin',
            area: 'ambas',
            max_conversations: 10,
            active_conversations: 1,
            availability_status: 'available',
            avatar_url: null,
            is_active: true,
          }
        }
      }
      return { escalation: conv?.escalation || {} }
    }
    const { data } = await apiClient.patch(
      `/api/v1/panel/conversations/${id}/assign`
    )
    return data.data
  },

  async returnToBot(id: string): Promise<{ conversation: Conversation }> {
    if (id === 'demo' || id.startsWith('conv-')) {
      const conv = MOCK_CONVERSATIONS.find(c => c.id === id)
      if (conv) {
        conv.status = 'activa'
        conv.bot_activo = true
        conv.escalation = null
      }
      return { conversation: conv || MOCK_CONVERSATIONS[0] }
    }
    const { data } = await apiClient.patch(
      `/api/v1/panel/conversations/${id}/return-bot`
    )
    return data.data
  },
}
