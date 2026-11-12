/**
 * NotesView - Vista expandida de notas (pantalla completa con editor split)
 */

import { db } from '../store/index.js';
import { formatRelativeDate } from '../utils/date.js';
import { nanoid } from '../utils/id.js';
import { ICONS } from '../components/Header/Header.js';
import { renderMarkdownSync, getFirstParagraph } from '../utils/markdown.js';

const ICONS_EXTRA = {
  plus: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  filter: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  pin: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 11a6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6-6"/></svg>',
  pinOff: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 11a6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6-6"/><line x1="2" y1="2" x2="22" y2="22"/></svg>',
  edit: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  delete: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  duplicate: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
};

export class NotesView {
  constructor({ db: store }) {
    this.db = store;
    this.searchQuery = '';
    this.selectedNoteId = null;
    this.unsubscribers = [];
    this.element = null;
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
    const notes = this.getFilteredNotes();
    const selectedNote = this.selectedNoteId ? this.db.notes.getById(this.selectedNoteId) : null;
    
    return `
      <header class="view__header">
        <div class="view__title-group">
          <h1 class="view__title">${ICONS.fileText} Notas</h1>
          <span class="view__count">${stats.total} notas · ${stats.pinned} fijadas</span>
        </div>
        <button class="btn btn--primary" data-action="add-note">
          ${ICONS_EXTRA.plus} Nueva nota
        </button>
      </header>
      
      <div class="view__toolbar">
        <div class="toolbar__search" style="flex: 1;">
          <label class="search-input-wrapper" style="width: 100%;">
            ${ICONS_EXTRA.filter}
            <input type="search" class="form-input" placeholder="Buscar en notas..." data-search aria-label="Buscar notas" value="${this.escapeHtml(this.searchQuery)}" style="width: 100%;">
          </label>
        </div>
      </div>
      
      <div class="view__content" style="display: flex; flex: 1; overflow: hidden;">
        <!-- Panel lista (sidebar) -->
        <aside class="notes-sidebar" style="width: 350px; max-width: 40%; min-width: 280px; border-right: 1px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden;">
          <div class="notes-list" style="flex: 1; overflow: auto; padding: var(--space-sm);">
            ${notes.length === 0 ? this.renderEmptyNotes() : this.renderNotesList(notes)}
          </div>
        </aside>
        
        <!-- Panel editor/preview -->
        <main class="notes-editor" style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
          ${selectedNote ? this.renderEditor(selectedNote) : this.renderWelcome()}
        </main>
      </div>
    `;
  }
  
  getFilteredNotes() {
    return this.db.notes.search(this.searchQuery);
  }
  
