/**
 * NotesView - Vista expandida de notas (pantalla completa con editor split)
 * Usa NoteEditor y NoteCard components
 */

import { ICONS } from '../components/Header/Header.js';
import { NoteEditor } from '../components/Notes/NoteEditor.js';
import { NoteCard } from '../components/Notes/NoteCard.js';
import { escapeHtml, escapeAttr } from '../utils/html.js';

const ICONS_EXTRA = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  filter: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>'
};

export class NotesView {
  constructor({ db: store, onNavigate, param }) {
    this.db = store;
    this.onNavigate = onNavigate;
    this.searchQuery = '';
    // Permite abrir directamente una nota vía la ruta notes/<id>
    this.selectedNoteId = param || null;
    this.showPinnedOnly = false;
    this.showAllTags = false;
    this.activeTag = null;
    this.unsubscribers = [];
    this.element = null;
    this.editorInstance = null;
    this.tagsSignature = '';
  }
  
  render() {
    this.element = document.createElement('section');
    this.element.className = 'view notes-view';
    this.element.innerHTML = this.renderTemplate();
    this.tagsSignature = this.db.notes.getAllTags().join('\u0000');
    
    // Llenar la lista de notas con elementos reales (conserva listeners)
    const listContainer = this.element.querySelector('[data-notes-list]');
    if (listContainer) this.appendNotesList(listContainer, this.getFilteredNotes());
    
    this.bindEvents();
    this.subscribeToChanges();
    
    return this.element;
  }
  
  renderTemplate() {
    const stats = this.db.notes.getStats();
    const allTags = this.db.notes.getAllTags();
    const selectedNote = this.selectedNoteId ? this.db.notes.getById(this.selectedNoteId) : null;
    
    return `
      <header class="view__header" style="display: flex; align-items: center; justify-content: space-between; padding: var(--s-6); border-bottom: 1px solid var(--line); flex-shrink: 0; flex-wrap: wrap; gap: var(--s-4);">
        <div class="view__title-group">
          <h1 class="view__title" style="display: flex; align-items: center; gap: var(--s-2); margin: 0; font-size: var(--text-lg);">${ICONS.fileText} Notas</h1>
          <span class="view__count" data-view-count style="color: var(--ink-2); font-size: var(--text-lg); font-weight: 400;">${stats.total} notas · ${stats.pinned} fijadas</span>
        </div>
        <button class="btn btn--primary" data-action="add-note" style="display: flex; align-items: center; gap: var(--s-2);">
          ${ICONS_EXTRA.plus} Nueva nota
        </button>
      </header>
      
      <div class="view__toolbar" style="display: flex; flex-wrap: wrap; gap: var(--s-4); padding: var(--s-2) var(--s-6); border-bottom: 1px solid var(--line); background: var(--bg); flex-shrink: 0;">
        <!-- Búsqueda -->
        <div class="toolbar__search" style="flex: 1; min-width: 250px; position: relative;">
          <label class="search-input-wrapper" style="width: 100%;">
            ${ICONS_EXTRA.filter}
            <input type="search" class="form-input" placeholder="Buscar en notas..." data-search aria-label="Buscar notas" value="${escapeAttr(this.searchQuery)}" style="width: 100%;">
          </label>
        </div>
        
        <!-- Filtros rápidos -->
        <div class="toolbar__filters" style="display: flex; flex-wrap: wrap; gap: var(--s-2); align-items: center;">
          ${this.renderFiltersHtml(allTags)}
        </div>
      </div>
      
      <div class="view__content" style="display: flex; flex: 1; overflow: hidden; min-height: 0;">
        <!-- Panel lista (sidebar) -->
        <aside class="notes-sidebar" style="width: 350px; max-width: 40%; min-width: 280px; border-right: 1px solid var(--line); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;">
          <div class="notes-list" style="flex: 1; overflow: auto; padding: var(--s-2);" data-notes-list></div>
        </aside>
        
        <!-- Panel editor/preview -->
        <main class="notes-editor" style="flex: 1; display: flex; flex-direction: column; min-width: 0;" data-editor-container>
          ${selectedNote ? '' : this.renderWelcome()}
        </main>
      </div>
    `;
  }
  
  getFilteredNotes() {
    let notes = this.db.notes.search(this.searchQuery);
    
    if (this.showPinnedOnly) {
      notes = notes.filter(n => n.isPinned);
    }
    
    if (this.activeTag) {
      notes = notes.filter(n => n.tags.includes(this.activeTag));
    }
    
    // Ordenar: fijadas primero, luego por fecha actualización desc
    // (copia: notes puede ser el array del store y sort() lo mutaría)
    return [...notes].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }
  
