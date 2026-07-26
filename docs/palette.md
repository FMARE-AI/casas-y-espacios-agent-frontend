# Paleta de Colores — Panel Casas y Espacios

**Fuente de verdad del color del sistema.** Refleja el estado del código al cierre de la Fase 1.5.

Todo el color vive en `src/index.css`. No hay `tailwind.config.js` — Tailwind v4 genera las
utilidades desde el bloque `@theme`. **Cero hex literales en `*.tsx`**: si necesitás un color,
usás un token; si el token no existe, se agrega acá primero.

---

## 1. Reglas de uso

1. **Nunca escribas un hex en un componente.** Ni como clase (`bg-[#252522]`), ni en
   `style={{}}`, ni en una constante JS. Usá la clase del token (`bg-bg-secondary`) o
   `var(--color-bg-secondary)` cuando estés dentro de un bloque `<style>` o de un gradiente inline.
2. **Las variantes se derivan, no se inventan.** Un hover se hace con opacidad (`/90`, `/15`) o
   con un token `-hover` ya definido. No se agrega un hex nuevo "parecido".
3. **Texto sobre relleno de acento va oscuro.** Ver §4: texto claro sobre `brand-blue`, `error`,
   `success` o `warning` falla AA por un margen amplio en todos los casos.
4. **La prosa no es código fuente.** `specs/`, `docs/` y `mockup.md` están excluidos del escaneo
   de Tailwind vía `@source not`. Sin eso, los snippets citados en los docs se compilan como CSS
   muerto al bundle de producción — y además enmascaran clases huérfanas al verificar.

---

## 2. Tokens

### 2.1 Fondos

| Token | Hex | Uso |
|---|---|---|
| `--color-bg-main` | `#1D1D1B` | Fondo raíz de la app; también superficie de popovers/menús |
| `--color-bg-secondary` | `#252522` | Paneles y tarjetas |
| `--color-bg-tertiary` | `#2E2E2B` | Elementos elevados dentro de un panel; inputs |
| `--color-bg-overlay` | `#1A1A18` | Stop medio del gradiente radial de fondo |
| `--color-bg-deep` | `#111110` | Stop externo del gradiente radial de fondo |

`bg-overlay` y `bg-deep` existen solo para el backdrop radial de `LoginPage`, `FirstLoginPage`
y `BandejaPage`, junto con `brand-glow`.

### 2.2 Marca

| Token | Hex | Derivación | Uso |
|---|---|---|---|
| `--color-brand-blue` | `#01A4E3` | base | Color de marca; acciones primarias |
| `--color-brand-blue-hover` | `#0190C8` | base × 0.88 | Hover en superficies rellenas de azul |
| `--color-brand-blue-light` | `#01B4F3` | base × 1.10 | Hover en texto azul; stop claro de gradiente |
| `--color-brand-glow` | `#1E3A4A` | base mezclado con `bg-deep` | Stop interno del backdrop radial |

Los cuatro tokens colapsan los **8 azules distintos** que existían antes del refactor
(`#0190C8`, `#01B4F3`, `#33B8F0`, `#008BBF`, `#0088C2`, `#007BB0`, `#007BA8`, `#1E3A4A`).

### 2.3 Bordes y texto

| Token | Hex | Uso |
|---|---|---|
| `--color-border-default` | `#3A3A37` | Borde estándar; también superficie de hover en menús |
| `--color-text-primary` | `#F0F0F5` | Texto principal |
| `--color-text-secondary` | `#A7A79D` | Texto secundario, labels, placeholders |

`text-secondary` fue rebalanceado en la Fase 1.5. El valor anterior (`#8B8FA8`) era frío
(canal B por encima de R y G) y fallaba AA sobre dos de las cuatro superficies. El actual
tiene el canal B un **6% por debajo** de R=G, replicando la calidez relativa de `bg-tertiary`
(6.5%), y pasa AA en las cuatro. Ver §4.

