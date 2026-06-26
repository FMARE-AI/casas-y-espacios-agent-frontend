import { useEffect, useRef, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { advisorsService } from "../services/advisors";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import type { Advisor, AdvisorRole, AvailabilityStatus } from "../types";
import ScheduleManager from "../components/perfil/ScheduleManager";

const STORAGE_BUCKET = (import.meta.env.VITE_SUPABAS_BUCKET_NAME ||
  import.meta.env.VITE_SUPABASE_BUCKET_NAME ||
  "casas-y-espacios-media") as string;

// ── Schema contraseña ─────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Requerida"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Requerida"),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "La nueva contraseña debe ser diferente",
    path: ["newPassword"],
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

// ── Helpers ───────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── AdvisorAvatar ─────────────────────────────────────────

const AVATAR_SIZE_CLASSES = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-20 h-20 text-lg",
  xl: "w-28 h-28 text-2xl",
};

function AdvisorAvatar({
  avatarUrl,
  fullName,
  size = "md",
  id,
}: {
  avatarUrl: string | null;
  fullName: string;
  size?: "sm" | "md" | "lg" | "xl";
  id?: string;
}) {
  const sizeClass = AVATAR_SIZE_CLASSES[size];
  if (avatarUrl) {
    return (
      <img
        id={id}
        src={avatarUrl}
        alt={fullName}
        className={`${sizeClass} rounded-full border-[3px] border-[#01A4E3] object-cover`}
      />
    );
  }
  return (
    <div
      id={id}
      className={`${sizeClass} rounded-full bg-[#01A4E3]/20 border-[3px] border-[#01A4E3] flex items-center justify-center text-[#01A4E3] font-bold`}
    >
      {getInitials(fullName)}
    </div>
  );
}

// ── Availability constants ─────────────────────────────────

const STATUS_OPTIONS: {
  value: AvailabilityStatus;
  label: string;
  sublabel: string;
  id: string;
  color: string;
}[] = [
  {
    value: "available",
    label: "Disponible",
    sublabel: "En línea",
    id: "avail-btn-available",
    color: "#00D4AA",
  },
  {
    value: "break",
    label: "En descanso",
    sublabel: "Pausa activa",
    id: "avail-btn-break",
    color: "#FFB84D",
  },
  {
    value: "offline",
    label: "No disponible",
    sublabel: "Fuera de línea",
    id: "avail-btn-offline",
    color: "#FF5B5B",
  },
];

const TIMER_OPTIONS: { value: number | null; label: string }[] = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hora" },
  { value: null, label: "Indefinido" },
];

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: "Disponible",
  break: "Pausa activa",
  offline: "No disponible",
};

const STATUS_COLORS: Record<AvailabilityStatus, string> = {
  available: "#00D4AA",
  break: "#FFB84D",
  offline: "#FF5B5B",
};

function formatStatusUntil(statusUntil: string): string {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(statusUntil + "-05:00"));
  } catch {
    return "--:--";
  }
}

// ── Role badge constants ───────────────────────────────────

const ROLE_BADGE_STYLES: Record<AdvisorRole, string> = {
  asesor: "bg-[#01A4E3]/10 text-[#01A4E3]",
  admin: "bg-[#FF5B5B]/15 text-[#FF5B5B]",
};

const ROLE_BADGE_TEXT: Record<AdvisorRole, string> = {
  asesor: "Asesor Senior",
  admin: "Administrador Global",
};

// ── Skeleton ──────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-[#2E2E2B] shrink-0" />
          <div className="space-y-3 flex-1 w-full">
            <div className="h-6 bg-[#2E2E2B] rounded w-48" />
            <div className="h-3 bg-[#2E2E2B] rounded w-64" />
            <div className="flex gap-2">
              <div className="h-5 bg-[#2E2E2B] rounded w-28" />
              <div className="h-5 bg-[#2E2E2B] rounded w-20" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 h-52" />
        <div className="bg-[#252522] border border-[#3A3A37] rounded-xl p-6 h-52" />
      </div>
    </div>
  );
}

