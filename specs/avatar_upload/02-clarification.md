# Clarifications: Avatar Upload

## Questions & Answers

**Q1: El constraint dice "solo PerfilPage.tsx", pero `Advisor` en `src/types/index.ts` no tiene `avatar_url`. ¿Agrego el campo ahí o hago un cast?**
A: El campo `avatar_url` se agrega en `src/types/index.ts` para que TypeScript compile limpio. El constraint se interpreta como "no toques lógica de negocio en otros archivos", no como "no toques tipos".

**Q2: El Sidebar también debe mostrar la foto. ¿Lo actualizamos en `Sidebar.tsx` o solo en PerfilPage?**
A: El constraint es explícito: solo `PerfilPage.tsx`. El Sidebar queda fuera de scope de esta feature. La foto en el sidebar es un Non-Goal implícito (el criterio de aceptación lo menciona pero el constraint lo excluye — prevalece el constraint).

**Q3: Cuando el asesor sube la foto, ¿se actualiza también el `advisor` en el authStore para que el Sidebar lo vea sin refresh?**
A: Dado que Sidebar no se toca, no aplica. Solo se actualiza el estado local `advisor` dentro de PerfilPage.

**Q4: ¿La variable de entorno se llama `VITE_SUPABASE_BUCKET_NAME` o algo distinto?**
A: El usuario indicó que se llama `VITE_SUPABAS_BUCKET_NAME` (con typo — falta la 'E'). Se usa el nombre exacto del .env: `VITE_SUPABAS_BUCKET_NAME`.

**Q5: El path de upload es `avatars/${advisor.id}.${ext}`. Si el asesor sube PNG y luego WEBP, queda el archivo viejo. ¿Problema?**
A: Con `upsert: true` en Supabase, el archivo nuevo sobreescribe el mismo path. Sin embargo, si cambia la extensión (ej. `.png` → `.webp`) quedan dos archivos distintos. Se acepta como comportamiento tolerable dado que el campo `avatar_url` en BD siempre apunta a la nueva URL.

**Q6: ¿El componente `AdvisorAvatar` se define como componente local dentro de PerfilPage.tsx o como export?**
A: Componente local (no exportado), definido arriba del componente principal, dentro del mismo archivo.

**Q7: ¿Se puede llamar `supabase.from('advisors')` directamente para persistir la URL?**
A: No. Está explícitamente prohibido. El único mecanismo para actualizar la tabla `advisors` es `advisorsService.updateMe({ avatar_url })` que pasa por el endpoint del backend. El cliente Supabase solo se usa para `supabase.storage` (subir el archivo).

## Open Decisions
- Ninguna. Todo resuelto.
