/**
 * TaskForm - Formulario modal/inline para crear/editar tareas
 */

import { nanoid } from '../../../utils/id.js';
import { todayString, formatDate, toDateInputValue } from '../../../utils/date.js';
import { db } from '../../../store/index.js';

const ICONS = {
  close: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  calendar: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  tag: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
};

export function TaskForm({ task = null, onClose, onSubmit }) {
  const isEditing = !!task;
  const form = document.createElement('form');
  form.className = 'modal';
  form.innerHTML = `
    <header class="modal__header">
      <h2 class="modal__title">${isEditing ? 'Editar tarea' : 'Nueva tarea'}</h2>
      <button type="button" class="btn btn--ghost btn--icon modal__close" data-close aria-label="Cerrar">${ICONS.close}</button>
    </header>
    <div class="modal__body">
      <div class="form-group">
        <label class="form-label" for="task-title">Título *</label>
        <input type="text" class="form-input" id="task-title" name="title" required 
               placeholder="¿Qué necesitas hacer?" value="${task?.title || ''}" autocomplete="off">
      </div>
      
      <div class="form-group">
        <label class="form-label" for="task-description">Descripción</label>
        <textarea class="form-textarea" id="task-description" name="description" 
                  placeholder="Detalles adicionales... (opcional)" rows="3">${task?.description || ''}</textarea>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label">Prioridad</label>
          <select class="form-select" name="priority">
            <option value="low" ${task?.priority === 'low' ? 'selected' : ''}>✅ Baja</option>
            <option value="med" ${task?.priority === 'med' ? 'selected' : ''}>⚠️ Media</option>
            <option value="high" ${task?.priority === 'high' ? 'selected' : ''}>🔥 Alta</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="task-due-date">Fecha límite</label>
          <div style="position: relative;">
            ${ICONS.calendar}
            <input type="date" class="form-input" id="task-due-date" name="dueDate" 
                   value="${task?.dueDate ? toDateInputValue(task.dueDate) : ''}" 
                   style="padding-left: 2.5rem;">
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="task-category">Categoría ${ICONS.tag}</label>
        <div style="display: flex; gap: var(--space-sm); flex-wrap: wrap;">
          <input type="text" class="form-input" id="task-category" name="category" 
                 placeholder="Ej: trabajo, personal, estudio..." 
                 value="${task?.category || ''}" list="categories" style="flex: 1; min-width: 150px;">
          <datalist id="categories">
            ${db.tasks.getCategories().map(c => `<option value="${c}">`).join('')}
          </datalist>
        </div>
      </div>
      
      ${isEditing ? `
        <div class="form-group">
          <label class="checkbox">
            <input type="checkbox" class="checkbox__input" name="completed" ${task?.completed ? 'checked' : ''}>
            <span class="checkbox__box"></span>
            <span class="checkbox__label">Marcar como completada</span>
          </label>
        </div>
      ` : ''}
    </div>
    <footer class="modal__footer">
      <button type="button" class="btn btn--secondary" data-close>Cancelar</button>
      <button type="submit" class="btn btn--primary">${isEditing ? 'Guardar cambios' : 'Crear tarea'}</button>
    </footer>
  `;
  
  // Focus en título al abrir
  setTimeout(() => form.querySelector('#task-title')?.focus(), 50);
  
  // Event listeners
  form.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      onClose();
    });
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {
      title: formData.get('title')?.trim(),
      description: formData.get('description')?.trim(),
      priority: formData.get('priority'),
      dueDate: formData.get('dueDate') || null,
      category: formData.get('category')?.trim()
    };
    
    if (!data.title) return;
    
    if (isEditing) {
      data.completed = formData.get('completed') === 'on';
      onSubmit(task.id, data);
    } else {
      onSubmit(data);
    }
  });
  
  // Cerrar con Escape
  const handleKeydown = (e) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleKeydown);
  
  form.destroy = () => {
    document.removeEventListener('keydown', handleKeydown);
  };
  
  return form;
}

export default TaskForm;
