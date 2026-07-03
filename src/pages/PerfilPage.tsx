import { useEffect, useRef, useState } from "react";
import { useToastStore } from "../store/toastStore";
import {
  Activity,
  Briefcase,
  Camera,
  Check,
  Clock,
  Edit2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Pause,
  Shield,
  ShieldAlert,
  X,
} from "lucide-react";
import { usePasswordStrength, type PasswordStrength } from "../hooks/usePasswordStrength";
import { advisorsService } from "../services/advisors";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import { getValidToken } from "../lib/axios";
import type { Advisor, AdvisorRole, AvailabilityStatus } from "../types";
import ScheduleManager from "../components/perfil/ScheduleManager";

const STORAGE_BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET_NAME || "casas-y-espacios-media") as string;

// Extension derived from the MIME type, never from file.name: a name without
// extension (or an uppercase/multi-dot one) would produce unstable storage
// paths, and upsert only overwrites the exact same path.
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_AVATAR_SIZE_MB = 2;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

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
  lg: "w-16 h-16 text-sm",
  xl: "w-24 h-24 text-xl",
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
        className={`${sizeClass} rounded-full border border-brand-blue/20 object-cover`}
      />
    );
  }
  return (
    <div
      id={id}
      className={`${sizeClass} rounded-full bg-brand-blue/5 border border-brand-blue/15 flex items-center justify-center text-brand-blue font-bold`}
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
  asesor: "bg-brand-blue/5 text-brand-blue border-brand-blue/10",
  admin: "bg-error/5 text-error border-error/10",
};

const ROLE_BADGE_TEXT: Record<AdvisorRole, string> = {
  asesor: "Asesor",
  admin: "Admin Global",
};

// ── Skeleton ──────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-bg-secondary border border-border-default/50 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-bg-tertiary/60 shrink-0" />
          <div className="space-y-2 flex-1 w-full text-center sm:text-left">
            <div className="h-5 bg-bg-tertiary/60 rounded-lg w-40 mx-auto sm:mx-0" />
            <div className="h-3.5 bg-bg-tertiary/60 rounded-lg w-52 mx-auto sm:mx-0" />
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              <div className="h-5 bg-bg-tertiary/60 rounded-full w-20" />
              <div className="h-5 bg-bg-tertiary/60 rounded-full w-16" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-secondary border border-border-default/50 rounded-2xl h-56" />
        <div className="bg-bg-secondary border border-border-default/50 rounded-2xl h-56" />
      </div>
    </div>
  );
}

// ── Password components ───────────────────────────────────

interface LocalPasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  placeholder?: string;
  autoComplete?: string;
}

