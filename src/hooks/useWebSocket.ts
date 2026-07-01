// Hook to manage WebSocket connection and handle real-time events.
import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useWSStore } from '../store/wsStore'
import { advisorsService } from '../services/advisors'
import { getValidToken } from '../lib/axios'
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
  Advisor,
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
// True once the current session's socket has completed at least one handshake.
// Used to tell apart "still opening the first connection" (quiet) from
// "a live connection just dropped" (alarming) — both used to share the same
// 'reconnecting' status, which flashed on every login.
let hasConnectedOnce = false
// Timestamp of the last pong received — the watchdog in startPing() closes the
// socket if the server stops answering, since a dead TCP connection can sit in
// readyState OPEN for a long time (until the OS notices) without this check.
let lastPongAt = 0
const PONG_TIMEOUT_MS = 45000
// Tracks which conversation the active advisor has open — used to gate message sounds
// and suppress unread badge increments for the chat currently visible.
let currentSubscribedConversationId: string | null = null
// Conversation IDs assigned to the current advisor — populated from BandejaPage on load
// and kept in sync via WS events. Allows sound to fire even when the chat is not open.
const myAssignedConversationIds = new Set<string>()

// Called by BandejaPage after loading conversations so the set stays in sync with the server.
// Replaces the entire set to avoid stale entries from filter/reload cycles.
export function setMyAssignedConversations(ids: string[]): void {
  myAssignedConversationIds.clear()
  ids.forEach((id) => myAssignedConversationIds.add(id))
}

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
  lastPongAt = Date.now()
  pingInterval = setInterval(() => {
    if (socket?.readyState !== WebSocket.OPEN) return

    if (Date.now() - lastPongAt > PONG_TIMEOUT_MS) {
      // No pong in 1.5 ping cycles — the network likely dropped without a close
      // frame (wifi/cable pulled, dead router). Force-close so onclose can flip
      // the status and start reconnecting, instead of sitting "connected" forever.
      socket.close()
      return
    }

    socket.send(JSON.stringify({ type: 'ping' }))
  }, 30000)
}

function sendMessage(payload: object): void {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload))
  }
}

// The browser fires 'offline' the instant it detects the OS has no network,
// which is much faster than waiting for the ping/pong watchdog to time out.
// Registered once at module load — this file is a singleton, never re-imported.
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    if (socket) {
      useWSStore.getState().setStatus('reconnecting')
      socket.close()
    }
  })

  window.addEventListener('online', () => {
    // Skip the remaining backoff delay and retry immediately once the network is back.
    if (socket || isConnecting) return
    const token = useAuthStore.getState().token
    if (!token) return
    clearReconnect()
    getValidToken().then((validToken) => {
      if (validToken) connect(validToken)
    }).catch(() => {})
  })
}

// Single teardown path for the module-singleton socket — used both when a
// session ends (no reconnect wanted) and when swapping to a new token.
function closeSocket(): void {
  clearPing()
  clearReconnect()
  if (socket) socket.close()
  socket = null
  connectedToken = null
  isConnecting = false
}

