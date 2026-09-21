// Turning a client's stored name into something a message can address them by.
//
// `Client.full_name` is nullable — a contact who never authenticated has no
// name at all — and several views collapse that null into a generic placeholder
// ("Cliente", "Desconocido", "Sin identificar") before the value reaches a
// child component. So "do we know this person's name?" cannot be answered by a
// truthiness check alone: the placeholder has to be rejected too, or a message
// ends up reading "hasta que Cliente escriba de nuevo".

const GENERIC_CLIENT_LABELS = new Set([
  "cliente",
  "desconocido",
  "sin identificar",
  "cliente no autenticado",
  "no identificado",
]);

/**
 * The client's first name, ready to be dropped into a sentence — or null when
 * we do not actually know it, in which case the caller should fall back to a
 * generic wording ("el cliente").
 *
 * First name only: these strings appear inline in short UI copy, where a full
 * legal name ("Carlos Alberto Rodríguez Peña") reads as noise.
 */
export function clientFirstName(name?: string | null): string | null {
  return clientDisplayName(name)?.split(/\s+/)[0] ?? null;
}

/**
 * The client's full name as stored, or null when we do not actually know it
 * (missing, blank, or one of the generic placeholders above). For labels where
 * the complete name is the point — the author line under an inbound bubble,
 * say — as opposed to inline copy, which reads better with the first name.
 */
export function clientDisplayName(name?: string | null): string | null {
  if (!name) return null;
  const clean = name.trim();
  if (!clean) return null;
  if (GENERIC_CLIENT_LABELS.has(clean.toLowerCase())) return null;
  return clean;
}
