// Hook to manage WebSocket connection and handle real-time events.
import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useWSStore } from '../store/wsStore'
import type {
  WSEscalationNew,
  WSAdvisorStatusChanged,
  WSBehaviorAlert,
  Message,
} from '../types'

// Global handlers registry to allow pages to hook into specific events without duplicate connections
interface WSHandlers {
  onEscalationNew?: (data: WSEscalationNew) => void
  onEscalationAssigned?: (data: { conversation_id: string; advisor_id: string }) => void
  onMessageNew?: (data: { conversation_id: string; message: Message }) => void
  onConversationReturned?: (data: { conversation_id: string }) => void
  onAdvisorStatusChanged?: (data: WSAdvisorStatusChanged) => void
  onBehaviorAlert?: (data: WSBehaviorAlert) => void
}

const _handlers: WSHandlers = {}


/**
 * Plays a pleasant double chime notification sound using the Web Audio API.
 * This guarantees a native browser notification chime without requiring external assets.
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const scheduleChimes = () => {
      const playChime = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, time)

        gain.gain.setValueAtTime(0.15, time)
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(time)
        osc.stop(time + duration)
      }

      const now = ctx.currentTime
      playChime(now, 587.33, 0.4)        // D5
      playChime(now + 0.12, 880, 0.5)   // A5
    }

    // AudioContext starts suspended in Chrome until a user gesture unlocks it
    if (ctx.state === 'suspended') {
      ctx.resume().then(scheduleChimes).catch(() => {})
    } else {
      scheduleChimes()
    }
  } catch (e) {
    console.error('Failed to play notification sound', e)
  }
}

export function useWebSocket(handlers?: WSHandlers) {
  const { token: accessToken } = useAuthStore()

  const setStatus = useWSStore((s) => s.setStatus)

  // Register and clean up handlers
  useEffect(() => {
    if (handlers) {
      if (handlers.onEscalationNew) _handlers.onEscalationNew = handlers.onEscalationNew
      if (handlers.onEscalationAssigned) _handlers.onEscalationAssigned = handlers.onEscalationAssigned
      if (handlers.onMessageNew) _handlers.onMessageNew = handlers.onMessageNew
      if (handlers.onConversationReturned) _handlers.onConversationReturned = handlers.onConversationReturned
      if (handlers.onAdvisorStatusChanged) _handlers.onAdvisorStatusChanged = handlers.onAdvisorStatusChanged
      if (handlers.onBehaviorAlert) _handlers.onBehaviorAlert = handlers.onBehaviorAlert
    }

    return () => {
      if (handlers) {
        if (handlers.onEscalationNew && _handlers.onEscalationNew === handlers.onEscalationNew) {
          delete _handlers.onEscalationNew
        }
        if (handlers.onEscalationAssigned && _handlers.onEscalationAssigned === handlers.onEscalationAssigned) {
          delete _handlers.onEscalationAssigned
        }
        if (handlers.onMessageNew && _handlers.onMessageNew === handlers.onMessageNew) {
          delete _handlers.onMessageNew
        }
        if (handlers.onConversationReturned && _handlers.onConversationReturned === handlers.onConversationReturned) {
          delete _handlers.onConversationReturned
        }
        if (handlers.onAdvisorStatusChanged && _handlers.onAdvisorStatusChanged === handlers.onAdvisorStatusChanged) {
          delete _handlers.onAdvisorStatusChanged
        }
        if (handlers.onBehaviorAlert && _handlers.onBehaviorAlert === handlers.onBehaviorAlert) {
          delete _handlers.onBehaviorAlert
        }
      }
    }
  }, [handlers])

  // TODO: integrate WebSocket /ws?token=
  useEffect(() => {
    setStatus('disconnected')
    return () => {}
  }, [accessToken, setStatus])

  const reconnect = useCallback(() => {
    // TODO: integrate WebSocket /ws?token=
  }, [])

  return { reconnect }
}
