import { useState, useEffect, useMemo, memo } from 'react'
import type { Conversation, ConversationLastMessage } from '../../types'

interface ConversationCardProps {
  conversation: Conversation
  currentAdvisorId: string
  advisorMaxConversations: number
  advisorActiveConversations: number
  onTake: (conversation: Conversation) => void
  onView: (conversationId: string) => void
  isAdmin?: boolean
}

const CLIENT_TYPE_LABELS: Record<string, string> = {
  inquilino:   'Inquilino',
  propietario: 'Propietario',
  prospecto:   'Prospecto',
  desconocido: 'Sin clasificar',
}

const ESCALATION_REASON_LABELS: Record<string, string> = {
  solicitud_usuario:     'Solicitó asesor',
  frustracion_detectada: 'Frustración detectada',
  no_clasificado:        'Sin clasificar',
  error_simi:            'Error del sistema',
}

function formatWaitTime(seconds: number): string {
  if (seconds < 60) return 'Ahora'
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    return `hace ${mins} min`
  }
  const hours = Math.floor(seconds / 3600)
  return `hace ${hours}h`
}

function getLastMessagePreview(lastMessage: ConversationLastMessage | null): string {
  if (!lastMessage) return 'Sin mensajes'
  switch (lastMessage.msg_type) {
    case 'audio':    return '🎤 Mensaje de audio'
    case 'image':    return '📷 Imagen'
    case 'video':    return '🎥 Video'
    case 'document': return '📄 Documento'
    case 'text':
      if (!lastMessage.content) return 'Sin mensajes'
      return lastMessage.content.length > 50
        ? lastMessage.content.slice(0, 50) + '...'
        : lastMessage.content
    default:         return 'Sin mensajes'
  }
}

type CardVariant = 'A' | 'A2' | 'B' | 'C' | 'D'

function getVariant(conversation: Conversation, now: number): CardVariant {
  if (conversation.status === 'cerrada') return 'D'

  const hasAdvisor = !!conversation.escalation?.advisor
  if (hasAdvisor) return 'B'

  if (conversation.status === 'activa') return 'C'

  if (conversation.status === 'escalada') {
    const waitSeconds = conversation.escalation?.escalated_at
      ? Math.floor((now - new Date(conversation.escalation.escalated_at).getTime()) / 1000)
      : (conversation.escalation?.wait_seconds ?? 0)

    return waitSeconds >= 900 ? 'A2' : 'A'
  }

  return 'C'
}

