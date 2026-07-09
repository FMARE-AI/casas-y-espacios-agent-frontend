# Spec: Avatar Upload

## Problem
Los asesores no tienen foto de perfil. El avatar en PerfilPage y en el Sidebar muestra iniciales de texto porque no hay mecanismo para subir una imagen. El botón cámara en PerfilPage es puramente estético.

## Goals
- Hacer funcional el botón cámara en PerfilPage para que el asesor pueda subir su foto
- Mostrar la foto en PerfilPage (sección de avatar grande)
- Mostrar la foto en el Sidebar (avatar pequeño junto al nombre)
- Persistir la URL en BD vía el campo `advisors.avatar_url` (ya existe)
- Mantener las iniciales como fallback cuando no hay foto

## Non-Goals
- Recorte o edición de la imagen (crop, resize en cliente)
- Soporte para GIF animados
- Subir avatar de otros asesores (solo el propio)
- Modificar el Sidebar en un archivo separado (sólo PerfilPage.tsx)

## Expected Behavior
1. El asesor hace clic en el botón cámara → se abre el file picker del OS
2. Solo acepta JPG, PNG, WEBP; cualquier otro tipo muestra `toast.error`
3. Archivos > 2MB muestran `toast.error` con mensaje descriptivo
4. Mientras sube: el botón muestra un spinner, está deshabilitado
5. Al completar: la foto aparece inmediatamente en PerfilPage
6. Al completar: la foto aparece en el Sidebar (reactivo via authStore)
7. Al refrescar la página: la foto se mantiene (viene del backend en `getMe()`)
8. Si no hay foto: se muestran las iniciales (comportamiento actual)

## Constraints
- Solo se modifica `src/pages/PerfilPage.tsx` — ningún otro archivo
- El bucket de Supabase Storage se lee desde `import.meta.env.VITE_SUPABASE_BUCKET_NAME`
- El upload usa el cliente Supabase del singleton `src/lib/supabase.ts`
- La URL se persiste via `advisorsService.updateMe({ avatar_url })` (PW-20 ya acepta este campo)
- El tipo `Advisor` necesita el campo `avatar_url: string | null` — se agrega en `src/types/index.ts`... pero el constraint dice solo PerfilPage.tsx. Por tanto `avatar_url` se accede con cast o el tipo ya lo tiene.
- `npx tsc --noEmit` debe pasar sin errores

## Priority
Alto — el campo en BD ya existe y la política de Storage ya fue aplicada. Solo falta el código frontend.
