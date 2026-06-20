# Clarifications: ScheduleManager

## Questions & Answers

**Q1: ¿El componente `ScheduleManager` recibe props o es completamente autónomo?**
A: Autónomo. Llama `schedulesService.list()` en su propio `useEffect` y gestiona su propio estado. No necesita datos del padre (`PerfilPage`), que ya tiene su propia lógica de carga del advisor.

**Q2: ¿Dónde se monta en PerfilPage — dentro o fuera de la card de datos del advisor?**
A: Fuera y debajo, como una segunda card independiente. El mockup muestra la card de intervalos (`id="schedules-card"`) separada de la card de información personal, dentro del mismo `max-w-xl` wrapper.

**Q3: ¿El skeleton de carga muestra ítems falsos o un spinner?**
A: El mockup no define un skeleton explícito para la lista, pero la spec pide uno. Se usarán 2 ítems placeholder con `animate-pulse`, consistente con `ProfileSkeleton` de PerfilPage.

**Q4: ¿La validación `fin > inicio` se aplica solo en horario del mismo día (sin cruzar medianoche)?**
A: Sí. La comparación de strings `data.startTime < data.endTime` (formato HH:MM) es suficiente para el caso de uso de la agencia (horario de oficina 08:00–18:00). No hay intervalos nocturnos.

**Q5: ¿Qué pasa si `schedulesService.create()` falla?**
A: Se muestra un toast de error con `toast.error(...)` (sonner ya instalado), y el modal permanece abierto para que el usuario pueda reintentar. No se agrega el ítem a la lista.

**Q6: ¿Qué pasa si `schedulesService.delete()` falla?**
A: Toast de error, el ítem NO desaparece de la lista (no se hace optimistic delete), y el modal de confirmación se cierra.

**Q7: ¿Los días se muestran siempre en orden L M X J V S D, independientemente del orden en `days_of_week`?**
A: Sí. La constante `DAYS` define el orden de renderizado. `days_of_week.includes(day.value)` determina si un día está activo, sin importar el orden del array del servidor.

**Q8: ¿El modal de agregar cierra con click fuera (backdrop)?**
A: Sí, igual que los modales de GestionPage — hay un overlay con `onClick` que cierra el modal.

## Open Decisions

Ninguna — todas las ambigüedades están resueltas con la información del mockup, el código existente y el CLAUDE.md.
