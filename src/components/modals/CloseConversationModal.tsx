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
    active: 'bg-[#00D4AA]/10 border-[#00D4AA] text-[#00D4AA]',
  },
  {
    value: 'no',
    label: '✗ No',
    active: 'bg-[#FF5B5B]/10 border-[#FF5B5B] text-[#FF5B5B]',
  },
  {
    value: 'sin_confirmar',
    label: '— Sin confirmar',
    active: 'bg-[#8B8FA8]/10 border-[#8B8FA8] text-[#8B8FA8]',
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
      <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 max-w-sm w-full space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FF5B5B]/10 flex items-center justify-center text-[#FF5B5B] text-lg">
            ✕
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F0F0F5]">
              Cerrar conversación
            </h3>
            <p className="text-xs text-[#8B8FA8]">
              Clasifica cómo quedó esta atención
            </p>
          </div>
        </div>

        {/* ¿Cómo se resolvió? */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-[#8B8FA8] uppercase tracking-wider">
            ¿Cómo se resolvió?
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {RESOLUTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setResolutionType(option.value)}
                className={[
                  'w-full text-left px-3 py-2 rounded text-xs transition border',
                  resolutionType === option.value
                    ? 'bg-[#01A4E3]/10 border-[#01A4E3] text-[#01A4E3]'
                    : 'border-[#3A3A37] text-[#8B8FA8] hover:border-[#8B8FA8]',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notas adicionales */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-[#8B8FA8] uppercase tracking-wider">
            Notas adicionales{' '}
            <span className="ml-1 normal-case font-normal">(opcional)</span>
          </p>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Ej: Técnico visita el jueves 26"
            maxLength={500}
            rows={2}
            className="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-md p-2.5 text-white text-xs outline-none focus:border-[#01A4E3] transition resize-none placeholder-[#8B8FA8]/50"
          />
          <p className="text-[10px] text-[#8B8FA8] text-right">
            {resolutionNotes.length}/500
          </p>
        </div>

        {/* ¿El cliente quedó satisfecho? */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-[#8B8FA8] uppercase tracking-wider">
            ¿El cliente quedó satisfecho?
          </p>
          <div className="flex gap-2">
            {SATISFACTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setClientSatisfied(option.value)}
                className={[
                  'flex-1 px-2 py-2 rounded text-[10px] transition border',
                  clientSatisfied === option.value
                    ? option.active
                    : 'border-[#3A3A37] text-[#8B8FA8]',
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
            className="flex-1 py-2.5 text-xs border border-[#3A3A37] text-[#8B8FA8] rounded hover:border-[#F0F0F5] hover:text-[#F0F0F5] transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isClosing}
            className="flex-1 py-2.5 text-xs bg-[#FF5B5B]/10 border border-[#FF5B5B]/30 text-[#FF5B5B] rounded hover:bg-[#FF5B5B]/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isClosing && (
              <div className="w-3 h-3 border-2 border-[#FF5B5B] border-t-transparent rounded-full animate-spin" />
            )}
            Confirmar cierre
          </button>
        </div>
      </div>
    </div>
  )
}