  renderNotesList(notes) {
    // Devuelve los ELEMENTOS NoteCard (no HTML strings) para conservar los
    // listeners de seleccionar/editar/duplicar/eliminar/pin
    return notes.map(note => NoteCard({
      note,
      onSelect: (id) => this.selectNote(id),
      onPin: (id) => this.db.notes.togglePin(id),
      onEdit: (note) => this.openEditor(note),
      onDelete: (id) => this.db.notes.remove(id),
      onDuplicate: (id) => this.db.notes.duplicate(id)
    }));
  }
  
  appendNotesList(container, notes) {
    container.innerHTML = notes.length === 0 ? this.renderEmptyNotes() : '';
    this.renderNotesList(notes).forEach(card => container.appendChild(card));
  }
  
  renderEmptyNotes() {
    return `
      <div class="empty-state" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--s-6); text-align: center;">
        <div class="empty-state__icon">${ICONS.fileText}</div>
        <h3 class="empty-state__title" style="margin: var(--s-2) 0;">${this.searchQuery || this.activeTag ? 'Sin resultados' : 'Sin notas'}</h3>
        <p class="empty-state__description" style="font-size: var(--text-sm); max-width: 280px;">
          ${this.searchQuery ? 'No se encontraron notas con ese término' : this.activeTag ? `Sin notas con tag "${escapeHtml(this.activeTag)}"` : 'Crea tu primera nota en Markdown'}
        </p>
        <button class="btn btn--primary empty-state__action" data-action="add-note" style="margin-top: var(--s-4);">${ICONS_EXTRA.plus} Nueva nota</button>
      </div>
    `;
  }
  
  renderWelcome() {
    return `
      <div class="editor-welcome" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--s-9); text-align: center; color: var(--ink-2);">
        <div class="empty-state__icon" style="margin-bottom: var(--s-6);">${ICONS.fileText}</div>
        <h2 style="font-size: var(--text-lg); color: var(--ink); margin-bottom: var(--s-2);">Bienvenido al editor</h2>
        <p style="max-width: 400px; line-height: var(--leading-snug); margin-bottom: var(--s-6);">
          Selecciona una nota de la lista o crea una nueva para empezar a escribir en Markdown con vista previa en tiempo real.
        </p>
        <button class="btn btn--primary" data-action="add-note">${ICONS_EXTRA.plus} Crear primera nota</button>
      </div>
    `;
  }
  
