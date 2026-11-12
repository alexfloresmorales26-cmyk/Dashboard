/**
 * DashboardView - Vista principal del dashboard
 * Renderiza widgets resumidos en cada columna usando componentes completos
 */

import { db } from '../store/index.js';
import { formatRelativeDate } from '../utils/date.js';
import { getFirstParagraph } from '../utils/markdown.js';
import { nanoid } from '../utils/id.js';
import { ICONS } from '../components/Header/Header.js';
import { TaskList } from '../components/TaskList/TaskList.js';
import { NoteCard } from '../components/Notes/NoteCard.js';
import { GoalCard } from '../components/Goals/GoalCard.js';

const ICONS_EXTRA = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  checkCircle: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  circle: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>',
  more: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  pin: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 11a6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6-6"/></svg>',
  tag: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
};

export class DashboardView {
  constructor({ db: store, onNavigate }) {
    this.db = store;
    this.onNavigate = onNavigate;
    this.unsubscribers = [];
    this.widgetElements = {};
    this.containers = {}; // Referencias a contenedores DOM
  }
  
  render() {
    // Crear elemento contenedor principal (no DocumentFragment)
    this.element = document.createElement('div');
    this.element.className = 'dashboard-view';
    this.element.innerHTML = `
      <div class="dashboard-view__widgets" style="display: contents;">
        <!-- Los widgets se renderizan dentro del layout existente -->
      </div>
    `;
    
    // Obtener referencias a contenedores DEL LAYOUT (ya en el DOM)
    this.containers.tasks = document.querySelector('[data-widget-content="tasks"]');
    this.containers.notes = document.querySelector('[data-widget-content="notes"]');
    this.containers.goals = document.querySelector('[data-widget-content="goals"]');
    
    // Renderizar cada widget en su contenedor
    this.renderTasksWidget();
    this.renderNotesWidget();
    this.renderGoalsWidget();
    
    // Suscribirse a cambios
    this.subscribeToChanges();
    
    return this.element;
  }
  
  subscribeToChanges() {
    this.unsubscribers.push(
      this.db.tasks.subscribe(() => this.renderTasksWidget()),
      this.db.notes.subscribe(() => this.renderNotesWidget()),
      this.db.goals.subscribe(() => this.renderGoalsWidget())
    );
  }
  
  // ============================================
  // WIDGET TAREAS - Usa TaskList compacto
  // ============================================
  
  renderTasksWidget() {
    const container = this.containers.tasks;
    if (!container) return;
    
    // Limpiar y renderizar TaskList compacto
    container.innerHTML = '';
    const taskList = TaskList({ 
      showCompleted: false, 
      maxItems: 5, 
      compact: true,
      onNavigate: this.onNavigate
    });
    container.appendChild(taskList);
    
    // Guardar referencia para cleanup
    this.widgetElements.tasks = taskList;
  }
  
  // ============================================
  // WIDGET NOTAS - Usa NoteCard
  // ============================================
  
  renderNotesWidget() {
    const container = this.containers.notes;
    if (!container) return;
    
    const notes = this.db.notes.getAll();
    const pinnedNotes = notes.filter(n => n.isPinned);
    const recentNotes = notes.filter(n => !n.isPinned).slice(0, 3);
    const displayNotes = [...pinnedNotes, ...recentNotes].slice(0, 4);
    
    container.innerHTML = `
      <div class="notes-widget" style="display: flex; flex-direction: column; gap: var(--space-sm);">
        ${displayNotes.length === 0 ? this.renderEmptyNotes() : displayNotes.map(note => this.renderNoteCard(note)).join('')}
        ${notes.length > displayNotes.length ? `
          <button class="btn btn--ghost btn--sm btn--block" data-nav="notes">
            Ver ${notes.length - displayNotes.length} notas más →
          </button>
        ` : ''}
      </div>
    `;
    
    // Event listeners para navegación
    container.querySelector('[data-nav="notes"]')?.addEventListener('click', () => {
      this.onNavigate?.('notes');
    });
  }
  
  renderNoteCard(note) {
    const card = NoteCard({
      note,
      onSelect: (id) => window.location.hash = `notes/${id}`,
      onPin: (id) => this.db.notes.togglePin(id),
      onEdit: (note) => window.location.hash = `notes/${note.id}`,
      onDelete: (id) => this.db.notes.remove(id),
      onDuplicate: (id) => this.db.notes.duplicate(id)
    });
    return card.outerHTML;
  }
  
  renderEmptyNotes() {
    return `
      <div class="empty-state" style="padding: var(--space-lg); text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="empty-state__icon">${ICONS.fileText}</div>
        <h3 class="empty-state__title" style="margin: var(--space-sm) 0;">Sin notas aún</h3>
        <p class="empty-state__description" style="font-size: var(--font-size-sm); max-width: 280px;">Crea tu primera nota en Markdown con preview en tiempo real.</p>
        <button class="btn btn--primary empty-state__action" data-action="add-note" style="margin-top: var(--space-md);">${ICONS_EXTRA.plus} Nueva nota</button>
      </div>
    `;
  }
  
  // ============================================
  // WIDGET METAS - Usa GoalCard compact
  // ============================================
  
  renderGoalsWidget() {
    const container = this.containers.goals;
    if (!container) return;
    
    const goals = this.db.goals.getToday();
    
    container.innerHTML = `
      <div class="goals-widget" style="display: flex; flex-direction: column; gap: var(--space-sm);">
        ${goals.length === 0 ? this.renderEmptyGoals() : goals.slice(0, 4).map(goal => this.renderGoalCardCompact(goal)).join('')}
        ${goals.length > 4 ? `
          <button class="btn btn--ghost btn--sm btn--block" data-nav="goals">
            Ver ${goals.length - 4} metas más →
          </button>
        ` : ''}
      </div>
    `;
    
    container.querySelector('[data-nav="goals"]')?.addEventListener('click', () => {
      this.onNavigate?.('goals');
    });
    
    // Botones de incremento
    container.querySelectorAll('[data-increment]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.closest('[data-goal-id]')?.dataset.goalId;
        if (id) this.db.goals.incrementProgress(id);
      });
    });
  }
  
  renderGoalCardCompact(goal) {
    const card = GoalCard({
      goal,
      onIncrement: (id) => this.db.goals.incrementProgress(id),
      onDecrement: () => {},
      onEdit: () => window.location.hash = 'goals',
      onReset: () => {},
      onDelete: () => {},
      onViewHistory: () => {},
      compact: true
    });
    return card.outerHTML;
  }
  
  renderEmptyGoals() {
    return `
      <div class="empty-state" style="padding: var(--space-lg); text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="empty-state__icon">${ICONS.target}</div>
        <h3 class="empty-state__title" style="margin: var(--space-sm) 0;">Sin metas diarias</h3>
        <p class="empty-state__description" style="font-size: var(--font-size-sm); max-width: 280px;">Añade metas para rastrear hábitos: agua, pasos, lectura, etc.</p>
        <button class="btn btn--primary empty-state__action" data-action="add-goal" style="margin-top: var(--space-md);">${ICONS_EXTRA.plus} Nueva meta</button>
      </div>
    `;
  }
  
  // ============================================
  // UTILIDADES
  // ============================================
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    Object.values(this.widgetElements).forEach(w => w.destroy?.());
    this.widgetElements = {};
    this.containers = {};
    this.element = null;
  }
}

export default DashboardView;