### 2.4 Estados

| Token | Hex | Derivación | Uso |
|---|---|---|---|
| `--color-error` | `#FF5B5B` | base | Error, crítico, destructivo |
| `--color-success` | `#00D4AA` | base | Éxito, activo, disponible |
| `--color-warning` | `#FFB84D` | base | Advertencia |
| `--color-warning-hover` | `#F0A83A` | oscurecido | Hover en superficies rellenas de warning |

`warning-hover` no es un duplicado de `warning`: es el hover de un botón `bg-warning`
(`ScheduleManager.tsx`). Colapsarlo habría eliminado el efecto. Es un oscurecimiento algo más
cálido que un escalado uniforme de `warning`.

### 2.5 Superficies de documento (papel)

Estos tokens **se mantienen claros a propósito** y están deliberadamente fuera de la rampa
oliva y del remapeo de `.dark`. Estilan las vistas previas de Word (`.docx`) y Excel en
`ChatInput.tsx`, que renderizan una metáfora de papel, no chrome de la app. Forzarlos a la
paleta oscura volvería ilegible el texto casi negro del documento.

| Token | Hex | Uso |
|---|---|---|
| `--color-doc-surface` | `#F8F9FA` | Superficie de papel; track de scrollbar; filas alternas |
| `--color-doc-surface-muted` | `#EDF2F7` | Hover de fila; fondo de tab inactivo |
| `--color-doc-border` | `#E2E8F0` | Bordes de tabla y separadores; hover de tab |
| `--color-doc-scroll-thumb` | `#CBD5E0` | Thumb de scrollbar |
| `--color-doc-scroll-thumb-hover` | `#A0AEC0` | Thumb en hover |
| `--color-doc-text` | `#1A202C` | Texto del documento |
| `--color-doc-text-muted` | `#4A5568` | Label de tab inactivo |

Reemplazan la familia gris-azulada ajena (slate/gray de Tailwind v3) que estaba suelta:
`#F8F9FA`, `#F7FAFC`, `#EDF2F7`, `#E2E8F0`, `#CBD5E0`, `#A0AEC0`, `#2D3748`, `#1A202C`, `#4A5568`.
Se colapsaron dos pares imperceptibles: `#F7FAFC`→`doc-surface` y `#2D3748`→`doc-text`.

### 2.6 Tipografía

| Token | Valor | Estado |
|---|---|---|
| `--font-sans` | `'Inter', sans-serif` | ⚠️ **Inter no está cargada** |

No hay `@font-face`, ni `@fontsource`, ni archivos `.woff2` en el repo, y el CSP de
`index.html` declara `font-src 'self'` — un `<link>` a Google Fonts quedaría bloqueado.
Hoy el panel cae al fallback del sistema operativo, así que **la tipografía varía según la
máquina del asesor**. Pendiente de resolver en Fase 2 con `@fontsource` (self-hosted, respeta
el CSP sin tocarlo).

---

## 3. Tokens de shadcn/ui

`src/index.css` tiene un segundo bloque, `@theme inline`, con los tokens semánticos de
shadcn (`--color-primary`, `--color-card`, `--color-chart-1..5`, `--radius-*`). Ese bloque
**no se eliminó**: apunta a variables definidas en `:root` y `.dark`, y esas variables ahora
referencian la paleta oliva.

`:root` y `.dark` comparten los mismos valores. El panel es dark-only, así que el tema claro
de stock no aporta nada y su presencia era un bug activo: `@layer base` aplica
`body { bg-background text-foreground }`, y con los valores de stock el `<body>` era **blanco
con texto negro** — solo quedaba oculto porque cada pantalla pintaba su propio fondo encima.
Igualar ambos bloques también elimina el flash de blanco antes de que `next-themes` monte
`.dark`.

