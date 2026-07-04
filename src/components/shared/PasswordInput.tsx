import { useState } from 'react'
import { usePasswordStrength } from '../../hooks/usePasswordStrength'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showStrength?: boolean
  label?: string
  error?: string | null
  disabled?: boolean
  autoComplete?: string
}

export function PasswordInput({
  value,
  onChange,
  placeholder = 'Contraseña',
  showStrength = false,
  label,
  error,
  disabled = false,
  autoComplete = 'current-password',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const strength = usePasswordStrength(value)

  const STRENGTH_COLORS = {
    empty: 'bg-[#3A3A37]',
    weak: 'bg-[#FF5B5B]',
    fair: 'bg-[#FFB84D]',
    strong: 'bg-[#00D4AA]',
  }

  const STRENGTH_TEXT = {
    empty: '',
    weak: 'Débil',
    fair: 'Media',
    strong: 'Fuerte',
  }

  const STRENGTH_TEXT_COLORS = {
    empty: 'text-[#8B8FA8]',
    weak: 'text-[#FF5B5B]',
    fair: 'text-[#FFB84D]',
    strong: 'text-[#00D4AA]',
  }

  const borderColor =
    error
      ? 'border-[#FF5B5B]'
      : value && !strength.isValid
      ? 'border-[#FFB84D]'
      : value && strength.isValid
      ? 'border-[#00D4AA]'
      : 'border-[#3A3A37] focus-within:border-[#01A4E3]'

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-medium text-[#8B8FA8] uppercase tracking-wider">
          {label}
        </label>
      )}

      <div
        className={`relative flex items-center bg-[#2E2E2B] border rounded-lg transition ${borderColor}`}
      >
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-[#F0F0F5] outline-none pr-10 placeholder-[#8B8FA8]/50 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
          className="absolute right-3 text-[#8B8FA8] hover:text-[#F0F0F5] transition"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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

      {showStrength && value && (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  strength.score >= i ? STRENGTH_COLORS[strength.level] : 'bg-[#3A3A37]'
                }`}
              />
            ))}
            <span
              className={`text-[10px] ml-1 font-semibold min-w-[40px] text-right transition-colors ${STRENGTH_TEXT_COLORS[strength.level]}`}
            >
              {STRENGTH_TEXT[strength.level]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {[
              { ok: strength.checks.minLength, label: 'Mín. 8 caracteres' },
              { ok: strength.checks.uppercase, label: 'Mayúsculas (A-Z)' },
              { ok: strength.checks.lowercase, label: 'Minúsculas (a-z)' },
              { ok: strength.checks.number, label: 'Números (0-9)' },
              { ok: strength.checks.special, label: 'Caracteres especiales' },
              { ok: strength.checks.maxLength, label: 'Máx. 72 caracteres' },
            ].map(({ ok, label: checkLabel }) => (
              <div key={checkLabel} className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold leading-none ${
                    ok ? 'text-[#00D4AA]' : 'text-[#3A3A37]'
                  }`}
                >
                  {ok ? '✓' : '○'}
                </span>
                <span
                  className={`text-[10px] ${ok ? 'text-[#8B8FA8]' : 'text-[#5A5A57]'}`}
                >
                  {checkLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-[#FF5B5B]">{error}</p>}
    </div>
  )
}
