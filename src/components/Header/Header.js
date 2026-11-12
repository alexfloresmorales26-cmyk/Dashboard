/**
 * Header Component - Título, tema, fecha, stats, navegación
 */

import { nanoid } from '../../utils/id.js';
import { formatDate, getDayName } from '../../utils/date.js';
import { db } from '../../store/index.js';

// Iconos SVG inline (Lucide style)
const ICONS = {
  sun: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  moon: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  calendar: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  check: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  edit: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  target: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  menu: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  dashboard: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  list: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  fileText: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  targetIcon: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'
};

export function Header({ db, onNavigate }) {
  const header = document.createElement('header');
  header.className = 'header';
  header.id = 'header';
  header.role = 'banner';
  
  // Estado local para fecha
  let currentDate = new Date();
  
  // Actualizar fecha cada minuto
  const dateInterval = setInterval(() => {
    currentDate = new Date();
    renderDate();
  }, 60000);
  
  function renderDate() {
    const dateEl = header.querySelector('[data-header-date]');
    if (dateEl) {
      dateEl.textContent = `${getDayName(currentDate)}, ${formatDate(currentDate)}`;
    }
  }
  
  function renderStats() {
    const statsEl = header.querySelector('[data-header-stats]');
    if (!statsEl) return;
    
    const tasksStats = db.tasks.getStats();
    const notesStats = db.notes.getStats();
    const goalsStats = db.goals.getStats();
    
    statsEl.innerHTML = `
      <span class="header__stat" title="Tareas activas">
        ${ICONS.check}
        <span class="header__stat-value">${tasksStats.active}</span>
      </span>
      <span class="header__stat" title="Notas">
        ${ICONS.fileText}
        <span class="header__stat-value">${notesStats.total}</span>
      </span>
      <span class="header__stat" title="Metas hoy">
        ${ICONS.targetIcon}
        <span class="header__stat-value">${goalsStats.completedToday}/${goalsStats.daily}</span>
      </span>
    `;
  }
  
  function renderThemeToggle() {
    const btn = header.querySelector('[data-theme-toggle]');
    if (btn) {
      const theme = db.theme;
      btn.innerHTML = theme === 'light' ? ICONS.moon : ICONS.sun;
      btn.setAttribute('aria-label', theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
    }
  }
  
  function render() {
    const theme = db.theme;
    const isMobile = window.innerWidth < 768;
    
    header.innerHTML = `
      <div class="header__brand" data-nav="dashboard" title="Ir al dashboard">
        <span class="header__brand-icon">${ICONS.dashboard}</span>
        <span>Tablero</span>
      </div>
      
      <div class="header__center">
        <div class="header__date" data-header-date>${getDayName(currentDate)}, ${formatDate(currentDate)}</div>
        <div class="header__stats" data-header-stats></div>
      </div>
      
      <div class="header__actions">
        ${!isMobile ? `
          <button class="btn btn--ghost btn--icon" data-nav="tasks" title="Ver tareas (T)" aria-label="Ver tareas">
            ${ICONS.list}
          </button>
          <button class="btn btn--ghost btn--icon" data-nav="notes" title="Ver notas (N)" aria-label="Ver notas">
            ${ICONS.fileText}
          </button>
          <button class="btn btn--ghost btn--icon" data-nav="goals" title="Ver metas (G)" aria-label="Ver metas">
            ${ICONS.targetIcon}
          </button>
        ` : ''}
        <button class="btn btn--ghost btn--icon" data-theme-toggle aria-label="${theme === 'light' ? 'Modo oscuro' : 'Modo claro'}">
          ${theme === 'light' ? ICONS.moon : ICONS.sun}
        </button>
      </div>
    `;
    
    // Event listeners
    header.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => {
        const route = el.dataset.nav;
        onNavigate(route);
      });
      // Accesibilidad: Enter/Space para activar
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    });
    
    header.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
      db.toggleTheme();
    });
    
    renderStats();
  }
  
  // Suscribirse a cambios de stats
  const unsubTasks = db.tasks.subscribe(renderStats);
  const unsubNotes = db.notes.subscribe(renderStats);
  const unsubGoals = db.goals.subscribe(renderStats);
  const unsubTheme = db.subscribe('theme', renderThemeToggle);
  
  // Cleanup
  header.destroy = () => {
    clearInterval(dateInterval);
    unsubTasks();
    unsubNotes();
    unsubGoals();
    unsubTheme();
  };
  
  // Render inicial
  render();
  
  return header;
}

export default Header;
