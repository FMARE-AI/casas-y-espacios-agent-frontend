# Clarifications: Número de Caso en Bandeja e Historial

## Questions & Answers

**Q1: El ticket dice "Depende del campo `case_number` que debe exponer el backend en los endpoints de listado" — ¿el backend realmente todavía necesita agregarlo?**
A: No. `docs/panel_api_reference.md` ya documenta `case_number` en la respuesta de `GET /conversations/` (línea 170: `"case_number": "CE-2026-000043"`) y en el detalle `GET /conversations/{id}` (línea 270). También hay una nota explícita del contrato: es `null` para conversaciones creadas antes de este feature — "render `—` (or similar) in that case" — y nunca cambia, incluso si una conversación cerrada se reutiliza dentro de la ventana de gracia. El supuesto del ticket está desactualizado; el campo ya es parte del contrato documentado. Solo faltaba declararlo en `src/types/index.ts` (no estaba en la interfaz `Conversation` del frontend).

**Q2: ¿Dónde exactamente va el número de caso dentro de `ConversationCard`, para no competir visualmente con el nombre ni el último mensaje?**
A: Inmediatamente debajo del `<h3>` del nombre del cliente, antes de los párrafos de "Motivo" y del preview del último mensaje. Se usa `text-[10px]` (más chico que el `text-xs` usado para motivo/último mensaje) y el mismo tono `#8B8FA8` (gris muted) que ya usa el resto de metadata secundaria de la tarjeta (tiempo transcurrido, "Sin mensajes", etc.) — no se introduce un color/peso nuevo.

**Q3: El componente `Tooltip` de `src/components/ui/tooltip.tsx` (base-ui) existe en el proyecto — ¿se usa ese para el feedback "Copiado"?**
A: No. Ese componente depende de `TooltipPrimitive.Provider`, que no está montado en ningún punto de `App.tsx` ni de ningún layout — introducirlo solo para este feedback puntual implicaría envolver el árbol completo de la app con un provider nuevo, mayor a lo que pide el ticket. En su lugar se reutiliza el patrón ya existente en el propio `ConversationCard.tsx` (el tooltip de "Límite alcanzado" sobre el botón "Atender ya" — un `<div>` posicionado en `absolute` que aparece condicionalmente) adaptado a un estado local `copied` con `setTimeout`, sin dependencias nuevas.

**Q4: El copiado al portapapeles ya tiene un precedente en el código (`PerfilPage.tsx`, botón de email) que usa un **toast** ("Correo copiado al portapapeles") en vez de un tooltip — ¿se sigue ese patrón o el que pide el ticket?**
A: Se sigue explícitamente lo que pide el criterio de aceptación: "Clic en el número lo copia al portapapeles con feedback visual (tooltip 'Copiado')". El toast de `PerfilPage` es un patrón válido pero es un componente de nivel de página (usa `useToastStore` global); el ticket pide un tooltip anclado al propio elemento, que es más apropiado para un dato que aparece muchas veces en una lista/tabla (un toast por cada fila sería ruidoso si el usuario copia varios números seguidos). No se modifica el patrón de `PerfilPage`.

**Q5: ¿El componente para mostrar/copiar el número de caso debe ser un componente compartido o se duplica la lógica en `ConversationCard` y `HistorialPage`?**
A: Componente compartido: `src/components/shared/CaseNumberTag.tsx`. Mismo criterio que otros componentes de `components/shared/` (`EscalationToast`, `SessionExpiredModal`) — lógica de UI reutilizada entre páginas distintas, con una prop `className` para que cada consumidor ajuste tamaño de texto sin duplicar el manejo de copiado/tooltip/null.

**Q6: ¿Debe el buscador de `HistorialPage` (`searchText`) incluir `case_number` como campo indexado?**
A: No — no está en los criterios de aceptación (que solo piden mostrarlo como columna) y el ticket no lo menciona. Se registra como no-goal explícito para evitar ambigüedad a futuro; si se pide, es un cambio acotado a `filteredConversations` en `HistorialPage.tsx`.

**Q7: ¿Se agrega `case_number` al export CSV de `HistorialPage`?**
A: No — mismo razonamiento que Q6, no está en los criterios de aceptación. Se deja como no-goal explícito.

**Q8: `navigator.clipboard.writeText()` puede rechazar la promesa (contexto no seguro, permiso denegado por el navegador) — ¿qué pasa si falla?**
A: Debe fallar en silencio (no debe romper la tarjeta ni la fila de tabla ni mostrar un error al usuario) — es una funcionalidad de conveniencia, no crítica. Se agrega un `try/catch` alrededor del `await` para que un rechazo no quede como unhandled promise rejection; si falla, simplemente no se muestra el tooltip "Copiado" (no se muestra un estado de error tampoco, para no sobre-diseñar un caso límite de navegador que en la práctica no ocurre en Chrome/Edge sobre HTTPS, que es el entorno real del panel).

## Open Decisions
Ninguna. Todos los puntos quedaron resueltos.
