import React from 'react'
import type { Advisor } from '../../types'
import { Edit2 } from 'lucide-react'

interface AdvisorsTableProps {
  advisors: Advisor[]
  isLoading: boolean
  onEdit: (advisor: Advisor) => void
  onToggleActive: (advisor: Advisor, newValue: boolean) => void
}

const roleChipStyles = {
  asesor: 'bg-[#01A4E3]/10 text-[#01A4E3] border border-[#01A4E3]/20',
  admin:  'bg-[#FF5B5B]/10 text-[#FF5B5B] border border-[#FF5B5B]/20',
}

const areaChipStyles = {
  administrativa: 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20',
  comercial:      'bg-[#01A4E3]/10 text-[#01A4E3] border border-[#01A4E3]/20',
  ambas:          'bg-[#01A4E3]/10 text-[#01A4E3] border border-[#01A4E3]/20',
}

export const AdvisorsTable: React.FC<AdvisorsTableProps> = ({
  advisors,
  isLoading,
  onEdit,
  onToggleActive,
}) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    if (parts.length === 1 && parts[0]) {
      return parts[0].substring(0, 2).toUpperCase()
    }
    return '??'
  }

  const handleToggleChange = (advisor: Advisor, e: React.ChangeEvent<HTMLInputElement>) => {
    const targetChecked = e.target.checked
    onToggleActive(advisor, targetChecked)
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[#3A3A37] bg-[#252522]/60 backdrop-blur-md">
      <table id="advisors-table" className="w-full min-w-[700px] border-collapse text-left text-sm text-[#F0F0F5]">
        <thead>
          <tr className="border-b border-[#3A3A37] bg-[#2E2E2B]/50 text-xs font-semibold uppercase tracking-wider text-[#8B8FA8]">
            <th className="px-6 py-4">Nombre</th>
            <th className="px-6 py-4">Rol</th>
            <th className="px-6 py-4">Área</th>
            <th className="px-6 py-4">Límite Conv.</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#3A3A37]">
          {isLoading ? (
            // Skeleton Loader (3 rows with animate-pulse)
            Array.from({ length: 3 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-[#2E2E2B]" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-[#2E2E2B]" />
                      <div className="h-3 w-40 rounded bg-[#2E2E2B]" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-16 rounded bg-[#2E2E2B]" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-24 rounded bg-[#2E2E2B]" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-12 rounded bg-[#2E2E2B]" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-10 rounded bg-[#2E2E2B]" />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="ml-auto h-8 w-16 rounded bg-[#2E2E2B]" />
                </td>
              </tr>
            ))
          ) : advisors.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-[#8B8FA8]">
                No se encontraron asesores con los filtros aplicados.
              </td>
            </tr>
          ) : (
            advisors.map((advisor) => (
              <tr
                key={advisor.id}
                className="transition-colors duration-150 hover:bg-[#2E2E2B]/35"
              >
                {/* Nombre */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#2E2E2B] text-xs font-semibold text-white">
                      {getInitials(advisor.full_name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate max-w-[150px] font-bold text-[#F0F0F5]" title={advisor.full_name}>
                        {advisor.full_name}
                      </span>
                      <span className="truncate max-w-[180px] text-xs text-[#8B8FA8]" title={advisor.email}>
                        {advisor.email}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Rol */}
                <td className="px-6 py-4 align-middle">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${
                      roleChipStyles[advisor.role] || ''
                    }`}
                  >
                    {advisor.role}
                  </span>
                </td>

                {/* Área */}
                <td className="px-6 py-4 align-middle">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${
                      areaChipStyles[advisor.area] || ''
                    }`}
                  >
                    {advisor.area}
                  </span>
                </td>

                {/* Límite Conv. */}
                <td className="px-6 py-4 align-middle font-medium">
                  <span className="text-white font-bold">{advisor.max_conversations}</span>
                  <span className="text-[#8B8FA8] text-xs font-normal"> máx.</span>
                </td>

                {/* Estado */}
                <td className="px-6 py-4 align-middle">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={advisor.is_active}
                      onChange={(e) => handleToggleChange(advisor, e)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-[#2E2E2B] border border-[#3A3A37] transition-colors duration-200 peer-checked:bg-[#01A4E3] peer-checked:border-[#01A4E3] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:duration-200 peer-checked:after:translate-x-4"></div>
                  </label>
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 text-right align-middle">
                  <button
                    onClick={() => onEdit(advisor)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#01A4E3] hover:text-[#01A4E3]/80 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Editar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
