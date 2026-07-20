// Tipos TypeScript del proyecto.
// Deben coincidir con los schemas del backend (app/api/v1/panel/schemas.py).
// Nunca definir tipos inline en componentes o hooks.

// ── ROLES Y ESTADOS ───────────────────────────────────────

export type AdvisorRole = 'asesor' | 'admin'
export type AdvisorArea = 'administrativa' | 'comercial' | 'ambas'
export type AvailabilityStatus = 'available' | 'break' | 'offline'
export type ConversationStatus = 'activa' | 'escalada' | 'cerrada'
export type ConversationPriority = 'baja' | 'media' | 'alta' | 'critica'
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
export type WSStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

// ── MODELOS DE DOMINIO ────────────────────────────────────

export interface Advisor {
  id: string
  email: string
  full_name: string
  role: AdvisorRole
  area: AdvisorArea
  specialty?: string | null
  max_conversations: number
  active_conversations: number
  availability_status: AvailabilityStatus
  status_until?: string | null
  is_active: boolean
  avatar_url: string | null
  must_change_password: boolean
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
  conversation_id: string
  wam_id: string | null
  direction: MessageDirection
  msg_type: MessageType
  content: string | null
  media_url: string | null
  media_mime_type: string | null
  media_size_bytes: number | null
  transcription: string | null
  delivered_via: string
  timestamp: string
  created_at: string
  advisor_name: string | null
  // Optimistic-UI-only fields — populated locally by ChatInput/AudioRecorder
  // before the server confirms the message; never present in API responses.
  _localId?: string
  _status?: 'sending' | 'failed'
  _fileName?: string
}

export interface Escalation {
  id: string
  reason: string
  summary: string | null
  escalated_at: string
  advisor: Advisor | null
  wait_seconds?: number | null
  transfer_reason?: string | null
}

export interface ClosedByAdvisor {
  id: string
  full_name: string
}

export interface ConversationLastMessage {
  msg_type: 'text' | 'audio' | 'image' | 'video' | 'document'
  content: string | null
}

export interface Conversation {
  id: string
  status: ConversationStatus
  bot_activo: boolean
  has_escalation_history: boolean
  channel: string
  last_activity: string
  client: Client
  escalation: Escalation | null
  resolution_type: string | null
  resolution_notes: string | null
  client_satisfied: 'si' | 'no' | 'sin_confirmar' | null
  closed_by: 'asesor' | 'bot' | null
  // null for bot closures and for historical closures that could not be backfilled
  closed_by_advisor: ClosedByAdvisor | null
  closed_at: string | null
  last_message: ConversationLastMessage | null
  unread_count: number
  priority: ConversationPriority | null
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

export interface DashboardMetrics {
  activas: number
  escaladas: number
  en_atencion: number
  tiempo_promedio_min: number
  bot_ok_pct: number
  capacidad_actual: number
  capacidad_total: number
}

export interface AdvisorOnline {
  id: string
  full_name: string
  availability_status: 'available' | 'break' | 'offline'
  area: string
  is_panel_connected: boolean
  // Admin-only fields:
  active_conversations?: number
  max_conversations?: number
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
  advisor_id: string | null
  reason: string | null
  channel: string
}

export interface WSMessageNew {
  message: Message
  conversation_id?: string
  unread_count?: number
}

export interface WSAdvisorConnected {
  advisor_id: string
  advisor_name: string
  advisor_role: string
  advisor_area: string
}

export interface WSAdvisorDisconnected {
  advisor_id: string
  advisor_name: string
}

export interface WSAdvisorStatusChanged {
  advisor_id: string
  availability_status: AvailabilityStatus
  full_name: string
  area: string
  specialty: string | null
}

export interface WSEscalationAssigned {
  conversation_id: string
  escalation_id: string
  advisor_id: string
  advisor_name: string
}

export interface WSConversationReturned {
  conversation_id: string
  advisor_id: string
  advisor_name: string
}

export interface WSConversationClosed {
  conversation_id: string
  closed_by: 'asesor' | 'bot'
  advisor_id?: string
  advisor_name?: string
  resolution_type?: string
  closed_at?: string
  reason?: string
}

export interface WSQueuePending {
  count: number
  message: string
}

export interface WSBehaviorAlertEvent {
  alert_id: string
}

export interface WSTransferAdvisorRef {
  id: string
  full_name: string
}

export interface WSConversationTransferred {
  conversation_id: string
  case_number: string
  from_advisor: WSTransferAdvisorRef | null
  to_advisor: WSTransferAdvisorRef
  reason: string | null
}

export interface WSConversationPriorityUpdated {
  conversation_id: string
  priority: ConversationPriority
  updated_by: 'bot'
}
