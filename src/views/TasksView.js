/**
 * TasksView - Vista expandida de tareas (pantalla completa) usando TaskList
 */

import { TaskList } from '../components/TaskList/TaskList.js';
import { db } from '../store/index.js';
import { ICONS } from '../components/Header/Header.js';

const ICONS_EXTRA = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
};

export class TasksView {
  constructor({ db: store, onNavigate }) {
    this.db = store;
    this.onNavigate = onNavigate;
    this.element = null;
    this.taskList = null;
  }
  
  render() {
    this.element = document.createElement('section');
    this.element.className = 'view tasks-view';
    
    const stats = this.db.tasks.getStats();
    
    this.element.innerHTML = `
      <header class="view__header" style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg); border-bottom: 1px solid var(--color-border); flex-shrink: 0;">
        <div class="view__title-group">
          <h1 class="view__title" style="display: flex; align-items: center; gap: var(--space-sm); margin: 0; font-size: var(--font-size-2xl);">${ICONS.list} Tareas</h1>
          <span class="view__count" style="color: var(--color-fg-muted); font-size: var(--font-size-lg); font-weight: 400;">${stats.active} activas · ${stats.completed} completadas · ${stats.overdue} vencidas</span>
        </div>
        <button class="btn btn--primary" data-action="add-task" style="display: flex; align-items: center; gap: var(--space-sm);">
          ${ICONS_EXTRA.plus} Nueva tarea
        </button>
      </header>
      
      <main class="view__content" style="flex: 1; overflow: auto; padding: var(--space-lg);" data-task-list-container></main>
    `;
    
    // Inicializar TaskList completo
    const container = this.element.querySelector('[data-task-list-container]');
    this.taskList = TaskList({ 
      showCompleted: false, 
      maxItems: null, 
      compact: false,
      onNavigate: this.onNavigate
    });
    container.appendChild(this.taskList);
    
    // Botón nueva tarea en header
    this.element.querySelector('[data-action="add-task"]')?.addEventListener('click', () => {
      // El TaskList ya maneja esto internamente, pero podemos trigger
      const event = new CustomEvent('click', { bubbles: true });
      this.taskList?.querySelector('[data-add-task]')?.dispatchEvent(event);
    });
    
    return this.element;
  }
  
  destroy() {
    this.taskList?.destroy?.();
    this.element = null;
    this.taskList = null;
  }
}

export default TasksView;
