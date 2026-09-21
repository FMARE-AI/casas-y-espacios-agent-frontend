// Display labels for `resolution_type` (docs/panel_api_reference.md § PATCH /close).
// Single source of truth: the close modal builds its options from this map and
// every read-only view (historial, exports) renders through it.
export const RESOLUTION_LABELS: Record<string, string> = {
  consulta_cartera_resuelta: "Consulta de cartera resuelta",
  pago_acordado: "Pago acordado / registrado",
  orden_mantenimiento_creada: "Orden de mantenimiento creada",
  queja_pqrs_registrada: "Queja / PQRS registrada",
  informacion_contrato_entregada: "Información de contrato entregada",
  derivado_otro_canal: "Derivado a otro canal",
  sin_respuesta_cliente: "Cliente no respondió",
  consulta_resuelta_confirmada: "Cliente confirmó la resolución",
  ventana_vencida: "Ventana de 24 h vencida",
  otro: "Otro",
};

/**
 * What an advisor may pick when closing manually. `ventana_vencida` is excluded
 * on purpose: only the backend job sets it, when Meta's 24h window runs out.
 */
export const SELECTABLE_RESOLUTIONS: readonly string[] = [
  "consulta_cartera_resuelta",
  "pago_acordado",
  "orden_mantenimiento_creada",
  "queja_pqrs_registrada",
  "informacion_contrato_entregada",
  "derivado_otro_canal",
  "sin_respuesta_cliente",
  "otro",
];

export function resolutionLabel(resolutionType: string | null): string | null {
  if (!resolutionType) return null;
  return RESOLUTION_LABELS[resolutionType] ?? resolutionType;
}
