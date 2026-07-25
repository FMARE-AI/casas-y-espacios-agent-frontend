import { useEffect, useState } from 'react'

export interface CloseData {
  resolution_type: string
  resolution_notes: string | null
  client_satisfied: string
}

const RESOLUTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'consulta_cartera_resuelta', label: 'Consulta de cartera resuelta' },
  { value: 'pago_acordado', label: 'Pago acordado / registrado' },
  {
    value: 'orden_mantenimiento_creada',
    label: 'Orden de mantenimiento creada',
  },
  { value: 'queja_pqrs_registrada', label: 'Queja / PQRS registrada' },
  {
    value: 'informacion_contrato_entregada',
    label: 'Información de contrato entregada',
  },
  { value: 'derivado_otro_canal', label: 'Derivado a otro canal' },
  { value: 'sin_respuesta_cliente', label: 'Cliente no respondió' },
  { value: 'otro', label: 'Otro' },
]

const SATISFACTION_OPTIONS: { value: string; label: string; active: string }[] = [
  {
    value: 'si',
    label: '✓ Sí',
    active: 'bg-success/10 border-success text-success',
  },
  {
    value: 'no',
    label: '✗ No',
    active: 'bg-error/10 border-error text-error',
  },
  {
    value: 'sin_confirmar',
    label: '— Sin confirmar',
    active: 'bg-text-secondary/10 border-text-secondary text-text-secondary',
  },
]

interface CloseConversationModalProps {
  onConfirm: (data: CloseData) => void
  onCancel: () => void
  isClosing: boolean
}

export default function CloseConversationModal({
  onConfirm,
  onCancel,
  isClosing,
}: CloseConversationModalProps) {
  const [resolutionType, setResolutionType] = useState('otro')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [clientSatisfied, setClientSatisfied] = useState('sin_confirmar')

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

  function handleConfirm() {
    onConfirm({
      resolution_type: resolutionType,
      resolution_notes: resolutionNotes.trim() || null,
      client_satisfied: clientSatisfied,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border-default rounded-panel p-6 max-w-sm w-full space-y-4 shadow-md">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error text-lg">
            ✕
          </div>
          <div>
            <h3 className="text-h3 text-text-primary">
              Cerrar conversación
            </h3>
            <p className="text-xs text-text-secondary">
              Clasifica cómo quedó esta atención
            </p>
          </div>
        </div>

        {/* ¿Cómo se resolvió? */}
        <div className="space-y-1.5">
          <p className="text-label text-text-secondary uppercase">
            ¿Cómo se resolvió?
          </p>
          <div className="app-scroll space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {RESOLUTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setResolutionType(option.value)}
                className={[
                  'w-full text-left px-3 py-2 rounded-control text-xs transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/90',
                  resolutionType === option.value
                    ? 'bg-brand-blue/10 border-brand-blue text-brand-blue'
                    : 'border-border-default text-text-secondary hover:border-text-secondary',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notas adicionales */}
        <div className="space-y-1.5">
          <p className="text-label text-text-secondary uppercase">
            Notas adicionales{' '}
            <span className="ml-1 normal-case font-normal">(opcional)</span>
          </p>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Ej: Técnico visita el jueves 26"
            maxLength={500}
            rows={2}
            className="w-full bg-bg-tertiary border border-border-default rounded-md p-2.5 text-white text-xs outline-none focus:border-brand-blue transition resize-none placeholder-text-secondary/50"
          />
          <p className="text-[10px] text-text-secondary text-right">
            {resolutionNotes.length}/500
          </p>
        </div>

        {/* ¿El cliente quedó satisfecho? */}
        <div className="space-y-1.5">
          <p className="text-label text-text-secondary uppercase">
            ¿El cliente quedó satisfecho?
          </p>
          <div className="flex gap-2">
            {SATISFACTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setClientSatisfied(option.value)}
                className={[
                  'flex-1 px-2 py-2 rounded-control text-[10px] transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90',
                  clientSatisfied === option.value
                    ? option.active
                    : 'border-border-default text-text-secondary',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs border border-border-default text-text-secondary rounded-control hover:border-text-primary hover:text-text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isClosing}
            className="flex-1 py-2.5 text-xs bg-error/10 border border-error/30 text-error rounded-control hover:bg-error/20 transition disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
          >
            {isClosing && (
              <div className="w-3 h-3 border-2 border-error border-t-transparent rounded-full animate-spin" />
            )}
            Confirmar cierre
          </button>
        </div>
      </div>
    </div>
  )
}
