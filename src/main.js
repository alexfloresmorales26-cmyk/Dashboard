/**
 * Entry Point - Bootstrap de la aplicación
 * Inicializa store, router hash, componentes principales
 */

import { db } from './store/index.js';
import { Header } from './components/Header/Header.js';
import { DashboardLayout } from './components/Layout/DashboardLayout.js';
import { DashboardView } from './views/DashboardView.js';
import { TasksView } from './views/TasksView.js';
import { NotesView } from './views/NotesView.js';
import { GoalsView } from './views/GoalsView.js';
import { preload } from './utils/markdown.js';

// Precargar librerías markdown
preload();

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
let currentLayout = null;

function getRoute() {
  const hash = window.location.hash.slice(1) || '';
  return hash.split('/')[0] || 'dashboard';
}

function getRouteParams() {
  const hash = window.location.hash.slice(1);
  const parts = hash.split('/');
  return parts.slice(1);
}

async function navigate() {
  const route = getRoute();
  const params = getRouteParams();
  const ViewClass = routes[route] || DashboardView;
  
  // Limpiar vista anterior
  if (currentViewInstance && typeof currentViewInstance.destroy === 'function') {
    currentViewInstance.destroy();
  }
  
  // Renderizar nueva vista
  const main = document.getElementById('main');
  if (!main) return;
  
  // Mostrar layout base si es dashboard, sino vista completa
  if (route === 'dashboard' || route === '') {
    main.innerHTML = '';
    currentLayout = DashboardLayout({});
    main.appendChild(currentLayout);
    
    // Renderizar DashboardView dentro del layout
    const dashboardContent = main.querySelector('[data-dashboard-content]');
    if (dashboardContent) {
      currentViewInstance = new ViewClass({ db, onNavigate: goTo });
      const viewElement = currentViewInstance.render();
      dashboardContent.appendChild(viewElement);
    }
  } else {
    // Vistas expandidas (pantalla completa)
    main.innerHTML = '';
    currentViewInstance = new ViewClass({ db, onNavigate: goTo });
    const viewElement = currentViewInstance.render();
    main.appendChild(viewElement);
  }
  
  currentView = route;
  
  // Actualizar header (estado activo) - se hace via store subscription
}

function updateHeaderActive(route) {
  // El header se actualiza solo via store subscription
}

// Escuchar cambios de hash
window.addEventListener('hashchange', navigate);

// Navegación programática
export function goTo(route, params = []) {
  const hash = params.length > 0 ? `${route}/${params.join('/')}` : route;
  window.location.hash = hash;
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
    // Trigger después de navegación
    setTimeout(() => {
      const event = new CustomEvent('app:add-task');
      window.dispatchEvent(event);
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
    headerEl.appendChild(header);
  }
  
  // 2. Navegación inicial
  await navigate();
  
  // 3. Registrar Service Worker si está disponible
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('[App] Service Worker registrado');
    } catch (e) {
      console.warn('[App] SW registration failed:', e);
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
