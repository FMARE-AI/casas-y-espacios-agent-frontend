import { memo } from 'react'
import type { DashboardMetrics } from '../../types'

interface MetricsDashboardProps {
  metrics: DashboardMetrics | null
}

export const MetricsDashboard = memo(function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  if (!metrics) {
    return (
      <div id="admin-metrics-panel" className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-[#252522] p-2 border border-[#3A3A37] rounded-lg animate-pulse min-w-[320px] sm:min-w-[450px]" style={{ background: 'rgba(37,37,34,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
        <div className="col-span-full py-2 text-center text-xs text-[#8B8FA8] font-bold">Cargando métricas...</div>
      </div>
    )
  }

  const capacity = `${metrics.capacidad_actual}/${metrics.capacidad_total}`

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
        <span className="text-xs font-black text-[#FFB84D]">{metrics.en_atencion}</span>
      </div>
      <div className="text-center px-2 py-1 border-r border-[#3A3A37]/60">
        <span className="text-[9px] text-[#8B8FA8] font-bold block uppercase">T. Promedio</span>
        <span className="text-xs font-black text-[#00D4AA]">{metrics.tiempo_promedio_min} m</span>
      </div>
      <div className="text-center px-2 py-1 border-r border-[#3A3A37]/60">
        <span className="text-[9px] text-[#8B8FA8] font-bold block uppercase">Bot OK</span>
        <span className="text-xs font-black text-white">{metrics.bot_ok_pct}%</span>
      </div>
      <div className="text-center px-2 py-1">
        <span className="text-[9px] text-[#8B8FA8] font-bold block uppercase">Capacidad</span>
        <span className="text-xs font-black text-[#FFB84D]">{capacity}</span>
      </div>
    </div>
  )
})
