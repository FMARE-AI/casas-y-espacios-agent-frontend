import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  format,
  parseISO,
  isToday,
  isYesterday,
  startOfDay,
  subDays,
} from 'date-fns'
import { conversationsService } from '../services/conversations'
import type { Conversation } from '../types'

// intent exists in the backend response but is not yet declared in types/index.ts
type ConvRow = Conversation & { intent?: string }

// ── Helpers ───────────────────────────────────────────────

function formatClosedDate(iso: string): string {
  const date = parseISO(iso)
  if (isToday(date)) return `Hoy, ${format(date, 'hh:mm aa')}`
  if (isYesterday(date)) return `Ayer, ${format(date, 'hh:mm aa')}`
  return format(date, 'dd/MM/yyyy')
}

const CHANNEL_CHIP: Record<string, string> = {
  comercial: 'bg-[#01A4E3]/10 text-[#01A4E3]',
  administrativa: 'bg-[#00D4AA]/10 text-[#00D4AA]',
}

function channelLabel(channel: string): string {
  return channel.charAt(0).toUpperCase() + channel.slice(1)
}

// ── Skeleton ──────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="w-full bg-[#252522] border border-[#3A3A37] rounded-xl overflow-hidden animate-pulse">
      <div className="h-10 bg-[#2E2E2B]/60 border-b border-[#3A3A37]" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-[#3A3A37] last:border-0">
          <div className="h-3 bg-[#2E2E2B] rounded w-32" />
          <div className="h-3 bg-[#2E2E2B] rounded w-20" />
          <div className="h-3 bg-[#2E2E2B] rounded w-24" />
          <div className="h-3 bg-[#2E2E2B] rounded flex-1" />
          <div className="h-3 bg-[#2E2E2B] rounded w-24" />
          <div className="h-3 bg-[#2E2E2B] rounded w-14" />
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

export default function HistorialPage() {
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<ConvRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchText, setSearchText] = useState('')
  const [lineFilter, setLineFilter] = useState<string>('todos')
  const [dateFilter, setDateFilter] = useState<string>('todos')

  useEffect(() => {
    conversationsService
      .list({ status: 'cerrada', limit: 100, offset: 0 })
      .then((result) => {
        setConversations(result.conversations as ConvRow[])
      })
      .catch(() => {
        // silently fail — table stays empty
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      if (searchText) {
        const search = searchText.toLowerCase()
        const matchesName = conv.client.full_name?.toLowerCase().includes(search) ?? false
        const matchesDoc = conv.client.document_id?.toLowerCase().includes(search) ?? false
        if (!matchesName && !matchesDoc) return false
      }

      if (lineFilter !== 'todos') {
        if (conv.channel !== lineFilter.toLowerCase()) return false
      }

      if (dateFilter !== 'todos') {
        const lastActivity = parseISO(conv.last_activity)
        const today = startOfDay(new Date())
        if (dateFilter === 'hoy') {
          if (!isToday(lastActivity)) return false
        }
        if (dateFilter === 'semana') {
          const sevenDaysAgo = subDays(today, 7)
          if (lastActivity < sevenDaysAgo) return false
        }
      }

      return true
    })
  }, [conversations, searchText, lineFilter, dateFilter])

  function exportCSV() {
    const headers = ['Cliente', 'Cédula', 'Canal', 'Fecha de cierre', 'Motivo', 'Resolutor']
    const rows = filteredConversations.map((conv) => [
      conv.client.full_name ?? '',
      conv.client.document_id ?? '',
      conv.channel,
      format(parseISO(conv.last_activity), 'dd/MM/yyyy HH:mm'),
      conv.intent ?? '',
      conv.escalation?.advisor?.full_name ?? 'Bot',
    ])
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historial_${format(new Date(), 'yyyyMMdd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section
      id="screen-historial"
      className="flex-1 flex flex-col p-4 md:p-6 space-y-4"
    >
      {/* ── Header ── */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A3A37] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Historial de Conversaciones Cerradas
          </h2>
          <p className="text-xs text-[#8B8FA8]">
            Busca, audita y analiza transcripciones de requerimientos finalizados
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="bg-[#2E2E2B] hover:bg-[#3A3A37] border border-[#3A3A37] text-[#F0F0F5] px-4 py-2.5 h-11 rounded text-xs font-semibold flex items-center gap-2 transition active:scale-95"
        >
          <svg
            className="w-4 h-4 text-[#00D4AA]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* ── Filter panel ── */}
      <div className="w-full bg-[#252522] p-4 border border-[#3A3A37] rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
        <div className="relative sm:col-span-2">
          <input
            id="history-search-input"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar por cliente, cédula..."
            className="w-full bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded-lg pl-8 pr-3 py-2 outline-none focus:border-[#01A4E3] transition"
          />
          <svg
            className="w-4 h-4 text-[#8B8FA8] absolute left-2.5 top-2.5 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <select
          id="history-filter-line"
          value={lineFilter}
          onChange={(e) => setLineFilter(e.target.value)}
          className="w-full bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded-lg p-2 outline-none focus:border-[#01A4E3] transition"
        >
          <option value="todos">Todas las Líneas</option>
          <option value="Comercial">Comercial</option>
          <option value="Administrativa">Administrativa</option>
        </select>

        <select
          id="history-filter-date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full bg-[#2E2E2B] border border-[#3A3A37] text-[#F0F0F5] text-xs rounded-lg p-2 outline-none focus:border-[#01A4E3] transition"
        >
          <option value="todos">Cualquier Fecha</option>
          <option value="hoy">Hoy</option>
          <option value="semana">Últimos 7 días</option>
        </select>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="w-full bg-[#252522] border border-[#3A3A37] rounded-xl overflow-x-auto">
          <table
            id="history-table"
            className="w-full text-left text-xs text-[#F0F0F5]"
          >
            <thead className="bg-[#2E2E2B]/60 border-b border-[#3A3A37] text-[#8B8FA8] uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4 whitespace-nowrap">Cliente</th>
                <th className="p-4 whitespace-nowrap">Línea</th>
                <th className="p-4 whitespace-nowrap">Fecha de Cierre</th>
                <th className="p-4 whitespace-nowrap">Motivo / Resolución</th>
                <th className="p-4 whitespace-nowrap">Resolutor</th>
                <th className="p-4 text-center whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody id="history-table-body" className="divide-y divide-[#3A3A37]">
              {filteredConversations.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="text-center py-12">
                      <p className="text-[#8B8FA8] text-sm">
                        No se encontraron conversaciones cerradas
                        {searchText && ` para "${searchText}"`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredConversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-[#2E2E2B]/30 transition">
                    <td
                      className="p-4 font-bold text-white whitespace-nowrap truncate max-w-[150px]"
                      title={conv.client.full_name ?? undefined}
                    >
                      {conv.client.full_name ?? '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={[
                          'text-[9px] px-2 py-0.5 rounded font-black uppercase',
                          CHANNEL_CHIP[conv.channel] ?? 'bg-[#3A3A37] text-[#8B8FA8]',
                        ].join(' ')}
                      >
                        {channelLabel(conv.channel)}
                      </span>
                    </td>
                    <td className="p-4 text-[#8B8FA8] whitespace-nowrap">
                      {formatClosedDate(conv.last_activity)}
                    </td>
                    <td className="p-4 italic text-zinc-300 max-w-[200px] truncate">
                      {conv.intent ?? '—'}
                    </td>
                    <td className="p-4 text-[#00D4AA] font-bold whitespace-nowrap">
                      {conv.escalation?.advisor?.full_name ?? 'Bot'}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/chat/${conv.id}`, { state: { readonly: true } })
                        }
                        className="text-[#01A4E3] hover:underline font-bold px-2 py-1"
                      >
                        Auditar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
