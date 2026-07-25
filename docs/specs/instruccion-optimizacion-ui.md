# Instrucción para agente frontend: Optimización visual del panel de asesores (Casas y Espacios)

## Contexto del proyecto

Panel de asesores construido en React/TypeScript con Tailwind CSS v4 (sin `tailwind.config.js`, tokens definidos vía `@theme` en `src/index.css`). El sistema ya tiene una paleta de colores dark-mode definida:

```css
--color-bg-main: #1d1d1b --color-bg-secondary: #252522
  --color-bg-tertiary: #2e2e2b --color-brand-blue: #01a4e3
  --color-border-default: #3a3a37 --color-text-primary: #f0f0f5
  --color-text-secondary: #8b8fa8 --color-error: #ff5b5b
  --color-success: #00d4aa --color-warning: #ffb84d;
```

Además existe un segundo bloque `@theme inline` (líneas 25-49 de `src/index.css`) con tokens estándar de shadcn/ui (`--color-primary`, `--color-background`, `--color-chart-1..5`, etc.), referenciando variables en `:root` desde la línea 56.

## Objetivo

Elevar la calidad visual de **todo el sistema** (no solo la Bandeja de Entrada) a un nivel "moderno tipo macOS": tipografía limpia y profesional, jerarquía visual clara, micro-interacciones fluidas, y una sensación general de pulido — **sin alterar la paleta de colores base ni la lógica funcional de ningún componente.**

## Restricciones estrictas (no negociables)

1. **No modificar lógica, estado, handlers, props ni estructura de datos de ningún componente.** Este es un trabajo puramente de capa visual: clases de Tailwind, tokens CSS, tipografía y animaciones.
2. **No introducir colores nuevos fuera de la paleta existente.** Si se necesita una variante (ej. un azul más claro para hover), debe derivarse de `--color-brand-blue` vía opacidad (`/10`, `/20`, etc.) o un tono calculado, no un hex arbitrario nuevo.
3. **Mantener compatibilidad con los tokens de shadcn/ui ya presentes** en el bloque `@theme inline` — extenderlos, no reemplazarlos.
4. **Contraste mínimo AA (WCAG)** en toda combinación texto/fondo, especialmente `--color-text-secondary` sobre `--color-bg-secondary`/`--color-bg-tertiary`.
5. **No shortcuts de librerías nuevas pesadas** (ej. Framer Motion) sin justificarlo explícitamente en la propuesta — preferir transiciones nativas de Tailwind (`transition`, `duration`, `ease`) y CSS puro cuando sea suficiente.

## Fase 1 — Auditoría (obligatoria antes de proponer nada)

Antes de escribir una sola línea de código, generar un documento de auditoría que cubra:

1. **Documentar la paleta actual** en `docs/palette.md` (no existe hoy, hay que crearlo) — listar cada token, su valor hex, y en qué contextos se usa actualmente.
2. **Inventariar la tipografía actual**: ¿qué font-family está cargada hoy (si alguna, o si cae al default del sistema)? ¿Hay pesos/tamaños inconsistentes entre pantallas?
3. **Inventariar componentes clave por pantalla**: Bandeja de Entrada, Historial Cerrados, Mi Perfil, sidebar, y cualquier modal/dropdown existente. Para cada uno, listar: radios de borde usados, sombras usadas (si alguna), espaciados (padding/margin) y si son consistentes entre sí.
4. **Identificar inconsistencias** actuales (ej. distintos radios de borde para tarjetas similares, distintos grises de fondo para el mismo tipo de elemento, ausencia de estados hover/focus en elementos interactivos).

Este inventario se entrega como resultado de la Fase 1, **antes** de tocar código.

## Fase 1.5 — Estabilización técnica (obligatoria, previa a la Fase 2)

La auditoría de Fase 1 (ver `docs/palette.md`) encontró dos bloqueadores que deben resolverse antes de proponer o aplicar cualquier cambio visual, porque de lo contrario los tokens nuevos no tendrían efecto real:

### 1.5.a — Migración hex → token (934 ocurrencias)

- Reemplazo textual de los 934 hex literales por su token equivalente de `@theme`.
- Para los **26 hex fuera de paleta**, resolver así:
  - Familia de 8 azules → colapsar a `--color-brand-blue` + estados derivados por opacidad (`/10`, `/20`, `/80`, etc.). Promover `#0190C8` a un token de hover derivado del azul de marca (no un hex nuevo suelto).
  - `#FF5C5C` → usar `--color-error`. `#F0A83A` → usar `--color-warning` (son duplicados con desvío de 1 unidad, no variantes intencionales).
  - Familia gris-azulada ajena (slate/gray de Tailwind v3, concentrada en `ChatInput.tsx`: `#E2E8F0`, `#F8F9FA`, `#EDF2F7`, `#CBD5E0`, `#2D3748`, `#A0AEC0`, `#4A5568`, `#1A202C`, `#F7FAFC`, más `#9296AC`/`#6B6F7E` en `LoginPage` y `#1F2937` en `MessageFeed`/`MessageBubble`) → remapear cada uno a su token oliva más cercano por luminancia, nunca dejar la familia fría suelta.
  - Fondos sin token más oscuros que `bg-main` (`#1A1A18`, `#111110`) → si tienen uso real (elevación, overlay), crear un token nuevo `--color-bg-overlay` explícito en `@theme`; si no, colapsar a `--color-bg-main`.
