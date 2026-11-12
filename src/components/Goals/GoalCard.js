/**
 * GoalCard - Tarjeta de meta con anillo SVG progreso, streak, increment/decrement
 */

import { formatRelativeDate } from '../../../utils/date.js';
import { ICONS } from '../../Header/Header.js';

const ICONS_EXTRA = {
  fire: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2.01-1-3A2.5 2.5 0 0 1 13.5 5c0 1.38.5 2.01 1 3a2.5 2.5 0 0 0-5 0"/><path d="M15 12a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2.01-1-3A2.5 2.5 0 0 0 13.5 5c0 1.38.5 2.01 1 3a2.5 2.5 0 0 1 5 0"/></svg>',
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  minus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  check: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  edit: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  reset: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M21 12a9 9 0 1 1-9 9 9.75 9.75 0 0 1 6.74-2.74L21 16"/></svg>',
  delete: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  chart: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>'
};

export function GoalCard({ goal, onIncrement, onDecrement, onEdit, onReset, onDelete, onViewHistory, compact = false }) {
  const card = document.createElement('article');
  card.className = `card goal-card ${goal.isCompleted ? 'goal-card--completed' : ''} ${goal.streak > 0 ? 'streak-active' : ''}`;
  card.dataset.goalId = goal.id;
  
  if (compact) {
    card.style.padding = 'var(--space-sm)';
  }
  
  const progress = goal.progress;
  const isCompleted = goal.isCompleted;
  const radius = compact ? 24 : 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const strokeWidth = compact ? 3 : 4;
  
  const periodLabel = goal.period === 'daily' ? 'Diaria' : 'Semanal';
  const periodClass = goal.period === 'daily' ? 'badge--primary' : 'badge--success';
  const history = goal.completedDates || [];
  const weeklyCompleted = history.slice(-7).filter(d => d).length;
  
  card.innerHTML = `
    <div class="card__header" style="flex-direction: column; align-items: flex-start; gap: var(--space-sm); padding: ${compact ? 'var(--space-sm)' : 'var(--space-md)'}; border-bottom: ${compact ? 'none' : '1px solid var(--color-border)'};">
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: var(--space-sm);">
        <h3 class="card__title" style="margin: 0; font-size: ${compact ? 'var(--font-size-sm)' : 'var(--font-size-base)'}; ${isCompleted ? 'text-decoration: line-through; color: var(--color-fg-muted);' : ''} flex: 1; min-width: 0;">
          ${escapeHtml(goal.title)}
        </h3>
        <div class="goal-actions" style="display: flex; gap: 2px; opacity: ${compact ? '1' : '0'}; transition: opacity var(--transition-fast);">
          <button class="btn btn--ghost btn--icon btn--sm" data-edit title="Editar" aria-label="Editar meta">${ICONS_EXTRA.edit}</button>
          <button class="btn btn--ghost btn--icon btn--sm" data-reset title="Resetear progreso" aria-label="Resetear">${ICONS_EXTRA.reset}</button>
          <button class="btn btn--ghost btn--icon btn--sm btn--danger" data-delete title="Eliminar" aria-label="Eliminar">${ICONS_EXTRA.delete}</button>
        </div>
      </div>
      
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-xs); font-size: ${compact ? 'var(--font-size-xs)' : 'var(--font-size-sm)'}; color: var(--color-fg-muted);">
        <span class="badge ${periodClass}" style="font-size: ${compact ? '10px' : 'var(--font-size-xs)'};">${periodLabel}</span>
        ${goal.streak > 0 ? `
          <span class="badge badge--warning" style="font-size: ${compact ? '10px' : 'var(--font-size-xs)'}; display: flex; align-items: center; gap: 4px;">
            ${ICONS_EXTRA.fire} ${goal.streak} ${goal.streak === 1 ? 'día' : 'días'}
          </span>
        ` : ''}
        ${!compact ? `<span>${weeklyCompleted}/7 días esta semana</span>` : ''}
      </div>
    </div>
    
    ${!compact ? `
      <div class="card__content" style="padding: var(--space-lg) var(--space-md); text-align: center;">
        <!-- Anillo de progreso grande -->
        <div class="goal-ring-large" style="position: relative; width: ${radius * 2}px; height: ${radius * 2}px; margin: 0 auto var(--space-lg);">
          <svg width="${radius * 2}" height="${radius * 2}" class="progress-ring">
            <circle class="progress-ring__bg" cx="${radius}" cy="${radius}" r="${radius}" stroke-width="${strokeWidth}" />
            <circle 
              class="progress-ring__progress ${isCompleted ? 'progress-ring__progress--success' : ''}" 
              cx="${radius}" cy="${radius}" r="${radius}"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
              style="transition: stroke-dashoffset 0.5s ease-out;"
            />
          </svg>
          <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-weight: 700; font-size: var(--font-size-xl); color: var(--color-fg);">${progress}%</span>
            <span style="font-size: var(--font-size-sm); color: var(--color-fg-muted);">${goal.current}/${goal.target} ${goal.unit}</span>
          </div>
        </div>
        
        <!-- Controles rápidos -->
        <div style="display: flex; justify-content: center; gap: var(--space-md); margin-bottom: var(--space-lg);">
          <button 
            class="btn btn--ghost btn--icon btn--lg" 
            data-decrement 
            title="Decrementar" 
            ${isCompleted ? 'disabled' : ''}
            aria-label="Decrementar"
          >
            ${ICONS_EXTRA.minus}
          </button>
          <button 
            class="btn btn--primary btn--icon btn--lg" 
            data-increment 
            title="Incrementar" 
            ${isCompleted ? 'disabled' : ''}
            aria-label="Incrementar"
          >
            ${isCompleted ? ICONS_EXTRA.check : ICONS_EXTRA.plus}
          </button>
        </div>
        
        <!-- Mini gráfico semanal -->
        <div class="goal-weekly-chart" style="margin-top: var(--space-lg); padding-top: var(--space-lg); border-top: 1px solid var(--color-border);">
          <h4 style="font-size: var(--font-size-xs); font-weight: 600; color: var(--color-fg-muted); margin-bottom: var(--space-sm); text-align: center;">Últimos 7 días</h4>
          <div style="display: flex; align-items: end; justify-content: center; gap: 4px; height: 40px;">
            ${renderWeeklyBars(history.slice(-7))}
          </div>
        </div>
      </div>
    ` : `
      <!-- Versión compacta para dashboard -->
      <div class="card__content" style="padding: var(--space-sm); display: flex; align-items: center; gap: var(--space-sm);">
        <div class="goal-ring-small" style="position: relative; width: 48px; height: 48px; flex-shrink: 0;">
          <svg width="48" height="48" class="progress-ring">
            <circle class="progress-ring__bg" cx="24" cy="24" r="20" stroke-width="3" />
            <circle 
              class="progress-ring__progress ${isCompleted ? 'progress-ring__progress--success' : ''}" 
              cx="24" cy="24" r="20"
              stroke-width="3"
              stroke-dasharray="${2 * Math.PI * 20}"
              stroke-dashoffset="${2 * Math.PI * 20 - (progress / 100) * 2 * Math.PI * 20}"
              style="transition: stroke-dashoffset 0.5s ease-out;"
            />
          </svg>
          <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--font-size-sm); color: var(--color-fg);">${progress}%</div>
        </div>
        <div style="flex: 1; min-width: 0; text-align: left;">
          <h4 style="font-size: var(--font-size-sm); font-weight: 600; margin: 0 0 2px; ${isCompleted ? 'text-decoration: line-through; color: var(--color-fg-muted);' : ''}">
            ${escapeHtml(goal.title)}
          </h4>
          <div style="font-size: var(--font-size-xs); color: var(--color-fg-muted); display: flex; align-items: center; gap: var(--space-xs);">
            <span>${goal.current}/${goal.target} ${goal.unit}</span>
            ${goal.streak > 0 ? `<span class="badge badge--warning" style="font-size: 10px;">${ICONS_EXTRA.fire} ${goal.streak}</span>` : ''}
          </div>
        </div>
        <button 
          class="btn btn--primary btn--icon btn--sm" 
          data-increment 
          ${isCompleted ? 'disabled' : ''}
          aria-label="${isCompleted ? 'Completada' : `Incrementar ${goal.title}`}"
        >
          ${isCompleted ? ICONS_EXTRA.check : ICONS_EXTRA.plus}
        </button>
      </div>
    `}
  `;
  
  // Mostrar acciones al hover (solo no compact)
  if (!compact) {
    card.addEventListener('mouseenter', () => {
      card.querySelector('.goal-actions').style.opacity = '1';
    });
    card.addEventListener('mouseleave', () => {
      card.querySelector('.goal-actions').style.opacity = '0';
    });
  }
  
  // Event listeners
  card.querySelector('[data-increment]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    onIncrement?.(goal.id);
  });
  
  card.querySelector('[data-decrement]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    onDecrement?.(goal.id);
  });
  
  card.querySelector('[data-edit]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    onEdit?.(goal);
  });
  
  card.querySelector('[data-reset]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('¿Resetear progreso de esta meta?')) onReset?.(goal.id);
  });
  
  card.querySelector('[data-delete]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta meta permanentemente?')) onDelete?.(goal.id);
  });
  
  // Click en tarjeta para ver historial (solo no compact)
  if (!compact) {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('[data-increment], [data-decrement], [data-edit], [data-reset], [data-delete], .goal-actions')) {
        onViewHistory?.(goal.id);
      }
    });
    card.style.cursor = 'pointer';
  }
  
  return card;
}

function renderWeeklyBars(history) {
  const maxHeight = 40;
  const barWidth = 28;
  const today = new Date().toISOString().split('T')[0];
  
  return history.map((day, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const completed = day === dateStr || (day && day === dateStr);
    const isToday = dateStr === today;
    
    return `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
        <div class="week-bar ${completed ? 'week-bar--completed' : ''} ${isToday ? 'week-bar--today' : ''}" 
             style="width: ${barWidth}px; height: ${completed ? maxHeight : 4}px; background: ${completed ? 'var(--color-success)' : (isToday ? 'var(--color-primary)' : 'var(--color-border)')}; border-radius: 2px; transition: height 0.3s ease, background 0.3s ease;"></div>
        <span style="font-size: 9px; color: var(--color-fg-subtle); ${isToday ? 'font-weight: 600; color: var(--color-primary);' : ''}">${dateStr.slice(5)}</span>
      </div>
    `;
  }).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default GoalCard;
