export const ROLES = {
  ASESOR: 'asesor',
  GERENTE: 'gerente',
  ADMIN: 'admin',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
