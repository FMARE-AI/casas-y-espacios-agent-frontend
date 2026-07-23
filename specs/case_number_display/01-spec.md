# Spec: Número de Caso en Bandeja e Historial

## Problem
Cada conversación tiene un identificador de caso legible (`case_number`, ej. `CE-2026-000123`) generado atómicamente por el backend, pero hoy no se muestra en ningún lugar del panel. Asesores y admins no tienen forma de referenciar una conversación puntual (por ejemplo, al hablar por teléfono con un cliente o al hacer seguimiento en un correo interno) sin abrir el chat y copiar el UUID interno, que no es legible ni memorable.

## Goals
- Mostrar `case_number` como dato secundario en cada tarjeta de la bandeja (`ConversationCard`), debajo del nombre del cliente.
- Mostrar `case_number` como columna nueva en la tabla de `HistorialPage`, entre "Cliente" y "Línea".
- Permitir copiar el número al portapapeles con un clic, con feedback visual inmediato (tooltip "Copiado").
- Manejar `case_number = null` (conversaciones creadas antes de que el backend generara este campo) mostrando "—" sin error ni crash.

## Non-Goals
- Buscar/filtrar por `case_number` en `HistorialPage` (el `FilterBar`/buscador actual solo indexa nombre y cédula) — no se pidió y se deja para una tarea futura si se necesita.
- Incluir `case_number` en el export CSV de `HistorialPage` — no está en los criterios de aceptación.
- Mostrar el número de caso en `ChatPage` (header del chat) — fuera de alcance de este ticket.
- Cualquier endpoint o lógica para generar/editar `case_number` desde el frontend — es exclusivamente generado por Postgres en el backend.

## Expected Behavior

### 1. Tarjeta de bandeja
En `ConversationCard`, justo debajo del nombre del cliente, se muestra el `case_number` en texto pequeño y tono secundario (gris muted, no blanco/negrita) — no debe competir visualmente con el nombre del cliente ni con el preview del último mensaje.

### 2. Tabla de historial
En `HistorialPage`, se agrega una columna "N° de Caso" entre "Cliente" y "Línea", mostrando el `case_number` de cada conversación cerrada.

### 3. Copiar al portapapeles
Al hacer clic sobre el número de caso (tanto en la tarjeta como en la tabla), se copia el valor completo al portapapeles del sistema y se muestra un tooltip con el texto "Copiado" durante un par de segundos como confirmación visual.

### 4. Valor nulo
Si `case_number` es `null`, se renderiza `—` en ambos lugares, sin botón de copiar (no hay nada que copiar) y sin lanzar error.

## Constraints
- El campo `case_number` **ya está expuesto** por el backend en `GET /api/v1/panel/conversations/` y `GET /api/v1/panel/conversations/{id}` según `docs/panel_api_reference.md` — el supuesto del ticket de que "el backend debe exponerlo" está desactualizado; se confirma en clarificación.
- Formato documentado: `CE-YYYY-NNNNNN` (ej. `CE-2026-000043`). El frontend lo trata como string opaco — no se parsea ni valida el formato en el cliente.
- `case_number` nunca cambia durante la vida de la conversación (ver `docs/panel_api_reference.md`, nota sobre reutilización dentro de la ventana de gracia) — no requiere lógica de invalidación/refetch.
- Debe seguir el patrón de estilos existente del panel (paleta oscura, `text-[#8B8FA8]` para tono secundario, `font-mono` para strings tipo código — ya usado en otros lugares del panel para IDs/cédulas).

## Priority
Media — mejora de trazabilidad operativa para asesores/admins, no bloquea ningún flujo existente.
