/**
 * GoalsView - Vista expandida de metas (pantalla completa con gráficos)
 */

import { db } from '../store/index.js';
import { formatRelativeDate, todayString, diffDays } from '../utils/date.js';
import { nanoid } from '../utils/id.js';
import { ICONS } from '../components/Header/Header.js';

const ICONS_EXTRA = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  trash: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  edit: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  reset: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M21 12a9 9 0 1 1-9 9 9.75 9.75 0 0 1 6.74-2.74L21 16"/></svg>',
  fire: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2.01-1-3A2.5 2.5 0 0 1 13.5 5c0 1.38.5 2.01 1 3a2.5 2.5 0 0 0-5 0"/><path d="M15 12a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2.01-1-3A2.5 2.5 0 0 0 13.5 5c0 1.38.5 2.01 1 3a2.5 2.5 0 0 1 5 0"/></svg>',
  check: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  minus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  chart: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>'
};

export class GoalsView {
  constructor({ db: store }) {
    this.db = store;
    this.unsubscribers = [];
    this.element = null;
  }
  
  render() {
    this.element = document.createElement('section');
    this.element.className = 'view goals-view';
    this.element.innerHTML = this.renderTemplate();
    
    this.bindEvents();
    this.subscribeToChanges();
    
    return this.element;
  }
  
  renderTemplate() {
    const goals = this.db.goals.getToday();
    const stats = this.db.goals.getStats();
    
    return `
      <header class="view__header">
        <div class="view__title-group">
          <h1 class="view__title">${ICONS.target} Metas diarias</h1>
          <span class="view__count">${stats.completedToday}/${stats.daily} completadas · Racha total: ${stats.totalStreak} días</span>
        </div>
        <button class="btn btn--primary" data-action="add-goal">
          ${ICONS_EXTRA.plus} Nueva meta
        </button>
      </header>
      
      <div class="view__content">
        ${goals.length === 0 ? this.renderEmptyState() : this.renderGoalsGrid(goals)}
      </div>
      
      <!-- Modal para nueva/editar meta -->
      <div class="modal-overlay" id="goal-modal" hidden>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="goal-modal-title">
          <header class="modal__header">
            <h2 class="modal__title" id="goal-modal-title">Nueva meta</h2>
            <button class="btn btn--ghost btn--icon modal__close" data-close-modal aria-label="Cerrar">
              <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </header>
          <form class="modal__body" id="goal-form">
            <div class="form-group">
              <label class="form-label">Título</label>
              <input type="text" class="form-input" name="title" placeholder="Ej: Beber agua, Leer, Ejercicio" required>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
              <div class="form-group">
                <label class="form-label">Objetivo</label>
                <input type="number" class="form-input" name="target" min="1" value="1" required>
              </div>
              <div class="form-group">
                <label class="form-label">Unidad</label>
                <input type="text" class="form-input" name="unit" placeholder="veces, minutos, litros, km" value="veces" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Período</label>
              <select class="form-select" name="period">
                <option value="daily">Diaria (reset cada día)</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Progreso inicial</label>
              <input type="number" class="form-input" name="current" min="0" value="0">
            </div>
          </form>
          <footer class="modal__footer">
            <button type="button" class="btn btn--secondary" data-close-modal>Cancelar</button>
            <button type="submit" class="btn btn--primary" form="goal-form">Guardar meta</button>
          </footer>
        </div>
      </div>
    `;
  }
  
  renderGoalsGrid(goals) {
    return `
      <div class="goals-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-md);">
        ${goals.map(goal => this.renderGoalCard(goal)).join('')}
      </div>
    `;
  }
  
