import { memo } from 'react'

interface StatusCounts {
  all: number
  escaladas: number
  activas: number
  cerradas: number
  mine: number
}

interface FilterBarProps {
  statusCounts: StatusCounts
  activeStatus: string | null
  activeChannel: string | null
  advisorRole: string | null
  onStatusChange: (status: string | null) => void
  onChannelChange: (channel: string | null) => void
  onRefresh: () => void
}

export const FilterBar = memo(function FilterBar({
  statusCounts,
  activeStatus,
  activeChannel,
  advisorRole,
  onStatusChange,
  onChannelChange,
  onRefresh,
}: FilterBarProps) {
  const totals = statusCounts
  const myCount = statusCounts.mine

  const btnBase = 'px-3 py-1.5 rounded transition flex items-center gap-1.5 text-xs font-semibold border'
  const btnActive = 'bg-brand-blue border-brand-blue text-white'
  const btnInactive = 'border-border-default text-text-secondary hover:text-white'

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-secondary p-2 border border-border-default rounded-lg"
      style={{ background: 'rgba(37,37,34,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      <div className="flex flex-wrap gap-1" id="bandeja-filter-buttons-container">
        {/* Tab "Mis conversaciones" — asesor only */}
        {advisorRole === 'asesor' && (
          <button
            className={`${btnBase} ${activeStatus === 'mine' ? btnActive : btnInactive} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90 transition`}
            onClick={() => onStatusChange('mine')}
          >
            Mis conversaciones
            {myCount > 0 && (
              <span
                key={myCount}
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-scale-in ${
                  activeStatus === 'mine' ? 'bg-white/20 text-white' : 'bg-brand-blue text-white'
                }`}
              >
                {myCount}
              </span>
            )}
          </button>
        )}

        <button
          className={`${btnBase} ${activeStatus === null ? btnActive : btnInactive} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90 transition`}
          onClick={() => onStatusChange(null)}
        >
          Todas ({totals.all})
        </button>
        <button
          className={`${btnBase} ${activeStatus === 'escalada' ? btnActive : btnInactive} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90 transition`}
          onClick={() => onStatusChange('escalada')}
        >
          Escaladas
          <span key={totals.escaladas} className="bg-error text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-scale-in">
            {totals.escaladas}
          </span>
        </button>
        <button
          className={`${btnBase} ${activeStatus === 'activa' ? btnActive : btnInactive} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90 transition`}
          onClick={() => onStatusChange('activa')}
        >
          Activas ({totals.activas})
        </button>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <select
          value={activeChannel || ''}
          onChange={(e) => onChannelChange(e.target.value || null)}
          className="bg-bg-tertiary border border-border-default text-text-primary text-xs rounded px-2.5 py-1.5 w-full sm:w-44 focus:border-brand-blue outline-none"
        >
          <option value="">Todos los Canales</option>
          <option value="administrativa">Administrativa</option>
          <option value="comercial">Comercial</option>
        </select>
        <button
          onClick={onRefresh}
          className="bg-bg-tertiary hover:bg-border-default p-1.5 rounded border border-border-default text-text-secondary hover:text-white shrink-0 active:scale-[0.98] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
          title="Recargar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
          </svg>
        </button>
      </div>
    </div>
  )
})
