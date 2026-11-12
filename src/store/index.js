/**
 * Store principal - API reactiva unificada para tasks, notes, goals
 * Persistencia en localStorage con wrapper reactivo
 */

import { createStore } from '../utils/reactive.js';
import { nanoid } from '../utils/id.js';
import { nowISO, todayString } from '../utils/date.js';
import { tasksStore } from './tasks.js';
import { notesStore } from './notes.js';
import { goalsStore } from './goals.js';

// Claves localStorage
const STORAGE_KEY = 'productivity-dashboard';
const STORAGE_VERSION = 1;

// Estado inicial por defecto
const defaultState = {
  tasks: [],
  notes: [],
  goals: [],
  theme: 'light',
  view: 'dashboard',
  version: STORAGE_VERSION
};

/**
 * Carga datos desde localStorage
 */
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;
    
    const parsed = JSON.parse(stored);
    
    // Migración de versión si necesario
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('[Store] Versión de datos antigua, reiniciando...');
      return defaultState;
    }
    
    // Validar estructura básica
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      theme: parsed.theme || 'light',
      view: parsed.view || 'dashboard',
      version: STORAGE_VERSION
    };
  } catch (e) {
    console.error('[Store] Error cargando localStorage:', e);
    return defaultState;
  }
}

/**
 * Guarda datos en localStorage
 */
function saveToStorage(state) {
  try {
    const toSave = {
      tasks: state.tasks,
      notes: state.notes,
      goals: state.goals,
      theme: state.theme,
      view: state.view,
      version: STORAGE_VERSION
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('[Store] Error guardando localStorage:', e);
    // Si falla por cuota, intentar limpiar datos antiguos
    if (e.name === 'QuotaExceededError') {
      console.warn('[Store] Cuota excedida, limpiando...');
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

// Crear store reactivo con persistencia automática
const store = createStore(loadFromStorage());

// Suscribirse a cambios para persistir
let saveTimeout = null;
store.subscribe('', (state) => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveToStorage(state), 100); // Debounce 100ms
});

// ============================================
// API PÚBLICA UNIFICADA
// ============================================

export const db = {
  // Stores especializados
  tasks: tasksStore(store),
  notes: notesStore(store),
  goals: goalsStore(store),
  
  // Tema
  get theme() { return store.get('theme'); },
  set theme(value) { store.set('theme', value); },
  toggleTheme() { 
    store.set('theme', store.get('theme') === 'light' ? 'dark' : 'light'); 
  },
  
  // Vista actual
  get view() { return store.get('view'); },
  set view(value) { store.set('view', value); },
  
  // Suscripción genérica
  subscribe: (key, fn) => store.subscribe(key, fn),
  
  // Utilidades
  clearAll() {
    store.set('tasks', []);
    store.set('notes', []);
    store.set('goals', []);
  },
  
  exportData() {
    const state = store.get();
    return JSON.stringify({
      tasks: state.tasks,
      notes: state.notes,
      goals: state.goals,
      exportedAt: nowISO(),
      version: STORAGE_VERSION
    }, null, 2);
  },
  
  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks) store.set('tasks', data.tasks);
      if (data.notes) store.set('notes', data.notes);
      if (data.goals) store.set('goals', data.goals);
      return true;
    } catch (e) {
      console.error('[Store] Error importando:', e);
      return false;
    }
  },
  
  // Helpers para crear IDs consistentes
  generateId: (prefix) => nanoid(12)
};

// Inicializar tema en DOM
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// Aplicar tema inicial
applyTheme(db.theme);

// Reaccionar a cambios de tema
db.subscribe('theme', applyTheme);

export default db;
