import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { alertsService } from '../../services/alerts'
import { useAuthStore } from '../../store/authStore'
import { useWSStore } from '../../store/wsStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import type { Advisor, BehaviorAlert, AlertType, AlertSeverity } from '../../types'
import { ROUTES } from '../../constants/routes'

// ── Constants ─────────────────────────────────────────────

const ALERT_TYPE_STYLES: Record<AlertType, string> = {
  lenguaje_inapropiado: 'bg-[#FF5B5B]/15 text-[#FF5B5B]',
  tono_agresivo: 'bg-[#FFB84D]/15 text-[#FFB84D]',
  comportamiento_inadecuado: 'bg-[#FFB84D]/10 text-[#FFB84D]/80',
}

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  lenguaje_inapropiado: 'Lenguaje inapropiado',
  tono_agresivo: 'Tono agresivo',
  comportamiento_inadecuado: 'Comportamiento inadecuado',
}

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  alta: 'bg-[#FF5B5B]/15 text-[#FF5B5B]',
  media: 'bg-[#FFB84D]/15 text-[#FFB84D]',
  baja: 'bg-[#8B8FA8]/15 text-[#8B8FA8]',
}

const MOCK_ALERTS: BehaviorAlert[] = [
  {
    id: 'mock-alert-1',
    advisor: {
      id: 'mock-advisor-1',
      email: 'carlos@mail.com',
      full_name: 'Carlos Rueda',
      role: 'asesor',
      area: 'administrativa',
      max_conversations: 3,
      active_conversations: 1,
      availability_status: 'available',
      is_active: true,
      avatar_url: null,
    },
    conversation_id: 'conv-demo',
    message_content: 'Eso es un problema suyo, no mío. Busque otro asesor.',
    alert_type: 'tono_agresivo',
    severity: 'alta',
    detected_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    reviewed: false,
    reviewed_by: null,
    reviewed_at: null,
  },
  {
    id: 'mock-alert-2',
    advisor: {
      id: 'mock-advisor-2',
      email: 'laura@mail.com',
      full_name: 'Laura Gómez',
      role: 'asesor',
      area: 'comercial',
      max_conversations: 3,
      active_conversations: 2,
      availability_status: 'available',
      is_active: true,
      avatar_url: null,
    },
    conversation_id: 'conv-demo-2',
    message_content: 'No sé por qué me escribe si no va a comprar nada de todas formas.',
    alert_type: 'lenguaje_inapropiado',
    severity: 'media',
    detected_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    reviewed: false,
    reviewed_by: null,
    reviewed_at: null,
  },
  {
    id: 'mock-alert-3',
    advisor: {
      id: 'mock-advisor-3',
      email: 'pedro@mail.com',
      full_name: 'Pedro Vargas',
      role: 'asesor',
      area: 'ambas',
      max_conversations: 3,
      active_conversations: 0,
      availability_status: 'break',
      is_active: true,
      avatar_url: null,
    },
    conversation_id: 'conv-demo-3',
    message_content: 'Haga lo que quiera, igual no importa.',
    alert_type: 'comportamiento_inadecuado',
    severity: 'baja',
    detected_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    reviewed: false,
    reviewed_by: null,
    reviewed_at: null,
  },
]

// ── Helpers ───────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function formatBogota(utcString: string): string {
  const date = new Date(utcString)
  const now = new Date()

  const bogota = (d: Date) =>
    new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)

  const timeStr = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)

  const dateStr = bogota(date)
  const todayStr = bogota(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = bogota(yesterday)

  if (dateStr === todayStr) return `Hoy, ${timeStr}`
  if (dateStr === yesterdayStr) return `Ayer, ${timeStr}`
  return `${dateStr} ${timeStr}`
}

// ── Props ─────────────────────────────────────────────────

interface BehaviorAlertsPanelProps {
  advisors: Advisor[]
}

// ── Component ─────────────────────────────────────────────

