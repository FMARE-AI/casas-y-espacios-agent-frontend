import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { schedulesService, getScheduleErrorCode } from '../../services/schedules'
import type { AdvisorSchedule } from '../../types'

// ── Constants ─────────────────────────────────────────────

const DAYS = [
  { value: 1, label: 'L', full: 'Lunes' },
  { value: 2, label: 'M', full: 'Martes' },
  { value: 3, label: 'X', full: 'Miércoles' },
  { value: 4, label: 'J', full: 'Jueves' },
  { value: 5, label: 'V', full: 'Viernes' },
  { value: 6, label: 'S', full: 'Sábado' },
  { value: 7, label: 'D', full: 'Domingo' },
]

// ── Form schema ───────────────────────────────────────────

const scheduleSchema = z
  .object({
    label: z.string().min(1, 'Nombre requerido').max(50),
    startTime: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Formato inválido'),
    endTime: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Formato inválido'),
    daysOfWeek: z.array(z.number().min(1).max(7)).min(1, 'Selecciona al menos un día'),
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
        <div key={i} className="bg-[#2E2E2B]/60 border border-[#3A3A37] rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="h-4 bg-[#3A3A37] rounded w-28" />
                <div className="h-4 bg-[#3A3A37] rounded w-24" />
              </div>
              <div className="flex gap-1.5">
                {DAYS.map((d) => (
                  <div key={d.value} className="w-7 h-7 bg-[#3A3A37] rounded-lg" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-6 bg-[#3A3A37] rounded-full" />
              <div className="w-5 h-5 bg-[#3A3A37] rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Modal field ───────────────────────────────────────────

function ModalField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs text-[#8B8FA8] uppercase font-bold tracking-wider">
        {label}
      </label>
      {children}
      {error && <p className="text-[#FF5B5B] text-xs">{error}</p>}
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
    setError,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { label: '', startTime: '12:00', endTime: '13:00', daysOfWeek: [] },
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
    } catch (err) {
      const code = getScheduleErrorCode(err)
      if (code === 'INVALID_TIME_RANGE') {
        setError('endTime', { message: 'La hora de fin debe ser mayor que la de inicio' })
      } else if (code === 'INVALID_DAYS') {
        setError('daysOfWeek', { message: 'Días inválidos' })
      } else {
        toast.error('No se pudo guardar el intervalo')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      id="modal-add-schedule"
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1D1D1B] border border-[#3A3A37] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#3A3A37]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FFB84D]/15 flex items-center justify-center shrink-0">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-[#FFB84D]">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Nuevo intervalo</h3>
              <p className="text-[10px] text-[#8B8FA8]">Configura un periodo de inactividad</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8B8FA8] hover:text-white hover:bg-[#2E2E2B] transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Label */}
          <ModalField label="Nombre del intervalo" error={errors.label?.message}>
            <input
              type="text"
              placeholder="Ej: Almuerzo, Reunión de equipo…"
              {...register('label')}
              className="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-[#FFB84D] focus:ring-1 focus:ring-[#FFB84D]/20 transition placeholder-[#8B8FA8]/40"
            />
          </ModalField>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Inicio" error={errors.startTime?.message}>
              <input
                type="time"
                {...register('startTime')}
                className="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-[#FFB84D] focus:ring-1 focus:ring-[#FFB84D]/20 transition"
              />
            </ModalField>
            <ModalField label="Fin" error={errors.endTime?.message}>
              <input
                type="time"
                {...register('endTime')}
                className="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-[#FFB84D] focus:ring-1 focus:ring-[#FFB84D]/20 transition"
              />
            </ModalField>
          </div>

          {/* Days */}
          <ModalField label="Días activos" error={errors.daysOfWeek?.message}>
            <Controller
              control={control}
              name="daysOfWeek"
              render={({ field }) => (
                <div className="flex gap-2">
                  {DAYS.map((day) => {
                    const selected = field.value.includes(day.value)
                    return (
                      <label
                        key={day.value}
                        title={day.full}
                        className={[
                          'flex-1 h-10 flex items-center justify-center rounded-xl cursor-pointer',
                          'text-sm font-bold border transition-all duration-150 select-none',
                          selected
                            ? 'bg-[#FFB84D]/15 border-[#FFB84D] text-[#FFB84D]'
                            : 'border-[#3A3A37] text-[#8B8FA8] hover:border-[#8B8FA8] hover:text-white',
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
          </ModalField>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-[#3A3A37] text-[#8B8FA8] hover:text-white hover:border-[#8B8FA8] rounded-xl text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#FFB84D] hover:bg-[#F0A83A] text-[#1D1D1B] rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-[#1D1D1B] border-t-transparent rounded-full animate-spin" />
              )}
              Guardar intervalo
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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-[#1D1D1B] border border-[#3A3A37] rounded-2xl p-6 max-w-xs w-full shadow-2xl">
        <div className="w-10 h-10 rounded-xl bg-[#FF5B5B]/10 border border-[#FF5B5B]/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-[#FF5B5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <p className="text-base font-bold text-[#F0F0F5] text-center mb-1">¿Eliminar intervalo?</p>
        <p className="text-sm text-[#8B8FA8] text-center mb-5">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm border border-[#3A3A37] text-[#8B8FA8] rounded-xl hover:border-[#8B8FA8] hover:text-white transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 text-sm bg-[#FF5B5B]/10 border border-[#FF5B5B]/30 text-[#FF5B5B] rounded-xl hover:bg-[#FF5B5B]/20 transition disabled:opacity-50 flex items-center justify-center gap-1.5 font-semibold"
          >
            {isDeleting && (
              <div className="w-3.5 h-3.5 border-2 border-[#FF5B5B] border-t-transparent rounded-full animate-spin" />
            )}
            {isDeleting ? 'Eliminando…' : 'Eliminar'}
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
      toast.success(isActive ? 'Intervalo activado' : 'Intervalo desactivado')
    } catch {
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s))
      )
      toast.error('No se pudo actualizar el intervalo')
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(true)
    try {
      await schedulesService.remove(id)
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
        className="border border-[#3A3A37]/60 rounded-xl p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-[2px] hover:border-[#FFB84D]/40 hover:shadow-lg hover:shadow-[#FFB84D]/5"
        style={{ background: 'rgba(37,37,34,0.97)', contain: 'layout style' }}
      >
        {/* Header — mismo patrón que Disponibilidad y Seguridad */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FFB84D]/15 flex items-center justify-center shrink-0">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-[#FFB84D]">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-white">Intervalos de Inactividad</p>
              <p className="text-xs text-[#8B8FA8]">
                Te marca como <span className="text-[#FFB84D] font-semibold">En descanso</span> automáticamente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FFB84D]/10 hover:bg-[#FFB84D]/20 border border-[#FFB84D]/30 hover:border-[#FFB84D]/50 text-[#FFB84D] rounded-lg text-xs font-bold transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Agregar
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#3A3A37]/60 mb-4" />

        {/* List */}
        {isLoading ? (
          <ScheduleSkeleton />
        ) : schedules.length === 0 ? (
          <div id="schedules-empty" className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2E2E2B] border border-[#3A3A37] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3A3A37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#8B8FA8]">Sin intervalos configurados</p>
              <p className="text-xs text-[#8B8FA8]/60 mt-0.5">Agrega uno para gestionar tu disponibilidad automáticamente</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3" id="schedule-list">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                id="schedule-item"
                className={[
                  'flex items-center justify-between p-4 rounded-xl border gap-4 transition-all duration-200',
                  schedule.is_active
                    ? 'bg-[#2E2E2B]/80 border-[#3A3A37] hover:border-[#FFB84D]/30'
                    : 'bg-[#2E2E2B]/40 border-[#3A3A37]/50 opacity-60',
                ].join(' ')}
              >
                {/* Left — colored accent bar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: schedule.is_active ? '#FFB84D' : '#3A3A37' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-white truncate">{schedule.label}</span>
                      <span className="text-xs text-[#FFB84D] font-mono bg-[#FFB84D]/10 px-2.5 py-0.5 rounded-lg border border-[#FFB84D]/20 shrink-0">
                        {schedule.start_time} – {schedule.end_time}
                      </span>
                    </div>
                    {/* Day pills */}
                    <div id="schedule-days-row" className="flex items-center gap-1">
                      {DAYS.map((day) => (
                        <span
                          key={day.value}
                          title={day.full}
                          className={[
                            'w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold border transition-colors',
                            schedule.days_of_week.includes(day.value)
                              ? 'bg-[#01A4E3]/15 text-[#01A4E3] border-[#01A4E3]/30'
                              : 'bg-transparent text-[#3A3A37] border-[#3A3A37]/50',
                          ].join(' ')}
                        >
                          {day.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    id="schedule-toggle"
                    type="button"
                    role="switch"
                    aria-checked={schedule.is_active}
                    onClick={() => handleToggle(schedule.id, !schedule.is_active)}
                    className={[
                      'relative w-10 h-[22px] rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#2E2E2B]',
                      schedule.is_active ? 'bg-[#01A4E3] focus:ring-[#01A4E3]/40' : 'bg-[#3A3A37] focus:ring-[#8B8FA8]/40',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
                        schedule.is_active ? 'left-[3px] translate-x-[18px]' : 'left-[3px] translate-x-0',
                      ].join(' ')}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingId(schedule.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8B8FA8] hover:text-[#FF5B5B] hover:bg-[#FF5B5B]/10 transition-all duration-150"
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
      </div>

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
