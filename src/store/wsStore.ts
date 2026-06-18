// Estado global del WebSocket con Zustand.

import { create } from 'zustand'
import type { WSStatus } from '../types'

interface WSState {
  status: WSStatus
  reconnectAttempt: number
  unreadAlerts: number

  setStatus: (status: WSStatus) => void
  setReconnectAttempt: (attempt: number) => void
  incrementAlerts: () => void
  resetAlerts: () => void
}

export const useWSStore = create<WSState>((set) => ({
  status: 'disconnected',
  reconnectAttempt: 0,
  unreadAlerts: 0,

  setStatus: (status) => set({ status }),
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt }),
  incrementAlerts: () => set((s) => ({ unreadAlerts: s.unreadAlerts + 1 })),
  resetAlerts: () => set({ unreadAlerts: 0 }),
}))
