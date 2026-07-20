import type { Conversation } from '../../types'
import { useAuthStore } from '../../store/authStore'

export type ChatVariant = 'assigned' | 'unassigned' | 'bot' | 'monitoring'

interface ClientPanelProps {
  conversation: Conversation
  variant: ChatVariant
  onTake: () => void
  onReturnBot: () => void
  isTaking: boolean
  isReturning: boolean
  isAdmin?: boolean
  onClose?: () => void
  onCloseConversation?: () => void
  onTransfer?: () => void
}

const CHANNEL_LABELS: Record<string, string> = {
  administrativa: 'Administrativa',
  comercial:      'Comercial',
}

const CHANNEL_STYLES: Record<string, string> = {
  administrativa: 'bg-[#00D4AA]/15 text-[#00D4AA]',
  comercial:      'bg-[#01A4E3]/15 text-[#01A4E3]',
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export default function ClientPanel({
  conversation,
  variant,
  onTake,
  onReturnBot,
  isTaking,
  isReturning,
  isAdmin = false,
  onClose,
  onCloseConversation,
  onTransfer,
}: ClientPanelProps) {
  const { client, escalation, channel } = conversation
  const currentAdvisor = useAuthStore((s) => s.advisor)

  // An `escalation` object is only ever included in the conversation payload
  // when it is unresolved (resolved_at IS NULL) — see docs/panel_api_reference.md.
  // Do not gate on `status === 'activa'`: the docs disagree on whether an
  // assigned conversation can still carry status 'escalada' (the "en_atención"
  // state). Whether it's actually assigned is `escalation.advisor` being set —
  // same source of truth ConversationCard.tsx already uses for the inbox.
  const showTransfer =
    conversation.bot_activo === false &&
    !!escalation?.advisor &&
    (escalation.advisor.id === currentAdvisor?.id || isAdmin)

  return (
    <aside
      id="chat-right-aside"
      className="flex fixed lg:relative top-0 bottom-0 right-0 w-80 lg:w-[320px] bg-[#252522] border-l border-[#3A3A37] p-4 space-y-4 overflow-y-auto shrink-0 flex-col justify-between h-full lg:h-auto z-40"
    >
      <div className="space-y-4">
        {/* Mobile close */}
        <div className="lg:hidden flex justify-between items-center pb-2 border-b border-[#3A3A37]">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Ficha de Información
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8B8FA8] hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Client data card */}
        <div className="bg-[#2E2E2B]/40 border border-[#3A3A37] rounded-xl overflow-hidden shadow-sm">
          <div className="flex flex-col items-center text-center px-4 pt-6 pb-5 bg-gradient-to-b from-[#01A4E3]/10 to-transparent">
            <div className="w-16 h-16 rounded-full bg-[#01A4E3]/15 border-2 border-[#01A4E3]/40 text-[#01A4E3] font-bold text-xl flex items-center justify-center shrink-0">
              {getInitials(client.full_name)}
            </div>
            <h4 className="mt-3 text-sm font-bold text-white leading-tight max-w-full truncate">
              {client.full_name ?? 'Sin identificar'}
            </h4>
            <span
              className={`mt-2 text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold ${
                CHANNEL_STYLES[channel] ?? 'bg-[#3A3A37]/60 text-[#8B8FA8]'
              }`}
            >
              {CHANNEL_LABELS[channel] ?? channel}
            </span>
          </div>

          <div className="divide-y divide-[#3A3A37]/70 border-t border-[#3A3A37]">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#3A3A37]/60 flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 text-[#8B8FA8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-[#8B8FA8] uppercase tracking-wider font-bold">
                  Celular
                </p>
                <p className="text-white font-mono text-xs truncate">{client.phone_number}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#3A3A37]/60 flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 text-[#8B8FA8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-[#8B8FA8] uppercase tracking-wider font-bold">
                  Cédula / NIT
                </p>
                <p className="text-white font-mono text-xs truncate">
                  {client.document_id ?? 'No registrada'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI escalation summary */}
        {escalation && (
          <div className="bg-[#FF5B5B]/[0.06] border border-[#FF5B5B]/40 rounded-xl p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center gap-1.5 text-[#FF5B5B] font-black uppercase text-[10px] tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B5B] animate-pulse" />
              <span>Análisis de escalado IA</span>
            </div>

            <div className="bg-[#1D1D1B] p-2.5 rounded-lg border border-[#3A3A37]">
              <p className="text-white/90 font-medium leading-relaxed text-[11.5px]">
                {escalation.summary ?? 'El asesor revisará el historial de la conversación.'}
              </p>
            </div>

            {escalation.transfer_reason && (
              <div className="bg-[#01A4E3]/10 border border-[#01A4E3]/30 rounded-lg p-2.5">
                <p className="text-[9px] text-[#01A4E3] uppercase font-bold tracking-wider mb-1">
                  Motivo de transferencia
                </p>
                <p className="text-white/80 text-[11px] leading-relaxed">
                  {escalation.transfer_reason}
                </p>
              </div>
            )}

            <div className="flex justify-between text-[9px] text-[#8B8FA8]">
              <span>
                Escalado:{' '}
                <strong className="text-white font-semibold">
                  {new Date(escalation.escalated_at).toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
              </span>
              <span className="font-mono">ID: {escalation.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-2 mt-4 lg:mt-0">
        {variant === 'unassigned' && !isAdmin && (
          <button
            type="button"
            onClick={onTake}
            disabled={isTaking}
            className="w-full bg-[#01A4E3] hover:bg-[#0190C8] text-white py-3 px-3 h-12 rounded text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
          >
            {isTaking ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )}
            <span>Tomar Conversación</span>
          </button>
        )}

        {variant === 'assigned' && (
          <>
            <button
              type="button"
              onClick={onReturnBot}
              disabled={isReturning}
              className="w-full bg-[#FF5B5B]/10 hover:bg-[#FF5B5B]/20 border border-[#FF5B5B]/30 hover:border-[#FF5B5B] text-[#FF5B5B] py-3 px-3 h-12 rounded text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {isReturning ? (
                <div className="w-4 h-4 border-2 border-[#FF5B5B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              <span>Devolver al Bot</span>
            </button>
            <button
              type="button"
              onClick={onCloseConversation}
              className="w-full h-12 border border-[#FF5B5B]/20 text-[#FF5B5B]/60 text-xs font-semibold rounded hover:border-[#FF5B5B]/40 hover:text-[#FF5B5B] transition mt-2"
            >
              Cerrar conversación
            </button>
            {showTransfer && (
              <button
                type="button"
                onClick={onTransfer}
                className="w-full h-12 border border-[#01A4E3]/20 hover:border-[#01A4E3]/40 hover:bg-[#01A4E3]/10 text-[#01A4E3] hover:text-white text-xs font-semibold rounded transition mt-2 flex items-center justify-center gap-2"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Transferir</span>
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
