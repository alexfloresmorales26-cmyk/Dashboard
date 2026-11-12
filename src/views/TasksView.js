/**
 * TasksView - Vista expandida de tareas (pantalla completa)
 */

import { db } from '../store/index.js';
import { formatRelativeDate, todayString } from '../utils/date.js';
import { nanoid } from '../utils/id.js';
import { ICONS } from '../components/Header/Header.js';

const ICONS_EXTRA = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  filter: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  more: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>'
};

export class TasksView {
  constructor({ db: store }) {
    this.db = store;
    this.filters = { status: 'all', priority: '', category: '', search: '' };
    this.element = null;
  }
  
  render() {
    this.element = document.createElement('section');
    this.element.className = 'view tasks-view';
    this.element.innerHTML = this.renderTemplate();
    
    this.bindEvents();
    this.subscribeToChanges();
    
    return this.element;
  }
  
  renderTemplate() {
    const stats = this.db.tasks.getStats();
    const categories = this.db.tasks.getCategories();
    const tasks = this.getFilteredTasks();
    
    return `
      <header class="view__header">
        <div class="view__title-group">
          <h1 class="view__title">${ICONS.list} Tareas</h1>
          <span class="view__count">${stats.active} activas · ${stats.completed} completadas</span>
        </div>
        <button class="btn btn--primary" data-action="add-task">
          ${ICONS_EXTRA.plus} Nueva tarea
        </button>
      </header>
      
      <div class="view__toolbar">
        <div class="toolbar__filters">
          <select class="form-select" data-filter="status" aria-label="Filtrar por estado">
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="completed">Completadas</option>
          </select>
          <select class="form-select" data-filter="priority" aria-label="Filtrar por prioridad">
            <option value="">Todas las prioridades</option>
            <option value="high">🔥 Alta</option>
            <option value="med">⚠️ Media</option>
            <option value="low">✅ Baja</option>
          </select>
          <select class="form-select" data-filter="category" aria-label="Filtrar por categoría">
            <option value="">Todas las categorías</option>
            ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="toolbar__search">
          <label class="search-input-wrapper">
            ${ICONS_EXTRA.filter}
            <input type="search" class="form-input" placeholder="Buscar tareas..." data-search aria-label="Buscar tareas">
          </label>
        </div>
      </div>
      
      <div class="view__content">
        ${tasks.length === 0 ? this.renderEmptyState() : this.renderTasksList(tasks)}
      </div>
    `;
  }
  
  getFilteredTasks() {
    return this.db.tasks.filter(this.filters);
  }
  
  renderTasksList(tasks) {
    return `
      <ul class="list tasks-list" role="list" data-task-list>
        ${tasks.map(task => this.renderTaskItem(task)).join('')}
      </ul>
    `;
  }
  
  renderTaskItem(task) {
    const isOverdue = task.dueDate && task.dueDate < todayString() && !task.completed;
    const dueText = task.dueDate ? formatRelativeDate(task.dueDate) : '';
    
    return `
      <li class="list__item task-item ${task.completed ? 'task-item--completed' : ''} ${isOverdue ? 'task-item--overdue' : ''}" 
          data-task-id="${task.id}"
          draggable="true">
        <label class="checkbox" data-toggle>
          <input type="checkbox" class="checkbox__input" ${task.completed ? 'checked' : ''} aria-label="${task.completed ? 'Marcar pendiente' : 'Completar'}">
          <span class="checkbox__box"></span>
        </label>
        <div class="task-item__content" style="flex: 1; min-width: 0;">
          <div class="task-item__title" style="font-weight: 500; color: ${task.completed ? 'var(--color-fg-muted)' : 'var(--color-fg)'}; text-decoration: ${task.completed ? 'line-through' : 'none'};">
            ${this.escapeHtml(task.title)}
          </div>
          ${task.description ? `<div class="task-item__desc" style="font-size: var(--font-size-sm); color: var(--color-fg-muted); margin-top: var(--space-xs); line-height: var(--line-height-relaxed);">${this.escapeHtml(task.description)}</div>` : ''}
          <div class="task-item__meta" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; font-size: var(--font-size-xs); color: var(--color-fg-muted);">
            ${dueText ? `<span class="${isOverdue ? 'text-danger' : ''}">${dueText}</span>` : ''}
            ${task.category ? `<span class="badge badge--neutral">${task.category}</span>` : ''}
            <span class="priority priority--${task.priority}">${task.priority}</span>
            <span>Creada: ${new Date(task.createdAt).toLocaleDateString('es-ES')}</span>
          </div>
        </div>
        <div class="task-item__actions">
          <button class="btn btn--ghost btn--icon btn--sm" data-edit title="Editar" aria-label="Editar tarea">
            <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn--ghost btn--icon btn--sm" data-delete title="Eliminar" aria-label="Eliminar tarea">
            <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </li>
    `;
  }
  
