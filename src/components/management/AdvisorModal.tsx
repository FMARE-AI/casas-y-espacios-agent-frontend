import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { Advisor } from '../../types'
import { Lock, X, AlertTriangle, Info, Eye, EyeOff } from 'lucide-react'

const SPECIALTY_OPTIONS_BY_AREA: Record<string, { value: string; label: string }[]> = {
  administrativa: [
    { value: 'financiera', label: 'Financiera' },
    { value: 'mantenimiento_contratos', label: 'Mantenimiento / Contratos' },
  ],
  comercial: [
    { value: 'comercial', label: 'Comercial' },
  ],
  ambas: [],
}

const specialtyRefinement = (data: { area: string; specialty?: string | null }, ctx: z.RefinementCtx) => {
  const allowed = SPECIALTY_OPTIONS_BY_AREA[data.area]?.map((o) => o.value) ?? []
  if (data.area === 'ambas' && data.specialty) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Para área "ambas" la especialidad debe estar vacía', path: ['specialty'] })
  } else if (data.area !== 'ambas' && data.specialty && !allowed.includes(data.specialty)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Especialidad inválida para el área seleccionada', path: ['specialty'] })
  }
}

const createSchema = z.object({
  fullName: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['asesor', 'admin']),
  area: z.enum(['administrativa', 'comercial', 'ambas']),
  specialty: z.string().nullable().optional(),
  maxConversations: z.number().min(1).max(10),
}).superRefine(specialtyRefinement)

const editSchema = z.object({
  fullName: z.string().min(1, 'Nombre requerido'),
  email: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(['asesor', 'admin']),
  area: z.enum(['administrativa', 'comercial', 'ambas']),
  specialty: z.string().nullable().optional(),
  maxConversations: z.number().min(1).max(10),
}).superRefine(specialtyRefinement)

interface AdvisorFormData {
  fullName: string
  email?: string
  password?: string
  role: 'asesor' | 'admin'
  area: 'administrativa' | 'comercial' | 'ambas'
  specialty?: string | null
  maxConversations: number
}

interface AdvisorModalProps {
  mode: 'create' | 'edit'
  advisor?: Advisor
  onSubmit: (data: AdvisorFormData) => void
  onClose: () => void
  isSaving: boolean
  error?: string
}

