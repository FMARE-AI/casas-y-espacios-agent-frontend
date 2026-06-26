import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { conversationsService } from '../services/conversations'
import { useAuthStore } from '../store/authStore'
import type { Conversation, Message, WSConversationClosed, WSEscalationAssigned } from '../types'
import MessageFeed from '../components/chat/MessageFeed'
import ChatInput from '../components/chat/ChatInput'
import ClientPanel, { type ChatVariant } from '../components/chat/ClientPanel'
import { useWebSocket } from '../hooks/useWebSocket'

// ── Return-bot confirmation modal ─────────────────────────

function ReturnBotModal({
  onConfirm,
  onCancel,
  isReturning,
}: {
  onConfirm: () => void
  onCancel: () => void
  isReturning: boolean
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        id="modal-confirm-release"
        className="bg-[#252522] border border-[#3A3A37] rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4"
      >
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ¿Devolver esta conversación al bot?
          </h3>
          <p className="text-xs text-[#8B8FA8] mt-2">
            El agente de IA retomará el canal de WhatsApp de manera autónoma.
          </p>
        </div>
        <p className="text-[11px] text-[#8B8FA8] leading-relaxed">
          Asegúrate de haber resuelto la consulta comercial o administrativa o haber agendado el requerimiento en SIMI antes
          de liberar la atención.
        </p>
        <div className="pt-2 flex justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#8B8FA8] hover:text-white rounded font-semibold transition active:scale-95"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isReturning}
            className="px-4 py-2.5 bg-transparent hover:bg-[#00D4AA]/10 border border-[#00D4AA] text-[#00D4AA] rounded font-bold transition active:scale-95 disabled:opacity-60 flex items-center gap-2"
          >
            {isReturning && (
              <div className="w-3.5 h-3.5 border-2 border-[#00D4AA] border-t-transparent rounded-full animate-spin" />
            )}
            Confirmar devolución
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Close conversation modal ──────────────────────────────

interface CloseData {
  resolution_type: string
  resolution_notes: string | null
  client_satisfied: string
}

const RESOLUTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'consulta_cartera_resuelta',      label: 'Consulta de cartera resuelta' },
  { value: 'pago_acordado',                  label: 'Pago acordado / registrado' },
  { value: 'orden_mantenimiento_creada',     label: 'Orden de mantenimiento creada' },
  { value: 'queja_pqrs_registrada',          label: 'Queja / PQRS registrada' },
  { value: 'informacion_contrato_entregada', label: 'Información de contrato entregada' },
  { value: 'derivado_otro_canal',            label: 'Derivado a otro canal' },
  { value: 'sin_respuesta_cliente',          label: 'Cliente no respondió' },
  { value: 'otro',                           label: 'Otro' },
]

const SATISFACTION_OPTIONS: { value: string; label: string; active: string }[] = [
  { value: 'si',            label: '✓ Sí',          active: 'bg-[#00D4AA]/10 border-[#00D4AA] text-[#00D4AA]' },
  { value: 'no',            label: '✗ No',           active: 'bg-[#FF5B5B]/10 border-[#FF5B5B] text-[#FF5B5B]' },
  { value: 'sin_confirmar', label: '— Sin confirmar', active: 'bg-[#8B8FA8]/10 border-[#8B8FA8] text-[#8B8FA8]' },
]

