# Spec: Conectar Métricas del Dashboard Admin

## Problem
El dashboard de métricas en la bandeja de entrada de administración (`MetricsDashboard.tsx` dentro de `BandejaPage.tsx`) actualmente muestra datos estáticos o calculados localmente. Los administradores necesitan ver métricas de negocio reales del backend en tiempo real para tomar decisiones de asignación y monitoreo del equipo.

## Goals
- Crear un servicio de API `metricsService` en `src/services/metrics.ts` para obtener métricas desde `GET /api/v1/panel/metrics`.
- Manejar adecuadamente los errores de la llamada:
  - `403 Forbidden`: Devolver `null` de forma silenciosa para que el componente no se renderice.
  - `500 Supabase Error` u otros errores: Devolver métricas en cero sin romper la interfaz de usuario.
- Conectar las métricas reales en `MetricsDashboard.tsx` y adaptarlas a las siguientes reglas visuales:
  - **activas**: Mostrar en color turquesa/verde `#00D4AA`.
  - **escaladas**: Mostrar en color rojo `#FF5B5B`.
  - **en_atencion**: Mostrar en color naranja `#FFB84D`.
  - **tiempo_promedio_min**: Formatear como `"X m"`, mostrando `"— m"` si el valor es `0`.
  - **bot_ok_pct**: Formatear como `"X%"`, mostrando `"—%"` si el valor es `0`.
  - **Capacidad (capacidad_actual / capacidad_total)**: Formatear como `"X/Y"`, mostrándolo en rojo (`#FF5B5B`) si `capacidad_actual >= capacidad_total` y en verde (`#00D4AA`) si `capacidad_actual < capacidad_total`.
- Implementar el refresco de métricas en momentos clave:
  - Al montar la página.
  - Al presionar el botón refresh de `FilterBar`.
  - Al recibir eventos de WebSocket: `escalation.assigned` o `conversation.closed`.
- Asegurar que no haya polling automático para optimizar recursos.
- Lograr una compilación limpia de TypeScript (`npx tsc --noEmit`).

## Non-Goals
- Realizar polling automático del endpoint de métricas.
- Mostrar la explicación del backend sobre por qué la capacidad total solo incluye asesores y no administradores.
- Re-escribir el diseño o estructura base de la pantalla de bandeja de entrada desde cero.

## Expected Behavior
- Los administradores verán un panel de métricas dinámico arriba a la derecha de la bandeja de entrada, que refleja fielmente los datos del backend.
- Si ocurre un error en el backend (500), el panel mostrará ceros y no se interrumpirá el funcionamiento general de la bandeja.
- La información de capacidad cambiará de color de forma dinámica según el volumen de trabajo del equipo.
- El panel de métricas se mantendrá actualizado ante cambios en las conversaciones (cierre o asignación) sin sobrecargar el servidor con peticiones recurrentes.

## Constraints
- Cumplir con los estándares de hooks y estado de la aplicación (Reglas críticas de hooks en `CLAUDE.md`).
- Mantener las referencias estables en los handlers de WebSocket para evitar re-suscripciones e inestabilidad en el socket.
- Asegurar cero errores de compilación con TypeScript.
