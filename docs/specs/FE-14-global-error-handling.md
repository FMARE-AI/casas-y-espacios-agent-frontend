# FE-14 — Global Error Handling & Toast System

## Objetivo

Centralizar el manejo de errores HTTP en un único interceptor de Axios y extender el sistema de toasts para soportar múltiples tipos de notificación (éxito, error, advertencia, información) con una cola concurrente.

Antes de esta tarea cada página manejaba sus errores de forma ad-hoc. Después, cualquier error del backend produce la respuesta visual correcta de forma automática, sin lógica duplicada en los componentes.

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/lib/axios.ts` | Interceptor completo; desacoplado del toastStore vía CustomEvent |
| `src/store/authStore.ts` | Nuevo estado `blockedModal` para modales bloqueantes |
| `src/store/toastStore.ts` | Cola de toasts (`Toast[]`); eliminado `blockedModal` |
| `src/store/wsStore.ts` | Nuevo campo `suppressedEscalationId` para supresión persistente |
| `src/components/shared/ToastStack.tsx` | Renderizado de cola; bridge CustomEvent→store; botón de cierre |
| `src/components/shared/SessionExpiredModal.tsx` | Selectores finos; `try/finally`; lee `blockedModal` de authStore |
| `src/components/shared/EscalationToast.tsx` | `matchPath`; supresión persistente con suppressedId |

---

## Mapa de errores globales

El interceptor en `src/lib/axios.ts` maneja los siguientes casos automáticamente. Los componentes **no necesitan** capturar estos errores.

### Sin respuesta (red, timeout, CORS)

→ Toast error "Sin conexión. Verifica tu conexión a internet."

### 401 — Sesión expirada

→ `clearSession()` + evento `session-expired` → `SessionExpiredModal`

### 403 — Acceso denegado

| Código | Comportamiento |
|---|---|
| `ADVISOR_INACTIVE` | Modal bloqueante "Tu cuenta ha sido desactivada" + logout al confirmar |
| `FORBIDDEN` | Toast error "No tienes permiso para realizar esta acción." |
| `CONVERSATION_OUTSIDE_AREA` | Toast warning "Esta conversación no pertenece a tu área." |
| `BOT_IS_ACTIVE` | Toast warning "El bot tiene el control de esta conversación." |
| `NOT_ASSIGNED` | Toast warning "No estás asignado a esta conversación." |
| `BOT_ALREADY_ACTIVE` | Toast info "El bot ya controla esta conversación." |
| `CANNOT_EDIT_YOURSELF` | Toast warning "No puedes editar tu propio perfil desde esta sección." |
| *(otro código)* | Toast error con `detail.message` del backend o "Acceso denegado." |

### 404 — Recurso no encontrado

**No interceptado globalmente.** Los 404 son dependientes del contexto — un componente puede esperar un 404 como estado válido (recurso inexistente). El componente decide cómo mostrarlo.

### 409 — Conflicto

| Código | Comportamiento |
|---|---|
| `ALREADY_ASSIGNED` | Toast warning "Otro asesor tomó esta conversación primero." |
| `MAX_CONVERSATIONS_REACHED` | Toast warning con el mensaje exacto del backend (incluye X/Y) |
| `ALREADY_CLOSED` | Toast info "Esta conversación ya fue cerrada." |
| `ALREADY_REVIEWED` | Toast info "Esta alerta ya fue revisada." |
| `CONVERSATION_NOT_ESCALATED` | Toast warning "La conversación no está en estado escalado." |
| *(otro código)* | Toast warning con `detail.message` o "Conflicto al procesar la solicitud." |

### 500 — Error interno

→ Toast error "Error interno del servidor. Intenta nuevamente."

### 502 — Error de gateway

| Código | Comportamiento |
|---|---|
| `META_API_ERROR` | Toast error "No se pudo enviar el mensaje a WhatsApp. Intenta nuevamente." |
| `STORAGE_ERROR` | Toast error "Error al guardar el archivo. Intenta nuevamente." |
| *(otro código)* | Toast error "Error de comunicación con un servicio externo." |

### 503 — Servicio no disponible

→ Toast error "Servicio de almacenamiento no disponible."

### Cualquier otro código HTTP

→ Toast error "Error inesperado ({status}). Intenta nuevamente."

---

## Errores locales (NO interceptados)

Los siguientes códigos se re-lanzan sin disparar ningún toast. Los componentes que hacen esas llamadas capturan el error y muestran feedback inline.

| Código | Dónde se maneja |
|---|---|
| `EMPTY_MESSAGE` | `ChatInput` — mensaje vacío |
| `MESSAGE_TOO_LONG` | `ChatInput` — mensaje demasiado largo |
| `FILE_TOO_LARGE` | `ChatInput` — archivo excede el límite |
| `FILE_TYPE_NOT_ALLOWED` | `ChatInput` — tipo de archivo no permitido |
| `INVALID_TIME_RANGE` | Modal de horarios — rango de horas inválido |
| `INVALID_DAYS` | Modal de horarios — días inválidos |
| `INVALID_CURRENT_PASSWORD` | Formulario de contraseña — contraseña actual incorrecta |
| `EMAIL_ALREADY_EXISTS` | Modal crear asesor — email duplicado |

---

## Sistema de toasts (`toastStore`)

### Modelo de datos

```typescript
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number      // auto-incremental, estable por toast
  message: string
  type: ToastType
}
```

### API

```typescript
import { useToastStore } from '../store/toastStore'