  renderGoalCard(goal) {
    const progress = goal.progress;
    const isCompleted = goal.isCompleted;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    const streakClass = goal.streak > 0 ? 'streak-active' : '';
    
    const history = this.db.goals.getHistory(goal.id, 7);
    const weeklyCompleted = history.filter(h => h.completed).length;
    
    return `
      <article class="card goal-card ${isCompleted ? 'goal-card--completed' : ''} ${streakClass}" data-goal-id="${goal.id}">
        <div class="card__header" style="flex-direction: column; align-items: flex-start; gap: var(--space-sm);">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: var(--space-sm);">
            <h3 class="card__title" style="margin: 0; ${isCompleted ? 'text-decoration: line-through; color: var(--color-fg-muted);' : ''}">
              ${this.escapeHtml(goal.title)}
            </h3>
            <div class="goal-actions" style="display: flex; gap: var(--space-xs);">
              <button class="btn btn--ghost btn--icon btn--sm" data-edit title="Editar">${ICONS_EXTRA.edit}</button>
              <button class="btn btn--ghost btn--icon btn--sm" data-reset title="Resetear">${ICONS_EXTRA.reset}</button>
              <button class="btn btn--ghost btn--icon btn--sm btn--danger" data-delete title="Eliminar">${ICONS_EXTRA.trash}</button>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-fg-muted);">
            <span class="badge badge--${goal.period === 'daily' ? 'primary' : 'success'}">${goal.period === 'daily' ? 'Diaria' : 'Semanal'}</span>
            ${goal.streak > 0 ? `
              <span class="badge badge--warning" style="display: flex; align-items: center; gap: 4px;">
                ${ICONS_EXTRA.fire} ${goal.streak} días
              </span>
            ` : ''}
            <span>${weeklyCompleted}/7 días esta semana</span>
          </div>
        </div>
        
        <div class="card__content" style="padding: var(--space-lg) var(--space-md); text-align: center;">
          <!-- Anillo de progreso grande -->
          <div class="goal-ring-large" style="position: relative; width: 120px; height: 120px; margin: 0 auto var(--space-lg);">
            <svg width="120" height="120" class="progress-ring">
              <circle class="progress-ring__bg" cx="60" cy="60" r="${radius}" />
              <circle 
                class="progress-ring__progress ${isCompleted ? 'progress-ring__progress--success' : ''}" 
                cx="60" cy="60" r="${radius}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                style="transition: stroke-dashoffset 0.5s ease-out;"
              />
            </svg>
            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-weight: 700; font-size: var(--font-size-2xl); color: var(--color-fg);">${progress}%</span>
              <span style="font-size: var(--font-size-sm); color: var(--color-fg-muted);">${goal.current}/${goal.target} ${goal.unit}</span>
            </div>
          </div>
          
          <!-- Controles rápidos -->
          <div style="display: flex; justify-content: center; gap: var(--space-md); margin-bottom: var(--space-lg);">
            <button class="btn btn--ghost btn--icon btn--lg" data-decrement title="Decrementar" ${isCompleted ? 'disabled' : ''}>
              ${ICONS_EXTRA.minus}
            </button>
            <button class="btn btn--primary btn--icon btn--lg" data-increment title="Incrementar" ${isCompleted ? 'disabled' : ''}>
              ${ICONS_EXTRA.plus}
            </button>
          </div>
          
          <!-- Mini gráfico semanal -->
          ${this.renderWeeklyMiniChart(history)}
        </div>
      </article>
    `;
  }
  
