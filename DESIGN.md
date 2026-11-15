# DESIGN.md — Tablero · mundo monocromo

## Dirección visual

**Marketing monocromo** — challenger `digital-design-canon-monochrome-product-marketing`, elegida sobre la asignada del rollo (La pizarra). Un instrumento de cifras, no un escaparate: casi sin color, negro sobre blanco, un solo azul usado con avaricia.

- Fondo: `#fafafa` (near-white)
- Tinta: `#111114` (near-black)
- Acento: `#2d5bff` (azul, cuatro usos: marcador de sección activa, botón primario sólido, relleno de progreso, botón de play)
- Líneas finas: `#e4e4e7` / `#ececef`
- Gris secundario: `#71717a`; terciario: `#a1a1aa`
- Dark theme: escala invertida (`#131316` fondo, `#f4f4f5` tinta, `#7d96ff` acento)

## Tipografía

- **Archivo** (autohospedada, variable 100–900): `public/fonts/archivo-variable-latin{,-ext}.woff2`
- Display: Archivo 600, 41px (cap ≈ 29.6px, tracking -0.03em)
- Cifras grandes: Archivo 800, cifras tabulares en todo número (`font-variant-numeric: tabular-nums`)
- Cuerpo: Archivo, 15px, leading 1.5
- Secciones (h2): versalitas, tracking 0.12em, tamaño 13px

## Sistema de tokens (`src/styles/variables.css`)

Colores: `--bg`, `--surface`, `--surface-2`, `--ink`, `--ink-2`, `--ink-3`, `--line`, `--line-soft`, `--accent`, `--accent-hover`, `--accent-ink`, `--danger`, `--danger-soft`.

Espacio (escala 4): `--s-1` a `--s-10` (4px–64px).

Forma: `--r-sm` (5px), `--r-md` (8px), `--r-lg` (10px), `--r-full` (999px).

Movimiento: `--ease-out` (cubic-bezier 0.22,1,0.36,1), `--dur-fast` (120ms), `--dur-base` (180px). `prefers-reduced-motion` reduce todas las transiciones/animaciones a 0.01ms.

Layout: `--rail-w` (236px), `--measure` (68ch).

## Estructura de shell

- `index.html`: entrada única, `data-theme="light"`, sin header superior, sin breadcrumbs. `APP_VERSION = '3'`.
- Raíl izquierdo fijo de 236px: logo "Tablero" (palabra, sin icono), nav Inicio/Tareas/Notas/Metas (Inicio activo: texto negro + cuadrado azul 7px), "Datos" pinned al fondo, conmutador de tema junto a "Datos".
- `#main`: padding 40px 52px, una sola caja de hairlines (`.dash__board`).
- `theme-dark.css` borrado: tokens light+dark viven en `variables.css`.

## Vista Inicio (DashboardView)

Solo datos reales del store (2 tareas pendientes, 2 notas, 1 meta, 0 vencidas). Nada de contenido ficticio.

- Cabecera: titular "Lo de hoy" + sublínea con fecha y conteos reales; botón sólido azul "+ Nueva tarea" a la derecha.
- Franja de 4 métricas (cifras tabulares grandes): Tareas totales, Notas, Meta · x/y hoy, Vencidas.
- Tres columnas de línea fina: Tareas de hoy (filas con casilla, tachado al completarse), Metas (barra de progreso azul fina, racha), Notas (apiladas, vista previa en texto plano), Sesión (temporizador 42px, 3 botones circulares fantasma, play azul del medio).
- Temporizador de sesión real con inicio/pausa/reset y guardado como nota.

## Migración de tema (`src/store/index.js`)

- `STORAGE_VERSION = 1` (no se borran datos).
- `worldMigrated`: el `dark` heredado del mundo antiguo se descarta una vez y arranca en claro; `themeMigrated` para la migración previa de tema.
- `db.toggleTheme()` alterna entre claro y oscuro; se persiste en localStorage.

## Accesibilidad y movimiento

- `:focus-visible` con anillo azul (2px, offset 2px).
- `btn:active` → `scale(0.97)`; sin animación desencadenada por teclado.
- Todos los controles tienen `aria-label`; raíl tipográfico sin iconos en nav.

## Build

- `npm run build` limpio: JS ~128 KB, CSS ~22.9 KB.
- Vite, `outDir: dist`, entrada `index.html`.

## Origen de la comp

- Comp aprobado: `.impeccable/mocks/decision/challenger-monochrome.webp` (sketch propio autohospedado; procedencia declarada en sidecar; cuota de API de imágenes agotada).
- `regions.json`: 11 regiones medidas con `comp-spec`.
- Dirección contract: `.impeccable/surfaces/index-html.md` (THESIS/OWN-WORLD/STORY/FIRST VIEWPORT/FORM/FINISH, seed `cb9a1d5637b15873`).
