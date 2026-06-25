import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
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

// ── Helpers ───────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0] || '')
    .join('')
    .toUpperCase()
}

function formatBogota(utcString: string): string {
  try {
    const utcDate = parseISO(utcString)
    const bogotaDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'America/Bogota' }))
    const nowBogota = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }))

    const d1 = new Date(bogotaDate.getFullYear(), bogotaDate.getMonth(), bogotaDate.getDate())
    const d2 = new Date(nowBogota.getFullYear(), nowBogota.getMonth(), nowBogota.getDate())

    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
    const timeStr = format(bogotaDate, 'hh:mm a')

    if (diffDays === 0) {
      return `Hoy, ${timeStr}`
    }
    if (diffDays === 1) {
      return `Ayer, ${timeStr}`
    }

    return format(bogotaDate, 'dd/MM/yyyy hh:mm a')
  } catch {
    return ''
  }
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
    if (role !== 'admin') return
    if (silent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    try {
      const result = await alertsService.list({ reviewed: false, limit: 50 })
      setAlerts(result?.alerts || [])
    } catch {
      if (!silent) setAlerts([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [role])

  useEffect(() => {
    if (role === 'admin') {
      const timer = setTimeout(() => {
        loadAlerts().catch(() => {})
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [loadAlerts, role])

  const handleBehaviorAlert = useCallback(() => {
    if (role === 'admin') {
      loadAlerts(true).catch(() => {})
    }
  }, [loadAlerts, role])

  const wsHandlers = useMemo(() => ({
    onBehaviorAlert: handleBehaviorAlert
  }), [handleBehaviorAlert])

  useWebSocket(wsHandlers)

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (advisorFilter !== 'todos' && alert.advisor?.id !== advisorFilter) return false
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
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: { code?: string } } } }
      const errorCode = axiosError.response?.data?.detail?.code
      if (errorCode === 'ALREADY_REVIEWED' || errorCode === 'ALERT_NOT_FOUND') {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId))
        useWSStore.getState().decrementAlerts()
      } else {
        // Silent fail — leave alert in list, re-enable button
        setReviewingIds((prev) => {
          const next = new Set(prev)
          next.delete(alertId)
          return next
        })
      }
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

      <style>{`
        @keyframes alertFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .alert-card-animate {
          animation: alertFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Alert list */}
      {!isLoading && filteredAlerts.length > 0 && (
        <div id="behavior-alerts-list" className="space-y-3">
          {filteredAlerts.map((alert, index) => (
            <div
              key={alert.id}
              id={`behavior-alert-item-${alert.id}`}
              className="bg-[#252522]/65 border border-[#3A3A37]/50 rounded-lg p-4 flex items-start gap-3 hover:border-[#FF5B5B]/35 hover:shadow-lg hover:shadow-[#FF5B5B]/5 transition-all duration-300 transform hover:-translate-y-0.5 alert-card-animate"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {/* Initials avatar */}
              <div className="w-8 h-8 rounded-md bg-[#FF5B5B]/10 flex items-center justify-center text-[#FF5B5B] text-xs font-bold shrink-0">
                {getInitials(alert.advisor?.full_name)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-semibold text-[#F0F0F5]">
                    {alert.advisor?.full_name ?? 'Asesor desconocido'}
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
                  &ldquo;{alert.message_content && alert.message_content.length > 100
                    ? `${alert.message_content.slice(0, 100)}…`
                    : alert.message_content || ''}&rdquo;
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
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#01A4E3] border border-[#01A4E3]/40 hover:border-[#01A4E3] hover:bg-[#01A4E3]/10 px-2.5 py-1 rounded transition active:scale-95"
                    >
                      Ver conversación
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      disabled={reviewingIds.has(alert.id)}
                      onClick={() => handleMarkReviewed(alert.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 border border-[#3A3A37] text-[#8B8FA8] hover:border-[#00D4AA] hover:text-[#00D4AA] rounded transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      {reviewingIds.has(alert.id) ? (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
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
