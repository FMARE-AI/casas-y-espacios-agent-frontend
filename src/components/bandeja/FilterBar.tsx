import type { Conversation } from '../../types'

interface StatusCounts {
  all: number
  escaladas: number
  activas: number
  cerradas: number
}

interface FilterBarProps {
  conversations: Conversation[]
  statusCounts: StatusCounts
  activeStatus: string | null
  activeChannel: string | null
  currentAdvisorId: string
  advisorRole: string | null
  onStatusChange: (status: string | null) => void
  onChannelChange: (channel: string | null) => void
  onRefresh: () => void
}

export function FilterBar({
  conversations,
  statusCounts,
  activeStatus,
  activeChannel,
  currentAdvisorId,
  advisorRole,
  onStatusChange,
  onChannelChange,
  onRefresh,
}: FilterBarProps) {
  const totals = statusCounts

  const myCount = conversations.filter(
    (conv) => conv.escalation?.advisor?.id === currentAdvisorId
  ).length

  const btnBase = 'px-3 py-1.5 rounded transition flex items-center gap-1.5 text-xs font-semibold border'
  const btnActive = 'bg-[#01A4E3] border-[#01A4E3] text-white'
  const btnInactive = 'border-[#3A3A37] text-[#8B8FA8] hover:text-white'

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#252522] p-2 border border-[#3A3A37] rounded-lg"
      style={{ background: 'rgba(37,37,34,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      <div className="flex flex-wrap gap-1" id="bandeja-filter-buttons-container">
        {/* Tab "Mis conversaciones" — asesor only */}
        {advisorRole === 'asesor' && (
          <button
            className={`${btnBase} ${activeStatus === 'mine' ? btnActive : btnInactive}`}
            onClick={() => onStatusChange('mine')}
          >
            Mis conversaciones
            {myCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeStatus === 'mine' ? 'bg-white/20 text-white' : 'bg-[#01A4E3] text-white'
                }`}
              >
                {myCount}
              </span>
            )}
          </button>
        )}

        <button
          className={`${btnBase} ${activeStatus === null ? btnActive : btnInactive}`}
          onClick={() => onStatusChange(null)}
        >
          Todas ({totals.all})
        </button>
        <button
          className={`${btnBase} ${activeStatus === 'escalada' ? btnActive : btnInactive}`}
          onClick={() => onStatusChange('escalada')}
        >
          Escaladas
          <span className="bg-[#FF5B5B] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
            {totals.escaladas}
          </span>
        </button>
        <button
          className={`${btnBase} ${activeStatus === 'activa' ? btnActive : btnInactive}`}
          onClick={() => onStatusChange('activa')}
        >
          Activas ({totals.activas})
        </button>
        <button
          className={`${btnBase} ${activeStatus === 'cerrada' ? btnActive : btnInactive}`}
          onClick={() => onStatusChange('cerrada')}
        >
          Cerradas ({totals.cerradas})
        </button>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <select
          value={activeChannel || ''}
          onChange={(e) => onChannelChange(e.target.value || null)}
          className="bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded px-2.5 py-1.5 w-full sm:w-44 focus:border-[#01A4E3] outline-none"
        >
          <option value="">Todos los Canales</option>
          <option value="Administrativa">Administrativa</option>
          <option value="Comercial">Comercial</option>
        </select>
        <button
          onClick={onRefresh}
          className="bg-[#2E2E2B] hover:bg-[#3A3A37] p-1.5 rounded border border-[#3A3A37] text-[#8B8FA8] hover:text-white shrink-0 active:scale-95 transition"
          title="Recargar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