export const ConversationCard = memo(function ConversationCard({
  conversation,
  currentAdvisorId,
  advisorMaxConversations,
  advisorActiveConversations,
  onTake,
  onView,
  isAdmin = false,
}: ConversationCardProps) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const variant = useMemo(() => getVariant(conversation, now), [conversation, now])

  const containerStyles = {
    A: 'border-l-[3px] border-l-[#FF5B5B] hover:bg-[#2E2E2B]/40',
    A2: 'critical-pulse-card hover:bg-[#2E2E2B]/40',
    B: 'border-l-[3px] border-l-[#FFB84D] hover:bg-[#2E2E2B]/40',
    C: 'border-l-[3px] border-l-[#00D4AA] hover:bg-[#2E2E2B]/40',
    D: 'border-l-[3px] border-l-[#3A3A37] opacity-70 hover:opacity-90 hover:bg-[#2E2E2B]/40',
  }

  const statusChipStyles = {
    A: 'bg-[#FF5B5B]/15 text-[#FF5B5B]',
    A2: 'bg-[#FF5B5B] text-white',
    B: 'bg-[#FFB84D]/15 text-[#FFB84D]',
    C: 'bg-[#00D4AA]/15 text-[#00D4AA]',
    D: 'bg-[#3A3A37] text-[#8B8FA8]',
  }

  const statusChipText = {
    A: 'Escalada',
    A2: 'CRÍTICO',
    B: 'En Atención',
    C: conversation.bot_activo ? 'Activa (Bot)' : 'Activa',
    D: 'Cerrada',
  }

  const elapsed = useMemo(() => {
    const timestamp = (conversation.status === 'escalada' && conversation.escalation?.escalated_at)
      ? conversation.escalation.escalated_at
      : conversation.last_activity
    const seconds = timestamp ? Math.max(0, Math.floor((now - new Date(timestamp).getTime()) / 1000)) : 0
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return { value: minutes, unit: 'min', seconds }
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return { value: hours, unit: hours === 1 ? 'hora' : 'horas', seconds }
    const days = Math.floor(hours / 24)
    return { value: days, unit: days === 1 ? 'día' : 'días', seconds }
  }, [conversation, now])

  const renderTopRight = () => {
    if (variant === 'A2') {
      return (
        <span className="text-[11px] text-[#FFB84D] font-black flex items-center gap-1">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          ⚠️ {formatWaitTime(elapsed.seconds)}
        </span>
      )
    }
    return <span className="text-[11px] text-[#8B8FA8]">{formatWaitTime(elapsed.seconds)}</span>
  }

  const clientName = conversation.client?.full_name || 'Desconocido'
  const isAtLimit = advisorActiveConversations >= advisorMaxConversations
  const isAssignedToMe =
    !isAdmin &&
    currentAdvisorId !== '' &&
    conversation.escalation?.advisor?.id === currentAdvisorId

  return (
    <div className={`relative bg-[#252522] border border-[#3A3A37] rounded-r-lg p-4 flex flex-col justify-between transition ${containerStyles[variant]}`}>
      <div className="space-y-2.5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-wrap gap-1.5 min-w-0">
            <span className={`${statusChipStyles[variant]} text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider`}>
              {statusChipText[variant]}
            </span>
            {conversation.client?.client_type && conversation.client.client_type !== 'desconocido' && (
              <span className="bg-[#2E2E2B] text-[#F0F0F5] text-[9px] px-1.5 py-0.5 rounded font-semibold">{CLIENT_TYPE_LABELS[conversation.client.client_type]}</span>
            )}
            <span className="bg-[#2E2E2B] text-[#01A4E3] text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase">{conversation.channel || 'Desconocido'}</span>
            {isAssignedToMe && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#01A4E3]/15 text-[#01A4E3] border border-[#01A4E3]/20 font-semibold">
                Asignada a ti
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isAdmin && conversation.unread_count > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#FF5B5B]/20 border border-[#FF5B5B]/40 text-[#FF5B5B] rounded-full text-[10px] font-bold leading-none">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </span>
            )}
            {renderTopRight()}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white truncate" title={clientName}>{clientName}</h3>
          {(variant === 'A' || variant === 'A2') && (
            <p className="text-xs text-[#8B8FA8] mt-1">Motivo: <span className="font-mono text-[#F0F0F5] font-bold">{ESCALATION_REASON_LABELS[conversation.escalation?.reason ?? ''] ?? conversation.escalation?.reason ?? 'Sin motivo'}</span></p>
          )}
          {variant === 'B' && conversation.escalation?.reason && (
             <p className="text-xs text-[#8B8FA8] mt-1">Motivo: <span className="font-mono text-[#F0F0F5]">{ESCALATION_REASON_LABELS[conversation.escalation.reason] ?? conversation.escalation.reason}</span></p>
          )}
          {variant !== 'D' && (
            <p className="text-xs text-[#8B8FA8] truncate mt-1">
              {getLastMessagePreview(conversation.last_message)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#3A3A37]/60 flex items-center justify-between">
        {(variant === 'A' || variant === 'A2') && (
          <>
            <span className="text-[#FF5B5B] text-[11px] font-bold flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Sin asignar
            </span>
            {isAdmin ? (
              <button onClick={() => onView(conversation.id)} className="bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] px-2.5 py-1 rounded text-[11px] font-semibold transition">Ver</button>
            ) : variant === 'A' ? (
              <button onClick={() => onTake(conversation)} className="bg-[#01A4E3] hover:bg-[#0190C8] text-white px-3 py-1 rounded text-[11px] font-bold transition">Atender ya</button>
            ) : (
              <div className="relative group">
                <button
                  disabled={isAtLimit}
                  onClick={() => !isAtLimit && onTake(conversation)}
                  className={`${isAtLimit ? 'bg-[#2E2E2B] text-[#8B8FA8] cursor-not-allowed border border-[#3A3A37]' : 'bg-[#01A4E3] hover:bg-[#0190C8] text-white'} px-3 py-1 rounded text-[11px] font-bold transition`}
                >
                  Atender ya
                </button>
                {isAtLimit && (
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-[#1D1D1B] border border-[#3A3A37] text-[#F0F0F5] text-[11px] px-2.5 py-1.5 rounded whitespace-nowrap z-50">
                    Límite alcanzado — tienes {advisorActiveConversations} conversaciones activas
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {variant === 'B' && (
          <>
            <div className="flex items-center space-x-1.5 overflow-hidden max-w-[70%]">
              <div className="w-[18px] h-[18px] rounded-full bg-[#2E2E2B] text-[9px] font-bold flex items-center justify-center text-white">{(conversation.escalation?.advisor?.full_name?.[0] || 'A').toUpperCase()}</div>
              <span className="text-[#8B8FA8] text-[11px] truncate">Asignado: <strong className="text-white font-semibold">{conversation.escalation?.advisor?.full_name?.split(' ')[0] || 'Asesor'}</strong></span>
            </div>
            <button onClick={() => onView(conversation.id)} className="bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] px-2.5 py-1 rounded text-[11px] font-semibold transition">Ver</button>
          </>
        )}

        {variant === 'C' && (
          <>
            <span className="text-[#8B8FA8] flex items-center gap-1.5 text-[11px] truncate max-w-[70%]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] animate-pulse"></span>
              El bot está resolviendo
            </span>
            <button onClick={() => onView(conversation.id)} className="bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] px-2.5 py-1 rounded text-[11px] font-semibold transition">Ver</button>
          </>
        )}

        {variant === 'D' && (
          <>
            <span className="text-[#8B8FA8] flex items-center gap-1.5 text-[11px] truncate max-w-[70%]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              Resuelta
            </span>
            <button onClick={() => onView(conversation.id)} className="bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#8B8FA8] hover:text-[#F0F0F5] px-2.5 py-1 rounded text-[11px] font-semibold transition">Ver</button>
          </>
        )}
      </div>

    </div>
  )
})
