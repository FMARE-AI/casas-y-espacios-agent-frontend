// Hook to manage WebSocket connection and handle real-time events.
import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useWSStore } from '../store/wsStore'
import type {
  WSEscalationNew,
  WSEscalationAssigned,
  WSMessageNew,
  WSConversationReturned,
  WSConversationClosed,
  WSQueuePending,
  WSAdvisorStatusChanged,
  WSAdvisorConnected,
  WSAdvisorDisconnected,
  WSBehaviorAlertEvent,
} from '../types'

// Global handlers registry to allow pages to hook into specific events without duplicate connections
interface WSHandlers {
  onEscalationNew?: (data: WSEscalationNew) => void
  onEscalationAssigned?: (data: WSEscalationAssigned) => void
  onMessageNew?: (data: WSMessageNew) => void
  onConversationReturned?: (data: WSConversationReturned) => void
  onConversationClosed?: (data: WSConversationClosed) => void
  onQueuePending?: (data: WSQueuePending) => void
  onAdvisorStatusChanged?: (data: WSAdvisorStatusChanged) => void
  onBehaviorAlert?: (data: WSBehaviorAlertEvent) => void
}

const _handlers: WSHandlers = {}

// Module-level singletons — exactly one socket active at any time
let socket: WebSocket | null = null
let connectedToken: string | null = null
let isConnecting = false
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null

const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 30000]

function getBackoffDelay(attempt: number): number {
  return BACKOFF_DELAYS[Math.min(attempt, BACKOFF_DELAYS.length - 1)]
}

function clearPing() {
  if (pingInterval !== null) {
    clearInterval(pingInterval)
    pingInterval = null
  }
}

function clearReconnect() {
  if (reconnectTimeout !== null) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
}

function startPing() {
  clearPing()
  pingInterval = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }))
    }
  }, 30000)
}

function sendMessage(payload: object): void {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload))
  }
}

