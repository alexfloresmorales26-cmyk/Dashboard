/**
 * Store principal - API reactiva unificada para tasks, notes, goals
 * Persistencia en localStorage con wrapper reactivo
 */

import { createStore } from '../utils/reactive.js';
import { nanoid } from '../utils/id.js';
import { nowISO } from '../utils/date.js';
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


// ============================================
// VALIDADORES (importación y recuperación)
// ============================================
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = v => typeof v === 'string';
const isNum = v => typeof v === 'number' && Number.isFinite(v);
const isISO = v => isStr(v) && !Number.isNaN(Date.parse(v));
const isDay = v => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);

const isValidTask = t =>
  isObj(t) && isStr(t.id) && t.id.length > 0 && isStr(t.title) &&
  isStr(t.description) && typeof t.completed === 'boolean' &&
  ['low', 'med', 'high'].includes(t.priority) &&
  (t.dueDate === null || isDay(t.dueDate)) &&
  isStr(t.category) && isNum(t.order) && isISO(t.createdAt) && isISO(t.updatedAt);

const isValidNote = n =>
  isObj(n) && isStr(n.id) && n.id.length > 0 && isStr(n.title) &&
  isStr(n.content) && Array.isArray(n.tags) && n.tags.every(isStr) &&
  typeof n.isPinned === 'boolean' && isISO(n.createdAt) && isISO(n.updatedAt);

const isValidGoal = g =>
  isObj(g) && isStr(g.id) && g.id.length > 0 && isStr(g.title) &&
  isNum(g.target) && isNum(g.current) && isStr(g.unit) &&
  ['daily', 'weekly'].includes(g.period) && isNum(g.streak) &&
  (g.lastCompleted === null || isDay(g.lastCompleted)) &&
  Array.isArray(g.completedDates) && g.completedDates.every(isDay) &&
  isISO(g.createdAt) && isISO(g.updatedAt);

/**
 * Carga datos desde localStorage
 */
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;
    
    const parsed = JSON.parse(stored);
    
    // Versión distinta: no borrar los datos del usuario. Se validan y se
    // conservan los registros que tengan la forma esperada.
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(`[Store] Versión ${parsed.version} distinta de ${STORAGE_VERSION}; se conservan los datos validados`);
    }
    
    // Validar estructura básica.
    // Migraciones de tema, una sola vez cada una:
    //  - themeMigrated: versiones antiguas persistían 'light' y el mundo
    //    glassmorphism era oscuro por defecto.
    //  - worldMigrated: el rediseño monocromo sustituye a ese mundo; su tema
    //    por defecto es el claro, así que el 'dark' heredado se descarta una
    //    vez y el usuario elige a partir de ahí.
    let theme = parsed.theme || 'light';
    if (!parsed.themeMigrated) theme = 'dark';
    const worldMigrated = Boolean(parsed.worldMigrated);
    if (!worldMigrated) theme = 'light';
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.filter(isValidTask) : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes.filter(isValidNote) : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals.filter(isValidGoal) : [],
      theme,
      themeMigrated: true,
      worldMigrated,
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
      themeMigrated: true,
      worldMigrated: true,
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

      const collections = [
        ['tasks', isValidTask],
        ['notes', isValidNote],
        ['goals', isValidGoal]
      ];
      const present = collections.filter(([key]) => data[key] !== undefined);

      if (present.length === 0) return false;

      // Rechazo atómico: si un solo registro es inválido, no se toca el estado.
      for (const [key, isValid] of present) {
        if (!Array.isArray(data[key]) || !data[key].every(isValid)) return false;
      }

      const mergeById = (current, incoming) => {
        const byId = new Map(current.map(item => [item.id, item]));
        for (const item of incoming) {
          byId.set(item.id, { ...(byId.get(item.id) || {}), ...item });
        }
        return [...byId.values()];
      };

      for (const [key] of present) {
        store.set(key, mergeById(store.get(key) || [], data[key]));
      }

      return true;
    } catch (e) {
      console.error('[Store] Error importando:', e);
      return false;
    }
  },
  
  // Helpers para crear IDs consistentes
  generateId: () => nanoid(12)
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
