# Design: Avatar Upload

## Overview
Se extiende `PerfilPage.tsx` para hacer funcional el botón cámara existente. El asesor selecciona una imagen, se valida en cliente (tipo + tamaño), se sube a Supabase Storage con `upsert: true`, se obtiene la URL pública, y se persiste vía `advisorsService.updateMe({ avatar_url })`. El avatar renderizado pasa a usar un componente local `AdvisorAvatar` que muestra `<img>` si hay URL o las iniciales si no. Se agrega `avatar_url` al tipo `Advisor` en `src/types/index.ts` para TypeScript.

## Components

### New / Modified Files
| File | Role | Change type |
|------|------|-------------|
| `src/pages/PerfilPage.tsx` | Lógica de upload + componente `AdvisorAvatar` + render del avatar | Modify |
| `src/types/index.ts` | Agregar `avatar_url: string \| null` a la interfaz `Advisor` | Modify |

### Key Abstractions

**`AdvisorAvatar` (componente local en PerfilPage.tsx)**
- Props: `{ avatarUrl: string | null, fullName: string, size: 'sm' | 'md' | 'lg' }`
- Si `avatarUrl` → renderiza `<img>` con border `border-[#01A4E3]`
- Si no → renderiza el `<div>` con iniciales (comportamiento actual)
- Size map: `lg` = `w-20 h-20 text-lg` (PerfilPage), `sm`/`md` reservados para usos futuros

**`handleAvatarUpload` (función async en PerfilPage)**
- Recibe `React.ChangeEvent<HTMLInputElement>`
- Valida: tipo en `['image/jpeg','image/png','image/webp']`, tamaño ≤ 2MB
- Sube a `casas-y-espacios-media` (bucket) path `avatars/${advisor.id}.${ext}` con `upsert: true`
- Obtiene `getPublicUrl(path).data.publicUrl`
- Llama `advisorsService.updateMe({ avatar_url: publicUrl })`
- Actualiza estado local: `setAdvisor(prev => prev ? { ...prev, avatar_url: publicUrl } : prev)`
- Estado de carga: `uploadingAvatar` (boolean)

### Data Flow
1. Usuario hace clic en botón cámara → `fileInputRef.current?.click()`
2. OS abre file picker filtrado a `image/jpeg,image/png,image/webp`
3. `onChange` dispara `handleAvatarUpload`
4. Validación cliente: tipo y tamaño → `toast.error` si falla, early return
5. `setUploadingAvatar(true)` → spinner en botón
6. `supabase.storage.from(BUCKET).upload(path, file, { upsert: true })`
7. `supabase.storage.from(BUCKET).getPublicUrl(path)` → `publicUrl`
8. `advisorsService.updateMe({ avatar_url: publicUrl })` → PATCH `/api/v1/panel/advisors/me`
9. `setAdvisor(prev => { ...prev, avatar_url: publicUrl })`
10. `setUploadingAvatar(false)`, `e.target.value = ''` (permite re-seleccionar el mismo archivo)

### API / Interface Contracts

```typescript
// Cambio en src/types/index.ts
interface Advisor {
  // ... campos existentes ...
  avatar_url: string | null   // NUEVO
}

// Cambio en advisorsService.updateMe payload (solo el tipo, no el servicio)
// El backend ya acepta avatar_url en PW-20
updateMe(payload: {
  full_name?: string
  current_password?: string
  new_password?: string
  avatar_url?: string          // NUEVO — se pasa directamente
}): Promise<{ advisor: Advisor }>
```

```
Supabase Storage:
  Bucket: import.meta.env.VITE_SUPABAS_BUCKET_NAME  (typo intencional del .env)
  Path:   avatars/${advisor.id}.${ext}
  Opts:   { upsert: true, contentType: file.type }
  Public: sí (política ya aplicada en BD)
```

### Edge Cases & Error Handling
- Tipo inválido → `toast.error('Solo se permiten imágenes JPG, PNG o WEBP')`, early return
- Tamaño > 2MB → `toast.error('La imagen no debe superar 2MB')`, early return
- `uploadError` en Supabase → `toast.error('No se pudo subir la imagen')`, finally limpia estado
- `advisor` es `null` cuando se llama → guard `if (!file || !advisor) return` (advisor puede ser null si loadProfile no terminó)
- `e.target.value = ''` en finally → permite seleccionar el mismo archivo dos veces

## Open Questions for Implementation
- Ninguna.
