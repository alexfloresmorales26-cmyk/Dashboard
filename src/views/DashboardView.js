/**
 * DashboardView - Vista Inicio
 * La composición del comp aprobado (mundo monocromo): titular con fecha y
 * conteos reales, franja de métricas de cuatro cifras tabulares, y tres
 * columnas de líneas finas: Tareas de hoy, Metas + Notas, Sesión.
 * Solo datos reales del store; nada de contenido ficticio.
 */

const ICONS = {
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="8 5 19 12 8 19 8 5"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
};

const PRIORITY_LABELS = { low: 'baja', med: 'media', high: 'alta' };

export class DashboardView {
  constructor({ db: store }) {
    this.db = store;
    this.unsubscribers = [];

    // Temporizador de sesión
    this.sessionSeconds = 0;
    this.sessionRunning = false;
    this.sessionInterval = null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'dash';
    this.element.innerHTML = `
      <div class="dash__head">
        <div>
          <h1 class="dash__title">Lo de hoy</h1>
          <p class="dash__sub" data-dash-sub></p>
        </div>
        <button class="btn btn--primary" data-action="new-task">+ Nueva tarea</button>
      </div>

      <div class="dash__board">
        <div class="dash__strip" data-metrics></div>
        <div class="dash__cols">
          <section class="dash__cell" data-cell-tasks>
            <h2 class="dash__h2">Tareas de hoy</h2>
            <div data-tasks-list></div>
          </section>
          <section class="dash__cell">
            <h2 class="dash__h2" data-goals-heading>Metas</h2>
            <div data-goals-list></div>
            <h2 class="dash__h2 dash__h2--gap">Notas</h2>
            <div data-notes-list></div>
          </section>
          <section class="dash__cell">
            <h2 class="dash__h2">Sesión</h2>
            <div class="timer__time" data-session-time>00:00:00</div>
            <p class="timer__sub">00:00 – 02:00 · hoy</p>
            <div class="timer__controls">
              <button class="btn btn--ghost btn--icon timer__btn" data-action="session-save" title="Registrar sesión como nota" aria-label="Registrar sesión como nota">${ICONS.plus}</button>
              <button class="btn btn--primary btn--icon timer__btn" data-action="session-toggle" title="Iniciar sesión" aria-label="Iniciar o pausar sesión">${ICONS.play}</button>
              <button class="btn btn--ghost btn--icon timer__btn" data-action="session-reset" title="Reiniciar sesión" aria-label="Reiniciar sesión">${ICONS.reset}</button>
            </div>
          </section>
        </div>
      </div>
    `;

    this.bindEvents();
    this.refresh();
    this.subscribeToChanges();

    return this.element;
  }

  // ============================================
  // RENDER DE DATOS
  // ============================================

  refresh() {
    if (!this.element) return;
    const tasks = this.db.tasks.getStats();
    const notes = this.db.notes.getStats();
    const goals = this.db.goals.getStats();

    this.renderSubline(tasks, notes, goals);
    this.renderMetrics(tasks, notes, goals);
    this.renderTasks();
    this.renderGoals();
    this.renderNotes();
  }

  renderSubline(tasks, notes, goals) {
    const el = this.element.querySelector('[data-dash-sub]');
    if (!el) return;
    const now = new Date();
    const fecha = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    el.textContent = `${fecha} · ${tasks.total} ${tasks.total === 1 ? 'tarea' : 'tareas'} · ${notes.total} ${notes.total === 1 ? 'nota' : 'notas'} · ${goals.total} ${goals.total === 1 ? 'meta' : 'metas'} · ${tasks.overdue} vencidas`;
  }

  renderMetrics(tasks, notes, goals) {
    const el = this.element.querySelector('[data-metrics]');
    if (!el) return;
    const goalsLabel = goals.total === 1 ? 'Meta' : 'Metas';
    el.innerHTML = `
      <div class="metric">
        <div class="metric__n">${tasks.total}</div>
        <div class="metric__l">Tareas totales</div>
      </div>
      <div class="metric">
        <div class="metric__n">${notes.total}</div>
        <div class="metric__l">Notas</div>
      </div>
      <div class="metric">
        <div class="metric__n">${goals.total}</div>
        <div class="metric__l">${goalsLabel} · ${goals.completedToday}/${goals.daily} hoy</div>
      </div>
      <div class="metric">
        <div class="metric__n">${tasks.overdue}</div>
        <div class="metric__l">Vencidas</div>
      </div>
    `;
  }

  renderTasks() {
    const el = this.element.querySelector('[data-tasks-list]');
    if (!el) return;
    const all = [...this.db.tasks.getAll()]
      .sort((a, b) => (a.completed - b.completed) || (a.order - b.order));

    if (all.length === 0) {
      el.innerHTML = '<p class="dash__empty">Nada pendiente para hoy.</p>';
      return;
    }

    el.innerHTML = all.map(task => {
      const meta = task.completed
        ? this.relativeDay(task.updatedAt)
        : (PRIORITY_LABELS[task.priority] || 'media');
      return `
        <div class="dash__row ${task.completed ? 'dash__row--done' : ''}">
          <button class="task-check" data-toggle-task="${task.id}"
                  role="checkbox" aria-checked="${task.completed}"
                  aria-label="${task.completed ? 'Marcar como pendiente' : 'Marcar como hecha'}">${ICONS.check}</button>
          <span class="dash__row-main" title="${this.escapeAttr(task.title)}">${this.escapeHtml(task.title)}</span>
          <span class="dash__row-meta">${meta}</span>
        </div>
      `;
    }).join('');

    el.querySelectorAll('[data-toggle-task]').forEach(btn => {
      btn.addEventListener('click', () => this.db.tasks.toggleComplete(btn.dataset.toggleTask));
    });
  }

