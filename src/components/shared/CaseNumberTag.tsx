import { useState } from 'react'

interface CaseNumberTagProps {
  caseNumber: string | null
  className?: string
}

// case_number is null for conversations created before this field was deployed — render "—", never an error.
export function CaseNumberTag({ caseNumber, className = '' }: CaseNumberTagProps) {
  const [copied, setCopied] = useState(false)

  if (!caseNumber) {
    return <span className={`font-mono text-text-secondary ${className}`}>—</span>
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caseNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard write can reject in insecure contexts or on denied permission — non-critical, fail silently.
    }
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={handleCopy}
        title="Copiar número de caso"
        className={`font-mono text-text-secondary hover:text-text-primary transition cursor-pointer ${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90`}
      >
        {caseNumber}
      </button>
      {copied && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-bg-main border border-border-default text-success text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-50 shadow-md pointer-events-none">
          Copiado
        </span>
      )}
    </span>
  )
}
