# Design: Conectar Historial de Conversaciones Cerradas

## Overview
Este diseño describe los cambios necesarios en el panel web interno (React) para sincronizar la pantalla de historial de conversaciones (`HistorialPage.tsx`) con los nuevos campos de negocio devueltos por el backend (`resolution_notes`, `client_satisfied`, `closed_by`, `closed_at`). También se implementará interactividad para ver notas largas y una columna adicional de satisfacción del cliente.

## Components

### New / Modified Files
| File | Role | Change type |
|------|------|-------------|
| `src/types/index.ts` | Definición de tipos TypeScript compartidos. | Verificar/Actualizar campos de `Conversation`. |
| `src/pages/HistorialPage.tsx` | Pantalla de historial y auditoría de conversaciones. | Modificar tablas, CSV, helpers e interactividad. |

### Key Abstractions

#### 1. Tipo `Conversation` en `src/types/index.ts`
El tipo ya tiene los campos necesarios, pero confirmaremos que coincida con:
```typescript
export interface Conversation {
  id: string
  status: ConversationStatus
  bot_activo: boolean
  channel: string
  last_activity: string
  client: Client
  escalation: Escalation | null
  resolution_type: string | null
  resolution_notes: string | null
  client_satisfied: 'si' | 'no' | 'sin_confirmar' | null
  closed_by: 'asesor' | 'bot' | null
  closed_at: string | null
}
```

#### 2. Interactividad en "Notas de resolución"
Para permitir al usuario leer notas de resolución largas de forma cómoda:
- Mantendremos un estado local en `HistorialPage.tsx`:
  ```typescript
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  ```
- Función helper para alternar la expansión de una nota:
  ```typescript
  const toggleNote = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }))
  }
  ```
- Al hacer click sobre el texto de la nota, se alternará entre el texto truncado y el texto completo.
- Se agregará el atributo `title` para el tooltip nativo (hover) y clases de Tailwind CSS para indicar que es interactivo (`cursor-pointer hover:underline`).

#### 3. Formateo de "¿El cliente está satisfecho?"
- Valores posibles en base de datos: `si`, `no`, `sin_confirmar`, `null`.
- Renderizado de badges o texto coloreado en la tabla:
  - `'si'`: Badge con fondo verde translúcido (`bg-[#00D4AA]/10 text-[#00D4AA]`) y texto "Sí".
  - `'no'`: Badge con fondo rojo/naranja translúcido (`bg-[#FF5C5C]/10 text-[#FF5C5C]`) y texto "No".
  - `'sin_confirmar'` o `null`: Badge con fondo gris translúcido (`bg-[#3A3A37] text-[#8B8FA8]`) y texto "Sin confirmar".

#### 4. Comentario TODO y fallback de fecha
- Se agregará el siguiente comentario `TODO` junto a la función `formatClosedDate`:
  ```typescript
  // TODO: El backend tiene un bug conocido donde closed_at puede retornar null
  // incluso si la conversación está cerrada. Se usa last_activity como fallback.
  ```
- La función de formateo y renderizado de fecha de cierre usará `conv.closed_at ?? conv.last_activity`.

#### 5. Exportación a CSV
Actualización del array de encabezados y mapeo de filas en la función `exportCSV`:
- Encabezados: `['Cliente', 'Cédula', 'Línea', 'Fecha de Cierre', 'Notas de resolución', 'Resolutor', 'Cliente satisfecho']`.
- Mapeo de columnas:
  - Cliente: `conv.client.full_name ?? '—'`
  - Cédula: `conv.client.document_id ?? '—'`
  - Línea: `channelLabel(conv.channel)`
  - Fecha de Cierre: `conv.closed_at ?? conv.last_activity` formateada como `dd/MM/yyyy HH:mm`.
  - Notas de resolución: `conv.resolution_notes ?? 'Sin notas'`
  - Resolutor: `conv.closed_by === 'bot' ? 'Bot' : (conv.escalation?.advisor?.full_name ?? '—')`
  - Cliente satisfecho: `'si' -> 'Sí'`, `'no' -> 'No'`, `'sin_confirmar'/null -> 'Sin confirmar'`.

## API / Interface Contracts
No se modifican los contratos existentes, pero se aprovechan los campos adicionales ya expuestos en `GET /conversations`.

## Edge Cases & Error Handling
- **Notas de resolución extremadamente largas**: La interactividad con click/toggle previene la deformación del layout de la tabla al truncar a 60 caracteres por defecto, y permite la expansión inline solo cuando se requiere.
- **Valores nulos en `closed_at`**: Se gestiona usando `conv.last_activity` como fallback seguro.
- **Valores nulos en `client_satisfied` o `closed_by`**: Se mapean a valores por defecto consistentes ("Sin confirmar" y "—", respectivamente).
