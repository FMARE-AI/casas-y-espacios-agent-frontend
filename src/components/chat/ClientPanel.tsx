import type { Conversation } from '../../types'

export type ChatVariant = 'assigned' | 'unassigned' | 'bot' | 'monitoring'

interface ClientPanelProps {
  conversation: Conversation
  variant: ChatVariant
  onTake: () => void
  onReturnBot: () => void
  isTaking: boolean
  isReturning: boolean
  onClose?: () => void
  onCloseConversation?: () => void
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
  onClose,
  onCloseConversation,
}: ClientPanelProps) {
  const { client, escalation } = conversation

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

        {/* AI escalation summary */}
        {escalation && (
          <div className="bg-[#FF5B5B]/5 border-2 border-[#FF5B5B] rounded-lg p-3.5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-[#FF5B5B] font-black uppercase text-[10px] tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF5B5B] animate-ping" />
                <span>⚠️ ANÁLISIS DE ESCALADO IA</span>
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8B8FA8] uppercase font-bold">Diagnóstico:</span>
                <span className="bg-[#FF5B5B]/15 text-[#FF5B5B] px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                  {escalation.reason}
                </span>
              </div>
              <div className="bg-[#1D1D1B] p-2.5 rounded border border-[#3A3A37]">
                <p className="text-white font-semibold leading-relaxed text-[11.5px]">
                  {escalation.summary ?? 'El asesor revisará el historial de la conversación.'}
                </p>
              </div>
              <div className="flex justify-between text-[9px] text-[#8B8FA8] pt-1">
                <span>
                  Escalado:{' '}
                  <strong className="text-white">
                    {new Date(escalation.escalated_at).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </span>
                <span>ID: {escalation.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Client data card */}
        <div className="bg-[#2E2E2B]/30 border border-[#3A3A37] rounded-lg p-3 space-y-3">
          <div className="flex items-center space-x-3 pb-2 border-b border-[#3A3A37]">
            <div className="w-10 h-10 rounded bg-[#01A4E3]/25 text-[#01A4E3] font-bold text-base flex items-center justify-center shrink-0">
              {getInitials(client.full_name)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{client.full_name ?? '—'}</h4>
              <span className="bg-[#01A4E3]/15 text-[#01A4E3] text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-extrabold">
                {client.client_type}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8B8FA8]">Celular:</span>
              <span className="text-white font-mono text-[11px]">{client.phone_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8B8FA8]">Cédula/NIT:</span>
              <span className="text-white font-mono text-[11px]">
                {client.document_id ?? 'No registrada'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8B8FA8]">Contrato No:</span>
              <span className="text-[#00D4AA] font-mono font-bold text-[11px]">
                No disponible
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8B8FA8]">Dirección:</span>
              <span className="text-white truncate max-w-[150px] text-[11px]">
                No disponible
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2 mt-4 lg:mt-0">
        {variant === 'unassigned' && (
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
          </>
        )}
      </div>
    </aside>
  )
}
