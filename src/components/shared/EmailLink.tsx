import { mailtoHref } from '../../lib/mailto'

interface EmailLinkProps {
  email: string
  className?: string
}

// One mailto link for every place that shows a client's email (chat panel, Contactos).
export function EmailLink({ email, className = '' }: EmailLinkProps) {
  return (
    <a
      href={mailtoHref(email)}
      aria-label={`Enviar correo a ${email}`}
      title={email}
      className={`block truncate hover:text-brand-blue transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90 rounded-sm ${className}`}
    >
      {email}
    </a>
  )
}