  renderGoals() {
    const el = this.element.querySelector('[data-goals-list]');
    const heading = this.element.querySelector('[data-goals-heading]');
    if (!el) return;
    const goals = this.db.goals.getToday();
    const stats = this.db.goals.getStats();

    if (heading) {
      heading.textContent = stats.daily > 0 || stats.total > 0
        ? `Metas · ${stats.completedToday}/${stats.daily} hoy`
        : 'Metas';
    }

    if (goals.length === 0) {
      el.innerHTML = '<p class="dash__empty">Sin metas todavía.</p>';
      return;
    }

    el.innerHTML = goals.map(goal => `
      <div class="dash__row dash__row--goal">
        <span class="dash__row-main" style="font-weight: 600;">${this.escapeHtml(goal.title)}</span>
        <span class="dash__row-meta">${goal.current}/${goal.target} ${this.escapeHtml(goal.unit)}</span>
        <div class="goal-bar">
          <div class="goal-bar__fill" style="width: ${goal.progress}%;"></div>
        </div>
        <p class="goal-note">Racha: ${goal.streak} ${goal.streak === 1 ? 'día' : 'días'}</p>
      </div>
    `).join('');
  }

  renderNotes() {
    const el = this.element.querySelector('[data-notes-list]');
    if (!el) return;
    const notes = [...this.db.notes.getAll()]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 3);

    if (notes.length === 0) {
      el.innerHTML = '<p class="dash__empty">Sin notas todavía.</p>';
      return;
    }

    el.innerHTML = notes.map(note => {
      const preview = this.firstLine(note.content);
      return `
        <a class="dash__row dash__row--note" href="#notes/${note.id}">
          <span style="min-width: 0;">
            <span class="dash__row-main" style="font-weight: 600; color: var(--ink);">${this.escapeHtml(note.title)}</span>
            ${preview ? `<span class="dash__row-main dash__row-note-preview">${this.escapeHtml(preview)}</span>` : ''}
          </span>
        </a>
      `;
    }).join('');
  }

  // ============================================
  // SESIÓN
  // ============================================

  toggleSession() {
    this.sessionRunning = !this.sessionRunning;
    const toggleBtn = this.element.querySelector('[data-action="session-toggle"]');
    if (toggleBtn) {
      toggleBtn.innerHTML = this.sessionRunning ? ICONS.pause : ICONS.play;
      toggleBtn.title = this.sessionRunning ? 'Pausar sesión' : 'Iniciar sesión';
    }
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
    const toggleBtn = this.element.querySelector('[data-action="session-toggle"]');
    if (toggleBtn) {
      toggleBtn.innerHTML = ICONS.play;
      toggleBtn.title = 'Iniciar sesión';
    }
  }

  saveSessionAsNote() {
    const formatted = this.formatSession(this.sessionSeconds);
    const now = new Date();
    this.db.notes.create({
      title: `Sesión de trabajo (${formatted})`,
      content: `Sesión registrada el ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.\n\nDuración: **${formatted}**`
    });

    // Feedback: el botón + muestra un check unos instantes
    const saveBtn = this.element.querySelector('[data-action="session-save"]');
    if (saveBtn) {
      const original = saveBtn.innerHTML;
      saveBtn.innerHTML = ICONS.check;
      saveBtn.title = '¡Sesión guardada en Notas!';
      setTimeout(() => {
        if (saveBtn.isConnected) {
          saveBtn.innerHTML = original;
          saveBtn.title = 'Registrar sesión como nota';
        }
      }, 2000);
    }
  }

  updateSessionDisplay() {
    const el = this.element?.querySelector('[data-session-time]');
    if (el) el.textContent = this.formatSession(this.sessionSeconds);
  }

  formatSession(totalSeconds) {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  // ============================================
  // EVENTOS Y SUSCRIPCIONES
  // ============================================

  bindEvents() {
    this.element.querySelector('[data-action="new-task"]')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('app:add-task'));
    });
    this.element.querySelector('[data-action="session-toggle"]')?.addEventListener('click', () => this.toggleSession());
    this.element.querySelector('[data-action="session-reset"]')?.addEventListener('click', () => this.resetSession());
    this.element.querySelector('[data-action="session-save"]')?.addEventListener('click', () => this.saveSessionAsNote());
  }

  subscribeToChanges() {
    const refresh = () => this.refresh();
    this.unsubscribers.push(
      this.db.tasks.subscribe(refresh),
      this.db.notes.subscribe(refresh),
      this.db.goals.subscribe(refresh)
    );
  }

  // ============================================
  // UTILIDADES
  // ============================================

  relativeDay(iso) {
    const d = new Date(iso);
    const today = new Date();
    const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0)) / 86400000);
    if (diff === 0) return 'hoy';
    if (diff === -1) return 'ayer';
    if (diff < -1 && diff >= -7) return `hace ${Math.abs(diff)} días`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  firstLine(markdown) {
    if (!markdown) return '';
    const line = markdown
      .split('\n')
      .map(l => l.trim())
      .find(l => l && !l.startsWith('#')) || '';
    // Vista previa en texto plano: sin marcas de énfasis ni enlace
    return line
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
  }

  escapeAttr(text) {
    return this.escapeHtml(text).replace(/"/g, '&quot;');
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
