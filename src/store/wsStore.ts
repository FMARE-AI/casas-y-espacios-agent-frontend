// Estado global del WebSocket con Zustand.

import { create } from 'zustand'
import type { WSStatus, WSAdvisorConnected, WSAdvisorStatusChanged, AdvisorOnline } from '../types'

interface WSState {
  status: WSStatus
  reconnectAttempt: number
  unreadAlerts: number
  pendingEscalation: {
    clientName: string
    reason: string
    conversationId: string
    advisorId: string | null
    channel: string
  } | null
  advisors: AdvisorOnline[]

  setStatus: (status: WSStatus) => void
  setReconnectAttempt: (attempt: number) => void
  incrementAlerts: () => void
  decrementAlerts: () => void
  resetAlerts: () => void
  setUnreadAlerts: (count: number) => void
  setPendingEscalation: (data: { clientName: string; reason: string; conversationId: string; advisorId: string | null; channel: string }) => void
  clearPendingEscalation: () => void
  setAdvisors: (advisors: AdvisorOnline[]) => void
  addConnectedAdvisor: (data: WSAdvisorConnected) => void
  removeConnectedAdvisor: (advisorId: string) => void
  updateAdvisorStatus: (data: WSAdvisorStatusChanged) => void
  incrementAdvisorConversations: (advisorId: string) => void
  decrementAdvisorConversations: (advisorId: string) => void
}

export const useWSStore = create<WSState>((set) => ({
  status: 'disconnected',
  reconnectAttempt: 0,
  unreadAlerts: 0,
  pendingEscalation: null,
  advisors: [],

  setStatus: (status) => set({ status }),
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt }),
  incrementAlerts: () => set((s) => ({ unreadAlerts: s.unreadAlerts + 1 })),
  decrementAlerts: () => set((s) => ({ unreadAlerts: Math.max(0, s.unreadAlerts - 1) })),
  resetAlerts: () => set({ unreadAlerts: 0 }),
  setUnreadAlerts: (unreadAlerts) => set({ unreadAlerts }),
  setPendingEscalation: (data) => set({ pendingEscalation: data }),
  clearPendingEscalation: () => set({ pendingEscalation: null }),

  setAdvisors: (advisors) => set({ advisors }),

  // advisor.connected → flip is_panel_connected; does NOT touch availability_status
  addConnectedAdvisor: (data) =>
    set((s) => ({
      advisors: s.advisors.map((a) =>
        a.id === data.advisor_id ? { ...a, is_panel_connected: true } : a
      ),
    })),

  // advisor.disconnected → flip is_panel_connected; does NOT touch availability_status
  removeConnectedAdvisor: (advisorId) =>
    set((s) => ({
      advisors: s.advisors.map((a) =>
        a.id === advisorId ? { ...a, is_panel_connected: false } : a
      ),
    })),

  // advisor.status_changed → only action that updates availability_status
  updateAdvisorStatus: (data) =>
    set((s) => ({
      advisors: s.advisors.map((a) =>
        a.id === data.advisor_id ? { ...a, availability_status: data.availability_status } : a
      ),
    })),

  incrementAdvisorConversations: (advisorId) =>
    set((s) => ({
      advisors: s.advisors.map((a) =>
        a.id === advisorId
          ? { ...a, active_conversations: Math.min((a.active_conversations ?? 0) + 1, a.max_conversations ?? 99) }
          : a
      ),
    })),

  decrementAdvisorConversations: (advisorId) =>
    set((s) => ({
      advisors: s.advisors.map((a) =>
        a.id === advisorId
          ? { ...a, active_conversations: Math.max(0, (a.active_conversations ?? 0) - 1) }
          : a
      ),
    })),
}))
