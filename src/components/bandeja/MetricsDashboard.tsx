import { memo } from 'react'
import type { DashboardMetrics } from '../../types'

interface MetricsDashboardProps {
  metrics: DashboardMetrics | null
}

export const MetricsDashboard = memo(function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  if (!metrics) {
    return (
      <div id="admin-metrics-panel" className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-bg-secondary p-2 border border-border-default rounded-lg animate-pulse min-w-[320px] sm:min-w-[450px]" style={{ background: 'rgba(37,37,34,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
        <div className="col-span-full py-2 text-center text-xs text-text-secondary font-bold">Cargando métricas...</div>
      </div>
    )
  }

  const capacity = `${metrics.capacidad_actual}/${metrics.capacidad_total}`
  const capacityColor = metrics.capacidad_actual >= metrics.capacidad_total
    ? 'text-error'
    : 'text-success'

  const avgTimeDisplay = metrics.tiempo_promedio_min === 0 ? '— m' : `${metrics.tiempo_promedio_min} m`
  const botOkDisplay = metrics.bot_ok_pct === 0 ? '—%' : `${metrics.bot_ok_pct}%`

  return (
    <div id="admin-metrics-panel" className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-bg-secondary p-2 border border-border-default rounded-lg" style={{ background: 'rgba(37,37,34,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
      <div className="text-center px-2 py-1 border-r border-border-default/60">
        <span className="text-[9px] text-text-secondary font-bold block uppercase">Activas</span>
        <span className="text-xs font-black text-success">{metrics.activas}</span>
      </div>
      <div className="text-center px-2 py-1 border-r border-border-default/60">
        <span className="text-[9px] text-text-secondary font-bold block uppercase">Escaladas</span>
        <span className="text-xs font-black text-error">{metrics.escaladas}</span>
      </div>
      <div className="text-center px-2 py-1 border-r border-border-default/60">
        <span className="text-[9px] text-text-secondary font-bold block uppercase">Atención</span>
        <span className="text-xs font-black text-warning">{metrics.en_atencion}</span>
      </div>
      <div className="text-center px-2 py-1 border-r border-border-default/60">
        <span className="text-[9px] text-text-secondary font-bold block uppercase">T. Promedio</span>
        <span className="text-xs font-black text-success">{avgTimeDisplay}</span>
      </div>
      <div className="text-center px-2 py-1 border-r border-border-default/60">
        <span className="text-[9px] text-text-secondary font-bold block uppercase">Bot OK</span>
        <span className="text-xs font-black text-white">{botOkDisplay}</span>
      </div>
      <div className="text-center px-2 py-1">
        <span className="text-[9px] text-text-secondary font-bold block uppercase">Capacidad</span>
        <span className={`text-xs font-black ${capacityColor}`}>{capacity}</span>
      </div>
    </div>
  )
})
