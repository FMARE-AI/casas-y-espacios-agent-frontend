// Hook to manage WebSocket connection and handle real-time events.
import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useWSStore } from '../store/wsStore'
import type {
  WSEscalationNew,
  WSEvent,
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

let socket: WebSocket | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let isConnecting = false

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
  const { session } = useAuthStore()

  // Destructure individual slices to keep useEffect dependencies stable
  const setStatus = useWSStore((s) => s.setStatus)
  const setReconnectAttempt = useWSStore((s) => s.setReconnectAttempt)
  const setPendingEscalation = useWSStore((s) => s.setPendingEscalation)
  const incrementAlerts = useWSStore((s) => s.incrementAlerts)

  const accessToken = session?.access_token

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

  const handleEvent = useCallback((event: string, data: unknown) => {
    switch (event) {
      case 'escalation.new': {
        playNotificationSound()
        const payload = data as WSEscalationNew
        setPendingEscalation({
          clientName: payload.client_name,
          reason: payload.reason,
          conversationId: payload.conversation_id,
        })
        _handlers.onEscalationNew?.(payload)
        break
      }
      case 'escalation.assigned': {
        const payload = data as { conversation_id: string; advisor_id: string }
        _handlers.onEscalationAssigned?.(payload)
        break
      }
      case 'message.new': {
        const payload = data as { conversation_id: string; message: Message }
        _handlers.onMessageNew?.(payload)
        break
      }
      case 'conversation.returned': {
        const payload = data as { conversation_id: string }
        _handlers.onConversationReturned?.(payload)
        break
      }
      case 'advisor.status_changed': {
        const payload = data as WSAdvisorStatusChanged
        _handlers.onAdvisorStatusChanged?.(payload)
        break
      }
      case 'behavior.alert': {
        incrementAlerts()
        const payload = data as WSBehaviorAlert
        _handlers.onBehaviorAlert?.(payload)
        break
      }
      default:
        break
    }
  }, [setPendingEscalation, incrementAlerts])

  useEffect(() => {
    if (!accessToken) {
      if (socket) {
        socket.close()
        socket = null
      }
      setStatus('disconnected')
      return
    }

    function connect() {
      if (socket || isConnecting) return
      isConnecting = true
      setStatus('reconnecting')

      const rawUrl = import.meta.env.VITE_WS_BASE_URL || 'wss://casasyespaciosagent.up.railway.app/api/v1/panel/ws?token={jwt}'
      const url = rawUrl.replace('{jwt}', accessToken)

      try {
        const ws = new WebSocket(url)
        socket = ws

        ws.onopen = () => {
          isConnecting = false
          setStatus('connected')
          setReconnectAttempt(0)
        }

        ws.onmessage = (event) => {
          try {
            const parsed: WSEvent = JSON.parse(event.data)
            handleEvent(parsed.event, parsed.data)
          } catch (err) {
            console.error('Failed to parse WebSocket message', err)
          }
        }

        ws.onclose = () => {
          isConnecting = false
          socket = null
          setStatus('disconnected')

          // Read attempt directly from store to avoid adding it as a useEffect dependency
          // (which would bypass the backoff by re-running the effect on every increment)
          const attempt = useWSStore.getState().reconnectAttempt
          setReconnectAttempt(attempt + 1)
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000)

          if (reconnectTimeout) clearTimeout(reconnectTimeout)
          reconnectTimeout = setTimeout(() => {
            connect()
          }, delay)
        }

        ws.onerror = (err) => {
          console.error('WebSocket error occurred:', err)
          ws.close()
        }
      } catch (err) {
        isConnecting = false
        console.error('Failed to instantiate WebSocket connection:', err)
      }
    }

    connect()

    return () => {
      // Don't close connection on unmount to keep socket connection shared
    }
  }, [accessToken, setStatus, setReconnectAttempt, handleEvent])

  const reconnect = useCallback(() => {
    if (socket) {
      socket.close()
    } else {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      isConnecting = false
      const rawUrl = import.meta.env.VITE_WS_BASE_URL || 'wss://casasyespaciosagent.up.railway.app/api/v1/panel/ws?token={jwt}'
      const token = useAuthStore.getState().session?.access_token
      if (token) {
        const url = rawUrl.replace('{jwt}', token)
        try {
          socket = new WebSocket(url)
          socket.onopen = () => {
            isConnecting = false
            setStatus('connected')
            setReconnectAttempt(0)
          }
          socket.onmessage = (event) => {
            try {
              const parsed = JSON.parse(event.data) as WSEvent
              handleEvent(parsed.event, parsed.data)
            } catch (err) {
              console.error('Failed to parse WebSocket message during reconnect', err)
            }
          }
          socket.onclose = () => {
            isConnecting = false
            socket = null
            setStatus('disconnected')
          }
        } catch (err) {
          console.error('Manual reconnect failed:', err)
        }
      }
    }
  }, [setStatus, setReconnectAttempt, handleEvent])

  return { reconnect }
}
