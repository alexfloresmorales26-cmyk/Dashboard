/**
 * Entry Point - Bootstrap de la aplicación
 * Inicializa store, router hash, sidebar, atajos de teclado
 */

import { db } from './store/index.js';
import { DashboardView } from './views/DashboardView.js';
import { TasksView } from './views/TasksView.js';
import { NotesView } from './views/NotesView.js';
import { GoalsView } from './views/GoalsView.js';
import { preload } from './utils/markdown.js';
import { DataManager } from './components/DataManager/DataManager.js';

// Precargar librerías markdown
preload();

// ============================================
// ICONOS DEL RAÍL
// ============================================

const RAIL_ICONS = {
  dashboard: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  list: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><line x1="4" y1="6" x2="4.01" y2="6"/><line x1="4" y1="12" x2="4.01" y2="12"/><line x1="4" y1="18" x2="4.01" y2="18"/></svg>',
  fileText: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  target: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>',
  database: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
  sun: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  moon: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'
};

const NAV_ITEMS = [
  { route: 'dashboard', label: 'Inicio', icon: RAIL_ICONS.dashboard },
  { route: 'tasks', label: 'Tareas', icon: RAIL_ICONS.list },
  { route: 'notes', label: 'Notas', icon: RAIL_ICONS.fileText },
  { route: 'goals', label: 'Metas', icon: RAIL_ICONS.target },
];

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

// Navegación programática
export function goTo(route, params = []) {
  const hash = params.length > 0 ? `${route}/${params.join('/')}` : route;
  window.location.hash = hash;
}

async function navigate() {
  const route = getRoute();
  const ViewClass = routes[route] || DashboardView;
  // Parámetro opcional de la ruta (p. ej. notes/<id> para abrir una nota concreta)
  const param = window.location.hash.split('/')[1] || null;

  if (currentView === null) {
    renderSidebar();
  } else {
    updateActiveIndicators(route);
  }

  // Los modales viven en document.body, fuera de la vista: cerrarlos antes de
  // cambiar de ruta (su handler de Escape los destruye y elimina)
  if (document.querySelector('body > .modal-overlay')) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  }

  // Limpiar vista anterior
  if (currentViewInstance && typeof currentViewInstance.destroy === 'function') {
    currentViewInstance.destroy();
  }

  const main = document.getElementById('main');
  if (!main) return;

  main.innerHTML = '';
  currentViewInstance = new ViewClass({ db, onNavigate: goTo, param });
  const viewElement = currentViewInstance.render();
  main.appendChild(viewElement);

  currentView = route;
  updateActiveIndicators(route);
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="nav-sidebar__header">
      <div class="nav-sidebar__brand">Tablero</div>
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
      <button class="nav-action__theme" data-theme-toggle title="Cambiar tema (T)" aria-label="Cambiar tema"></button>
      <button class="nav-action nav-action--danger" title="Exportar, importar o borrar datos" aria-label="Gestión de datos">
        ${RAIL_ICONS.database} Datos
      </button>
    </div>
  `;

  // Navegación
  sidebar.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      window.location.hash = el.dataset.nav;
    });
  });

  // Gestión de datos
  sidebar.querySelector('.nav-action--danger')?.addEventListener('click', () => {
    const dm = DataManager({ onClose: () => dm.destroy() });
    document.body.appendChild(dm);
  });

  // Tema
  const themeBtn = sidebar.querySelector('[data-theme-toggle]');
  themeBtn?.addEventListener('click', () => db.toggleTheme());
  renderThemeToggle();

  db.subscribe('theme', renderThemeToggle);
}

function renderThemeToggle() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  const isLight = db.theme === 'light';
  btn.innerHTML = isLight ? RAIL_ICONS.moon : RAIL_ICONS.sun;
  btn.title = isLight ? 'Modo oscuro (T)' : 'Modo claro (T)';
  btn.setAttribute('aria-label', btn.title);
}

function updateActiveIndicators(route) {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('nav-item--active', el.dataset.nav === route);
    });
  }
}

// ============================================
// MODAL DE ATAJOS
// ============================================

function showShortcutsModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width: 480px;">
      <header class="modal__header">
        <h2 class="modal__title">Atajos de teclado</h2>
        <button class="btn btn--ghost btn--icon modal__close" data-close aria-label="Cerrar">
          <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>
      <div class="modal__body">
        <div style="display: grid; grid-template-columns: auto 1fr; gap: var(--s-3) var(--s-5); font-size: var(--text-md); align-items: center;">
          <kbd>D</kbd><span>Inicio</span>
          <kbd>1</kbd><span>Tareas</span>
          <kbd>2</kbd><span>Notas</span>
          <kbd>3</kbd><span>Metas</span>
          <kbd>T</kbd><span>Tema claro / oscuro</span>
          <kbd>A</kbd><span>Nueva tarea (en Tareas)</span>
          <kbd>N</kbd><span>Nueva nota (en Notas)</span>
          <kbd>G</kbd><span>Nueva meta (en Metas)</span>
          <kbd>?</kbd><span>Ayuda</span>
        </div>
      </div>
      <footer class="modal__footer"><button class="btn btn--primary" data-close>Entendido</button></footer>
    </div>
  `;
  overlay.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => overlay.remove()));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ============================================
// ATAJOS GLOBALES
// ============================================

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
  const key = e.key.toLowerCase();
  if (key === 'd') goTo('dashboard');
  else if (key === '1') goTo('tasks');
  else if (key === '2') goTo('notes');
  else if (key === '3') goTo('goals');
  else if (key === 't') db.toggleTheme();
  else if (key === '?') showShortcutsModal();
  else if (key === 'a' && location.hash.includes('tasks')) { e.preventDefault(); window.dispatchEvent(new CustomEvent('app:add-task')); }
  else if (key === 'n' && location.hash.includes('notes')) { e.preventDefault(); window.dispatchEvent(new CustomEvent('app:add-note')); }
  else if (key === 'g' && location.hash.includes('goals')) { e.preventDefault(); window.dispatchEvent(new CustomEvent('app:add-goal')); }
});

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
    setTimeout(() => {
      if (currentView === 'notes') currentViewInstance?.createNote?.();
    }, 100);
  }
});

window.addEventListener('app:add-goal', () => {
  if (currentView === 'goals' && currentViewInstance) {
    currentViewInstance.openGoalModal?.();
  } else {
    goTo('goals');
    setTimeout(() => {
      if (currentView === 'goals') currentViewInstance?.openGoalModal?.();
    }, 100);
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

function handleLaunchAction() {
  const action = new URLSearchParams(window.location.search).get('action');
  if (!action) return;

  // Limpiar la query para que recargar no repita la acción
  history.replaceState(null, '', window.location.pathname + window.location.hash);

  window.setTimeout(() => {
    if (action === 'new-task') window.dispatchEvent(new CustomEvent('app:add-task'));
    else if (action === 'new-note') window.dispatchEvent(new CustomEvent('app:add-note'));
    else if (action === 'new-goal') window.dispatchEvent(new CustomEvent('app:add-goal'));
  }, 0);
}

async function init() {
  await navigate();
  handleLaunchAction();

  // Service Worker: solo en producción. En desarrollo el SW cachea los CSS
  // que Vite sirve como módulos JS (respuesta no parseable como text/css)
  // y congela versiones viejas de los assets, rompiendo estilos e iconos.
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

        // Cuando un SW nuevo toma el control, recargar una sola vez
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

  console.log('[App] Atajos: D=Inicio, 1=Tareas, 2=Notas, 3=Metas, T=Tema, ?=Ayuda');
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
