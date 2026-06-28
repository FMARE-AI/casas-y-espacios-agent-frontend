import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuthStore } from '../store/authStore'
import { advisorsService } from '../services/advisors'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FirstLoginFormData = z.infer<typeof schema>

// M-02: evaluate complexity, not just length.
function getStrength(pwd: string): { text: string; color: string; bars: number } {
  if (!pwd) return { text: 'No ingresada', color: '#FF5B5B', bars: 0 }
  if (pwd.length < 6) return { text: 'Débil', color: '#FF5B5B', bars: 1 }

  let score = 0
  if (pwd.length >= 8)                score++
  if (/[A-Z]/.test(pwd))             score++
  if (/[0-9]/.test(pwd))             score++
  if (/[^A-Za-z0-9]/.test(pwd))      score++
  // penalize repeated chars (e.g. "aaaaaaaaaa")
  if (/(.)\1{2,}/.test(pwd))         score = Math.max(0, score - 2)

  if (score <= 1) return { text: 'Débil',  color: '#FF5B5B', bars: 1 }
  if (score <= 2) return { text: 'Media',  color: '#FFB84D', bars: 2 }
  return             { text: 'Fuerte', color: '#00D4AA', bars: 3 }
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { text, color, bars } = getStrength(password)
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[10px]">
        <span className="text-[#8B8FA8]">Seguridad de la contraseña:</span>
        <span style={{ color }} className="font-bold">{text}</span>
      </div>
      <div className="h-1.5 w-full bg-[#2E2E2B] rounded-full overflow-hidden flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-full w-1/3 transition-all duration-300"
            style={{ backgroundColor: bars >= i ? color : 'transparent' }}
          />
        ))}
      </div>
    </div>
  )
}

export function FirstLoginPage() {
  const navigate = useNavigate()
  const authStore = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FirstLoginFormData>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const newPasswordValue = watch('newPassword') ?? ''

  const onSubmit = async (data: FirstLoginFormData) => {
    try {
      // Send must_change_password: false together with the password change so the
      // backend persists it in a single PATCH. The backend validates current_password
      // before applying any update, so this flag only clears when the change succeeds.
      const { advisor } = await advisorsService.updateMe({
        current_password: data.currentPassword,
        new_password: data.newPassword,
        must_change_password: false,
      })
      authStore.setAdvisor(advisor)
      authStore.setFirstLogin(false)
      navigate('/')
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: { code?: string; message?: string } } } }
      const code = axiosErr?.response?.data?.detail?.code
      const message = axiosErr?.response?.data?.detail?.message ?? 'Error al cambiar la contraseña'
      if (code === 'INVALID_CURRENT_PASSWORD') {
        setError('currentPassword', { message: 'Contraseña actual incorrecta' })
      } else {
        setError('root', { message })
      }
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center py-8 px-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #1e3a4a 0%, #1a1a18 40%, #111110 100%)' }}
    >
      {/* Atmospheric grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(1,164,227,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(1,164,227,0.04) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Top ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(1,164,227,0.12) 0%, transparent 70%)' }}
      />
      <div className="max-w-md w-full relative z-10 bg-[#252522] border border-[#3A3A37] rounded-xl p-6 sm:p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0 text-[#FFB84D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Establecer nueva contraseña
          </h2>
          <p className="text-xs text-[#8B8FA8] mt-1.5">
            Por motivos de seguridad, debés configurar una contraseña definitiva en tu primer login.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Contraseña actual */}
          <div>
            <div className="relative">
              <input
                type="password"
                id="first-login-current"
                {...register('currentPassword')}
                className="peer w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-md px-3 pt-5 pb-1 text-xs outline-none transition duration-150 focus:ring-1 focus:ring-[#01A4E3]/30"
                placeholder=" "
              />
              <label htmlFor="first-login-current" className="absolute text-xs text-[#8B8FA8] duration-150 top-4 left-3 origin-[0] transform -translate-y-3 scale-75 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3] pointer-events-none">
                Contraseña temporal actual
              </label>
            </div>
            {errors.currentPassword && (
              <span className="text-[10px] text-[#FF5B5B] block mt-1">{errors.currentPassword.message}</span>
            )}
          </div>

          {/* Nueva contraseña */}
          <div>
            <div className="relative">
              <input
                type="password"
                id="first-login-new"
                {...register('newPassword')}
                className="peer w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-md px-3 pt-5 pb-1 text-xs outline-none transition duration-150 focus:ring-1 focus:ring-[#01A4E3]/30"
                placeholder=" "
              />
              <label htmlFor="first-login-new" className="absolute text-xs text-[#8B8FA8] duration-150 top-4 left-3 origin-[0] transform -translate-y-3 scale-75 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3] pointer-events-none">
                Nueva contraseña
              </label>
            </div>
            {errors.newPassword && (
              <span className="text-[10px] text-[#FF5B5B] block mt-1">{errors.newPassword.message}</span>
            )}
          </div>

          <PasswordStrengthBar password={newPasswordValue} />

          {/* Confirmar contraseña */}
          <div>
            <div className="relative">
              <input
                type="password"
                id="first-login-confirm"
                {...register('confirmPassword')}
                className="peer w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-md px-3 pt-5 pb-1 text-xs outline-none transition duration-150 focus:ring-1 focus:ring-[#01A4E3]/30"
                placeholder=" "
              />
              <label htmlFor="first-login-confirm" className="absolute text-xs text-[#8B8FA8] duration-150 top-4 left-3 origin-[0] transform -translate-y-3 scale-75 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3] pointer-events-none">
                Confirmar nueva contraseña
              </label>
            </div>
            {errors.confirmPassword && (
              <span className="text-[10px] text-[#FF5B5B] block mt-1">{errors.confirmPassword.message}</span>
            )}
          </div>

          {errors.root && (
            <div className="rounded-lg p-3 border text-xs text-[#FF5B5B]" style={{ background: 'rgba(255,91,91,0.08)', borderColor: 'rgba(255,91,91,0.4)' }}>
              {errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-[#01A4E3] to-[#008BBF] hover:from-[#0190C8] hover:to-[#007ba8] text-white rounded-md font-bold text-xs transition duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
