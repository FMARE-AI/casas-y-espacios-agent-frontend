// Meta's 24-hour customer service window, derived client-side.
//
// WhatsApp only accepts free-form messages within 24h of the client's last
// INBOUND message. The backend sends the absolute expiry instant and nothing
// else (`whatsapp_window_expires_at`), on purpose: any precomputed
// "seconds_remaining" is already stale by the time it renders. See
// docs/panel_api_reference.md § "The 24-hour window".
//
// Two rules this module exists to enforce:
//   1. `null` means UNKNOWN, never expired. Every conversation created before
//      the feature shipped, and any conversation with no inbound message yet,
//      arrives as null — treating it as closed would lock the whole inbox.
//   2. Never derive the window from `last_activity`. Only the client's messages
//      reset the clock; advisor and bot replies do not, so a conversation that
//      was active a minute ago can still be minutes from expiring.

import { clientFirstName } from "./clientName";

export type WhatsAppWindowState = "unknown" | "open" | "closing" | "closed";

export interface WhatsAppWindowInfo {
  state: WhatsAppWindowState;
  /** False only when the window is provably closed — never on `unknown`. */
  canReply: boolean;
  /** Milliseconds left, or null when the expiry instant is unknown. */
  msLeft: number | null;
}

/**
 * How much time is left before we warn the advisor she is running out of window.
 * Agreed threshold: 2 hours, assuming production's 24h window. DEV runs with a
 * shortened window (WHATSAPP_WINDOW_HOURS), so everything reads as "closing"
 * there — that is expected and not a reason to lower this.
 */
export const WINDOW_WARNING_MS = 2 * 60 * 60 * 1000;

const UNKNOWN_WINDOW: WhatsAppWindowInfo = {
  state: "unknown",
  canReply: true,
  msLeft: null,
};

export function getWhatsAppWindow(
  expiresAt: string | null | undefined,
  now: number = Date.now(),
): WhatsAppWindowInfo {
  if (expiresAt == null) return UNKNOWN_WINDOW;

  const expiryMs = new Date(expiresAt).getTime();
  // A malformed instant tells us nothing about the window — same as null.
  // Blocking the composer on a parse failure would be the worst possible read.
  if (Number.isNaN(expiryMs)) return UNKNOWN_WINDOW;

  const msLeft = expiryMs - now;
  if (msLeft <= 0) return { state: "closed", canReply: false, msLeft: 0 };
  if (msLeft <= WINDOW_WARNING_MS) return { state: "closing", canReply: true, msLeft };
  return { state: "open", canReply: true, msLeft };
}

/** Human countdown for the advisor: "3 h 12 min", "47 min", "menos de 1 min". */
export function formatWindowCountdown(msLeft: number): string {
  if (msLeft <= 0) return "0 min";
  const totalMinutes = Math.floor(msLeft / 60000);
  if (totalMinutes < 1) return "menos de 1 min";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/**
 * Why the composer is blocked, shown to the advisor. Addresses the client by
 * first name when we know it, and falls back to "el cliente" when we do not —
 * see lib/clientName.ts for why a truthiness check is not enough.
 *
 * Deliberately does NOT promise that anything the advisor does reopens the
 * conversation: when templates ship, a template sends one approved message and
 * the window reopens only if the client answers it.
 */
export function windowClosedReason(clientName?: string | null): string {
  const who = clientFirstName(clientName) ?? "el cliente";
  return `La ventana de 24 horas de WhatsApp se cerró. No se pueden enviar mensajes hasta que ${who} escriba de nuevo.`;
}

/** Generic wording, for the call sites that have no client name in scope. */
export const WINDOW_CLOSED_REASON = windowClosedReason(null);

/** Tooltip for the countdown, same name handling as the reason above. */
export function windowCountdownHint(clientName?: string | null): string {
  const who = clientFirstName(clientName) ?? "el cliente";
  return `Ventana de 24 h de WhatsApp. Solo se reinicia cuando ${who} escribe.`;
}
