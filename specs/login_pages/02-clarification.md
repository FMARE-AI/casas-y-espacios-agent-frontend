# Clarifications: Login Pages

## Questions & Answers

**Q1: ¿El `isLoading` de `useAuth()` cubre el estado de "autenticando" (durante `signIn`)?**
A: No directamente. `isLoading` del store refleja el estado inicial de carga de sesión (`getSession`). Durante `signIn`, no se setea `isLoading`. Para mostrar el spinner mientras se envía el formulario, se usará el `isSubmitting` de React Hook Form (`formState.isSubmitting`) en lugar de `isLoading` del store. Esto es más preciso y evita que el spinner aparezca en la carga inicial.

**Q2: El toggle de visibilidad del password — ¿debe cambiar el ícono entre ojo-abierto y ojo-tachado?**
A: Sí, es UX estándar y el mockup muestra el ícono de ojo. Se implementarán ambos estados (ojo abierto cuando `showPassword=false`, ojo tachado cuando `showPassword=true`).

**Q3: Los archivos ya tienen una implementación parcial. ¿Reemplazar completamente o parchear?**
A: Reemplazar. El usuario dijo "reemplazar placeholder". Se reescriben ambos archivos completamente para asegurar coherencia total con el mockup y los criterios de aceptación.

**Q4: ¿El checkbox "Recordar sesión" tiene lógica de persistencia real?**
A: No según el spec. Supabase gestiona la sesión internamente. El checkbox es solo visual (UI fiel al mockup) sin lógica adicional.

**Q5: ¿El link "¿Olvidó su contraseña?" debe hacer algo?**
A: No hay un flujo de recuperación implementado en esta feature. El link puede apuntar a `#` sin handler especial (el mockup tampoco define un flujo concreto para esta pantalla).

**Q6: ¿El padding del card es 32px (`p-8`) o puede variar en mobile?**
A: El spec dice "padding 32px". En mobile puede reducirse a `p-6` (como en el mockup: `p-6 sm:p-8`) para buena UX en pantallas pequeñas.

**Q7: ¿El `border-radius 12px` del card corresponde a qué clase Tailwind?**
A: `rounded-xl` = 12px en Tailwind v4. ✅

## Open Decisions
- Ninguna — todas las ambigüedades resueltas desde el contexto.
