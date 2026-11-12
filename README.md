# Tablero Personal de Productividad

![Dashboard Preview](docs/screenshot.png)

Una aplicación web ligera (SPA) que integra **lista de tareas**, **notas en Markdown** y **rastreador de metas diarias** en un solo dashboard. Funciona 100% offline, sin backend, usando `localStorage` para persistencia.

## ✨ Características

| Módulo | Funcionalidades |
|--------|-----------------|
| **📋 Tareas** | CRUD completo, prioridades (alta/media/baja), fechas límite, categorías, drag & drop para reordenar, filtros y búsqueda |
| **📝 Notas** | Editor Markdown con preview en tiempo real (split view), sintaxis GitHub Flavored, tags, favoritos, búsqueda full-text |
| **🎯 Metas** | Progreso visual con anillos SVG, rachas (streaks), reset automático diario, tipos flexibles (veces, minutos, litros, etc.) |
| **🎨 UI** | Modo claro/oscuro (persistente + detección sistema), responsive 3-col → 2-col → tabs móvil, accesible (WCAG 2.1 AA) |
| **💾 Datos** | Persistencia en `localStorage`, exportar/importar JSON, sin dependencias de backend |
| **⚡ Rendimiento** | < 50KB gzipped, carga instantánea, PWA ready (Service Worker) |

## 🚀 Instalación (3 pasos)

```bash
# 1. Clonar repositorio
git clone https://github.com/alexfloresmorales26-cmyk/Dashboard.git
cd Dashboard

# 2. Instalar dependencias (solo dev: Vite + ESLint)
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

La app se abrirá en `http://localhost:5173`.

## 🛠 Stack Tecnológico

- **Core**: Vanilla JS (ES Modules) — sin framework, sin build step obligatorio
- **Estilos**: CSS Custom Properties + CSS Grid/Flex — temas dinámicos nativos
- **Markdown**: [`marked`](https://marked.js.org/) + [`DOMPurify`](https://github.com/cure53/DOMPurify) (vía CDN ESM)
- **Iconos**: [Lucide](https://lucide.dev/) (SVG inline, tree-shakeable)
- **Persistencia**: `localStorage` + store reactivo tipo signals
- **Build/Dev**: [Vite](https://vitejs.dev/) — HMR rápido, build optimizado

## 📦 Scripts Disponibles

```bash
npm run dev      # Servidor desarrollo con HMR
npm run build    # Build producción en ./dist
npm run preview  # Preview build local
npm run lint     # ESLint en src/
```

## 📁 Estructura del Proyecto

```
├── index.html              # Entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── vite.config.js          # Config Vite
├── .gitignore
├── LICENSE
├── README.md
├── src/
│   ├── main.js             # Bootstrap + router hash
│   ├── styles/
│   │   ├── variables.css   # Design tokens (colores, spacing, etc.)
│   │   ├── reset.css       # Normalize mínimo
│   │   ├── layout.css      # Grid dashboard responsive
│   │   └── components.css  # Componentes UI reutilizables
│   ├── store/
│   │   ├── index.js        # API reactiva unificada
│   │   ├── tasks.js        # CRUD tareas
│   │   ├── notes.js        # CRUD notas Markdown
│   │   └── goals.js        # CRUD metas diarias
│   ├── components/
│   │   ├── Header/         # Header con tema, fecha, stats
│   │   ├── Layout/         # DashboardLayout (3 columnas)
│   │   ├── TaskList/       # Lista, item, formulario tareas
│   │   ├── Notes/          # Lista, editor split, tarjeta nota
│   │   └── Goals/          # Tracker, tarjeta meta, formulario
│   ├── utils/
│   │   ├── reactive.js     # Mini signal store
│   │   ├── id.js           # nanoid casero
│   │   ├── date.js         # Helpers fecha (ES)
│   │   └── markdown.js     # Wrapper marked + sanitize
│   └── views/
│       ├── DashboardView   # Vista principal (3 widgets)
│       ├── TasksView       # Vista expandida tareas
│       ├── NotesView       # Vista expandida notas
│       └── GoalsView       # Vista expandida metas
└── public/
    ├── favicon.svg
    └── icons/              # PWA icons
```

## 🌐 Deploy

### GitHub Pages
1. Settings → Pages → Source: "GitHub Actions"
2. Push a `main` → deploy automático

### Netlify / Vercel
```bash
# Build command: npm run build
# Output directory: dist
# Install command: npm install
```

## 📱 PWA

- `manifest.json` configurado para "Add to Home Screen"
- `sw.js` con estrategia **cache-first** + **stale-while-revalidate**
- Funciona offline tras primera carga

## ♿ Accesibilidad

- Contraste AA en ambos temas
- Navegación 100% por teclado
- ARIA labels en controles interactivos
- Focus visible personalizado
- `prefers-reduced-motion` respetado
- Semántica HTML5 correcta

## 🔧 Personalización

### Temas
Edita `src/styles/variables.css` para cambiar:
- Paleta de colores (`--color-primary`, `--color-bg`, etc.)
- Espaciado (`--space-*`)
- Tipografía (`--font-*`)
- Radios (`--radius-*`)

### Atajos de teclado (Notas)
| Atajo | Acción |
|-------|--------|
| `Ctrl/Cmd + B` | Negrita |
| `Ctrl/Cmd + I` | Cursiva |
| `Ctrl/Cmd + K` | Insertar enlace |
| `Ctrl/Cmd + S` | Guardar nota |

## 📄 Licencia

MIT License — ver [LICENSE](LICENSE) para detalles.

---

## 🤝 Contribuir

1. Fork del repo
2. Crea rama: `git checkout -b feat/mi-feature`
3. Commit convencional: `git commit -m "feat: añade mi feature"`
4. Push: `git push origin feat/mi-feature`
5. Abre Pull Request

## 📞 Contacto

- GitHub: [@alexfloresmorales26-cmyk](https://github.com/alexfloresmorales26-cmyk)
- Repo: [Dashboard](https://github.com/alexfloresmorales26-cmyk/Dashboard)

---

> Hecho con ❤️ usando tecnologías web nativas. Sin frameworks pesados, solo lo esencial.
