import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { advisorsService } from '../services/advisors'
import { PasswordInput } from '../components/shared/PasswordInput'
import { usePasswordStrength } from '../hooks/usePasswordStrength'

export function FirstLoginPage() {
  const navigate = useNavigate()
  const authStore = useAuthStore()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null)
  const [rootError, setRootError] = useState<string | null>(null)

  const strength = usePasswordStrength(newPassword)

  const sameAsCurrentError =
    newPassword.length > 0 && currentPassword.length > 0 && newPassword === currentPassword
      ? 'La nueva contraseña debe ser diferente a la actual'
      : null

  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== newPassword
      ? 'Las contraseñas no coinciden'
      : null

  const isFormValid =
    currentPassword.length > 0 &&
    strength.isValid &&
    newPassword === confirmPassword &&
    newPassword !== currentPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setCurrentPasswordError(null)
    setRootError(null)

    if (!currentPassword) {
      setCurrentPasswordError('Ingresá tu contraseña actual')
      return
    }

    if (newPassword === currentPassword) {
      return
    }

    if (!strength.isValid) {
      return
    }

    if (newPassword !== confirmPassword) {
      return
    }

    setIsSubmitting(true)
    try {
      const { advisor } = await advisorsService.updateMe({
        current_password: currentPassword,
        new_password: newPassword,
        must_change_password: false,
      })
      authStore.setAdvisor(advisor)
      authStore.setFirstLogin(false)
      navigate('/')
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: { code?: string; message?: string } | Array<{ loc?: string[]; type?: string; msg?: string }> } } }
      const detail = axiosErr?.response?.data?.detail
      
      if (axiosErr?.response?.status === 422) {
        if (Array.isArray(detail)) {
          const hasMaxLengthError = detail.some((d) => 
            (d.loc?.includes('new_password') || d.loc?.includes('password') || d.loc?.includes('current_password')) &&
            (d.type === 'string_too_long' || d.type?.includes('max_length') || d.msg?.toLowerCase().includes('72') || d.msg?.toLowerCase().includes('max'))
          );
          if (hasMaxLengthError) {
            setRootError('Máximo 72 caracteres')
            return
          }
        }
        setRootError('La contraseña no cumple con los requisitos')
        return
      }

      const code = typeof detail === 'object' && detail !== null && !Array.isArray(detail) ? detail.code : undefined
      const message = typeof detail === 'object' && detail !== null && !Array.isArray(detail) ? (detail.message ?? 'Error al cambiar la contraseña') : 'Error al cambiar la contraseña'
      if (code === 'INVALID_CURRENT_PASSWORD') {
        setCurrentPasswordError('Contraseña actual incorrecta')
      } else {
        setRootError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center py-8 px-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, var(--color-brand-glow) 0%, var(--color-bg-overlay) 40%, var(--color-bg-deep) 100%)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(1,164,227,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(1,164,227,0.04) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(1,164,227,0.12) 0%, transparent 70%)' }}
      />

      <div className="max-w-md w-full relative z-10 bg-bg-secondary border border-border-default rounded-panel p-6 sm:p-8 shadow-md">
        <div className="mb-6">
          <h2 className="text-h2 text-text-primary tracking-tight flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Establecer nueva contraseña
          </h2>
          <p className="text-xs text-text-secondary mt-1.5">
            Por motivos de seguridad, debés configurar una contraseña definitiva en tu primer login.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            value={currentPassword}
            onChange={(v) => {
              setCurrentPassword(v)
              setCurrentPasswordError(null)
            }}
            placeholder="Contraseña temporal"
            label="Contraseña temporal actual"
            showStrength={false}
            autoComplete="current-password"
            error={currentPasswordError}
          />

          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Nueva contraseña"
            label="Nueva contraseña"
            showStrength={true}
            autoComplete="new-password"
            error={sameAsCurrentError}
          />

          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirmar nueva contraseña"
            label="Confirmar nueva contraseña"
            showStrength={false}
            autoComplete="new-password"
            error={confirmError}
          />

          {rootError && (
            <div
              className="rounded-lg p-3 border text-xs text-error"
              style={{ background: 'rgba(255,91,91,0.08)', borderColor: 'rgba(255,91,91,0.4)' }}
            >
              {rootError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="w-full h-12 bg-gradient-to-r from-brand-blue to-brand-blue-hover hover:from-brand-blue-hover hover:to-brand-blue-hover text-white rounded-control font-bold text-xs transition duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
          >
            <span>Establecer contraseña y continuar</span>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
