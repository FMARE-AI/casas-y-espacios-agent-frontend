import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useWhatsAppWindow } from "../../hooks/useWhatsAppWindow";

const MINUTE = 60_000;

function isoIn(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

describe("useWhatsAppWindow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports an open window and counts it down as time passes", () => {
    // Hoisted on purpose: computing the expiry inside the render callback would
    // push it forward on every re-render, and the countdown could never fall.
    const expiresAt = isoIn(30 * MINUTE);
    const { result } = renderHook(() => useWhatsAppWindow(expiresAt));

    expect(result.current.state).toBe("closing"); // under the 2h threshold
    expect(result.current.canReply).toBe(true);
    const before = result.current.msLeft!;

    act(() => {
      vi.advanceTimersByTime(5 * MINUTE);
    });

    expect(result.current.msLeft!).toBeLessThan(before);
  });

  it("flips to closed once the expiry passes, without a remount", () => {
    const expiresAt = isoIn(2 * MINUTE);
    const { result } = renderHook(() => useWhatsAppWindow(expiresAt));
    expect(result.current.canReply).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3 * MINUTE);
    });

    expect(result.current.state).toBe("closed");
    expect(result.current.canReply).toBe(false);
  });

  it("treats a null expiry as unknown and never blocks on it", () => {
    const { result } = renderHook(() => useWhatsAppWindow(null));

    expect(result.current.state).toBe("unknown");
    expect(result.current.canReply).toBe(true);
    expect(result.current.msLeft).toBeNull();
  });

  // ── The regression this hook's shape exists to prevent ────────────────────
  //
  // ChatPage is routed without a `key`, so switching conversations re-runs the
  // hook with a new `expiresAt` but does NOT remount. An earlier version only
  // ran its interval while there was something to count down — so on a null
  // or already-expired window no timer ran at all, `now` froze, and the next
  // conversation's expired window was measured against that stale clock.
  it("does not carry a stale clock across a conversation switch", () => {
    // Conversation A: unknown window, so nothing schedules a tick.
    const { result, rerender } = renderHook(
      ({ expiresAt }: { expiresAt: string | null }) =>
        useWhatsAppWindow(expiresAt),
      { initialProps: { expiresAt: null as string | null } },
    );
    expect(result.current.state).toBe("unknown");

    // The advisor works there for 20 minutes. Nothing refreshes any clock.
    act(() => {
      vi.advanceTimersByTime(20 * MINUTE);
    });

    // Conversation B, opened now, whose window expired 10 minutes ago.
    const expiredTenMinutesAgo = new Date(Date.now() - 10 * MINUTE).toISOString();
    rerender({ expiresAt: expiredTenMinutesAgo });

    // Measured against a 20-minute-old clock this reads as +10 min remaining,
    // and the composer would be enabled on a window Meta has already closed.
    expect(result.current.state).toBe("closed");
    expect(result.current.canReply).toBe(false);
  });

  it("recovers a live countdown when switching from a closed window to an open one", () => {
    const { result, rerender } = renderHook(
      ({ expiresAt }: { expiresAt: string | null }) =>
        useWhatsAppWindow(expiresAt),
      {
        initialProps: {
          expiresAt: new Date(Date.now() - MINUTE).toISOString() as string | null,
        },
      },
    );
    expect(result.current.state).toBe("closed");

    act(() => {
      vi.advanceTimersByTime(15 * MINUTE);
    });

    rerender({ expiresAt: isoIn(45 * MINUTE) });

    expect(result.current.state).toBe("closing");
    expect(result.current.canReply).toBe(true);
    // ~45 minutes, not 45 + the 15 that elapsed on the previous conversation.
    expect(result.current.msLeft!).toBeLessThanOrEqual(45 * MINUTE);
    expect(result.current.msLeft!).toBeGreaterThan(44 * MINUTE);
  });

  it("keeps ticking after the window closes, so the clock cannot freeze", () => {
    // The opposite of an earlier optimisation. Stopping the timer here is what
    // froze `now` and let a stale clock survive into the next conversation.
    const expiresAt = isoIn(MINUTE);
    const { result, rerender } = renderHook(
      ({ e }: { e: string | null }) => useWhatsAppWindow(e),
      { initialProps: { e: expiresAt as string | null } },
    );

    act(() => {
      vi.advanceTimersByTime(30 * MINUTE);
    });
    expect(result.current.state).toBe("closed");

    // A window that expired 5 minutes ago must still read as closed, not be
    // measured against whatever `now` held before this conversation opened.
    rerender({ e: new Date(Date.now() - 5 * MINUTE).toISOString() });
    expect(result.current.state).toBe("closed");
    expect(result.current.canReply).toBe(false);
  });
});
