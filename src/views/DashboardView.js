/**
 * DashboardView - Vista principal del dashboard
 * Renderiza widgets resumidos en cada columna
 */

import { db } from '../store/index.js';
import { formatRelativeDate, formatDate } from '../utils/date.js';
import { getFirstParagraph } from '../utils/markdown.js';
import { nanoid } from '../utils/id.js';
import { ICONS } from '../components/Header/Header.js';

// Iconos adicionales
const ICONS_EXTRA = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  checkCircle: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  circle: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>',
  more: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  pin: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 11a6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6 6 6 6 0 0 1-6-6"/></svg>',
  tag: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
};

export class DashboardView {
  constructor({ db: store }) {
    this.db = store;
    this.unsubscribers = [];
    this.element = null;
  }
  
  render() {
    this.element = document.createDocumentFragment();
    
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
  // WIDGET TAREAS
  // ============================================
  
  renderTasksWidget() {
    const container = document.querySelector('[data-widget-content="tasks"]');
    if (!container) return;
    
    const tasks = this.db.tasks.filter({ status: 'active' });
    const stats = this.db.tasks.getStats();
    
    container.innerHTML = `
      <div class="tasks-widget">
        ${tasks.length === 0 ? this.renderEmptyTasks() : this.renderTasksList(tasks.slice(0, 5))}
        ${tasks.length > 5 ? `
          <button class="btn btn--ghost btn--sm btn--block" data-nav="tasks">
            Ver ${tasks.length - 5} tareas más →
          </button>
        ` : ''}
      </div>
    `;
    
    // Event listeners para tareas
    container.querySelectorAll('[data-task-id]').forEach(el => {
      const id = el.dataset.taskId;
      
      // Click en checkbox
      el.querySelector('[data-toggle]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.db.tasks.toggleComplete(id);
      });
      
      // Click en tarea -> editar (futuro)
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-toggle]')) return;
        // TODO: abrir modal editar
      });
    });
    
    // Navegación
    container.querySelector('[data-nav="tasks"]')?.addEventListener('click', () => {
      window.location.hash = 'tasks';
    });
  }
  
  renderTasksList(tasks) {
    return `
      <ul class="list" role="list">
        ${tasks.map(task => this.renderTaskItem(task)).join('')}
      </ul>
    `;
  }
  
  renderTaskItem(task) {
    const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && !task.completed;
    const priorityClass = `priority--${task.priority}`;
    const dueText = task.dueDate ? formatRelativeDate(task.dueDate) : '';
    
    return `
      <li class="list__item task-item ${task.completed ? 'task-item--completed' : ''}" 
          data-task-id="${task.id}"
          draggable="true">
        <label class="checkbox" data-toggle>
          <input type="checkbox" class="checkbox__input" ${task.completed ? 'checked' : ''} aria-label="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}">
          <span class="checkbox__box"></span>
        </label>
        <div class="task-item__content" style="flex: 1; min-width: 0;">
          <div class="task-item__title" style="font-weight: 500; color: ${task.completed ? 'var(--color-fg-muted)' : 'var(--color-fg)'}; text-decoration: ${task.completed ? 'line-through' : 'none'};">
            ${this.escapeHtml(task.title)}
          </div>
          <div class="task-item__meta" style="display: flex; gap: 0.5rem; margin-top: 0.25rem; font-size: var(--font-size-xs); color: var(--color-fg-muted);">
            ${dueText ? `<span class="${isOverdue ? 'text-danger' : ''}">${ICONS_EXTRA.circle} ${dueText}</span>` : ''}
            ${task.category ? `<span class="badge badge--neutral">${ICONS_EXTRA.tag} ${this.escapeHtml(task.category)}</span>` : ''}
            <span class="priority ${priorityClass}">${this.escapeHtml(task.priority)}</span>
          </div>
        </div>
        <button class="btn btn--ghost btn--icon btn--sm" data-more title="Más opciones" aria-label="Más opciones">
          ${ICONS_EXTRA.more}
        </button>
      </li>
    `;
  }
  
  renderEmptyTasks() {
    return `
      <div class="empty-state" style="padding: var(--space-lg);">
        <div class="empty-state__icon">${ICONS.list}</div>
        <h3 class="empty-state__title">Sin tareas pendientes</h3>
        <p class="empty-state__description">¡Disfruta tu tiempo libre o añade una nueva tarea!</p>
        <button class="btn btn--primary empty-state__action" data-action="add-task">
          ${ICONS_EXTRA.plus} Nueva tarea
        </button>
      </div>
    `;
  }
  
  // ============================================
  // WIDGET NOTAS
  // ============================================
  
  renderNotesWidget() {
    const container = document.querySelector('[data-widget-content="notes"]');
    if (!container) return;
    
    const notes = this.db.notes.getAll();
    const pinnedNotes = notes.filter(n => n.isPinned);
    const recentNotes = notes.filter(n => !n.isPinned).slice(0, 3);
    const displayNotes = [...pinnedNotes, ...recentNotes].slice(0, 4);
    
    container.innerHTML = `
      <div class="notes-widget">
        ${displayNotes.length === 0 ? this.renderEmptyNotes() : this.renderNotesList(displayNotes)}
        ${notes.length > displayNotes.length ? `
          <button class="btn btn--ghost btn--sm btn--block" data-nav="notes">
            Ver ${notes.length - displayNotes.length} notas más →
          </button>
        ` : ''}
      </div>
    `;
    
    // Event listeners
    container.querySelectorAll('[data-note-id]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.noteId;
        window.location.hash = `notes/${id}`;
      });
    });
    
    container.querySelector('[data-nav="notes"]')?.addEventListener('click', () => {
      window.location.hash = 'notes';
    });
  }
  
  renderNotesList(notes) {
    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
        ${notes.map(note => this.renderNoteCard(note)).join('')}
      </div>
    `;
  }
  
  renderNoteCard(note) {
    const preview = getFirstParagraph(note.content, 120);
    const updated = formatRelativeDate(note.updatedAt);
    const tagsHtml = note.tags.slice(0, 3).map(tag => 
      `<span class="badge badge--neutral">${ICONS_EXTRA.tag} ${this.escapeHtml(tag)}</span>`
    ).join(' ');
    
    return `
      <article class="card note-card" data-note-id="${note.id}" style="cursor: pointer;">
        <div class="card__content" style="padding: var(--space-md);">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-sm); margin-bottom: var(--space-xs);">
            <h3 class="card__title" style="font-size: var(--font-size-base); margin: 0; flex: 1; min-width: 0;">
              ${this.escapeHtml(note.title)}
              ${note.isPinned ? `<span class="badge badge--primary" style="margin-left: var(--space-sm);">${ICONS_EXTRA.pin} Fijada</span>` : ''}
            </h3>
          </div>
          ${tagsHtml ? `<div style="display: flex; flex-wrap: wrap; gap: var(--space-xs); margin-bottom: var(--space-sm);">${tagsHtml}</div>` : ''}
          <p style="font-size: var(--font-size-sm); color: var(--color-fg-muted); line-height: var(--line-height-relaxed); margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${this.escapeHtml(preview) || '<em style="color: var(--color-fg-subtle);">(vacía)</em>'}
          </p>
          <div class="card__meta" style="margin-top: var(--space-sm); font-size: var(--font-size-xs);">
            ${updated}
          </div>
        </div>
      </article>
    `;
  }
  
  renderEmptyNotes() {
    return `
      <div class="empty-state" style="padding: var(--space-lg);">
        <div class="empty-state__icon">${ICONS.fileText}</div>
        <h3 class="empty-state__title">Sin notas aún</h3>
        <p class="empty-state__description">Crea tu primera nota en Markdown con preview en tiempo real.</p>
        <button class="btn btn--primary empty-state__action" data-action="add-note">
          ${ICONS_EXTRA.plus} Nueva nota
        </button>
      </div>
    `;
  }
  
  // ============================================
  // WIDGET METAS
  // ============================================
  
  renderGoalsWidget() {
    const container = document.querySelector('[data-widget-content="goals"]');
    if (!container) return;
    
    const goals = this.db.goals.getToday();
    const stats = this.db.goals.getStats();
    
    container.innerHTML = `
      <div class="goals-widget">
        ${goals.length === 0 ? this.renderEmptyGoals() : this.renderGoalsList(goals.slice(0, 4))}
        ${goals.length > 4 ? `
          <button class="btn btn--ghost btn--sm btn--block" data-nav="goals">
            Ver ${goals.length - 4} metas más →
          </button>
        ` : ''}
      </div>
    `;
    
    container.querySelector('[data-nav="goals"]')?.addEventListener('click', () => {
      window.location.hash = 'goals';
    });
  }
  
  renderGoalsList(goals) {
    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-md);">
        ${goals.map(goal => this.renderGoalCard(goal)).join('')}
      </div>
    `;
  }
  
  renderGoalCard(goal) {
    const progress = goal.progress;
    const isCompleted = goal.isCompleted;
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    
    return `
      <article class="card goal-card" style="padding: var(--space-md);">
        <div style="display: flex; align-items: center; gap: var(--space-md);">
          <!-- Anillo de progreso -->
          <div class="goal-ring" style="position: relative; width: 64px; height: 64px; flex-shrink: 0;">
            <svg width="64" height="64" class="progress-ring">
              <circle class="progress-ring__bg" cx="32" cy="32" r="${radius}" />
              <circle 
                class="progress-ring__progress ${isCompleted ? 'progress-ring__progress--success' : ''}" 
                cx="32" cy="32" r="${radius}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                style="transition: stroke-dashoffset 0.5s ease-out;"
              />
            </svg>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--font-size-sm); color: var(--color-fg);">
              ${progress}%
            </div>
          </div>
          
          <!-- Info meta -->
          <div style="flex: 1; min-width: 0;">
            <h3 class="card__title" style="margin-bottom: var(--space-xs); ${isCompleted ? 'text-decoration: line-through; color: var(--color-fg-muted);' : ''}">
              ${this.escapeHtml(goal.title)}
            </h3>
            <div style="font-size: var(--font-size-sm); color: var(--color-fg-muted); display: flex; align-items: center; gap: var(--space-sm);">
              <span>${goal.current}/${goal.target} ${goal.unit}</span>
              ${goal.streak > 0 ? `
                <span class="badge badge--success" style="font-size: var(--font-size-xs);">
                  🔥 ${goal.streak} días
                </span>
              ` : ''}
            </div>
          </div>
          
          <!-- Botón incrementar -->
          <button 
            class="btn btn--primary btn--icon btn--lg" 
            data-increment-goal="${goal.id}"
            ${isCompleted ? 'disabled' : ''}
            aria-label="${isCompleted ? 'Meta completada' : `Incrementar ${goal.title}`}"
            title="${isCompleted ? '¡Completada!' : 'Incrementar'}"
            style="flex-shrink: 0;"
          >
            ${isCompleted ? ICONS_EXTRA.checkCircle : ICONS_EXTRA.plus}
          </button>
        </div>
      </article>
    `;
  }
  
  renderEmptyGoals() {
    return `
      <div class="empty-state" style="padding: var(--space-lg);">
        <div class="empty-state__icon">${ICONS.target}</div>
        <h3 class="empty-state__title">Sin metas diarias</h3>
        <p class="empty-state__description">Añade metas para rastrear hábitos: agua, pasos, lectura, etc.</p>
        <button class="btn btn--primary empty-state__action" data-action="add-goal">
          ${ICONS_EXTRA.plus} Nueva meta
        </button>
      </div>
    `;
  }
  
  // ============================================
  // EVENT HANDLERS PARA METAS (incremento)
  // ============================================
  
  // Se llama después de renderizar para agregar listeners a botones dinámicos
  attachGoalListeners() {
    document.querySelectorAll('[data-increment-goal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.incrementGoal;
        this.db.goals.incrementProgress(id);
      });
    });
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
    this.unsubscribers = [];
    this.element = null;
  }
}

export default DashboardView;
