/**
 * Store de Notas Markdown - CRUD + búsqueda + favoritos
 */

import { nanoid } from '../utils/id.js';
import { nowISO } from '../utils/date.js';

export function notesStore(parentStore) {
  const KEY = 'notes';
  
  const getAll = () => parentStore.get(KEY) || [];
  const setAll = (notes) => parentStore.set(KEY, notes);
  
  /**
   * Crea nueva nota
   */
  function create(noteData) {
    const now = nowISO();
    const note = {
      id: nanoid(12),
      title: noteData.title?.trim() || 'Nota sin título',
      content: noteData.content || '',
      tags: Array.isArray(noteData.tags) ? noteData.tags.filter(Boolean) : [],
      isPinned: Boolean(noteData.isPinned),
      createdAt: now,
      updatedAt: now
    };
    
    parentStore.push(KEY, note);
    return note;
  }
  
  function getById(id) {
    return getAll().find(n => n.id === id);
  }
  
  function update(id, changes) {
    const notes = getAll();
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;
    
    const updated = {
      ...notes[index],
      ...changes,
      updatedAt: nowISO()
    };
    
    delete updated.id;
    delete updated.createdAt;
    
    const newNotes = [...notes];
    newNotes[index] = updated;
    setAll(newNotes);
    
    return updated;
  }
  
  function remove(id) {
    parentStore.remove(KEY, n => n.id === id);
  }
  
  /**
   * Alterna favorito (pinned)
   */
  function togglePin(id) {
    const note = getById(id);
    if (!note) return null;
    return update(id, { isPinned: !note.isPinned });
  }
  
  /**
   * Búsqueda full-text simple
   */
  function search(query, options = {}) {
    if (!query || !query.trim()) return getAll();
    
    const searchTerm = query.toLowerCase().trim();
    const { tags, pinnedOnly } = options;
    
    let notes = getAll();
    
    if (pinnedOnly) notes = notes.filter(n => n.isPinned);
    
    if (tags && tags.length > 0) {
      notes = notes.filter(n => tags.some(tag => n.tags.includes(tag)));
    }
    
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
  
  /**
   * Obtiene todas las tags únicas
   */
  function getAllTags() {
    const tags = new Set();
    getAll().forEach(note => {
      note.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }
  
  /**
   * Filtra por tag
   */
  function filterByTag(tag) {
    if (!tag) return getAll();
    return getAll().filter(note => note.tags.includes(tag));
  }
  
  /**
   * Obtiene notas favoritas
   */
  function getPinned() {
    return getAll().filter(n => n.isPinned);
  }
  
  /**
   * Estadísticas
   */
  function getStats() {
    const notes = getAll();
    return {
      total: notes.length,
      pinned: notes.filter(n => n.isPinned).length,
      tagsCount: getAllTags().length
    };
  }
  
  /**
   * Duplica una nota
   */
  function duplicate(id) {
    const note = getById(id);
    if (!note) return null;
    return create({
      title: `${note.title} (copia)`,
      content: note.content,
      tags: [...note.tags]
    });
  }
  
  return {
    getAll,
    getById,
    create,
    update,
    remove,
    togglePin,
    search,
    getAllTags,
    filterByTag,
    getPinned,
    getStats,
    duplicate,
    subscribe: (fn) => parentStore.subscribe(KEY, fn)
  };
}

export default notesStore;