function connect(token: string): void {
  if (socket || isConnecting) return

  connectedToken = token
  isConnecting = true

  // Only the "recovering from a live drop" case deserves the alarming
  // 'reconnecting' banner. A first-time handshake (fresh login, or the retry
  // loop before it has ever succeeded) shows the quiet 'connecting' status instead.
  if (!hasConnectedOnce) {
    useWSStore.getState().setStatus('connecting')
  }

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
    const wasReconnecting = useWSStore.getState().reconnectAttempt > 0
    hasConnectedOnce = true
    useWSStore.getState().setStatus('connected')
    useWSStore.getState().setReconnectAttempt(0)
    startPing()

    if (wasReconnecting) {
      // Sync advisor state after backend restart or network drop
      advisorsService.getMe()
        .then(({ advisor }) => useAuthStore.getState().setAdvisor(advisor))
        .catch(() => {})
      advisorsService.getOnline()
        .then((advisors) => useWSStore.getState().setAdvisors(advisors))
        .catch(() => {})
    }
  }

  ws.onmessage = (event: MessageEvent) => {
    let parsed: { event?: string; type?: string; data?: unknown }
    try {
      parsed = JSON.parse(event.data as string)
    } catch {
      return
    }

    if (parsed.type === 'pong') {
      lastPongAt = Date.now()
      return
    }

    const { event: eventType, data } = parsed
    if (!eventType) return

    switch (eventType) {
      case 'advisor.connected':
        useWSStore.getState().addConnectedAdvisor(data as WSAdvisorConnected)
        break

      case 'advisor.disconnected':
        useWSStore.getState().removeConnectedAdvisor((data as WSAdvisorDisconnected).advisor_id)
        break

      case 'advisor.status_changed': {
        const statusData = data as WSAdvisorStatusChanged
        useWSStore.getState().updateAdvisorStatus(statusData)

        // If the backend job changed the current user's status, mirror it in authStore
        // so the sidebar/header indicator updates without requiring a page reload.
        const currentAdvisor = useAuthStore.getState().advisor
        if (currentAdvisor && currentAdvisor.id === statusData.advisor_id) {
          useAuthStore.getState().setAdvisor({
            ...currentAdvisor,
            availability_status: statusData.availability_status,
          })
        }

        if (_handlers.onAdvisorStatusChanged) {
          _handlers.onAdvisorStatusChanged(statusData)
        }
        break
      }

      case 'message.new': {
        // Defensive: backend may send conversation_id at data root instead of inside message
        const raw = data as WSMessageNew & { conversation_id?: string; unread_count?: number }
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

        // Sound rules:
        // - Admin: never sounds (audit-only role in Phase 1)
        // - Asesor: sounds if the message is inbound AND the conversation belongs to them.
        //   "Belongs" means either the chat is open OR the conversation is in
        //   myAssignedConversationIds (populated from BandejaPage + WS lifecycle events).
        //   This lets assigned advisors hear sounds even when navigated away from the chat.
        const { advisor } = useAuthStore.getState()
        const isAdmin = advisor?.role === 'admin'
        const convId = normalizedMsg.message.conversation_id
        const isChatOpen = convId === currentSubscribedConversationId
        const isMyConversation = isChatOpen || myAssignedConversationIds.has(convId)

        if (!isAdmin && normalizedMsg.message.direction === 'inbound' && isMyConversation) {
          playNotificationSound()
        }

        // Update unread badge on bandeja only when advisor is NOT in that chat
        if (
          normalizedMsg.message.direction === 'inbound' &&
          conversationId !== currentSubscribedConversationId
        ) {
          window.dispatchEvent(
            new CustomEvent('conversation:unread', {
              detail: { conversationId, unreadCount: raw.unread_count },
            })
          )
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
        const advisor = useAuthStore.getState().advisor
        const eligible = isEligibleForEscalation(advisor, escData)

        if (eligible) {
          playNotificationSound()
          // Feed the EscalationToast via wsStore — same eligibility gate as the sound.
          useWSStore.getState().setPendingEscalation({
            clientName: escData.channel,
            reason: escData.reason ?? '',
            conversationId: escData.conversation_id,
            advisorId: escData.advisor_id,
            channel: escData.channel,
          })
        }

        // Bandeja queue counts are cross-area info, not a personal signal — always refresh.
        if (_handlers.onEscalationNew) {
          _handlers.onEscalationNew(escData)
        }
        break
      }

      case 'escalation.assigned': {
        const assignedData = data as WSEscalationAssigned
        useWSStore.getState().incrementAdvisorConversations(assignedData.advisor_id)
        // Keep the sound-gate set in sync: when this advisor is assigned, add the conversation
        const selfId = useAuthStore.getState().advisor?.id
        if (selfId && assignedData.advisor_id === selfId) {
          myAssignedConversationIds.add(assignedData.conversation_id)
        }
        if (_handlers.onEscalationAssigned) {
          _handlers.onEscalationAssigned(assignedData)
        }
        break
      }

      case 'conversation.returned': {
        const returnedData = data as WSConversationReturned
        useWSStore.getState().decrementAdvisorConversations(returnedData.advisor_id)
        myAssignedConversationIds.delete(returnedData.conversation_id)
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
        myAssignedConversationIds.delete(closedData.conversation_id)
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

    // Session intentionally ended (logout, or blocked pending confirmation) —
    // do not reconnect. Without this guard, a socket closed explicitly by the
    // connection effect (session end) would reopen itself via this same
    // onclose handler moments later, since the refresh_token can still be
    // present (e.g. ADVISOR_INACTIVE keeps it until the user confirms).
    const { refresh_token, sessionExpired } = useAuthStore.getState()
    if (!refresh_token || sessionExpired) {
      useWSStore.getState().setStatus('disconnected')
      return
    }

    const attempt = useWSStore.getState().reconnectAttempt
    // A drop after a live connection is always alarming. Before the first
    // successful handshake, give it a couple of quiet retries (e.g. a token
    // race right after login) before treating it as a real problem too.
    const shouldAlarm = hasConnectedOnce || attempt >= 2
    useWSStore.getState().setStatus(shouldAlarm ? 'reconnecting' : 'connecting')
    useWSStore.getState().setReconnectAttempt(attempt + 1)

    const delay = getBackoffDelay(attempt)
    // L-03: use getValidToken() instead of reading the raw token from state.
    // This refreshes the AT if it's expired before reconnecting, avoiding a
    // 4001 close that would force the user back to the login screen unnecessarily.
    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null
      getValidToken().then((token) => {
        if (token) connect(token)
      }).catch(() => {})
    }, delay)
  }

  ws.onerror = () => {
    // onclose fires automatically after onerror — nothing else needed
  }
}

