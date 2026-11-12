/**
 * NoteEditor - Editor Markdown con preview split-view en tiempo real
 * Toolbar, atajos teclado, auto-guardado, sanitizado XSS
 * GLASSMORPHISM EDITION
 */

import { renderMarkdownSync } from '../../utils/markdown.js';
import { db } from '../../store/index.js';

const ICONS = {
  bold: '<strong style="font-size: 14px;">B</strong>',
  italic: '<em style="font-style: italic; font-size: 14px;">I</em>',
  strikethrough: '<s style="font-size: 14px;">S</s>',
  code: '<code style="font-size: 12px; font-family: monospace;">{ }</code>',
  codeblock: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  link: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  h1: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>',
  h2: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>',
  list: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  ol: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="3" y="8" font-size="8">1</text><text x="3" y="14" font-size="8">2</text><text x="3" y="20" font-size="8">3</text></svg>',
  quote: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V21c0 1.25.75 2 2 2h1"/></svg>',
  hr: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  image: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  table: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="3"/></svg>',
  undo: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>',
  redo: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>',
  preview: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  fullscreen: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
  save: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  pin: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 11a6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6 6 6 6 0 0 1-6-6"/></svg>',
  pinOff: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 11a6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6-6"/><line x1="2" y1="2" x2="22" y2="22"/></svg>',
  tag: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  delete: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  duplicate: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
};