  renderEmptyState() {
    return `
      <div class="empty-state" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-2xl);">
        <div class="empty-state__icon">${ICONS.list}</div>
        <h3 class="empty-state__title">${this.filters.search ? 'No hay resultados' : 'Sin tareas'}</h3>
        <p class="empty-state__description">
          ${this.filters.search ? 'Prueba con otros términos de búsqueda' : 'Crea tu primera tarea para empezar'}
        </p>
        <button class="btn btn--primary empty-state__action" data-action="add-task">
          ${ICONS_EXTRA.plus} Nueva tarea
        </button>
      </div>
    `;
  }
  
  bindEvents() {
    if (!this.element) return;
    
    // Nuevo tarea
    this.element.querySelector('[data-action="add-task"]')?.addEventListener('click', () => {
      this.openTaskModal();
    });
    
    // Filtros
    this.element.querySelectorAll('[data-filter]').forEach(select => {
      select.value = this.filters[select.dataset.filter] || '';
      select.addEventListener('change', (e) => {
        this.filters[e.target.dataset.filter] = e.target.value;
        this.refresh();
      });
    });
    
    // Búsqueda
    const searchInput = this.element.querySelector('[data-search]');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.refresh();
        }, 200);
      });
    }
    
    // Drag & Drop (básico)
    this.bindDragDrop();
  }
  
  bindDragDrop() {
    const list = this.element.querySelector('[data-task-list]');
    if (!list) return;
    
    let draggedItem = null;
    
    list.addEventListener('dragstart', (e) => {
      const item = e.target.closest('[data-task-id]');
      if (item) {
        draggedItem = item;
        item.classList.add('task-item--dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
    });
    
    list.addEventListener('dragend', (e) => {
      if (draggedItem) {
        draggedItem.classList.remove('task-item--dragging');
        draggedItem = null;
      }
    });
    
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const afterElement = this.getDragAfterElement(list, e.clientY);
      const draggable = document.querySelector('.task-item--dragging');
      if (draggable) {
        if (afterElement == null) {
          list.appendChild(draggable);
        } else {
          list.insertBefore(draggable, afterElement);
        }
      }
    });
    
    list.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedItem) return;
      
      const items = [...list.querySelectorAll('[data-task-id]')];
      const newIndex = items.indexOf(draggedItem);
      const id = draggedItem.dataset.taskId;
      
      // Encontrar índice original
      const allTasks = this.db.tasks.getAll();
      const oldIndex = allTasks.findIndex(t => t.id === id);
      
      if (oldIndex !== newIndex) {
        this.db.tasks.reorder(oldIndex, newIndex);
      }
    });
  }
  
  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('[data-task-id]:not(.task-item--dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
  
  openTaskModal(task = null) {
    // TODO: Implementar modal de creación/edición
    console.log('[TasksView] Abrir modal tarea', task);
    // Por ahora crear tarea simple
    if (!task) {
      const title = prompt('Título de la tarea:');
      if (title) this.db.tasks.create({ title });
    }
  }
  
  refresh() {
    const content = this.element.querySelector('.view__content');
    if (content) {
      const tasks = this.getFilteredTasks();
      content.innerHTML = tasks.length === 0 ? this.renderEmptyState() : this.renderTasksList(tasks);
      this.bindDragDrop();
    }
  }
  
  subscribeToChanges() {
    this.unsubTasks = this.db.tasks.subscribe(() => this.refresh());
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  destroy() {
    this.unsubTasks?.();
  }
}

export default TasksView;