  renderWeeklyMiniChart(history) {
    if (!history || history.length === 0) return '';
    
    const maxHeight = 40;
    const barWidth = 30;
    const gap = 4;
    
    return `
      <div class="goal-weekly-chart" style="margin-top: var(--space-lg); padding-top: var(--space-lg); border-top: 1px solid var(--color-border);">
        <h4 style="font-size: var(--font-size-xs); font-weight: 600; color: var(--color-fg-muted); margin-bottom: var(--space-sm); text-align: center;">Últimos 7 días</h4>
        <div style="display: flex; align-items: end; justify-content: center; gap: ${gap}px; height: ${maxHeight}px;">
          ${history.map((day, i) => `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div class="week-bar ${day.completed ? 'week-bar--completed' : ''}" 
                   style="width: ${barWidth}px; height: ${day.completed ? maxHeight : 4}px; background: ${day.completed ? 'var(--color-success)' : 'var(--color-border)'}; border-radius: 2px; transition: height 0.3s ease;"></div>
              <span style="font-size: 9px; color: var(--color-fg-subtle);">${day.date.slice(5)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  renderEmptyState() {
    return `
      <div class="empty-state" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-2xl); text-align: center;">
        <div class="empty-state__icon">${ICONS.target}</div>
        <h3 class="empty-state__title">Sin metas diarias</h3>
        <p class="empty-state__description">Crea metas para rastrear hábitos: beber agua, ejercicio, lectura, meditación...</p>
        <button class="btn btn--primary empty-state__action" data-action="add-goal">
          ${ICONS_EXTRA.plus} Crear primera meta
        </button>
      </div>
    `;
  }
  
  bindEvents() {
    if (!this.element) return;
    
    // Nueva meta
    this.element.querySelector('[data-action="add-goal"]')?.addEventListener('click', () => {
      this.openGoalModal();
    });
    
    // Modal
    const modal = this.element.querySelector('#goal-modal');
    const form = this.element.querySelector('#goal-form');
    
    this.element.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => this.closeGoalModal());
    });
    
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.closeGoalModal();
    });
    
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveGoalFromModal();
    });
    
    // Acciones en tarjetas
    this.element.querySelectorAll('[data-goal-id]').forEach(card => {
      const id = card.dataset.goalId;
      
      card.querySelector('[data-increment]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.db.goals.incrementProgress(id);
      });
      
      card.querySelector('[data-decrement]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.db.goals.decrementProgress(id);
      });
      
      card.querySelector('[data-edit]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openGoalModal(id);
      });
      
      card.querySelector('[data-reset]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Resetear progreso de esta meta?')) this.db.goals.resetGoal(id);
      });
      
      card.querySelector('[data-delete]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Eliminar esta meta permanentemente?')) this.db.goals.remove(id);
      });
    });
    
    // Teclado: Escape cierra modal
    this.keydownHandler = (e) => {
      if (e.key === 'Escape') this.closeGoalModal();
    };
    document.addEventListener('keydown', this.keydownHandler);
  }
  
  openGoalModal(editId = null) {
    const modal = this.element.querySelector('#goal-modal');
    const form = this.element.querySelector('#goal-form');
    const title = modal.querySelector('.modal__title');
    
    if (editId) {
      const goal = this.db.goals.getById(editId);
      if (!goal) return;
      
      title.textContent = 'Editar meta';
      form.dataset.editId = editId;
      form.title.value = goal.title;
      form.target.value = goal.target;
      form.unit.value = goal.unit;
      form.period.value = goal.period;
      form.current.value = goal.current;
    } else {
      title.textContent = 'Nueva meta';
      delete form.dataset.editId;
      form.reset();
      form.target.value = '1';
      form.unit.value = 'veces';
      form.period.value = 'daily';
      form.current.value = '0';
    }
    
    modal.hidden = false;
    form.title.focus();
  }
  
  closeGoalModal() {
    const modal = this.element.querySelector('#goal-modal');
    const form = this.element.querySelector('#goal-form');
    modal.hidden = true;
    delete form.dataset.editId;
  }
  
  saveGoalFromModal() {
    const form = this.element.querySelector('#goal-form');
    const editId = form.dataset.editId;
    
    const data = {
      title: form.title.value.trim(),
      target: Number(form.target.value),
      unit: form.unit.value.trim(),
      period: form.period.value,
      current: Number(form.current.value) || 0
    };
    
    if (!data.title) return;
    
    if (editId) {
      this.db.goals.update(editId, data);
    } else {
      this.db.goals.create(data);
    }
    
    this.closeGoalModal();
  }
  
  subscribeToChanges() {
    this.unsubscribers.push(
      this.db.goals.subscribe(() => this.refresh())
    );
  }
  
  refresh() {
    if (!this.element) return;
    
    const content = this.element.querySelector('.view__content');
    if (content) {
      const goals = this.db.goals.getToday();
      content.innerHTML = goals.length === 0 ? this.renderEmptyState() : this.renderGoalsGrid(goals);
      this.bindGoalCardEvents();
    }
  }
  
  bindGoalCardEvents() {
    this.element.querySelectorAll('[data-goal-id]').forEach(card => {
      const id = card.dataset.goalId;
      
      card.querySelector('[data-increment]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.db.goals.incrementProgress(id);
      });
      
      card.querySelector('[data-decrement]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.db.goals.decrementProgress(id);
      });
      
      card.querySelector('[data-edit]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openGoalModal(id);
      });
      
      card.querySelector('[data-reset]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Resetear progreso?')) this.db.goals.resetGoal(id);
      });
      
      card.querySelector('[data-delete]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Eliminar meta?')) this.db.goals.remove(id);
      });
    });
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    document.removeEventListener('keydown', this.keydownHandler);
  }
}

export default GoalsView;