export function NoteEditor({ note, onSave, onClose, onDelete, onDuplicate }) {
  const isNew = !note.id;
  const editor = document.createElement('div');
  editor.className = 'note-editor modal glass';
  editor.style.maxWidth = '900px';
  
  let saveTimeout = null;
  let isFullscreen = false;
  let showPreview = true;
  
  const initialContent = note.content || '';
  const initialTitle = note.title || '';
  const initialTags = note.tags ? note.tags.join(', ') : '';
  const initialPinned = note.isPinned || false;
  
  editor.innerHTML = `
    <header class="modal__header">
      <div style="display: flex; align-items: center; gap: var(--space-md); flex: 1;">
        <h2 class="modal__title">${isNew ? 'Nueva nota' : 'Editar nota'}</h2>
        <span class="badge badge--neutral" id="char-count" style="font-size: var(--font-size-xs);">0 chars</span>
      </div>
      <div style="display: flex; align-items: center; gap: var(--space-xs);">
        <label class="checkbox" title="Fijar nota" style="font-size: var(--font-size-sm);">
          <input type="checkbox" class="checkbox__input" id="pin-toggle" ${initialPinned ? 'checked' : ''}>
          <span class="checkbox__box"></span>
          <span class="checkbox__label">${ICONS.pin}</span>
        </label>
        <button type="button" class="btn btn--ghost btn--icon" data-fullscreen title="Pantalla completa (F)" aria-label="Pantalla completa">${ICONS.fullscreen}</button>
        <button type="button" class="btn btn--ghost btn--icon modal__close" data-close aria-label="Cerrar">
          <svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </header>
    
    <form id="note-form">
      <div class="modal__body" style="display: flex; flex-direction: column; flex: 1; min-height: 0; padding: 0;">
        <!-- Título y Tags -->
        <div style="padding: var(--space-md) var(--space-lg); border-bottom: 1px solid var(--glass-border); flex-shrink: 0; background: var(--glass-bg-subtle); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);">
          <div style="display: flex; gap: var(--space-md); align-items: flex-start;">
            <input type="text" class="form-input" id="note-title" name="title" 
                   placeholder="Título de la nota..." 
                   value="${escapeHtml(initialTitle)}"
                   style="flex: 1; font-size: var(--font-size-lg); font-weight: 600; border: none; background: transparent; box-shadow: none; padding: 0;"
                   autocomplete="off">
            <div style="display: flex; gap: var(--space-sm); flex-shrink: 0;">
              <input type="text" class="form-input form-input--sm" id="note-tags" name="tags" 
                     placeholder="Tags (coma separados)" 
                     value="${escapeHtml(initialTags)}"
                     style="width: 200px;">
            </div>
          </div>
        </div>
        
        <!-- Toolbar -->
        <div class="editor__toolbar" style="display: flex; flex-wrap: wrap; gap: var(--space-xs); padding: var(--space-sm) var(--space-md); border-bottom: 1px solid var(--glass-border); background: var(--glass-bg-subtle); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); flex-shrink: 0;">
          <div style="display: flex; gap: 2px;" role="group" aria-label="Formato texto">
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-bold title="Negrita (Ctrl+B)" aria-label="Negrita">${ICONS.bold}</button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-italic title="Cursiva (Ctrl+I)" aria-label="Cursiva">${ICONS.italic}</button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-strikethrough title="Tachado" aria-label="Tachado">${ICONS.strikethrough}</button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-code title="Código inline" aria-label="Código">${ICONS.code}</button>
          </div>
          <div style="width: 1px; background: var(--glass-border); margin: 0 var(--space-xs);"></div>
          <div style="display: flex; gap: 2px;" role="group" aria-label="Bloques">
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-h1 title="Encabezado 1" aria-label="H1">${ICONS.h1}</button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-h2 title="Encabezado 2" aria-label="H2">${ICONS.h2}</button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-codeblock title="Bloque código" aria-label="Bloque código">${ICONS.codeblock}</button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-quote title="Cita" aria-label="Cita">${ICONS.quote}</button>
          </div>
          <div style="width: 1px; background: var(--glass-border); margin: 0 var(--space-xs);"></div>
          <div style="display: flex; gap: 2px;" role="group" aria-label="Listas">
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-list title="Lista" aria-label="Lista">${ICONS.list}</button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-ol title="Lista numerada" aria-label="Lista numerada">${ICONS.ol}</button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-hr title="Línea horizontal" aria-label="Separador">${ICONS.hr}</button>
          </div>
          <div style="width: 1px; background: var(--glass-border); margin: 0 var(--space-xs);"></div>
          <div style="display: flex; gap: 2px;" role="group" aria-label="Media">
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-link title="Enlace (Ctrl+K)" aria-label="Enlace">${ICONS.link}</button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-image title="Imagen" aria-label="Imagen">${ICONS.image}</button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-md-table title="Tabla" aria-label="Tabla">${ICONS.table}</button>
          </div>
          <div style="flex: 1;"></div>
          <div style="display: flex; gap: 2px;" role="group" aria-label="Acciones">
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-undo title="Deshacer (Ctrl+Z)" aria-label="Deshacer">${ICONS.undo}</button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-redo title="Rehacer (Ctrl+Y)" aria-label="Rehacer">${ICONS.redo}</button>
          </div>
          <div style="width: 1px; background: var(--glass-border); margin: 0 var(--space-xs);"></div>
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-toggle-preview title="Alternar preview" aria-label="Alternar preview" style="padding: var(--space-xs);">${ICONS.preview}</button>
            <span class="editor__status" id="save-status" style="font-size: var(--font-size-xs); color: var(--glass-fg-muted); min-width: 80px; text-align: right;">Guardado</span>
          </div>
        </div>
        
        <!-- Split View: Editor + Preview -->
        <div class="split-view" style="flex: 1; display: flex; min-height: 0; overflow: hidden; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
          <!-- Editor Panel -->
          <div class="split-view__pane split-view__pane--edit" style="flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--glass-border); min-width: 0; background: var(--glass-bg);">
            <textarea class="editor__textarea" 
                      id="note-content" 
                      name="content"
                      style="flex: 1; padding: var(--space-md); resize: none; font-family: var(--font-mono); font-size: var(--font-size-sm); line-height: var(--line-height-relaxed); background: transparent; color: var(--glass-fg); border: none; outline: none;"
                      placeholder="Escribe en Markdown...${!isNew ? '' : ' (Ctrl+S para guardar)'}"
                      spellcheck="false">${escapeHtml(initialContent)}</textarea>
          </div>
          
          <!-- Resizer -->
          <div class="split-view__resizer" id="resizer" style="width: 4px; background: var(--glass-border); cursor: col-resize; flex-shrink: 0; display: ${showPreview ? 'block' : 'none'};"></div>
          
          <!-- Preview Panel -->
          <div class="split-view__pane split-view__pane--preview" id="preview-pane" style="flex: 1; padding: var(--space-md); overflow: auto; min-width: 0; background: var(--glass-bg-subtle); display: ${showPreview ? 'flex' : 'none'}; flex-direction: column;">
            <div class="editor__preview-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md); padding-bottom: var(--space-sm); border-bottom: 1px solid var(--glass-border); flex-shrink: 0;">
              <h3 style="font-size: var(--font-size-sm); font-weight: 600; color: var(--glass-fg-muted); margin: 0;">Vista previa</h3>
            </div>
            <div class="editor__preview" id="preview" style="flex: 1; min-height: 200px; color: var(--glass-fg); line-height: var(--line-height-relaxed);">
              ${renderMarkdownSync(initialContent)}
            </div>
          </div>
        </div>
      </div>
      
      <footer class="modal__footer" style="display: flex; justify-content: flex-end; gap: var(--space-sm); padding: var(--space-md) var(--space-lg); border-top: 1px solid var(--glass-border); flex-shrink: 0; background: var(--glass-bg-subtle); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);">
        <button type="button" class="btn btn--ghost btn--sm" data-duplicate>${ICONS.duplicate} Duplicar</button>
        <button type="button" class="btn btn--danger btn--sm" data-delete>${ICONS.delete} Eliminar</button>
        <button type="button" class="btn btn--secondary btn--sm" data-close>Cancelar</button>
        <button type="submit" class="btn btn--primary btn--sm" id="save-btn">${ICONS.save} Guardar (Ctrl+S)</button>
      </footer>
    </form>
  `;
  
  // Elementos clave
  const form = editor.querySelector('#note-form');
  const textarea = editor.querySelector('#note-content');
  const preview = editor.querySelector('#preview');
  const titleInput = editor.querySelector('#note-title');
  const tagsInput = editor.querySelector('#note-tags');
  const pinToggle = editor.querySelector('#pin-toggle');
  const saveStatus = editor.querySelector('#save-status');
  const charCount = editor.querySelector('#char-count');
  const resizer = editor.querySelector('#resizer');
  const previewPane = editor.querySelector('#preview-pane');
  const togglePreviewBtn = editor.querySelector('[data-toggle-preview]');
  
  // Focus en título si es nueva, sino en contenido
  setTimeout(() => {
    if (isNew) titleInput?.focus();
    else textarea?.focus();
  }, 50);
  
  // ============================================
  // FUNCIONES PRINCIPALES
  // ============================================
  
  function updateCharCount() {
    const len = textarea.value.length;
    const lines = textarea.value.split('\n').length;
    charCount.textContent = `${len} chars · ${lines} líneas`;
  }
  
  function updatePreview() {
    preview.innerHTML = renderMarkdownSync(textarea.value);
  }
  
  function showSavedStatus() {
    saveStatus.textContent = 'Guardado ✓';
    saveStatus.style.color = 'var(--color-success)';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveStatus.textContent = 'Guardado';
      saveStatus.style.color = '';
    }, 1500);
  }
  
  function showSavingStatus() {
    saveStatus.textContent = 'Guardando...';
    saveStatus.style.color = 'var(--color-warning)';
  }
  
  function collectFormData() {
    return {
      title: titleInput.value.trim() || 'Sin título',
      content: textarea.value,
      tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
      isPinned: pinToggle.checked
    };
  }
  
  async function saveNote() {
    showSavingStatus();
    const data = collectFormData();
    await onSave(data);
    showSavedStatus();
  }
  
  // ============================================
  // EVENT LISTENERS
  // ============================================
  
  // Auto-save con debounce
  textarea.addEventListener('input', () => {
    updateCharCount();
    updatePreview();
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (!isNew) saveNote();
    }, 1000);
  });
  
  titleInput.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (!isNew) saveNote();
    }, 1000);
  });
  
  tagsInput.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (!isNew) saveNote();
    }, 1000);
  });
  
  pinToggle.addEventListener('change', () => {
    if (!isNew) saveNote();
  });
  
  // Submit form
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveNote();
  });
  
  // Toolbar buttons
  const markdownActions = {
    'md-bold': () => wrapSelection(textarea, '**', '**'),
    'md-italic': () => wrapSelection(textarea, '*', '*'),
    'md-strikethrough': () => wrapSelection(textarea, '~~', '~~'),
    'md-code': () => wrapSelection(textarea, '`', '`'),
    'md-codeblock': () => wrapSelection(textarea, '\n```\n', '\n```\n'),
    'md-h1': () => wrapSelection(textarea, '# ', '\n'),
    'md-h2': () => wrapSelection(textarea, '## ', '\n'),
    'md-list': () => wrapSelection(textarea, '\n- ', ''),
    'md-ol': () => wrapSelection(textarea, '\n1. ', ''),
    'md-quote': () => wrapSelection(textarea, '\n> ', ''),
    'md-hr': () => insertAtCursor(textarea, '\n---\n'),
    'md-link': () => insertLink(textarea),
    'md-image': () => insertImage(textarea),
    'md-table': () => insertTable(textarea),
    'undo': () => textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true })),
    'redo': () => textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }))
  };
  
  editor.querySelectorAll('[data-md-bold], [data-md-italic], [data-md-strikethrough], [data-md-code], [data-md-codeblock], [data-md-h1], [data-md-h2], [data-md-list], [data-md-ol], [data-md-quote], [data-md-hr], [data-md-link], [data-md-image], [data-md-table], [data-undo], [data-redo]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = Object.keys(markdownActions).find(k => btn.matches(`[data-${k}]`));
      if (action) {
        markdownActions[action]();
        textarea.focus();
      }
    });
  });
  
  // Toggle preview
  togglePreviewBtn.addEventListener('click', () => {
    showPreview = !showPreview;
    resizer.style.display = showPreview ? 'block' : 'none';
    previewPane.style.display = showPreview ? 'flex' : 'none';
    togglePreviewBtn.style.opacity = showPreview ? '1' : '0.5';
  });
  
  // Resizer drag
  let isResizing = false;
  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const container = editor.querySelector('.split-view');
    const rect = container.getBoundingClientRect();
    const leftWidth = e.clientX - rect.left;
    const totalWidth = rect.width;
    const leftPercent = (leftWidth / totalWidth) * 100;
    
    if (leftPercent > 20 && leftPercent < 80) {
      const panes = container.querySelectorAll('.split-view__pane');
      panes[0].style.flex = `0 0 ${leftPercent}%`;
      panes[1].style.flex = `0 0 ${100 - leftPercent}%`;
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      const panes = editor.querySelectorAll('.split-view__pane');
      panes.forEach(p => p.style.flex = '1');
    }
  });
  
  // Fullscreen
  editor.querySelector('[data-fullscreen]')?.addEventListener('click', () => {
    isFullscreen = !isFullscreen;
    editor.classList.toggle('note-editor--fullscreen', isFullscreen);
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
  });
  
  // Close handlers
  editor.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      onClose();
    });
  });
  
  // Delete
  editor.querySelector('[data-delete]')?.addEventListener('click', () => {
    if (confirm('¿Eliminar esta nota permanentemente?')) {
      onDelete();
    }
  });
  
  // Duplicate
  editor.querySelector('[data-duplicate]')?.addEventListener('click', () => {
    onDuplicate();
  });
  
  // Keyboard shortcuts
  const handleKeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveNote();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      wrapSelection(textarea, '**', '**');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      wrapSelection(textarea, '*', '*');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      insertLink(textarea);
    }
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'F11' || (e.ctrlKey && e.key === 'f')) {
      e.preventDefault();
      editor.querySelector('[data-fullscreen]')?.click();
    }
  };
  
  document.addEventListener('keydown', handleKeydown);
  
  // Cleanup
  editor.destroy = () => {
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    clearTimeout(saveTimeout);
    document.body.style.overflow = '';
  };
  
  // Inicializar
  updateCharCount();
  updatePreview();
  
  return editor;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function wrapSelection(textarea, prefix, suffix) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  const replacement = prefix + selected + suffix;
  textarea.value = textarea.value.slice(0, start) + replacement + textarea.value.slice(end);
  textarea.focus();
  textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
  textarea.dispatchEvent(new Event('input'));
}

