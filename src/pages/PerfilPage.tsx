import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { advisorsService } from '../services/advisors'
import { useAuthStore } from '../store/authStore'
import type { Advisor, AdvisorRole, AvailabilityStatus } from '../types'
import ScheduleManager from '../components/perfil/ScheduleManager'

// ── Schema contraseña ─────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Requerida'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'La nueva contraseña debe ser diferente',
    path: ['newPassword'],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

// ── Helpers ───────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// ── Availability constants ─────────────────────────────────

const STATUS_OPTIONS = [
  {
    value: 'available' as const,
    label: 'Disponible',
    color: '#00D4AA',
    activeClass: 'bg-[#00D4AA]/15 border-[#00D4AA] text-[#00D4AA]',
  },
  {
    value: 'break' as const,
    label: 'En descanso',
    color: '#FFB84D',
    activeClass: 'bg-[#FFB84D]/15 border-[#FFB84D] text-[#FFB84D]',
  },
  {
    value: 'offline' as const,
    label: 'No disponible',
    color: '#FF5B5B',
    activeClass: 'bg-[#FF5B5B]/15 border-[#FF5B5B] text-[#FF5B5B]',
  },
]

const TIMER_OPTIONS: { value: number | null; label: string }[] = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' },
  { value: null, label: 'Indefinido' },
]

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Disponible',
  break: 'En descanso',
  offline: 'No disponible',
}

const STATUS_COLORS: Record<AvailabilityStatus, string> = {
  available: '#00D4AA',
  break: '#FFB84D',
  offline: '#FF5B5B',
}

function formatStatusUntil(statusUntil: string): string {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(statusUntil))
  } catch {
    return '--:--'
  }
}

// ── Role badge constants ───────────────────────────────────

const ROLE_BADGE_STYLES: Record<AdvisorRole, string> = {
  asesor: 'bg-[#01A4E3]/10 text-[#01A4E3]',
  admin: 'bg-[#FF5B5B]/15 text-[#FF5B5B]',
}

const ROLE_BADGE_TEXT: Record<AdvisorRole, string> = {
  asesor: 'Asesor Senior',
  admin: 'Administrador Global',
}

// ── Skeleton ───────���──────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 animate-pulse space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[#2E2E2B] shrink-0" />
        <div className="space-y-2 flex-1 w-full">
          <div className="h-5 bg-[#2E2E2B] rounded w-40" />
          <div className="h-3 bg-[#2E2E2B] rounded w-56" />
          <div className="h-4 bg-[#2E2E2B] rounded w-24" />
        </div>
      </div>
    </div>
  )
}

// ── Page ���─────────────────────────────────────────────────