| Token shadcn | Referencia |
|---|---|
| `--background` | `bg-main` |
| `--foreground` | `text-primary` |
| `--card` / `--card-foreground` | `bg-secondary` / `text-primary` |
| `--popover` / `--popover-foreground` | `bg-main` / `text-primary` |
| `--primary` / `--primary-foreground` | `brand-blue` / `bg-main` |
| `--secondary` / `--secondary-foreground` | `bg-tertiary` / `text-primary` |
| `--muted` / `--muted-foreground` | `bg-tertiary` / `text-secondary` |
| `--accent` / `--accent-foreground` | `border-default` / `text-primary` |
| `--destructive` / `--destructive-foreground` | `error` / `bg-main` |
| `--border` / `--input` | `border-default` |
| `--ring` | `brand-blue` |
| `--chart-1..5` | `brand-blue`, `success`, `warning`, `error`, `brand-blue-light` |

**`--popover` es `bg-main`, no `bg-tertiary`.** Es una restricción de contraste, no una
preferencia estética: un ítem destructivo de menú tiñe su fila con `--destructive`, y sobre un
popover `bg-tertiary` esa fila mide 3.69:1 con cualquier opacidad — 4.47:1 incluso con tint
cero. Sobre `bg-main` mide 4.55:1. Los popovers se leen como flotantes por su borde
(`border-default`, bien visible contra `bg-main`) más su sombra, no por un relleno más claro.

`.dark` se monta en `<html>` vía el `ThemeProvider` de `next-themes` en `src/main.tsx`, con
`forcedTheme="dark"`.

---

## 4. Contraste (WCAG 2.1)

Umbrales: **AA 4.5:1** para texto normal, **AAA 7:1**. `text-xs` (12px) es el tamaño dominante
del sistema, así que casi nada califica como "texto grande" — asumir siempre el umbral estricto.

| Primer plano | bg-main | bg-secondary | bg-tertiary | border-default |
|---|---:|---:|---:|---:|
| `text-primary` | 14.86 AAA | 13.53 AAA | 11.99 AAA | 10.05 AAA |
| `text-secondary` | 6.96 AA | 6.34 AA | 5.61 AA | 4.70 AA |
| `brand-blue` | 5.97 AA | 5.43 AA | 4.81 AA | **4.03 ❌** |
| `brand-blue-light` | 7.09 AAA | 6.46 AA | 5.72 AA | 4.79 AA |
| `error` | 5.55 AA | 5.05 AA | **4.47 ❌** | **3.75 ❌** |
| `success` | 8.84 AAA | 8.05 AAA | 7.13 AAA | 5.98 AA |
| `warning` | 9.82 AAA | 8.94 AAA | 7.92 AAA | 6.64 AA |

### 4.1 Restricciones conocidas

- **No pongas texto `error` sobre `bg-tertiary` ni sobre `border-default`** (4.47 y 3.75).
  Sobre `bg-main` y `bg-secondary` está bien. Si necesitás rojo sobre una superficie elevada,
  usá `bg-main` como fondo de esa fila.
- **No pongas texto `brand-blue` sobre `border-default`** (4.03).
- **El tint destructivo tiene techo `/15`.** `text-destructive` sobre `bg-destructive/X` cae por
  debajo de AA a partir de `/18`. La escala en uso es reposo `/10` (4.90), interactivo `/15`
  (4.55).

### 4.2 Texto sobre rellenos sólidos de acento

Siempre **texto oscuro** (`bg-main`). El texto claro falla en todos los casos, por márgenes grandes:

| Relleno | `bg-main` encima | `text-primary` encima |
|---|---:|---:|
| `brand-blue` | 5.97 AA | **2.49 ❌** |
| `brand-blue-hover` | 4.68 AA | **3.17 ❌** |
| `error` | 5.55 AA | **2.68 ❌** |
| `success` | 8.84 AAA | **1.68 ❌** |
| `warning` | 9.82 AAA | **1.51 ❌** |
| `warning-hover` | 8.34 AAA | **1.78 ❌** |

