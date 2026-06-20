import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { conversationsService } from '../services/conversations'
import { useAuthStore } from '../store/authStore'
import type { Conversation, Message } from '../types'
import MessageFeed from '../components/chat/MessageFeed'
import ChatInput from '../components/chat/ChatInput'
import ClientPanel, { type ChatVariant } from '../components/chat/ClientPanel'
import { useWebSocket } from '../hooks/useWebSocket'

// ── Demo data (visible at /chat/demo) ────────────────────

const DEMO_CONVERSATION: Conversation = {
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
    summary:
      'El cliente presenta alta molestia tras 3 días sin agua caliente. Reporta fuga parcial inundando el piso. El bot no logró clasificar la dirección correctamente.',
    escalated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
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

const DEMO_MESSAGES: Message[] = [
  {
    id: 'm1',
    wam_id: null,
    direction: 'inbound',
    msg_type: 'text',
    content: 'Hola, buenas tardes. Necesito urgente que me colaboren con el daño de mi calentador de agua. Es de gas de paso y tiene una fuga de agua abajo.',
    media_url: null, media_mime_type: null, media_size_bytes: null,
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    delivered_via: 'whatsapp',
  },
  {
    id: 'm2',
    wam_id: null,
    direction: 'outbound_bot',
    msg_type: 'text',
    content: 'Para procesar tu reporte, por favor confírmame el código de inmueble o la dirección del apartamento en el que resides actualmente.',
    media_url: null, media_mime_type: null, media_size_bytes: null,
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    delivered_via: 'whatsapp',
  },
  {
    id: 'm3',
    wam_id: null,
    direction: 'inbound',
    msg_type: 'text',
    content: 'Es en la Calle 145 #12-45 Apto 502, el contrato está a nombre de Carlos Mendoza. ¡Llevo tres días reportando esto y el robot me responde lo mismo!',
    media_url: null, media_mime_type: null, media_size_bytes: null,
    timestamp: new Date(Date.now() - 26 * 60 * 1000).toISOString(),
    delivered_via: 'whatsapp',
  },
  {
    id: 'm4',
    wam_id: null,
    direction: 'inbound',
    msg_type: 'image',
    content: 'Foto del daño en el calentador',
    media_url: null, media_mime_type: 'image/jpeg', media_size_bytes: 245000,
    timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    delivered_via: 'whatsapp',
  },
  {
    id: 'm5',
    wam_id: null,
    direction: 'outbound_advisor',
    msg_type: 'document',
    content: 'orden_reparacion_4592.pdf',
    media_url: null, media_mime_type: 'application/pdf', media_size_bytes: 184320,
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    delivered_via: 'whatsapp',
  },
  {
    id: 'm6',
    wam_id: null,
    direction: 'outbound_advisor',
    msg_type: 'text',
    content: 'Carlos, ya radicamos la orden de reparación #9834 en el sistema SIMI. Un técnico se comunicará con usted en las próximas 2 horas.',
    media_url: null, media_mime_type: null, media_size_bytes: null,
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    delivered_via: 'whatsapp',
  },
]

// const DEMO_VARIANTS: { label: string; variant: ChatVariant }[] = [
//   { label: 'Asignado a mí', variant: 'assigned' },
//   { label: 'Sin asignar', variant: 'unassigned' },
//   { label: 'Bot activo', variant: 'bot' },
//   { label: 'Monitoreo (admin)', variant: 'monitoring' },
// ]

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
          Asegúrate de haber resuelto la consulta o agendado el requerimiento en SIMI antes
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
  const { advisor, role } = useAuthStore()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalMessages, setTotalMessages] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [demoVariant] = useState<ChatVariant>('assigned')

  const isDemo = conversationId === 'demo'
  const feedRef = useRef<HTMLDivElement>(null)

  const loadConversation = useCallback(async () => {
    if (!conversationId) return
    setIsLoading(true)
    try {
      const { conversation: conv } = await conversationsService.getById(conversationId)
      setConversation(conv)
      const { messages: msgs, total } = await conversationsService.getMessages(
        conversationId,
        { limit: 50, offset: 0 }
      )
      setMessages(msgs)
      setTotalMessages(total)
    } catch {
      toast.error('No se pudo cargar la conversación')
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    if (isDemo) {
      const timer = setTimeout(() => {
        setConversation(DEMO_CONVERSATION)
        setMessages(DEMO_MESSAGES)
        setTotalMessages(DEMO_MESSAGES.length)
        setIsLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => {
      loadConversation()
    }, 0)
    return () => clearTimeout(timer)
  }, [isDemo, loadConversation])

  // Scroll to bottom after initial load
  useEffect(() => {
    if (!isLoading && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [isLoading])

  async function loadMoreMessages() {
    if (isLoadingMore || messages.length >= totalMessages) return
    setIsLoadingMore(true)
    try {
      const { messages: older } = await conversationsService.getMessages(
        conversationId!,
        { limit: 50, offset: messages.length }
      )
      setMessages((prev) => [...older, ...prev])
    } catch {
      // silently fail
    } finally {
      setIsLoadingMore(false)
    }
  }

  // WS handlers — called by useWebSocket hook (FE-10)
  function onNewMessage(event: { conversation_id: string; message: Message }) {
    if (event.conversation_id === conversationId) {
      setMessages((prev) => [...prev, event.message])
    }
  }

  function onConversationReturned(event: { conversation_id: string }) {
    if (event.conversation_id === conversationId) {
      loadConversation()
    }
  }

  // Hook up real-time websocket updates
  useWebSocket({
    onMessageNew: onNewMessage,
    onConversationReturned: onConversationReturned,
  })

  async function handleTake() {
    if (!conversationId) return
    setIsAssigning(true)
    try {
      await conversationsService.assign(conversationId)
      await loadConversation()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: { code?: string } } } }
      const code = e.response?.data?.detail?.code
      if (code === 'MAX_CONVERSATIONS_REACHED') {
        toast.error('Has alcanzado el límite de conversaciones simultáneas')
      } else if (code === 'ALREADY_ASSIGNED') {
        await loadConversation()
      } else {
        toast.error('No se pudo tomar la conversación')
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
    } catch {
      toast.error('No se pudo devolver la conversación al bot')
    } finally {
      setIsReturning(false)
    }
  }

  function getChatVariant(): ChatVariant {
    if (isDemo) return demoVariant
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
      className="flex-1 flex flex-col lg:flex-row relative"
    >
      {/* ── Central column ── */}
      <div className="flex-1 flex flex-col bg-[#1D1D1B] border-r border-[#3A3A37] min-w-0">

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
          advisorName={advisor?.full_name}
          onScrollTop={loadMoreMessages}
          feedRef={feedRef}
        />

        {/* Input area or banners */}
        {!isReadonly ? (
          <ChatInput
            conversationId={conversationId!}
            clientName={clientName}
            channel={channel}
            waitMinutes={waitMinutes}
            onMessageSent={(msg) => setMessages((prev) => [...prev, msg])}
            onError={() => setSendError(true)}
          />
        ) : (
          <div className="p-3 bg-[#252522] border-t border-[#3A3A37] shrink-0">
            {(variant === 'unassigned' || variant === 'monitoring') && (
              <div
                id="chat-banner-readonly"
                className="p-2.5 bg-[#2E2E2B] text-center border border-[#3A3A37] rounded text-xs text-[#FFB84D] font-semibold"
              >
                ⚠️ Modo de Solo Lectura • Debes tomar la conversación para responder.
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

      {/* Suppress unused warning — sendError state reserved for future use */}
      {void sendError}

    </section>
  )
}
