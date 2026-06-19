import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { conversationsService } from '../services'
import type { Conversation } from '../types'
import { ConversationCard } from '../components/bandeja/ConversationCard'
import { FilterBar } from '../components/bandeja/FilterBar'
import { MetricsDashboard } from '../components/bandeja/MetricsDashboard'

// --- LOCAL COMPONENTS ---

function ConnectedAdvisors() {
  return (
    <div className="text-[11px] text-[#8B8FA8] mt-1 flex flex-wrap items-center gap-1.5" id="connected-advisors-panel">
      <span>En línea ahora:</span>
      <span className="inline-flex items-center gap-1 text-white bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
        <span className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full"></span>
        Andrés
        <span className="text-[#00D4AA] font-bold">1/3</span>
      </span>
      <span className="inline-flex items-center gap-1 text-white bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
        <span className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full"></span>
        Diana
        <span className="text-[#FF5B5B] font-bold">3/3</span>
      </span>
      <span className="inline-flex items-center gap-1 text-[#8B8FA8] bg-[#252522] px-2 py-0.5 rounded border border-[#3A3A37]">
        <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></span>
        Julio
        <span className="text-[#8B8FA8]">Off</span>
      </span>
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
  const { advisor, role } = useAuthStore() as { advisor: { max_conversations?: number, active_conversations?: number } | null, role: string | null }

  // Datos del servidor
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Filtros activos
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [channelFilter, setChannelFilter] = useState<string | null>(null)

  // Modal tomar conversación
  const [takeTarget, setTakeTarget] = useState<Conversation | null>(null)
  const [isTaking, setIsTaking] = useState(false)

  // Extraemos el refetching hacia un efecto seguro para el Linter
  useEffect(() => {
    let isMounted = true
    
    const fetchConversations = async () => {
      setIsLoading(true)
      try {
        const result = await conversationsService.list({
          status: statusFilter ?? undefined,
          channel: channelFilter ?? undefined,
          limit: 50,
          offset: 0,
        })
        if (isMounted) {
          setConversations(result.conversations || [])
          setTotal(result.total || 0)
        }
      } catch (err) {
        console.error('Error loading conversations', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    fetchConversations()
    
    return () => {
      isMounted = false
    }
  }, [statusFilter, channelFilter])

  // Refetch manual para el botón Refresh y el WebSocket temporal
  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const result = await conversationsService.list({
        status: statusFilter ?? undefined,
        channel: channelFilter ?? undefined,
        limit: 50,
        offset: 0,
      })
      setConversations(result.conversations || [])
      setTotal(result.total || 0)
    } catch (err) {
      console.error('Error loading conversations', err)
    } finally {
      setIsLoading(false)
    }
  }

  const confirmTake = async () => {
    if (!takeTarget) return
    setIsTaking(true)
    try {
      await conversationsService.assign(takeTarget.id)
      setTakeTarget(null)
      await loadConversations()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: { code?: string } } } }
      const code = err.response?.data?.detail?.code
      if (code === 'MAX_CONVERSATIONS_REACHED') {
        alert('Límite de conversaciones alcanzado')
      }
      if (code === 'ALREADY_ASSIGNED') {
        alert('Esta conversación ya fue asignada')
        setTakeTarget(null)
        await loadConversations()
      }
    } finally {
      setIsTaking(false)
    }
  }

  // Event handlers placeholder for Websockets
  const handleEscalationNew = (data: unknown) => {
    if (data) {
      // Future FE-10 optimization: append card without reloading
    }
    loadConversations()
  }

  const handleEscalationAssigned = (data: unknown) => {
    if (data) {
      // Future FE-10 optimization: update card directly
    }
    loadConversations()
  }

  // WebSocket placeholder references to avoid unused locals compiler errors
  if (false as boolean) {
    console.log(handleEscalationNew, handleEscalationAssigned)
  }

  const advisorMaxConv = advisor?.max_conversations ?? 3
  const advisorActiveConv = advisor?.active_conversations ?? 0

  return (
    <section id="screen-bandeja" className="flex-1 flex flex-col p-4 md:p-6 space-y-4">
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
        
        {role === 'admin' && <MetricsDashboard conversations={conversations} />}
      </div>

      <FilterBar 
        conversations={conversations}
        activeStatus={statusFilter}
        activeChannel={channelFilter}
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
                advisorMaxConversations={advisorMaxConv}
                advisorActiveConversations={advisorActiveConv}
                onTake={setTakeTarget}
                onView={(id) => navigate(`/chat/${id}`)}
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
