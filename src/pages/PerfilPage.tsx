import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { advisorsService } from '../services/advisors'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import type { Advisor, AdvisorRole, AvailabilityStatus } from '../types'
import ScheduleManager from '../components/perfil/ScheduleManager'

const STORAGE_BUCKET = import.meta.env.VITE_SUPABAS_BUCKET_NAME as string

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

// ── AdvisorAvatar ─────────────────────────────────────────

const AVATAR_SIZE_CLASSES = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-20 h-20 text-lg',
}

function AdvisorAvatar({
  avatarUrl,
  fullName,
  size = 'md',
  id,
}: {
  avatarUrl: string | null
  fullName: string
  size?: 'sm' | 'md' | 'lg'
  id?: string
}) {
  const sizeClass = AVATAR_SIZE_CLASSES[size]
  if (avatarUrl) {
    return (
      <img
        id={id}
        src={avatarUrl}
        alt={fullName}
        className={`${sizeClass} rounded-full border-2 border-[#01A4E3] object-cover`}
      />
    )
  }
  return (
    <div
      id={id}
      className={`${sizeClass} rounded-full bg-[#01A4E3]/25 border-2 border-[#01A4E3] flex items-center justify-center text-[#01A4E3] font-bold`}
    >
      {getInitials(fullName)}
    </div>
  )
}

// ── Availability constants ─────────────────────────────────

const STATUS_OPTIONS = [
  {
    value: 'available' as const,
    label: 'Disponible',
    id: 'avail-btn-available',
    activeClass: 'bg-[#00D4AA]/20 text-[#00D4AA] border-[#00D4AA]/40',
    inactiveClass: 'border-[#3A3A37] text-[#8B8FA8] hover:border-[#00D4AA]/40 hover:text-[#00D4AA]',
    icon: <span className="w-2 h-2 rounded-full bg-[#00D4AA] shrink-0" />,
  },
  {
    value: 'break' as const,
    label: 'En descanso',
    id: 'avail-btn-break',
    activeClass: 'bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/40',
    inactiveClass: 'border-[#3A3A37] text-[#8B8FA8] hover:border-[#FFB84D]/40 hover:text-[#FFB84D]',
    icon: <span className="text-[10px] leading-none select-none">▮</span>,
  },
  {
    value: 'offline' as const,
    label: 'No disponible',
    id: 'avail-btn-offline',
    activeClass: 'bg-[#FF5B5B]/20 text-[#FF5B5B] border-[#FF5B5B]/40',
    inactiveClass: 'border-[#3A3A37] text-[#8B8FA8] hover:border-[#FF5B5B]/40 hover:text-[#FF5B5B]',
    icon: <span className="text-[10px] leading-none select-none">✕</span>,
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
  const { advisor: storeAdvisor, setAdvisor: setStoreAdvisor } = useAuthStore()

  const [advisor, setAdvisor] = useState<Advisor | null>(storeAdvisor)
  const [isLoading, setIsLoading] = useState(true)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(storeAdvisor?.full_name ?? '')
  const [isSavingName, setIsSavingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>(
    storeAdvisor?.availability_status ?? 'available'
  )
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(30)
  const [isSavingStatus, setIsSavingStatus] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

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
        setSelectedMinutes(fetched.availability_status === 'available' ? null : 30)
      } catch {
        // network unavailable — silently fail; skeleton stays hidden
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !advisor) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WEBP')
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar 2MB')
      e.target.value = ''
      return
    }

    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `avatars/${advisor.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path)

      const { advisor: updated } = await advisorsService.updateMe({ avatar_url: urlData.publicUrl })
      setAdvisor(updated)
      setStoreAdvisor(updated)
    } catch {
      toast.error('No se pudo subir la imagen')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  async function handleApplyStatusDirectly(status: AvailabilityStatus, minutes: number | null) {
    setIsSavingStatus(true)
    try {
      await advisorsService.updateAvailability(status, minutes)
      const { advisor: refreshed } = await advisorsService.getMe()
      setAdvisor(refreshed)
      setStoreAdvisor(refreshed)
      setSelectedStatus(refreshed.availability_status)
      setSelectedMinutes(refreshed.availability_status === 'available' ? null : minutes)
      toast.success('Disponibilidad actualizada')
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
      setStoreAdvisor(updated)
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
          <div className="bg-[#252522]/65 backdrop-blur-[12px] border border-[#3A3A37]/50 rounded-xl p-6 space-y-6 transition-all duration-300 hover:-translate-y-[3px] hover:border-[#01A4E3] hover:shadow-lg hover:shadow-[#01A4E3]/10">

            {/* ── Avatar + datos ── */}
            <div className="flex flex-col sm:flex-row items-center gap-5">

              {/* Avatar */}
              <div className="relative group shrink-0">
                <AdvisorAvatar
                  id="perfil-avatar-img"
                  avatarUrl={advisor?.avatar_url ?? null}
                  fullName={advisor?.full_name ?? ''}
                  size="lg"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 bg-[#01A4E3] hover:bg-[#0190C8] text-white p-1.5 rounded-full transition shadow-lg disabled:opacity-50"
                  aria-label="Cambiar foto de perfil"
                >
                  {uploadingAvatar ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
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
                  <h4 className="text-xs font-bold text-white mb-3">Mi Disponibilidad</h4>

                  {/* Estado actual */}
                  <div id="availability-status-display" className="flex items-center gap-2 mb-3">
                    <span
                      id="avail-dot"
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[advisor?.availability_status ?? 'available'],
                      }}
                    />
                    <span
                      id="avail-label"
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
                    className="flex flex-wrap gap-2 mb-3"
                  >
                    {STATUS_OPTIONS.map((option) => {
                      const isActive = selectedStatus === option.value
                      return (
                        <button
                          key={option.value}
                          id={option.id}
                          type="button"
                          onClick={async () => {
                            setSelectedStatus(option.value)
                            if (option.value === 'available') {
                              setSelectedMinutes(null)
                              await handleApplyStatusDirectly('available', null)
                            } else {
                              setSelectedMinutes(30)
                            }
                          }}
                          className={[
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition',
                            isActive ? option.activeClass : option.inactiveClass,
                          ].join(' ')}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Duration picker (hidden by default) */}
                  {selectedStatus !== 'available' && (
                    <div
                      id="avail-duration-picker"
                      className="mt-4 pt-1 space-y-3"
                    >
                      <p className="text-[11px] text-[#8B8FA8]">¿Por cuánto tiempo?</p>
                      <div className="flex flex-wrap gap-1.5">
                        {TIMER_OPTIONS.map((option) => {
                          const isMinutesActive = selectedMinutes === option.value
                          return (
                            <button
                              key={String(option.value)}
                              type="button"
                              onClick={() => setSelectedMinutes(option.value)}
                              className={[
                                'avail-dur-btn px-3 py-1 rounded-full text-[10px] font-bold border transition',
                                isMinutesActive
                                  ? 'border-[#01A4E3] text-[#01A4E3] bg-[#01A4E3]/10'
                                  : 'border-[#3A3A37] text-[#8B8FA8] hover:text-white hover:border-[#01A4E3]',
                              ].join(' ')}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => handleApplyStatusDirectly(selectedStatus, selectedMinutes)}
                          disabled={isSavingStatus}
                          className="bg-[#01A4E3] hover:bg-[#0190C8] text-white px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isSavingStatus && (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          )}
                          Aplicar
                        </button>
                      </div>
                    </div>
                  )}
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
