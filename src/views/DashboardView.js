/**
 * DashboardView - Vista principal del dashboard
 * Renderiza widgets resumidos en cada columna usando componentes completos
 */

import { db } from '../store/index.js';
import { formatRelativeDate } from '../utils/date.js';
import { getFirstParagraph } from '../utils/markdown.js';
import { nanoid } from '../utils/id.js';
import { ICONS } from '../components/Header/Header.js';
import { TaskList } from '../components/TaskList/TaskList.js';
import { NoteCard } from '../components/Notes/NoteCard.js';
import { GoalCard } from '../components/Goals/GoalCard.js';

const ICONS_EXTRA = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  checkCircle: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  circle: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>',
  more: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  pin: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 11a6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6-6"/></svg>',
  tag: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
};

export class DashboardView {
  constructor({ db: store, onNavigate }) {
    this.db = store;
    this.onNavigate = onNavigate;
    this.unsubscribers = [];
    this.widgetElements = {};
    this.containers = {}; // Referencias a contenedores DOM
  }
  
  render() {
    const stats = {
      tasks: this.db.tasks.getStats(),
      notes: this.db.notes.getStats(),
      goals: this.db.goals.getStats()
    };

    this.element = document.createElement('div');
    this.element.className = 'dashboard-view';
    this.element.innerHTML = `
      <!-- Estadísticas principales -->
      <div class="stats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-md); margin-bottom: var(--space-lg);">
        <div class="stat-card">
          <div class="stat-card__value">${stats.tasks.total}</div>
          <div class="stat-card__label">Tareas totales</div>
          <div class="stat-card__subtitle">${stats.tasks.completed} completadas · ${stats.tasks.active} activas</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${stats.notes.total}</div>
          <div class="stat-card__label">Notas</div>
          <div class="stat-card__subtitle">${stats.notes.pinned} fijadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${stats.goals.total}</div>
          <div class="stat-card__label">Metas</div>
          <div class="stat-card__subtitle">${stats.goals.completedToday}/${stats.goals.daily} hoy</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${stats.tasks.overdue}</div>
          <div class="stat-card__label">Vencidas</div>
          <div class="stat-card__subtitle">${stats.tasks.highPriority} alta prioridad</div>
        </div>
      </div>

      <!-- Grid de widgets -->
      <div class="dashboard-grid" style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: var(--space-lg); min-height: 600px;">
        <!-- Columna izquierda: Análisis y gráficos -->
        <div class="widget-column">
          <div class="widget">
            <div class="widget__header">
              <h3 class="widget__title">Project analytics</h3>
              <span class="badge badge--primary">Hoy</span>
            </div>
            <div class="widget__content" style="padding: var(--space-lg);">
              <div style="height: 200px; display: flex; align-items: end; gap: var(--space-sm);">
                <div style="flex: 1; min-height: 40px; background: var(--glass-border); border-radius: var(--radius-sm);"></div>
                <div style="flex: 1; min-height: 80px; background: var(--color-primary); border-radius: var(--radius-sm);"></div>
                <div style="flex: 1; min-height: 120px; background: linear-gradient(135deg, var(--color-primary), var(--color-success)); border-radius: var(--radius-sm);"></div>
                <div style="flex: 1; min-height: 60px; background: var(--glass-border); border-radius: var(--radius-sm);"></div>
                <div style="flex: 1; min-height: 100px; background: var(--color-warning); border-radius: var(--radius-sm);"></div>
                <div style="flex: 1; min-height: 70px; background: var(--glass-border); border-radius: var(--radius-sm);"></div>
                <div style="flex: 1; min-height: 90px; background: var(--color-primary); border-radius: var(--radius-sm);"></div>
                <div style="flex: 1; min-height: 50px; background: var(--glass-border); border-radius: var(--radius-sm);"></div>
              </div>
              <div style="margin-top: var(--space-md); display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--text-muted);">
                <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
              </div>
            </div>
          </div>

          <div class="widget" style="margin-top: var(--space-lg);">
            <div class="widget__header">
              <h3 class="widget__title">Up next</h3>
              <div style="display: flex; align-items: center; gap: var(--space-xs);">
                <span class="badge badge--primary">Meeting</span>
                <span class="badge badge--success">Todo</span>
              </div>
            </div>
            <div class="widget__content" style="padding: var(--space-lg);">
              <div style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Meeting with Arc Co.</div>
              <div style="display: flex; align-items: center; gap: var(--space-xs); margin-bottom: var(--space-md);">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary);"></div>
                <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-success);"></div>
                <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-warning);"></div>
                <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-danger);"></div>
                <span style="font-size: var(--font-size-xs); color: var(--text-muted);">4 attendees</span>
              </div>
              <button class="btn btn--primary btn--block" style="width: 100%;">Start meeting</button>
            </div>
          </div>
        </div>

        <!-- Columna derecha: Proyectos y sesión -->
        <div class="widget-column" style="display: flex; flex-direction: column; gap: var(--space-lg);">
          <div class="widget" style="flex: 1;">
            <div class="widget__header">
              <h3 class="widget__title">Projects</h3>
              <button class="btn btn--ghost btn--sm">New</button>
            </div>
            <div class="widget__content" style="padding: var(--space-lg);">
              <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
                <span style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600;">A</span>
                <div style="flex: 1;">
                  <div style="font-size: var(--font-size-sm); font-weight: 600;">Designing app screens</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">70% complete</div>
                </div>
                <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--color-success);">70%</div>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
                <span style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-warning); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600;">O</span>
                <div style="flex: 1;">
                  <div style="font-size: var(--font-size-sm); font-weight: 600;">Onboarding flow</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">Full design</div>
                </div>
                <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--text-muted);">Basic</div>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
                <span style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-danger); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600;">P</span>
                <div style="flex: 1;">
                  <div style="font-size: var(--font-size-sm); font-weight: 600;">Online page load test</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">Critical priority</div>
                </div>
                <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--text-muted);">Testing</div>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-sm);">
                <span style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-success); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600;">C</span>
                <div style="flex: 1;">
                  <div style="font-size: var(--font-size-sm); font-weight: 600;">Cross-browser testing</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">Errors to track</div>
                </div>
                <div style="font-size: var(--font-size-xs); font-weight: 600; color: var(--text-muted);">Debug</div>
              </div>
            </div>
          </div>

          <div class="widget" style="min-height: 200px;">
            <div class="widget__header">
              <h3 class="widget__title">In session</h3>
            </div>
            <div class="widget__content" style="padding: var(--space-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
              <div style="font-size: var(--font-size-4xl); font-weight: 700; margin-bottom: var(--space-sm);">01:24:08</div>
              <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: var(--space-lg);">00:00 - 02:00 · Today</div>
              <div style="display: flex; gap: var(--space-sm);">
                <button class="btn btn--ghost btn--icon" style="width: 40px; height: 40px; border-radius: 50%;">
                  <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>
                </button>
                <button class="btn btn--primary btn--icon" style="width: 40px; height: 40px; border-radius: 50%;">
                  <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </button>
                <button class="btn btn--ghost btn--icon" style="width: 40px; height: 40px; border-radius: 50%;">
                  <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna del medio: Progreso y equipo -->
        <div class="widget-column" style="display: flex; flex-direction: column; gap: var(--space-lg);">
          <div class="widget" style="flex: 1;">
            <div class="widget__header">
              <h3 class="widget__title">Team collaboration</h3>
              <button class="btn btn--ghost btn--sm">Add member</button>
            </div>
            <div class="widget__content" style="padding: var(--space-lg);">
              <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
                <span style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600; color: white;">A</span>
                <div style="flex: 1;">
                  <div style="font-size: var(--font-size-sm); font-weight: 600;">Alejandra Delf</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">Designing app screens</div>
                </div>
                <span class="badge badge--success">Todo</span>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
                <span style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-success); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600; color: white;">E</span>
                <div style="flex: 1;">
                  <div style="font-size: var(--font-size-sm); font-weight: 600;">Elena Álvarez</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">Frontend development</div>
                </div>
                <span class="badge badge--primary">In Progress</span>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
                <span style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-warning); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600; color: white;">I</span>
                <div style="flex: 1;">
                  <div style="font-size: var(--font-size-sm); font-weight: 600;">Isaac Chicharro</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">UI/UX Design</div>
                </div>
                <span class="badge badge--warning">Review</span>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-sm);">
                <span style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-danger); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600; color: white;">D</span>
                <div style="flex: 1;">
                  <div style="font-size: var(--font-size-sm); font-weight: 600;">David Obrado</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">Backend API</div>
                </div>
                <span class="badge badge--danger">Blocked</span>
              </div>
            </div>
          </div>

          <div class="widget" style="min-height: 200px;">
            <div class="widget__header">
              <h3 class="widget__title">Project progress</h3>
            </div>
            <div class="widget__content" style="padding: var(--space-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
              <div style="position: relative; width: 120px; height: 120px;">
                <svg width="120" height="120">
                  <circle cx="60" cy="60" r="50" stroke="var(--glass-border)" stroke-width="8" fill="none"/>
                  <circle cx="60" cy="60" r="50" stroke="var(--color-primary)" stroke-width="8" fill="none" stroke-dasharray="314" stroke-dashoffset="188" stroke-linecap="round"/>
                </svg>
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                  <div style="font-size: var(--font-size-xl); font-weight: 700;">41%</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">Progress</div>
                </div>
              </div>
              <div style="margin-top: var(--space-lg); font-size: var(--font-size-xs); color: var(--text-muted);">
                Project completion rate this month
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Guardar referencias para cleanup
    this.containers.tasks = this.element.querySelector('[data-widget-content="tasks"]');
    this.containers.notes = this.element.querySelector('[data-widget-content="notes"]');
    this.containers.goals = this.element.querySelector('[data-widget-content="goals"]');

    // Suscribirse a cambios
    this.subscribeToChanges();

    return this.element;
  }
  
  subscribeToChanges() {
    this.unsubscribers.push(
      this.db.tasks.subscribe(() => this.renderTasksWidget()),
      this.db.notes.subscribe(() => this.renderNotesWidget()),
      this.db.goals.subscribe(() => this.renderGoalsWidget())
    );
  }
  
  // ============================================
  // WIDGET TAREAS - Usa TaskList compacto
  // ============================================
  
  renderTasksWidget() {
    const container = this.containers.tasks;
    if (!container) return;
    
    // Limpiar y renderizar TaskList compacto
    container.innerHTML = '';
    const taskList = TaskList({ 
      showCompleted: false, 
      maxItems: 5, 
      compact: true,
      onNavigate: this.onNavigate
    });
    container.appendChild(taskList);
    
    // Guardar referencia para cleanup
    this.widgetElements.tasks = taskList;
  }
  
  // ============================================
  // WIDGET NOTAS - Usa NoteCard
  // ============================================
  
  renderNotesWidget() {
    const container = this.containers.notes;
    if (!container) return;
    
    const notes = this.db.notes.getAll();
    const pinnedNotes = notes.filter(n => n.isPinned);
    const recentNotes = notes.filter(n => !n.isPinned).slice(0, 3);
    const displayNotes = [...pinnedNotes, ...recentNotes].slice(0, 4);
    
    container.innerHTML = `
      <div class="notes-widget" style="display: flex; flex-direction: column; gap: var(--space-sm);">
        ${displayNotes.length === 0 ? this.renderEmptyNotes() : displayNotes.map(note => this.renderNoteCard(note)).join('')}
        ${notes.length > displayNotes.length ? `
          <button class="btn btn--ghost btn--sm btn--block" data-nav="notes">
            Ver ${notes.length - displayNotes.length} notas más →
          </button>
        ` : ''}
      </div>
    `;
    
    // Event listeners para navegación
    container.querySelector('[data-nav="notes"]')?.addEventListener('click', () => {
      this.onNavigate?.('notes');
    });
  }
  
  renderNoteCard(note) {
    const card = NoteCard({
      note,
      onSelect: (id) => window.location.hash = `notes/${id}`,
      onPin: (id) => this.db.notes.togglePin(id),
      onEdit: (note) => window.location.hash = `notes/${note.id}`,
      onDelete: (id) => this.db.notes.remove(id),
      onDuplicate: (id) => this.db.notes.duplicate(id)
    });
    return card.outerHTML;
  }
  
  renderEmptyNotes() {
    return `
      <div class="empty-state" style="padding: var(--space-lg); text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="empty-state__icon">${ICONS.fileText}</div>
        <h3 class="empty-state__title" style="margin: var(--space-sm) 0;">Sin notas aún</h3>
        <p class="empty-state__description" style="font-size: var(--font-size-sm); max-width: 280px;">Crea tu primera nota en Markdown con preview en tiempo real.</p>
        <button class="btn btn--primary empty-state__action" data-action="add-note" style="margin-top: var(--space-md);">${ICONS_EXTRA.plus} Nueva nota</button>
      </div>
    `;
  }
  
  // ============================================
  // WIDGET METAS - Usa GoalCard compact
  // ============================================
  
  renderGoalsWidget() {
    const container = this.containers.goals;
    if (!container) return;
    
    const goals = this.db.goals.getToday();
    
    container.innerHTML = `
      <div class="goals-widget" style="display: flex; flex-direction: column; gap: var(--space-sm);">
        ${goals.length === 0 ? this.renderEmptyGoals() : goals.slice(0, 4).map(goal => this.renderGoalCardCompact(goal)).join('')}
        ${goals.length > 4 ? `
          <button class="btn btn--ghost btn--sm btn--block" data-nav="goals">
            Ver ${goals.length - 4} metas más →
          </button>
        ` : ''}
      </div>
    `;
    
    container.querySelector('[data-nav="goals"]')?.addEventListener('click', () => {
      this.onNavigate?.('goals');
    });
    
    // Botones de incremento
    container.querySelectorAll('[data-increment]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.closest('[data-goal-id]')?.dataset.goalId;
        if (id) this.db.goals.incrementProgress(id);
      });
    });
  }
  
  renderGoalCardCompact(goal) {
    const card = GoalCard({
      goal,
      onIncrement: (id) => this.db.goals.incrementProgress(id),
      onDecrement: () => {},
      onEdit: () => window.location.hash = 'goals',
      onReset: () => {},
      onDelete: () => {},
      onViewHistory: () => {},
      compact: true
    });
    return card.outerHTML;
  }
  
  renderEmptyGoals() {
    return `
      <div class="empty-state" style="padding: var(--space-lg); text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="empty-state__icon">${ICONS.target}</div>
        <h3 class="empty-state__title" style="margin: var(--space-sm) 0;">Sin metas diarias</h3>
        <p class="empty-state__description" style="font-size: var(--font-size-sm); max-width: 280px;">Añade metas para rastrear hábitos: agua, pasos, lectura, etc.</p>
        <button class="btn btn--primary empty-state__action" data-action="add-goal" style="margin-top: var(--space-md);">${ICONS_EXTRA.plus} Nueva meta</button>
      </div>
    `;
  }
  
  // ============================================
  // UTILIDADES
  // ============================================
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    Object.values(this.widgetElements).forEach(w => w.destroy?.());
    this.widgetElements = {};
    this.containers = {};
    this.element = null;
  }
}

export default DashboardView;
