# Fase 2 — Propuesta de sistema de diseño

**Estado: propuesta, no implementación.** Salvo el punto 0 (tipografía real), nada de esto
está aplicado a componentes todavía. Espera tu aprobación antes de tocar pantallas.

**Alcance:** componentes custom en uso real (`BandejaPage`, `HistorialPage`, `ChatInput`,
`Sidebar`, tarjetas, modales, etc.). `src/components/ui/` (los primitivos shadcn) queda
fuera — no se usa en ningún flujo real hoy (verificado en el cierre de la Fase 1.5) y se
trata en la Fase 4 de consolidación arquitectónica.

---

## 0. Tipografía real — ya instalado y verificado

Esto no es una propuesta, es la corrección de un bug que ya estaba diagnosticado:
`--font-sans: 'Inter'` no cargaba nada porque ningún `@font-face` registraba ese nombre.

**Hecho:**
- `npm install @fontsource-variable/inter` — una sola fuente variable (pesos 100–900 en un
  archivo por subset), self-hosted, respeta el `font-src 'self'` del CSP sin tocarlo.
- Import en `src/main.tsx`: `import '@fontsource-variable/inter'`.
- `--font-sans: 'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif;`

**Verificado en build real** (no solo instalado — comprobado que compila y carga):
- `tsc --noEmit` y `vite build` pasan.
- El CSS compilado declara 7 `@font-face` con `font-family: Inter Variable`, cada uno con
  `unicode-range` distinto (latin, latin-ext, cyrillic, greek, vietnamese). El navegador solo
  descarga el/los que coincidan con caracteres reales de la página — para este panel en
  español, en la práctica solo `latin` + `latin-ext` (~133KB de los 224KB totales).
- `--font-sans` resuelve a `"Inter Variable", "Inter", system-ui, ...` en el CSS final.

No se tocó ningún componente para esto — es infraestructura (paquete + import + token),
no capa visual de pantalla.

---

## 1. Escala tipográfica

### Auditoría

24 encabezados (`<h1>`–`<h4>`) en toda la app, y **el único `<h1>` real** está en
`GestionPage.tsx:213`. Todo lo demás son `<h2>`/`<h3>`/`<h4>` con tamaños que no
correlacionan con el nivel semántico de la etiqueta:

| Etiqueta | Tamaños en uso | Ejemplos |
|---|---|---|
| `<h2>` | `text-sm`, `text-lg sm:text-xl`, `text-xl`, `text-xl sm:text-2xl` | `BehaviorAlertsPanel` (sm), `BandejaPage` (lg/xl), `HistorialPage`/`FirstLoginPage` (xl), `GestionPage` (xl/2xl) |
| `<h3>` | `text-sm`, `text-lg`, `text-base`, `text-xs` | mayoría en `text-sm font-bold`, pero `AdvisorModal` usa `text-lg`, `PerfilPage` usa `text-base`, `ChatPage` usa `text-xs` |
| `<h4>` | `text-xs`, `text-sm` | `Sidebar` (xs), `ClientPanel`/`BandejaPage` (sm) |

Un `<h3>` puede ser más grande que un `<h2>` en otra pantalla. No hay jerarquía real, hay
14 combinaciones tamaño+peso distintas para lo que deberían ser 3–4 niveles.

**Labels** (36 usos de `uppercase tracking-*`): conviven `text-[9px]`, `text-[10px]` y
`text-xs` con `font-bold`, `font-extrabold` y `font-black` indistintamente — a veces los
tres en el mismo componente (`ConversationCard.tsx` tiene 5 chips de label con 4
combinaciones peso/tamaño distintas entre sí).

**Distribución global** (de la Fase 1): 89% de los usos son `text-xs`/`text-sm`; 128 usos de
peso ≥700 contra 26 de `font-medium` — la jerarquía se comunica engordando texto, no con
tamaño ni color.

### Mecanismo técnico (verificado)

Tailwind v4 permite tokens de `font-size` compuestos: un solo token en `@theme` genera una
clase que fija tamaño, interlineado, tracking **y peso** a la vez. Probé esto en un build real
antes de proponerlo — no es un supuesto:

```css
.text-h1 { font-size: var(--text-h1); line-height: var(--text-h1--line-height);
           letter-spacing: var(--text-h1--letter-spacing); font-weight: var(--text-h1--font-weight); }
```

Esto reemplaza combos como `text-xl sm:text-2xl font-bold` (3 clases, repetidas con
variaciones en 6+ archivos) por **una sola clase** consistente.

### Tokens propuestos

