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
  targetIcon: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  keyboard: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h12M6 12h12M6 16h8"/></svg>'
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
      <span class="header__stat" title="Notas totales">
        ${ICONS.fileText}
        <span class="header__stat-value">${notesStats.total}</span>
      </span>
      <span class="header__stat" title="Metas completadas hoy / total diarias">
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
      btn.title = theme === 'light' ? 'Modo oscuro (T)' : 'Modo claro (T)';
    }
  }
  
  function render() {
    const theme = db.theme;
    const isMobile = window.innerWidth < 768;
    
    header.innerHTML = `
      <div class="header__brand" data-nav="dashboard" title="Ir al dashboard (D)" style="cursor: pointer;">
        <span class="header__brand-icon">${ICONS.dashboard}</span>
        <span>Tablero</span>
      </div>
      
      <div class="header__center">
        <div class="header__date" data-header-date>${getDayName(currentDate)}, ${formatDate(currentDate)}</div>
        <div class="header__stats" data-header-stats></div>
      </div>
      
      <div class="header__actions">
        ${!isMobile ? `
          <button class="btn btn--ghost btn--icon" data-nav="tasks" title="Ver tareas (1)" aria-label="Ver tareas">
            ${ICONS.list}
          </button>
          <button class="btn btn--ghost btn--icon" data-nav="notes" title="Ver notas (2)" aria-label="Ver notas">
            ${ICONS.fileText}
          </button>
          <button class="btn btn--ghost btn--icon" data-nav="goals" title="Ver metas (3)" aria-label="Ver metas">
            ${ICONS.targetIcon}
          </button>
        ` : ''}
        <button class="btn btn--ghost btn--icon" data-theme-toggle aria-label="${theme === 'light' ? 'Modo oscuro' : 'Modo claro'}" title="${theme === 'light' ? 'Modo oscuro (T)' : 'Modo claro (T)'}">
          ${theme === 'light' ? ICONS.moon : ICONS.sun}
        </button>
        <button class="btn btn--ghost btn--icon" data-shortcuts aria-label="Atajos de teclado" title="Atajos (?)">
          ${ICONS.keyboard}
        </button>
      </div>
    `;
    
    // Event listeners navegación
    header.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => {
        const route = el.dataset.nav;
        onNavigate(route);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    });
    
    // Tema
    header.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
      db.toggleTheme();
    });
    
    // Atajos
    header.querySelector('[data-shortcuts]')?.addEventListener('click', () => {
      showShortcutsModal();
    });
    
    renderStats();
  }
  
  function showShortcutsModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width: 480px;">
        <header class="modal__header">
          <h2 class="modal__title">${ICONS.keyboard} Atajos de teclado</h2>
          <button class="btn btn--ghost btn--icon modal__close" data-close aria-label="Cerrar">
            <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>
        <div class="modal__body" style="padding: var(--space-lg);">
          <div style="display: grid; grid-template-columns: auto 1fr; gap: var(--space-md) var(--space-lg); font-size: var(--font-size-sm);">
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">D</kbd>
            <span>Ir al Dashboard</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">1</kbd>
            <span>Ver Tareas</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">2</kbd>
            <span>Ver Notas</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">3</kbd>
            <span>Ver Metas</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">T</kbd>
            <span>Alternar tema claro/oscuro</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">A</kbd>
            <span>Nueva tarea (en vista tareas)</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">N</kbd>
            <span>Nueva nota (en vista notas)</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">G</kbd>
            <span>Nueva meta (en vista metas)</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">?</kbd>
            <span>Mostrar esta ayuda</span>
            
            <hr style="grid-column: 1 / -1; margin: var(--space-md) 0; border-color: var(--color-border);">
            
            <span style="font-weight: 600; color: var(--color-fg-muted);">En editor de notas:</span>
            <span></span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">Ctrl/Cmd + B</kbd>
            <span>Negrita</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">Ctrl/Cmd + I</kbd>
            <span>Cursiva</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">Ctrl/Cmd + K</kbd>
            <span>Insertar enlace</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">Ctrl/Cmd + S</kbd>
            <span>Guardar nota</span>
            
            <kbd style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: var(--radius-sm); font-family: var(--font-mono);">Escape</kbd>
            <span>Cerrar modales</span>
          </div>
        </div>
        <footer class="modal__footer">
          <button class="btn btn--primary" data-close>Entendido</button>
        </footer>
      </div>
    `;
    
    overlay.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => overlay.remove());
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    
    document.body.appendChild(overlay);
  }
  
  // Atajos globales de teclado
  const handleKeydown = (e) => {
    // Ignorar si está en input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    
    const key = e.key.toLowerCase();
    
    if (key === 'd') { onNavigate('dashboard'); }
    else if (key === '1') { onNavigate('tasks'); }
    else if (key === '2') { onNavigate('notes'); }
    else if (key === '3') { onNavigate('goals'); }
    else if (key === 't') { db.toggleTheme(); }
    else if (key === '?') { showShortcutsModal(); }
    else if (key === 'a' && window.location.hash.includes('tasks')) { 
      e.preventDefault(); 
      window.dispatchEvent(new CustomEvent('app:add-task')); 
    }
    else if (key === 'n' && window.location.hash.includes('notes')) { 
      e.preventDefault(); 
      window.dispatchEvent(new CustomEvent('app:add-note')); 
    }
    else if (key === 'g' && window.location.hash.includes('goals')) { 
      e.preventDefault(); 
      window.dispatchEvent(new CustomEvent('app:add-goal')); 
    }
  };
  
  document.addEventListener('keydown', handleKeydown);
  
  // Suscribirse a cambios
  const unsubTasks = db.tasks.subscribe(renderStats);
  const unsubNotes = db.notes.subscribe(renderStats);
  const unsubGoals = db.goals.subscribe(renderStats);
  const unsubTheme = db.subscribe('theme', renderThemeToggle);
  
  // Cleanup
  header.destroy = () => {
    clearInterval(dateInterval);
    document.removeEventListener('keydown', handleKeydown);
    unsubTasks();
    unsubNotes();
    unsubGoals();
    unsubTheme();
  };
  
  // Render inicial
  render();
  
  return header;
}

export { ICONS };
export default Header;
