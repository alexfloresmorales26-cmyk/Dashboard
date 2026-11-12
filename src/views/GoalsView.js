/**
 * GoalsView - Vista expandida de metas (pantalla completa)
 * Usa GoalsTracker con lista completa, stats, historial
 */

import { GoalsTracker } from '../components/Goals/GoalsTracker.js';
import { db } from '../store/index.js';
import { ICONS } from '../components/Header/Header.js';

const ICONS_EXTRA = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
};

export class GoalsView {
  constructor({ db: store, onNavigate }) {
    this.db = store;
    this.onNavigate = onNavigate;
    this.element = null;
    this.tracker = null;
  }
  
  render() {
    this.element = document.createElement('section');
    this.element.className = 'view goals-view';
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.height = '100%';
    
    const stats = this.db.goals.getStats();
    
    this.element.innerHTML = `
      <header class="view__header" style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg); border-bottom: 1px solid var(--color-border); flex-shrink: 0; flex-wrap: wrap; gap: var(--space-md);">
        <div class="view__title-group">
          <h1 class="view__title" style="display: flex; align-items: center; gap: var(--space-sm); margin: 0; font-size: var(--font-size-2xl);">${ICONS.target} Metas diarias</h1>
          <span class="view__count" style="color: var(--color-fg-muted); font-size: var(--font-size-lg); font-weight: 400;">${stats.completedToday}/${stats.daily} completadas · Racha total: ${stats.totalStreak} días</span>
        </div>
        <button class="btn btn--primary" data-action="add-goal" style="display: flex; align-items: center; gap: var(--space-sm);">
          ${ICONS_EXTRA.plus} Nueva meta
        </button>
      </header>
      
      <main class="view__content" style="flex: 1; overflow: auto; padding: var(--space-lg);" data-tracker-container></main>
    `;
    
    // Inicializar GoalsTracker completo
    const container = this.element.querySelector('[data-tracker-container]');
    this.tracker = GoalsTracker({ 
      compact: false, 
      maxItems: null,
      onNavigate: this.onNavigate
    });
    container.appendChild(this.tracker);
    
    // Botón nueva meta en header
    this.element.querySelector('[data-action="add-goal"]')?.addEventListener('click', () => {
      this.tracker.querySelector('[data-add-goal]')?.click();
    });
    
    return this.element;
  }
  
  destroy() {
    this.tracker?.destroy?.();
    this.element = null;
    this.tracker = null;
  }
}

export default GoalsView;
