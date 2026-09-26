import { describe, it, expect } from 'vitest'
import { agentLabel, agentStyles, resolveAgent } from '../../lib/agentLabels'

describe('resolveAgent', () => {
  it('recognizes the two known agents', () => {
    expect(resolveAgent('administrative')).toBe('administrative')
    expect(resolveAgent('commercial')).toBe('commercial')
  })

  it('falls back to administrative for missing or unknown values', () => {
    // Conversations from before the dual-agent rollout never carry `agent` at
    // all — this fallback is what keeps their card/label rendering correct
    // instead of crashing on an undefined lookup.
    expect(resolveAgent(undefined)).toBe('administrative')
    expect(resolveAgent(null)).toBe('administrative')
    expect(resolveAgent('')).toBe('administrative')
    expect(resolveAgent('not-a-real-agent')).toBe('administrative')
  })
})

describe('agentLabel / agentStyles', () => {
  it('returns the Spanish label for each agent', () => {
    expect(agentLabel('administrative')).toBe('Administrativo')
    expect(agentLabel('commercial')).toBe('Comercial')
    expect(agentLabel(undefined)).toBe('Administrativo')
  })

  it('returns a distinct style per agent', () => {
    expect(agentStyles('administrative')).not.toBe(agentStyles('commercial'))
  })
})