function connect(token: string): void {
  if (socket || isConnecting) return

  connectedToken = token
  isConnecting = true

  const wsBaseEnv: string | undefined = import.meta.env.VITE_WS_BASE_URL
  const apiUrl: string = import.meta.env.VITE_API_URL || 'https://casasyespaciosagent.up.railway.app'
  let wsOrigin: string
  if (wsBaseEnv) {
    try {
      wsOrigin = new URL(wsBaseEnv).origin
    } catch {
      wsOrigin = apiUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
    }
  } else {
    wsOrigin = apiUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
  }
  const url = `${wsOrigin}/api/v1/panel/ws?token=${encodeURIComponent(token)}`

  const ws = new WebSocket(url)
  socket = ws

  ws.onopen = () => {
    isConnecting = false
    useWSStore.getState().setStatus('connected')
    useWSStore.getState().setReconnectAttempt(0)
    startPing()
  }

  ws.onmessage = (event: MessageEvent) => {
    let parsed: { event?: string; type?: string; data?: unknown }
    try {
      parsed = JSON.parse(event.data as string)
    } catch {
      return
    }

    // Ignore pong frames
    if (parsed.type === 'pong') return

    const { event: eventType, data } = parsed
    if (!eventType) return

    switch (eventType) {
      case 'advisor.connected':
        useWSStore.getState().addConnectedAdvisor(data as WSAdvisorConnected)
        break

      case 'advisor.disconnected':
        useWSStore.getState().removeConnectedAdvisor((data as WSAdvisorDisconnected).advisor_id)
        break

      case 'advisor.status_changed':
        useWSStore.getState().updateAdvisorStatus(data as WSAdvisorStatusChanged)
        if (_handlers.onAdvisorStatusChanged) {
          _handlers.onAdvisorStatusChanged(data as WSAdvisorStatusChanged)
        }
        break

      case 'message.new': {
        // Defensive: backend may send conversation_id at data root instead of inside message
        const raw = data as WSMessageNew & { conversation_id?: string }
        const conversationId =
          raw.message?.conversation_id ?? raw.conversation_id ?? ''

        if (!raw.message?.id) {
          console.warn('[WS] message.new received with missing message.id — dropping', raw)
          break
        }
        if (!conversationId) {
          console.warn('[WS] message.new received with no conversation_id — dropping', raw)
          break
        }

        const normalizedMsg: WSMessageNew = {
          message: {
            ...raw.message,
            conversation_id: conversationId,
            // Fields absent from the inbound WS payload — default to null
            transcription: raw.message.transcription ?? null,
            advisor_name: raw.message.advisor_name ?? null,
          },
        }

        // Sound only for inbound messages (client → advisor)
        // outbound_advisor and outbound_bot are silent
        if (normalizedMsg.message.direction === 'inbound') {
          playNotificationSound()
        }
        if (_handlers.onMessageNew) {
          _handlers.onMessageNew(normalizedMsg)
        } else {
          console.debug('[WS] message.new received but no onMessageNew handler registered', normalizedMsg.message.conversation_id)
        }
        break
      }

      case 'escalation.new': {
        const escData = data as WSEscalationNew
        playNotificationSound()
        if (_handlers.onEscalationNew) {
          _handlers.onEscalationNew(escData)
        }
        // Feed the EscalationToast via wsStore
        useWSStore.getState().setPendingEscalation({
          clientName: escData.channel,
          reason: escData.reason ?? '',
          conversationId: escData.conversation_id,
        })
        break
      }

      case 'escalation.assigned': {
        const assignedData = data as WSEscalationAssigned
        useWSStore.getState().incrementAdvisorConversations(assignedData.advisor_id)
        if (_handlers.onEscalationAssigned) {
          _handlers.onEscalationAssigned(assignedData)
        }
        break
      }

      case 'conversation.returned': {
        const returnedData = data as WSConversationReturned
        useWSStore.getState().decrementAdvisorConversations(returnedData.advisor_id)
        if (_handlers.onConversationReturned) {
          _handlers.onConversationReturned(returnedData)
        }
        break
      }

      case 'conversation.closed': {
        const closedData = data as WSConversationClosed
        if (closedData.advisor_id) {
          useWSStore.getState().decrementAdvisorConversations(closedData.advisor_id)
        }
        if (_handlers.onConversationClosed) {
          _handlers.onConversationClosed(closedData)
        }
        break
      }

      case 'queue.pending':
        if (_handlers.onQueuePending) {
          _handlers.onQueuePending(data as WSQueuePending)
        }
        break

      case 'behavior.alert':
        if (_handlers.onBehaviorAlert) {
          _handlers.onBehaviorAlert(data as WSBehaviorAlertEvent)
        }
        break

      default:
        break
    }
  }

  ws.onclose = (event: CloseEvent) => {
    clearPing()
    isConnecting = false
    socket = null
    connectedToken = null

    if (event.code === 4001) {
      useWSStore.getState().setStatus('disconnected')
      useAuthStore.getState().setSessionExpired(true)
      return
    }

    useWSStore.getState().setStatus('reconnecting')
    const attempt = useWSStore.getState().reconnectAttempt
    useWSStore.getState().setReconnectAttempt(attempt + 1)

    const delay = getBackoffDelay(attempt)
    const currentToken = useAuthStore.getState().token
    if (currentToken) {
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null
        connect(currentToken)
      }, delay)
    }
  }

  ws.onerror = () => {
    // onclose fires automatically after onerror — nothing else needed
  }
}

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
  const accessToken = useAuthStore((s) => s.token)
  const setStatus = useWSStore((s) => s.setStatus)

  // Register and clean up handlers
  useEffect(() => {
    if (handlers) {
      if (handlers.onEscalationNew) _handlers.onEscalationNew = handlers.onEscalationNew
      if (handlers.onEscalationAssigned) _handlers.onEscalationAssigned = handlers.onEscalationAssigned
      if (handlers.onMessageNew) _handlers.onMessageNew = handlers.onMessageNew
      if (handlers.onConversationReturned) _handlers.onConversationReturned = handlers.onConversationReturned
      if (handlers.onConversationClosed) _handlers.onConversationClosed = handlers.onConversationClosed
      if (handlers.onQueuePending) _handlers.onQueuePending = handlers.onQueuePending
      if (handlers.onAdvisorStatusChanged) _handlers.onAdvisorStatusChanged = handlers.onAdvisorStatusChanged
      if (handlers.onBehaviorAlert) _handlers.onBehaviorAlert = handlers.onBehaviorAlert
    }

    return () => {
      if (handlers) {
        if (handlers.onEscalationNew && _handlers.onEscalationNew === handlers.onEscalationNew) delete _handlers.onEscalationNew
        if (handlers.onEscalationAssigned && _handlers.onEscalationAssigned === handlers.onEscalationAssigned) delete _handlers.onEscalationAssigned
        if (handlers.onMessageNew && _handlers.onMessageNew === handlers.onMessageNew) delete _handlers.onMessageNew
        if (handlers.onConversationReturned && _handlers.onConversationReturned === handlers.onConversationReturned) delete _handlers.onConversationReturned
        if (handlers.onConversationClosed && _handlers.onConversationClosed === handlers.onConversationClosed) delete _handlers.onConversationClosed
        if (handlers.onQueuePending && _handlers.onQueuePending === handlers.onQueuePending) delete _handlers.onQueuePending
        if (handlers.onAdvisorStatusChanged && _handlers.onAdvisorStatusChanged === handlers.onAdvisorStatusChanged) delete _handlers.onAdvisorStatusChanged
        if (handlers.onBehaviorAlert && _handlers.onBehaviorAlert === handlers.onBehaviorAlert) delete _handlers.onBehaviorAlert
      }
    }
  }, [handlers])

  // Open / reopen connection when token changes
  useEffect(() => {
    if (!accessToken) {
      setStatus('disconnected')
      return
    }

    // Socket already open for this token — nothing to do
    if (socket && connectedToken === accessToken) return

    // Token changed — tear down old socket and reconnect
    if (socket) {
      clearPing()
      clearReconnect()
      socket.close()
      socket = null
      connectedToken = null
      isConnecting = false
    }

    connect(accessToken)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const reconnect = useCallback(() => {
    const token = useAuthStore.getState().token
    if (!token) return
    clearReconnect()
    if (socket) {
      clearPing()
      socket.close()
      socket = null
      isConnecting = false
    }
    connect(token)
  }, [])

  const subscribeConversation = useCallback((conversationId: string) => {
    sendMessage({ type: 'subscribe_conversation', conversation_id: conversationId })
  }, [])

  const unsubscribeConversation = useCallback(() => {
    sendMessage({ type: 'unsubscribe_conversation' })
  }, [])

  return { reconnect, subscribeConversation, unsubscribeConversation }
}
