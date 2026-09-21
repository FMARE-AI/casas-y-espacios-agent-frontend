import { describe, it, expect } from 'vitest'
import {
  getWhatsAppWindow,
  formatWindowCountdown,
  WINDOW_WARNING_MS,
} from '../../lib/whatsappWindow'

const NOW = Date.parse('2026-09-20T12:00:00.000Z')
const at = (msFromNow: number) => new Date(NOW + msFromNow).toISOString()

const HOUR = 60 * 60 * 1000

describe('getWhatsAppWindow', () => {
  it('treats null as unknown and still allows replying', () => {
    // The trap this whole module exists for: every conversation created before
    // the feature shipped arrives as null. Reading it as closed would lock the
    // entire inbox.
    expect(getWhatsAppWindow(null, NOW)).toEqual({
      state: 'unknown',
      canReply: true,
      msLeft: null,
    })
  })

  it('treats undefined and unparseable instants as unknown, never closed', () => {
    expect(getWhatsAppWindow(undefined, NOW).state).toBe('unknown')
    expect(getWhatsAppWindow('not-a-date', NOW).state).toBe('unknown')
    expect(getWhatsAppWindow('not-a-date', NOW).canReply).toBe(true)
  })

  it('reports an open window well ahead of the warning threshold', () => {
    const info = getWhatsAppWindow(at(20 * HOUR), NOW)
    expect(info.state).toBe('open')
    expect(info.canReply).toBe(true)
    expect(info.msLeft).toBe(20 * HOUR)
  })

  it('switches to closing at 2 hours remaining, inclusive', () => {
    expect(getWhatsAppWindow(at(WINDOW_WARNING_MS + 1), NOW).state).toBe('open')
    expect(getWhatsAppWindow(at(WINDOW_WARNING_MS), NOW).state).toBe('closing')
    expect(getWhatsAppWindow(at(HOUR), NOW).state).toBe('closing')
    expect(getWhatsAppWindow(at(HOUR), NOW).canReply).toBe(true)
  })

  it('closes the window at the expiry instant and after it', () => {
    expect(getWhatsAppWindow(at(0), NOW)).toEqual({
      state: 'closed',
      canReply: false,
      msLeft: 0,
    })
    expect(getWhatsAppWindow(at(-HOUR), NOW).canReply).toBe(false)
  })

  it('does not care about recent activity — only the expiry instant', () => {
    // A conversation whose last message arrived seconds ago can still be about
    // to expire: only the client's INBOUND messages reset Meta's clock.
    expect(getWhatsAppWindow(at(3 * 60 * 1000), NOW).state).toBe('closing')
  })
})

describe('formatWindowCountdown', () => {
  it('formats hours and minutes', () => {
    expect(formatWindowCountdown(3 * HOUR + 12 * 60 * 1000)).toBe('3 h 12 min')
    expect(formatWindowCountdown(2 * HOUR)).toBe('2 h')
  })

  it('formats sub-hour values in minutes', () => {
    expect(formatWindowCountdown(47 * 60 * 1000)).toBe('47 min')
  })

  it('never shows a bare 0 while time is still left', () => {
    expect(formatWindowCountdown(30 * 1000)).toBe('menos de 1 min')
    expect(formatWindowCountdown(0)).toBe('0 min')
  })
})
