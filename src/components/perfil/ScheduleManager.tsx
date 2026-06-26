import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { schedulesService, getScheduleErrorCode } from "../../services/schedules";
import type { AdvisorSchedule } from "../../types";

// ── Constants ─────────────────────────────────────────────

const DAYS = [
  { value: 1, label: "L", full: "Lunes" },
  { value: 2, label: "M", full: "Martes" },
  { value: 3, label: "X", full: "Miércoles" },
  { value: 4, label: "J", full: "Jueves" },
  { value: 5, label: "V", full: "Viernes" },
  { value: 6, label: "S", full: "Sábado" },
  { value: 7, label: "D", full: "Domingo" },
];

// ── Form schema ───────────────────────────────────────────

const scheduleSchema = z
  .object({
    label: z.string().min(1, "Nombre requerido").max(50),
    startTime: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, "Formato inválido"),
    endTime: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, "Formato inválido"),
    daysOfWeek: z.array(z.number().min(1).max(7)).min(1, "Selecciona al menos un día"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "La hora de fin debe ser mayor que la de inicio",
    path: ["endTime"],
  });

type ScheduleFormData = z.infer<typeof scheduleSchema>;

// ── Skeleton ──────────────────────────────────────────────

function ScheduleSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[0, 1].map((i) => (
        <div key={i} className="bg-bg-tertiary/20 border border-border-default/50 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="h-4 bg-bg-tertiary/55 rounded w-28" />
                <div className="h-4 bg-bg-tertiary/55 rounded w-20" />
              </div>
              <div className="flex gap-1">
                {DAYS.map((d) => (
                  <div key={d.value} className="w-6 h-6 bg-bg-tertiary/55 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-5 bg-bg-tertiary/55 rounded-full" />
              <div className="w-5 h-5 bg-bg-tertiary/55 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Modal field ───────────────────────────────────────────

function ModalField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] text-text-secondary uppercase font-bold tracking-wider">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-error text-[10px] mt-0.5 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-error" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Add schedule modal ────────────────────────────────────

function ScheduleFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (schedule: AdvisorSchedule) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { label: "", startTime: "12:00", endTime: "13:00", daysOfWeek: [] },
  });

  async function onSubmit(data: ScheduleFormData) {
    setIsSubmitting(true);
    try {
      const { schedule } = await schedulesService.create({
        label: data.label,
        start_time: data.startTime,
        end_time: data.endTime,
        days_of_week: data.daysOfWeek,
      });
      onCreated(schedule);
    } catch (err) {
      const code = getScheduleErrorCode(err);
      if (code === "INVALID_TIME_RANGE") {
        setError("endTime", { message: "La hora de fin debe ser mayor que la de inicio" });
      } else if (code === "INVALID_DAYS") {
        setError("daysOfWeek", { message: "Días inválidos" });
      } else {
        toast.error("No se pudo guardar el intervalo");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      id="modal-add-schedule"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-bg-secondary border border-border-default/80 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-warning/5 flex items-center justify-center shrink-0 border border-warning/15">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Nuevo Intervalo</h3>
              <p className="text-[10px] text-text-secondary">Pausa de asignación programada</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-secondary hover:text-white hover:bg-bg-tertiary/40 border border-transparent transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Label */}
          <ModalField label="Nombre del intervalo" error={errors.label?.message}>
            <input
              type="text"
              placeholder="Ej: Almuerzo, Reunión de equipo…"
              {...register("label")}
              className="w-full bg-bg-tertiary/20 border border-border-default/80 focus:border-warning/70 focus:ring-2 focus:ring-warning/5 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all placeholder-text-secondary/30"
            />
          </ModalField>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Inicio" error={errors.startTime?.message}>
              <input
                type="time"
                {...register("startTime")}
                className="w-full bg-bg-tertiary/20 border border-border-default/80 focus:border-warning/70 focus:ring-2 focus:ring-warning/5 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </ModalField>
            <ModalField label="Fin" error={errors.endTime?.message}>
              <input
                type="time"
                {...register("endTime")}
                className="w-full bg-bg-tertiary/20 border border-border-default/80 focus:border-warning/70 focus:ring-2 focus:ring-warning/5 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </ModalField>
          </div>

          {/* Days */}
          <ModalField label="Días activos" error={errors.daysOfWeek?.message}>
            <Controller
              control={control}
              name="daysOfWeek"
              render={({ field }) => (
                <div className="flex gap-1 justify-between">
                  {DAYS.map((day) => {
                    const selected = field.value.includes(day.value);
                    return (
                      <label
                        key={day.value}
                        title={day.full}
                        className={[
                          "w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer",
                          "text-xs font-bold border transition-colors select-none",
                          selected
                            ? "bg-warning/10 border-warning text-warning font-extrabold"
                            : "border-border-default text-text-secondary hover:text-white bg-bg-tertiary/20 hover:bg-bg-tertiary/40",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selected}
                          onChange={() => {
                            const next =
                              selected ? field.value.filter((v) => v !== day.value)
                              : [...field.value, day.value];
                            field.onChange(next);
                          }}
                        />
                        {day.label}
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </ModalField>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border-default text-text-secondary hover:text-white hover:border-text-secondary rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-warning hover:bg-[#F0A83A] text-bg-main rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-[0.98]"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-bg-main border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Guardar Intervalo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isDeleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-bg-secondary border border-border-default/80 rounded-2xl p-5 max-w-xs w-full shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-error/5 border border-error/15 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-5 h-5 text-error" />
        </div>
        <h3 className="text-sm font-bold text-white text-center mb-1">¿Eliminar intervalo?</h3>
        <p className="text-xs text-text-secondary text-center mb-5 leading-normal">
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-xs border border-border-default text-text-secondary rounded-lg hover:border-text-secondary hover:text-white transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2 text-xs bg-error/10 border border-error/25 text-error rounded-lg hover:bg-error/20 transition disabled:opacity-50 flex items-center justify-center gap-1 font-bold cursor-pointer"
          >
            {isDeleting ? (
              <div className="w-3 h-3 border-2 border-error border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState<AdvisorSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    schedulesService
      .list()
      .then((r) => setSchedules(r.schedules))
      .catch(() => setSchedules([]))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleToggle(id: string, isActive: boolean) {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)),
    );
    try {
      const { schedule } = await schedulesService.update(id, { is_active: isActive });
      setSchedules((prev) => prev.map((s) => (s.id === id ? schedule : s)));
      toast.success(isActive ? "Intervalo activado" : "Intervalo desactivado");
    } catch {
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s)),
      );
      toast.error("No se pudo actualizar el intervalo");
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      await schedulesService.remove(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      setDeletingId(null);
    } catch {
      toast.error("No se pudo eliminar el intervalo");
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div
        id="schedules-card"
        className="relative overflow-hidden rounded-2xl border border-border-default/60 bg-bg-secondary p-5 shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-warning/5 flex items-center justify-center shrink-0 border border-warning/15">
              <Calendar className="w-4 h-4 text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Intervalos de Inactividad
              </h3>
              <p className="text-[10px] text-text-secondary">
                Paso automático a{" "}
                <span className="text-warning font-semibold">En descanso</span>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-warning/5 hover:bg-warning/10 border border-warning/15 hover:border-warning/30 text-warning rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-border-default/60 mb-4" />

        {/* List */}
        {isLoading ? (
          <ScheduleSkeleton />
        ) : schedules.length === 0 ? (
          <div
            id="schedules-empty"
            className="flex flex-col items-center justify-center py-8 gap-3 border border-dashed border-border-default/60 rounded-xl bg-bg-tertiary/10"
          >
            <div className="w-10 h-10 rounded-xl bg-bg-tertiary/40 border border-border-default/80 flex items-center justify-center text-text-secondary/50">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-center max-w-sm px-4">
              <p className="text-xs font-bold text-white">Sin intervalos configurados</p>
              <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                Programa descansos automáticos para pausar la asignación de chats.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5" id="schedule-list">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                id="schedule-item"
                className={[
                  "relative flex items-center justify-between p-3.5 rounded-xl border gap-4 transition-all duration-200",
                  schedule.is_active
                    ? "bg-bg-tertiary/20 border-border-default hover:border-warning/20"
                    : "bg-bg-tertiary/10 border-border-default/30 opacity-40",
                ].join(" ")}
              >
                {/* Left side info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={[
                      "w-1 h-8 rounded-full shrink-0 transition-colors duration-200",
                      schedule.is_active ? "bg-warning" : "bg-border-default/60",
                    ].join(" ")}
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {schedule.label}
                      </span>
                      <span className="text-[10px] text-warning font-mono font-semibold bg-warning/5 border border-warning/10 px-2 py-0.5 rounded-full shrink-0">
                        {schedule.start_time} – {schedule.end_time}
                      </span>
                    </div>

                    {/* Day pills */}
                    <div id="schedule-days-row" className="flex items-center gap-1">
                      {DAYS.map((day) => (
                        <span
                          key={day.value}
                          title={day.full}
                          className={[
                            "w-6 h-6 flex items-center justify-center rounded-lg text-[9px] font-extrabold border transition-colors",
                            schedule.days_of_week.includes(day.value)
                              ? "bg-brand-blue/10 text-brand-blue border-brand-blue/20"
                              : "bg-transparent text-text-secondary/30 border-border-default/30",
                          ].join(" ")}
                        >
                          {day.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    id="schedule-toggle"
                    type="button"
                    role="switch"
                    aria-checked={schedule.is_active}
                    onClick={() => handleToggle(schedule.id, !schedule.is_active)}
                    className={[
                      "relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer",
                      schedule.is_active ? "bg-brand-blue" : "bg-border-default",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-out",
                        schedule.is_active ? "left-[2px] translate-x-[16px]" : "left-[2px] translate-x-0",
                      ].join(" ")}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingId(schedule.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-text-secondary hover:text-error hover:bg-error/10 border border-transparent hover:border-error/15 transition-all cursor-pointer"
                    title="Eliminar intervalo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ScheduleFormModal
          onClose={() => setShowModal(false)}
          onCreated={(schedule) => {
            setSchedules((prev) => [...prev, schedule]);
            setShowModal(false);
          }}
        />
      )}

      {deletingId !== null && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
