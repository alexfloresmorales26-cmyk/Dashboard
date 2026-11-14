/**
 * DashboardView - Vista principal del dashboard
 * Widgets del dashboard con botones funcionales:
 *  - "New" (Projects) -> abre el flujo de nueva tarea
 *  - "Add member" (Team) -> añade un miembro a la lista
 *  - "Start meeting" + controles "In session" -> temporizador de sesión real
 *  - "Nueva meta" (empty state) -> abre el modal de meta
 * Las tarjetas de notas/metas se renderizan como elementos reales (con listeners)
 * y las tarjetas de estadísticas se actualizan en vivo.
 */

import { db } from '../store/index.js';

const ICONS_EXTRA = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  send: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>',
  pause: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  monitor: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  checkCircle: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
};

// Colores para los avatares de miembros
const MEMBER_COLORS = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)'];
const MEMBER_BADGES = ['Todo', 'In Progress', 'Review', 'Blocked'];
const MEMBER_BADGE_CLASSES = ['badge--success', 'badge--primary', 'badge--warning', 'badge--danger'];

export class DashboardView {
  constructor({ db: store, onNavigate }) {
    this.db = store;
    this.onNavigate = onNavigate;
    this.unsubscribers = [];

    // Temporizador de sesión ("In session")
    this.sessionSeconds = 0;
    this.sessionRunning = false;
    this.sessionInterval = null;

    // Miembros del widget "Team collaboration" (lista local editable)
    this.members = [
      { name: 'Alejandra Delf', role: 'Designing app screens', badge: MEMBER_BADGES[0], badgeClass: MEMBER_BADGE_CLASSES[0], color: MEMBER_COLORS[0] },
      { name: 'Elena Álvarez', role: 'Frontend development', badge: MEMBER_BADGES[1], badgeClass: MEMBER_BADGE_CLASSES[1], color: MEMBER_COLORS[1] },
      { name: 'Isaac Chicharro', role: 'UI/UX Design', badge: MEMBER_BADGES[2], badgeClass: MEMBER_BADGE_CLASSES[2], color: MEMBER_COLORS[2] },
      { name: 'David Obrado', role: 'Backend API', badge: MEMBER_BADGES[3], badgeClass: MEMBER_BADGE_CLASSES[3], color: MEMBER_COLORS[3] }
    ];
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
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card__value" data-stat="tasks-total">${stats.tasks.total}</div>
          <div class="stat-card__label">Tareas totales</div>
          <div class="stat-card__subtitle" data-stat="tasks-sub">${stats.tasks.completed} completadas · ${stats.tasks.active} activas</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value" data-stat="notes-total">${stats.notes.total}</div>
          <div class="stat-card__label">Notas</div>
          <div class="stat-card__subtitle" data-stat="notes-sub">${stats.notes.pinned} fijadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value" data-stat="goals-total">${stats.goals.total}</div>
          <div class="stat-card__label">Metas</div>
          <div class="stat-card__subtitle" data-stat="goals-sub">${stats.goals.completedToday}/${stats.goals.daily} hoy</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value" data-stat="overdue">${stats.tasks.overdue}</div>
          <div class="stat-card__label">Vencidas</div>
          <div class="stat-card__subtitle" data-stat="overdue-sub">${stats.tasks.highPriority} alta prioridad</div>
        </div>
      </div>

      <!-- Grid de widgets -->
      <div class="dashboard-grid">
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
              <button class="btn btn--primary btn--block" style="width: 100%;" data-action="session-toggle">Start meeting</button>
            </div>
          </div>
        </div>

        <!-- Columna central: Proyectos y sesión -->
        <div class="widget-column">
          <div class="widget" style="flex: 1;">
            <div class="widget__header">
              <h3 class="widget__title">Projects</h3>
              <button class="btn btn--ghost btn--sm" data-action="new-project">New</button>
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
              <div style="font-size: var(--font-size-4xl); font-weight: 700; margin-bottom: var(--space-sm);" data-session-time>00:00:00</div>
              <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: var(--space-lg);">00:00 - 02:00 · Today</div>
              <div style="display: flex; gap: var(--space-sm);">
                <button class="btn btn--ghost btn--icon" style="width: 40px; height: 40px; border-radius: 50%;" data-action="session-save" title="Registrar sesión como nota" aria-label="Registrar sesión como nota">
                  ${ICONS_EXTRA.plus}
                </button>
                <button class="btn btn--primary btn--icon" style="width: 40px; height: 40px; border-radius: 50%;" data-action="session-toggle" title="Iniciar/Pausar sesión" aria-label="Iniciar o pausar sesión">
                  ${ICONS_EXTRA.send}
                </button>
                <button class="btn btn--ghost btn--icon" style="width: 40px; height: 40px; border-radius: 50%;" data-action="session-reset" title="Reiniciar sesión" aria-label="Reiniciar sesión">
                  ${ICONS_EXTRA.monitor}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna derecha: Equipo y progreso -->
        <div class="widget-column">
          <div class="widget" style="flex: 1;">
            <div class="widget__header">
              <h3 class="widget__title">Team collaboration</h3>
              <button class="btn btn--ghost btn--sm" data-action="add-member">Add member</button>
            </div>
            <div class="widget__content" style="padding: var(--space-lg);" data-members-list></div>
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
                  <div style="font-size: var(--font-size-xl); font-weight: 700;" data-progress-percent>41%</div>
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

    this.renderMembers();
    this.bindWidgetEvents();
    this.subscribeToChanges();

    return this.element;
  }

