import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { schedulesService } from '../../services/schedules'
import type { AdvisorSchedule } from '../../types'

// ── Constants ─────────────────────────────────────────────

const DAYS = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 7, label: 'D' },
]

// ── Form schema ───────────────────────────────────────────

const scheduleSchema = z
  .object({
    label: z.string().min(1, 'Nombre requerido').max(50),
    startTime: z
      .string()
      .regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Formato inválido'),
    endTime: z
      .string()
      .regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Formato inválido'),
    daysOfWeek: z
      .array(z.number().min(1).max(7))
      .min(1, 'Selecciona al menos un día'),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'La hora de fin debe ser mayor que la de inicio',
    path: ['endTime'],
  })

type ScheduleFormData = z.infer<typeof scheduleSchema>

// ── Skeleton ──────────────────────────────────────────────

function ScheduleSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[0, 1].map((i) => (
        <div key={i} className="bg-[#2E2E2B] border border-[#3A3A37] rounded-lg p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 bg-[#3A3A37] rounded w-24" />
                <div className="h-3 bg-[#3A3A37] rounded w-20" />
              </div>
              <div className="flex gap-1">
                {DAYS.map((d) => (
                  <div key={d.value} className="w-5 h-5 bg-[#3A3A37] rounded" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-5 bg-[#3A3A37] rounded-full" />
              <div className="w-4 h-4 bg-[#3A3A37] rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Add schedule modal ────────────────────────────────────

function ScheduleFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (schedule: AdvisorSchedule) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      label: '',
      startTime: '12:00',
      endTime: '13:00',
      daysOfWeek: [],
    },
  })

  async function onSubmit(data: ScheduleFormData) {
    setIsSubmitting(true)
    try {
      const { schedule } = await schedulesService.create({
        label: data.label,
        start_time: data.startTime,
        end_time: data.endTime,
        days_of_week: data.daysOfWeek,
      })
      onCreated(schedule)
    } catch {
      toast.error('No se pudo guardar el intervalo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      id="modal-add-schedule"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white">Agregar Intervalo de Inactividad</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8B8FA8] hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-[10px] text-[#8B8FA8] uppercase font-bold mb-1">
              Nombre del intervalo
            </label>
            <input
              type="text"
              placeholder="Ej: Almuerzo"
              {...register('label')}
              className="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-md p-2.5 text-white text-xs outline-none focus:border-[#01A4E3] transition placeholder-[#8B8FA8]/40"
            />
            {errors.label && (
              <p className="text-[#FF5B5B] text-[10px] mt-1">{errors.label.message}</p>
            )}
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#8B8FA8] uppercase font-bold mb-1">
                Inicio
              </label>
              <input
                type="time"
                {...register('startTime')}
                className="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-md p-2.5 text-white text-xs outline-none focus:border-[#01A4E3] transition"
              />
              {errors.startTime && (
                <p className="text-[#FF5B5B] text-[10px] mt-1">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] text-[#8B8FA8] uppercase font-bold mb-1">
                Fin
              </label>
              <input
                type="time"
                {...register('endTime')}
                className="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-md p-2.5 text-white text-xs outline-none focus:border-[#01A4E3] transition"
              />
              {errors.endTime && (
                <p className="text-[#FF5B5B] text-[10px] mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Days checkboxes */}
          <div>
            <label className="block text-[10px] text-[#8B8FA8] uppercase font-bold mb-2">
              Días activos
            </label>
            <Controller
              control={control}
              name="daysOfWeek"
              render={({ field }) => (
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map((day) => {
                    const selected = field.value.includes(day.value)
                    return (
                      <label
                        key={day.value}
                        className={[
                          'w-8 h-8 flex items-center justify-center rounded cursor-pointer',
                          'text-xs font-bold border transition select-none',
                          selected
                            ? 'bg-[#01A4E3]/15 border-[#01A4E3] text-[#01A4E3]'
                            : 'border-[#3A3A37] text-[#8B8FA8] hover:border-[#8B8FA8]',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selected}
                          onChange={() => {
                            const next = selected
                              ? field.value.filter((v) => v !== day.value)
                              : [...field.value, day.value]
                            field.onChange(next)
                          }}
                        />
                        {day.label}
                      </label>
                    )
                  })}
                </div>
              )}
            />
            {errors.daysOfWeek && (
              <p className="text-[#FF5B5B] text-[10px] mt-1">{errors.daysOfWeek.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#3A3A37] text-[#8B8FA8] hover:text-white rounded-lg text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#01A4E3] hover:bg-[#0190C8] text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete confirm modal ──────────────────────────────────

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isDeleting,
}: {
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-5 max-w-xs w-full shadow-2xl">
        <p className="text-sm text-[#F0F0F5] mb-1">¿Eliminar este intervalo?</p>
        <p className="text-xs text-[#8B8FA8] mb-4">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-xs border border-[#3A3A37] text-[#8B8FA8] rounded hover:border-[#F0F0F5] hover:text-[#F0F0F5] transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2 text-xs bg-[#FF5B5B]/10 border border-[#FF5B5B]/30 text-[#FF5B5B] rounded hover:bg-[#FF5B5B]/20 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isDeleting && (
              <div className="w-3 h-3 border-2 border-[#FF5B5B] border-t-transparent rounded-full animate-spin" />
            )}
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState<AdvisorSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    schedulesService
      .list()
      .then((r) => setSchedules(r.schedules))
      .catch(() => setSchedules([]))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleToggle(id: string, isActive: boolean) {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s))
    )
    try {
      const { schedule } = await schedulesService.update(id, { is_active: isActive })
      setSchedules((prev) => prev.map((s) => (s.id === id ? schedule : s)))
    } catch {
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s))
      )
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(true)
    try {
      await schedulesService.delete(id)
      setSchedules((prev) => prev.filter((s) => s.id !== id))
      setDeletingId(null)
    } catch {
      toast.error('No se pudo eliminar el intervalo')
      setDeletingId(null)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        id="schedules-card"
        className="bg-[#252522]/65 backdrop-blur-[12px] border border-[#3A3A37]/50 rounded-xl p-5 transition-all duration-300 hover:-translate-y-[3px] hover:border-[#01A4E3] hover:shadow-lg hover:shadow-[#01A4E3]/10"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-bold text-white">
            Intervalos de Inactividad
          </h3>
        </div>
        <p className="text-xs text-[#8B8FA8] mb-4">
          El sistema te marcará automáticamente como{' '}
          <strong className="text-[#FFB84D]">En descanso</strong>{' '}
          durante estos intervalos
        </p>

        {/* List */}
        {isLoading ? (
          <ScheduleSkeleton />
        ) : schedules.length === 0 ? (
          <div id="schedules-empty" className="text-center py-8">
            <p className="text-xs text-[#8B8FA8]">
              No tienes intervalos configurados. Agrega uno para que el sistema
              gestione tu disponibilidad automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3" id="schedule-list">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                id="schedule-item"
                className="flex items-center justify-between p-3 bg-[#2E2E2B] rounded-lg border border-[#3A3A37] gap-3 flex-wrap"
              >
                {/* Left info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white">{schedule.label}</span>
                    <span className="text-[10px] text-[#8B8FA8] font-mono bg-[#1D1D1B] px-2 py-0.5 rounded border border-[#3A3A37]">
                      {schedule.start_time} – {schedule.end_time}
                    </span>
                  </div>

                  {/* Day pills */}
                  <div id="schedule-days-row" className="flex items-center gap-1">
                    {DAYS.map((day) => (
                      <span
                        key={day.value}
                        className={[
                          'text-[9px] px-1.5 py-0.5 rounded font-bold',
                          schedule.days_of_week.includes(day.value)
                            ? 'bg-[#01A4E3]/15 text-[#01A4E3]'
                            : 'bg-[#2E2E2B] text-[#3A3A37] border border-[#3A3A37]',
                        ].join(' ')}
                      >
                        {day.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Toggle */}
                  <button
                    id="schedule-toggle"
                    type="button"
                    role="switch"
                    aria-checked={schedule.is_active}
                    onClick={() => handleToggle(schedule.id, !schedule.is_active)}
                    className={[
                      'relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none',
                      schedule.is_active ? 'bg-[#01A4E3]' : 'bg-[#3A3A37]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                        schedule.is_active ? 'left-0.5 translate-x-4' : 'left-0.5 translate-x-0',
                      ].join(' ')}
                    />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeletingId(schedule.id)}
                    className="text-[#8B8FA8] hover:text-[#FF5B5B] transition p-1"
                    title="Eliminar intervalo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="mt-4 flex items-center gap-2 px-4 py-2 border border-[#01A4E3] text-[#01A4E3] hover:bg-[#01A4E3]/10 rounded-lg text-xs font-semibold transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar intervalo
        </button>
      </div>

      {/* Modals */}
      {showModal && (
        <ScheduleFormModal
          onClose={() => setShowModal(false)}
          onCreated={(schedule) => {
            setSchedules((prev) => [...prev, schedule])
            setShowModal(false)
          }}
        />
      )}

      {deletingId !== null && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
          isDeleting={isDeleting}
        />
      )}
    </>
  )
}
