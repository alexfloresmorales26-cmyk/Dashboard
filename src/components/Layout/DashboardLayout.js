/**
 * DashboardLayout - Grid de 3 columnas responsive
 * Contenedor principal para las 3 secciones del dashboard
 */

import { db } from '../../store/index.js';
import { ICONS } from '../Header/Header.js';

export function DashboardLayout({ }) {
  const container = document.createElement('div');
  container.className = 'dashboard';
  container.id = 'dashboard-layout';
  container.role = 'main';
  container.setAttribute('data-dashboard-layout', 'true');
  
  // Detectar móvil para tabs
  const isMobile = window.innerWidth < 768;
  
  main.innerHTML = `
    <!-- Columna Tareas -->
    <section class="dashboard__tasks" aria-labelledby="tasks-heading">
      <div class="widget" data-widget="tasks">
        <header class="widget__header">
          <h2 class="widget__title" id="tasks-heading">
            <span class="widget__title-icon">${ICONS.list}</span>
            Tareas
          </h2>
          <div class="widget__actions">
            <button class="btn btn--ghost btn--icon btn--sm" data-action="add-task" aria-label="Añadir tarea" title="Nueva tarea (A)">
              <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button class="btn btn--ghost btn--icon btn--sm" data-nav="tasks" aria-label="Ver todas las tareas" title="Ver todas">
              <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        </header>
        <div class="widget__content" data-widget-content="tasks"></div>
        <footer class="widget__footer">
          <button class="btn btn--ghost btn--sm" data-action="add-task">+ Nueva tarea</button>
        </footer>
      </div>
    </section>
    
    <!-- Columna Notas -->
    <section class="dashboard__notes" aria-labelledby="notes-heading">
      <div class="widget" data-widget="notes">
        <header class="widget__header">
          <h2 class="widget__title" id="notes-heading">
            <span class="widget__title-icon">${ICONS.fileText}</span>
            Notas
          </h2>
          <div class="widget__actions">
            <input type="search" class="form-input form-input--sm" placeholder="Buscar..." data-search-notes aria-label="Buscar notas" style="width: 160px;">
            <button class="btn btn--ghost btn--icon btn--sm" data-nav="notes" aria-label="Ver todas las notas" title="Ver todas">
              <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        </header>
        <div class="widget__content" data-widget-content="notes"></div>
        <footer class="widget__footer">
          <button class="btn btn--ghost btn--sm" data-action="add-note">+ Nueva nota</button>
        </footer>
      </div>
    </section>
    
    <!-- Columna Metas -->
    <section class="dashboard__goals" aria-labelledby="goals-heading">
      <div class="widget" data-widget="goals">
        <header class="widget__header">
          <h2 class="widget__title" id="goals-heading">
            <span class="widget__title-icon">${ICONS.target}</span>
            Metas diarias
          </h2>
          <div class="widget__actions">
            <button class="btn btn--ghost btn--icon btn--sm" data-nav="goals" aria-label="Ver todas las metas" title="Ver todas">
              <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        </header>
        <div class="widget__content" data-widget-content="goals"></div>
        <footer class="widget__footer">
          <button class="btn btn--ghost btn--sm" data-action="add-goal">+ Nueva meta</button>
        </footer>
      </div>
    </section>
    
    <!-- Tabs móvil (oculto en desktop) -->
    <nav class="tabs" aria-label="Navegación principal" hidden>
      <button class="tab tab--active" data-nav="dashboard" aria-selected="true">
        <span class="tab__icon">${ICONS.dashboard}</span>
        <span>Inicio</span>
      </button>
      <button class="tab" data-nav="tasks" aria-selected="false">
        <span class="tab__icon">${ICONS.list}</span>
        <span>Tareas</span>
      </button>
      <button class="tab" data-nav="notes" aria-selected="false">
        <span class="tab__icon">${ICONS.fileText}</span>
        <span>Notas</span>
      </button>
      <button class="tab" data-nav="goals" aria-selected="false">
        <span class="tab__icon">${ICONS.target}</span>
        <span>Metas</span>
      </button>
    </nav>
  `;
  
  // Mostrar tabs en móvil
  if (isMobile) {
    const tabs = container.querySelector('.tabs');
    if (tabs) tabs.hidden = false;
  }
  
  // Event listeners para navegación
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const route = el.dataset.nav;
      window.location.hash = route;
    });
  });
  
  // Event listeners para acciones
  container.querySelector('[data-action="add-task"]')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('app:add-task'));
  });
  
  container.querySelector('[data-action="add-note"]')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('app:add-note'));
  });
  
  container.querySelector('[data-action="add-goal"]')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('app:add-goal'));
  });
  
  // Búsqueda notas
  const searchInput = container.querySelector('[data-search-notes]');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('app:search-notes', { detail: e.target.value }));
      }, 200);
    });
  }
  
  // Cleanup
  container.destroy = () => {
    // Los event listeners se limpian automáticamente al remover del DOM
  };
  
  return container;
}

export default DashboardLayout;
