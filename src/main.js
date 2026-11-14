/**
 * Entry Point - Bootstrap de la aplicación
 * Inicializa store, router hash, componentes principales
 */

import { db } from './store/index.js';
import { Header } from './components/Header/Header.js';
import { DashboardView } from './views/DashboardView.js';
import { TasksView } from './views/TasksView.js';
import { NotesView } from './views/NotesView.js';
import { GoalsView } from './views/GoalsView.js';
import { preload } from './utils/markdown.js';
import { ICONS } from './components/Header/Header.js';

// Precargar librerías markdown
preload();

// ============================================
// CONFIGURACIÓN DE NAVEGACIÓN
// ============================================

const NAV_ITEMS = [
  { route: 'dashboard', label: 'Inicio', icon: ICONS.dashboard },
  { route: 'tasks', label: 'Tareas', icon: ICONS.list },
  { route: 'notes', label: 'Notas', icon: ICONS.fileText },
  { route: 'goals', label: 'Metas', icon: ICONS.target },
];

const ROUTE_LABELS = {
  dashboard: 'Inicio',
  tasks: 'Tareas',
  notes: 'Notas',
  goals: 'Metas',
};

// ============================================
// ROUTER SIMPLE (hash-based)
// ============================================

const routes = {
  '': DashboardView,
  'dashboard': DashboardView,
  'tasks': TasksView,
  'notes': NotesView,
  'goals': GoalsView
};

let currentView = null;
let currentViewInstance = null;

function getRoute() {
  const hash = window.location.hash.slice(1) || '';
  return hash.split('/')[0] || 'dashboard';
}

// Navegación programática (definida temprano para evitar ReferenceError)
export function goTo(route, params = []) {
  const hash = params.length > 0 ? `${route}/${params.join('/')}` : route;
  window.location.hash = hash;
}

async function navigate() {
  const route = getRoute();
  const ViewClass = routes[route] || DashboardView;
  // Parámetro opcional de la ruta (p. ej. notes/<id> para abrir una nota concreta)
  const param = window.location.hash.split('/')[1] || null;

  // Renderizar sidebar y breadcrumbs (solo una vez al inicio, luego actualizar)
  if (currentView === null) {
    renderSidebar();
    renderBreadcrumbs();
  } else {
    updateActiveIndicators(route);
  }

  // Limpiar vista anterior
  if (currentViewInstance && typeof currentViewInstance.destroy === 'function') {
    currentViewInstance.destroy();
  }

  // Renderizar nueva vista (el DashboardView es standalone: incluye sus
  // propias tarjetas de estadísticas y grid de widgets)
  const main = document.getElementById('main');
  if (!main) return;

  // Agregar clase de entrada para animación
  main.classList.remove('view-fade-in');
  void main.offsetWidth; // forzar reflow
  main.classList.add('view-fade-in');

  main.innerHTML = '';
  currentViewInstance = new ViewClass({ db, onNavigate: goTo, param });
  const viewElement = currentViewInstance.render();
  main.appendChild(viewElement);

  currentView = route;

  // Actualizar indicadores activos después de renderizar
  updateActiveIndicators(route);
}

