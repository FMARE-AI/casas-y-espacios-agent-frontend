import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  parseISO,
  isToday,
  isYesterday,
  startOfDay,
  subDays,
} from "date-fns";
import { conversationsService } from "../services/conversations";
import { CaseNumberTag } from "../components/shared/CaseNumberTag";
import type { Conversation } from "../types";

// intent exists in the backend response but is not yet declared in types/index.ts
type ConvRow = Conversation & { intent?: string };

// ── Helpers ───────────────────────────────────────────────

// TODO: The backend has a known bug where closed_at can return null
// even if the conversation is closed. last_activity is used as the fallback.
function formatClosedDate(iso: string): string {
  const date = parseISO(iso);
  if (isToday(date)) return `Hoy, ${format(date, "hh:mm aa")}`;
  if (isYesterday(date)) return `Ayer, ${format(date, "hh:mm aa")}`;
  return format(date, "dd/MM/yyyy");
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return `${hours} h ${remainingMinutes} min`;
  const days = Math.floor(hours / 24);
  return `${days} día${days === 1 ? "" : "s"}`;
}

const CHANNEL_CHIP: Record<string, string> = {
  comercial: "bg-brand-blue/10 text-brand-blue",
  administrativa: "bg-success/10 text-success",
};

function channelLabel(channel: string): string {
  return channel.charAt(0).toUpperCase() + channel.slice(1);
}

// closed_by_advisor is null for bot closures and for historical
// closures that could not be backfilled — fall back to "Asesor".
function resolutorLabel(conv: Conversation): string | null {
  if (conv.closed_by === "bot") return "Bot";
  if (conv.closed_by === "asesor") {
    return conv.closed_by_advisor?.full_name ?? "Asesor";
  }
  return null;
}