- **Prioridad de archivo**: empezar por `ChatInput.tsx` (115 hexes, 5 radios, 5 sombras distintas — es el epicentro de la deriva).
- Nivelar radios y sombras inconsistentes detectados entre pantallas (`HistorialPage`/`FilterBar` sin sombra vs. `BandejaPage` con `shadow-2xl`) usando la escala que se defina en Fase 2 — este punto puede quedar pendiente de la Fase 2 si aún no existe la escala, pero la tokenización de color no depende de eso y debe completarse ahora.

### 1.5.b — Activar el tema `.dark`

- Montar la clase `.dark` en `<html>` mediante un `ThemeProvider` (ya existe `next-themes` como dependencia, hoy solo usado en `sonner.tsx` — extender su uso al layout raíz).
- Remapear los valores de `.dark` (bloque `@theme inline` / `:root`) a la paleta oliva real, en vez de eliminar ese bloque — esto respeta la restricción de "extender, no reemplazar" y revive las ~30 variantes `dark:` de `components/ui/*` que hoy son código muerto.
- Verificar visualmente `Button`, `Input`, `Select`, `Badge` y `DropdownMenu` de shadcn después del cambio — son los que hoy dependían de estar tapados por hex literal.

### 1.5.c — Rebalancear `--color-text-secondary`

Reemplazar `#8B8FA8` por un nuevo valor que cumpla, en este orden de prioridad:

1. **Contraste ≥ 4.5:1** contra `--color-bg-tertiary` (#2E2E2B) Y contra `--color-border-default` (#3A3A37) simultáneamente — hoy falla ambos (4.28 y 3.59 respectivamente).
2. **Reducir la distancia cromática con la familia oliva**: bajar el canal B relativo a R/G (hoy R=139, G=143, B=168 — el canal B es el que rompe la armonía). El objetivo no es volverlo gris neutro puro, sino acercarlo a un gris con la misma tendencia cálida que `bg-secondary`/`bg-tertiary`, sin perder legibilidad de "texto secundario" frente al primario.
3. Mantener la luminosidad percibida similar a la actual para que el cambio no se sienta como "otro color", solo como una versión más limpia del mismo gris.

El agente debe calcular el valor final verificando ambos ratios de contraste antes de fijarlo como token — no basta con ajustar "a ojo".

### Orden de ejecución de Fase 1.5

1.5.a (migración) → 1.5.c (rebalanceo de texto, se aplica sobre el token ya centralizado) → 1.5.b (activar `.dark`, que depende de que los tokens de `:root`/`.dark` ya estén consistentes). Solo al completar las tres se avanza a Fase 2.

## Fase 2 — Propuesta de sistema de diseño

Con base en la auditoría, proponer (como documento, antes de implementar):

1. **Tipografía**: una font-family sans-serif profesional que evoque el estilo "SF Pro / Inter / Geist" (macOS-like) — cargada vía `@font-face` o Google Fonts según lo que ya use el proyecto. Definir escala tipográfica (tamaños para h1/h2/body/caption) como tokens en `@theme`.
2. **Espaciado y radios**: proponer una escala de `border-radius` consistente (ej. `--radius-sm/md/lg`) y confirmar/ajustar el spacing scale de Tailwind si hace falta.
3. **Elevación (sombras)**: definir 2-3 niveles de sombra sutil para tarjetas/paneles flotantes (dropdowns, modales), coherentes con un fondo oscuro (sombras muy sutiles, casi imperceptibles, como en macOS — no las sombras duras típicas de light-mode).
4. **Estados interactivos**: definir cómo se ven hover, focus, active y disabled para botones, tabs, inputs y items de lista — con transiciones suaves (150-200ms, `ease-out`).
5. **Motion/animación**: proponer transiciones específicas para: cambio de tab (Mis conversaciones/Todas/Escaladas/Activas), aparición de nuevas conversaciones en la bandeja, y transiciones de hover en botones — todas sutiles, nunca decorativas o largas (macOS prioriza rapidez percibida sobre efectos vistosos).

## Fase 3 — Plan de implementación

Precondición: Fase 1.5 completa (tokens consumidos en todo el codebase, `.dark` activo, `text-secondary` rebalanceado) y Fase 2 aprobada.

1. Actualizar `src/index.css` con los nuevos tokens de tipografía/radios/sombras dentro del bloque `@theme` (esto ahora sí tiene efecto inmediato en todos los componentes, porque ya no hay hex literales compitiendo con los tokens).
2. Aplicar los cambios componente por componente, empezando por los compartidos (sidebar, botones base, tabs) antes que las pantallas específicas.
3. Para cada componente modificado, indicar explícitamente: qué cambió, con qué clases de Tailwind, y por qué (referenciando la propuesta de Fase 2).

## Resolución de tipografía (Inter)

La auditoría encontró que `--font-sans: 'Inter'` está declarada pero nunca cargada (sin `@font-face`, sin archivos `.woff2`, y el `font-src 'self'` del CSP bloquearía un `<link>` externo de todas formas). Hoy el panel renderiza con el fallback del sistema operativo (Segoe UI en Windows, Helvetica en macOS), lo que significa que **la tipografía varía según la máquina del asesor**.

Esto se resuelve en la Fase 2 (decisión de tipografía) instalando `@fontsource/inter` (self-hosted, respeta el CSP existente sin tener que tocarlo) en vez de un `<link>` a Google Fonts. Si en Fase 2 se decide otra font-family en vez de Inter, aplicar el mismo criterio: self-hosted vía `@fontsource` o equivalente, nunca CDN externo, para no depender de modificar el CSP.

## Formato de entrega esperado

- Fase 1 y 2 como documentos/resúmenes en texto (no código todavía).
- Fase 3 como diffs o archivos modificados, componente por componente, con una nota breve del "por qué" en cada uno.
- No avanzar a la fase siguiente sin confirmación explícita del usuario.
