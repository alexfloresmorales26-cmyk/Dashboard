/**
 * TaskItem - Componente individual de tarea con drag & drop, checkbox, prioridad
 */

import { formatRelativeDate, todayString, isPast } from '../../utils/date.js';
import { ICONS } from '../Header/Header.js';

const ICONS_EXTRA = {
  edit: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  delete: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  more: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  tag: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
};

export function TaskItem({ task, onToggle, onEdit, onDelete, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const item = document.createElement('li');
  item.className = `list__item task-item ${task.completed ? 'task-item--completed' : ''}`;
  item.dataset.taskId = task.id;
  item.draggable = true;
  
  const isOverdue = task.dueDate && task.dueDate < todayString() && !task.completed;
  const dueText = task.dueDate ? formatRelativeDate(task.dueDate) : '';
  const priorityClass = `priority--${task.priority}`;
  const priorityLabels = { low: 'Baja', med: 'Media', high: 'Alta' };
  
  item.innerHTML = `
    <label class="checkbox" data-toggle>
      <input type="checkbox" class="checkbox__input" ${task.completed ? 'checked' : ''} aria-label="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}">
      <span class="checkbox__box"></span>
    </label>
    <div class="task-item__content" style="flex: 1; min-width: 0;">
      <div class="task-item__title" style="font-weight: 500; color: ${task.completed ? 'var(--color-fg-muted)' : 'var(--color-fg)'}; text-decoration: ${task.completed ? 'line-through' : 'none'};">
        ${escapeHtml(task.title)}
      </div>
      ${task.description ? `<div class="task-item__desc" style="font-size: var(--font-size-sm); color: var(--color-fg-muted); margin-top: var(--space-xs); line-height: var(--line-height-relaxed);">${escapeHtml(task.description)}</div>` : ''}
      <div class="task-item__meta" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; font-size: var(--font-size-xs); color: var(--color-fg-muted);">
        ${dueText ? `<span class="${isOverdue ? 'text-danger' : ''}" title="${isOverdue ? 'Vencida' : ''}">${ICONS.calendar || '📅'} ${dueText}</span>` : ''}
        ${task.category ? `<span class="badge badge--neutral">${ICONS_EXTRA.tag} ${escapeHtml(task.category)}</span>` : ''}
        <span class="priority ${priorityClass}">${priorityLabels[task.priority]}</span>
      </div>
    </div>
    <div class="task-item__actions" style="display: flex; gap: var(--space-xs); opacity: 0; transition: opacity var(--transition-fast);">
      <button class="btn btn--ghost btn--icon btn--sm" data-edit title="Editar" aria-label="Editar tarea">${ICONS_EXTRA.edit}</button>
      <button class="btn btn--ghost btn--icon btn--sm btn--danger" data-delete title="Eliminar" aria-label="Eliminar tarea">${ICONS_EXTRA.delete}</button>
    </div>
    <div class="drag-handle" style="padding: var(--space-xs); color: var(--color-fg-subtle); cursor: grab;" aria-label="Arrastrar para reordenar">
      <svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="4" x2="9" y2="20"/><line x1="15" y1="4" x2="15" y2="20"/></svg>
    </div>
  `;
  
  // Mostrar acciones al hover
  item.addEventListener('mouseenter', () => {
    item.querySelector('.task-item__actions').style.opacity = '1';
  });
  item.addEventListener('mouseleave', () => {
    item.querySelector('.task-item__actions').style.opacity = '0';
  });
  
  // Checkbox toggle
  item.querySelector('[data-toggle]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    onToggle?.(task.id);
  });
  
  // Editar
  item.querySelector('[data-edit]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    onEdit?.(task);
  });
  
  // Eliminar
  item.querySelector('[data-delete]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta tarea?')) onDelete?.(task.id);
  });
  
  // Drag & Drop
  item.addEventListener('dragstart', (e) => {
    item.classList.add('task-item--dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    onDragStart?.(task, item);
  });
  
  item.addEventListener('dragend', (e) => {
    item.classList.remove('task-item--dragging');
    onDragEnd?.();
  });
  
  item.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(e, task);
  });
  
  item.addEventListener('drop', (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== task.id) {
      onDrop?.(draggedId, task.id);
    }
  });
  
  // Accesibilidad: Enter/Space en drag handle
  const handle = item.querySelector('.drag-handle');
  handle?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Iniciar drag via keyboard (simplificado)
    }
  });
  
  return item;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default TaskItem;
