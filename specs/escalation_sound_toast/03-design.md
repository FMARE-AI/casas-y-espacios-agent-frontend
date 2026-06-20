# Design: Toast y Sonido de Alerta de Nuevas Escalaciones

## 1. Arquitectura de Estado
El almacén global `wsStore.ts` se ampliará para contener:
- `pendingEscalation`: Objeto con `clientName`, `reason`, y `conversationId`, o `null` si no hay alerta activa.
- `setPendingEscalation(data)`: Acción para cargar los datos de la alerta.
- `clearPendingEscalation()`: Acción para limpiar y ocultar la alerta.

```
┌──────────────┐    WS Event: escalation.new    ┌─────────────┐
│ useWebSocket │ ─────────────────────────────► │   wsStore   │
└──────────────┘                                └──────┬──────┘
                                                       │
                                            Sincroniza │ Estado
                                                       ▼
┌─────────────────────────┐                 ┌──────────────────┐
│ layout/ProtectedRoute   │ ◄────────────── │ EscalationToast  │
│ (Montaje global)        │                 │ (Visual)         │
└─────────────────────────┘                 └──────────────────┘
```

## 2. Animación e Interfaz (`EscalationToast`)
- **Estilo**: Tarjeta flotante con fondo `#252522`, borde general `#3A3A37`, borde izquierdo de 4px rojo `#FF5B5B`, y sombra pronunciada `shadow-2xl`.
- **Estructura Interna**:
  - Icono SVG de campana envuelto en contenedor rojo `#FF5B5B/10`, animado con la clase `animate-bounce`.
  - Nombre de cliente bold.
  - Motivo de escalación en tipografía monoespaciada color rojo (`font-mono text-[#FF5B5B] font-bold`).
  - Botones de acción:
    - "Ignorar" (`hover:bg-[#2E2E2B] text-[#8B8FA8]`): Llama a `clearPendingEscalation()`.
    - "Atender ya" (`bg-[#01A4E3] text-white hover:bg-[#0190C8]`): Redirecciona a `/chat/{id}` y limpia el estado.
- **Transición**:
  - Al igual que el Toast de Éxito, se mantiene en el DOM pero transiciona con `translate-x-[400px]` o `translate-x-0` según esté activo, ofreciendo un deslizamiento fluido desde el lateral derecho.
