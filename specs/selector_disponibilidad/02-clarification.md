# Clarifications: Selector de Disponibilidad

## Questions & Answers

**Q1: `date-fns-tz` no está instalado. ¿Instalar o usar alternativa?**
A: Usar `Intl.DateTimeFormat` nativo con `timeZone: 'America/Bogota'` — evita dependencia adicional. `date-fns@4.x` (instalado) también soporta timezone via `TZDate`, pero `Intl` es más simple para un format de hora único.

**Q2: `Advisor.status_until` no existe en `src/types/index.ts`. ¿Agregar como `string | null | undefined`?**
A: Sí. Agregar `status_until?: string | null` al interface `Advisor`. El backend puede no devolver el campo si está vacío, por eso `undefined` (campo opcional) + `null` (valor explícito vacío).

**Q3: `advisorsService.updateAvailability(status)` no acepta `minutes`. ¿Cambiar firma?**
A: Sí. Cambiar a `updateAvailability(status, minutesUntil?: number | null)` y pasar `{ availability_status: status, minutes_until: minutesUntil }` en el body. El backend ya tiene este campo según el spec de la feature.

**Q4: Al seleccionar `available`, ¿el timer se pasa como `null` o simplemente no se envía?**
A: Enviar `minutes_until: null` explícitamente cuando `status === 'available'`. Esto asegura que el backend limpie cualquier `status_until` previo.

**Q5: ¿El estado inicial de `selectedMinutes` debe ser `15` (default) o `null`?**
A: `15` como default cuando el advisor tiene `break` u `offline`. Cuando el advisor tiene `available` al cargar, `selectedMinutes` empieza en `null` para no mostrar timer pre-seleccionado. La lógica del `useEffect` de sincronización lo maneja: si `advisor.availability_status === 'available'`, `selectedMinutes = null`; si es `break`/`offline`, `selectedMinutes = 15`.

**Q6: El mockup muestra la sección "Mi Disponibilidad" dentro del `div` de badges (misma columna de texto). La spec dice "debajo de los badges, separado por border-t". ¿Cuál prevalece?**
A: El mockup. La sección va dentro de `div.text-center.sm:text-left.space-y-1` que contiene los badges, usando `mt-4 pt-4 border-t border-[#3A3A37]`. NO como sección hermana de la card de contraseña.

**Q7: ¿El botón "Aplicar" debe estar deshabilitado si no hay cambios respecto al estado actual?**
A: No. El spec no menciona este caso y agrega complejidad. El botón siempre está habilitado (solo se deshabilita con `isSavingStatus`).

**Q8: ¿Hay que manejar el error si `updateAvailability` falla?**
A: Sí, mostrar un toast de error o al menos no romper silenciosamente. Usar `sonner` (ya instalado en el proyecto) con `toast.error(...)`.

## Open Decisions

- Ninguna — todas las ambigüedades fueron resueltas con los hallazgos del código actual y el mockup.