  bindEvents() {
    if (!this.element) return;
    
    // Nueva nota
    this.element.querySelectorAll('[data-action="add-note"]').forEach(btn => {
      btn.addEventListener('click', () => this.createNote());
    });
    
    // Búsqueda
    const searchInput = this.element.querySelector('[data-search]');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.searchQuery = e.target.value;
          this.refreshList();
        }, 200);
      });
    }
    
    // Filtros
    this.element.querySelector('[data-filter-pinned]')?.addEventListener('click', () => {
      this.showPinnedOnly = !this.showPinnedOnly;
      this.refreshToolbar();
      this.refreshList();
    });
    
    this.element.querySelectorAll('[data-filter-tag]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.filterTag;
        this.activeTag = this.activeTag === tag ? null : tag;
        this.refreshToolbar();
        this.refreshList();
      });
    });
    
    this.element.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
      this.searchQuery = '';
      this.showPinnedOnly = false;
      this.activeTag = null;
      const searchInput = this.element.querySelector('[data-search]');
      if (searchInput) searchInput.value = '';
      this.refreshToolbar();
      this.refreshList();
    });
    
    this.element.querySelector('[data-all-tags]')?.addEventListener('click', () => {
      this.showAllTags = !this.showAllTags;
      this.refreshToolbar();
    });
    
    // Renderizar editor si hay nota seleccionada
    if (this.selectedNoteId) {
      this.openEditor(this.db.notes.getById(this.selectedNoteId));
    }
  }
  
  renderFiltersHtml(allTags) {
    const visibleTags = this.showAllTags ? allTags : allTags.slice(0, 5);
    const hiddenCount = allTags.length - 5;
    return `
      <button class="btn btn--ghost btn--sm ${this.showPinnedOnly ? 'btn--primary' : ''}" data-filter-pinned>
        ${ICONS.pin || '📌'} Fijadas
      </button>
      ${visibleTags.map(tag => `
        <button class="btn btn--ghost btn--sm ${this.activeTag === tag ? 'btn--primary' : ''}" data-filter-tag="${escapeAttr(tag)}">
          ${ICONS_EXTRA.tag || '#'} ${escapeHtml(tag)}
        </button>
      `).join('')}
      ${allTags.length > 5 ? `
        <button class="btn btn--ghost btn--sm" data-all-tags>
          ${this.showAllTags ? '− Menos' : `+${hiddenCount} más`}
        </button>
      ` : ''}
      <button class="btn btn--ghost btn--sm" data-clear-filters>Limpiar</button>
    `;
  }
  
  updateStats() {
    const stats = this.db.notes.getStats();
    const count = this.element?.querySelector('[data-view-count]');
    if (count) count.textContent = `${stats.total} notas · ${stats.pinned} fijadas`;
  }

  refreshToolbar() {
    const toolbar = this.element.querySelector('.toolbar__filters');
    if (toolbar) {
      toolbar.innerHTML = this.renderFiltersHtml(this.db.notes.getAllTags());
      this.bindFilterEvents(toolbar);
    }
  }
  
  bindFilterEvents(container) {
    container.querySelector('[data-filter-pinned]')?.addEventListener('click', () => {
      this.showPinnedOnly = !this.showPinnedOnly;
      this.refreshToolbar();
      this.refreshList();
    });
    container.querySelectorAll('[data-filter-tag]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.filterTag;
        this.activeTag = this.activeTag === tag ? null : tag;
        this.refreshToolbar();
        this.refreshList();
      });
    });
    container.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
      this.searchQuery = '';
      this.showPinnedOnly = false;
      this.activeTag = null;
      const searchInput = this.element.querySelector('[data-search]');
      if (searchInput) searchInput.value = '';
      this.refreshToolbar();
      this.refreshList();
    });
    container.querySelector('[data-all-tags]')?.addEventListener('click', () => {
      this.showAllTags = !this.showAllTags;
      this.refreshToolbar();
    });
  }
  
  refreshList() {
    const listContainer = this.element.querySelector('[data-notes-list]');
    if (listContainer) {
      const notes = this.getFilteredNotes();
      this.appendNotesList(listContainer, notes);
      // Los listeners van dentro de cada NoteCard; no hace falta re-bind
    }
  }
  
  selectNote(id) {
    this.selectedNoteId = id;
    this.openEditor(this.db.notes.getById(id));
  }
  
  createNote() {
    const note = this.db.notes.create({ title: 'Nueva nota', content: '' });
    this.selectNote(note.id);
  }
  
  openEditor(note) {
    if (!note) return;
    
    this.selectedNoteId = note.id;
    const container = this.element.querySelector('[data-editor-container]');
    if (!container) return;
    
    // Limpiar editor anterior
    if (this.editorInstance) {
      this.editorInstance.destroy?.();
    }
    
    container.innerHTML = '';
    
    this.editorInstance = NoteEditor({
      note,
      onSave: (data) => this.db.notes.update(note.id, data),
      onClose: () => {
        this.editorInstance?.destroy?.();
        this.selectedNoteId = null;
        this.editorInstance = null;
        container.innerHTML = this.renderWelcome();
        this.refreshList(); // Actualizar lista por si cambió título
      },
      onDelete: () => {
        this.editorInstance?.destroy?.();
        this.db.notes.remove(note.id);
        this.selectedNoteId = null;
        this.editorInstance = null;
        container.innerHTML = this.renderWelcome();
        this.refreshList();
      },
      onDuplicate: () => {
        const newNote = this.db.notes.duplicate(note.id);
        this.selectNote(newNote.id);
      }
    });
    
    container.appendChild(this.editorInstance);
    this.refreshList(); // Actualizar selección visual
  }
  
  subscribeToChanges() {
    this.unsubscribers.push(
      this.db.notes.subscribe(() => {
        this.refreshList();
        this.updateStats();

        // El toolbar de tags solo se reconstruye si cambió el conjunto
        const tagsSignature = this.db.notes.getAllTags().join('\u0000');
        if (tagsSignature !== this.tagsSignature) {
          this.tagsSignature = tagsSignature;
          this.refreshToolbar();
        }

        // Si la nota seleccionada fue eliminada, limpiar selección
        if (this.selectedNoteId && !this.db.notes.getById(this.selectedNoteId)) {
          this.editorInstance?.destroy?.();
          this.selectedNoteId = null;
          this.editorInstance = null;
          const container = this.element?.querySelector('[data-editor-container]');
          if (container) container.innerHTML = this.renderWelcome();
        }
      })
    );
  }
  
  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    this.editorInstance?.destroy?.();
  }
}

export default NotesView;
