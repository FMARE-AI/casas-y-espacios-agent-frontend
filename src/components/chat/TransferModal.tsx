import { useState, useEffect } from 'react'
import { advisorsService } from '../../services/advisors'
import type { AdvisorOnline } from '../../types'

interface TransferModalProps {
  onConfirm: (targetAdvisorId: string, reason: string | null) => Promise<void>
  onCancel: () => void
  currentAssignedAdvisorId?: string
}

const AREA_LABELS: Record<string, string> = {
  administrativa: 'Administrativa',
  comercial: 'Comercial',
  ambas: 'Ambas',
}

export default function TransferModal({
  onConfirm,
  onCancel,
  currentAssignedAdvisorId,
}: TransferModalProps) {
  const [advisors, setAdvisors] = useState<AdvisorOnline[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Disable Escape key close (consistent with ReturnBotModal and CloseConversationModal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  // Load advisors on mount. GET /advisors/ is admin-only, so the modal uses
  // /advisors/online instead — reachable by any active advisor. Trade-off: for
  // non-admin (asesor) callers the backend omits active_conversations/max_conversations,
  // so the load counter and capacity-based exclusion only apply when those fields are present.
  useEffect(() => {
    advisorsService
      .getOnline()
      .then((data) => {
        setAdvisors(data || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load advisors:', {
          message: err instanceof Error ? err.message : 'unknown',
        })
        setError('Error al cargar la lista de asesores. Por favor, reintenta.')
        setLoading(false)
      })
  }, [])

  // Filter available advisors:
  // - is_panel_connected: the actual live-connection signal. availability_status
  //   is a manually-set/persisted status that can go stale (e.g. an advisor who
  //   closed the browser without setting themselves to break/offline still shows
  //   availability_status: 'available'). Same distinction ConnectedAdvisors in
  //   BandejaPage.tsx already relies on for the inbox's online indicator.
  // - availability_status === 'available' (not on break)
  // - Excluding the currently assigned advisor (the backend already excludes the
  //   caller themselves, but an admin transferring someone else's conversation
  //   is not the assigned advisor, so this still needs to run client-side)
  // - Excluding advisors at capacity — only when the load fields are present
  const availableAdvisors = advisors.filter((adv) => {
    const atCapacity =
      adv.active_conversations !== undefined &&
      adv.max_conversations !== undefined &&
      adv.active_conversations >= adv.max_conversations
    return (
      adv.is_panel_connected &&
      adv.availability_status === 'available' &&
      adv.id !== currentAssignedAdvisorId &&
      !atCapacity
    )
  })

  async function handleConfirm() {
    if (!selectedAdvisorId) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(selectedAdvisorId, reason.trim() || null)
    } catch (err: unknown) {
      console.error('Transfer failed:', {
        message: err instanceof Error ? err.message : 'unknown',
      })
      const errResponse = err as { response?: { data?: { detail?: { code?: string } } } }
      const errCode = errResponse.response?.data?.detail?.code
      let errMsg = 'No se pudo transferir la conversación. Intenta nuevamente.'
      
      if (errCode === 'NO_ACTIVE_ESCALATION') {
        errMsg = 'La conversación no tiene un flujo de escalación activo para transferir.'
      } else if (errCode === 'INVALID_STATUS') {
        errMsg = 'El asesor seleccionado ya no está disponible o está inactivo.'
      } else if (errCode === 'TARGET_AT_CAPACITY') {
        errMsg = 'El asesor seleccionado ha alcanzado su límite de conversaciones.'
      } else if (errCode === 'ALREADY_ASSIGNED') {
        errMsg = 'La conversación ya está asignada a este asesor.'
      } else if (errCode === 'FORBIDDEN') {
        errMsg = 'No tienes permisos para transferir esta conversación.'
      }
      
      setError(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border-default rounded-xl p-6 max-w-md w-full space-y-4 flex flex-col max-h-[90vh] shadow-md">
        {/* Header */}
        <div className="flex items-center gap-3 pb-2 border-b border-border-default">
          <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue text-lg">
            ⇄
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Transferir conversación
            </h3>
            <p className="text-xs text-text-secondary">
              Redirige este caso a un especialista disponible
            </p>
          </div>
        </div>

        {/* Error alert inside modal */}
        {error && (
          <div className="p-3 bg-error/10 border border-error/30 rounded text-xs text-error leading-relaxed">
            {error}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[150px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-text-secondary">Cargando asesores...</p>
            </div>
          ) : availableAdvisors.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-border-default rounded-xl">
              <p className="text-xs text-text-secondary leading-relaxed">
                No hay asesores disponibles en este momento. Intenta de nuevo en unos minutos.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                Selecciona el asesor destino
              </label>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {availableAdvisors.map((adv) => {
                  const isSelected = selectedAdvisorId === adv.id
                  return (
                    <button
                      key={adv.id}
                      type="button"
                      onClick={() => setSelectedAdvisorId(adv.id)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-brand-blue/15 border-brand-blue text-white'
                          : 'bg-bg-tertiary/50 border-border-default text-text-secondary hover:border-text-secondary/40 hover:text-white'
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{adv.full_name}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5 truncate">
                          {AREA_LABELS[adv.area] ?? adv.area}
                        </p>
                      </div>
                      <div className="shrink-0 ml-3 text-right">
                        {adv.active_conversations !== undefined && adv.max_conversations !== undefined ? (
                          <span className="font-mono px-2 py-0.5 rounded bg-bg-main text-[10px]">
                            {adv.active_conversations} / {adv.max_conversations}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-success/10 text-success text-[9px] font-bold uppercase tracking-wider">
                            Disponible
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Transfer reason field */}
          {!loading && availableAdvisors.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border-default/50">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                  Motivo de la transferencia (opcional)
                </label>
                <span className="text-[9px] text-text-secondary font-mono">
                  {reason.length} / 500
                </span>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                placeholder="El cliente ahora pregunta por mantenimiento del inmueble..."
                className="w-full bg-bg-main border border-border-default rounded p-2.5 text-xs text-white placeholder-text-secondary/50 focus:border-brand-blue focus:outline-none h-20 resize-none transition"
              />
            </div>
          )}
        </div>

        {/* Actions footer */}
        <div className="flex justify-end gap-2.5 text-xs pt-2 border-t border-border-default">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2.5 bg-transparent hover:bg-bg-tertiary border border-border-default text-text-secondary hover:text-white rounded font-semibold transition active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
          >
            Cancelar
          </button>
          {!loading && availableAdvisors.length > 0 && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedAdvisorId || submitting}
              className="px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-hover disabled:bg-brand-blue/40 text-white rounded font-bold transition active:scale-[0.98] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
            >
              {submitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {submitting ? 'Transfiriendo...' : 'Confirmar transferencia'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