function LocalPasswordInput({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
}: LocalPasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="text-[11px] text-text-secondary uppercase font-bold tracking-wider block"
      >
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand-blue transition-colors">
          <Lock className="w-3.5 h-3.5" />
        </div>
        <input
          type={show ? "text" : "password"}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={72}
          className={[
            "w-full bg-bg-tertiary/10 border text-[13px] text-white rounded-xl pl-9 pr-9 py-2.5 outline-none transition-all duration-200",
            error
              ? "border-error/30 focus:border-error/60 focus:ring-2 focus:ring-error/5"
              : "border-border-default/70 focus:border-brand-blue/80 focus:ring-2 focus:ring-brand-blue/5",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors cursor-pointer"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      {error && (
        <p className="text-error text-[11px] mt-0.5 pl-1 flex items-center gap-1 animate-fadeIn">
          <span className="w-1 h-1 rounded-full bg-error" />
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordStrengthBar({ strength }: { strength: PasswordStrength }) {
  const bars =
    strength.level === "empty" ? 0 :
    strength.level === "weak"  ? 1 :
    strength.level === "fair"  ? 2 : 3;
  const color =
    strength.level === "strong" ? "#00D4AA" :
    strength.level === "fair"   ? "#FFB84D" : "#FF5B5B";
  const text =
    strength.level === "empty"  ? "No ingresada" :
    strength.level === "weak"   ? "Débil" :
    strength.level === "fair"   ? "Media" : "Fuerte";

  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-text-secondary font-medium">Seguridad de la contraseña:</span>
        <span style={{ color }} className="font-semibold uppercase tracking-wider">
          {text}
        </span>
      </div>
      <div className="h-1.5 w-full bg-bg-tertiary/40 rounded-full overflow-hidden flex gap-1 border border-border-default/30 p-[1px]">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-full w-1/3 rounded-full transition-all duration-300 ease-out"
            style={{ backgroundColor: bars >= i ? color : "transparent" }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function PerfilPage() {
  const storeAdvisor = useAuthStore((s) => s.advisor);
  const setStoreAdvisor = useAuthStore((s) => s.setAdvisor);

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

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const strength = usePasswordStrength(newPassword);

  const sameAsCurrentError =
    newPassword.length > 0 && currentPassword.length > 0 && newPassword === currentPassword
      ? 'La nueva contraseña debe ser diferente a la actual'
      : null;

  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== newPassword
      ? 'Las contraseñas no coinciden'
      : null;

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
    () => () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !advisor) return;

    const ext = ALLOWED_AVATAR_TYPES[file.type];
    if (!ext) {
      useToastStore.getState().showToast(
        "Formato no válido. Solo se permiten imágenes JPG, PNG o WEBP.", 'error');
      input.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      useToastStore.getState().showToast(
        `La imagen pesa ${sizeMb}MB y el máximo permitido es ${MAX_AVATAR_SIZE_MB}MB. Usa una imagen más liviana.`, 'error');
      input.value = "";
      return;
    }

    setUploadingAvatar(true);
    const originalAvatarUrl = advisor.avatar_url;
    // Tracks how far the flow got, so the catch can tell the user exactly
    // what failed instead of a single generic message for every stage.
    let stage: 'session' | 'storage' | 'profile' = 'session';
    try {
      // Local preview while the upload runs. Awaited (not a floating callback)
      // so a slow read can never land AFTER the upload finished and overwrite
      // the final signed URL with a base64 blob.
      try {
        const localUrl = await readFileAsDataUrl(file);
        setAdvisor((prev) => prev ? { ...prev, avatar_url: localUrl } : prev);
        setStoreAdvisor({ ...useAuthStore.getState().advisor, avatar_url: localUrl } as Advisor);
      } catch {
        // Preview is cosmetic — continue with the upload without it.
      }

      // Storage calls run on supabase-js's own session, which does not
      // auto-refresh (see lib/supabase.ts). Refresh the panel token if needed
      // and sync the client explicitly, so uploading after the tab sat idle
      // past token expiry doesn't fail with an authorization error.
      const token = await getValidToken();
      const refreshToken = useAuthStore.getState().refresh_token;
      if (!token || !refreshToken) throw new Error("no active session");
      await supabase.auth.setSession({ access_token: token, refresh_token: refreshToken });

      stage = 'storage';
      const path = `avatars/${advisor.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: signData, error: signError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(path, 31536000);
      if (signError || !signData?.signedUrl) throw signError ?? new Error("no signed URL returned");

      stage = 'profile';
      const { advisor: updated } = await advisorsService.updateMe({
        avatar_url: signData.signedUrl,
      });
      setAdvisor(updated);
      setStoreAdvisor(updated);
      useToastStore.getState().showToast("Foto de perfil actualizada", 'success');
    } catch (err) {
      console.error(`Avatar upload failed at stage "${stage}":`, err);
      const message =
        stage === 'session'
          ? "Tu sesión no está activa. Recarga la página e intenta de nuevo."
          : stage === 'profile'
            ? "La imagen se subió pero no se pudo guardar en tu perfil. Intenta de nuevo."
            : "No se pudo subir la imagen. Verifica tu conexión e intenta de nuevo.";
      useToastStore.getState().showToast(message, 'error');
      setAdvisor((prev) => prev ? { ...prev, avatar_url: originalAvatarUrl } : prev);
      setStoreAdvisor({ ...useAuthStore.getState().advisor, avatar_url: originalAvatarUrl } as Advisor);
    } finally {
      setUploadingAvatar(false);
      input.value = "";
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
      useToastStore.getState().showToast("Disponibilidad actualizada", 'success');
    } catch {
      useToastStore.getState().showToast("No se pudo actualizar la disponibilidad", 'error');
    } finally {
      setIsSavingStatus(false);
    }
  }

  function handleStartEdit() {
    setEditingName(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 50);
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      nameInputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setNameValue(advisor?.full_name ?? "");
      setEditingName(false);
      nameInputRef.current?.blur();
    }
  }

  async function handleNameBlur() {
    setEditingName(false);
    if (nameValue.trim() === advisor?.full_name) return;
    if (!nameValue.trim()) {
      setNameValue(advisor?.full_name ?? "");
      return;
    }
    setIsSavingName(true);
    try {
      const { advisor: updated } = await advisorsService.updateMe({
        full_name: nameValue.trim(),
      });
      setAdvisor(updated);
      setNameValue(updated.full_name);
      setStoreAdvisor(updated);
      useToastStore.getState().showToast("Nombre actualizado", 'success');
    } catch {
      setNameValue(advisor?.full_name ?? "");
      useToastStore.getState().showToast("No se pudo actualizar el nombre", 'error');
    } finally {
      setIsSavingName(false);
    }
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Ingresá tu contraseña actual');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    if (!strength.isValid) {
      setPasswordError(strength.errorMessage);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    setIsSavingPassword(true);
    try {
      await advisorsService.updateMe({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      useToastStore.getState().showToast("Contraseña actualizada correctamente", 'success');
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

  return (
    <section
      id="screen-perfil"
      className="flex-1 flex flex-col p-4 space-y-4 w-full overflow-y-auto"
    >
      <div className="max-w-5xl w-full space-y-4 mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Mi Perfil</h2>
            <p className="text-xs text-text-secondary">Configuración personal y de estado.</p>
          </div>
        </div>

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="space-y-4 w-full animate-fadeIn">
            {/* ── Hero card ── */}
            <div className="relative overflow-hidden rounded-2xl border border-border-default/60 bg-bg-secondary p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Avatar with simple overlay */}
                <div className="relative shrink-0 group">
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

                  {/* Upload overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-semibold transition-opacity duration-200 cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <div className="w-4 h-4 border border-brand-blue border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mb-0.5 text-brand-blue" />
                        <span>FOTO</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Info block */}
                <div className="text-center sm:text-left flex-1 space-y-2 min-w-0">
                  {/* Name Editor */}
                  {editingName ? (
                    <div className="flex items-center gap-1.5 max-w-[280px] w-full mx-auto sm:mx-0">
                      <input
                        ref={nameInputRef}
                        id="perfil-name"
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        onKeyDown={handleNameKeyDown}
                        className="bg-bg-tertiary/60 border border-brand-blue text-[15px] font-semibold text-white px-2.5 py-1 rounded-lg outline-none w-full"
                      />
                      <button
                        type="button"
                        onClick={handleNameBlur}
                        className="p-1.5 bg-success/10 text-success rounded-lg border border-success/15 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNameValue(advisor?.full_name ?? "");
                          setEditingName(false);
                        }}
                        className="p-1.5 bg-error/10 text-error rounded-lg border border-error/15 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group justify-center sm:justify-start">
                      <h1
                        id="perfil-name-display"
                        className="text-lg font-bold text-white tracking-tight"
                      >
                        {advisor?.full_name}
                      </h1>
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="p-1 text-text-secondary hover:text-white rounded transition-colors cursor-pointer"
                        title="Editar nombre"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {isSavingName && (
                        <div className="w-3 h-3 border border-brand-blue border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                    </div>
                  )}

                  {/* Email & Contact info */}
                  <div className="flex justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => {
                        if (advisor?.email) {
                          navigator.clipboard.writeText(advisor.email);
                          useToastStore.getState().showToast("Correo copiado al portapapeles", 'success');
                        }
                      }}
                      className="inline-flex items-center gap-2 bg-bg-tertiary/20 hover:bg-bg-tertiary/40 border border-border-default/60 rounded-xl px-2.5 py-1 text-xs text-text-secondary hover:text-white transition-colors cursor-pointer group active:scale-95"
                      title="Copiar correo al portapapeles"
                    >
                      <Mail className="w-3 h-3 text-brand-blue group-hover:scale-105 transition-transform" />
                      <span id="perfil-email-txt" className="font-semibold font-mono text-[11px]">
                        {advisor?.email}
                      </span>
                    </button>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start items-center">
                    <span
                      id="perfil-role-badge"
                      className={[
                        "text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border",
                        advisor?.role ? ROLE_BADGE_STYLES[advisor.role] : ROLE_BADGE_STYLES.asesor,
                      ].join(" ")}
                    >
                      {advisor?.role ? ROLE_BADGE_TEXT[advisor.role] : "Asesor"}
                    </span>

                    <span
                      id="perfil-area-badge"
                      className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-border-default/50 text-text-secondary bg-bg-tertiary/20 cursor-help flex items-center gap-1"
                      title="Solo el administrador puede cambiar tu área asignada"
                    >
                      <Briefcase className="w-2.5 h-2.5" />
                      {advisor?.area}
                    </span>

                    <div
                      id="availability-status-display"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        borderColor: `${STATUS_COLORS[currentStatus]}25`,
                        backgroundColor: `${STATUS_COLORS[currentStatus]}05`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[currentStatus] }}
                      />
                      <span id="avail-label" style={{ color: STATUS_COLORS[currentStatus] }}>
                        {STATUS_LABELS[currentStatus]}
                      </span>
                      {advisor?.status_until && (
                        <span className="text-text-secondary font-medium tracking-normal normal-case">
                          · hasta {formatStatusUntil(advisor.status_until)}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ── Grid: Availability & Security ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {/* Disponibilidad */}
              <div
                id="availability-section"
                className="rounded-2xl border border-border-default/60 bg-bg-secondary p-5 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-brand-blue/5 flex items-center justify-center shrink-0 border border-brand-blue/10">
                    <Clock className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Disponibilidad</h3>
                    <p className="text-[11px] text-text-secondary">
                      Estado en el panel de distribución.
                    </p>
                  </div>
                </div>

                {/* 3 Option Pills */}
                <div
                  className="grid grid-cols-3 gap-2 mb-4"
                  id="availability-status-pills"
                >
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
                          "flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-colors text-center active:scale-[0.98] cursor-pointer",
                          isSelected
                            ? "border-[--c]/40 bg-[--c]/5"
                            : "border-border-default bg-bg-tertiary/10 hover:border-[--c]/20 hover:bg-[--c]/5",
                        ].join(" ")}
                        style={{ "--c": option.color } as React.CSSProperties}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center mb-1.5 border"
                          style={{
                            borderColor: option.color,
                            backgroundColor: isSelected ? option.color : "transparent",
                          }}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-bg-main" />}
                        </div>
                        <p className="text-[12px] font-bold text-white leading-tight">
                          {option.label}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Options Area */}
                {selectedStatus === "available" ? (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-success/15 bg-success/5">
                    <Activity className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-success uppercase tracking-wider mb-0.5">
                        En Línea
                      </p>
                      <p className="text-[13px] text-text-secondary leading-normal">
                        Asignación automática activa. Recibiendo chats de WhatsApp en tiempo real.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div id="availability-timer-options" className="space-y-4">
                    <div
                      className="flex items-start gap-3 p-4 rounded-xl border"
                      style={{
                        borderColor: `${STATUS_COLORS[selectedStatus]}15`,
                        backgroundColor: `${STATUS_COLORS[selectedStatus]}05`,
                      }}
                    >
                      {selectedStatus === "break" ? (
                        <Pause
                          className="w-4 h-4 shrink-0 mt-0.5"
                          style={{ color: STATUS_COLORS[selectedStatus] }}
                        />
                      ) : (
                        <ShieldAlert
                          className="w-4 h-4 shrink-0 mt-0.5"
                          style={{ color: STATUS_COLORS[selectedStatus] }}
                        />
                      )}
                      <div>
                        <p
                          className="text-[11px] font-bold uppercase tracking-wider mb-0.5"
                          style={{ color: STATUS_COLORS[selectedStatus] }}
                        >
                          {selectedStatus === "break" ? "Pausa Activa" : "Pausa Indefinida"}
                        </p>
                        <p className="text-[13px] text-text-secondary leading-normal">
                          {selectedStatus === "break"
                            ? "Los chats no serán asignados temporalmente."
                            : "Asignación desactivada. Activa tu estado para atender clientes."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] text-text-secondary uppercase font-bold tracking-wider">
                        Duración del descanso
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {TIMER_OPTIONS.map((option) => (
                          <button
                            key={String(option.value)}
                            type="button"
                            onClick={() => setSelectedMinutes(option.value)}
                            className={[
                              "text-xs py-2 rounded-lg border transition-colors font-medium cursor-pointer active:scale-95",
                              selectedMinutes === option.value
                                ? "bg-bg-tertiary border-brand-blue/50 text-white"
                                : "border-border-default text-text-secondary hover:border-text-secondary",
                            ].join(" ")}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyStatusDirectly(selectedStatus, selectedMinutes)}
                      disabled={isSavingStatus}
                      className="w-full bg-brand-blue hover:bg-[#0190C8] text-white text-[13px] font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-[0.98]"
                    >
                      {isSavingStatus ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Confirmar cambio</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Seguridad */}
              <form
                onSubmit={onPasswordSubmit}
                className="rounded-2xl border border-border-default/60 bg-bg-secondary p-5 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-brand-blue/5 flex items-center justify-center shrink-0 border border-brand-blue/10">
                      <Shield className="w-4 h-4 text-brand-blue" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">Contraseña</h3>
                      <p className="text-[11px] text-text-secondary">
                        Actualiza tu clave de acceso.
                      </p>
                    </div>
                  </div>

                  <LocalPasswordInput
                    id="current-password"
                    label="Contraseña actual"
                    value={currentPassword}
                    onChange={(v) => {
                      setCurrentPassword(v);
                      setPasswordError(null);
                    }}
                    autoComplete="current-password"
                    error={passwordError}
                  />

                  {/* Nueva y Confirmar en 2 cols */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LocalPasswordInput
                      id="new-password"
                      label="Nueva contraseña"
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="Mín. 8 caracteres"
                      autoComplete="new-password"
                      error={sameAsCurrentError}
                    />
                    <LocalPasswordInput
                      id="confirm-password"
                      label="Confirmar nueva"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      autoComplete="new-password"
                      error={confirmError}
                    />
                  </div>

                  <PasswordStrengthBar strength={strength} />
                </div>

                <button
                  type="submit"
                  disabled={!currentPassword || !strength.isValid || !!sameAsCurrentError || !!confirmError || !confirmPassword || isSavingPassword}
                  className="w-full bg-brand-blue hover:bg-[#0190C8] text-white py-3 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 mt-5 cursor-pointer shadow active:scale-[0.98]"
                >
                  {isSavingPassword ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                  <span>Actualizar Contraseña</span>
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