function updateHeaderActive(route) {
  // Mantenido por compatibilidad, ahora se maneja en updateActiveIndicators
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="nav-sidebar__header">
      <div class="nav-sidebar__brand">
        <span class="nav-sidebar__brand-icon">${ICONS.dashboard}</span>
        <span>Tablero</span>
      </div>
    </div>

    <nav class="nav-sidebar__nav" aria-label="Secciones">
      ${NAV_ITEMS.map(item => `
        <button class="nav-item ${getRoute() === item.route ? 'nav-item--active' : ''}"
                data-nav="${item.route}"
                aria-label="${item.label}"
                title="${item.label}">
          <span class="nav-item__icon">${item.icon}</span>
          <span class="nav-item__label">${item.label}</span>
        </button>
      `).join('')}
    </nav>

    <div class="nav-sidebar__footer">
      <button class="nav-action nav-action--danger" title="Gestión de datos" aria-label="Gestión de datos">
        ${ICONS.database} Datos
      </button>
    </div>
  `;

  // Event listeners para navegación del sidebar
  sidebar.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      const route = el.dataset.nav;
      window.location.hash = route;
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });

  // Gestión de datos
  sidebar.querySelector('.nav-action--danger')?.addEventListener('click', () => {
    import('./components/DataManager/DataManager.js').then(({ default: DataManager }) => {
      const dm = DataManager({ onClose: () => dm.destroy() });
      document.body.appendChild(dm);
    });
  });
}

function renderBreadcrumbs() {
  const breadcrumbs = document.getElementById('breadcrumbs');
  if (!breadcrumbs) return;

  const route = getRoute();
  const label = ROUTE_LABELS[route] || route;

  breadcrumbs.innerHTML = `
    <div class="breadcrumb__item">
      <span class="breadcrumb__label">Tablero</span>
    </div>
    <span class="breadcrumb__separator">›</span>
    <div class="breadcrumb__item breadcrumb__item--current">
      <span class="breadcrumb__label">${label}</span>
    </div>
  `;
}

function updateActiveIndicators(route) {
  // Actualizar sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.querySelectorAll('.nav-item').forEach(el => {
      const isActive = el.dataset.nav === route;
      el.classList.toggle('nav-item--active', isActive);
    });
  }

  // Actualizar header nav items (solo botones de navegación, no el brand)
  const header = document.getElementById('header');
  if (header) {
    header.querySelectorAll('.header__nav-item[data-nav]').forEach(el => {
      const isActive = el.dataset.nav === route;
      el.classList.toggle('header__nav-item--active', isActive);
    });
  }

  // Actualizar breadcrumbs
  renderBreadcrumbs();
}

// ============================================
// EVENTOS GLOBALES PARA ACCIONES RÁPIDAS
// ============================================

window.addEventListener('app:add-task', () => {
  if (currentView === 'tasks' && currentViewInstance?.taskList) {
    const btn = currentViewInstance.taskList.querySelector('[data-add-task]');
    btn?.click();
  } else if (currentView === 'dashboard') {
    goTo('tasks');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('app:add-task'));
    }, 100);
  } else {
    goTo('tasks');
  }
});

window.addEventListener('app:add-note', () => {
  if (currentView === 'notes' && currentViewInstance) {
    currentViewInstance.createNote?.();
  } else {
    goTo('notes');
  }
});

window.addEventListener('app:add-goal', () => {
  if (currentView === 'goals' && currentViewInstance) {
    currentViewInstance.openGoalModal?.();
  } else {
    goTo('goals');
  }
});

window.addEventListener('app:search-notes', (e) => {
  if (currentView === 'notes' && currentViewInstance) {
    currentViewInstance.searchQuery = e.detail;
    currentViewInstance.refreshList?.();
  }
});

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
  // 1. Renderizar Header
  const headerEl = document.getElementById('header');
  if (headerEl) {
    const header = Header({
      db,
      onNavigate: goTo
    });
    // Header() crea su propio <header class="header">: se reemplaza el
    // contenedor vacío de index.html para no anidar dos headers duplicados
    headerEl.replaceWith(header);
  }

  // 2. Navegación inicial
  await navigate();

  // 3. Service Worker: solo en producción. En desarrollo el SW cachea los CSS
  //    que Vite sirve como módulos JS (respuesta no parseable como text/css)
  //    y congela versiones viejas de los assets, rompiendo estilos e iconos.
  if ('serviceWorker' in navigator) {
    if (import.meta.env.DEV) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) await reg.unregister();
        if ('caches' in window) {
          const keys = await caches.keys();
          for (const key of keys) await caches.delete(key);
        }
        if (regs.length > 0) console.log('[App] SW de desarrollo desregistrado y cachés limpiadas');
      } catch (e) {
        console.warn('[App] Limpieza de SW falló:', e);
      }
    } else {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('[App] Service Worker registrado');

        // Cuando un SW nuevo toma el control (p. ej. tras subir la versión del
        // cache), recargar una sola vez para servir los assets actualizados.
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      } catch (e) {
        console.warn('[App] SW registration failed:', e);
      }
    }
  }

  console.log('[App] Inicializado ✓');
  console.log('[App] Atajos: D=Dashboard, 1=Tareas, 2=Notas, 3=Metas, T=Tema, ?=Ayuda');
}

// Auto-inicializar cuando DOM listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Exponer para debugging
window.__APP__ = { db, goTo, navigate };

// Escuchar cambios de hash
window.addEventListener('hashchange', navigate);
