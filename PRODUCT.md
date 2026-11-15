# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Alejandro, uso personal diario: organiza sus propias tareas, notas y metas diarias en un único tablero. Un solo usuario, sin colaboración en equipo real.

## Product Purpose

Tablero personal de productividad: gestionar tareas pendientes, escribir notas en Markdown y hacer seguimiento de metas diarias (con rachas). El éxito es poder ver de un vistazo qué toca hoy, registrar trabajo en sesiones cronometradas y mantener constancia en metas.

## Positioning

Herramienta propia y sin fricción: todo local (localStorage), instantáneo y privado, instalable como PWA. A diferencia de un gestor de equipo, es el tablero de una sola persona y no necesita simulacros de colaboración.

## Operating Context

Uso cotidiano en escritorio (y ocasionalmente móvil vía PWA), tanto de día como de noche (tema claro/oscuro con conmutador). Los datos viven en el navegador del usuario (clave `productivity-dashboard`); se pueden exportar/importar JSON. Nada de servidores ni cuentas.

## Capabilities and Constraints

- Vistas: Inicio (dashboard), Tareas (filtros por estado/prioridad/categoría, búsqueda), Notas (lista + editor Markdown con vista previa), Metas (diarias con contador, racha y gráfico semanal), Datos (exportar/importar/borrar).
- Temporizador de sesión en Inicio: iniciar/pausar/reiniciar y guardar la sesión como nota.
- Tema claro y oscuro persistente; atajos de teclado (D, 1, 2, 3, T, ?).
- PWA con service worker y manifest (instalable).
- Stack: Vite + JavaScript vanilla (SPA sin framework), CSS con tokens propios. Sin dependencias de UI.
- Decidido: toda la interfaz en español (los widgets demo en inglés se eliminan); Inicio muestra solo datos reales (tareas de hoy, notas recientes, progreso de metas, temporizador) sin contenido ficticio.

## Brand Commitments

Nombre: "Tablero" (título y marca en la cabecera). Sin logotipo propio; el icono actual es un SVG de cuadrícula.

## Evidence on Hand

Datos de prueba reales en el navegador del usuario (2 tareas, 2 notas, 1 meta "Beber agua" con racha). Nada de testimonios, métricas de clientes ni cases: no fabricarlos.

## Product Principles

1. De un vistazo: el estado de hoy (tareas, metas, notas) se entiende sin interacción.
2. Local y privado: todo funciona sin red, sin cuenta, sin servidor.
3. Español consistente: ninguna etiqueta en inglés.
4. Rapidez percibida: interacciones inmediatas, sin animación en acciones frecuentes de teclado.

## Accessibility & Inclusion

Contraste suficiente en ambos temas; navegación por teclado completa (atajos existentes); respeto a `prefers-reduced-motion`.
