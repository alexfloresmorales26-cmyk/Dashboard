---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface brief — Tablero (index.html, vista Inicio)

## Direction contract

**THESIS.** El tablero es un instrumento diario que se lee en cifras, no un escaparate: casi sin color, negro sobre blanco, un solo azul usado con avaricia. Rechaza la disposición por defecto de la categoría —la app de tarjetas redondeadas pastel con un chip de color por widget— y en su lugar cada bloque empareja una afirmación con su prueba: la cifra es grande y tabular, la evidencia pequeña y gris. La jerarquía nace del contraste de escala y de las líneas finas, nunca de la variedad de color. El dato es el héroe; el resto es silencio.

**OWN-WORLD.** Paleta: fondo casi blanco `#fafafa`, tinta casi negra `#111114`, un azul `#2d5bff` reservado a cuatro usos (marcador de sección activa, botón primario sólido, relleno de progreso, botón de play); líneas finas `#e4e4e7` y `#ececef`; gris `#71717a` para texto secundario y `#a1a1aa` terciario. Lenguaje de componentes: franjas y tablas con borde de 1px que comparten un único sistema de retícula (costuras grises de 1px entre celdas), botones fantasma de borde fino, un solo botón sólido azul por vista, etiquetas de sección en versalitas con tracking, cifras tabulares en todo número, display en Archivo 600 y filas hechas en gris tachado — el estado se lee por forma, no solo por color.

**STORY.** Alejandro abre Tablero y en segundos sabe qué toca hoy: las cuatro cifras (tareas, notas, meta, vencidas), qué está pendiente y qué hecho, el progreso y la racha de su meta, y dónde está el temporizador de sesión. Cree en los números porque cada uno lleva a su lado el detalle que lo demuestra. Actúa de inmediato: añade una tarea desde la cabecera, marca una casilla, arranca el temporizador — y todo persiste en local. Sin onboarding ni decoración: el instrumento ya está encendido y responde al instante.

**FIRST VIEWPORT.** 1440×900. Raíl izquierdo de 236px sobre blanco con divisora fina a la derecha: logo "Tablero" (800, 21px), nav Inicio/Tareas/Notas/Metas (Inicio activo: texto negro + cuadrado azul de 7px), "Datos" fijado abajo. Principal con 40px/52px de margen: titular "Lo de hoy" en Archivo 600 41px (cap 29.6px) con sublínea gris de fecha y conteos; botón sólido azul "+ Nueva tarea" arriba a la derecha. Franja de métricas de cuatro celdas con línea fina (cifras tabulares de 56px sobre etiquetas grises), y debajo tres columnas de línea fina: Tareas de hoy (filas con casilla, una tachada), Metas 1/1 hoy con barra de progreso y racha, y Notas apiladas, y Sesión a la derecha (temporizador 42px, tres botones circulares fantasma, el del medio azul).

**FORM.** Dirección elegida "Marketing monocromo" (challenger `digital-design-canon-monochrome-product-marketing`), elegida por el usuario sobre la asignada del rollo (posición 6 de la lista ordenada, La pizarra del bar): gana en claridad para un instrumento de cifras y hereda de la pizarra la disciplina de estado-por-forma (filas tachadas, nunca solo color). Seed reference `seed:cb9a1d5637b15873`. Build path resuelto comp-led esta sesión: comp de decisión aprobada `.impeccable/mocks/decision/challenger-monochrome.webp` (captura del sketch propio `challenger-monochrome.html`, procedencia en sidecar; cuota del API de imágenes de Google agotada), más las variantes `comp-2.png` (table-led) y `comp-3.png` (focus-led) bajo `.impeccable/mocks/`.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
