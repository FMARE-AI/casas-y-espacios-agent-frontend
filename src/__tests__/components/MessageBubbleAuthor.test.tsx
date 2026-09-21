// The author line under an inbound bubble used to read a hardcoded "Cliente".
// The conversation knows who wrote it whenever the client is identified, so the
// label shows the real name — and still falls back to "Cliente" for the
// contacts that have none, including the pages that pass their own placeholder
// down instead of the raw full_name.
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import MessageBubble from '../../components/chat/MessageBubble'
import type { Message } from '../../types'

function inboundText(): Message {
  return {
    id: 'msg-1',
    conversation_id: 'conv-1',
    wam_id: 'wamid.ABC',
    direction: 'inbound',
    msg_type: 'text',
    content: 'Buenas, ¿me confirman el pago?',
    media_url: null,
    media_mime_type: null,
    transcription: null,
    advisor_name: null,
    delivered_via: 'webhook_meta',
    timestamp: '2026-09-18T17:31:45.000Z',
    created_at: '2026-09-18T17:31:45.000Z',
  } as Message
}

describe('inbound bubble author label', () => {
  it('shows the client full name when it is known', () => {
    render(<MessageBubble message={inboundText()} clientName="Carlos Rodríguez" />)
    expect(screen.getByText(/Carlos Rodríguez/)).toBeInTheDocument()
    expect(screen.queryByText(/• Cliente$/)).toBeNull()
  })

  it('falls back to "Cliente" when the contact has no name', () => {
    render(<MessageBubble message={inboundText()} clientName={null} />)
    expect(screen.getByText(/Cliente/)).toBeInTheDocument()
  })

  it('does not echo a generic placeholder back as if it were a name', () => {
    render(<MessageBubble message={inboundText()} clientName="Desconocido" />)
    expect(screen.queryByText(/Desconocido/)).toBeNull()
    expect(screen.getByText(/Cliente/)).toBeInTheDocument()
  })
})
