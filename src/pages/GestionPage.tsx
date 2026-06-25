import React, { useState, useEffect, useMemo } from 'react'
import { advisorsService } from '../services/advisors'
import type { Advisor } from '../types'
import { AdvisorsTable } from '../components/management/AdvisorsTable'
import { AdvisorModal } from '../components/management/AdvisorModal'
import BehaviorAlertsPanel from '../components/gestion/BehaviorAlertsPanel'
import { Plus, Search, AlertTriangle, Shield } from 'lucide-react'
import { toast } from 'sonner'

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; advisor: Advisor }
  | { type: 'deactivate'; advisor: Advisor }

interface AdvisorSubmitData {
  fullName: string
  email?: string
  password?: string
  role: 'asesor' | 'admin'
  area: 'administrativa' | 'comercial' | 'ambas'
  specialty: string | null
  maxConversations: number
}

interface ApiErrorResponse {
  response?: {
    data?: {
      detail?: {
        code?: string
        message?: string
      } | string
    }
  }
  message?: string
}

function extractErrorCode(error: unknown): string | undefined {
  const err = error as ApiErrorResponse
  const detail = err.response?.data?.detail
  if (typeof detail === 'object' && detail !== null) return detail.code
  return undefined
}

export const GestionPage: React.FC = () => {
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('todos')
  const [areaFilter, setAreaFilter] = useState<string>('todos')

  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState<string | undefined>()

  useEffect(() => {
    loadAdvisors()
  }, [])

  async function loadAdvisors() {
    setIsLoading(true)
    try {
      const { advisors: fetched } = await advisorsService.list()
      setAdvisors(fetched)
    } catch (err: unknown) {
      const isNetworkError =
        err instanceof Error &&
        (err.message.includes('Network Error') || err.message.includes('ERR_CONNECTION_REFUSED'))
      if (!isNetworkError) {
        toast.error('Error al cargar la lista de asesores.')
      }
      setAdvisors([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAdvisors = useMemo(() => {
    return advisors.filter((advisor) => {
      if (searchText) {
        const search = searchText.toLowerCase()
        if (
          !advisor.full_name.toLowerCase().includes(search) &&
          !advisor.email.toLowerCase().includes(search)
        )
          return false
      }
      if (roleFilter !== 'todos' && advisor.role !== roleFilter) return false
      if (areaFilter !== 'todos' && advisor.area !== areaFilter.toLowerCase()) return false
      return true
    })
  }, [advisors, searchText, roleFilter, areaFilter])

  async function handleCreate(data: AdvisorSubmitData) {
    setIsSaving(true)
    setModalError(undefined)
    try {
      await advisorsService.create({
        email: data.email ?? '',
        password: data.password ?? '',
        full_name: data.fullName,
        role: data.role,
        area: data.area,
        specialty: data.specialty || null,
        max_conversations: data.maxConversations,
      })
      toast.success('Asesor operativo creado con éxito.')
      setModal({ type: 'none' })
      await loadAdvisors()
    } catch (error: unknown) {
      const code = extractErrorCode(error)
      if (code === 'EMAIL_ALREADY_EXISTS') {
        setModalError('EMAIL_ALREADY_EXISTS')
      } else {
        const err = error as ApiErrorResponse
        setModalError(err.message ?? 'Error inesperado al crear el asesor.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleEdit(advisorId: string, data: AdvisorSubmitData) {
    setIsSaving(true)
    setModalError(undefined)
    try {
      await advisorsService.update(advisorId, {
        full_name: data.fullName,
        role: data.role,
        area: data.area,
        specialty: data.specialty || null,
        max_conversations: data.maxConversations,
      })
      toast.success('Perfil de asesor actualizado.')
      setModal({ type: 'none' })
      await loadAdvisors()
    } catch (error: unknown) {
      const code = extractErrorCode(error)
      if (code === 'INVALID_SPECIALTY_FOR_AREA') {
        setModalError('INVALID_SPECIALTY_FOR_AREA')
      } else if (code === 'ADVISOR_NOT_FOUND') {
        toast.error('El asesor no fue encontrado. Puede haber sido eliminado.')
        setModal({ type: 'none' })
      } else {
        const err = error as ApiErrorResponse
        setModalError(err.message ?? 'Error inesperado al actualizar el asesor.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeactivate(advisorId: string) {
    setIsSaving(true)
    try {
      const result = await advisorsService.update(advisorId, { is_active: false })
      if (result.warning) {
        toast.warning(result.warning)
      } else {
        toast.success('El asesor ha sido desactivado.')
      }
      setModal({ type: 'none' })
      await loadAdvisors()
    } catch (error: unknown) {
      const code = extractErrorCode(error)
      if (code === 'ALREADY_ASSIGNED') {
        toast.error('No se pudo desactivar: el asesor tiene conversaciones asignadas en curso.')
      } else {
        toast.error('Error al desactivar el asesor.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleActivate(advisorId: string) {
    try {
      await advisorsService.update(advisorId, { is_active: true })
      toast.success('El asesor ha sido activado.')
      await loadAdvisors()
    } catch {
      toast.error('Error al activar el asesor.')
    }
  }

  const handleToggleActive = (advisor: Advisor, newValue: boolean) => {
    if (!newValue) {
      setModal({ type: 'deactivate', advisor })
    } else {
      handleActivate(advisor.id)
    }
  }

  return (
    <div id="screen-gestion" className="flex flex-col gap-6 p-6 min-h-screen bg-[#1D1D1B] text-[#F0F0F5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3A3A37] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F0F5]">Gestión de Asesores Operativos</h1>
          <p className="text-sm text-[#8B8FA8] mt-1">Configura accesos, permisos y áreas del panel interno.</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            id="mgmt-admin-only-badge"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FF5B5B]/15 px-3 py-1 text-xs font-semibold text-[#FF5B5B] border border-[#FF5B5B]/25"
          >
            <Shield className="h-3 w-3" />
            🔑 ADMIN
          </span>
          <button
            onClick={() => {
              setModalError(undefined)
              setModal({ type: 'create' })
            }}
            className="inline-flex items-center gap-2 rounded-md bg-[#01A4E3] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#01A4E3]/90 active:bg-[#01A4E3]/95 transition-all shadow-md"
          >
            <Plus className="h-4 w-4" />
            Crear Nuevo
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#3A3A37] bg-[#252522]/60 p-4 backdrop-blur-md">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8B8FA8]" />
          <input
            id="advisor-search"
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-md border border-[#3A3A37] bg-[#2E2E2B] py-2 pl-9 pr-4 text-sm text-[#F0F0F5] placeholder-[#8B8FA8]/40 outline-none transition-all focus:border-[#01A4E3]"
          />
        </div>

        <div className="w-[180px]">
          <select
            id="filter-advisor-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-md border border-[#3A3A37] bg-[#2E2E2B] px-3 py-2 text-sm text-[#F0F0F5] outline-none transition-all focus:border-[#01A4E3]"
          >
            <option value="todos">Todos los Roles</option>
            <option value="asesor">Asesor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div className="w-[180px]">
          <select
            id="filter-advisor-area"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="w-full rounded-md border border-[#3A3A37] bg-[#2E2E2B] px-3 py-2 text-sm text-[#F0F0F5] outline-none transition-all focus:border-[#01A4E3]"
          >
            <option value="todos">Todas las Áreas</option>
            <option value="administrativa">Administrativa</option>
            <option value="comercial">Comercial</option>
            <option value="ambas">Ambas Áreas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <AdvisorsTable
        advisors={filteredAdvisors}
        isLoading={isLoading}
        onEdit={(advisor) => {
          setModalError(undefined)
          setModal({ type: 'edit', advisor })
        }}
        onToggleActive={handleToggleActive}
      />

      {/* Behavior alerts */}
      <div className="border-t border-[#3A3A37]" />
      <BehaviorAlertsPanel advisors={advisors} />

      {/* Create / Edit modal */}
      {(modal.type === 'create' || modal.type === 'edit') && (
        <AdvisorModal
          mode={modal.type}
          advisor={modal.type === 'edit' ? modal.advisor : undefined}
          onSubmit={
            modal.type === 'edit'
              ? (data) => handleEdit(modal.advisor.id, data)
              : handleCreate
          }
          onClose={() => setModal({ type: 'none' })}
          isSaving={isSaving}
          error={modalError}
        />
      )}

      {/* Deactivate confirmation modal */}
      {modal.type === 'deactivate' && (
        <DeactivateModal
          advisor={modal.advisor}
          onConfirm={() => handleDeactivate(modal.advisor.id)}
          onCancel={() => setModal({ type: 'none' })}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}

interface DeactivateModalProps {
  advisor: Advisor
  onConfirm: () => void
  onCancel: () => void
  isSaving: boolean
}

const DeactivateModal: React.FC<DeactivateModalProps> = ({ advisor, onConfirm, onCancel, isSaving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="fixed inset-0 bg-[#1D1D1B]/75 backdrop-blur-sm transition-opacity"
      onClick={onCancel}
    />
    <div
      id="modal-deactivate-warning"
      className="relative z-10 w-full max-w-md overflow-hidden rounded-lg border border-[#3A3A37] bg-[#252522] p-6 text-[#F0F0F5] shadow-xl transition-all"
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFB84D]/15 text-[#FFB84D] border border-[#FFB84D]/25 mb-4 animate-pulse">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-[#F0F0F5] mb-2">
          ¿Desactivar a {advisor.full_name}?
        </h3>
        <p className="text-sm text-[#8B8FA8] leading-relaxed mb-6">
          Al desactivar a este asesor, quedará sin acceso al panel. Las conversaciones activas asignadas quedarán sin asesor.
        </p>
        <div className="flex w-full flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={isSaving}
            className="w-full rounded-md bg-[#FF5B5B] py-2.5 text-sm font-semibold text-white hover:bg-[#FF5B5B]/90 active:bg-[#FF5B5B]/95 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Desactivar de todas formas
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="w-full rounded-md border border-[#3A3A37] bg-transparent py-2.5 text-sm font-semibold text-[#F0F0F5] hover:bg-[#2E2E2B] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
)

export default GestionPage
