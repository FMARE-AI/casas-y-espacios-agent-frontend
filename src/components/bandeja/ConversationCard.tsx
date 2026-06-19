import { useState, useEffect } from 'react'
import type { Conversation } from '../../types'

interface ConversationCardProps {
  conversation: Conversation
  advisorMaxConversations: number
  advisorActiveConversations: number
  onTake: (conversation: Conversation) => void
  onView: (conversationId: string) => void
}

type CardVariant = 'A' | 'A2' | 'B' | 'C'

function getVariant(conversation: Conversation, now: number): CardVariant {
  if (conversation.status === 'activa') return 'C'

  if (conversation.status === 'escalada') {
    const hasAdvisor = !!conversation.escalation?.advisor
    if (hasAdvisor) return 'B'

    const waitSeconds = conversation.escalation?.escalated_at
      ? Math.floor((now - new Date(conversation.escalation.escalated_at).getTime()) / 1000)
      : 0
    const waitMinutes = waitSeconds / 60
    return waitMinutes > 15 ? 'A2' : 'A'
  }

  return 'C'
}

export function ConversationCard({
  conversation,
  advisorMaxConversations,
  advisorActiveConversations,
  onTake,
  onView,
}: ConversationCardProps) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const variant = getVariant(conversation, now)

  const containerStyles = {
    A: 'border-l-[3px] border-l-[#FF5B5B] hover:bg-[#2E2E2B]/40',
    A2: 'critical-pulse-card hover:bg-[#2E2E2B]/40',
    B: 'border-l-[3px] border-l-[#FFB84D] hover:bg-[#2E2E2B]/40',
    C: 'border-l-[3px] border-l-[#00D4AA] hover:bg-[#2E2E2B]/40',
  }

  const statusChipStyles = {
    A: 'bg-[#FF5B5B]/15 text-[#FF5B5B]',
    A2: 'bg-[#FF5B5B] text-white',
    B: 'bg-[#FFB84D]/15 text-[#FFB84D]',
    C: 'bg-[#00D4AA]/15 text-[#00D4AA]',
  }

  const statusChipText = {
    A: 'Escalada',
    A2: 'CRÍTICO',
    B: 'En Atención',
    C: conversation.bot_activo ? 'Activa (Bot)' : 'Activa',
  }

  const getMinutesAgo = () => {
    const timestamp = (conversation.status === 'escalada' && conversation.escalation?.escalated_at)
      ? conversation.escalation.escalated_at
      : conversation.last_activity
    const waitSeconds = timestamp
      ? Math.floor((now - new Date(timestamp).getTime()) / 1000)
      : 0
    return Math.max(0, Math.floor(waitSeconds / 60))
  }

  const renderTopRight = () => {
    const waitMinutes = getMinutesAgo()
    if (variant === 'A2') {
      return (
        <span className="text-[10px] text-[#FFB84D] font-black flex items-center gap-1">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          ⚠️ {waitMinutes} min
        </span>
      )
    }
    return <span className="text-[10px] text-[#8B8FA8]">hace {waitMinutes} min</span>
  }

  const clientName = conversation.client?.full_name || 'Desconocido'
  const isAtLimit = advisorActiveConversations >= advisorMaxConversations

  return (
    <div className={`bg-[#252522] border border-[#3A3A37] rounded-r-lg p-3 flex flex-col justify-between transition ${containerStyles[variant]}`}>
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap gap-1">
            <span className={`${statusChipStyles[variant]} text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider`}>
              {statusChipText[variant]}
            </span>
            <span className="bg-[#2E2E2B] text-[#F0F0F5] text-[8px] px-1.5 py-0.5 rounded font-semibold">{conversation.client?.client_type || 'Desconocido'}</span>
            <span className="bg-[#2E2E2B] text-[#01A4E3] text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">{conversation.channel || 'Desconocido'}</span>
          </div>
          {renderTopRight()}
        </div>
        <div>
          <h3 className="text-xs font-bold text-white truncate" title={clientName}>{clientName}</h3>
          {(variant === 'A' || variant === 'A2') && (
            <p className="text-[11px] text-[#8B8FA8] mt-0.5">Motivo: <span className="font-mono text-[#F0F0F5] font-bold">{conversation.escalation?.reason || 'Sin motivo'}</span></p>
          )}
          {variant === 'B' && conversation.escalation?.reason && (
             <p className="text-[11px] text-[#8B8FA8] mt-0.5">Motivo: <span className="font-mono text-[#F0F0F5]">{conversation.escalation?.reason}</span></p>
          )}
          {variant === 'C' && (
             <p className="text-[11px] text-[#8B8FA8] mt-0.5">Último del Bot: <span className="text-[#00D4AA] font-semibold">"..."</span></p>
          )}
          <p className="text-[11px] text-[#F0F0F5]/85 italic mt-1 truncate bg-[#2E2E2B]/40 p-2 rounded border border-[#3A3A37]/40">"{conversation.escalation?.summary || '...'}"</p>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-[#3A3A37]/60 flex items-center justify-between">
        {(variant === 'A' || variant === 'A2') && (
          <>
            <span className="text-[#FF5B5B] text-[10px] font-bold flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Sin asignar
            </span>
            {variant === 'A' ? (
              <button onClick={() => onTake(conversation)} className="bg-[#01A4E3] hover:bg-[#0190C8] text-white px-3 py-1 rounded text-[10px] font-bold transition">Atender ya</button>
            ) : (
              <div className="relative group">
                <button
                  disabled={isAtLimit}
                  onClick={() => !isAtLimit && onTake(conversation)}
                  className={`${isAtLimit ? 'bg-[#2E2E2B] text-[#8B8FA8] cursor-not-allowed border border-[#3A3A37]' : 'bg-[#01A4E3] hover:bg-[#0190C8] text-white'} px-3 py-1 rounded text-[10px] font-bold transition`}
                >
                  Atender ya
                </button>
                {isAtLimit && (
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-[#1D1D1B] border border-[#3A3A37] text-[#F0F0F5] text-[10px] px-2.5 py-1.5 rounded whitespace-nowrap z-50">
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
              <div className="w-4 h-4 rounded-full bg-[#2E2E2B] text-[8px] font-bold flex items-center justify-center text-white">{(conversation.escalation?.advisor?.full_name?.[0] || 'A').toUpperCase()}</div>
              <span className="text-[#8B8FA8] text-[10px] truncate">Asignado: <strong className="text-white font-semibold">{conversation.escalation?.advisor?.full_name?.split(' ')[0] || 'Asesor'}</strong></span>
            </div>
            <button onClick={() => onView(conversation.id)} className="bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] px-2.5 py-1 rounded text-[10px] font-semibold transition">Ver</button>
          </>
        )}
        
        {variant === 'C' && (
          <>
            <span className="text-[#8B8FA8] flex items-center gap-1 text-[10px] truncate max-w-[70%]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] animate-pulse"></span>
              El bot está resolviendo
            </span>
            <button onClick={() => onView(conversation.id)} className="bg-transparent hover:bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] px-2.5 py-1 rounded text-[10px] font-semibold transition">Ver</button>
          </>
        )}
      </div>
    </div>
  )
}
