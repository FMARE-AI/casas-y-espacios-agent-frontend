import { isValidEmail, mailtoHref } from '../../lib/mailto'

interface EmailLinkProps {
  email: string
  className?: string
  // true: long addresses wrap onto several lines (narrow side panels).
  // false: single line truncated with ellipsis, full address in the tooltip (table cells).
  wrap?: boolean
}

// One mailto link for every place that shows a client's email (chat panel, Contactos).
export function EmailLink({ email, className = '', wrap = false }: EmailLinkProps) {
  const value = email.trim()
  const layout = wrap ? 'break-all' : 'truncate'

  if (!isValidEmail(value)) {
    return (
      <span className={`block ${className}`} title={`Correo no válido: ${value}`}>
        <span className={`block ${layout} line-through decoration-text-secondary/60`}>{value}</span>
        <span className="block text-[10px] font-sans text-amber-400">Correo no válido</span>
      </span>
    )
  }

  return (
    <a
      href={mailtoHref(value)}
      aria-label={`Enviar correo a ${value}`}
      title={value}
      className={`block ${layout} hover:text-brand-blue transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90 rounded-sm ${className}`}
    >
      {value}
    </a>
  )
}