function CloseConversationModal({
  onConfirm,
  onCancel,
  isClosing,
}: {
  onConfirm: (data: CloseData) => void
  onCancel: () => void
  isClosing: boolean
}) {
  const [resolutionType, setResolutionType] = useState('otro')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [clientSatisfied, setClientSatisfied] = useState('sin_confirmar')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  function handleConfirm() {
    onConfirm({
      resolution_type: resolutionType,
      resolution_notes: resolutionNotes.trim() || null,
      client_satisfied: clientSatisfied,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 max-w-sm w-full space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FF5B5B]/10 flex items-center justify-center text-[#FF5B5B] text-lg">
            ✕
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F0F0F5]">Cerrar conversación</h3>
            <p className="text-xs text-[#8B8FA8]">Clasifica cómo quedó esta atención</p>
          </div>
        </div>

        {/* ¿Cómo se resolvió? */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-[#8B8FA8] uppercase tracking-wider">
            ¿Cómo se resolvió?
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {RESOLUTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setResolutionType(option.value)}
                className={[
                  'w-full text-left px-3 py-2 rounded text-xs transition border',
                  resolutionType === option.value
                    ? 'bg-[#01A4E3]/10 border-[#01A4E3] text-[#01A4E3]'
                    : 'border-[#3A3A37] text-[#8B8FA8] hover:border-[#8B8FA8]',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notas adicionales */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-[#8B8FA8] uppercase tracking-wider">
            Notas adicionales{' '}
            <span className="ml-1 normal-case font-normal">(opcional)</span>
          </p>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Ej: Técnico visita el jueves 26"
            maxLength={500}
            rows={2}
            className="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-md p-2.5 text-white text-xs outline-none focus:border-[#01A4E3] transition resize-none placeholder-[#8B8FA8]/50"
          />
          <p className="text-[10px] text-[#8B8FA8] text-right">{resolutionNotes.length}/500</p>
        </div>

        {/* ¿El cliente quedó satisfecho? */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-[#8B8FA8] uppercase tracking-wider">
            ¿El cliente quedó satisfecho?
          </p>
          <div className="flex gap-2">
            {SATISFACTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setClientSatisfied(option.value)}
                className={[
                  'flex-1 px-2 py-2 rounded text-[10px] transition border',
                  clientSatisfied === option.value
                    ? option.active
                    : 'border-[#3A3A37] text-[#8B8FA8]',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs border border-[#3A3A37] text-[#8B8FA8] rounded hover:border-[#F0F0F5] hover:text-[#F0F0F5] transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isClosing}
            className="flex-1 py-2.5 text-xs bg-[#FF5B5B]/10 border border-[#FF5B5B]/30 text-[#FF5B5B] rounded hover:bg-[#FF5B5B]/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isClosing && (
              <div className="w-3 h-3 border-2 border-[#FF5B5B] border-t-transparent rounded-full animate-spin" />
            )}
            Confirmar cierre
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Header status dot color ───────────────────────────────

const STATUS_DOT: Record<ChatVariant, string> = {
  assigned:   'bg-[#FFB84D]',
  unassigned: 'bg-[#FF5B5B]',
  bot:        'bg-[#00D4AA]',
  monitoring: 'bg-[#FFB84D]',
}

// ── Page ──────────────────────────────────────────────────

export default function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { advisor, role } = useAuthStore()

  const fromAlert: boolean = location.state?.fromAlert ?? false
  const alertAdvisorName: string | undefined = location.state?.advisorName

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalMessages, setTotalMessages] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isAdvisorTyping, setIsAdvisorTyping] = useState(false)

  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  const loadConversation = useCallback(async () => {
    if (!conversationId) return
    setIsLoading(true)
    try {
      const { conversation: conv, messages: msgs, total_messages: total } =
        await conversationsService.getById(conversationId, fromAlert ? 100 : 50)
      setConversation(conv)
      setMessages((prev) => {
        if (prev.length === 0) return msgs
        const existingIds = new Set(prev.map((m) => m.id))
        const newMsgs = msgs.filter((m) => !existingIds.has(m.id))
        return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev
      })
      setTotalMessages(total)
    } catch {
      toast.error('No se pudo cargar la conversación')
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, fromAlert])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversation()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadConversation])

  // Scroll to bottom after initial load — deferred to after paint so scrollHeight is correct
  useEffect(() => {
    if (isLoading) return
    const raf = requestAnimationFrame(() => {
      if (feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [isLoading])

  // Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (isAdvisorTyping && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [isAdvisorTyping])

  async function loadMoreMessages() {
    if (isLoadingMore || messages.length >= totalMessages) return
    const container = feedRef.current
    const prevScrollHeight = container ? container.scrollHeight : 0
    setIsLoadingMore(true)
    try {
      const { messages: older } = await conversationsService.getMessages(
        conversationId!,
        { limit: 50, offset: messages.length }
      )
      setMessages((prev) => [...older, ...prev])
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight
        }
      }, 0)
    } catch {
      // silently fail
    } finally {
      setIsLoadingMore(false)
    }
  }

  // WS handlers — called by useWebSocket hook
  const onNewMessage = useCallback((event: { message: Message & { conversation_id: string } }) => {
    if (event.message.conversation_id === conversationId) {
      setMessages((prev) => {
        // Guard against duplicates: the HTTP response already appended outbound messages
        if (prev.some((m) => m.id === event.message.id)) return prev
        return [...prev, event.message]
      })
    }
  }, [conversationId])

  const onConversationReturned = useCallback((event: { conversation_id: string }) => {
    if (event.conversation_id === conversationId) {
      loadConversation()
    }
  }, [conversationId, loadConversation])

  const onConversationClosed = useCallback((event: WSConversationClosed) => {
    if (event.conversation_id === conversationId) {
      navigate('/')
    }
  }, [conversationId, navigate])

  const onEscalationAssigned = useCallback((event: WSEscalationAssigned) => {
    if (event.conversation_id === conversationId) {
      loadConversation()
    }
  }, [conversationId, loadConversation])

  // Stable handlers object — prevents useWebSocket's effect from re-running on every render
  const wsHandlers = useMemo(() => ({
    onMessageNew: onNewMessage,
    onConversationReturned: onConversationReturned,
    onConversationClosed: onConversationClosed,
    onEscalationAssigned: onEscalationAssigned,
  }), [onNewMessage, onConversationReturned, onConversationClosed, onEscalationAssigned])

  // Hook up real-time websocket updates
  const { subscribeConversation, unsubscribeConversation } = useWebSocket(wsHandlers)

  // Subscribe to the conversation when it's known; unsubscribe on unmount or id change
  useEffect(() => {
    if (!conversationId) return
    subscribeConversation(conversationId)
    return () => {
      unsubscribeConversation()
    }
  }, [conversationId, subscribeConversation, unsubscribeConversation])

  // Auto-scroll when a new message is appended (not when old messages are prepended)
  const lastMessageIdRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMsg.id
      if (feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight
      }
    }
  }, [messages])

  function extractErrorCode(err: unknown): string | undefined {
    const e = err as { response?: { data?: { detail?: { code?: string } } } }
    return e.response?.data?.detail?.code
  }

  function extractErrorMessage(err: unknown): string | undefined {
    const e = err as { response?: { data?: { detail?: { message?: string } } } }
    return e.response?.data?.detail?.message
  }

  function getGlobalErrorMessage(code: string | undefined, fallback: string): string {
    switch (code) {
      case 'BOT_IS_ACTIVE':            return 'El bot tiene el control de esta conversación.'
      case 'NOT_ASSIGNED':             return 'No estás asignado a esta conversación.'
      case 'CONVERSATION_NOT_FOUND':   return 'Conversación no encontrada.'
      case 'ALREADY_CLOSED':           return 'Esta conversación ya fue cerrada.'
      default:                         return fallback
    }
  }

  async function handleTake() {
    if (!conversationId) return
    setIsAssigning(true)
    try {
      await conversationsService.assign(conversationId)
      await loadConversation()
    } catch (err: unknown) {
      const code = extractErrorCode(err)
      if (code === 'ALREADY_ASSIGNED') {
        toast.error('Otro asesor ya tomó esta conversación.')
        await loadConversation()
      } else if (code === 'MAX_CONVERSATIONS_REACHED') {
        toast.error(extractErrorMessage(err) ?? 'Has alcanzado el límite de conversaciones simultáneas')
      } else if (code === 'CONVERSATION_NOT_ESCALATED') {
        toast.error('La conversación no está en estado escalado.')
      } else {
        toast.error(getGlobalErrorMessage(code, 'No se pudo tomar la conversación'))
      }
    } finally {
      setIsAssigning(false)
    }
  }

  async function handleReturnBot() {
    if (!conversationId) return
    setIsReturning(true)
    try {
      await conversationsService.returnToBot(conversationId)
      setShowReturnModal(false)
      await loadConversation()
    } catch (err: unknown) {
      const code = extractErrorCode(err)
      setShowReturnModal(false)
      if (code === 'BOT_ALREADY_ACTIVE') {
        toast.info('El bot ya controla esta conversación.')
        await loadConversation()
      } else {
        toast.error(getGlobalErrorMessage(code, 'No se pudo devolver la conversación al bot'))
      }
    } finally {
      setIsReturning(false)
    }
  }

  async function handleClose(data: CloseData) {
    if (!conversationId) return
    setIsClosing(true)
    try {
      await conversationsService.close(conversationId, data)
      setShowCloseModal(false)
      navigate('/')
    } catch (err: unknown) {
      const code = extractErrorCode(err)
      if (code === 'ALREADY_CLOSED') {
        toast.error('Esta conversación ya fue cerrada.')
      } else {
        toast.error(getGlobalErrorMessage(code, 'No se pudo cerrar la conversación'))
      }
    } finally {
      setIsClosing(false)
    }
  }

  function getChatVariant(): ChatVariant {
    if (role === 'admin') return 'monitoring'
    if (!conversation) return 'unassigned'
    if (conversation.bot_activo) return 'bot'
    if (conversation.escalation?.advisor?.id === advisor?.id) return 'assigned'
    return 'unassigned'
  }

  const variant = getChatVariant()
  const isReadonly = variant === 'unassigned' || variant === 'bot' || variant === 'monitoring'
  const clientName = conversation?.client.full_name ?? 'Cliente'
  const channel = conversation?.channel ?? ''

  // Wait time placeholder — will come from conversation metadata in future
  const waitMinutes: number | null = null

  return (
    <section
      id="screen-chat"
      className="flex-1 flex flex-col lg:flex-row relative min-h-0"
    >
      {/* ── Central column ── */}
      <div className="flex-1 flex flex-col bg-[#1D1D1B] border-r border-[#3A3A37] min-w-0 min-h-0">

        {/* Header */}
        <div className="bg-[#252522] p-3 border-b border-[#3A3A37] flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#2E2E2B] hover:bg-[#3A3A37] border border-[#3A3A37] rounded text-xs font-semibold text-[#8B8FA8] hover:text-white transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Volver</span>
            </button>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                {clientName}
                <span
                  id="chat-header-status-dot"
                  className={`w-1.5 h-1.5 rounded-full inline-block ${STATUS_DOT[variant]}`}
                />
              </h3>
              <p className="text-[9px] text-[#8B8FA8]">
                Canal: {channel || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Monitoring pill */}
            {variant === 'monitoring' && (
              <div
                id="monitoring-mode-pill"
                className="bg-[#FFB84D]/15 text-[#FFB84D] text-[10px] px-2.5 py-1 rounded font-black border border-[#FFB84D]/30 flex items-center gap-1 animate-pulse"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Monitoreo</span>
              </div>
            )}

            {/* Mobile details toggle */}
            <button
              type="button"
              onClick={() => setRightPanelOpen(true)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-[#2E2E2B] hover:bg-[#3A3A37] border border-[#3A3A37] rounded text-xs font-semibold text-[#8B8FA8] hover:text-white transition"
            >
              <svg className="w-4 h-4 text-[#01A4E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Detalles</span>
            </button>
          </div>
        </div>

        {/* Message feed */}
        <MessageFeed
          messages={messages}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          showEscalationEvent={conversation?.status === 'escalada'}
          showReturnedEvent={conversation?.bot_activo === true && variant === 'bot'}
          advisorName={fromAlert ? alertAdvisorName : advisor?.full_name}
          onScrollTop={loadMoreMessages}
          feedRef={feedRef}
          isTyping={isAdvisorTyping}
        />

        {/* Input area or banners */}
        {!isReadonly ? (
          <ChatInput
            conversationId={conversationId!}
            clientName={clientName}
            channel={channel}
            waitMinutes={waitMinutes}
            onMessageSent={(msg) => setMessages((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
            )}
            onError={() => {}}
            onTypingChange={setIsAdvisorTyping}
          />
        ) : (
          <div className="p-3 bg-[#252522] border-t border-[#3A3A37] shrink-0">
            {variant === 'unassigned' && (
              <div
                id="chat-banner-readonly"
                className="p-2.5 bg-[#2E2E2B] text-center border border-[#3A3A37] rounded text-xs text-[#FFB84D] font-semibold"
              >
                ⚠️ Modo de Solo Lectura • Debes tomar la conversación para responder.
              </div>
            )}
            {variant === 'monitoring' && (
              <div
                id="chat-banner-monitoring"
                className="p-2.5 bg-[#FFB84D]/5 text-center border border-[#FFB84D]/20 rounded text-xs text-[#FFB84D] font-semibold"
              >
                👁️ Modo Monitoreo • Vista de solo lectura para administradores.
              </div>
            )}
            {variant === 'bot' && (
              <div
                id="chat-banner-bot"
                className="p-2.5 bg-[#00D4AA]/10 text-center border border-[#00D4AA]/30 rounded text-xs text-[#00D4AA] font-semibold"
              >
                🤖 El bot retomó esta conversación de forma autónoma.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile backdrop ── */}
      {rightPanelOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-30 lg:hidden"
          onClick={() => setRightPanelOpen(false)}
        />
      )}

      {/* ── Right panel ── */}
      {conversation && (
        <div className={`${rightPanelOpen ? 'flex' : 'hidden'} lg:flex`}>
          <ClientPanel
            conversation={conversation}
            variant={variant}
            onTake={handleTake}
            onReturnBot={() => setShowReturnModal(true)}
            onCloseConversation={() => setShowCloseModal(true)}
            isTaking={isAssigning}
            isReturning={isReturning}
            onClose={() => setRightPanelOpen(false)}
          />
        </div>
      )}

      {/* ── Return-bot modal ── */}
      {showReturnModal && (
        <ReturnBotModal
          onConfirm={handleReturnBot}
          onCancel={() => setShowReturnModal(false)}
          isReturning={isReturning}
        />
      )}

      {/* ── Close conversation modal ── */}
      {showCloseModal && (
        <CloseConversationModal
          onConfirm={handleClose}
          onCancel={() => setShowCloseModal(false)}
          isClosing={isClosing}
        />
      )}


</section>
  )
}