// Desde un componente React
const showToast  = useToastStore((s) => s.showToast)
const removeToast = useToastStore((s) => s.removeToast)

showToast('Asesor creado exitosamente')          // type = 'success' por defecto
showToast('No tienes permiso.', 'error')
showToast('El bot tiene el control.', 'warning')
showToast('El bot ya controla esto.', 'info')

// Desde fuera de React (hooks, lógica de negocio)
useToastStore.getState().showToast('Mensaje', 'warning')
```

> **El interceptor de Axios NO llama al store directamente.** Despacha un CustomEvent `api-toast` y `SuccessToast` lo escucha. Ver sección de arquitectura.

### Comportamiento de la cola

- Se muestran hasta **3 toasts simultáneos**. El cuarto reemplaza al más antiguo.
- Cada toast tiene su propio timer de **4 segundos** atado a su `id` — los timers son independientes entre sí y no se interfieren.
- Cada toast tiene un botón de cierre manual (X).

### Tipos y apariencia

| `ToastType` | Color borde | Título automático |
|---|---|---|
| `success` | `#00D4AA` | "Operación Exitosa" |
| `error` | `#FF5B5B` | "Error" |
| `warning` | `#FFB84D` | "Atención" |
| `info` | `#01A4E3` | "Información" |

---

## Modal bloqueante (`authStore.blockedModal`)

Para casos que requieren un modal que el usuario no puede ignorar (ej. cuenta desactivada). Este estado vive en `authStore` porque es una preocupación de autorización, no de notificaciones.

```typescript
// Disparar (desde axios.ts, para ADVISOR_INACTIVE)
useAuthStore.getState().setSessionExpired(true)
useAuthStore.getState().setBlockedModal(
  'Tu cuenta ha sido desactivada',
  'Contacta a un administrador para restablecer el acceso.'
)

// Se limpia automáticamente en clearSession() y reset()
// También se limpia en SessionExpiredModal.handleGoToLogin()
```

`SessionExpiredModal` se monta en `ProtectedRoute` cuando `authStore.sessionExpired === true`. Lee `blockedModal` de `authStore` para personalizar el título y la descripción; si es `null`, muestra el texto default de sesión expirada.

---

## Arquitectura: desacoplamiento de axios del store

`axios.ts` es una utilidad de infraestructura HTTP. Para no importar el `toastStore` de React en runtime (lo que crearía un acoplamiento frágil), el interceptor despacha un `CustomEvent`:

```
axios interceptor
    │
    └─ window.dispatchEvent(new CustomEvent('api-toast', { detail: { message, type } }))
                                    │
                          ToastStack (montado en ProtectedRoute)
                                    │
                                    └─ useToastStore.getState().showToast(message, type)
```

`axios.ts` solo usa `import type { ToastType }` — un tipo TypeScript que se borra en compilación, sin dependencia de runtime. Las llamadas a `authStore` (para `clearSession`, `setSessionExpired`, `setBlockedModal`) se mantienen directas porque la autenticación está inherentemente acoplada a las respuestas HTTP.

---

## Supresión del EscalationToast

**Problema resuelto:** Si el asesor está en `/chat/X` cuando llega `escalation.new` para la conversación `X`, el toast se suprime. Pero si luego navega a `/bandeja`, el toast reaparecía porque la condición de supresión se evaluaba en tiempo real.

**Solución:** `wsStore` tiene un campo `suppressedEscalationId`. Cuando el componente detecta que el advisor está en el chat de la escalación entrante, persiste ese ID como suprimido. La supresión sobrevive a la navegación. Se limpia solo cuando `clearPendingEscalation()` es llamado (dismiss manual, "Atender ya", o auto-dismiss).

**Extracción del ID de ruta:** Se usa `matchPath(ROUTES.CHAT, pathname)` de React Router en lugar de `pathname.split('/chat/')[1]`, que sería frágil ante cambios de rutas o sub-paths.

---

## Flujo completo: ADVISOR_INACTIVE

```
axios interceptor recibe 403 ADVISOR_INACTIVE
    │
    ├─ useAuthStore.setSessionExpired(true)   ← token intacto
    └─ useAuthStore.setBlockedModal(...)

ProtectedRoute re-renderiza
    │
    ├─ !token? → NO (token intacto) → no redirige
    └─ sessionExpired? → SÍ → monta SessionExpiredModal

SessionExpiredModal
    │
    └─ muestra title/description de blockedModal
       botón deshabilitado mientras procesa

Usuario hace click "Ir al login"
    │
    └─ try { await signOut() }    ← limpia token, localStorage, Supabase
       finally {
         clearBlockedModal()
         setSessionExpired(false)
         navigate('/login')       ← siempre ocurre, aunque signOut falle
       }
```

> **Por qué el token no se limpia en el interceptor:** `ProtectedRoute` evalúa `if (!token) return <Navigate to="/login" />` antes de llegar al JSX del modal. Limpiar el token primero causaría un redirect silencioso al login sin que el usuario vea el mensaje de cuenta desactivada.

---

## Flujo completo: error de red

```
axios interceptor: error.response === undefined
    │
    └─ window.dispatchEvent('api-toast', { message: 'Sin conexión...', type: 'error' })
                │
        ToastStack listener
                │
                └─ showToast('Sin conexión...', 'error')
                        │
                        └─ ToastItem montado con timer de 4s
                           botón X para cierre manual
```
