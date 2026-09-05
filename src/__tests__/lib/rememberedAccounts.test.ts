import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  listRememberedAccounts,
  rememberAccount,
  forgetAccount,
} from '../../lib/rememberedAccounts'

const STORAGE_KEY = 'panel_remembered_accounts'

describe('rememberedAccounts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('rememberAccount', () => {
    it('remembers an email so the login form can offer it', () => {
      rememberAccount('mariana@casasyespacios.co')

      expect(listRememberedAccounts().map((a) => a.email)).toEqual([
        'mariana@casasyespacios.co',
      ])
    })

    it('puts the most recently used account first', () => {
      rememberAccount('first@x.co')
      rememberAccount('second@x.co')
      rememberAccount('first@x.co')

      expect(listRememberedAccounts().map((a) => a.email)).toEqual([
        'first@x.co',
        'second@x.co',
      ])
    })

    // Otherwise the user is shown two entries that are visibly the same account.
    it('treats casing and surrounding whitespace as the same account', () => {
      rememberAccount('Mariana@Casasyespacios.CO')
      rememberAccount('  mariana@casasyespacios.co  ')

      expect(listRememberedAccounts().map((a) => a.email)).toEqual([
        'mariana@casasyespacios.co',
      ])
    })

    it('keeps the list short, dropping the least recently used', () => {
      for (let i = 1; i <= 7; i++) rememberAccount(`user${i}@x.co`)

      const emails = listRememberedAccounts().map((a) => a.email)
      expect(emails).toHaveLength(5)
      expect(emails[0]).toBe('user7@x.co')
      expect(emails).not.toContain('user1@x.co')
    })

    it('ignores a blank email', () => {
      rememberAccount('   ')

      expect(listRememberedAccounts()).toHaveLength(0)
    })
  })

  describe('forgetAccount', () => {
    it('removes only the named account', () => {
      rememberAccount('keep@x.co')
      rememberAccount('drop@x.co')

      forgetAccount('drop@x.co')

      expect(listRememberedAccounts().map((a) => a.email)).toEqual(['keep@x.co'])
    })

    it('matches regardless of casing', () => {
      rememberAccount('drop@x.co')

      forgetAccount('DROP@X.CO')

      expect(listRememberedAccounts()).toHaveLength(0)
    })
  })

  // The login screen must render no matter what is in storage — this is a
  // convenience, never a reason to fail.
  describe('resilience', () => {
    it('returns an empty list when nothing was ever stored', () => {
      expect(listRememberedAccounts()).toEqual([])
    })

    it('survives unparseable storage', () => {
      localStorage.setItem(STORAGE_KEY, 'not json{{{')

      expect(listRememberedAccounts()).toEqual([])
    })

    it('survives storage holding the wrong shape', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: 'a@x.co' }))

      expect(listRememberedAccounts()).toEqual([])
    })

    it('drops malformed entries but keeps the valid ones', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([
        { email: 'good@x.co', lastUsedAt: 2 },
        { email: 'no-timestamp@x.co' },
        null,
        'garbage',
      ]))

      expect(listRememberedAccounts().map((a) => a.email)).toEqual(['good@x.co'])
    })

    it('survives storage being unavailable entirely', () => {
      const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage disabled')
      })
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage disabled')
      })

      expect(listRememberedAccounts()).toEqual([])
      expect(() => rememberAccount('a@x.co')).not.toThrow()
      expect(() => forgetAccount('a@x.co')).not.toThrow()

      getItem.mockRestore()
      setItem.mockRestore()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
})
