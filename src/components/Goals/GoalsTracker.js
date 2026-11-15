/**
 * GoalsTracker - Contenedor de metas con lista completa, acciones y modal
 */

import { GoalCard } from './GoalCard.js';
import { GoalForm } from './GoalForm.js';
import { db } from '../../store/index.js';

const ICONS = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  filter: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  chart: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>'
};

export function GoalsTracker({ compact = false, maxItems = null, onNavigate }) {
  const container = document.createElement('div');
  container.className = 'goals-tracker';
  
  let filterPeriod = 'all'; // 'all' | 'daily' | 'weekly'
  
  function render() {
    const goals = db.goals.getToday();
    const stats = db.goals.getStats();
    let filteredGoals = goals;
    
    if (filterPeriod !== 'all') {
      filteredGoals = goals.filter(g => g.period === filterPeriod);
    }
    
    if (maxItems) {
      filteredGoals = filteredGoals.slice(0, maxItems);
    }
    
    container.innerHTML = `
      <div class="goals-tracker__header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--s-4); flex-wrap: wrap; gap: var(--s-2);">
        <div style="display: flex; align-items: center; gap: var(--s-2);">
          <h2 style="margin: 0; font-size: ${compact ? 'var(--text-lg)' : 'var(--text-lg)'};">${ICONS.chart} Metas</h2>
          ${!compact ? `
            <span class="badge badge--neutral" style="font-size: var(--text-xs);">${stats.completedToday}/${stats.daily} hoy</span>
          ` : ''}
        </div>
        <div style="display: flex; gap: var(--s-1); flex-wrap: wrap;">
          <select class="form-select form-select--sm" data-filter-period style="min-width: 140px;">
            <option value="all">Todas</option>
            <option value="daily">Diarias</option>
            <option value="weekly">Semanales</option>
          </select>
          ${!compact ? `
            <button class="btn btn--primary btn--sm" data-add-goal style="display: flex; align-items: center; gap: var(--s-1);">
              ${ICONS.plus} Nueva
            </button>
          ` : ''}
        </div>
      </div>
      
      <div class="goals-tracker__list" style="display: flex; flex-direction: column; gap: ${compact ? 'var(--s-2)' : 'var(--s-4)'};" data-goals-list>
        ${filteredGoals.length === 0 ? renderEmptyState() : ''}
      </div>
      
      ${maxItems && goals.length > maxItems ? `
        <div style="text-align: center; margin-top: var(--s-4);">
          <button class="btn btn--ghost btn--sm" data-view-all>Ver todas (${goals.length}) →</button>
        </div>
      ` : ''}
      
      ${!compact && stats.total > 0 ? renderStatsSummary(stats) : ''}
    `;
    
    // Añadir las tarjetas como elementos reales (conserva listeners)
    const listEl = container.querySelector('[data-goals-list]');
    filteredGoals.forEach(goal => listEl?.appendChild(renderGoalCard(goal)));
    
    bindEvents();
  }
  
  function renderGoalCard(goal) {
    // Devuelve el ELEMENTO (no outerHTML) para conservar los listeners de
    // incrementar/decrementar/editar/resetear/eliminar/historial
    return GoalCard({
      goal,
      onIncrement: (id) => db.goals.incrementProgress(id),
      onDecrement: (id) => db.goals.decrementProgress(id),
      onEdit: (goal) => openModal(goal),
      onReset: (id) => db.goals.resetGoal(id),
      onDelete: (id) => db.goals.remove(id),
      onViewHistory: (id) => showHistoryModal(id),
      compact
    });
  }
  
  function renderEmptyState() {
    return `
      <div class="empty-state" style="padding: var(--s-6); text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="empty-state__icon">${ICONS.chart}</div>
        <h3 class="empty-state__title" style="margin: var(--s-2) 0;">${filterPeriod !== 'all' ? 'Sin metas en este período' : 'Sin metas diarias'}</h3>
        <p class="empty-state__description" style="font-size: var(--text-sm); max-width: 280px;">
          ${filterPeriod !== 'all' ? `No hay metas ${filterPeriod === 'daily' ? 'diarias' : 'semanales'}` : 'Añade metas para rastrear hábitos: agua, pasos, lectura, etc.'}
        </p>
        <button class="btn btn--primary empty-state__action" data-add-goal style="margin-top: var(--s-4);">${ICONS.plus} Crear primera meta</button>
      </div>
    `;
  }
  
  function renderStatsSummary(stats) {
    return `
      <div class="goals-tracker__stats" style="margin-top: var(--s-6); padding: var(--s-4); background: var(--bg); border-radius: var(--r-md); border: 1px solid var(--line);">
        <h4 style="font-size: var(--text-sm); font-weight: 600; color: var(--ink-2); margin-bottom: var(--s-2);">Resumen</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--s-2); font-size: var(--text-sm);">
          <div><span style="color: var(--ink-2);">Total metas:</span> <strong>${stats.total}</strong></div>
          <div><span style="color: var(--ink-2);">Diarias:</span> <strong>${stats.daily}</strong></div>
          <div><span style="color: var(--ink-2);">Semanales:</span> <strong>${stats.weekly}</strong></div>
          <div><span style="color: var(--ink-2);">Completadas hoy:</span> <strong style="color: var(--accent);">${stats.completedToday}</strong></div>
          <div><span style="color: var(--ink-2);">Racha total:</span> <strong>${stats.totalStreak} días</strong></div>
          <div><span style="color: var(--ink-2);">Mejor racha:</span> <strong>${stats.bestStreak} días</strong></div>
        </div>
      </div>
    `;
  }
  
  function bindEvents() {
    // Filtro período
    container.querySelector('[data-filter-period]')?.addEventListener('change', (e) => {
      filterPeriod = e.target.value;
      render();
    });
    
    // Nueva meta
    container.querySelectorAll('[data-add-goal]').forEach(btn => {
      btn.addEventListener('click', () => openModal());
    });
    
    // Ver todas
    container.querySelector('[data-view-all]')?.addEventListener('click', () => {
      onNavigate?.('goals');
    });
  }
  
  function openModal(editGoal = null) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const form = GoalForm({
      goal: editGoal,
      onClose: () => {
        form.destroy?.();
        overlay.remove();
      },
      onSubmit: (idOrData, data) => {
        if (editGoal) {
          db.goals.update(editGoal.id, data);
        } else {
          // GoalForm llama onSubmit(data) al crear (un solo argumento)
          db.goals.create(idOrData);
        }
        form.destroy?.();
        overlay.remove();
      }
    });
    
    overlay.appendChild(form);
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        form.destroy?.();
        overlay.remove();
      }
    });
  }
  
  function showHistoryModal(goalId) {
    const goal = db.goals.getById(goalId);
    if (!goal) return;
    
    const history = db.goals.getHistory(goalId, 30);
    const completedCount = history.filter(h => h.completed).length;
    
    // Mejor racha real a partir del historial (sin mutar el estado)
    const sortedDates = [...(goal.completedDates || [])].sort();
    let bestStreak = 0;
    let run = 0;
    let prevDate = null;
    for (const d of sortedDates) {
      const diff = prevDate ? Math.round((new Date(d) - new Date(prevDate)) / 86400000) : 0;
      run = prevDate && diff === 1 ? run + 1 : 1;
      bestStreak = Math.max(bestStreak, run);
      prevDate = d;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <header class="modal__header">
          <h2 class="modal__title">${ICONS.chart} Historial: ${escapeHtml(goal.title)}</h2>
          <button class="btn btn--ghost btn--icon modal__close" data-close aria-label="Cerrar">
            <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>
        <div class="modal__body" style="max-height: 60vh; overflow: auto;">
          <div style="margin-bottom: var(--s-6); padding: var(--s-4); background: var(--bg); border-radius: var(--r-md);">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-4); text-align: center;">
              <div>
                <div style="font-size: var(--text-lg); font-weight: 700; color: var(--accent);">${completedCount}</div>
                <div style="font-size: var(--text-xs); color: var(--ink-2);">Días completados</div>
              </div>
              <div>
                <div style="font-size: var(--text-lg); font-weight: 700; color: var(--accent);">${goal.streak}</div>
                <div style="font-size: var(--text-xs); color: var(--ink-2);">Racha actual</div>
              </div>
              <div>
                <div style="font-size: var(--text-lg); font-weight: 700; color: var(--ink-2);">${bestStreak}</div>
                <div style="font-size: var(--text-xs); color: var(--ink-2);">Mejor racha</div>
              </div>
            </div>
          </div>
          
          <h4 style="font-size: var(--text-sm); font-weight: 600; color: var(--ink-2); margin-bottom: var(--s-2);">Últimos 30 días</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${history.map(day => `
              <button class="history-day ${day.completed ? 'history-day--completed' : ''}" 
                      style="width: 44px; height: 44px; border-radius: var(--r-sm); border: 1px solid var(--line); background: ${day.completed ? 'var(--accent)' : 'var(--bg)'}; color: ${day.completed ? 'var(--accent)' : 'var(--ink-2)'}; font-size: 11px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: default;"
                      title="${day.date}: ${day.completed ? 'Completado' : 'Pendiente'}">
                <span style="font-weight: 600;">${day.date.slice(8)}</span>
                <span style="font-size: 9px;">${day.completed ? '✓' : ''}</span>
              </button>
            `).join('')}
          </div>
        </div>
        <footer class="modal__footer">
          <button class="btn btn--primary" data-close>Cerrar</button>
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
  
  // Suscribirse a cambios
  const unsub = db.goals.subscribe(render);
  
  container.destroy = () => {
    unsub();
  };
  
  // Exponer el modal para uso externo (GoalsView.openGoalModal, atajo G)
  container.openModal = openModal;
  
  // Render inicial
  render();
  
  return container;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default GoalsTracker;
