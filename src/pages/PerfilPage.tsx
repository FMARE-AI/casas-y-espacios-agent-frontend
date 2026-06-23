import { useEffect, useRef, useState } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { advisorsService } from '../services/advisors'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import type { Advisor, AdvisorRole, AvailabilityStatus } from '../types'
import ScheduleManager from '../components/perfil/ScheduleManager'

const STORAGE_BUCKET = (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_BUCKET_NAME || 'advisors-avatars') as string

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
  sm:  'w-8 h-8 text-[10px]',
  md:  'w-10 h-10 text-xs',
  lg:  'w-20 h-20 text-lg',
  xl:  'w-28 h-28 text-2xl',
}

function AdvisorAvatar({
  avatarUrl,
  fullName,
  size = 'md',
  id,
}: {
  avatarUrl: string | null
  fullName: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  id?: string
}) {
  const sizeClass = AVATAR_SIZE_CLASSES[size]
  if (avatarUrl) {
    return (
      <img
        id={id}
        src={avatarUrl}
        alt={fullName}
        className={`${sizeClass} rounded-full border-[3px] border-[#01A4E3] object-cover`}
      />
    )
  }
  return (
    <div
      id={id}
      className={`${sizeClass} rounded-full bg-[#01A4E3]/20 border-[3px] border-[#01A4E3] flex items-center justify-center text-[#01A4E3] font-bold`}
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
  admin:  'bg-[#FF5B5B]/15 text-[#FF5B5B]',
}

const ROLE_BADGE_TEXT: Record<AdvisorRole, string> = {
  asesor: 'Asesor Senior',
  admin:  'Administrador Global',
}



// ── Skeleton ──────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-28 h-28 rounded-full bg-[#2E2E2B] shrink-0" />
          <div className="space-y-3 flex-1 w-full">
            <div className="h-6 bg-[#2E2E2B] rounded w-48" />
            <div className="h-3 bg-[#2E2E2B] rounded w-64" />
            <div className="flex gap-2">
              <div className="h-5 bg-[#2E2E2B] rounded w-28" />
              <div className="h-5 bg-[#2E2E2B] rounded w-20" />
            </div>
            <div className="h-6 bg-[#2E2E2B] rounded w-32 mt-2" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 h-40" />
        <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 h-40" />
      </div>
    </div>
  )
}

// ── PasswordInput ──────────────────────────────────────────

interface PasswordInputProps {
  id: string
  label: string
  register: UseFormRegisterReturn
  error?: string
  placeholder?: string
}

function PasswordInput({ id, label, register, error, placeholder }: PasswordInputProps) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div className="space-y-1">
        <label htmlFor={id} className="text-[10px] text-[#8B8FA8] uppercase font-bold tracking-wider block">
          {label}
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            id={id}
            {...register}
            className="w-full bg-[#2E2E2B]/60 border border-[#3A3A37] focus:border-[#01A4E3] text-white text-xs rounded-lg px-3 py-2.5 pr-10 outline-none transition-all duration-200 focus:ring-1 focus:ring-[#01A4E3]/20"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8FA8] hover:text-white transition-colors"
            aria-label="Mostrar contraseña"
          >
            {show ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {error && <p className="text-[#FF5B5B] text-xs mt-1 pl-1">{error}</p>}
      {!error && placeholder && <p className="text-[#8B8FA8] text-xs mt-1 pl-1">{placeholder}</p>}
    </div>
  )
}