export default function PerfilPage() {
  const { advisor: storeAdvisor } = useAuthStore()

  const [advisor, setAdvisor] = useState<Advisor | null>(storeAdvisor)
  const [isLoading, setIsLoading] = useState(true)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(storeAdvisor?.full_name ?? '')
  const [isSavingName, setIsSavingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>(
    storeAdvisor?.availability_status ?? 'available'
  )
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null)
  const [isSavingStatus, setIsSavingStatus] = useState(false)

  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true)
      try {
        const { advisor: fetched } = await advisorsService.getMe()
        setAdvisor(fetched)
        setNameValue(fetched.full_name)
        setSelectedStatus(fetched.availability_status)
        setSelectedMinutes(fetched.availability_status === 'available' ? null : 15)
      } catch {
        // network unavailable — silently fail; skeleton stays hidden
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [])

  async function handleApplyStatus() {
    setIsSavingStatus(true)
    try {
      await advisorsService.updateAvailability(
        selectedStatus,
        selectedStatus === 'available' ? null : selectedMinutes
      )
    } catch {
      toast.error('No se pudo actualizar la disponibilidad')
    } finally {
      setIsSavingStatus(false)
    }
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      nameInputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setNameValue(advisor?.full_name ?? '')
      setEditingName(false)
      nameInputRef.current?.blur()
    }
  }

  async function handleNameBlur() {
    setEditingName(false)
    if (nameValue.trim() === advisor?.full_name) return
    if (!nameValue.trim()) {
      setNameValue(advisor?.full_name ?? '')
      return
    }
    setIsSavingName(true)
    try {
      const { advisor: updated } = await advisorsService.updateMe({
        full_name: nameValue.trim(),
      })
      setAdvisor(updated)
      setNameValue(updated.full_name)
    } catch {
      setNameValue(advisor?.full_name ?? '')
    } finally {
      setIsSavingName(false)
    }
  }

  async function onPasswordSubmit(data: PasswordFormData) {
    setPasswordError(null)
    setPasswordSuccess(false)
    setIsSavingPassword(true)
    try {
      await advisorsService.updateMe({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      })
      setPasswordSuccess(true)
      reset()
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: { code?: string } | string } } }
      const detail = err.response?.data?.detail
      const code = typeof detail === 'object' && detail !== null ? detail.code : undefined
      if (code === 'INVALID_CURRENT_PASSWORD') {
        setPasswordError('La contraseña actual es incorrecta')
      } else {
        setPasswordError('No se pudo actualizar la contraseña')
      }
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <section
      id="screen-perfil"
      className="flex-1 flex flex-col items-start p-4 md:p-6 space-y-6"
    >
      <div className="max-w-xl w-full space-y-6">
        <h2 className="text-xl font-bold text-white">Mi Perfil Profesional</h2>

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 space-y-6">

            {/* ── Avatar + datos ── */}
            <div className="flex flex-col sm:flex-row items-center gap-5">

              {/* Avatar */}
              <div className="relative group shrink-0">
                <div
                  id="perfil-avatar-img"
                  className="w-20 h-20 rounded-full border-2 border-[#01A4E3] bg-[#01A4E3]/25 flex items-center justify-center"
                >
                  <span className="text-xl font-bold text-[#01A4E3]">
                    {getInitials(advisor?.full_name)}
                  </span>
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-[#01A4E3] hover:bg-[#0190C8] text-white p-1.5 rounded-full transition shadow-lg"
                  aria-label="Cambiar foto de perfil"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Datos */}
              <div className="text-center sm:text-left space-y-1">

                {/* Nombre editable inline */}
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <input
                    ref={nameInputRef}
                    id="perfil-name"
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onFocus={() => setEditingName(true)}
                    onBlur={handleNameBlur}
                    onKeyDown={handleNameKeyDown}
                    className={[
                      'bg-transparent border-b text-base font-bold text-white',
                      'pb-0.5 max-w-[200px] outline-none transition-colors',
                      editingName
                        ? 'border-[#01A4E3]'
                        : 'border-transparent hover:border-[#3A3A37]',
                    ].join(' ')}
                  />
                  {isSavingName ? (
                    <div className="w-3 h-3 border border-[#01A4E3] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => nameInputRef.current?.focus()}
                      className="text-[#8B8FA8] hover:text-white transition"
                      aria-label="Editar nombre"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Email solo lectura */}
                <p className="text-xs text-[#8B8FA8] flex items-center justify-center sm:justify-start gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span id="perfil-email-txt">{advisor?.email}</span>
                </p>

                {/* Badges rol + área */}
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                  <span
                    id="perfil-role-badge"
                    className={[
                      'text-[10px] px-2 py-0.5 rounded font-black uppercase',
                      advisor?.role ? ROLE_BADGE_STYLES[advisor.role] : ROLE_BADGE_STYLES.asesor,
                    ].join(' ')}
                  >
                    {advisor?.role ? ROLE_BADGE_TEXT[advisor.role] : 'Asesor Senior'}
                  </span>
                  <span
                    id="perfil-area-badge"
                    className="bg-[#3A3A37] text-[#8B8FA8] text-[10px] px-2 py-0.5 rounded font-bold cursor-help"
                    title="Solo el admin puede cambiar esto"
                  >
                    Área: {advisor?.area}
                  </span>
                </div>

                {/* ── Mi Disponibilidad ── */}
                <div
                  id="availability-section"
                  className="mt-4 pt-4 border-t border-[#3A3A37]"
                >
                  <p className="text-xs font-semibold text-[#8B8FA8] uppercase tracking-wider mb-3">
                    Mi Disponibilidad
                  </p>

                  {/* Estado actual */}
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[advisor?.availability_status ?? 'available'],
                      }}
                    />
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: STATUS_COLORS[advisor?.availability_status ?? 'available'],
                      }}
                    >
                      {STATUS_LABELS[advisor?.availability_status ?? 'available']}
                    </span>
                    {advisor?.status_until && (
                      <span className="text-[10px] text-[#8B8FA8]">
                        · Disponible a las {formatStatusUntil(advisor.status_until)}
                      </span>
                    )}
                  </div>

                  {/* Selector de estado */}
                  <div
                    id="availability-status-pills"
                    className="flex items-center gap-2 mb-3 flex-wrap"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedStatus(option.value)
                          if (option.value === 'available') {
                            setSelectedMinutes(null)
                          } else {
                            setSelectedMinutes(15)
                          }
                        }}
                        className={[
                          'text-xs px-3 py-1.5 rounded-full border transition',
                          selectedStatus === option.value
                            ? option.activeClass
                            : 'border-[#3A3A37] text-[#8B8FA8] hover:border-[#8B8FA8]',
                        ].join(' ')}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Selector de timer — solo para break y offline */}
                  {selectedStatus !== 'available' && (
                    <div
                      id="availability-timer-options"
                      className="mb-4"
                    >
                      <p className="text-[10px] text-[#8B8FA8] mb-2">¿Por cuánto tiempo?</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {TIMER_OPTIONS.map((option) => (
                          <button
                            key={String(option.value)}
                            type="button"
                            onClick={() => setSelectedMinutes(option.value)}
                            className={[
                              'text-[10px] px-2.5 py-1 rounded border transition',
                              selectedMinutes === option.value
                                ? 'bg-[#2E2E2B] border-[#8B8FA8] text-[#F0F0F5]'
                                : 'border-[#3A3A37] text-[#8B8FA8] hover:border-[#8B8FA8]',
                            ].join(' ')}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {/* Texto informativo */}
                      <p id="availability-info-text" className="text-[10px] mt-2">
                        {selectedMinutes !== null ? (
                          <span className="text-[#00D4AA]">
                            ✓ Volverás a Disponible automáticamente en {selectedMinutes} minutos
                          </span>
                        ) : (
                          <span className="text-[#FFB84D]">
                            ⚠️ Deberás activar tu disponibilidad manualmente cuando estés listo para atender
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Botón Aplicar */}
                  <button
                    type="button"
                    onClick={handleApplyStatus}
                    disabled={isSavingStatus}
                    className="w-full bg-[#01A4E3] hover:bg-[#0190C8] text-white text-xs font-semibold py-2.5 rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSavingStatus && (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Aplicar
                  </button>
                </div>

              </div>
            </div>

            {/* ── Cambio de contraseña ── */}
            <form
              onSubmit={handleSubmit(onPasswordSubmit)}
              className="border-t border-[#3A3A37] pt-6 space-y-4"
            >
              <h4 className="text-sm font-semibold text-white">Cambiar Contraseña Acceso</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[#8B8FA8] font-semibold block uppercase text-[10px] tracking-wide">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    {...register('currentPassword')}
                    className="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-md p-2.5 text-white outline-none focus:border-[#01A4E3] transition"
                  />
                  {errors.currentPassword && (
                    <p className="text-[#FF5B5B] text-[10px]">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[#8B8FA8] font-semibold block uppercase text-[10px] tracking-wide">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    {...register('newPassword')}
                    className="w-full bg-[#2E2E2B] border border-[#3A3A37] rounded-md p-2.5 text-white placeholder-[#8B8FA8]/40 outline-none focus:border-[#01A4E3] transition"
                  />
                  {errors.newPassword && (
                    <p className="text-[#FF5B5B] text-[10px]">{errors.newPassword.message}</p>
                  )}
                </div>
              </div>

              {passwordError && (
                <p className="text-[#FF5B5B] text-xs">{passwordError}</p>
              )}

              {passwordSuccess && (
                <p className="text-[#00D4AA] text-xs flex items-center gap-1">
                  ✓ Contraseña actualizada correctamente
                </p>
              )}

              <button
                type="submit"
                disabled={isSavingPassword}
                className="bg-[#01A4E3] hover:bg-[#0190C8] text-white py-2.5 px-4 rounded text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
              >
                {isSavingPassword && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Actualizar contraseña
              </button>
            </form>

          </div>
        )}

        <ScheduleManager />
      </div>
    </section>
  )
}
