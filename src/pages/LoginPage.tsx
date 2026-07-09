import { useState, useEffect, useRef } from 'react'
import logoSrc from '../assets/logo.webp'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../hooks/useAuth'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

type LoginFormData = z.infer<typeof schema>

// M-01: exponential backoff delays per consecutive failure (seconds).
const BACKOFF_DELAYS = [0, 2, 5, 15, 30, 60]

function getBackoffDelay(failedAttempts: number): number {
  return BACKOFF_DELAYS[Math.min(failedAttempts, BACKOFF_DELAYS.length - 1)]
}

export function LoginPage() {
  const { signIn, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // M-01: backoff state
  const [, setFailedAttempts] = useState(0)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const lockoutRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (lockoutRef.current) clearInterval(lockoutRef.current)
    }
  }, [])

  function startLockout(seconds: number) {
    if (seconds <= 0) return
    setLockoutSeconds(seconds)
    lockoutRef.current = setInterval(() => {
      setLockoutSeconds((s) => {
        if (s <= 1) {
          clearInterval(lockoutRef.current!)
          lockoutRef.current = null
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: LoginFormData) => {
    if (lockoutSeconds > 0) return
    const success = await signIn(data.email, data.password, rememberMe)
    if (!success) {
      // M-01: increment failure counter and apply exponential backoff.
      setFailedAttempts((prev) => {
        const next = prev + 1
        const delay = getBackoffDelay(next)
        if (delay > 0) startLockout(delay)
        return next
      })
    } else {
      setFailedAttempts(0)
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
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(1,164,227,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Card */}
      <div
        className="max-w-md w-full relative z-10"
        style={{ animation: 'cardEntrance 0.45s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <style>{`
          @keyframes cardEntrance {
            from { transform: translateY(20px) scale(0.98); }
            to   { transform: translateY(0)    scale(1);    }
          }
          .input-field:focus {
            box-shadow: 0 0 0 1px rgba(1,164,227,0.5), 0 0 16px rgba(1,164,227,0.12);
          }
          .btn-primary:not(:disabled):hover {
            box-shadow: 0 8px 20px rgba(1,164,227,0.35);
            transform: translateY(-1px);
          }
          .btn-primary:not(:disabled):active {
            transform: translateY(0);
          }
        `}</style>

        {/* Blue top accent bar */}
        <div
          className="h-0.5 w-full rounded-t-xl"
          style={{ background: 'linear-gradient(90deg, transparent, #01A4E3 40%, #00D4AA 60%, transparent)' }}
        />

        <div
          className="bg-[#252522]/95 border border-[#3A3A37] border-t-0 rounded-b-xl p-7 sm:p-9"
          style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(1,164,227,0.06) inset' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative mb-5">
              <div
                className="absolute inset-0 pointer-events-none scale-150"
                style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(1,164,227,0.18), transparent 70%)' }}
              />
              <img
                src={logoSrc}
                alt="Casas y Espacios"
                className="relative z-10 h-20 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 0 16px rgba(1,164,227,0.4))' }}
              />
            </div>
            <p className="text-xs text-[#8B8FA8] tracking-wide text-center leading-relaxed">
              Panel de Atención
              <span className="mx-2 text-[#3A3A37]">·</span>
              Acceso exclusivo para el equipo
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <div>
              <div className="relative">
                <input
                  type="email"
                  id="login-email"
                  autoComplete="email"
                  {...register('email')}
                  className="input-field peer w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-lg pl-3 pr-10 pt-5 pb-1.5 text-base outline-none transition-all duration-200"
                  placeholder=" "
                />
                <label
                  htmlFor="login-email"
                  className="absolute text-xs text-[#9296AC] duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3] pointer-events-none"
                >
                  Correo Electrónico
                </label>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8FA8] pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              {errors.email && (
                <p className="text-[11px] text-[#FF5B5B] mt-1 pl-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="input-field peer w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-lg pl-3 pr-10 pt-5 pb-1.5 text-base outline-none transition-all duration-200"
                  placeholder=" "
                />
                <label
                  htmlFor="login-password"
                  className="absolute text-xs text-[#9296AC] duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3] pointer-events-none"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8B8FA8] hover:text-[#01A4E3] transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-[#FF5B5B] mt-1 pl-1">{errors.password.message}</p>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div
                data-login-error
                className="rounded-lg p-3.5 flex items-start gap-3 border"
                style={{ background: 'rgba(255,91,91,0.08)', borderColor: 'rgba(255,91,91,0.4)' }}
              >
                <svg className="w-4.5 h-4.5 text-[#FF5B5B] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-xs leading-relaxed">
                  <span className="font-semibold text-white block">Error al iniciar sesión</span>
                  <span className="text-[#8B8FA8]">{error}</span>
                </div>
              </div>
            )}

            {/* Remember + forgot */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              {/* L-01: checkbox is now functional — controls whether RT persists across browser restarts. */}
              <label className="flex items-center gap-2 text-[#8B8FA8] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#01A4E3] rounded"
                />
                <span>Recordar sesión</span>
              </label>
              <a href="#" className="text-[#01A4E3] hover:text-[#33b8f0] transition-colors font-medium">
                ¿Olvidó su contraseña?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || lockoutSeconds > 0}
              className="btn-primary w-full h-12 text-white rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #01A4E3 0%, #0088c2 100%)',
                boxShadow: '0 4px 14px rgba(1,164,227,0.25)',
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : lockoutSeconds > 0 ? (
                // M-01: show remaining lockout seconds during backoff.
                <span>Reintentar en {lockoutSeconds}s</span>
              ) : (
                <>
                  <span>Ingresar al sistema</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-7 pt-5 border-t border-[#3A3A37]/50 flex items-center justify-between">
            <span className="text-[10px] text-[#6B6F7E] uppercase tracking-widest font-semibold">
              © 2026 Casas y Espacios S.A.S.
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-[#6B6F7E] font-medium">
              <svg className="w-3 h-3 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Acceso seguro
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