```css
@theme {
  --text-h1: 1.5rem;              /* 24px — título de página. Reemplaza el único <h1> real */
  --text-h1--line-height: 1.25;
  --text-h1--font-weight: 700;
  --text-h1--letter-spacing: -0.01em;

  --text-h2: 1.125rem;            /* 18px — título de sección/panel */
  --text-h2--line-height: 1.3;
  --text-h2--font-weight: 700;

  --text-h3: 0.875rem;            /* 14px — título de tarjeta/modal. Mismo tamaño que body:
                                      la jerarquía la da el peso, no el tamaño (patrón macOS:
                                      un header de sección de tabla es del mismo cuerpo que el
                                      contenido, solo más pesado) */
  --text-h3--line-height: 1.35;
  --text-h3--font-weight: 600;

  --text-body: 0.875rem;          /* 14px — contenido de trabajo: mensajes, valores de forma */
  --text-body--line-height: 1.5;
  --text-body--font-weight: 400;

  --text-caption: 0.75rem;        /* 12px — metadatos, timestamps, texto secundario */
  --text-caption--line-height: 1.4;
  --text-caption--font-weight: 500;

  --text-label: 0.6875rem;        /* 11px — labels en mayúscula. Sube 1-2px sobre los 9-10px
                                      actuales: a esos tamaños con tracking ancho, el texto
                                      apretado se hace ilegible */
  --text-label--line-height: 1.3;
  --text-label--font-weight: 600;
  --text-label--letter-spacing: 0.05em;
}
```

`text-label` no incluye `text-transform` (esa propiedad no es parte del mecanismo compuesto
de Tailwind) — se sigue agregando la clase `uppercase` por separado, como ya se hace hoy.

Seis niveles reemplazan las ~14 combinaciones de encabezado más las 3 variantes de label.
Peso dominante pasa de `bold`/`black` a `semibold`/`medium`; `bold` (700) queda reservado a
`h1`/`h2`.

### Antes / después — `ConversationCard.tsx`

```diff
- <h3 className="text-sm font-bold text-white truncate" title={clientName}>{clientName}</h3>
+ <h3 className="text-h3 text-text-primary truncate" title={clientName}>{clientName}</h3>

- <span className={`${statusChipStyles[variant]} text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider`}>
+ <span className={`${statusChipStyles[variant]} text-label px-1.5 py-0.5 rounded uppercase`}>

- <span className="bg-bg-tertiary text-brand-blue text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase">
+ <span className="bg-bg-tertiary text-brand-blue text-label px-1.5 py-0.5 rounded uppercase">
```

Nota: la clase `text-white` en el `<h3>` original ignora la paleta (no es un token) —
se reemplaza por `text-text-primary`, ya migrado en Fase 1.5 pero no aplicado acá porque el
color no formaba parte del alcance de esa fase.

---

## 2. Radios y sombras

### Auditoría (radios)

9 valores en `rounded-*` para lo que hoy no distingue tipo de superficie: `rounded-full` (92,
correcto para pills/avatares — no forma parte de esta escala), `rounded-lg` (75), `rounded-xl`
(61), `rounded-md` (29), `rounded-2xl` (10), más arbitrarios. `ChatInput.tsx` sola usa 5 radios
distintos.

### Tokens propuestos

```css
@theme {
  --radius-sm: 0.375rem;   /* 6px  — chips, badges no-full, controles inline pequeños */
  --radius-md: 0.625rem;   /* 10px — botones, inputs, items de lista. Es el radio por defecto hoy (rounded-lg) */
  --radius-lg: 1rem;       /* 16px — tarjetas principales, modales, paneles flotantes */
}
```

Consolida 5 radios no-`full` en 3, cada uno con un rol claro. `rounded-full` sigue existiendo
tal cual (es `9999px`, ortogonal a esta escala).

### Auditoría (sombras)

