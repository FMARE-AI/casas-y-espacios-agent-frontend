# Implementation Plan: Login Pages

## Tasks

- [x] **Task 1**: Reescribir `LoginPage.tsx` — UI completa + lógica de auth — `src/pages/LoginPage.tsx`
- [x] **Task 2**: Reescribir `FirstLoginPage.tsx` — UI + PasswordStrengthBar + lógica — `src/pages/FirstLoginPage.tsx`
- [x] **Task 3**: Verificar `npx tsc --noEmit` sin errores

## Execution Log

### Task 1 — LoginPage
Status: ✅ Done
Notes:
- Spinner usa `formState.isSubmitting` (no `isLoading` del store) para precisión durante signIn.
- Ícono del toggle de password cambia entre ojo-abierto y ojo-tachado según estado.
- Ícono envelope posicionado con `top-1/2 -translate-y-1/2` para centrado vertical correcto.
- Error banner genérico sin especificar campo.
- Sin botón ni link de registro.

### Task 2 — FirstLoginPage
Status: ✅ Done
Notes:
- `PasswordStrengthBar` como componente local en el mismo archivo.
- `getStrength` como función pura local (no componente).
- `watch('newPassword') ?? ''` para evitar undefined en el indicador.
- Sin console.error en catch — si `updateUser` falla, el error se propaga y el formulario queda activo.

### Task 3 — TypeScript check
Status: ✅ Done
Notes: `npx tsc --noEmit` sin output = cero errores.
