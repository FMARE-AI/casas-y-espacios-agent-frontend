// An inbound image reaches the panel twice: message.new carries the raw Meta
// media ID as media_url (the backend only has the signed Storage URL after it
// downloads the file), and message.media_updated patches the real URL in a few
// seconds later. The bubble used to render an <img> against the raw ID, fail,
// and latch that failure in a boolean — so the advisor kept a grey placeholder
// until they reloaded the page, precisely on the turns where the bot is
// handling the chat and they are only watching.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import MessageBubble from '../../components/chat/MessageBubble'
import type { Message } from '../../types'

const RAW_MEDIA_ID = '2317659499000818'
const STORAGE_URL = 'https://supabase.example/storage/v1/object/sign/inbound/foto.jpg?token=abc'

function imageMessage(mediaUrl: string | null): Message {
  return {
    id: 'msg-1',
    conversation_id: 'conv-1',
    wam_id: 'wamid.ABC',
    direction: 'inbound',
    msg_type: 'image',
    content: 'la fuga del baño',
    media_url: mediaUrl,
    media_mime_type: 'image/jpeg',
    transcription: null,
    advisor_name: null,
    delivered_via: 'webhook_meta',
    timestamp: '2026-09-18T17:31:45.000Z',
    created_at: '2026-09-18T17:31:45.000Z',
  } as Message
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ImageBubble media_url lifecycle', () => {
  it('shows the placeholder instead of loading the raw Meta media ID', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<MessageBubble message={imageMessage(RAW_MEDIA_ID)} />)

    expect(screen.queryByRole('img', { name: /fuga/i })).toBeNull()
    // A raw ID is a known, expected state — not something to shout about.
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('renders the image once media_updated patches the signed URL in', () => {
    const { rerender } = render(<MessageBubble message={imageMessage(RAW_MEDIA_ID)} />)
    expect(screen.queryByRole('img', { name: /fuga/i })).toBeNull()

    rerender(<MessageBubble message={imageMessage(STORAGE_URL)} />)

    expect(screen.getByRole('img', { name: /fuga/i })).toHaveAttribute('src', STORAGE_URL)
  })

  it('recovers from a failed load when a new media_url arrives', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const stale = 'https://supabase.example/storage/v1/object/sign/inbound/stale.jpg?token=old'
    const { rerender } = render(<MessageBubble message={imageMessage(stale)} />)

    fireEvent.error(screen.getByRole('img', { name: /fuga/i }))
    expect(screen.queryByRole('img', { name: /fuga/i })).toBeNull()

    rerender(<MessageBubble message={imageMessage(STORAGE_URL)} />)

    expect(screen.getByRole('img', { name: /fuga/i })).toHaveAttribute('src', STORAGE_URL)
  })

  it('keeps the placeholder while the same failing URL is still in place', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { rerender } = render(<MessageBubble message={imageMessage(STORAGE_URL)} />)

    fireEvent.error(screen.getByRole('img', { name: /fuga/i }))
    rerender(<MessageBubble message={imageMessage(STORAGE_URL)} />)

    expect(screen.queryByRole('img', { name: /fuga/i })).toBeNull()
  })
})
