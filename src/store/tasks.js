/**
 * Store de Tareas - CRUD + helpers específicos
 */

import { nanoid } from '../utils/id.js';
import { nowISO, todayString, isPast, formatRelativeDate } from '../utils/date.js';

/**
 * Crea store de tareas con API tipada
 * @param {Object} parentStore - Store principal reactivo
 */
export function tasksStore(parentStore) {
  const KEY = 'tasks';
  
  // Helpers internos
  const getAll = () => parentStore.get(KEY) || [];
  const setAll = (tasks) => parentStore.set(KEY, tasks);
  
  /**
   * Crea una nueva tarea
   */
  function create(taskData) {
    const now = nowISO();
    const task = {
      id: nanoid(12),
      title: taskData.title?.trim() || 'Sin título',
      description: taskData.description?.trim() || '',
      completed: false,
      priority: taskData.priority || 'med', // 'low' | 'med' | 'high'
      dueDate: taskData.dueDate || null, // YYYY-MM-DD
      category: taskData.category?.trim() || '',
      order: taskData.order ?? Date.now(), // Para drag & drop
      createdAt: now,
      updatedAt: now
    };
    
    parentStore.push(KEY, task);
    return task;
  }
  
  /**
   * Obtiene tarea por ID
   */
  function getById(id) {
    return getAll().find(t => t.id === id);
  }
  
  /**
   * Actualiza tarea (merge parcial)
   */
  function update(id, changes) {
    const tasks = getAll();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    const updated = {
      ...tasks[index],
      ...changes,
      updatedAt: nowISO()
    };
    
    // No permitir cambiar id, createdAt
    delete updated.id;
    delete updated.createdAt;
    
    const newTasks = [...tasks];
    newTasks[index] = updated;
    setAll(newTasks);
    
    return updated;
  }
  
  /**
   * Alterna completado
   */
  function toggleComplete(id) {
    const task = getById(id);
    if (!task) return null;
    return update(id, { completed: !task.completed });
  }
  
  /**
   * Elimina tarea
   */
  function remove(id) {
    parentStore.remove(KEY, t => t.id === id);
  }
  
  /**
   * Reordena tareas (para drag & drop)
   */
  function reorder(fromIndex, toIndex) {
    const tasks = [...getAll()];
    const [removed] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, removed);
    
    // Actualizar order basado en posición
    tasks.forEach((task, i) => {
      task.order = i;
    });
    
    setAll(tasks);
  }
  
  /**
   * Mueve tarea a posición específica
   */
  function moveTo(id, newIndex) {
    const tasks = [...getAll()];
    const currentIndex = tasks.findIndex(t => t.id === id);
    if (currentIndex === -1 || currentIndex === newIndex) return;
    
    reorder(currentIndex, newIndex);
  }
  
  /**
   * Filtra tareas
   */
  function filter({ status, priority, category, search, overdue } = {}) {
    let tasks = getAll();
    
    if (status === 'active') tasks = tasks.filter(t => !t.completed);
    else if (status === 'completed') tasks = tasks.filter(t => t.completed);
    
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    
    if (category) tasks = tasks.filter(t => t.category === category);
    
    if (overdue) {
      const today = todayString();
      tasks = tasks.filter(t => t.dueDate && t.dueDate < today && !t.completed);
    }
    
    if (search) {
      const query = search.toLowerCase().trim();
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }
    
    return tasks;
  }
  
  /**
   * Obtiene categorías únicas usadas
   */
  function getCategories() {
    const categories = new Set();
    getAll().forEach(t => {
      if (t.category) categories.add(t.category);
    });
    return Array.from(categories).sort();
  }
  
  /**
   * Estadísticas rápidas
   */
  function getStats() {
    const tasks = getAll();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < todayString() && !t.completed).length;
    const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
    
    return { total, completed, active, overdue, highPriority };
  }
  
  /**
   * Limpia tareas completadas antiguas (opcional)
   */
  function clearCompleted(olderThanDays = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const cutoffISO = cutoff.toISOString();
    
    const tasks = getAll();
    const toKeep = tasks.filter(t => 
      !t.completed || new Date(t.updatedAt) > cutoff
    );
    
    setAll(toKeep);
    return tasks.length - toKeep.length;
  }
  
  // API pública
  return {
    getAll,
    getById,
    create,
    update,
    remove,
    toggleComplete,
    reorder,
    moveTo,
    filter,
    getCategories,
    getStats,
    clearCompleted,
    subscribe: (fn) => parentStore.subscribe(KEY, fn)
  };
}

export default tasksStore;
