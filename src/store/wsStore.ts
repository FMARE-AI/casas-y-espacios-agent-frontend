// Estado global del WebSocket con Zustand.

import { create } from 'zustand'
import type { WSStatus } from '../types'

interface WSState {
  status: WSStatus
  reconnectAttempt: number
  unreadAlerts: number
  pendingEscalation: {
    clientName: string
    reason: string
    conversationId: string
  } | null

  setStatus: (status: WSStatus) => void
  setReconnectAttempt: (attempt: number) => void
  incrementAlerts: () => void
  decrementAlerts: () => void
  resetAlerts: () => void
  setPendingEscalation: (data: {
    clientName: string
    reason: string
    conversationId: string
  }) => void
  clearPendingEscalation: () => void
}

export const useWSStore = create<WSState>((set) => ({
  status: 'disconnected',
  reconnectAttempt: 0,
  unreadAlerts: 0,
  pendingEscalation: null,

  setStatus: (status) => set({ status }),
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt }),
  incrementAlerts: () => set((s) => ({ unreadAlerts: s.unreadAlerts + 1 })),
  decrementAlerts: () => set((s) => ({ unreadAlerts: Math.max(0, s.unreadAlerts - 1) })),
  resetAlerts: () => set({ unreadAlerts: 0 }),
  setPendingEscalation: (data) => set({ pendingEscalation: data }),
  clearPendingEscalation: () => set({ pendingEscalation: null }),
}))
