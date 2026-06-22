// Tipos TypeScript del proyecto.
// Deben coincidir con los schemas del backend (app/api/v1/panel/schemas.py).
// Nunca definir tipos inline en componentes o hooks.

// ── ROLES Y ESTADOS ───────────────────────────────────────

export type AdvisorRole = 'asesor' | 'admin'
export type AdvisorArea = 'administrativa' | 'comercial' | 'ambas'
export type AvailabilityStatus = 'available' | 'break' | 'offline'
export type ConversationStatus = 'activa' | 'escalada' | 'cerrada'
export type MessageDirection = 'inbound' | 'outbound_bot' | 'outbound_advisor'
export type MessageType = 'text' | 'image' | 'video' | 'document' | 'audio'
export type AlertSeverity = 'baja' | 'media' | 'alta'
export type AlertType =
  | 'lenguaje_inapropiado'
  | 'tono_agresivo'
  | 'comportamiento_inadecuado'
export type ClientType =
  | 'inquilino'
  | 'propietario'
  | 'prospecto'
  | 'desconocido'
export type WSStatus = 'connected' | 'reconnecting' | 'disconnected'

// ── MODELOS DE DOMINIO ────────────────────────────────────

export interface Advisor {
  id: string
  email: string
  full_name: string
  role: AdvisorRole
  area: AdvisorArea
  max_conversations: number
  active_conversations: number
  availability_status: AvailabilityStatus
  status_until?: string | null
  is_active: boolean
  avatar_url: string | null
}

export interface Client {
  id: string
  phone_number: string
  full_name: string | null
  document_id: string | null
  client_type: ClientType
}

export interface Message {
  id: string
  wam_id: string | null
  direction: MessageDirection
  msg_type: MessageType
  content: string | null
  media_url: string | null
  media_mime_type: string | null
  media_size_bytes: number | null
  timestamp: string
  delivered_via: string
}

export interface Escalation {
  id: string
  reason: string
  summary: string | null
  escalated_at: string
  advisor: Advisor | null
}

export interface Conversation {
  id: string
  status: ConversationStatus
  bot_activo: boolean
  channel: string
  last_activity: string
  client: Client
  escalation: Escalation | null
}

export interface BehaviorAlert {
  id: string
  advisor: Advisor
  conversation_id: string
  message_content: string
  alert_type: AlertType
  severity: AlertSeverity
  detected_at: string
  reviewed: boolean
  reviewed_by: string | null
  reviewed_at: string | null
}

export interface AdvisorSchedule {
  id: string
  label: string
  start_time: string
  end_time: string
  days_of_week: number[]
  is_active: boolean
}

// ── API RESPONSES ─────────────────────────────────────────
// Todos los endpoints devuelven {"data": {...}}

export interface PaginatedConversations {
  conversations: Conversation[]
  total: number
  limit: number
  offset: number
}

export interface PaginatedMessages {
  messages: Message[]
  total: number
  limit: number
  offset: number
}

export interface PaginatedAlerts {
  alerts: BehaviorAlert[]
  total: number
}

// ── WEBSOCKET EVENTS ──────────────────────────────────────

export interface WSEvent<T = unknown> {
  event: string
  data: T
}

export interface WSEscalationNew {
  conversation_id: string
  client_name: string
  reason: string
  channel: string
}

export interface WSMessageNew {
  conversation_id: string
  message: Message
}

export interface WSAdvisorStatusChanged {
  advisor_id: string
  availability_status: AvailabilityStatus
}

export interface WSBehaviorAlert {
  alert: BehaviorAlert
}