// ── Page ──

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

  function handleStartEdit() {
    setEditingName(true)
    setTimeout(() => {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }, 50)
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

  const currentStatus = advisor?.availability_status ?? 'available'

  return (
    <section
      id="screen-perfil"
      className="flex-1 flex flex-col p-4 md:p-6 space-y-6 w-full overflow-y-auto"
    >
      <div className="max-w-4xl w-full space-y-6 mx-auto">
        <h2 className="text-xl font-bold text-white tracking-tight">Mi Perfil Profesional</h2>

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="space-y-6 w-full">

            {/* ── Tarjeta Hero del Perfil ── */}
            <div className="bg-[#252522]/95 border border-[#3A3A37] rounded-xl p-6 relative flex flex-col sm:flex-row items-center gap-6 shadow-xl" style={{ background: 'rgba(37,37,34,0.65)', backdropFilter: 'blur(12px)' }}>
              
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div id="perfil-avatar-img">
                  <AdvisorAvatar
                    avatarUrl={advisor?.avatar_url ?? null}
                    fullName={advisor?.full_name ?? ''}
                    size="lg"
                  />
                </div>
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

              {/* Datos en el centro */}
              <div className="text-center sm:text-left flex-1 space-y-2 min-w-0">
                
                {/* Nombre editable inline */}
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <input
                    ref={nameInputRef}
                    id="perfil-name"
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    readOnly={!editingName}
                    onBlur={handleNameBlur}
                    onKeyDown={handleNameKeyDown}
                    className={[
                      'bg-transparent border-b text-xl font-semibold text-white',
                      'pb-0.5 max-w-[280px] outline-none transition-colors w-full',
                      editingName
                        ? 'border-[#01A4E3] cursor-text'
                        : 'border-transparent cursor-default',
                    ].join(' ')}
                  />
                  {isSavingName ? (
                    <div className="w-4 h-4 border-2 border-[#01A4E3] border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    !editingName && (
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="text-[#8B8FA8] hover:text-[#01A4E3] transition p-1 shrink-0"
                        aria-label="Editar nombre"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )
                  )}
                </div>

                {/* Email */}
                <p className="text-sm text-[#8B8FA8] flex items-center justify-center sm:justify-start gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0 text-[#8B8FA8]/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span id="perfil-email-txt">{advisor?.email}</span>
                </p>

                {/* Badges rol + área + estado */}
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start items-center">
                  <span
                    id="perfil-role-badge"
                    className={[
                      'text-xs px-3 py-1 rounded-md font-bold uppercase tracking-wide',
                      advisor?.role ? ROLE_BADGE_STYLES[advisor.role] : ROLE_BADGE_STYLES.asesor,
                    ].join(' ')}
                  >
                    {advisor?.role ? ROLE_BADGE_TEXT[advisor.role] : 'Asesor Senior'}
                  </span>

                  <span
                    id="perfil-area-badge"
                    className="text-xs px-3 py-1 rounded-md font-medium border border-[#3A3A37] text-[#8B8FA8] bg-[#2E2E2B]/60 cursor-help"
                    title="Solo el admin puede cambiar esto"
                  >
                    Área: {advisor?.area}
                  </span>

                  <div
                    id="availability-status-display"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border"
                    style={{
                      borderColor: `${STATUS_COLORS[currentStatus]}35`,
                      backgroundColor: `${STATUS_COLORS[currentStatus]}10`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[currentStatus] }}
                    />
                    <span
                      id="avail-label"
                      className="text-xs font-semibold"
                      style={{ color: STATUS_COLORS[currentStatus] }}
                    >
                      {STATUS_LABELS[currentStatus]}
                    </span>
                    {advisor?.status_until && (
                      <span className="text-xs text-[#8B8FA8]">
                        · {formatStatusUntil(advisor.status_until)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Grid del Perfil ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              
              {/* Columna Izquierda: Mi Disponibilidad */}
              <div
                id="availability-section"
                className="bg-[#252522] border border-white/[0.07] rounded-xl p-6 flex flex-col gap-4 shadow-xl"
                style={{ background: 'rgba(37,37,34,0.65)', backdropFilter: 'blur(12px)' }}
              >
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider border-l-4 border-[#01A4E3] pl-3">
                  Mi Disponibilidad
                </h4>

                {/* Selector de estado: 3 pills seleccionables */}
                <div id="availability-status-pills" className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map((option) => (
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
                          setSelectedMinutes(15)
                        }
                      }}
                      className={[
                        'text-xs py-2.5 rounded-lg border transition-all duration-200 text-center font-bold active:scale-[0.98]',
                        selectedStatus === option.value
                          ? option.activeClass
                          : 'border-[#3A3A37] text-[#8B8FA8] hover:border-[#8B8FA8] hover:bg-[#2E2E2B]/30',
                      ].join(' ')}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Estado disponible — bloque informativo */}
                {selectedStatus === 'available' ? (
                  <div className="rounded-xl border border-[#00D4AA]/20 bg-[#00D4AA]/5 p-4 flex items-center gap-4">
                    <div className="relative shrink-0">
                      <span className="absolute inset-0 rounded-full bg-[#00D4AA]/20 animate-ping" />
                      <span className="relative w-3 h-3 rounded-full bg-[#00D4AA] block" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#00D4AA]">En línea</p>
                      <p className="text-xs text-[#8B8FA8] mt-0.5">Recibiendo conversaciones normalmente</p>
                    </div>
                  </div>
                ) : (
                  /* Timer + botón — solo para break y offline */
                  <div id="availability-timer-options" className="flex flex-col gap-3">
                    <div className="border-t border-white/5 pt-1">
                      <p className="text-xs text-[#8B8FA8] uppercase font-bold tracking-wider mb-2">¿Por cuánto tiempo?</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {TIMER_OPTIONS.map((option) => (
                          <button
                            key={String(option.value)}
                            type="button"
                            onClick={() => setSelectedMinutes(option.value)}
                            className={[
                              'text-xs py-2 rounded-md border transition-all duration-150 font-semibold',
                              selectedMinutes === option.value
                                ? 'bg-[#2E2E2B] border-[#8B8FA8] text-white shadow-md'
                                : 'border-[#3A3A37] text-[#8B8FA8] hover:border-[#8B8FA8] hover:bg-[#2E2E2B]/10',
                            ].join(' ')}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Texto informativo */}
                    <p id="availability-info-text" className="text-xs leading-relaxed">
                      {selectedMinutes !== null ? (
                        <span className="text-[#00D4AA] font-medium flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Volverás a Disponible en {selectedMinutes >= 60 ? `${selectedMinutes / 60} hora` : `${selectedMinutes} min`}
                        </span>
                      ) : (
                        <span className="text-[#FFB84D] font-medium flex items-start gap-1.5">
                          <span className="shrink-0 mt-px">⚠️</span>
                          <span>Deberás activar tu disponibilidad manualmente cuando estés listo</span>
                        </span>
                      )}
                    </p>

                    {/* Botón Aplicar — solo visible en break/offline */}
                    <button
                      type="button"
                      onClick={() => handleApplyStatusDirectly(selectedStatus, selectedMinutes)}
                      disabled={isSavingStatus}
                      className="w-full bg-[#01A4E3] hover:bg-[#0190C8] text-white text-sm font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 shadow-md"
                    >
                      {isSavingStatus && (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      <span>Aplicar Disponibilidad</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Cambiar Contraseña */}
              <form
                onSubmit={handleSubmit(onPasswordSubmit)}
                className="bg-[#252522] border border-white/[0.07] rounded-xl p-6 flex flex-col justify-between shadow-xl"
                style={{ background: 'rgba(37,37,34,0.65)', backdropFilter: 'blur(12px)' }}
              >
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider border-l-4 border-[#01A4E3] pl-3">
                    Cambiar Contraseña
                  </h4>

                  {/* Input Contraseña Actual */}
                  <div className="space-y-1">
                    <PasswordInput
                      id="current-password"
                      label="Contraseña Actual"
                      register={register('currentPassword')}
                      error={errors.currentPassword?.message}
                    />
                  </div>

                  {/* Input Nueva Contraseña */}
                  <div className="space-y-1">
                    <PasswordInput
                      id="new-password"
                      label="Nueva Contraseña"
                      register={register('newPassword')}
                      error={errors.newPassword?.message}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-[#FF5B5B] text-xs pt-1">{passwordError}</p>
                  )}

                  {passwordSuccess && (
                    <p className="text-[#00D4AA] text-xs flex items-center gap-1 font-semibold animate-pulse pt-1">
                      ✓ Contraseña actualizada correctamente
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full bg-[#01A4E3] hover:bg-[#0190C8] text-white py-3 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 active:scale-95 shadow-md"
                >
                  {isSavingPassword && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Actualizar contraseña
                </button>
              </form>
            </div>

          </div>
        )}

        <ScheduleManager />
      </div>
    </section>
  )
}
