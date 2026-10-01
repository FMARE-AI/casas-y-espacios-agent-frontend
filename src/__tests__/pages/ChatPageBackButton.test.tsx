// "Volver" used to be a bare navigate(-1). A tab opened straight on /chat/{id}
// — the WhatsApp escalation notification's button, the escalation email, a
// pasted link — has nothing of the panel behind it, so the click did nothing at
// all. With no panel history it now lands where the conversation lives: the
// historial for a closed one, the bandeja otherwise.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import type { Conversation } from '../../types'

const ADVISOR_ID = 'adv-1'
const CONVERSATION_ID = 'conv-1'

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    subscribeConversation: vi.fn(),
    unsubscribeConversation: vi.fn(),
  }),
  consumePendingTransferReason: () => null,
}))

vi.mock('../../components/chat/AudioRecorder', () => ({
  default: () => null,
}))

const getById = vi.fn()

vi.mock('../../services/conversations', () => ({
  conversationsService: {
    getById: (...args: unknown[]) => getById(...args),
    getMessages: vi.fn().mockResolvedValue({ messages: [], total: 0 }),
    markAsSeen: vi.fn().mockResolvedValue({ unread_count: 0 }),
  },
}))

import ChatPage from '../../pages/ChatPage'
import { useAuthStore } from '../../store/authStore'

function conversation(status: 'cerrada' | 'escalada'): Conversation {
  const closed = status === 'cerrada'
  return {
    id: CONVERSATION_ID,
    status,
    bot_activo: false,
    has_escalation_history: true,
    channel: 'administrativa',
    agent: 'administrative',
    last_activity: new Date().toISOString(),
    intent: 'cartera',
    client: {
      id: 'cli-1',
      phone_number: '+573001234567',
      bsuid: null,
      user_name: null,
      full_name: 'Carlos Rodríguez',
      document_id: null,
      client_type: 'propietario',
    },
    escalation: {
      id: 'esc-1',
      reason: 'solicitud_usuario',
      summary: null,
      escalated_at: new Date().toISOString(),
      advisor: { id: ADVISOR_ID, full_name: 'Ana Gómez' },
    },
    resolution_type: closed ? 'otro' : null,
    resolution_notes: null,
    client_satisfied: null,
    closed_by: closed ? 'asesor' : null,
    closed_by_advisor: null,
    closed_at: closed ? new Date().toISOString() : null,
    duration_seconds: null,
    last_message: null,
    whatsapp_window_expires_at: null,
    unread_count: 0,
    priority: 'media',
    case_number: 'CE-0001',
  } as Conversation
}

function renderChat(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      <Routes>
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path="/" element={<div>bandeja</div>} />
        <Route path="/historial" element={<div>historial</div>} />
        <Route path="/contactos" element={<div>contactos</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// BrowserRouter stores the entry index in history.state.idx; MemoryRouter does
// not touch window.history, so each test sets the value the real tab would have.
function setBrowserHistoryIndex(idx: number | null) {
  window.history.replaceState(idx === null ? null : { idx }, '')
}

async function clickBack() {
  const button = await screen.findByRole('button', { name: /volver/i })
  await waitFor(() => expect(getById).toHaveBeenCalled())
  fireEvent.click(button)
}

beforeEach(() => {
  getById.mockReset()
  useAuthStore.setState({
    advisor: {
      id: ADVISOR_ID,
      full_name: 'Ana Gómez',
      email: 'ana@example.com',
      role: 'asesor',
      area: 'administrativa',
      max_conversations: 3,
      active_conversations: 1,
      availability_status: 'available',
      is_active: true,
      avatar_url: null,
      must_change_password: false,
    },
    role: 'asesor',
  })
})

afterEach(() => {
  setBrowserHistoryIndex(null)
})

describe('ChatPage — Volver with no panel history behind the tab', () => {
  it('sends a closed conversation to the historial', async () => {
    setBrowserHistoryIndex(0)
    getById.mockResolvedValue({
      conversation: conversation('cerrada'),
      messages: [],
      total_messages: 0,
    })

    renderChat([`/chat/${CONVERSATION_ID}`])
    await clickBack()

    expect(await screen.findByText('historial')).toBeInTheDocument()
  })

  it('sends an open conversation to the bandeja', async () => {
    setBrowserHistoryIndex(0)
    getById.mockResolvedValue({
      conversation: conversation('escalada'),
      messages: [],
      total_messages: 0,
    })

    renderChat([`/chat/${CONVERSATION_ID}`])
    await clickBack()

    expect(await screen.findByText('bandeja')).toBeInTheDocument()
  })

  it('treats a missing history.state (first entry) as no panel history', async () => {
    setBrowserHistoryIndex(null)
    getById.mockResolvedValue({
      conversation: conversation('cerrada'),
      messages: [],
      total_messages: 0,
    })

    renderChat([`/chat/${CONVERSATION_ID}`])
    await clickBack()

    expect(await screen.findByText('historial')).toBeInTheDocument()
  })
})

describe('ChatPage — Volver with panel history', () => {
  it('still goes back to wherever the advisor came from', async () => {
    setBrowserHistoryIndex(1)
    getById.mockResolvedValue({
      conversation: conversation('cerrada'),
      messages: [],
      total_messages: 0,
    })

    // Came from Contactos, not the historial: back must honour that.
    renderChat(['/contactos', `/chat/${CONVERSATION_ID}`])
    await clickBack()

    expect(await screen.findByText('contactos')).toBeInTheDocument()
  })
})
