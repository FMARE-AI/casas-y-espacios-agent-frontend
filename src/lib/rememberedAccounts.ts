// Emails the user has successfully signed in with on THIS device, so the login
// form can offer them instead of making the user retype an address every time.
//
// Only the email is ever stored — never a password, never a token. Entries are
// written on a SUCCESSFUL sign-in only, so typos and failed attempts never end
// up in the list, and they deliberately survive logout: remembering the account
// is the whole point of the feature.

const STORAGE_KEY = 'panel_remembered_accounts'

// Enough to cover a shared machine with a couple of advisors without turning the
// login screen into a list.
const MAX_ACCOUNTS = 5

export interface RememberedAccount {
  email: string
  lastUsedAt: number
}

function isRememberedAccount(value: unknown): value is RememberedAccount {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<RememberedAccount>
  return typeof candidate.email === 'string' && typeof candidate.lastUsedAt === 'number'
}

// Every read tolerates absent, unparseable, or hand-edited storage: this is a
// convenience, and it must never be the reason the login screen fails to render.
export function listRememberedAccounts(): RememberedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(isRememberedAccount)
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, MAX_ACCOUNTS)
  } catch {
    // Unparseable JSON, or storage disabled entirely (private browsing, browser
    // set to block site data). Behave as if nothing was remembered.
    return []
  }
}

function write(accounts: RememberedAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.slice(0, MAX_ACCOUNTS)))
  } catch {
    // Quota or disabled storage — losing the convenience is acceptable, throwing
    // in the middle of a successful sign-in is not.
  }
}

// Case- and whitespace-insensitive: "Mariana@X.co " and "mariana@x.co" are the
// same account, and storing both would show the user a duplicate of themselves.
function normalize(email: string): string {
  return email.trim().toLowerCase()
}

export function rememberAccount(email: string): void {
  const normalized = normalize(email)
  if (!normalized) return

  const others = listRememberedAccounts().filter((a) => normalize(a.email) !== normalized)
  write([{ email: normalized, lastUsedAt: Date.now() }, ...others])
}

export function forgetAccount(email: string): void {
  const normalized = normalize(email)
  write(listRememberedAccounts().filter((a) => normalize(a.email) !== normalized))
}
