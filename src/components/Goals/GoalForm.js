/**
 * GoalForm - Formulario modal para crear/editar metas
 */

import { nanoid } from '../../../utils/id.js';
import { db } from '../../../store/index.js';

const ICONS = {
  close: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

const UNIT_SUGGESTIONS = [
  'veces', 'minutos', 'horas', 'litros', 'ml', 'vasos',
  'km', 'metros', 'pasos', 'páginas', 'capítulos',
  'pomodoros', 'series', 'repeticiones', 'calorías',
  'kg', 'libras', '%', 'días', 'semanas'
];

export function GoalForm({ goal = null, onClose, onSubmit }) {
  const isEditing = !!goal;
  const form = document.createElement('form');
  form.className = 'modal';
  form.style.maxWidth = '500px';
  
  const initialTitle = goal?.title || '';
  const initialTarget = goal?.target || 1;
  const initialCurrent = goal?.current || 0;
  const initialUnit = goal?.unit || 'veces';
  const initialPeriod = goal?.period || 'daily';
  
  form.innerHTML = `
    <header class="modal__header">
      <h2 class="modal__title">${isEditing ? 'Editar meta' : 'Nueva meta'}</h2>
      <button type="button" class="btn btn--ghost btn--icon modal__close" data-close aria-label="Cerrar">${ICONS.close}</button>
    </header>
    <div class="modal__body">
      <div class="form-group">
        <label class="form-label" for="goal-title">Título *</label>
        <input type="text" class="form-input" id="goal-title" name="title" required 
               placeholder="Ej: Beber agua, Leer, Ejercicio, Meditar" 
               value="${escapeHtml(initialTitle)}" autocomplete="off">
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label" for="goal-target">Objetivo *</label>
          <input type="number" class="form-input" id="goal-target" name="target" min="1" step="1" 
                 value="${initialTarget}" required>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="goal-unit">Unidad *</label>
          <div style="position: relative;">
            <input type="text" class="form-input" id="goal-unit" name="unit" 
                   placeholder="veces, minutos, litros..." 
                   value="${escapeHtml(initialUnit)}" required list="unit-suggestions" autocomplete="off">
            <datalist id="unit-suggestions">
              ${UNIT_SUGGESTIONS.map(u => `<option value="${u}">`).join('')}
            </datalist>
          </div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label" for="goal-period">Período</label>
          <select class="form-select" id="goal-period" name="period">
            <option value="daily" ${initialPeriod === 'daily' ? 'selected' : ''}>Diaria (reset cada día)</option>
            <option value="weekly" ${initialPeriod === 'weekly' ? 'selected' : ''}>Semanal</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="goal-current">Progreso inicial</label>
          <input type="number" class="form-input" id="goal-current" name="current" min="0" step="1" 
                 value="${initialCurrent}">
        </div>
      </div>
      
      ${isEditing ? `
        <div class="form-group">
          <label class="checkbox">
            <input type="checkbox" class="checkbox__input" name="resetProgress" id="reset-progress">
            <span class="checkbox__box"></span>
            <span class="checkbox__label">Resetear progreso a 0 al guardar</span>
          </label>
        </div>
      ` : ''}
    </div>
    <footer class="modal__footer">
      <button type="button" class="btn btn--secondary" data-close>Cancelar</button>
      <button type="submit" class="btn btn--primary">${isEditing ? 'Guardar cambios' : 'Crear meta'}</button>
    </footer>
  `;
  
  // Focus en título
  setTimeout(() => form.querySelector('#goal-title')?.focus(), 50);
  
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
      target: parseInt(formData.get('target')) || 1,
      unit: formData.get('unit')?.trim() || 'veces',
      period: formData.get('period'),
      current: parseInt(formData.get('current')) || 0
    };
    
    if (!data.title) return;
    
    if (isEditing) {
      if (formData.get('resetProgress') === 'on') {
        data.current = 0;
        data.lastCompleted = null;
        data.streak = 0;
        data.completedDates = [];
      }
      onSubmit(goal.id, data);
    } else {
      onSubmit(data);
    }
  });
  
  // Escape para cerrar
  const handleKeydown = (e) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleKeydown);
  
  form.destroy = () => {
    document.removeEventListener('keydown', handleKeydown);
  };
  
  return form;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default GoalForm;
