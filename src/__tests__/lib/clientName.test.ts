import { describe, it, expect } from 'vitest'
import { clientFirstName } from '../../lib/clientName'
import {
  windowClosedReason,
  windowCountdownHint,
  WINDOW_CLOSED_REASON,
} from '../../lib/whatsappWindow'

describe('clientFirstName', () => {
  it('returns the first name of a known client', () => {
    expect(clientFirstName('Carlos Alberto Rodríguez')).toBe('Carlos')
    expect(clientFirstName('  Ana  ')).toBe('Ana')
  })

  it('returns null when there is no name at all', () => {
    expect(clientFirstName(null)).toBeNull()
    expect(clientFirstName(undefined)).toBeNull()
    expect(clientFirstName('   ')).toBeNull()
  })

  it('rejects the generic placeholders the UI substitutes for a missing name', () => {
    // ChatPage/ConversationCard collapse a null full_name into these before the
    // value reaches a child component — treating them as real names would
    // produce "hasta que Cliente escriba de nuevo".
    expect(clientFirstName('Cliente')).toBeNull()
    expect(clientFirstName('desconocido')).toBeNull()
    expect(clientFirstName('Sin identificar')).toBeNull()
  })
})

describe('window copy with a client name', () => {
  it('addresses the client by first name when known', () => {
    expect(windowClosedReason('Carlos Rodríguez')).toContain(
      'hasta que Carlos escriba de nuevo',
    )
    expect(windowCountdownHint('Carlos Rodríguez')).toContain(
      'cuando Carlos escribe',
    )
  })

  it('falls back to the generic wording when the name is unknown', () => {
    expect(windowClosedReason(null)).toContain('hasta que el cliente escriba de nuevo')
    expect(windowClosedReason('Cliente')).toBe(WINDOW_CLOSED_REASON)
    expect(windowCountdownHint(undefined)).toContain('cuando el cliente escribe')
  })
})
