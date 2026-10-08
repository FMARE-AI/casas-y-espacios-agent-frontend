// 409 CLIENT_HAS_ACTIVE_CONVERSATION on PATCH /reopen.
//
// The client wrote again after the close, so the router already opened a new
// conversation for them — reopening the old one would leave two live rows and
// the router only ever delivers to one. The backend now names the live one in
// `detail.active_conversation` so the panel can take the advisor there instead
// of leaving her retrying the closed one (PROD 2026-10-08).

export interface ActiveConversationRef {
  id: string
  status: string | null
  /** true = the bot still has it, so the advisor's next step is take-control. */
  bot_activo: boolean
  case_number: string | null
}

/** The live conversation named by the 409, or null if absent/malformed. */
export function extractActiveConversation(err: unknown): ActiveConversationRef | null {
  const e = err as { response?: { data?: { detail?: { active_conversation?: unknown } } } }
  const raw = e?.response?.data?.detail?.active_conversation
  if (!raw || typeof raw !== 'object') return null

  const { id, status, bot_activo, case_number } = raw as Record<string, unknown>
  if (typeof id !== 'string' || id === '') return null

  return {
    id,
    status: typeof status === 'string' ? status : null,
    bot_activo: bot_activo === true,
    case_number: typeof case_number === 'string' && case_number !== '' ? case_number : null,
  }
}

/** Toast shown while the panel opens the live conversation instead. */
export function activeConversationNotice(active: ActiveConversationRef): string {
  const caseLabel = active.case_number ? ` (${active.case_number})` : ''
  const base = `El cliente volvió a escribir y ya tiene otra conversación abierta${caseLabel}. Le abrimos esa.`
  return active.bot_activo ? `${base} Para escribirle, tome el control desde ahí.` : base
}