  renderNotesList(notes) {
    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-xs);">
        ${notes.map(note => this.renderNoteListItem(note)).join('')}
      </div>
    `;
  }
  
  renderNoteListItem(note) {
    const preview = getFirstParagraph(note.content, 100);
    const isSelected = note.id === this.selectedNoteId;
    const updated = formatRelativeDate(note.updatedAt);
    const tagsHtml = note.tags.slice(0, 2).map(tag => 
      `<span class="badge badge--neutral" style="font-size: 10px;">${this.escapeHtml(tag)}</span>`
    ).join(' ');
    
    return `
      <article class="card note-list-item ${isSelected ? 'note-list-item--selected' : ''}" 
               data-note-id="${note.id}" 
               style="cursor: pointer; padding: var(--space-sm); ${isSelected ? 'border-color: var(--color-primary); background: var(--color-primary-light);' : ''}">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-sm);">
          <div style="flex: 1; min-width: 0;">
            <h4 style="font-size: var(--font-size-sm); font-weight: 600; margin: 0 0 var(--space-xs); color: var(--color-fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${this.escapeHtml(note.title)}
              ${note.isPinned ? `<span class="badge badge--primary" style="font-size: 10px; margin-left: var(--space-xs);">${ICONS_EXTRA.pin}</span>` : ''}
            </h4>
            ${tagsHtml ? `<div style="margin-bottom: var(--space-xs);">${tagsHtml}</div>` : ''}
            <p style="font-size: var(--font-size-xs); color: var(--color-fg-muted); margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${this.escapeHtml(preview) || '<em style="color: var(--color-fg-subtle);">(vacía)</em>'}
            </p>
          </div>
          <div style="display: flex; gap: 2px; flex-shrink: 0;">
            <button class="btn btn--ghost btn--icon btn--sm" data-pin title="${note.isPinned ? 'Desfijar' : 'Fijar'}">${note.isPinned ? ICONS_EXTRA.pin : ICONS_EXTRA.pinOff}</button>
            <button class="btn btn--ghost btn--icon btn--sm" data-duplicate title="Duplicar">${ICONS_EXTRA.duplicate}</button>
            <button class="btn btn--ghost btn--icon btn--sm" data-delete title="Eliminar">${ICONS_EXTRA.delete}</button>
          </div>
        </div>
      </article>
    `;
  }
  
  renderEditor(note) {
    return `
      <div class="note-editor" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
        <div class="editor__header" style="padding: var(--space-md) var(--space-lg); border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); flex-shrink: 0;">
          <input type="text" class="form-input editor__title" value="${this.escapeHtml(note.title)}" placeholder="Título de la nota" data-edit-title style="flex: 1; max-width: 400px;">
          <div class="editor__tags" style="display: flex; align-items: center; gap: var(--space-sm);">
            <input type="text" class="form-input form-input--sm" placeholder="Tags (separados por comas)" value="${note.tags.join(', ')}" data-edit-tags style="width: 200px;">
            <label class="checkbox" style="font-size: var(--font-size-sm);">
              <input type="checkbox" class="checkbox__input" ${note.isPinned ? 'checked' : ''} data-toggle-pin>
              <span class="checkbox__box"></span>
              <span class="checkbox__label">Fijada</span>
            </label>
          </div>
        </div>
        
        <div class="editor__split" style="flex: 1; display: flex; min-height: 0; overflow: hidden;">
          <!-- Editor Markdown -->
          <div class="editor__pane editor__pane--edit" style="flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--color-border); min-width: 0;">
            <div class="editor__toolbar" style="padding: var(--space-sm) var(--space-md); border-bottom: 1px solid var(--color-border); display: flex; gap: var(--space-xs); flex-wrap: wrap;">
              <button class="btn btn--ghost btn--icon btn--sm" data-md-bold title="Negrita (Ctrl+B)" aria-label="Negrita"><strong>B</strong></button>
              <button class="btn btn--ghost btn--icon btn--sm" data-md-italic title="Cursiva (Ctrl+I)" aria-label="Cursiva"><em>I</em></button>
              <button class="btn btn--ghost btn--icon btn--sm" data-md-link title="Enlace (Ctrl+K)" aria-label="Enlace">🔗</button>
              <button class="btn btn--ghost btn--icon btn--sm" data-md-code title="Código inline" aria-label="Código"><code>{ }</code></button>
              <button class="btn btn--ghost btn--icon btn--sm" data-md-codeblock title="Bloque de código" aria-label="Bloque código">[ ]</button>
              <button class="btn btn--ghost btn--icon btn--sm" data-md-list title="Lista" aria-label="Lista">•</button>
              <button class="btn btn--ghost btn--icon btn--sm" data-md-ol title="Lista numerada" aria-label="Lista numerada">1.</button>
              <button class="btn btn--ghost btn--icon btn--sm" data-md-quote title="Cita" aria-label="Cita">"</button>
              <button class="btn btn--ghost btn--icon btn--sm" data-md-hr title="Línea horizontal" aria-label="Separador">—</button>
              <span style="flex: 1;"></span>
              <span class="editor__status" style="font-size: var(--font-size-xs); color: var(--color-fg-muted); padding: var(--space-xs) var(--space-sm);">Guardado</span>
            </div>
            <textarea class="editor__textarea" 
                      data-editor 
                      style="flex: 1; padding: var(--space-md); resize: none; font-family: var(--font-mono); font-size: var(--font-size-sm); line-height: var(--line-height-relaxed); background: var(--color-bg); color: var(--color-fg); border: none; outline: none;"
                      placeholder="Escribe en Markdown...${note.isPinned ? '' : ' (Ctrl+S para guardar)'}"
                      spellcheck="false">${this.escapeHtml(note.content)}</textarea>
          </div>
          
          <!-- Preview -->
          <div class="editor__pane editor__pane--preview" style="flex: 1; padding: var(--space-md); overflow: auto; min-width: 0; background: var(--color-bg-elevated);">
            <div class="editor__preview-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md); padding-bottom: var(--space-sm); border-bottom: 1px solid var(--color-border);">
              <h3 style="font-size: var(--font-size-sm); font-weight: 600; color: var(--color-fg-muted);">Vista previa</h3>
            </div>
            <div class="editor__preview" data-preview style="min-height: 200px;">
              ${renderMarkdownSync(note.content)}
            </div>
          </div>
        </div>
        
        <div class="editor__footer" style="padding: var(--space-md) var(--space-lg); border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: var(--space-sm); flex-shrink: 0;">
          <button class="btn btn--danger btn--sm" data-delete-note>${ICONS_EXTRA.delete} Eliminar</button>
          <button class="btn btn--primary btn--sm" data-save>${ICONS_EXTRA.plus} Guardar (Ctrl+S)</button>
        </div>
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
  
  renderEmptyNotes() {
    return `
      <div class="empty-state" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-lg); text-align: center;">
        <div class="empty-state__icon">${ICONS.fileText}</div>
        <h3 class="empty-state__title">${this.searchQuery ? 'Sin resultados' : 'Sin notas'}</h3>
        <p class="empty-state__description">
          ${this.searchQuery ? 'No se encontraron notas con ese término' : 'Crea tu primera nota en Markdown'}
        </p>
        <button class="btn btn--primary empty-state__action" data-action="add-note">
          ${ICONS_EXTRA.plus} Nueva nota
        </button>
      </div>
    `;
  }
  
  bindEvents() {
    if (!this.element) return;
    
    // Nueva nota
    this.element.querySelectorAll('[data-action="add-note"]').forEach(btn => {
      btn.addEventListener('click', () => this.createNote());
    });
    
    // Lista de notas - selección
    this.element.querySelectorAll('[data-note-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-pin], [data-duplicate], [data-delete]')) return;
        const id = card.dataset.noteId;
        this.selectNote(id);
      });
      
      // Acciones
      card.querySelector('[data-pin]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = card.dataset.noteId;
        this.db.notes.togglePin(id);
      });
      
      card.querySelector('[data-duplicate]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = card.dataset.noteId;
        this.db.notes.duplicate(id);
      });
      
      card.querySelector('[data-delete]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = card.dataset.noteId;
        if (confirm('¿Eliminar esta nota?')) this.db.notes.remove(id);
      });
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
    
    // Editor events (si hay nota seleccionada)
    this.bindEditorEvents();
  }
  
  bindEditorEvents() {
    if (!this.element) return;
    
    const editor = this.element.querySelector('[data-editor]');
    const preview = this.element.querySelector('[data-preview]');
    const titleInput = this.element.querySelector('[data-edit-title]');
    const tagsInput = this.element.querySelector('[data-edit-tags]');
    const pinCheckbox = this.element.querySelector('[data-toggle-pin]');
    const saveBtn = this.element.querySelector('[data-save]');
    const deleteBtn = this.element.querySelector('[data-delete-note]');
    
    if (!editor || !this.selectedNoteId) return;
    
    // Auto-guardar con debounce
    let saveTimeout;
    const autoSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => this.saveCurrentNote(), 1000);
    };
    
    editor.addEventListener('input', autoSave);
    titleInput?.addEventListener('input', autoSave);
    tagsInput?.addEventListener('input', autoSave);
    pinCheckbox?.addEventListener('change', autoSave);
    
    // Preview en tiempo real
    let previewTimeout;
    editor.addEventListener('input', () => {
      clearTimeout(previewTimeout);
      previewTimeout = setTimeout(() => {
        if (preview) preview.innerHTML = renderMarkdownSync(editor.value);
      }, 150);
    });
    
    // Atajos teclado
    editor.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveCurrentNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.insertMarkdown(editor, '**', '**');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        this.insertMarkdown(editor, '*', '*');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.insertLink(editor);
      }
    });
    
    // Botones toolbar
    this.element.querySelector('[data-md-bold]')?.addEventListener('click', () => this.insertMarkdown(editor, '**', '**'));
    this.element.querySelector('[data-md-italic]')?.addEventListener('click', () => this.insertMarkdown(editor, '*', '*'));
    this.element.querySelector('[data-md-code]')?.addEventListener('click', () => this.insertMarkdown(editor, '`', '`'));
    this.element.querySelector('[data-md-codeblock]')?.addEventListener('click', () => this.insertMarkdown(editor, '\n```\n', '\n```\n'));
    this.element.querySelector('[data-md-link]')?.addEventListener('click', () => this.insertLink(editor));
    this.element.querySelector('[data-md-list]')?.addEventListener('click', () => this.insertMarkdown(editor, '\n- ', ''));
    this.element.querySelector('[data-md-ol]')?.addEventListener('click', () => this.insertMarkdown(editor, '\n1. ', ''));
    this.element.querySelector('[data-md-quote]')?.addEventListener('click', () => this.insertMarkdown(editor, '\n> ', ''));
    this.element.querySelector('[data-md-hr]')?.addEventListener('click', () => this.insertMarkdown(editor, '\n---\n', ''));
    
    saveBtn?.addEventListener('click', () => this.saveCurrentNote());
    deleteBtn?.addEventListener('click', () => {
      if (confirm('¿Eliminar esta nota?')) {
        this.db.notes.remove(this.selectedNoteId);
        this.selectNote(null);
      }
    });
  }
  
  insertMarkdown(textarea, prefix, suffix) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    const replacement = prefix + selected + suffix;
    textarea.value = textarea.value.slice(0, start) + replacement + textarea.value.slice(end);
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    textarea.dispatchEvent(new Event('input'));
  }
  
  insertLink(textarea) {
    const url = prompt('URL del enlace:');
    if (url) {
      const start = textarea.selectionStart;
      const text = textarea.value.slice(start, textarea.selectionEnd) || 'enlace';
      this.insertMarkdown(textarea, `[${text}](${url})`, '');
    }
  }
  
  saveCurrentNote() {
    if (!this.selectedNoteId) return;
    
    const editor = this.element.querySelector('[data-editor]');
    const titleInput = this.element.querySelector('[data-edit-title]');
    const tagsInput = this.element.querySelector('[data-edit-tags]');
    const pinCheckbox = this.element.querySelector('[data-toggle-pin]');
    
    const updates = {};
    if (editor) updates.content = editor.value;
    if (titleInput) updates.title = titleInput.value.trim() || 'Sin título';
    if (tagsInput) updates.tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
    if (pinCheckbox) updates.isPinned = pinCheckbox.checked;
    
    this.db.notes.update(this.selectedNoteId, updates);
    this.showSavedStatus();
  }
  
  showSavedStatus() {
    const status = this.element.querySelector('.editor__status');
    if (status) {
      status.textContent = 'Guardado ✓';
      status.style.color = 'var(--color-success)';
      setTimeout(() => {
        status.textContent = 'Guardado';
        status.style.color = '';
      }, 1500);
    }
  }
  
  createNote() {
    const note = this.db.notes.create({ title: 'Nueva nota', content: '' });
    this.selectNote(note.id);
  }
  
  selectNote(id) {
    this.selectedNoteId = id;
    this.refresh();
  }
  
  refresh() {
    if (!this.element) return;
    
    const sidebar = this.element.querySelector('.notes-sidebar');
    const editorArea = this.element.querySelector('.notes-editor');
    
    // Actualizar lista
    if (sidebar) {
      const notes = this.getFilteredNotes();
      sidebar.querySelector('.notes-list').innerHTML = notes.length === 0 
        ? this.renderEmptyNotes() 
        : this.renderNotesList(notes);
      this.bindEvents(); // Re-bind para nuevos elementos
    }
    
    // Actualizar editor
    if (editorArea) {
      const note = this.selectedNoteId ? this.db.notes.getById(this.selectedNoteId) : null;
      editorArea.innerHTML = note ? this.renderEditor(note) : this.renderWelcome();
      this.bindEditorEvents();
    }
  }
  
  refreshList() {
    const sidebar = this.element?.querySelector('.notes-list');
    if (sidebar) {
      const notes = this.getFilteredNotes();
      sidebar.innerHTML = notes.length === 0 ? this.renderEmptyNotes() : this.renderNotesList(notes);
      this.bindEvents();
    }
  }
  
  subscribeToChanges() {
    this.unsubscribers.push(
      this.db.notes.subscribe(() => this.refreshList())
    );
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
  }
}

export default NotesView;