// ── Password strength ─────────────────────────────────────

function getStrength(pwd: string): { text: string; color: string; bars: number } {
  if (!pwd) return { text: 'No ingresada', color: '#FF5B5B', bars: 0 }
  if (pwd.length < 6) return { text: 'Débil', color: '#FF5B5B', bars: 1 }
  if (pwd.length < 10) return { text: 'Media', color: '#FFB84D', bars: 2 }
  return { text: 'Fuerte', color: '#00D4AA', bars: 3 }
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { text, color, bars } = getStrength(password)
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[10px]">
        <span className="text-[#8B8FA8]">Seguridad de la contraseña:</span>
        <span style={{ color }} className="font-bold">{text}</span>
      </div>
      <div className="h-1.5 w-full bg-[#2E2E2B] rounded-full overflow-hidden flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-full w-1/3 rounded-full transition-all duration-300"
            style={{ backgroundColor: bars >= i ? color : 'transparent' }}
          />
        ))}
      </div>
    </div>
  )
}

// ── PasswordInput ──────────────────────────────────────────

interface PasswordInputProps {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  placeholder?: string;
}

function PasswordInput({ id, label, register, error, placeholder }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs text-[#8B8FA8] uppercase font-bold tracking-wider block mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          id={id}
          {...register}
          className="w-full bg-[#2E2E2B]/60 border border-[#3A3A37] focus:border-[#01A4E3] text-white text-sm rounded-lg px-3 py-2.5 pr-10 outline-none transition-all duration-200 focus:ring-1 focus:ring-[#01A4E3]/20"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8FA8] hover:text-white transition-colors"
          aria-label="Mostrar contraseña"
        >
          {show ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-[#FF5B5B] text-xs mt-1 pl-0.5">{error}</p>}
      {!error && placeholder && (
        <p className="text-[#8B8FA8] text-xs mt-1 pl-0.5">{placeholder}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function PerfilPage() {
  const { advisor: storeAdvisor, setAdvisor: setStoreAdvisor } = useAuthStore();

  const [advisor, setAdvisor] = useState<Advisor | null>(storeAdvisor);
  const [isLoading, setIsLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(storeAdvisor?.full_name ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>(
    storeAdvisor?.availability_status ?? "available",
  );
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(30);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const newPasswordValue = watch('newPassword') ?? '';

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleStatusRefresh(delayMs: number | null) {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = null;
    if (!delayMs || delayMs <= 0) return;
    statusTimerRef.current = setTimeout(async () => {
      try {
        const { advisor: refreshed } = await advisorsService.getMe();
        setAdvisor(refreshed);
        setStoreAdvisor(refreshed);
        setSelectedStatus(refreshed.availability_status);
        setSelectedMinutes(refreshed.availability_status === "available" ? null : 30);
      } catch {
        // silently fail
      }
    }, delayMs);
  }

  useEffect(
    () => () => { if (statusTimerRef.current) clearTimeout(statusTimerRef.current); },
    [],
  );

  useEffect(() => {
    const cached = useAuthStore.getState().advisor;
    if (cached) {
      setAdvisor(cached);
      setNameValue(cached.full_name);
      setSelectedStatus(cached.availability_status);
      setSelectedMinutes(
        cached.availability_status === "available" ? null
        : cached.status_until != null ? 30
        : null,
      );
      setIsLoading(false);
      scheduleStatusRefresh(
        cached.status_until
          ? new Date(cached.status_until + "-05:00").getTime() - Date.now() + 1000
          : null,
      );
      return;
    }
    async function loadProfile() {
      setIsLoading(true);
      try {
        const { advisor: fetched } = await advisorsService.getMe();
        setAdvisor(fetched);
        setNameValue(fetched.full_name);
        setSelectedStatus(fetched.availability_status);
        setSelectedMinutes(
          fetched.availability_status === "available" ? null
          : fetched.status_until != null ? 30
          : null,
        );
        scheduleStatusRefresh(
          fetched.status_until
            ? new Date(fetched.status_until + "-05:00").getTime() - Date.now() + 1000
            : null,
        );
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !advisor) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Solo se permiten imágenes JPG, PNG o WEBP");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB");
      e.target.value = "";
      return;
    }
    setUploadingAvatar(true);
    const originalAvatarUrl = advisor.avatar_url;
    const reader = new FileReader();
    reader.onloadend = () => {
      const localUrl = reader.result as string;
      setAdvisor({ ...advisor, avatar_url: localUrl });
      setStoreAdvisor({ ...advisor, avatar_url: localUrl });
    };
    reader.readAsDataURL(file);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `avatars/${advisor.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: signData, error: signError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(path, 31536000);
      if (signError || !signData?.signedUrl) throw signError ?? new Error("Sin URL firmada");
      const { advisor: updated } = await advisorsService.updateMe({ avatar_url: signData.signedUrl });
      setAdvisor(updated);
      setStoreAdvisor(updated);
      toast.success("Foto de perfil actualizada");
    } catch {
      toast.error("No se pudo subir la imagen");
      setAdvisor({ ...advisor, avatar_url: originalAvatarUrl });
      setStoreAdvisor({ ...advisor, avatar_url: originalAvatarUrl });
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function handleApplyStatusDirectly(status: AvailabilityStatus, minutes: number | null) {
    setIsSavingStatus(true);
    try {
      await advisorsService.updateAvailability(status, minutes);
      const { advisor: refreshed } = await advisorsService.getMe();
      setAdvisor(refreshed);
      setStoreAdvisor(refreshed);
      setSelectedStatus(refreshed.availability_status);
      setSelectedMinutes(refreshed.availability_status === "available" ? null : minutes);
      scheduleStatusRefresh(minutes ? minutes * 60 * 1000 + 1000 : null);
      toast.success("Disponibilidad actualizada");
    } catch {
      toast.error("No se pudo actualizar la disponibilidad");
    } finally {
      setIsSavingStatus(false);
    }
  }

  function handleStartEdit() {
    setEditingName(true);
    setTimeout(() => { nameInputRef.current?.focus(); nameInputRef.current?.select(); }, 50);
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); nameInputRef.current?.blur(); }
    if (e.key === "Escape") {
      setNameValue(advisor?.full_name ?? "");
      setEditingName(false);
      nameInputRef.current?.blur();
    }
  }

  async function handleNameBlur() {
    setEditingName(false);
    if (nameValue.trim() === advisor?.full_name) return;
    if (!nameValue.trim()) { setNameValue(advisor?.full_name ?? ""); return; }
    setIsSavingName(true);
    try {
      const { advisor: updated } = await advisorsService.updateMe({ full_name: nameValue.trim() });
      setAdvisor(updated);
      setNameValue(updated.full_name);
      setStoreAdvisor(updated);
      toast.success("Nombre actualizado");
    } catch {
      setNameValue(advisor?.full_name ?? "");
      toast.error("No se pudo actualizar el nombre");
    } finally {
      setIsSavingName(false);
    }
  }

  async function onPasswordSubmit(data: PasswordFormData) {
    setPasswordError(null);
    setIsSavingPassword(true);
    try {
      await advisorsService.updateMe({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      reset();
      toast.success("Contraseña actualizada correctamente");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: { code?: string } | string } } };
      const detail = err.response?.data?.detail;
      const code = typeof detail === "object" && detail !== null ? detail.code : undefined;
      setPasswordError(
        code === "INVALID_CURRENT_PASSWORD"
          ? "La contraseña actual es incorrecta"
          : "No se pudo actualizar la contraseña",
      );
    } finally {
      setIsSavingPassword(false);
    }
  }

  const currentStatus = advisor?.availability_status ?? "available";
  const isVacationMode = currentStatus === "offline" && !advisor?.status_until;

  return (
    <section
      id="screen-perfil"
      className="flex-1 flex flex-col p-4 md:p-6 space-y-6 w-full overflow-y-auto"
    >
      <div className="max-w-6xl w-full space-y-5 mx-auto">
        {/* Page header */}
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Mi Perfil Profesional</h2>
          <p className="text-sm text-[#8B8FA8] mt-0.5">
            Gestiona tu información, disponibilidad y configuración
          </p>
        </div>

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="space-y-5 w-full">

            {/* ── Hero card ── */}
            <div
              className="border border-[#3A3A37] rounded-xl p-5 relative flex flex-col sm:flex-row items-center gap-5 shadow-xl"
              style={{ background: "rgba(37,37,34,0.65)", backdropFilter: "blur(12px)" }}
            >
              {/* Top-right actions */}
              <div className="hidden sm:flex absolute top-4 right-4 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyStatusDirectly("offline", null)}
                  disabled={isSavingStatus || isVacationMode}
                  className={[
                    "text-[11px] px-3 py-1.5 rounded-full font-semibold border transition-all duration-150 disabled:cursor-default",
                    isVacationMode
                      ? "bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/40"
                      : "bg-transparent text-[#8B8FA8] border-[#3A3A37] hover:text-[#FFB84D] hover:border-[#FFB84D]/40",
                  ].join(" ")}
                >
                  Vacaciones
                </button>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-[#3A3A37] text-[#8B8FA8] hover:text-white hover:border-[#8B8FA8] transition-all duration-150 font-semibold flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar perfil
                </button>
              </div>

              {/* Avatar */}
              <div className="relative shrink-0">
                <AdvisorAvatar
                  avatarUrl={advisor?.avatar_url ?? null}
                  fullName={advisor?.full_name ?? ""}
                  size="lg"
                  id="perfil-avatar-img"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 bg-[#01A4E3] hover:bg-[#0190C8] text-white p-1.5 rounded-full transition shadow-lg disabled:opacity-50"
                  aria-label="Cambiar foto de perfil"
                >
                  {uploadingAvatar ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="text-center sm:text-left flex-1 space-y-2 min-w-0">
                {/* Editable name */}
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <input
                    ref={nameInputRef}
                    id="perfil-name"
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    readOnly={!editingName}
                    onBlur={handleNameBlur}
                    onKeyDown={handleNameKeyDown}
                    className={[
                      "bg-transparent border-b text-2xl font-semibold text-white pb-0.5 max-w-[320px] outline-none transition-colors w-full",
                      editingName ? "border-[#01A4E3] cursor-text" : "border-transparent cursor-default",
                    ].join(" ")}
                  />
                  {isSavingName && (
                    <div className="w-4 h-4 border-2 border-[#01A4E3] border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                </div>

                {/* Email */}
                <p className="text-base text-[#8B8FA8] flex items-center justify-center sm:justify-start gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span id="perfil-email-txt">{advisor?.email}</span>
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start items-center">
                  <span
                    id="perfil-role-badge"
                    className={[
                      "text-sm px-3 py-1 rounded font-bold uppercase tracking-wide",
                      advisor?.role ? ROLE_BADGE_STYLES[advisor.role] : ROLE_BADGE_STYLES.asesor,
                    ].join(" ")}
                  >
                    {advisor?.role ? ROLE_BADGE_TEXT[advisor.role] : "Asesor Senior"}
                  </span>
                  <span
                    id="perfil-area-badge"
                    className="text-sm px-3 py-1 rounded font-medium border border-[#3A3A37] text-[#8B8FA8] bg-[#2E2E2B]/60 cursor-help"
                    title="Solo el admin puede cambiar esto"
                  >
                    Área: {advisor?.area}
                  </span>
                  <div
                    id="availability-status-display"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded border"
                    style={{
                      borderColor: `${STATUS_COLORS[currentStatus]}35`,
                      backgroundColor: `${STATUS_COLORS[currentStatus]}10`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[currentStatus] }}
                    />
                    <span
                      id="avail-label"
                      className="text-sm font-semibold"
                      style={{ color: STATUS_COLORS[currentStatus] }}
                    >
                      {STATUS_LABELS[currentStatus]}
                    </span>
                    {advisor?.status_until && (
                      <span className="text-xs text-[#8B8FA8]">
                        · {formatStatusUntil(advisor.status_until)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile quick-actions */}
                <div className="flex sm:hidden flex-wrap gap-2 justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => handleApplyStatusDirectly("offline", null)}
                    disabled={isSavingStatus || isVacationMode}
                    className={[
                      "text-[11px] px-3 py-1.5 rounded-full font-semibold border transition-all duration-150 disabled:cursor-default",
                      isVacationMode
                        ? "bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/40"
                        : "text-[#8B8FA8] border-[#3A3A37]",
                    ].join(" ")}
                  >
                    Vacaciones
                  </button>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="text-[11px] px-3 py-1.5 rounded-lg border border-[#3A3A37] text-[#8B8FA8] font-semibold"
                  >
                    Editar perfil
                  </button>
                </div>
              </div>
            </div>

            {/* ── Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">

              {/* Disponibilidad */}
              <div
                id="availability-section"
                className="border border-[#3A3A37]/60 rounded-xl p-5 flex flex-col gap-4 shadow-xl"
                style={{ background: "rgba(37,37,34,0.65)", backdropFilter: "blur(12px)" }}
              >
                {/* Header con ícono */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#01A4E3]/15 flex items-center justify-center shrink-0">
                    <svg className="w-4.5 h-4.5 text-[#01A4E3]" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">Disponibilidad</p>
                    <p className="text-xs text-[#8B8FA8]">Gestiona tu estado actual</p>
                  </div>
                </div>

                {/* 3 opciones horizontales */}
                <div className="grid grid-cols-3 gap-2" id="availability-status-pills">
                  {STATUS_OPTIONS.map((option) => {
                    const isSelected = selectedStatus === option.value;
                    return (
                      <button
                        key={option.value}
                        id={option.id}
                        type="button"
                        onClick={async () => {
                          setSelectedStatus(option.value);
                          if (option.value === "available") {
                            setSelectedMinutes(null);
                            await handleApplyStatusDirectly("available", null);
                          } else {
                            setSelectedMinutes(15);
                          }
                        }}
                        className={[
                          "flex items-center gap-3 px-3 py-4 rounded-xl border transition-all duration-200 text-left",
                          isSelected
                            ? "border-[--c]/40 bg-[--c]/10"
                            : "border-[#3A3A37] bg-transparent hover:border-[--c]/30 hover:bg-[--c]/5",
                        ].join(" ")}
                        style={{ "--c": option.color } as React.CSSProperties}
                      >
                        {/* Círculo indicador */}
                        {option.value === "available" ? (
                          <span
                            className="w-4 h-4 rounded-full shrink-0 transition-all duration-200"
                            style={{ backgroundColor: option.color, boxShadow: isSelected ? `0 0 8px ${option.color}80` : "none" }}
                          />
                        ) : option.value === "break" ? (
                          <span
                            className="w-4 h-4 rounded-full shrink-0 border-2 flex items-center justify-center transition-all duration-200"
                            style={{ borderColor: option.color }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color }} />
                          </span>
                        ) : (
                          <span
                            className="w-4 h-4 rounded-full shrink-0 border-2 transition-all duration-200"
                            style={{ borderColor: option.color }}
                          />
                        )}
                        {/* Texto */}
                        <div className="min-w-0">
                          <p
                            className="text-sm font-bold leading-tight truncate"
                            style={{ color: isSelected ? option.color : "#F0F0F5" }}
                          >
                            {option.label}
                          </p>
                          <p className="text-xs text-[#8B8FA8] leading-tight truncate mt-0.5">{option.sublabel}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Panel Estado actual */}
                {selectedStatus === "available" ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#00D4AA]/20 bg-[#00D4AA]/5">
                    <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/15 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B8FA8]">Estado actual</p>
                      <p className="text-base font-bold text-[#00D4AA]">En línea</p>
                      <p className="text-xs text-[#8B8FA8]">Recibiendo conversaciones normalmente</p>
                    </div>
                  </div>
                ) : (
                  <div id="availability-timer-options" className="space-y-3">
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{
                        borderColor: `${STATUS_COLORS[selectedStatus]}30`,
                        backgroundColor: `${STATUS_COLORS[selectedStatus]}08`,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${STATUS_COLORS[selectedStatus]}18` }}
                      >
                        <svg className="w-4 h-4" style={{ color: STATUS_COLORS[selectedStatus] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-[#8B8FA8]">Estado actual</p>
                        <p className="text-base font-bold" style={{ color: STATUS_COLORS[selectedStatus] }}>
                          {STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.sublabel}
                        </p>
                        <p className="text-xs text-[#8B8FA8]">
                          {selectedStatus === "break" ? "Pausado temporalmente" : "No recibiendo conversaciones"}
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] text-[#8B8FA8] uppercase font-bold tracking-wider">
                      ¿Por cuánto tiempo?
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIMER_OPTIONS.map((option) => (
                        <button
                          key={String(option.value)}
                          type="button"
                          onClick={() => setSelectedMinutes(option.value)}
                          className={[
                            "text-xs py-2 rounded-md border transition-all duration-150 font-semibold",
                            selectedMinutes === option.value
                              ? "bg-[#2E2E2B] border-[#8B8FA8] text-white shadow-md"
                              : "border-[#3A3A37] text-[#8B8FA8] hover:border-[#8B8FA8] hover:bg-[#2E2E2B]/10",
                          ].join(" ")}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyStatusDirectly(selectedStatus, selectedMinutes)}
                      disabled={isSavingStatus}
                      className="w-full bg-[#01A4E3] hover:bg-[#0190C8] text-white text-sm font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                    >
                      {isSavingStatus && (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      Aplicar Disponibilidad
                    </button>
                  </div>
                )}
              </div>

              {/* Seguridad */}
              <form
                onSubmit={handleSubmit(onPasswordSubmit)}
                className="border border-[#3A3A37]/60 rounded-xl p-5 flex flex-col justify-between shadow-xl"
                style={{ background: "rgba(37,37,34,0.65)", backdropFilter: "blur(12px)" }}
              >
                <div className="space-y-4">
                  <h4 className="text-base font-semibold text-white uppercase tracking-wider border-l-4 border-[#01A4E3] pl-3">
                    Seguridad
                  </h4>

                  {/* Contraseña actual — full width */}
                  <PasswordInput
                    id="current-password"
                    label="Contraseña actual"
                    register={register("currentPassword")}
                    error={passwordError ?? errors.currentPassword?.message}
                  />

                  {/* Nueva + Confirmar — 2 columnas */}
                  <div className="grid grid-cols-2 gap-3">
                    <PasswordInput
                      id="new-password"
                      label="Nueva contraseña"
                      register={register("newPassword")}
                      error={errors.newPassword?.message}
                      placeholder="Mín. 8 caracteres"
                    />
                    <PasswordInput
                      id="confirm-password"
                      label="Confirmar nueva contraseña"
                      register={register("confirmPassword")}
                      error={errors.confirmPassword?.message}
                    />
                  </div>

                  {/* Barra de seguridad */}
                  <PasswordStrengthBar password={newPasswordValue} />
                </div>

                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full bg-[#01A4E3] hover:bg-[#0190C8] text-white py-3 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5 active:scale-95"
                >
                  {isSavingPassword && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Actualizar contraseña
                </button>
              </form>
            </div>
          </div>
        )}

        <ScheduleManager />
      </div>
    </section>
  );
}