export const AdvisorModal: React.FC<AdvisorModalProps> = ({
  mode,
  advisor,
  onSubmit,
  onClose,
  isSaving,
  error,
}) => {
  const isEdit = mode === 'edit'
  const schema = isEdit ? editSchema : createSchema
  const isFirstRender = useRef(true)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdvisorFormData>({
    resolver: zodResolver(schema) as unknown as Resolver<AdvisorFormData>,
    defaultValues: isEdit && advisor
      ? {
          fullName: advisor.full_name,
          role: advisor.role,
          area: advisor.area,
          specialty: advisor.specialty ?? null,
          maxConversations: advisor.max_conversations,
        }
      : {
          fullName: '',
          email: '',
          password: '',
          role: 'asesor',
          area: 'administrativa',
          specialty: null,
          maxConversations: 3,
        },
  })

  const selectedArea = watch('area')
  const specialtyOptions = SPECIALTY_OPTIONS_BY_AREA[selectedArea] ?? []
  const isSpecialtyDisabled = selectedArea === 'ambas'

  // Reset specialty when area changes — skip on initial mount to preserve edit defaults
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setValue('specialty', null)
  }, [selectedArea, setValue])

  const onFormSubmit = (data: AdvisorFormData) => {
    onSubmit(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-[#1D1D1B]/75 backdrop-blur-sm transition-opacity will-change-[opacity]"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        id={isEdit ? 'modal-edit-advisor' : 'modal-new-advisor'}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-[#3A3A37] bg-[#252522] text-[#F0F0F5] shadow-xl transition-colors will-change-transform"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3A3A37] px-6 py-4">
          <h3 className="text-lg font-bold text-[#F0F0F5]">
            {isEdit ? 'Editar Perfil del Asesor' : 'Crear Nuevo Asesor Operativo'}
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#8B8FA8] hover:bg-[#2E2E2B] hover:text-[#F0F0F5] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 p-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-[#FF5B5B]/50 bg-[#FF5B5B]/10 p-3 text-sm text-[#FF5B5B]">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <span className="font-semibold">Error al guardar:</span>{' '}
                {error === 'EMAIL_ALREADY_EXISTS'
                  ? 'El correo ingresado ya existe en el sistema.'
                  : error === 'INVALID_SPECIALTY_FOR_AREA'
                  ? 'La especialidad no es válida para el área seleccionada.'
                  : error}
              </div>
            </div>
          )}

          {/* Nombre completo */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B8FA8]">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              {...register('fullName')}
              className={`w-full rounded-md border bg-[#2E2E2B] px-3.5 py-2 text-sm text-[#F0F0F5] placeholder-[#8B8FA8]/40 outline-none transition-colors focus:border-[#01A4E3] ${
                errors.fullName ? 'border-[#FF5B5B]' : 'border-[#3A3A37]'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-[#FF5B5B]">{errors.fullName.message}</p>
            )}
          </div>

          {/* Correo institucional */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B8FA8]">
              Correo institucional
            </label>
            <div className="relative">
              {isEdit ? (
                <>
                  <input
                    type="email"
                    value={advisor?.email || ''}
                    disabled
                    className="w-full rounded-md border border-[#3A3A37] bg-[#2E2E2B]/50 px-3.5 py-2 pr-10 text-sm text-[#8B8FA8] cursor-not-allowed outline-none"
                  />
                  <Lock className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#8B8FA8]/50" />
                </>
              ) : (
                <input
                  type="email"
                  placeholder="Ej: jperez@casasyespacios.co"
                  {...register('email')}
                  className={`w-full rounded-md border bg-[#2E2E2B] px-3.5 py-2 text-sm text-[#F0F0F5] placeholder-[#8B8FA8]/40 outline-none transition-colors focus:border-[#01A4E3] ${
                    errors.email ? 'border-[#FF5B5B]' : 'border-[#3A3A37]'
                  }`}
                />
              )}
            </div>
            {!isEdit && errors.email && (
              <p className="mt-1 text-xs text-[#FF5B5B]">{errors.email.message}</p>
            )}
          </div>

          {/* Contraseña temporal (solo crear) */}
          {!isEdit && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B8FA8]">
                Contraseña temporal
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  {...register('password')}
                  className={`w-full rounded-md border bg-[#2E2E2B] px-3.5 py-2 pr-10 text-sm text-[#F0F0F5] placeholder-[#8B8FA8]/40 outline-none transition-colors focus:border-[#01A4E3] ${
                    errors.password ? 'border-[#FF5B5B]' : 'border-[#3A3A37]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8B8FA8] hover:text-[#F0F0F5] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[#FF5B5B]">{errors.password.message}</p>
              )}
            </div>
          )}

          {/* Grid Rol + Área */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B8FA8]">
                Rol en el panel
              </label>
              <select
                {...register('role')}
                className="w-full rounded-md border border-[#3A3A37] bg-[#2E2E2B] px-3.5 py-2 text-sm text-[#F0F0F5] outline-none transition-colors focus:border-[#01A4E3]"
              >
                <option value="asesor">Asesor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B8FA8]">
                Área operativa
              </label>
              <select
                {...register('area')}
                className="w-full rounded-md border border-[#3A3A37] bg-[#2E2E2B] px-3.5 py-2 text-sm text-[#F0F0F5] outline-none transition-colors focus:border-[#01A4E3]"
              >
                <option value="administrativa">Administrativa</option>
                <option value="comercial">Comercial</option>
                <option value="ambas">Ambas áreas</option>
              </select>
            </div>
          </div>

          {/* Especialidad */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B8FA8]">
              Especialidad <span className="font-normal normal-case text-[#8B8FA8]/60">(opcional)</span>
            </label>
            <select
              {...register('specialty')}
              disabled={isSpecialtyDisabled}
              className={`w-full rounded-md border bg-[#2E2E2B] px-3.5 py-2 text-sm text-[#F0F0F5] outline-none transition-colors focus:border-[#01A4E3] disabled:cursor-not-allowed disabled:opacity-40 ${
                errors.specialty ? 'border-[#FF5B5B]' : 'border-[#3A3A37]'
              }`}
            >
              <option value="">Sin especialidad</option>
              {specialtyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.specialty && (
              <p className="mt-1 text-xs text-[#FF5B5B]">{errors.specialty.message}</p>
            )}
            {isSpecialtyDisabled && (
              <p className="mt-1 text-xs text-[#8B8FA8]/60">
                Área "ambas" no admite especialidad.
              </p>
            )}
          </div>

          {/* Límite de conversaciones */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B8FA8]">
              Límite de conversaciones activas
            </label>
            <select
              {...register('maxConversations', { valueAsNumber: true })}
              className="w-full rounded-md border border-[#3A3A37] bg-[#2E2E2B] px-3.5 py-2 text-sm text-[#F0F0F5] outline-none transition-colors focus:border-[#01A4E3]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 3 ? 'conversaciones (estándar)' : num === 1 ? 'conversación' : 'conversaciones'}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="mt-1.5 text-xs text-[#8B8FA8]">
                Capacidad máxima de chats simultáneos que el asesor puede atender.
              </p>
            )}
          </div>

          {/* Nota informativa (solo crear) */}
          {!isEdit && (
            <div className="flex gap-2.5 rounded-lg border border-[#FFB84D]/35 bg-[#FFB84D]/10 p-3.5 text-xs text-[#FFB84D]">
              <Info className="h-4 w-4 shrink-0" />
              <p className="leading-normal">
                Al crear el perfil se utilizará la contraseña temporal definida arriba. El asesor deberá cambiarla obligatoriamente en su primer inicio de sesión.
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 border-t border-[#3A3A37] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-md border border-[#3A3A37] bg-transparent px-4.5 py-2 text-sm font-semibold text-[#F0F0F5] hover:bg-[#2E2E2B] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-[#01A4E3] px-4.5 py-2 text-sm font-semibold text-white hover:bg-[#01A4E3]/95 active:bg-[#01A4E3]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {isEdit ? 'Guardar cambios' : 'Crear asesor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
