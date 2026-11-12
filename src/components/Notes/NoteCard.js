/**
 * NoteCard - Tarjeta de nota para lista (preview, tags, pinned)
 */

import { formatRelativeDate } from '../../utils/date.js';
import { getFirstParagraph } from '../../utils/markdown.js';
import { ICONS } from '../Header/Header.js';

const ICONS_EXTRA = {
  pin: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 11a6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6-6"/></svg>',
  tag: '<svg class="icon icon--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  edit: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  delete: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  duplicate: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
};

export function NoteCard({ note, onSelect, onPin, onEdit, onDelete, onDuplicate }) {
  const card = document.createElement('article');
  card.className = 'card note-card';
  card.dataset.noteId = note.id;
  card.style.cursor = 'pointer';
  card.style.transition = 'all var(--transition-fast)';
  
  const preview = getFirstParagraph(note.content, 160);
  const updated = formatRelativeDate(note.updatedAt);
  const tagsHtml = note.tags.slice(0, 4).map(tag => 
    `<span class="badge badge--neutral" style="font-size: var(--font-size-xs);">${ICONS_EXTRA.tag} ${escapeHtml(tag)}</span>`
  ).join(' ');
  
  card.innerHTML = `
    <div class="card__content" style="padding: var(--space-md);">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-sm); margin-bottom: var(--space-xs);">
        <h3 class="card__title" style="font-size: var(--font-size-base); font-weight: 600; margin: 0; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${escapeHtml(note.title)}
          ${note.isPinned ? `<span class="badge badge--primary" style="font-size: var(--font-size-xs); margin-left: var(--space-xs);">${ICONS_EXTRA.pin} Fijada</span>` : ''}
        </h3>
        <div style="display: flex; gap: 2px; flex-shrink: 0; opacity: 0; transition: opacity var(--transition-fast);" class="note-card__actions">
          <button class="btn btn--ghost btn--icon btn--sm" data-edit title="Editar" aria-label="Editar">${ICONS_EXTRA.edit}</button>
          <button class="btn btn--ghost btn--icon btn--sm" data-duplicate title="Duplicar" aria-label="Duplicar">${ICONS_EXTRA.duplicate}</button>
          <button class="btn btn--ghost btn--icon btn--sm btn--danger" data-delete title="Eliminar" aria-label="Eliminar">${ICONS_EXTRA.delete}</button>
        </div>
      </div>
      ${tagsHtml ? `<div style="display: flex; flex-wrap: wrap; gap: var(--space-xs); margin-bottom: var(--space-sm); font-size: var(--font-size-xs);">${tagsHtml}</div>` : ''}
      <p style="font-size: var(--font-size-sm); color: var(--color-fg-muted); line-height: var(--line-height-relaxed); margin: 0 0 var(--space-sm); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
        ${escapeHtml(preview) || '<em style="color: var(--color-fg-subtle);">(vacía)</em>'}
      </p>
      <div style="font-size: var(--font-size-xs); color: var(--color-fg-subtle); display: flex; align-items: center; justify-content: space-between;">
        <span>${updated}</span>
        ${note.isPinned ? `<span class="badge badge--primary" style="font-size: 10px;">${ICONS_EXTRA.pin}</span>` : ''}
      </div>
    </div>
  `;
  
  // Mostrar acciones al hover
  card.addEventListener('mouseenter', () => {
    card.querySelector('.note-card__actions').style.opacity = '1';
  });
  card.addEventListener('mouseleave', () => {
    card.querySelector('.note-card__actions').style.opacity = '0';
  });
  
  // Click principal -> seleccionar
  card.addEventListener('click', (e) => {
    if (e.target.closest('[data-edit], [data-duplicate], [data-delete]')) return;
    onSelect?.(note.id);
  });
  
  // Acciones
  card.querySelector('[data-edit]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    onEdit?.(note);
  });
  
  card.querySelector('[data-duplicate]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    onDuplicate?.(note.id);
  });
  
  card.querySelector('[data-delete]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta nota?')) onDelete?.(note.id);
  });
  
  // Pin toggle (click en badge)
  card.querySelector('.badge--primary')?.addEventListener('click', (e) => {
    e.stopPropagation();
    onPin?.(note.id);
  });
  
  return card;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default NoteCard;