// Scope rule for escalation.new (sound + toast): admin never; if already
// assigned, only the assigned advisor; if queued, any advisor whose area
// matches the channel (or 'ambas'), has capacity, and is available.
function isEligibleForEscalation(advisor: Advisor | null, escData: WSEscalationNew): boolean {
  if (!advisor || advisor.role === 'admin') return false

  if (escData.advisor_id !== null) {
    return advisor.id === escData.advisor_id
  }

  return (
    (advisor.area === escData.channel || advisor.area === 'ambas') &&
    advisor.active_conversations < advisor.max_conversations &&
    advisor.availability_status === 'available'
  )
}

// I-01: Singleton AudioContext — browsers cap concurrent contexts (~6 in Chrome).
// Creating a new one per notification can silently drop sounds under heavy load.
let _audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null
    if (!_audioCtx || _audioCtx.state === 'closed') {
      _audioCtx = new AudioContextClass()
    }
    return _audioCtx
  } catch {
    return null
  }
}

/**
 * Plays a pleasant double chime notification sound using the Web Audio API.
 * This guarantees a native browser notification chime without requiring external assets.
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

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
  const sessionExpired = useAuthStore((s) => s.sessionExpired)
  const setStatus = useWSStore((s) => s.setStatus)

  // M-03: track each handler function individually instead of the whole object.
  // Passing `handlers` (an object literal) as a single dep re-runs this effect on
  // every render because a new object reference is created each time. Destructuring
  // individual function refs means the effect only fires when a specific handler changes.
  const {
    onEscalationNew,
    onEscalationAssigned,
    onMessageNew,
    onConversationReturned,
    onConversationClosed,
    onQueuePending,
    onAdvisorStatusChanged,
    onBehaviorAlert,
  } = handlers ?? {}

  useEffect(() => {
    if (onEscalationNew)      _handlers.onEscalationNew      = onEscalationNew
    if (onEscalationAssigned) _handlers.onEscalationAssigned = onEscalationAssigned
    if (onMessageNew)         _handlers.onMessageNew         = onMessageNew
    if (onConversationReturned) _handlers.onConversationReturned = onConversationReturned
    if (onConversationClosed) _handlers.onConversationClosed = onConversationClosed
    if (onQueuePending)       _handlers.onQueuePending       = onQueuePending
    if (onAdvisorStatusChanged) _handlers.onAdvisorStatusChanged = onAdvisorStatusChanged
    if (onBehaviorAlert)      _handlers.onBehaviorAlert      = onBehaviorAlert

    return () => {
      if (onEscalationNew      && _handlers.onEscalationNew      === onEscalationNew)      delete _handlers.onEscalationNew
      if (onEscalationAssigned && _handlers.onEscalationAssigned === onEscalationAssigned) delete _handlers.onEscalationAssigned
      if (onMessageNew         && _handlers.onMessageNew         === onMessageNew)         delete _handlers.onMessageNew
      if (onConversationReturned && _handlers.onConversationReturned === onConversationReturned) delete _handlers.onConversationReturned
      if (onConversationClosed && _handlers.onConversationClosed === onConversationClosed) delete _handlers.onConversationClosed
      if (onQueuePending       && _handlers.onQueuePending       === onQueuePending)       delete _handlers.onQueuePending
      if (onAdvisorStatusChanged && _handlers.onAdvisorStatusChanged === onAdvisorStatusChanged) delete _handlers.onAdvisorStatusChanged
      if (onBehaviorAlert      && _handlers.onBehaviorAlert      === onBehaviorAlert)      delete _handlers.onBehaviorAlert
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    onEscalationNew, onEscalationAssigned, onMessageNew, onConversationReturned,
    onConversationClosed, onQueuePending, onAdvisorStatusChanged, onBehaviorAlert,
  ])

  // Open / reopen connection when the session changes; close it whenever
  // there is no valid session (no token, or blocked pending confirmation).
  useEffect(() => {
    if (!accessToken || sessionExpired) {
      setStatus('disconnected')
      closeSocket()
      hasConnectedOnce = false
      return
    }

    // Socket already open for this token — nothing to do
    if (socket && connectedToken === accessToken) return

    // Token changed — tear down old socket and reconnect
    closeSocket()
    connect(accessToken)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, sessionExpired])

  const reconnect = useCallback(() => {
    if (useAuthStore.getState().sessionExpired) return
    const token = useAuthStore.getState().token
    if (!token) return
    closeSocket()
    connect(token)
  }, [])

  const subscribeConversation = useCallback((conversationId: string) => {
    currentSubscribedConversationId = conversationId
    sendMessage({ type: 'subscribe_conversation', conversation_id: conversationId })
  }, [])

  const unsubscribeConversation = useCallback(() => {
    currentSubscribedConversationId = null
    sendMessage({ type: 'unsubscribe_conversation' })
  }, [])

  return { reconnect, subscribeConversation, unsubscribeConversation }
}