6 niveles de Tailwind (`shadow-sm` 19, `md` 14, `2xl` 11, `lg` 8, `inner` 5, `xl` 4) más 3
arbitrarios. Ya establecido en la Fase 1: las sombras de Tailwind son negro con alpha bajo,
calibradas para fondo claro — sobre `bg-main` (#1D1D1B, casi negro) son casi invisibles, por
eso `shadow-2xl` aparece 11 veces como parche sin efecto real.

### Patrón validado (no nuevo — ya se usó al corregir `--popover`)

Un popover no se distingue del fondo por tener un relleno más claro (eso ya fallaba
contraste, ver `docs/palette.md` §3) — se distingue por **borde marcado + sombra sutil**. El
mismo patrón se propone para tarjetas/paneles flotantes:

```css
@theme {
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.3);                        /* tarjetas en reposo, sutil */
  --shadow-sm: 0 4px 12px -2px rgb(0 0 0 / 0.45);                   /* popovers/dropdowns/tooltips — junto a border-default */
  --shadow-md: 0 12px 32px -4px rgb(0 0 0 / 0.55), 0 4px 8px -4px rgb(0 0 0 / 0.4); /* modales, sobre backdrop */
}
```

**Aviso de honestidad:** a diferencia de los tokens de color (verificados con ratios WCAG
exactos), estos valores de alpha son un punto de partida razonado — no hay una métrica
objetiva equivalente a contraste de texto para "sombra perceptible sobre fondo casi negro".
Hay que verlos en pantalla real y ajustar antes de fijarlos. Los marco explícitamente como
la única parte de esta propuesta que no está matemáticamente verificada.

### Antes / después — `ScheduleManager.tsx` (modal)

```diff
- <div className="bg-bg-secondary border border-border-default/80 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
+ <div className="bg-bg-secondary border border-border-default rounded-lg w-full max-w-sm shadow-md overflow-hidden">
```

---

## 3. Estados interactivos (foco primero)

### Auditoría — el hallazgo principal de esta fase

Audité con un script que recorre el AST superficial de cada archivo (no un grep simple:
un grep ingenuo cuenta mal porque las clases con `focus:` a veces quedan lejos del inicio del
tag en un `className` largo). Resultado:

- **106** elementos `<button>`/`<select>`/`<textarea>` en toda la app.
- **Solo 15 (14%)** tienen algún tratamiento `focus:`/`focus-visible:` propio.
- **91 (86%)** no tienen ninguno — ni siquiera heredado: no hay ningún reset global de
  `outline` en `index.css`, así que estos SÍ muestran el outline nativo del navegador al
  tabular. El problema no es que no se vea nada, es que se ve el azul/negro default del
  navegador, inconsistente con la marca y sin relación visual con `hover:`.
- **4 `<input>`** tienen `outline-none` sin ningún reemplazo — ahí sí es un bug real de
  accesibilidad (WCAG 2.4.7, Focus Visible): el navegador quita su indicador nativo y nada lo
  sustituye. Uno de los 4 es un campo deshabilitado (no puede recibir foco, no aplica). Los
  otros 3 son reales: el input de texto principal de `ChatInput.tsx`, el campo de contraseña en
  `PasswordInput.tsx`, y el input de edición de nombre en `PerfilPage.tsx` — todos con foco
  invisible al tabular.

De los **106**, ~30 son botones de acción primaria/destructiva en modales (confirmar, cerrar,
transferir) — exactamente donde el foco visible más importa para un asesor navegando por
teclado bajo presión.

**Patrón ya existente** (el único, en 4 `<select>` de `AdvisorModal.tsx`):
`outline-none focus:border-brand-blue`. Cambia el borde a azul de marca — funciona, pero es
débil como única señal y no está en ningún otro componente.

### Patrón propuesto — uno solo, universal

Verifiqué contraste de `brand-blue` contra las 4 superficies de fondo (no-texto, umbral
WCAG 1.4.11 = 3:1, no 4.5:1): 5.97 / 5.43 / 4.81 / 4.03 — las cuatro superan 3:1 cómodamente,
así que un ring de `brand-blue` se ve consistente sin importar dónde esté el elemento.

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60
```

Para inputs/selects, se mantiene y generaliza el patrón ya validado de `AdvisorModal`
(cambio de borde), sumado al ring para navegación por teclado:

```
outline-none focus:border-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue/60
```

Un solo patrón para botones, tabs, items de lista, inputs y selects — no dos o tres ad hoc
como hoy.

### Hover / active / disabled

- **Hover**: 189 usos ya existentes, razonablemente consistentes. No requiere rediseño, solo
  cobertura: **46 de 92 botones (50%)** no tienen ninguna clase `transition`, así que su hover
  cambia de golpe, sin transición. La clase bare `transition` de Tailwind v4 ya por defecto
  usa `150ms` + `cubic-bezier(.4,0,.2,1)` — **verificado en el CSS compilado**, cumple el
  rango 150–200ms `ease-out` pedido sin necesidad de tokens de duración nuevos. El trabajo acá
  es agregar `transition` donde falta, no inventar timing nuevo.
- **Active**: 30 usos de `active:scale-*`, divididos entre `scale-95` (25) y `scale-[0.98]`
  (4, ya el valor correcto). Propongo estandarizar en `active:scale-[0.98]` — `0.95` es un
  hundimiento demasiado marcado para controles pequeños y densos; `0.98` es el matiz más
  discreto que ya usan los 4 casos existentes.
- **Disabled**: 57 usos de `disabled:opacity-50 disabled:cursor-not-allowed`, ya consistente.
  Sin cambios — se documenta como el patrón estándar.

### Antes / después — `ScheduleManager.tsx` (input real, sin foco)

```diff
  <input
    type="text"
    placeholder="Ej: Almuerzo, Reunión de equipo…"
    {...register("label")}
-   className="w-full bg-bg-tertiary/20 border border-border-default/80 focus:border-warning/70 focus:ring-2 focus:ring-warning/5 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all placeholder-text-secondary/30"
+   className="w-full bg-bg-tertiary/20 border border-border-default focus:border-warning focus-visible:ring-2 focus-visible:ring-warning/60 text-text-primary text-body rounded-md px-3 py-2.5 outline-none transition placeholder-text-secondary/50"
  />
```

(Este input puntual ya tenía *algo* de foco — lo dejo como ejemplo de "ring casi invisible":
`ring-warning/5` es 5% de opacidad, imperceptible. Subir a `/60` es la diferencia entre un
foco decorativo y uno que realmente se ve.)

### Antes / después — tabs de `FilterBar.tsx` (sin foco, sin `type`)

```diff
  <button
+   type="button"
-   className={`${btnBase} ${activeStatus === 'mine' ? btnActive : btnInactive}`}
+   className={`${btnBase} ${activeStatus === 'mine' ? btnActive : btnInactive} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60`}
    onClick={() => onStatusChange('mine')}
  >
```

`type="button"` es un hallazgo aparte, menor: ninguno de los 4 botones de tab lo declara.
No causa bugs hoy porque no están dentro de un `<form>`, pero es buena práctica dejarlo
explícito — lo incluyo en el diff porque toca la misma línea, no porque sea foco de esta fase.

---

## 4. Motion

### Auditoría — clases que no hacen nada

Verifiqué esto en el CSS compilado, no solo por grep: **cero bytes generados** para las
siguientes clases, en los usos reales:

| Clase | Usos | Dónde |
|---|---:|---|
| `animate-fade-in` | 11 | `ChatInput.tsx`, `MessageBubble.tsx` |
| `animate-fadeIn` | 4 | `ScheduleManager.tsx`, `PerfilPage.tsx` (nombre con distinta capitalización, también indefinida) |
| `animate-scale-up` | 2 | `ChatInput.tsx` |
| `animate-in` / `slide-in-from-right` | usados en `EscalationToast.tsx` y `ToastStack.tsx` | requieren el plugin `tailwindcss-animate`, que **no está instalado** ni declarado vía `@plugin` |

Tailwind v4 solo trae nativamente `animate-spin`/`ping`/`pulse`/`bounce`/`none`. Ninguna de
estas clases custom tiene `@keyframes` ni token `--animate-*` definido en `index.css`.

**Esto es un bug funcional, no solo un vacío de diseño**: el toast de escalación
(`EscalationToast.tsx`) — la notificación más importante del panel, la que avisa que un
cliente necesita atención humana — está declarado para entrar con `slide-in-from-right` y
en la práctica **aparece de golpe, sin ninguna transición**. Lo mismo el overlay de imagen
ampliada en `ChatInput`/`MessageBubble`, y dos modales de `ScheduleManager`/`PerfilPage`.

### Tokens y utilidades propuestos

Sin agregar `tailwindcss-animate` (justificando la restricción de "no librerías nuevas
pesadas" — es un plugin pequeño pero es una dependencia más; Tailwind v4 permite definir
`@keyframes` + tokens `--animate-*` directamente, que es lo mínimo necesario aquí):

```css
@theme {
  --animate-fade-in: fade-in 180ms ease-out;
  --animate-slide-in-right: slide-in-right 200ms ease-out;
  --animate-scale-in: scale-in 150ms ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes slide-in-right {
  from { transform: translateX(12px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes scale-in {
  from { transform: scale(0.96); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
```

Esto genera `animate-fade-in`, `animate-slide-in-right`, `animate-scale-in` como clases reales.
Duraciones 150–200ms, siempre `ease-out` — igual de rápidas que las transiciones de hover, sin
rebote ni decoración.

### Los 3 casos que pediste

- **Cambio de tab** (`FilterBar`): el contenido bajo el tab activo ya cambia sin transición de
  color propia más allá del color instantáneo del botón — se propone que el badge de conteo
  (el `<span>` con el número) anime con `animate-scale-in` cuando cambia de valor, sutil,
  sin mover el layout.
- **Aparición de conversaciones nuevas** (`ConversationCard` en `BandejaPage`): se propone
  `animate-fade-in` en la tarjeta cuando se monta por primera vez (via `key` estable +ni
  transición de layout, solo opacidad — nada de slide/bounce que compita con el pulso ya
  existente de `critical-pulse-card` en conversaciones críticas).
- **Hover de botones**: ya cubierto en §3 — el problema no es la curva (150ms `ease-out` ya es
  el default de Tailwind), es la cobertura (46 de 92 botones sin `transition`).

### Antes / después — `EscalationToast.tsx` (bug real, no solo estética)

```diff
  className="fixed top-24 right-4 bg-bg-secondary border-l-4 border-l-error border border-border-default rounded-r-lg shadow-2xl p-3.5 w-80 transition-transform duration-300 ease-out z-[999] pointer-events-auto animate-in slide-in-from-right"
+ className="fixed top-24 right-4 bg-bg-secondary border-l-4 border-l-error border border-border-default rounded-r-lg shadow-md p-3.5 w-80 z-[999] pointer-events-auto animate-slide-in-right"
```

---

## Resumen — todos los tokens nuevos en un solo bloque

```css
@theme {
  /* Tipografía */
  --text-h1: 1.5rem;               --text-h1--line-height: 1.25;
  --text-h1--font-weight: 700;     --text-h1--letter-spacing: -0.01em;

  --text-h2: 1.125rem;             --text-h2--line-height: 1.3;
  --text-h2--font-weight: 700;

  --text-h3: 0.875rem;             --text-h3--line-height: 1.35;
  --text-h3--font-weight: 600;

  --text-body: 0.875rem;           --text-body--line-height: 1.5;
  --text-body--font-weight: 400;

  --text-caption: 0.75rem;         --text-caption--line-height: 1.4;
  --text-caption--font-weight: 500;

  --text-label: 0.6875rem;         --text-label--line-height: 1.3;
  --text-label--font-weight: 600;  --text-label--letter-spacing: 0.05em;

  /* Radios */
  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 1rem;

  /* Sombras — no verificadas matemáticamente, punto de partida a validar en pantalla */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-sm: 0 4px 12px -2px rgb(0 0 0 / 0.45);
  --shadow-md: 0 12px 32px -4px rgb(0 0 0 / 0.55), 0 4px 8px -4px rgb(0 0 0 / 0.4);

  /* Motion */
  --animate-fade-in: fade-in 180ms ease-out;
  --animate-slide-in-right: slide-in-right 200ms ease-out;
  --animate-scale-in: scale-in 150ms ease-out;
}

@keyframes fade-in       { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-in-right{ from { transform: translateX(12px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes scale-in      { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
```

Ya implementado (no en este bloque, ya en `src/index.css`): `--font-sans` apuntando a
`'Inter Variable'`.

## Fuera de alcance de esta fase (confirmado)

- `src/components/ui/*` (Button, Input, Select, Badge, DropdownMenu, Dialog, Card, Tooltip,
  Sonner) — código sin uso real, se trata en Fase 4.
- Espaciado/padding sin escala (`p-1, p-1.5, p-4, p-5` mezclados) — mencionado en la
  auditoría original, no forma parte de los 4 puntos pedidos para esta fase; si querés que
  lo incluya, lo agrego antes de implementar.

---

## Antes de autorizar implementación

Necesito que confirmes o ajustes:

1. **Tipografía**: ¿los 6 niveles y sus tamaños/pesos te sirven, o preferís ajustar alguno
   (por ejemplo, subir `h1` si querés más jerarquía visual en `GestionPage`)?
2. **Sombras**: son la única parte no verificada matemáticamente — ¿las aplico como punto de
   partida y las ajustamos viéndolas en pantalla real, o preferís que itere valores antes?
3. **Foco**: ¿autorizo el patrón único (`ring-brand-blue/60`) para los 91 elementos sin foco
   y los 3 inputs con bug real, o preferís revisar el patrón en 1-2 componentes primero?
4. **Motion**: ¿implemento las 3 keyframes + el fix del toast (bug real), o preferís acotar
   el scope de motion en esta primera pasada?

Cuando confirmes, paso a la Fase 3: aplicar tokens a `index.css` y luego componente por
componente, empezando por los compartidos (sidebar, botones base, tabs) como indica el plan
original.
