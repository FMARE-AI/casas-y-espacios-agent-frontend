import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../hooks/useAuth'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

type LoginFormData = z.infer<typeof schema>

export function LoginPage() {
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showError, setShowError] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setShowError(false)
      await signIn(data.email, data.password)
    } catch {
      setShowError(true)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center py-8 px-4"
      style={{ background: 'radial-gradient(circle at 50% 0%, #292926 0%, #151514 100%)' }}
    >
      <div className="max-w-md w-full bg-[#252522] border border-[#3A3A37] rounded-xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-[#2E2E2B] p-3 rounded-xl border border-[#3A3A37] mb-3">
            <svg
              className="w-10 h-10 text-[#01A4E3]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H14V14H10V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 3V5C10 5.55228 10.4477 6 11 6H13C13.5523 6 14 5.55228 14 5V3"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Casas y Espacios <span className="text-[#01A4E3]">Agent</span>
          </h2>
          <p className="text-xs text-[#8B8FA8] mt-1.5">
            Panel de Atención — Acceso exclusivo para el equipo
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <div className="relative">
              <input
                type="email"
                id="login-email"
                {...register('email')}
                className="peer w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-md pl-3 pr-10 pt-5 pb-1 text-xs outline-none transition duration-150 focus:ring-1 focus:ring-[#01A4E3]/30"
                placeholder=" "
              />
              <label
                htmlFor="login-email"
                className="absolute text-[10px] text-[#8B8FA8] duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3] pointer-events-none"
              >
                Correo Electrónico
              </label>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8FA8] pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </span>
            </div>
            {errors.email && (
              <span className="text-[10px] text-[#FF5B5B] block mt-1">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                {...register('password')}
                className="peer w-full bg-[#2E2E2B] border border-[#3A3A37] focus:border-[#01A4E3] text-white rounded-md pl-3 pr-10 pt-5 pb-1 text-xs outline-none transition duration-150 focus:ring-1 focus:ring-[#01A4E3]/30"
                placeholder=" "
              />
              <label
                htmlFor="login-password"
                className="absolute text-[10px] text-[#8B8FA8] duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3] pointer-events-none"
              >
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8FA8] hover:text-[#01A4E3] transition-colors"
                aria-label="Toggle Password Visibility"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <span className="text-[10px] text-[#FF5B5B] block mt-1">{errors.password.message}</span>
            )}
          </div>

          {/* Error banner */}
          {showError && (
            <div className="bg-[#FF5B5B]/10 border border-[#FF5B5B] p-3 rounded-lg flex items-start space-x-2.5">
              <svg
                className="w-5 h-5 text-[#FF5B5B] shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-white block">Error de Credenciales</span>
                <span className="text-[#8B8FA8]">
                  El usuario o contraseña ingresados no pertenecen a la organización.
                </span>
              </div>
            </div>
          )}

          {/* Remember + forgot */}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <label className="flex items-center space-x-2 text-[#8B8FA8] cursor-pointer">
              <input
                type="checkbox"
                className="accent-[#01A4E3] bg-[#2E2E2B] border-[#3A3A37] rounded"
              />
              <span>Recordar sesión</span>
            </label>
            <a href="#" className="text-[#01A4E3] hover:underline font-semibold">
              ¿Olvidó su contraseña?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-[#01A4E3] to-[#008BBF] hover:from-[#0190C8] hover:to-[#007ba8] text-white rounded-md font-semibold text-xs transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Ingresar al sistema</span>
            {isSubmitting && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#3A3A37]/60 text-center text-[10px] text-[#8B8FA8] uppercase tracking-widest font-semibold">
          © 2026 Casas y Espacios S.A.S. — Sistema de uso interno restringido
        </div>
      </div>
    </div>
  )
}
