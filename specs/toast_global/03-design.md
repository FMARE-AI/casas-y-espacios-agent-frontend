# Design: Toast Global de Operaciones Exitosas

## 1. Arquitectura Técnica
La solución consta de tres partes principales:

```
┌──────────────────┐      Invoca      ┌─────────────────────────┐
│ Página / Service │ ───────────────► │ store/toastStore (Zustand)│
└──────────────────┘                  └────────────┬────────────┘
                                                   │
                                        Sincroniza │ Estado
                                                   ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│ components/layout       │ ◄──────── │ components/shared       │
│ ProtectedRoute (Montaje)│           │ SuccessToast (Visual)   │
└─────────────────────────┘           └─────────────────────────┘
```

## 2. Definición del Store (Zustand)
El almacén controlará el mensaje a mostrar y la bandera de visibilidad:
* `message`: `string | null`
* `show`: `boolean`
* `showToast(message)`: Muestra el toast con el texto provisto.
* `hideToast()`: Oculta el toast y limpia el mensaje.

## 3. Especificación del Componente de Interfaz (`SuccessToast`)
- **Estructura HTML**:
  - Elemento contenedor con clase `fixed top-24 right-4 bg-[#252522] border-l-4 border-l-[#00D4AA] border border-[#3A3A37] rounded-r-lg shadow-2xl p-3.5 w-80 transition-transform duration-300 ease-out z-[998] flex items-start gap-3`.
  - Icono SVG de check verde en un wrapper con fondo `#00D4AA/10` y texto `#00D4AA`.
  - Contenido de texto: Título "Operación Exitosa" (`text-white`) y descripción dinámica del mensaje (`text-[#8B8FA8]`).
- **Comportamiento Asíncrono**:
  - Un hook `useEffect` inicia un temporizador de 4 segundos al momento de cambiar `show` a `true`, llamando a `hideToast` al completarse el tiempo.

## 4. Montaje Global
El componente se ubica al final del contenedor principal en `ProtectedRoute.tsx` para estar activo y disponible en todo el ciclo de navegación del usuario tras iniciar sesión.
