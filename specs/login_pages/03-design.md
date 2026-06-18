# Design: Login Pages

## Overview
Se reescriben `LoginPage.tsx` y `FirstLoginPage.tsx` para implementar las pantallas de autenticación del panel de Casas y Espacios. Ambas páginas son independientes del layout principal (sin sidebar), comparten el mismo fondo radial-gradient y un card centrado. La autenticación delega a Supabase Auth via `useAuth()` y el store Zustand. Las redirecciones post-login las maneja `ProtectedRoute`, no estas páginas.

## Components

### New / Modified Files
| File | Role | Change type |
|------|------|-------------|
| `src/pages/LoginPage.tsx` | Pantalla de login con floating labels, error banner y spinner | Rewrite |
| `src/pages/FirstLoginPage.tsx` | Pantalla de cambio de contraseña obligatorio con strength indicator | Rewrite |

### Key Abstractions

**`PasswordStrengthBar` (componente local en FirstLoginPage.tsx)**
- Responsabilidad: renderizar las 3 barras de fortaleza + texto
- Input: `password: string`
- Output: JSX con barras coloreadas según longitud
- Lógica: `len < 6 → Débil (#FF5B5B, 1 barra)`, `6-9 → Media (#FFB84D, 2 barras)`, `≥ 10 → Fuerte (#00D4AA, 3 barras)`, vacío → `No ingresada (#FF5B5B, 0 barras)`

**`LoginPage`**
- Estado local: `showPassword: boolean`, `showError: boolean`
- Hook: `useForm` con `zodResolver`, `useAuth` para `signIn`
- Spinner: `formState.isSubmitting` (no `isLoading` del store)

**`FirstLoginPage`**
- Estado: watch de `newPassword` para el strength indicator en tiempo real
- Hook: `useForm` + `useNavigate` + `useAuthStore` directo
- Submit: `supabase.auth.updateUser({ password })` → `authStore.setFirstLogin(false)` → `navigate('/')`

### Data Flow

#### LoginPage — submit exitoso:
1. Usuario llena email + password → submit
2. `handleSubmit` de RHF valida con Zod
3. `onSubmit` llama `signIn(email, password)`
4. Supabase Auth emite `SIGNED_IN` → `useAuth.onAuthStateChange` → `loadAdvisor()` → `store.setAdvisor()`
5. `ProtectedRoute` detecta sesión activa + `isFirstLogin` → redirige a `/` o `/first-login`

#### LoginPage — error de credenciales:
1. `signIn` lanza error → catch → `setShowError(true)`
2. Error banner visible con mensaje genérico

#### FirstLoginPage — submit:
1. Zod valida `newPassword` (min 8) y que `confirmPassword === newPassword`
2. `supabase.auth.updateUser({ password: data.newPassword })`
3. `authStore.setFirstLogin(false)`
4. `navigate('/')`

### API / Interface Contracts

```typescript
// LoginPage
const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})
type LoginFormData = z.infer<typeof schema>

// FirstLoginPage
const schema = z.object({
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine(
  (d) => d.newPassword === d.confirmPassword,
  { message: 'Las contraseñas no coinciden', path: ['confirmPassword'] }
)
type FirstLoginFormData = z.infer<typeof schema>
```

### Edge Cases & Error Handling
- **Credenciales incorrectas** → error banner genérico (no revelar cuál campo falló)
- **Error de Supabase en updateUser** → `console.error` + no navegar (el formulario queda activo para reintentar)
- **Fortaleza vacía** → mostrar "No ingresada" en rojo, 0 barras (transparentes)
- **Passwords no coinciden** → error inline bajo el campo `confirmPassword` via Zod
- **submit doble-click** → `isSubmitting=true` deshabilita el botón durante el request

### SVG Logo (LoginPage)
Paths exactos del mockup (no recrear):
```
Path 1: "M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H14V14H10V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
         stroke, strokeWidth=1.8, strokeLinecap/Join=round
Path 2: "M10 3V5C10 5.55228 10.4477 6 11 6H13C13.5523 6 14 5.55228 14 5V3"
         stroke, strokeWidth=1.8
```

### Floating Label Pattern
```css
/* input debe tener placeholder=" " (espacio) para activar peer-placeholder-shown */
input.peer + label {
  /* normal: encima del texto */
  transform: translateY(-0.75rem) scale(0.75);
}
/* cuando placeholder se muestra (campo vacío, sin focus) */
input.peer:placeholder-shown + label {
  transform: translateY(0) scale(1);
}
/* al hacer focus */
input.peer:focus + label {
  transform: translateY(-0.75rem) scale(0.75);
  color: #01A4E3;
}
```
En Tailwind: `peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#01A4E3]`

**Importante**: el label debe estar en el DOM DESPUÉS del input para que el selector `peer` funcione.

## Open Questions for Implementation
- Ninguna.
