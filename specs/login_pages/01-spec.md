# Spec: Login Pages

## Problem
Los asesores de Casas y Espacios necesitan una pantalla de login corporativa y una pantalla de cambio de contraseña obligatoria (primer acceso) para autenticarse en el panel de atención. Actualmente los archivos son placeholders sin UI terminada ni lógica de autenticación conectada.

## Goals
- Implementar `LoginPage` con UI fiel al mockup (`screen-login`) y lógica de autenticación via Supabase Auth.
- Implementar `FirstLoginPage` con UI fiel al mockup (`screen-login-reset`), indicador de fortaleza en tiempo real y cambio de contraseña via Supabase Auth.

## Non-Goals
- No hay registro de nuevos usuarios (solo el Admin crea cuentas).
- No hay recuperación de contraseña con flujo propio (se delega a Supabase Auth / link externo).
- No se implementa lógica de redirección en estas páginas — eso lo maneja `ProtectedRoute`.
- No se modifican archivos fuera de `src/pages/LoginPage.tsx` y `src/pages/FirstLoginPage.tsx`.

## Expected Behavior

### LoginPage (`/login`)
1. El usuario ve un card centrado sobre fondo radial-gradient oscuro.
2. Llena email y contraseña con floating labels que suben al hacer focus o cuando hay valor.
3. Puede togglear la visibilidad del campo contraseña.
4. Puede marcar "Recordar sesión" (checkbox) y ver el link "¿Olvidó su contraseña?".
5. Al enviar el formulario, el botón muestra un spinner mientras autentica.
6. Si las credenciales son incorrectas, aparece un error banner genérico (sin especificar qué campo falló).
7. Si el login es exitoso, `useAuth` maneja la redirección automáticamente vía `onAuthStateChange`.

### FirstLoginPage (`/first-login`)
1. El usuario ve el mismo fondo que LoginPage con un card de cambio de contraseña.
2. Al escribir en "Nueva Contraseña", el indicador de fortaleza actualiza en tiempo real:
   - `< 6` chars → Débil (rojo `#FF5B5B`)
   - `6-9` chars → Media (amarillo `#FFB84D`)
   - `≥ 10` chars → Fuerte (verde `#00D4AA`)
3. Confirma la nueva contraseña; error inline si no coinciden.
4. Al enviar: actualiza contraseña via Supabase Auth, desmarca `isFirstLogin` en el store, navega a `/`.
5. Solo accesible si `isFirstLogin=true`; de lo contrario `ProtectedRoute` redirige a `/`.

## Constraints
- Stack: React 19 + TypeScript + Tailwind CSS v4 + Supabase + Zustand.
- Formularios: React Hook Form + Zod (ya instalados).
- Estilos: Tailwind classes + inline styles solo para el gradient (no admitido como utility en v4 con valores dinámicos).
- SVG del logo: copiar el path exacto del mockup, no recrear.
- Componentes auxiliares (ej: PasswordStrengthBar) como componentes locales dentro del mismo archivo, NO en `src/components/`.
- `npx tsc --noEmit` debe pasar sin errores.
- No importar librerías externas adicionales.

## Priority
Alta — son las páginas de entrada al sistema; sin ellas el flujo de autenticación no funciona.