// ── Skeleton ──────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="w-full bg-bg-secondary border border-border-default rounded-xl overflow-hidden animate-pulse">
      <div className="h-10 bg-bg-tertiary/60 border-b border-border-default" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex gap-4 p-4 border-b border-border-default last:border-0"
        >
          <div className="h-3 bg-bg-tertiary rounded w-32" />
          <div className="h-3 bg-bg-tertiary rounded w-20" />
          <div className="h-3 bg-bg-tertiary rounded w-24" />
          <div className="h-3 bg-bg-tertiary rounded flex-1" />
          <div className="h-3 bg-bg-tertiary rounded w-24" />
          <div className="h-3 bg-bg-tertiary rounded w-14" />
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function HistorialPage() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [lineFilter, setLineFilter] = useState<string>("todos");
  const [dateFilter, setDateFilter] = useState<string>("todos");

  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>(
    {},
  );

  const toggleNote = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    conversationsService
      .list({ status: "cerrada", limit: 100, offset: 0 })
      .then((result) => {
        setConversations(result.conversations as ConvRow[]);
      })
      .catch(() => {
        // silently fail — table stays empty
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      if (searchText) {
        const search = searchText.toLowerCase();
        const matchesName =
          conv.client.full_name?.toLowerCase().includes(search) ?? false;
        const matchesDoc =
          conv.client.document_id?.toLowerCase().includes(search) ?? false;
        if (!matchesName && !matchesDoc) return false;
      }

      if (lineFilter !== "todos") {
        if (conv.channel !== lineFilter.toLowerCase()) return false;
      }

      if (dateFilter !== "todos") {
        const closedDateStr = conv.closed_at ?? conv.last_activity;
        const lastActivity = parseISO(closedDateStr);
        const today = startOfDay(new Date());
        if (dateFilter === "hoy") {
          if (!isToday(lastActivity)) return false;
        }
        if (dateFilter === "semana") {
          const sevenDaysAgo = subDays(today, 7);
          if (lastActivity < sevenDaysAgo) return false;
        }
      }

      return true;
    });
  }, [conversations, searchText, lineFilter, dateFilter]);

  function exportCSV() {
    const headers = [
      "N° de Caso",
      "Cliente",
      "Cédula",
      "Línea",
      "Fecha de Cierre",
      "Notas de resolución",
      "Resolutor",
      "Cliente satisfecho",
    ];
    const rows = filteredConversations.map((conv) => {
      const closedDateStr = conv.closed_at ?? conv.last_activity;
      let formattedDate = "—";
      if (closedDateStr) {
        try {
          formattedDate = format(parseISO(closedDateStr), "dd/MM/yyyy HH:mm");
        } catch {
          formattedDate = "—";
        }
      }

      const resolutor = resolutorLabel(conv) ?? "—";

      let satisfaccion = "Sin confirmar";
      if (conv.client_satisfied === "si") satisfaccion = "Sí";
      if (conv.client_satisfied === "no") satisfaccion = "No";

      return [
        conv.case_number ?? "—",
        conv.client.full_name ?? "Sin identificar",
        conv.client.document_id ?? "—",
        channelLabel(conv.channel),
        formattedDate,
        conv.resolution_notes ?? "Sin notas",
        resolutor,
        satisfaccion,
      ];
    });
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historial_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      id="screen-historial"
      className="flex-1 flex flex-col p-4 md:p-6 space-y-4"
    >
      {/* ── Header ── */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-4">
        <div>
          <h2 className="text-h2 text-text-primary">
            Historial de Conversaciones Cerradas
          </h2>
          <p className="text-xs text-text-secondary">
            Busca, audita y analiza transcripciones de requerimientos
            finalizados
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="bg-bg-tertiary hover:bg-border-default border border-border-default text-text-primary px-4 py-2.5 h-11 rounded-control text-xs font-semibold flex items-center gap-2 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
        >
          <svg
            className="w-4 h-4 text-success"
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
      <div className="w-full bg-bg-secondary p-4 border border-border-default rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
        <div className="relative sm:col-span-2">
          <input
            id="history-search-input"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar por cliente, cédula..."
            className="w-full bg-bg-tertiary border border-border-default text-text-primary text-xs rounded-lg pl-8 pr-3 py-2 outline-none focus:border-brand-blue transition"
          />
          <svg
            className="w-4 h-4 text-text-secondary absolute left-2.5 top-2.5 pointer-events-none"
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
          className="w-full bg-bg-tertiary border border-border-default text-text-primary text-xs rounded-lg p-2 outline-none focus:border-brand-blue transition"
        >
          <option value="todos">Todas las Líneas</option>
          <option value="Comercial">Comercial</option>
          <option value="Administrativa">Administrativa</option>
        </select>

        <select
          id="history-filter-date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full bg-bg-tertiary border border-border-default text-text-primary text-xs rounded-lg p-2 outline-none focus:border-brand-blue transition"
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
        <div className="w-full bg-bg-secondary border border-border-default rounded-xl overflow-x-auto">
          <table
            id="history-table"
            className="w-full text-left text-xs text-text-primary"
          >
            <thead className="bg-bg-tertiary/60 border-b border-border-default text-text-secondary text-label uppercase">
              <tr>
                <th className="p-4 whitespace-nowrap">N° de Caso</th>
                <th className="p-4 whitespace-nowrap">Cliente</th>
                <th className="p-4 whitespace-nowrap">Línea</th>
                <th className="p-4 whitespace-nowrap">Fecha de Cierre</th>
                <th className="p-4 whitespace-nowrap">Duración</th>
                <th className="p-4 whitespace-nowrap">Notas de resolución</th>
                <th className="p-4 whitespace-nowrap">Resolutor</th>
                <th className="p-4 whitespace-nowrap text-center">
                  ¿El cliente está satisfecho?
                </th>
                <th className="p-4 text-center whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody
              id="history-table-body"
              className="divide-y divide-border-default"
            >
              {filteredConversations.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="text-center py-12">
                      <p className="text-text-secondary text-sm">
                        No se encontraron conversaciones cerradas
                        {searchText && ` para "${searchText}"`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredConversations.map((conv) => (
                  <tr
                    key={conv.id}
                    className="hover:bg-bg-tertiary/30 transition"
                  >
                    <td className="p-4 whitespace-nowrap">
                      <CaseNumberTag caseNumber={conv.case_number} className="text-xs" />
                    </td>
                    <td
                      className="p-4 font-bold text-white whitespace-nowrap truncate max-w-[150px]"
                      title={conv.client.full_name ?? "Cliente no autenticado"}
                    >
                      {conv.client.full_name ?? (
                        <span className="text-text-secondary font-medium italic">
                          Sin identificar
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={[
                          "text-[9px] px-2 py-0.5 rounded font-black uppercase",
                          CHANNEL_CHIP[conv.channel] ??
                            "bg-border-default text-text-secondary",
                        ].join(" ")}
                      >
                        {channelLabel(conv.channel)}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary whitespace-nowrap">
                      {formatClosedDate(conv.closed_at ?? conv.last_activity)}
                    </td>
                    <td className="p-4 text-text-secondary whitespace-nowrap">
                      {formatDuration(conv.duration_seconds)}
                    </td>
                    <td className="p-4 max-w-[250px] min-w-[200px]">
                      {conv.resolution_notes ? (
                        <div
                          className="cursor-pointer text-xs text-text-primary hover:underline break-words"
                          title={conv.resolution_notes}
                          onClick={() => toggleNote(conv.id)}
                        >
                          {expandedNotes[conv.id]
                            ? conv.resolution_notes
                            : conv.resolution_notes.length > 60
                              ? conv.resolution_notes.slice(0, 60) + "..."
                              : conv.resolution_notes}
                        </div>
                      ) : (
                        <span className="text-xs text-text-secondary italic">
                          Sin notas
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold whitespace-nowrap">
                      {conv.closed_by === "bot" ? (
                        <span className="text-success text-xs font-semibold">
                          Bot
                        </span>
                      ) : conv.closed_by === "asesor" ? (
                        <span
                          className="text-text-primary text-xs font-semibold truncate max-w-[140px] inline-block align-bottom"
                          title={resolutorLabel(conv) ?? undefined}
                        >
                          {resolutorLabel(conv)}
                        </span>
                      ) : (
                        <span className="text-text-secondary text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      {conv.client_satisfied === "si" ? (
                        <span className="inline-block text-[10px] px-2.5 py-1 rounded-full font-bold uppercase bg-success/15 text-success">
                          Sí
                        </span>
                      ) : conv.client_satisfied === "no" ? (
                        <span className="inline-block text-[10px] px-2.5 py-1 rounded-full font-bold uppercase bg-error/15 text-error">
                          No
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] px-2.5 py-1 rounded-full font-bold uppercase bg-border-default text-text-secondary">
                          Sin confirmar
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/chat/${conv.id}`, {
                            state: { readonly: true },
                          })
                        }
                        className="text-brand-blue hover:underline font-bold px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90 transition"
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
  );
}
