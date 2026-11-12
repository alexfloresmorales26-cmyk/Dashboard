/**
 * Mini Signal Store - Reactividad simple tipo signals
 * Inspirado en SolidJS / Preact Signals
 */

export function signal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();
  
  const get = () => value;
  
  const set = (newValue) => {
    const nextValue = typeof newValue === 'function' ? newValue(value) : newValue;
    if (nextValue !== value) {
      value = nextValue;
      subscribers.forEach(fn => fn(value));
    }
    return value;
  };
  
  const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };
  
  return { get, set, subscribe };
}

export function computed(fn, deps = []) {
  const { get, subscribe } = signal(fn());
  
  const update = () => {
    const newValue = fn();
    if (newValue !== get()) {
      // Usamos set interno accediendo al closure
      // Nota: signal no expone set directo, recreamos
    }
  };
  
  // Suscribirse a dependencias si son signals
  const unsubscribers = deps
    .filter(dep => dep && typeof dep.subscribe === 'function')
    .map(dep => dep.subscribe(update));
  
  return {
    get,
    subscribe: (fn) => {
      const unsub = subscribe(fn);
      return () => {
        unsub();
        unsubscribers.forEach(u => u());
      };
    }
  };
}

export function effect(fn) {
  let cleanup;
  
  const run = () => {
    if (cleanup) cleanup();
    cleanup = fn();
  };
  
  run();
  
  return () => {
    if (cleanup) cleanup();
  };
}

/**
 * Store reactivo para colecciones (array/object)
 * Proporciona API similar a signals pero para datos estructurados
 */
export function createStore(initialData = {}) {
  const state = signal(initialData);
  const listeners = new Map(); // key -> Set<callback>
  
  function notify(key) {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      const value = key ? get(key) : state.get();
      keyListeners.forEach(fn => fn(value));
    }
    // También notificar listeners globales (key = '')
    const globalListeners = listeners.get('');
    if (globalListeners) {
      globalListeners.forEach(fn => fn(state.get()));
    }
  }
  
  function get(key) {
    if (!key) return state.get();
    const data = state.get();
    return key.split('.').reduce((obj, k) => obj?.[k], data);
  }
  
  function set(key, value) {
    const current = state.get();
    const keys = key.split('.');
    const next = JSON.parse(JSON.stringify(current)); // deep clone
    
    let target = next;
    for (let i = 0; i < keys.length - 1; i++) {
      target = target[keys[i]] = { ...target[keys[i]] };
    }
    target[keys[keys.length - 1]] = typeof value === 'function' ? value(target[keys[keys.length - 1]]) : value;
    
    state.set(next);
    notify(key);
    notify('');
  }
  
  function update(key, updater) {
    const current = get(key);
    set(key, updater(current));
  }
  
  function subscribe(key, fn) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(fn);
    
    // Llamar inmediatamente con valor actual
    fn(get(key));
    
    return () => {
      listeners.get(key)?.delete(fn);
    };
  }
  
  return {
    get,
    set,
    update,
    subscribe,
    // Helpers comunes para arrays
    push: (key, item) => update(key, arr => [...(arr || []), item]),
    remove: (key, predicate) => update(key, arr => (arr || []).filter(predicate)),
    find: (key, predicate) => (get(key) || []).find(predicate),
    findIndex: (key, predicate) => (get(key) || []).findIndex(predicate),
    sort: (key, compareFn) => update(key, arr => [...(arr || [])].sort(compareFn)),
    replace: (key, newArray) => set(key, newArray),
  };
}

// Store global para la app
export const appStore = createStore({
  tasks: [],
  notes: [],
  goals: [],
  theme: 'light',
  view: 'dashboard'
});
