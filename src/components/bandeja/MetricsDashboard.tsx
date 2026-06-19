import type { Conversation } from '../../types'

interface MetricsDashboardProps {
  conversations: Conversation[]
}

export function MetricsDashboard({ conversations }: MetricsDashboardProps) {
  const metrics = {
    activas: conversations.filter(c => c.status === 'activa').length,
    escaladas: conversations.filter(c => c.status === 'escalada').length,
    atencion: conversations.filter(
      c => c.status === 'escalada' && c.escalation?.advisor
    ).length,
  }

  const capacity = metrics.atencion > 0 ? `${metrics.atencion}/9` : '7/9'

  return (
    <div id="admin-metrics-panel" className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-[#252522] p-2 border border-[#3A3A37] rounded-lg" style={{ background: 'rgba(37,37,34,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
      <div className="text-center px-2 py-1 border-r border-[#3A3A37]/60">
        <span className="text-[9px] text-[#8B8FA8] font-bold block uppercase">Activas</span>
        <span className="text-xs font-black text-white">{metrics.activas}</span>
      </div>
      <div className="text-center px-2 py-1 border-r border-[#3A3A37]/60">
        <span className="text-[9px] text-[#8B8FA8] font-bold block uppercase">Escaladas</span>
        <span className="text-xs font-black text-[#FF5B5B]">{metrics.escaladas}</span>
      </div>
      <div className="text-center px-2 py-1 border-r border-[#3A3A37]/60">
        <span className="text-[9px] text-[#8B8FA8] font-bold block uppercase">Atención</span>
        <span className="text-xs font-black text-[#FFB84D]">{metrics.atencion}</span>
      </div>
      <div className="text-center px-2 py-1 border-r border-[#3A3A37]/60">
        <span className="text-[9px] text-[#8B8FA8] font-bold block uppercase">T. Promedio</span>
        <span className="text-xs font-black text-[#00D4AA]">8 m</span>
      </div>
      <div className="text-center px-2 py-1 border-r border-[#3A3A37]/60">
        <span className="text-[9px] text-[#8B8FA8] font-bold block uppercase">Bot OK</span>
        <span className="text-xs font-black text-white">87%</span>
      </div>
      <div className="text-center px-2 py-1">
        <span className="text-[9px] text-[#8B8FA8] font-bold block uppercase">Capacidad</span>
        <span className="text-xs font-black text-[#FFB84D]">{capacity}</span>
      </div>
    </div>
  )
}
