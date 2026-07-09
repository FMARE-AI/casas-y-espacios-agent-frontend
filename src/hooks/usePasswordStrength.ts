export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  level: 'empty' | 'weak' | 'fair' | 'strong'
  isValid: boolean
  checks: {
    minLength: boolean
    maxLength: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
  errorMessage: string | null
}

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72

export function usePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      level: 'empty',
      isValid: false,
      checks: {
        minLength: false,
        maxLength: true,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      },
      errorMessage: null,
    }
  }

  const checks = {
    minLength: password.length >= PASSWORD_MIN,
    maxLength: password.length <= PASSWORD_MAX,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    // eslint-disable-next-line no-useless-escape
    special: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\/\\]/.test(password),
  }

  const complexityScore = [
    checks.uppercase,
    checks.lowercase,
    checks.number,
    checks.special,
  ].filter(Boolean).length as 0 | 1 | 2 | 3 | 4

  const level =
    !checks.minLength ? 'weak' :
    complexityScore <= 2 ? 'weak' :
    complexityScore === 3 ? 'fair' :
    'strong'

  const isValid =
    checks.minLength &&
    complexityScore >= 3

  let errorMessage: string | null = null
  if (password && !checks.minLength) {
    errorMessage = `Mínimo ${PASSWORD_MIN} caracteres`
  } else if (!checks.maxLength) {
    errorMessage = `Máximo ${PASSWORD_MAX} caracteres`
  } else if (password && complexityScore < 3) {
    errorMessage =
      'Debe incluir al menos 3 de: ' +
      'mayúsculas, minúsculas, números ' +
      'y caracteres especiales'
  }

  return {
    score: complexityScore,
    level,
    isValid,
    checks,
    errorMessage,
  }
}
