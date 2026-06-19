import type { Conversation } from '../../types'

interface FilterBarProps {
  conversations: Conversation[]
  activeStatus: string | null
  activeChannel: string | null
  onStatusChange: (status: string | null) => void
  onChannelChange: (channel: string | null) => void
  onRefresh: () => void
}

export function FilterBar({
  conversations,
  activeStatus,
  activeChannel,
  onStatusChange,
  onChannelChange,
  onRefresh,
}: FilterBarProps) {
  const totals = {
    all: conversations.length,
    escaladas: conversations.filter(c => c.status === 'escalada').length,
    activas: conversations.filter(c => c.status === 'activa').length,
    cerradas: conversations.filter(c => c.status === 'cerrada').length,
  }

  const btnBase = "px-3 py-1.5 rounded transition flex items-center gap-1.5"
  const btnActive = "bg-[#01A4E3] text-white font-semibold"
  const btnInactive = "text-[#8B8FA8] hover:text-white font-medium"

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#252522] p-2 border border-[#3A3A37] rounded-lg" style={{ background: 'rgba(37,37,34,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
      <div className="flex flex-wrap gap-1 text-xs" id="bandeja-filter-buttons-container">
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
          Escaladas <span className="bg-[#FF5B5B] text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">{totals.escaladas}</span>
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5"/></svg>
        </button>
      </div>
    </div>
  )
}
