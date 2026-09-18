// The socket drops on its own often enough (a backgrounded/frozen tab, a wifi
// blip) that the 1–2s reconnect used to flash "Reconectando..." right when the
// advisor was reading the message that had just arrived. The banner now waits
// out that delay — display only, the socket's own reconnect logic is untouched.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'

import { WSStatusBanner } from '../../components/layout/ProtectedRoute'
import { useWSStore } from '../../store/wsStore'
import type { WSStatus } from '../../types'

const RECONNECTING_BANNER_DELAY_MS = 2500

describe('WSStatusBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useWSStore.setState({ status: 'connected' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderBanner = () => render(<WSStatusBanner onReconnect={() => {}} />)

  const setStatus = (status: WSStatus) => {
    act(() => {
      useWSStore.setState({ status })
    })
  }

  const advance = (ms: number) => {
    act(() => {
      vi.advanceTimersByTime(ms)
    })
  }

  it('stays hidden while a quick reconnect is in flight', () => {
    renderBanner()

    setStatus('reconnecting')
    advance(RECONNECTING_BANNER_DELAY_MS - 100)

    expect(screen.queryByText(/Reconectando/)).toBeNull()
  })

  it('never appears when the socket comes back before the delay', () => {
    renderBanner()

    setStatus('reconnecting')
    advance(1500)
    setStatus('connected')
    advance(5000)

    expect(screen.queryByText(/Reconectando/)).toBeNull()
  })

  it('appears when the reconnection really is taking long', () => {
    renderBanner()

    setStatus('reconnecting')
    advance(RECONNECTING_BANNER_DELAY_MS + 100)

    expect(screen.getByText(/Reconectando/)).toBeInTheDocument()
  })

  it('hides again as soon as the socket reconnects', () => {
    renderBanner()

    setStatus('reconnecting')
    advance(RECONNECTING_BANNER_DELAY_MS + 100)
    expect(screen.getByText(/Reconectando/)).toBeInTheDocument()

    setStatus('connected')
    expect(screen.queryByText(/Reconectando/)).toBeNull()
  })

  it('restarts the delay on a second drop instead of showing instantly', () => {
    renderBanner()

    setStatus('reconnecting')
    advance(RECONNECTING_BANNER_DELAY_MS + 100)
    setStatus('connected')
    setStatus('reconnecting')

    expect(screen.queryByText(/Reconectando/)).toBeNull()
    advance(RECONNECTING_BANNER_DELAY_MS + 100)
    expect(screen.getByText(/Reconectando/)).toBeInTheDocument()
  })

  it('shows the disconnected banner immediately — that one needs action', () => {
    renderBanner()

    setStatus('disconnected')

    expect(screen.getByText(/Sin conexión/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reconectar' })).toBeInTheDocument()
  })
})
