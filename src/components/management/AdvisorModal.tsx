import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { Advisor } from '../../types'
import { Lock, X, AlertTriangle, Info } from 'lucide-react'
import { PasswordInput } from '../shared/PasswordInput'
import { usePasswordStrength } from '../../hooks/usePasswordStrength'

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

  const passwordValue = watch('password') ?? ''
  const passwordStrength = usePasswordStrength(passwordValue)

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
        className="fixed inset-0 bg-bg-main/75 backdrop-blur-sm transition-opacity will-change-[opacity]"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        id={isEdit ? 'modal-edit-advisor' : 'modal-new-advisor'}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-panel border border-border-default bg-bg-secondary text-text-primary shadow-md transition-colors will-change-transform"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
          <h3 className="text-h2 text-text-primary">
            {isEdit ? 'Editar Perfil del Asesor' : 'Crear Nuevo Asesor Operativo'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-control p-1 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 p-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-error/50 bg-error/10 p-3 text-sm text-error">
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
            <label className="mb-1.5 block text-label text-text-secondary uppercase">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              {...register('fullName')}
              className={`w-full rounded-md border bg-bg-tertiary px-3.5 py-2 text-sm text-text-primary placeholder-text-secondary/40 outline-none transition-colors focus:border-brand-blue ${
                errors.fullName ? 'border-error' : 'border-border-default'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-error">{errors.fullName.message}</p>
            )}
          </div>

          {/* Correo institucional */}
          <div>
            <label className="mb-1.5 block text-label text-text-secondary uppercase">
              Correo institucional
            </label>
            <div className="relative">
              {isEdit ? (
                <>
                  <input
                    type="email"
                    value={advisor?.email || ''}
                    disabled
                    className="w-full rounded-md border border-border-default bg-bg-tertiary/50 px-3.5 py-2 pr-10 text-sm text-text-secondary cursor-not-allowed outline-none"
                  />
                  <Lock className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-text-secondary/50" />
                </>
              ) : (
                <input
                  type="email"
                  placeholder="Ej: jperez@casasyespacios.co"
                  {...register('email')}
                  className={`w-full rounded-md border bg-bg-tertiary px-3.5 py-2 text-sm text-text-primary placeholder-text-secondary/40 outline-none transition-colors focus:border-brand-blue ${
                    errors.email ? 'border-error' : 'border-border-default'
                  }`}
                />
              )}
            </div>
            {!isEdit && errors.email && (
              <p className="mt-1 text-xs text-error">{errors.email.message}</p>
            )}
          </div>

          {/* Contraseña temporal (solo crear) */}
          {!isEdit && (
            <PasswordInput
              value={passwordValue}
              onChange={(v) => setValue('password', v, { shouldValidate: true })}
              placeholder="Mínimo 8 caracteres"
              label="Contraseña temporal"
              showStrength={true}
              autoComplete="new-password"
              error={
                passwordValue && !passwordStrength.isValid
                  ? (errors.password?.message ?? passwordStrength.errorMessage)
                  : null
              }
            />
          )}

          {/* Grid Rol + Área */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-label text-text-secondary uppercase">
                Rol en el panel
              </label>
              <select
                {...register('role')}
                className="w-full rounded-md border border-border-default bg-bg-tertiary px-3.5 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-blue"
              >
                <option value="asesor">Asesor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-label text-text-secondary uppercase">
                Área operativa
              </label>
              <select
                {...register('area')}
                className="w-full rounded-md border border-border-default bg-bg-tertiary px-3.5 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-blue"
              >
                <option value="administrativa">Administrativa</option>
                <option value="comercial">Comercial</option>
                <option value="ambas">Ambas áreas</option>
              </select>
            </div>
          </div>

          {/* Especialidad */}
          <div>
            <label className="mb-1.5 block text-label text-text-secondary uppercase">
              Especialidad <span className="font-normal normal-case text-text-secondary/60">(opcional)</span>
            </label>
            <select
              {...register('specialty')}
              disabled={isSpecialtyDisabled}
              className={`w-full rounded-md border bg-bg-tertiary px-3.5 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-blue disabled:cursor-not-allowed disabled:opacity-40 ${
                errors.specialty ? 'border-error' : 'border-border-default'
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
              <p className="mt-1 text-xs text-error">{errors.specialty.message}</p>
            )}
            {isSpecialtyDisabled && (
              <p className="mt-1 text-xs text-text-secondary/60">
                Área "ambas" no admite especialidad.
              </p>
            )}
          </div>

          {/* Límite de conversaciones */}
          <div>
            <label className="mb-1.5 block text-label text-text-secondary uppercase">
              Límite de conversaciones activas
            </label>
            <select
              {...register('maxConversations', { valueAsNumber: true })}
              className="w-full rounded-md border border-border-default bg-bg-tertiary px-3.5 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-blue"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 3 ? 'conversaciones (estándar)' : num === 1 ? 'conversación' : 'conversaciones'}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="mt-1.5 text-xs text-text-secondary">
                Capacidad máxima de chats simultáneos que el asesor puede atender.
              </p>
            )}
          </div>

          {/* Nota informativa (solo crear) */}
          {!isEdit && (
            <div className="flex gap-2.5 rounded-lg border border-warning/35 bg-warning/10 p-3.5 text-xs text-warning">
              <Info className="h-4 w-4 shrink-0" />
              <p className="leading-normal">
                Al crear el perfil se utilizará la contraseña temporal definida arriba. El asesor deberá cambiarla obligatoriamente en su primer inicio de sesión.
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 border-t border-border-default pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-control border border-border-default bg-transparent px-4 py-2 text-sm font-semibold text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || (!isEdit && !passwordStrength.isValid)}
              className="rounded-control bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/95 active:bg-brand-blue/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/90"
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
