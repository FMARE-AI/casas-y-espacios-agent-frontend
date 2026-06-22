# Implementation Plan: Avatar Upload

## Tasks

- [x] **Task 1**: Agregar `avatar_url: string | null` a la interfaz `Advisor` — `src/types/index.ts`
- [x] **Task 2**: Agregar `avatar_url?` al payload de `updateMe` en `advisorsService` — `src/services/advisors.ts`
- [x] **Task 3**: Implementar `AdvisorAvatar` + lógica de upload + render en PerfilPage — `src/pages/PerfilPage.tsx`
- [x] **Task 4**: Verificar `npx tsc --noEmit` sin errores

## Execution Log

### Task 1 — Agregar avatar_url al tipo Advisor
Status: ✅ Done
Notes: Campo agregado en la interfaz `Advisor` entre `status_until` e `is_active`.

### Task 2 — Agregar avatar_url al payload de updateMe
Status: ✅ Done
Notes: Solo se extendió el tipo del payload — el servicio no necesita cambios lógicos.

### Task 3 — PerfilPage: AdvisorAvatar + upload handler + render
Status: ✅ Done
Notes: 
- Componente `AdvisorAvatar` local antes de las constantes de availability
- `STORAGE_BUCKET` lee de `import.meta.env.VITE_SUPABAS_BUCKET_NAME`
- `handleAvatarUpload`: valida tipo + tamaño → `supabase.storage.upload` (upsert) → `getPublicUrl` → `advisorsService.updateMe({ avatar_url })` → estado local
- Sin llamada directa a `supabase.from('advisors')`
- `fileInputRef` + `uploadingAvatar` state agregados al componente
- Botón cámara existente recibe `onClick`, `disabled` y spinner condicional

### Task 4 — Type check
Status: ✅ Done
Notes: `npx tsc --noEmit` salió con código 0, sin errores.

## Pendiente de verificación
El upload a Storage no puede probarse con mock login porque el cliente Supabase no tiene sesión real (la sesión mock vive solo en Zustand). El código es correcto — se prueba end-to-end cuando el backend esté conectado y los usuarios entren con credenciales reales de Supabase Auth.
