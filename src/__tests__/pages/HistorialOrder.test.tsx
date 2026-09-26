// The history table renders whatever order the paginated fetch returned. The
// backend only sorts by `last_activity` DESC and exposes no sort param, so the
// rows did not follow the "Fecha de Cierre" column the auditor actually reads.
// Sorting happens client-side over the full in-memory set — these tests pin the
// two parts that can silently regress: the direction, and the fallback for rows
// whose date is missing or unparseable (a NaN in the comparator would scramble
// the whole table, not just the bad row).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { Conversation } from '../../types'

const list = vi.fn()

vi.mock('../../services/conversations', () => ({
  conversationsService: {
    list: (...args: unknown[]) => list(...args),
  },
}))

import HistorialPage from '../../pages/HistorialPage'

type ClosedOverrides = {
  caseNumber: string
  closedAt: string | null
  lastActivity: string
}

function closedConversation({
  caseNumber,
  closedAt,
  lastActivity,
}: ClosedOverrides): Conversation {
  return {
    id: `conv-${caseNumber}`,
    status: 'cerrada',
    bot_activo: true,
    has_escalation_history: false,
    channel: 'administrativa',
    agent: 'administrative',
    last_activity: lastActivity,
    intent: 'cartera',
    client: {
      id: `cli-${caseNumber}`,
      phone_number: '+573001234567',
      bsuid: null,
      user_name: null,
      full_name: 'Carlos Rodríguez',
      document_id: null,
      client_type: 'propietario',
    },
    escalation: null,
    resolution_type: 'otro',
    resolution_notes: null,
    client_satisfied: 'sin_confirmar',
    closed_by: 'bot',
    closed_by_advisor: null,
    closed_at: closedAt,
    duration_seconds: 120,
    last_message: null,
    whatsapp_window_expires_at: null,
    unread_count: 0,
    priority: 'baja',
    case_number: caseNumber,
  } as Conversation
}

function renderHistorial() {
  return render(
    <MemoryRouter>
      <HistorialPage />
    </MemoryRouter>,
  )
}

// The case number is the first cell of every row, so reading it back in DOM
// order is the cheapest assertion on the rendered ordering.
async function renderedCaseNumbers(): Promise<string[]> {
  await waitFor(() => {
    expect(document.querySelectorAll('#history-table-body tr').length).toBeGreaterThan(0)
  })
  return Array.from(document.querySelectorAll('#history-table-body tr')).map(
    (row) => row.querySelector('td')?.textContent?.trim() ?? '',
  )
}

beforeEach(() => {
  list.mockReset()
})

describe('HistorialPage — closed conversations ordered newest first', () => {
  it('sorts by closing date descending regardless of the order the backend returned', async () => {
    list.mockResolvedValue({
      total: 3,
      conversations: [
        closedConversation({
          caseNumber: 'CE-0002',
          closedAt: '2026-09-10T10:00:00+00:00',
          lastActivity: '2026-09-10T10:00:00+00:00',
        }),
        closedConversation({
          caseNumber: 'CE-0003',
          closedAt: '2026-09-18T10:00:00+00:00',
          lastActivity: '2026-09-18T10:00:00+00:00',
        }),
        closedConversation({
          caseNumber: 'CE-0001',
          closedAt: '2026-09-02T10:00:00+00:00',
          lastActivity: '2026-09-02T10:00:00+00:00',
        }),
      ],
    })

    renderHistorial()

    expect(await renderedCaseNumbers()).toEqual(['CE-0003', 'CE-0002', 'CE-0001'])
  })

  it('falls back to last_activity when closed_at is null, and sinks unusable dates to the bottom', async () => {
    list.mockResolvedValue({
      total: 3,
      conversations: [
        // Known backend bug: a closed conversation can come back with a null
        // closed_at. The column renders last_activity for it, so the sort has
        // to read the same value or the row lands where its date isn't.
        closedConversation({
          caseNumber: 'CE-0011',
          closedAt: null,
          lastActivity: '2026-09-19T10:00:00+00:00',
        }),
        closedConversation({
          caseNumber: 'CE-0012',
          closedAt: 'not-a-date',
          lastActivity: 'not-a-date',
        }),
        closedConversation({
          caseNumber: 'CE-0013',
          closedAt: '2026-09-20T10:00:00+00:00',
          lastActivity: '2026-09-20T10:00:00+00:00',
        }),
      ],
    })

    renderHistorial()

    expect(await renderedCaseNumbers()).toEqual(['CE-0013', 'CE-0011', 'CE-0012'])
  })

  it('keeps the order after filtering', async () => {
    list.mockResolvedValue({
      total: 3,
      conversations: [
        closedConversation({
          caseNumber: 'CE-0021',
          closedAt: '2026-09-05T10:00:00+00:00',
          lastActivity: '2026-09-05T10:00:00+00:00',
        }),
        closedConversation({
          caseNumber: 'CE-0022',
          closedAt: '2026-09-15T10:00:00+00:00',
          lastActivity: '2026-09-15T10:00:00+00:00',
        }),
      ],
    })

    renderHistorial()
    await renderedCaseNumbers()

    const search = screen.getByPlaceholderText(/Buscar por cliente/i)
    search.focus()
    ;(search as HTMLInputElement).value = 'Carlos'
    search.dispatchEvent(new Event('input', { bubbles: true }))

    expect(await renderedCaseNumbers()).toEqual(['CE-0022', 'CE-0021'])
  })
})
