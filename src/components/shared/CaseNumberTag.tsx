import { useState } from 'react'

interface CaseNumberTagProps {
  caseNumber: string | null
  className?: string
}

// case_number is null for conversations created before this field was deployed — render "—", never an error.
export function CaseNumberTag({ caseNumber, className = '' }: CaseNumberTagProps) {
  const [copied, setCopied] = useState(false)

  if (!caseNumber) {
    return <span className={`font-mono text-[#8B8FA8] ${className}`}>—</span>
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
        className={`font-mono text-[#8B8FA8] hover:text-[#F0F0F5] transition cursor-pointer ${className}`}
      >
        {caseNumber}
      </button>
      {copied && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#1D1D1B] border border-[#3A3A37] text-[#00D4AA] text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-50 shadow-md pointer-events-none">
          Copiado
        </span>
      )}
    </span>
  )
}
