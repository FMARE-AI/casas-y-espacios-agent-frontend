import { useEffect } from 'react'

interface ReturnBotModalProps {
  onConfirm: () => void
  onCancel: () => void
  isReturning: boolean
}

export default function ReturnBotModal({
  onConfirm,
  onCancel,
  isReturning,
}: ReturnBotModalProps) {
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

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div
        id="modal-confirm-release"
        className="bg-bg-secondary border border-border-default rounded-panel shadow-md p-6 max-w-md w-full space-y-4"
      >
        <div>
          <h3 className="text-h3 text-text-primary flex items-center gap-2">
            <svg
              className="w-5 h-5 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            ¿Devolver esta conversación al bot?
          </h3>
          <p className="text-xs text-text-secondary mt-2">
            El agente de IA retomará el canal de WhatsApp de manera autónoma.
          </p>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Asegúrate de haber resuelto la consulta comercial o administrativa o
          haber agendado el requerimiento en SIMI antes de liberar la atención.
        </p>
        <div className="pt-2 flex justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-transparent hover:bg-bg-tertiary border border-border-default text-text-secondary hover:text-white rounded-control font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isReturning}
            className="px-4 py-2.5 bg-transparent hover:bg-success/10 border border-success text-success rounded-control font-bold transition active:scale-[0.98] disabled:opacity-60 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
          >
            {isReturning && (
              <div className="w-3.5 h-3.5 border-2 border-success border-t-transparent rounded-full animate-spin" />
            )}
            Confirmar devolución
          </button>
        </div>
      </div>
    </div>
  )
}
