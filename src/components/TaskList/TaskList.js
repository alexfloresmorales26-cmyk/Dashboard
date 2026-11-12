/**
 * TaskList - Lista de tareas con filtros, búsqueda, drag & drop y modal formulario
 */

import { TaskItem } from './TaskItem.js';
import { TaskForm } from './TaskForm.js';
import { formatRelativeDate, todayString } from '../../../utils/date.js';
import { db } from '../../../store/index.js';
import { ICONS } from '../../Header/Header.js';

const ICONS_EXTRA = {
  filter: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  sort: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="18" y1="9" x2="18" y2="21"/><line x1="6" y1="15" x2="6" y2="21"/></svg>',
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
};

export function TaskList({ 
  showCompleted = false, 
  maxItems = null, 
  compact = false,
  onAdd,
  onNavigate 
}) {
  const container = document.createElement('div');
  container.className = 'task-list';
  
  // Estado local de filtros
  let filters = { status: showCompleted ? 'completed' : 'active', priority: '', category: '', search: '' };
  let draggedItem = null;
  let tasks = [];
  
  function render() {
    tasks = db.tasks.filter(filters);
    if (maxItems) tasks = tasks.slice(0, maxItems);
    
    container.innerHTML = `
      <div class="task-list__header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md); flex-wrap: wrap; gap: var(--space-sm);">
        <div class="task-list__filters" style="display: flex; gap: var(--space-sm); flex-wrap: wrap;">
          <select class="form-select form-select--sm" data-filter="status" aria-label="Filtrar por estado" style="min-width: 120px;">
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="completed">Completadas</option>
          </select>
          <select class="form-select form-select--sm" data-filter="priority" aria-label="Filtrar por prioridad" style="min-width: 130px;">
            <option value="">Prioridad</option>
            <option value="high">🔥 Alta</option>
            <option value="med">⚠️ Media</option>
            <option value="low">✅ Baja</option>
          </select>
          <select class="form-select form-select--sm" data-filter="category" aria-label="Filtrar por categoría" style="min-width: 130px;">
            <option value="">Categoría</option>
            ${db.tasks.getCategories().map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="task-list__search" style="flex: 1; min-width: 200px;">
          <label class="search-input-wrapper" style="width: 100%;">
            ${ICONS_EXTRA.filter}
            <input type="search" class="form-input form-input--sm" placeholder="Buscar tareas..." data-search aria-label="Buscar tareas" value="${escapeHtml(filters.search)}" style="width: 100%;">
          </label>
        </div>
        <button class="btn btn--primary btn--sm" data-add-task style="flex-shrink: 0;">
          ${ICONS_EXTRA.plus} Nueva
        </button>
      </div>
      
      <ul class="list task-list__list" role="list" data-task-list style="${compact ? 'max-height: 400px; overflow: auto;' : ''}">
        ${tasks.length === 0 ? renderEmptyState() : tasks.map(task => renderTaskItem(task)).join('')}
      </ul>
      
      ${maxItems && db.tasks.filter(filters).length > maxItems ? `
        <div class="task-list__more" style="text-align: center; margin-top: var(--space-md);">
          <button class="btn btn--ghost btn--sm" data-view-all>Ver todas (${db.tasks.filter(filters).length}) →</button>
        </div>
      ` : ''}
    `;
    
    bindEvents();
  }
  
  function renderTaskItem(task) {
    const item = TaskItem({
      task,
      onToggle: (id) => db.tasks.toggleComplete(id),
      onEdit: (task) => openModal(task),
      onDelete: (id) => db.tasks.remove(id),
      onDragStart: (task, el) => { draggedItem = el; },
      onDragEnd: () => { draggedItem = null; },
      onDragOver: (e, targetTask) => {
        if (!draggedItem) return;
        const list = container.querySelector('[data-task-list]');
        const afterElement = getDragAfterElement(list, e.clientY);
        if (afterElement == null) {
          list.appendChild(draggedItem);
        } else {
          list.insertBefore(draggedItem, afterElement);
        }
      },
      onDrop: (draggedId, targetId) => handleReorder(draggedId, targetId)
    });
    return item.outerHTML;
  }
  
  function renderEmptyState() {
    return `
      <li class="empty-state" style="padding: var(--space-lg); text-align: center; color: var(--color-fg-muted);">
        ${filters.search ? 'Sin resultados' : (filters.status === 'completed' ? 'Sin tareas completadas' : 'Sin tareas pendientes')}
        ${!filters.search && filters.status !== 'completed' ? `<br><button class="btn btn--primary btn--sm" data-add-task style="margin-top: var(--space-sm);">${ICONS_EXTRA.plus} Crear primera</button>` : ''}
      </li>
    `;
  }
  
  function bindEvents() {
    // Filtros
    container.querySelectorAll('[data-filter]').forEach(select => {
      select.value = filters[select.dataset.filter] || '';
      select.addEventListener('change', (e) => {
        filters[e.target.dataset.filter] = e.target.value;
        render();
      });
    });
    
    // Búsqueda
    const searchInput = container.querySelector('[data-search]');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          filters.search = e.target.value;
          render();
        }, 200);
      });
    }
    
    // Nueva tarea
    container.querySelectorAll('[data-add-task]').forEach(btn => {
      btn.addEventListener('click', () => openModal());
    });
    
    // Ver todas
    container.querySelector('[data-view-all]')?.addEventListener('click', () => {
      onNavigate?.('tasks');
    });
    
    // Drag & Drop para reordenar
    const list = container.querySelector('[data-task-list]');
    if (list) setupDragDrop(list);
  }
  
  function setupDragDrop(list) {
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
      
      if (!draggedItem) return;
      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        list.appendChild(draggedItem);
      } else {
        list.insertBefore(draggedItem, afterElement);
      }
    });
    
    list.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedItem) return;
      
      const items = [...list.querySelectorAll('[data-task-id]')];
      const newIndex = items.indexOf(draggedItem);
      const draggedId = draggedItem.dataset.taskId;
      
      // Encontrar índice original en el array filtrado
      const allFilteredTasks = db.tasks.filter(filters);
      const oldIndex = allFilteredTasks.findIndex(t => t.id === draggedId);
      
      if (oldIndex !== -1 && oldIndex !== newIndex) {
        // Reordenar en el store global (usando índices absolutos)
        const allTasks = db.tasks.getAll();
        const globalOldIndex = allTasks.findIndex(t => t.id === draggedId);
        const globalNewIndex = allTasks.findIndex(t => t.id === items[newIndex]?.dataset.taskId);
        
        if (globalOldIndex !== -1 && globalNewIndex !== -1) {
          db.tasks.reorder(globalOldIndex, globalNewIndex);
        }
      }
    });
  }
  
  function getDragAfterElement(container, y) {
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
  
  function handleReorder(draggedId, targetId) {
    // El reordenamiento se hace en el drop event
  }
  
  function openModal(task = null) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '';
    
    const form = TaskForm({
      task,
      onClose: () => {
        overlay.remove();
        document.body.removeChild(overlay);
      },
      onSubmit: (idOrData, data) => {
        if (task) {
          db.tasks.update(task.id, { ...idOrData, ...data });
        } else {
          db.tasks.create(idOrData);
        }
        overlay.remove();
      }
    });
    
    overlay.appendChild(form);
    document.body.appendChild(overlay);
    
    // Cerrar al click fuera
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) form.destroy?.(), overlay.remove();
    });
  }
  
  // Suscribirse a cambios
  const unsub = db.tasks.subscribe(render);
  
  container.destroy = () => {
    unsub();
  };
  
  // Render inicial
  render();
  
  return container;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default TaskList;
