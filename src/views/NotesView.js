/**
 * NotesView - Vista expandida de notas (pantalla completa con editor split)
 * Usa NoteEditor y NoteCard components
 */

import { db } from '../store/index.js';
import { formatRelativeDate } from '../utils/date.js';
import { nanoid } from '../utils/id.js';
import { ICONS } from '../components/Header/Header.js';
import { NoteEditor } from '../components/Notes/NoteEditor.js';
import { NoteCard } from '../components/Notes/NoteCard.js';

const ICONS_EXTRA = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  filter: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>'
};

export class NotesView {
  constructor({ db: store, onNavigate }) {
    this.db = store;
    this.onNavigate = onNavigate;
    this.searchQuery = '';
    this.selectedNoteId = null;
    this.showPinnedOnly = false;
    this.activeTag = null;
    this.unsubscribers = [];
    this.element = null;
    this.editorInstance = null;
  }
  
  render() {
    this.element = document.createElement('section');
    this.element.className = 'view notes-view';
    this.element.innerHTML = this.renderTemplate();
    
    this.bindEvents();
    this.subscribeToChanges();
    
    return this.element;
  }
  
  renderTemplate() {
    const stats = this.db.notes.getStats();
    const allTags = this.db.notes.getAllTags();
    const notes = this.getFilteredNotes();
    const selectedNote = this.selectedNoteId ? this.db.notes.getById(this.selectedNoteId) : null;
    
    return `
      <header class="view__header" style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg); border-bottom: 1px solid var(--color-border); flex-shrink: 0; flex-wrap: wrap; gap: var(--space-md);">
        <div class="view__title-group">
          <h1 class="view__title" style="display: flex; align-items: center; gap: var(--space-sm); margin: 0; font-size: var(--font-size-2xl);">${ICONS.fileText} Notas</h1>
          <span class="view__count" style="color: var(--color-fg-muted); font-size: var(--font-size-lg); font-weight: 400;">${stats.total} notas · ${stats.pinned} fijadas</span>
        </div>
        <button class="btn btn--primary" data-action="add-note" style="display: flex; align-items: center; gap: var(--space-sm);">
          ${ICONS_EXTRA.plus} Nueva nota
        </button>
      </header>
      
      <div class="view__toolbar" style="display: flex; flex-wrap: wrap; gap: var(--space-md); padding: var(--space-sm) var(--space-lg); border-bottom: 1px solid var(--color-border); background: var(--color-bg); flex-shrink: 0;">
        <!-- Búsqueda -->
        <div class="toolbar__search" style="flex: 1; min-width: 250px; position: relative;">
          <label class="search-input-wrapper" style="width: 100%;">
            ${ICONS_EXTRA.filter}
            <input type="search" class="form-input" placeholder="Buscar en notas..." data-search aria-label="Buscar notas" value="${escapeHtml(this.searchQuery)}" style="width: 100%;">
          </label>
        </div>
        
        <!-- Filtros rápidos -->
        <div class="toolbar__filters" style="display: flex; flex-wrap: wrap; gap: var(--space-sm); align-items: center;">
          <button class="btn btn--ghost btn--sm ${this.showPinnedOnly ? 'btn--primary' : ''}" data-filter-pinned>
            ${ICONS.pin || '📌'} Fijadas
          </button>
          ${allTags.slice(0, 5).map(tag => `
            <button class="btn btn--ghost btn--sm ${this.activeTag === tag ? 'btn--primary' : ''}" data-filter-tag="${tag}">
              ${ICONS_EXTRA.tag || '#'} ${tag}
            </button>
          `).join('')}
          ${allTags.length > 5 ? `
            <button class="btn btn--ghost btn--sm" data-all-tags>+${allTags.length - 5} más</button>
          ` : ''}
          <button class="btn btn--ghost btn--sm" data-clear-filters>Limpiar</button>
        </div>
      </div>
      
      <div class="view__content" style="display: flex; flex: 1; overflow: hidden; min-height: 0;">
        <!-- Panel lista (sidebar) -->
        <aside class="notes-sidebar" style="width: 350px; max-width: 40%; min-width: 280px; border-right: 1px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;">
          <div class="notes-list" style="flex: 1; overflow: auto; padding: var(--space-sm);" data-notes-list>
            ${notes.length === 0 ? this.renderEmptyNotes() : this.renderNotesList(notes)}
          </div>
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
    return notes.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }
  
  renderNotesList(notes) {
    return notes.map(note => {
      const card = NoteCard({
        note,
        onSelect: (id) => this.selectNote(id),
        onPin: (id) => this.db.notes.togglePin(id),
        onEdit: (note) => this.openEditor(note),
        onDelete: (id) => this.db.notes.remove(id),
        onDuplicate: (id) => this.db.notes.duplicate(id)
      });
      return card.outerHTML;
    }).join('');
  }
  
  renderEmptyNotes() {
    return `
      <div class="empty-state" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-lg); text-align: center;">
        <div class="empty-state__icon">${ICONS.fileText}</div>
        <h3 class="empty-state__title" style="margin: var(--space-sm) 0;">${this.searchQuery || this.activeTag ? 'Sin resultados' : 'Sin notas'}</h3>
        <p class="empty-state__description" style="font-size: var(--font-size-sm); max-width: 280px;">
          ${this.searchQuery ? 'No se encontraron notas con ese término' : this.activeTag ? `Sin notas con tag "${this.activeTag}"` : 'Crea tu primera nota en Markdown'}
        </p>
        <button class="btn btn--primary empty-state__action" data-action="add-note" style="margin-top: var(--space-md);">${ICONS_EXTRA.plus} Nueva nota</button>
      </div>
    `;
  }
  
  renderWelcome() {
    return `
      <div class="editor-welcome" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-2xl); text-align: center; color: var(--color-fg-muted);">
        <div class="empty-state__icon" style="margin-bottom: var(--space-lg);">${ICONS.fileText}</div>
        <h2 style="font-size: var(--font-size-2xl); color: var(--color-fg); margin-bottom: var(--space-sm);">Bienvenido al editor</h2>
        <p style="max-width: 400px; line-height: var(--line-height-relaxed); margin-bottom: var(--space-lg);">
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
      // TODO: Modal con todos los tags
    });
    
    // Renderizar editor si hay nota seleccionada
    if (this.selectedNoteId) {
      this.openEditor(this.db.notes.getById(this.selectedNoteId));
    }
  }
  
  refreshToolbar() {
    const toolbar = this.element.querySelector('.toolbar__filters');
    if (toolbar) {
      const allTags = this.db.notes.getAllTags();
      toolbar.innerHTML = `
        <button class="btn btn--ghost btn--sm ${this.showPinnedOnly ? 'btn--primary' : ''}" data-filter-pinned>
          ${ICONS.pin || '📌'} Fijadas
        </button>
        ${allTags.slice(0, 5).map(tag => `
          <button class="btn btn--ghost btn--sm ${this.activeTag === tag ? 'btn--primary' : ''}" data-filter-tag="${tag}">
            ${ICONS_EXTRA.tag || '#'} ${tag}
          </button>
        `).join('')}
        ${allTags.length > 5 ? `<button class="btn btn--ghost btn--sm" data-all-tags>+${allTags.length - 5} más</button>` : ''}
        <button class="btn btn--ghost btn--sm" data-clear-filters>Limpiar</button>
      `;
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
  }
  
  refreshList() {
    const listContainer = this.element.querySelector('[data-notes-list]');
    if (listContainer) {
      const notes = this.getFilteredNotes();
      listContainer.innerHTML = notes.length === 0 ? this.renderEmptyNotes() : this.renderNotesList(notes);
      // Re-bind events para nuevas tarjetas
      listContainer.querySelectorAll('[data-note-id]').forEach(card => {
        const id = card.dataset.noteId;
        card.addEventListener('click', (e) => {
          if (e.target.closest('[data-edit], [data-duplicate], [data-delete], .badge--primary')) return;
          this.selectNote(id);
        });
        // Re-bind action buttons
        card.querySelector('[data-edit]')?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openEditor(this.db.notes.getById(id));
        });
        card.querySelector('[data-duplicate]')?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.db.notes.duplicate(id);
        });
        card.querySelector('[data-delete]')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('¿Eliminar esta nota?')) this.db.notes.remove(id);
        });
        card.querySelector('.badge--primary')?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.db.notes.togglePin(id);
        });
      });
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
        this.selectedNoteId = null;
        this.editorInstance = null;
        container.innerHTML = this.renderWelcome();
        this.refreshList(); // Actualizar lista por si cambió título
      },
      onDelete: () => {
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
        // Si la nota seleccionada fue eliminada, limpiar selección
        if (this.selectedNoteId && !this.db.notes.getById(this.selectedNoteId)) {
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default NotesView;