Por esto `--primary-foreground` y `--destructive-foreground` son `bg-main` y no `text-primary`.

### 4.3 Superficies de documento

| | sobre `doc-surface` | sobre `doc-surface-muted` |
|---|---:|---:|
| `doc-text` | 15.48 AAA | 14.49 AAA |
| `doc-text-muted` | 7.14 AAA | 6.68 AA |

---

## 5. Uso actual

1137 usos de clase con token, 55 clases únicas, 57 usos de `var(--color-*)`, **0 hex en `*.tsx`**.

| Token | Usos como clase |
|---|---:|
| `text-secondary` | 200 |
| `border-default` | 178 |
| `brand-blue` | 169 |
| `error` | 157 |
| `bg-tertiary` | 121 |
| `warning` | 77 |
| `success` | 69 |
| `text-primary` | 65 |
| `bg-secondary` | 52 |
| `bg-main` | 21 |
| `brand-blue-hover` | 16 |
| `brand-blue-light` | 4 |
| `doc-border` | 3 |
| `doc-surface` | 2 |
| `warning-hover`, `doc-text-muted`, `doc-surface-muted` | 1 c/u |

Los tokens `doc-*`, `bg-overlay`, `bg-deep` y `brand-glow` se consumen mayormente como
`var(--color-*)` dentro de bloques `<style>` y gradientes inline, no como clases, por lo que su
conteo de clases subestima su uso real.

---

## 6. Animaciones

Definidas en `@layer utilities`. Ambas tokenizadas — sin hex ni `rgba()` literal.

| Clase | Animación | Nota |
|---|---|---|
| `.critical-pulse-card` | `criticalPulse` 2s infinite | Usa `color-mix(in srgb, var(--color-error) X%, transparent)`; agrega `border-left` de 4px |
| `.critical-pulse-badge` | `criticalPulse` 2s infinite | Igual glow, sin el `border-left` |
| `.ws-pulse-dot` | `wsPulse` 1.6s infinite | Solo `transform`/`opacity` |

---

## 7. Fuera del alcance del color — pendiente de Fase 2

Estos hallazgos de la auditoría **no** se resolvieron en la Fase 1.5 (que fue solo color):

- **Radios**: 9 valores distintos en uso (`rounded-full` 92, `lg` 75, `xl` 61, `md` 29, `2xl` 10,
  dos arbitrarios de shadcn, `sm` 1, `[2px]` 1). `ChatInput.tsx` usa cinco en un archivo.
- **Sombras**: 6 niveles de Tailwind más 4 arbitrarios. Las sombras de Tailwind son negro con
  alpha, calibradas para fondos claros; sobre `bg-main` son casi invisibles, y por eso
  `shadow-2xl` aparece 11 veces como parche sin efecto real.
- **Tipografía**: 89% de los usos son `text-xs`/`text-sm`; los titulares (`lg`..`4xl`) suman 18
  usos sin progresión coherente. 128 usos de peso ≥700 contra 26 de `font-medium` — la jerarquía
  se comunica engordando texto en lugar de con tamaño y color.
- **Espaciado**: sin escala. `PerfilPage` usa `p-1, p-1.5, p-4, p-5` más 6 variantes de `py`;
  `AdvisorModal` mezcla `px-3.5` y `px-4.5` con enteros.
- **Foco de teclado**: `focus-visible:` aparece 17 veces contra 189 de `hover:`. Es la dimensión
  menos cubierta y la que más importa para accesibilidad.
- **`src/components/ui/` no se usa.** Los 10 archivos del kit shadcn están sin referenciar desde
  la app (solo `dialog.tsx` importa `button.tsx`, y nadie importa `dialog.tsx`). Su contraste
  quedó corregido y verificado, pero hoy no renderizan en ningún flujo. Decidir si se adoptan o
  se eliminan.
