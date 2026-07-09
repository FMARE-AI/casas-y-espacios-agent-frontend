# Implementation: Toast y Sonido de Alerta de Nuevas Escalaciones

## Plan de Ejecución

### Fase 1: Estado del WebSocket
- [x] Modificar `src/store/wsStore.ts` para agregar el estado `pendingEscalation` y las acciones `setPendingEscalation` y `clearPendingEscalation`.
- [x] Modificar `src/hooks/useWebSocket.ts` para capturar el caso `escalation.new` y registrar los datos en el store.

### Fase 2: Componente Visual
- [x] Crear el componente `src/components/shared/EscalationToast.tsx`.
- [x] Añadir la estructura HTML del mockup (`id="new-escalated-toast"`).
- [x] Integrar el temporizador de auto-descarte de 8 segundos (`AUTO_DISMISS_MS = 8000`).
- [x] Configurar la navegación al hacer clic en "Atender ya" y el descarte manual.

### Fase 3: Integración en la Ruta Protegida
- [x] Modificar `src/components/layout/ProtectedRoute.tsx`.
- [x] Importar y renderizar `<EscalationToast />` por encima de `<SuccessToast />`.

### Fase 4: Validación
- [x] Validar compilación TypeScript con `npx tsc --noEmit`.

---

## Registro de Ejecución
- **2026-06-20 00:04 (Local)**: Creación de la rama `feat/Escalación-Sonido-Toast` y redacción de las especificaciones y flujos de diseño SDD en `specs/escalation_sound_toast/`.
- **2026-06-20 00:13 (Local)**: Creación de `src/hooks/useWebSocket.ts` con la lógica de conexión centralizada y sonido de campana via Web Audio API.
- **2026-06-20 00:13 (Local)**: Creación de `src/components/shared/EscalationToast.tsx` copiando los estilos de animación y estructura del mockup.
- **2026-06-20 00:13 (Local)**: Integración y renderizado en `src/components/layout/ProtectedRoute.tsx` y conexión con los componentes de bandeja y chat.
- **2026-06-20 00:25 (Local)**: Validación exitosa de compilación TypeScript.
- **2026-06-20 00:28 (Local)**: Corrección de advertencias y errores de ESLint (tipados estrictos y dependencias de React hooks) en todos los archivos creados/modificados.
- **2026-06-20 00:36 (Local)**: Corrección de errores y advertencias de ESLint en otros archivos del proyecto (`ChatPage.tsx`, `AudioRecorder.tsx`, `ChatInput.tsx`, `Sidebar.tsx`, `useAuth.ts`, `conversations.ts`). El linter del proyecto finaliza ahora con 0 errores. Finalización del desarrollo.