function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(textarea.selectionEnd);
  textarea.focus();
  textarea.setSelectionRange(start + text.length, start + text.length);
  textarea.dispatchEvent(new Event('input'));
}

function insertLink(textarea) {
  const url = prompt('URL del enlace:');
  if (url) {
    const start = textarea.selectionStart;
    const selected = textarea.value.slice(start, textarea.selectionEnd);
    const text = selected || 'enlace';
    wrapSelection(textarea, `[${text}](${url})`, '');
  }
}

function insertImage(textarea) {
  const url = prompt('URL de la imagen:');
  const alt = prompt('Texto alternativo:', 'imagen');
  if (url) {
    insertAtCursor(textarea, `![${alt}](${url})`);
  }
}

function insertTable(textarea) {
  const rows = prompt('Filas:', '3');
  const cols = prompt('Columnas:', '3');
  if (rows && cols) {
    const r = parseInt(rows), c = parseInt(cols);
    let md = '\n';
    md += '| ' + Array(c).fill('Header').join(' | ') + ' |\n';
    md += '| ' + Array(c).fill('---').join(' | ') + ' |\n';
    for (let i = 0; i < r; i++) {
      md += '| ' + Array(c).fill('Cell').join(' | ') + ' |\n';
    }
    insertAtCursor(textarea, md);
  }
}

export default NoteEditor;
