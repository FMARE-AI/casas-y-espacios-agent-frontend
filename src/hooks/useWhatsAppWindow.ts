import { useEffect, useState } from "react";
import {
  getWhatsAppWindow,
  type WhatsAppWindowInfo,
} from "../lib/whatsappWindow";

// Half a minute: the countdown is rendered in minutes, so this is enough to keep
// it honest and to flip the composer to "closed" within 30s of the real expiry,
// without re-rendering the chat every second.
const TICK_MS = 30_000;

/**
 * Live view of Meta's 24h window for one conversation. Ticks locally — the
 * backend only sends the absolute expiry instant (see lib/whatsappWindow.ts).
 *
 * The timer runs for as long as the hook is mounted, on purpose, and does not
 * depend on `expiresAt`.
 *
 * An earlier version skipped it whenever there was nothing to count down (an
 * unknown or already-expired window) and stopped it once the window closed.
 * That looked like a free optimisation and was the opposite: with no timer
 * running, `now` froze. ChatPage is routed as
 * `<Route path="/chat/:id" element={<ChatPage />} />` with no `key`, so moving
 * between conversations swaps the param WITHOUT remounting — a frozen `now`
 * outlives the conversation it was taken for. An advisor who sat on a legacy
 * (`null`) conversation for twenty minutes and then opened one whose window had
 * expired ten minutes ago would have had it measured against that twenty-minute
 * old clock, read it as still open, and been handed an enabled composer for a
 * window Meta had already closed — the exact outcome this feature exists to
 * prevent. Unreachable through today's UI, which only enters a chat from the
 * inbox or the alerts panel (both remount this page), but a "next conversation"
 * control would have switched it on silently.
 *
 * One 30s timer per open chat is a trivial price for a clock that cannot go
 * stale. The window is still read at render, so the worst case is the same
 * TICK_MS of lag the countdown already accepts — and the backend's
 * 409 WINDOW_EXPIRED covers that edge anyway.
 */
export function useWhatsAppWindow(
  expiresAt: string | null | undefined,
): WhatsAppWindowInfo {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return getWhatsAppWindow(expiresAt, now);
}
