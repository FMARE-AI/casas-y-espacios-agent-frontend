import React from 'react'
import type { Advisor } from '../../types'
import { Edit2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface AdvisorsTableProps {
  advisors: Advisor[]
  isLoading: boolean
  onEdit: (advisor: Advisor) => void
  onToggleActive: (advisor: Advisor, newValue: boolean) => void
}

const roleChipStyles = {
  asesor: 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20',
  admin:  'bg-error/10 text-error border border-error/20',
}

const areaChipStyles = {
  administrativa: 'bg-success/10 text-success border border-success/20',
  comercial:      'bg-brand-blue/10 text-brand-blue border border-brand-blue/20',
  ambas:          'bg-brand-blue/10 text-brand-blue border border-brand-blue/20',
}

export const AdvisorsTable: React.FC<AdvisorsTableProps> = ({
  advisors,
  isLoading,
  onEdit,
  onToggleActive,
}) => {
  const currentAdvisor = useAuthStore((state) => state.advisor)

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
    <div className="w-full overflow-x-auto rounded-lg border border-border-default bg-bg-secondary/60 backdrop-blur-md">
      <table id="advisors-table" className="w-full min-w-[700px] border-collapse text-left text-sm text-text-primary">
        <thead>
          <tr className="border-b border-border-default bg-bg-tertiary/50 text-label text-text-secondary uppercase">
            <th className="px-6 py-4">Nombre</th>
            <th className="px-6 py-4">Rol</th>
            <th className="px-6 py-4">Área</th>
            <th className="px-6 py-4">Límite Conv.</th>
            <th className="px-6 py-4">Conv. Activas</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {isLoading ? (
            // Skeleton Loader (3 rows with animate-pulse)
            Array.from({ length: 3 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-bg-tertiary" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-bg-tertiary" />
                      <div className="h-3 w-40 rounded bg-bg-tertiary" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-16 rounded bg-bg-tertiary" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-24 rounded bg-bg-tertiary" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-12 rounded bg-bg-tertiary" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-12 rounded bg-bg-tertiary" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-10 rounded bg-bg-tertiary" />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="ml-auto h-8 w-16 rounded bg-bg-tertiary" />
                </td>
              </tr>
            ))
          ) : advisors.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-10 text-center text-text-secondary">
                No se encontraron asesores con los filtros aplicados.
              </td>
            </tr>
          ) : (
            advisors.map((advisor) => (
              <tr
                key={advisor.id}
                className="transition-colors duration-150 hover:bg-bg-tertiary/35"
              >
                {/* Nombre */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-bg-tertiary text-xs font-semibold text-white">
                      {getInitials(advisor.full_name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate max-w-[150px] font-bold text-text-primary" title={advisor.full_name}>
                        {advisor.full_name}
                      </span>
                      <span className="truncate max-w-[180px] text-xs text-text-secondary" title={advisor.email}>
                        {advisor.email}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Rol */}
                <td className="px-6 py-4 align-middle">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-label uppercase ${
                      roleChipStyles[advisor.role] || ''
                    }`}
                  >
                    {advisor.role}
                  </span>
                </td>

                {/* Área */}
                <td className="px-6 py-4 align-middle">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-label uppercase ${
                      areaChipStyles[advisor.area] || ''
                    }`}
                  >
                    {advisor.area}
                  </span>
                </td>

                {/* Límite Conv. */}
                <td className="px-6 py-4 align-middle font-medium">
                  <span className="text-white font-bold">{advisor.max_conversations}</span>
                  <span className="text-text-secondary text-xs font-normal"> máx.</span>
                </td>

                {/* Conv. Activas */}
                <td className="px-6 py-4 align-middle font-medium">
                  <span className="text-white font-bold">{advisor.active_conversations}</span>
                  <span className="text-text-secondary text-xs font-normal"> activas</span>
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
                    <div className="h-5 w-9 rounded-full bg-bg-tertiary border border-border-default transition-colors duration-200 peer-checked:bg-brand-blue peer-checked:border-brand-blue after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:duration-200 peer-checked:after:translate-x-4"></div>
                  </label>
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 text-right align-middle">
                  {/* Doble protección */}
                  {advisor.id !== currentAdvisor?.id && (
                    <button
                      onClick={() => onEdit(advisor)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:text-brand-blue/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