  // ============================================
  // EVENTOS DE LOS WIDGETS
  // ============================================

  bindWidgetEvents() {
    // "New" (Projects) -> flujo de nueva tarea (main.js navega a Tareas y abre el modal)
    this.element.querySelector('[data-action="new-project"]')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('app:add-task'));
    });

    // "Add member" (Team collaboration)
    this.element.querySelector('[data-action="add-member"]')?.addEventListener('click', () => this.addMember());

    // Temporizador de sesión
    this.element.querySelectorAll('[data-action="session-toggle"]').forEach(btn => {
      btn.addEventListener('click', () => this.toggleSession());
    });
    this.element.querySelector('[data-action="session-reset"]')?.addEventListener('click', () => this.resetSession());
    this.element.querySelector('[data-action="session-save"]')?.addEventListener('click', () => this.saveSessionAsNote());

    // Empty state de metas: "Nueva meta" -> evento global (main.js abre el modal)
    this.element.querySelector('[data-action="add-goal"]')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('app:add-goal'));
    });
  }

  // ============================================
  // TEMPORIZADOR DE SESIÓN ("In session")
  // ============================================

  toggleSession() {
    this.sessionRunning = !this.sessionRunning;

    // Icono del botón redondo del timer
    const toggleBtn = this.element.querySelector('[data-action="session-toggle"]:not(.btn--block)');
    if (toggleBtn) {
      toggleBtn.innerHTML = this.sessionRunning ? ICONS_EXTRA.pause : ICONS_EXTRA.send;
      toggleBtn.title = this.sessionRunning ? 'Pausar sesión' : 'Iniciar sesión';
    }

    // Botón "Start meeting" del widget Up next
    const startBtn = this.element.querySelector('button.btn--block[data-action="session-toggle"]');
    if (startBtn) startBtn.textContent = this.sessionRunning ? 'Pause meeting' : 'Start meeting';

    if (this.sessionRunning) {
      this.sessionInterval = setInterval(() => {
        this.sessionSeconds++;
        this.updateSessionDisplay();
      }, 1000);
    } else {
      clearInterval(this.sessionInterval);
      this.sessionInterval = null;
    }
  }

  resetSession() {
    this.sessionRunning = false;
    clearInterval(this.sessionInterval);
    this.sessionInterval = null;
    this.sessionSeconds = 0;
    this.updateSessionDisplay();

    const toggleBtn = this.element.querySelector('[data-action="session-toggle"]:not(.btn--block)');
    if (toggleBtn) {
      toggleBtn.innerHTML = ICONS_EXTRA.send;
      toggleBtn.title = 'Iniciar sesión';
    }
    const startBtn = this.element.querySelector('button.btn--block[data-action="session-toggle"]');
    if (startBtn) startBtn.textContent = 'Start meeting';
  }

  saveSessionAsNote() {
    const formatted = this.formatSession(this.sessionSeconds);
    const now = new Date();
    this.db.notes.create({
      title: `Sesión de trabajo (${formatted})`,
      content: `Sesión registrada el ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.\n\nDuración: **${formatted}**`
    });

    // Feedback visual: el botón + muestra un check unos instantes
    const saveBtn = this.element.querySelector('[data-action="session-save"]');
    if (saveBtn) {
      const original = saveBtn.innerHTML;
      saveBtn.innerHTML = ICONS_EXTRA.checkCircle;
      saveBtn.title = '¡Sesión guardada en Notas!';
      setTimeout(() => {
        saveBtn.innerHTML = original;
        saveBtn.title = 'Registrar sesión como nota';
      }, 2000);
    }
  }

  updateSessionDisplay() {
    const el = this.element.querySelector('[data-session-time]');
    if (el) el.textContent = this.formatSession(this.sessionSeconds);
  }

  formatSession(totalSeconds) {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  // ============================================
  // WIDGET "TEAM COLLABORATION"
  // ============================================

  renderMembers() {
    const container = this.element.querySelector('[data-members-list]');
    if (!container) return;

    container.innerHTML = this.members.map((member, i) => `
      <div style="display: flex; align-items: center; gap: var(--space-sm); ${i < this.members.length - 1 ? 'margin-bottom: var(--space-md);' : ''}">
        <span style="width: 32px; height: 32px; border-radius: 50%; background: ${member.color}; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600; color: white;">${member.name.charAt(0)}</span>
        <div style="flex: 1;">
          <div style="font-size: var(--font-size-sm); font-weight: 600;">${this.escapeHtml(member.name)}</div>
          <div style="font-size: var(--font-size-xs); color: var(--text-muted);">${this.escapeHtml(member.role)}</div>
        </div>
        <span class="badge ${member.badgeClass}">${member.badge}</span>
      </div>
    `).join('');
  }

  addMember() {
    const n = this.members.length + 1;
    this.members.push({
      name: `Nuevo miembro ${n}`,
      role: 'Sin asignar',
      badge: MEMBER_BADGES[0],
      badgeClass: MEMBER_BADGE_CLASSES[0],
      color: MEMBER_COLORS[this.members.length % MEMBER_COLORS.length]
    });
    this.renderMembers();
  }

  // ============================================
  // ESTADÍSTICAS EN VIVO
  // ============================================

  subscribeToChanges() {
    const refresh = () => this.updateStats();
    this.unsubscribers.push(
      this.db.tasks.subscribe(refresh),
      this.db.notes.subscribe(refresh),
      this.db.goals.subscribe(refresh)
    );
  }

  updateStats() {
    if (!this.element) return;
    const tasks = this.db.tasks.getStats();
    const notes = this.db.notes.getStats();
    const goals = this.db.goals.getStats();

    const set = (key, value) => {
      const el = this.element.querySelector(`[data-stat="${key}"]`);
      if (el) el.textContent = value;
    };

    set('tasks-total', tasks.total);
    set('tasks-sub', `${tasks.completed} completadas · ${tasks.active} activas`);
    set('notes-total', notes.total);
    set('notes-sub', `${notes.pinned} fijadas`);
    set('goals-total', goals.total);
    set('goals-sub', `${goals.completedToday}/${goals.daily} hoy`);
    set('overdue', tasks.overdue);
    set('overdue-sub', `${tasks.highPriority} alta prioridad`);

    // Progreso global real para el donut "Project progress"
    const tasksProgress = tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0;
    const goalsProgress = goals.daily > 0 ? (goals.completedToday / goals.daily) * 100 : 0;
    const notesProgress = Math.min((notes.total / 10) * 100, 100);
    const percent = Math.min(Math.max(Math.round(tasksProgress * 0.4 + goalsProgress * 0.4 + notesProgress * 0.2), 0), 100);

    const percentEl = this.element.querySelector('[data-progress-percent]');
    if (percentEl) percentEl.textContent = `${percent}%`;
    const ring = this.element.querySelector('.widget [stroke-dasharray="314"]');
    if (ring) ring.setAttribute('stroke-dashoffset', String(Math.round(314 - (314 * percent) / 100)));
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
    clearInterval(this.sessionInterval);
    this.sessionInterval = null;
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.element = null;
  }
}

export default DashboardView;