export default function BehaviorAlertsPanel({ advisors }: BehaviorAlertsPanelProps) {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.role)

  const [alerts, setAlerts] = useState<BehaviorAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [advisorFilter, setAdvisorFilter] = useState('todos')
  const [severityFilter, setSeverityFilter] = useState('todos')
  const [reviewingIds, setReviewingIds] = useState<Set<string>>(new Set())

  const loadAlerts = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    try {
      const result = await alertsService.list({ reviewed: false, limit: 50 })
      setAlerts(result.alerts)
    } catch {
      if (!silent) setAlerts(MOCK_ALERTS)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const handleBehaviorAlert = useCallback(() => {
    loadAlerts(true)
  }, [loadAlerts])

  useWebSocket({ onBehaviorAlert: handleBehaviorAlert })

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (advisorFilter !== 'todos' && alert.advisor.id !== advisorFilter) return false
      if (severityFilter !== 'todos' && alert.severity !== severityFilter) return false
      return true
    })
  }, [alerts, advisorFilter, severityFilter])

  async function handleMarkReviewed(alertId: string) {
    setReviewingIds((prev) => new Set(prev).add(alertId))
    try {
      await alertsService.markReviewed(alertId)
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
      useWSStore.getState().decrementAlerts()
    } catch {
      // Silent fail — leave alert in list, re-enable button
      setReviewingIds((prev) => {
        const next = new Set(prev)
        next.delete(alertId)
        return next
      })
    }
  }

  if (role !== 'admin') return null

  return (
    <section id="behavior-alerts-section" className="bg-[#252522]/60 border border-[#3A3A37] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[#F0F0F5]">Alertas de Comportamiento</h2>
          {alerts.length > 0 && (
            <span className="bg-[#FF5B5B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
          {isRefreshing && (
            <div className="w-3.5 h-3.5 border-2 border-[#01A4E3] border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={advisorFilter}
            onChange={(e) => setAdvisorFilter(e.target.value)}
            className="bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded px-2 py-1.5 outline-none focus:border-[#01A4E3] transition"
          >
            <option value="todos">Todos los asesores</option>
            {advisors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded px-2 py-1.5 outline-none focus:border-[#01A4E3] transition"
          >
            <option value="todos">Toda severidad</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#252522]/65 border border-[#3A3A37]/50 rounded-lg p-4 animate-pulse h-20"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredAlerts.length === 0 && (
        <div id="behavior-alerts-empty" className="text-center py-10">
          <div className="w-10 h-10 rounded-full bg-[#00D4AA]/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-[#8B8FA8]">No hay alertas pendientes de revisión</p>
        </div>
      )}

      {/* Alert list */}
      {!isLoading && filteredAlerts.length > 0 && (
        <div id="behavior-alerts-list" className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              id={`behavior-alert-item-${alert.id}`}
              className="bg-[#252522]/65 border border-[#3A3A37]/50 rounded-lg p-4 flex items-start gap-3 hover:border-[#FF5B5B]/30 transition"
            >
              {/* Initials avatar */}
              <div className="w-8 h-8 rounded-md bg-[#FF5B5B]/10 flex items-center justify-center text-[#FF5B5B] text-xs font-bold shrink-0">
                {getInitials(alert.advisor.full_name)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-semibold text-[#F0F0F5]">
                    {alert.advisor.full_name}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ALERT_TYPE_STYLES[alert.alert_type]}`}
                  >
                    {ALERT_TYPE_LABELS[alert.alert_type]}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${SEVERITY_STYLES[alert.severity]}`}
                  >
                    {alert.severity}
                  </span>
                </div>

                {/* Message excerpt */}
                <p className="text-xs text-[#8B8FA8] italic mb-2 line-clamp-2">
                  &ldquo;{alert.message_content.length > 100
                    ? `${alert.message_content.slice(0, 100)}…`
                    : alert.message_content}&rdquo;
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] text-[#8B8FA8]">
                    {formatBogota(alert.detected_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`${ROUTES.CHAT.replace(':id', alert.conversation_id)}`)}
                      className="text-[10px] text-[#01A4E3] hover:underline"
                    >
                      Ver conversación
                    </button>
                    <button
                      type="button"
                      disabled={reviewingIds.has(alert.id)}
                      onClick={() => handleMarkReviewed(alert.id)}
                      className="text-[10px] px-2 py-1 border border-[#3A3A37] text-[#8B8FA8] hover:border-[#00D4AA] hover:text-[#00D4AA] rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Marcar revisada
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
