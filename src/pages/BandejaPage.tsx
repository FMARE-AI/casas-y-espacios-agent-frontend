import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useWSStore } from '../store/wsStore'
import { useToastStore } from '../store/toastStore'
import { conversationsService, advisorsService, metricsService } from '../services'
import type { Conversation, WSEscalationNew, WSConversationClosed, WSQueuePending, DashboardMetrics, WSMessageNew } from '../types'
import { ConversationCard } from '../components/bandeja/ConversationCard'
import { FilterBar } from '../components/bandeja/FilterBar'
import { MetricsDashboard } from '../components/bandeja/MetricsDashboard'
import { useWebSocket, setMyAssignedConversations } from '../hooks/useWebSocket'

// --- LOCAL COMPONENTS ---

function ConnectedAdvisors() {
  const advisors = useWSStore((s) => s.advisors)
  const isAdmin = useAuthStore((s) => s.role) === 'admin'

  if (advisors.length === 0) {
    return (
      <div className="text-[11px] text-[#8B8FA8] mt-1" id="connected-advisors-panel">
        Sin asesoras conectadas
      </div>
    )
  }

  const online  = advisors.filter((a) => a.is_panel_connected)
  const offline = advisors.filter((a) => !a.is_panel_connected)

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1.5" id="connected-advisors-panel">
      {online.map((advisor) => {
        const isBreak   = advisor.availability_status === 'break'
        const isOffline = advisor.availability_status === 'offline'
        const isAtLimit =
          isAdmin &&
          advisor.active_conversations !== undefined &&
          (advisor.active_conversations ?? 0) >= (advisor.max_conversations ?? 3)

        return (
          <span
            key={advisor.id}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              isBreak
                ? 'bg-[#FFB84D]/10 border-[#FFB84D]/25 text-[#FFB84D]'
                : isOffline
                ? 'bg-[#8B8FA8]/10 border-[#8B8FA8]/25 text-[#8B8FA8]'
                : 'bg-[#00D4AA]/10 border-[#00D4AA]/25 text-[#F0F0F5]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isBreak ? 'bg-[#FFB84D] animate-pulse' : isOffline ? 'bg-[#8B8FA8]' : 'bg-[#00D4AA]'
            }`} />
            {advisor.full_name.split(' ')[0]}
            {isBreak && <span className="text-[#FFB84D]/80 font-normal">· Descanso</span>}
            {isOffline && <span className="text-[#8B8FA8]/80 font-normal">· No disponible</span>}
            {!isBreak && !isOffline && isAdmin && advisor.active_conversations !== undefined && (
              <span className={`font-mono ${isAtLimit ? 'text-[#FF5B5B]' : 'text-[#8B8FA8]'}`}>
                {advisor.active_conversations}/{advisor.max_conversations}
              </span>
            )}
          </span>
        )
      })}

      {offline.length > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-[#FF5B5B] border border-[#FF5B5B]/25 bg-[#FF5B5B]/10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B5B] flex-shrink-0" />
          {offline.length === 1
            ? `${offline[0].full_name.split(' ')[0]} · fuera`
            : `${offline.length} fuera`}
        </span>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[#252522] border border-[#3A3A37] rounded-lg p-3.5 space-y-3.5 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-3 bg-[#2E2E2B] rounded w-1/4"></div>
        <div className="h-3 bg-[#2E2E2B] rounded w-1/12"></div>
      </div>
      <div className="h-5 bg-[#2E2E2B] rounded w-3/4"></div>
      <div className="h-3 bg-[#2E2E2B] rounded w-1/2"></div>
    </div>
  )
}

function EmptyState() {
  return (
    <div id="bandeja-empty-state" className="col-span-full bg-[#252522] border border-[#3A3A37] rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3 max-w-md mx-auto w-full mt-4">
      <div className="bg-[#2E2E2B] w-12 h-12 rounded-full flex items-center justify-center text-[#01A4E3] border border-[#3A3A37]">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">No hay conversaciones</h4>
        <p className="text-xs text-[#8B8FA8] mt-1 leading-relaxed">
          No se encontraron chats que coincidan con este filtro.
        </p>
      </div>
    </div>
  )
}

function TakeModal({
  conversation,
  advisorActiveConversations,
  advisorMaxConversations,
  onConfirm,
  onCancel,
  isTaking,
}: {
  conversation: Conversation | null
  advisorActiveConversations: number
  advisorMaxConversations: number
  onConfirm: () => void
  onCancel: () => void
  isTaking: boolean
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  if (!conversation) return null

  const waitSeconds = conversation.escalation?.escalated_at
    ? Math.floor((now - new Date(conversation.escalation.escalated_at).getTime()) / 1000)
    : 0
  const waitMinutes = Math.floor(waitSeconds / 60)

  return (
    <div id="dialog-modal-overlay" className="fixed inset-0 bg-[#1D1D1B]/90 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div id="modal-confirm-take" className="bg-[#252522] border border-[#3A3A37] rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-[#01A4E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            ¿Tomar esta conversación?
          </h3>
          <p className="text-xs text-[#8B8FA8] mt-2">Te asignarás como responsable directo de la comunicación.</p>
        </div>

        <div className="p-3 bg-[#2E2E2B]/40 rounded border border-[#3A3A37] text-xs space-y-1.5">
          <p className="text-[#8B8FA8]">Cliente: <strong className="text-white" id="modal-take-client">{conversation.client?.full_name || 'Desconocido'}</strong></p>
          <p className="text-[#8B8FA8]">Motivo: <span className="font-mono text-[#FF5B5B] font-bold" id="modal-take-motive">{conversation.escalation?.reason || 'Sin motivo'}</span></p>
          <p className="text-[#8B8FA8]">Espera acumulada: <span className="text-[#FFB84D] font-bold" id="modal-take-wait">{waitMinutes} min</span></p>
        </div>

        <div className="flex items-center justify-between p-2 bg-[#2E2E2B] rounded border border-[#3A3A37] text-[11px]">
          <span className="text-[#8B8FA8]">Tus conversaciones activas:</span>
          <span className="font-bold" id="modal-take-active-count">
            <span className={advisorActiveConversations < advisorMaxConversations ? "text-[#00D4AA]" : "text-[#FF5B5B]"}>
              {advisorActiveConversations} de {advisorMaxConversations}
            </span>
          </span>
        </div>

        <p className="text-[11px] text-[#8B8FA8] italic leading-relaxed">Nota: Tus compañeros de área verán que este chat está siendo atendido y se desactivarán las respuestas automáticas del bot.</p>

        <div className="pt-2 flex justify-end gap-2.5 text-xs">
          <button onClick={onCancel} className="px-4 py-2.5 bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#8B8FA8] hover:text-white rounded font-semibold transition active:scale-95" disabled={isTaking}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2.5 bg-[#01A4E3] text-white rounded font-bold hover:bg-[#0190C8] transition active:scale-95" disabled={isTaking}>
            {isTaking ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- MAIN PAGE COMPONENT ---

export default function BandejaPage() {
  const navigate = useNavigate()
  const advisor = useAuthStore((s) => s.advisor)
  const role = useAuthStore((s) => s.role)

  // Datos del servidor
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [statusCounts, setStatusCounts] = useState({ all: 0, escaladas: 0, activas: 0, cerradas: 0 })
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null)

  // Filtros activos — asesor inicia en "mine", admin en todas
  const [statusFilter, setStatusFilter] = useState<string | null>(() =>
    role === 'asesor' ? 'mine' : null
  )
  const [channelFilter, setChannelFilter] = useState<string | null>(null)

  // Modal tomar conversación
  const [takeTarget, setTakeTarget] = useState<Conversation | null>(null)
  const [isTaking, setIsTaking] = useState(false)

  // Cargar perfil al montar la página
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await advisorsService.getMe()
        useAuthStore.getState().setAdvisor(res.advisor)
      } catch (err) {
        console.error('Error fetching advisor profile:', err)
      }
    }
    fetchProfile()
  }, [])

  // Cargar indicador de asesores en línea al montar (disponible para todos los roles)
  useEffect(() => {
    const loadOnlineAdvisors = async () => {
      try {
        const advisors = await advisorsService.getOnline()
        useWSStore.getState().setAdvisors(advisors)
      } catch {
        // fail silently — indicator stays empty, panel is not broken
      }
    }
    loadOnlineAdvisors()
  }, [])

  const refreshCounts = async (channel?: string) => {
    try {
      const result = await conversationsService.list({ channel, limit: 100, offset: 0 })
      const all = result.conversations || []
      const escaladas = all.filter(c => c.status === 'escalada').length
      const activas = all.filter(c => c.status === 'activa').length
      setStatusCounts({
        all: escaladas + activas,
        escaladas,
        activas,
        cerradas: all.filter(c => c.status === 'cerrada').length,
      })
    } catch (err) {
      console.error('Error fetching counts', err)
    }
  }

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await conversationsService.list({
        status: statusFilter ?? undefined,
        channel: channelFilter ?? undefined,
        limit: 50,
        offset: 0,
      })
      let convs = result.conversations || []
      // "Todas" and "mine" tabs never show closed conversations — those live in /historial
      if (!statusFilter || statusFilter === 'mine') {
        convs = convs.filter(c => c.status !== 'cerrada')
      }
      setConversations(convs)
      setTotal(convs.length)

      // Keep the WS sound-gate in sync: register conversations assigned to the current advisor
      // so they hear notification sounds even when navigated away from the chat.
      const currentAdvisorId = useAuthStore.getState().advisor?.id
      const myIds = convs
        .filter(c => c.escalation?.advisor?.id === currentAdvisorId)
        .map(c => c.id)
      setMyAssignedConversations(myIds)
    } catch (err) {
      console.error('Error loading conversations', err)
    } finally {
      setIsLoading(false)
    }
    refreshCounts(channelFilter ?? undefined)

    if (role === 'admin') {
      try {
        const res = await metricsService.getMetrics()
        setDashboardMetrics(res)
      } catch (err) {
        console.error('Error loading metrics:', err)
      }
    }
  }, [statusFilter, channelFilter, role])

  useEffect(() => {
    let ignore = false
    const timer = setTimeout(() => {
      if (!ignore) {
        loadConversations()
      }
    }, 0)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [loadConversations])

  const confirmTake = async () => {
    if (!takeTarget) return
    setIsTaking(true)
    try {
      await conversationsService.assign(takeTarget.id)
      setTakeTarget(null)
      // Recargar perfil para actualizar active_conversations
      try {
        const res = await advisorsService.getMe()
        useAuthStore.getState().setAdvisor(res.advisor)
      } catch (profileErr) {
        console.error('Error refreshing advisor profile after take:', profileErr)
      }
      await loadConversations()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: { code?: string } } } }
      const code = err.response?.data?.detail?.code
      if (code === 'MAX_CONVERSATIONS_REACHED') {
        useToastStore.getState().showToast('Has alcanzado el límite de conversaciones simultáneas.', 'error')
        setTakeTarget(null)
      } else if (code === 'ALREADY_ASSIGNED') {
        useToastStore.getState().showToast('Otro asesor ya tomó esta conversación primero.', 'error')
        setTakeTarget(null)
        await loadConversations()
      }
    } finally {
      setIsTaking(false)
    }
  }

  // Reset badge when the advisor opens a chat (ChatPage dispatches this)
  useEffect(() => {
    const handleReset = (e: Event) => {
      const { conversationId, unreadCount } =
        (e as CustomEvent<{ conversationId: string; unreadCount: number | undefined }>).detail
      if (unreadCount !== 0) return
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
      )
    }
    window.addEventListener('conversation:unread', handleReset)
    return () => window.removeEventListener('conversation:unread', handleReset)
  }, [])

  // Update last_message preview for every new message (inbound or outbound).
  // Only increment unread_count for inbound — outbound messages are already seen by the sender.
  // Sound is NOT played here — useWebSocket handles it centrally with role + assignment rules.
  const handleMessageNew = useCallback((wsMsg: WSMessageNew) => {
    const msg = wsMsg.message
    const convId = msg.conversation_id ?? ''
    if (!convId) return
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        return {
          ...c,
          unread_count: msg.direction === 'inbound' ? c.unread_count + 1 : c.unread_count,
          last_message: { msg_type: msg.msg_type, content: msg.content ?? null },
          last_activity: msg.created_at,
        }
      })
    )
  }, [])

  // Event handlers for Websockets
  const handleEscalationNew = useCallback((data: WSEscalationNew) => {
    if (data) {
      // Future FE-10 optimization: append card without reloading
    }
    loadConversations()
  }, [loadConversations])

  const handleEscalationAssigned = useCallback(() => {
    loadConversations()
  }, [loadConversations])

  const handleConversationClosed = useCallback((data: WSConversationClosed) => {
    if (data) {
      // Future FE-10 optimization: handle closed state directly
    }
    loadConversations()
  }, [loadConversations])

  const handleConversationReturned = useCallback(() => {
    loadConversations()
  }, [loadConversations])

  const handleQueuePending = useCallback((data: WSQueuePending) => {
    useToastStore.getState().showToast(data.message, 'info')
    loadConversations()
  }, [loadConversations])

  // Hook up real-time websocket updates
  useWebSocket({
    onMessageNew: handleMessageNew,
    onEscalationNew: handleEscalationNew,
    onEscalationAssigned: handleEscalationAssigned,
    onConversationClosed: handleConversationClosed,
    onConversationReturned: handleConversationReturned,
    onQueuePending: handleQueuePending,
  })

  const advisorMaxConv = advisor?.max_conversations ?? 3
  const advisorActiveConv = advisor?.active_conversations ?? 0

  const handleView = useCallback((id: string) => {
    navigate(`/chat/${id}`)
  }, [navigate])

  return (
    <section
      id="screen-bandeja"
      className="flex-1 flex flex-col p-4 md:p-6 space-y-4"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #1e3a4a 0%, #1a1a18 40%, #111110 100%)' }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3A3A37] pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            Bandeja de Entrada
            <span className="bg-[#01A4E3]/15 text-[#01A4E3] text-xs px-2.5 py-0.5 rounded-full font-bold" id="bandeja-total-counter">
              {total} Totales
            </span>
          </h2>
          <ConnectedAdvisors />
        </div>
        
        {role === 'admin' && <MetricsDashboard metrics={dashboardMetrics} />}
      </div>

      <FilterBar
        conversations={conversations}
        statusCounts={statusCounts}
        activeStatus={statusFilter}
        activeChannel={channelFilter}
        currentAdvisorId={advisor?.id ?? ''}
        advisorRole={role}
        onStatusChange={setStatusFilter}
        onChannelChange={setChannelFilter}
        onRefresh={loadConversations}
      />

      {isLoading ? (
        <div id="bandeja-skeleton" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div id="bandeja-real-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {conversations.length === 0 ? (
            <EmptyState />
          ) : (
            conversations.map(conv => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                currentAdvisorId={advisor?.id ?? ''}
                advisorMaxConversations={advisorMaxConv}
                advisorActiveConversations={advisorActiveConv}
                onTake={setTakeTarget}
                onView={handleView}
                isAdmin={role === 'admin'}
              />
            ))
          )}
        </div>
      )}

      {takeTarget && (
        <TakeModal 
          conversation={takeTarget}
          advisorActiveConversations={advisorActiveConv}
          advisorMaxConversations={advisorMaxConv}
          onConfirm={confirmTake}
          onCancel={() => setTakeTarget(null)}
          isTaking={isTaking}
        />
      )}
    </section>
  )
}
