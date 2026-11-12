/**
 * Store de Metas Diarias - Progreso, rachas, reset automático
 */

import { nanoid } from '../utils/id.js';
import { nowISO, todayString, startOfDay, diffDays } from '../utils/date.js';

export function goalsStore(parentStore) {
  const KEY = 'goals';
  const STREAK_KEY = 'goals_streak_data'; // Para persistir rachas entre sesiones
  
  const getAll = () => parentStore.get(KEY) || [];
  const setAll = (goals) => parentStore.set(KEY, goals);
  
  /**
   * Crea nueva meta
   */
  function create(goalData) {
    const now = nowISO();
    const goal = {
      id: nanoid(12),
      title: goalData.title?.trim() || 'Meta sin título',
      target: Number(goalData.target) || 1,
      current: Number(goalData.current) || 0,
      unit: goalData.unit || 'veces', // 'veces', 'minutos', 'litros', 'pasos', 'pomodoro', etc.
      period: goalData.period || 'daily', // 'daily' | 'weekly'
      streak: 0, // Días consecutivos completados
      lastCompleted: null, // YYYY-MM-DD del último completado
      completedDates: [], // Historial de fechas completadas (YYYY-MM-DD)
      createdAt: now,
      updatedAt: now
    };
    
    parentStore.push(KEY, goal);
    return goal;
  }
  
  function getById(id) {
    return getAll().find(g => g.id === id);
  }
  
  function update(id, changes) {
    const goals = getAll();
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return null;
    
    const updated = {
      ...goals[index],
      ...changes,
      updatedAt: nowISO()
    };
    
    delete updated.id;
    delete updated.createdAt;
    
    const newGoals = [...goals];
    newGoals[index] = updated;
    setAll(newGoals);
    
    return updated;
  }
  
  function remove(id) {
    parentStore.remove(KEY, g => g.id === id);
  }
  
  /**
   * Incrementa progreso de una meta
   * @param {string} id 
   * @param {number} amount - Cantidad a sumar (default: 1)
   * @returns {Object} Meta actualizada con info de completado
   */
  function incrementProgress(id, amount = 1) {
    const goal = getById(id);
    if (!goal) return null;
    
    const newCurrent = Math.min(goal.current + amount, goal.target);
    const wasCompleted = goal.current >= goal.target;
    const isNowCompleted = newCurrent >= goal.target;
    const justCompleted = !wasCompleted && isNowCompleted;
    
    const updated = update(id, { current: newCurrent });
    
    // Si se completó hoy, manejar racha
    if (justCompleted) {
      handleCompletion(id);
    }
    
    return {
      ...updated,
      justCompleted,
      progress: goal.target > 0 ? (newCurrent / goal.target) * 100 : 0
    };
  }
  
  /**
   * Decrementa progreso
   */
  function decrementProgress(id, amount = 1) {
    const goal = getById(id);
    if (!goal) return null;
    
    const newCurrent = Math.max(goal.current - amount, 0);
    return update(id, { current: newCurrent });
  }
  
  /**
   * Maneja lógica de completado (racha, historial)
   */
  function handleCompletion(id) {
    const today = todayString();
    const goal = getById(id);
    if (!goal) return;
    
    // Evitar duplicar si ya se marcó hoy
    if (goal.completedDates.includes(today)) return;
    
    const newCompletedDates = [...goal.completedDates, today].sort();
    
    // Calcular racha
    let newStreak = 1;
    if (goal.lastCompleted) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (goal.lastCompleted === yesterdayStr) {
        newStreak = goal.streak + 1;
      } else if (goal.lastCompleted !== today) {
        newStreak = 1; // Se rompió la racha
      }
    }
    
    update(id, {
      lastCompleted: today,
      completedDates: newCompletedDates,
      streak: newStreak
    });
  }
  
  /**
   * Resetea progreso diario (para metas diarias)
   * Se llama automáticamente al cambiar de día
   */
  function resetDaily() {
    const today = todayString();
    const goals = getAll();
    let changed = false;
    
    const newGoals = goals.map(goal => {
      if (goal.period !== 'daily') return goal;
      
      // Si ya se reseteó hoy, no hacer nada
      if (goal.lastReset === today) return goal;
      
      changed = true;
      return {
        ...goal,
        current: 0,
        lastReset: today,
        updatedAt: nowISO()
      };
    });
    
    if (changed) setAll(newGoals);
    return changed;
  }
  
  /**
   * Obtiene metas de hoy (con progreso calculado)
   */
  function getToday() {
    // Auto-reset al consultar
    resetDaily();
    
    return getAll().map(goal => {
      const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
      const isCompleted = goal.current >= goal.target;
      const isOverdue = goal.period === 'daily' && goal.lastCompleted && goal.lastCompleted !== todayString();
      
      return {
        ...goal,
        progress: Math.round(progress),
        isCompleted,
        isOverdue,
        remaining: Math.max(goal.target - goal.current, 0)
      };
    });
  }
  
  /**
   * Obtiene historial de completados para una meta (últimos N días)
   */
  function getHistory(id, days = 30) {
    const goal = getById(id);
    if (!goal) return [];
    
    const today = new Date();
    const history = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      history.push({
        date: dateStr,
        completed: goal.completedDates.includes(dateStr),
        current: 0 // Podríamos guardar snapshots diarios en el futuro
      });
    }
    
    return history;
  }
  
  /**
   * Estadísticas globales
   */
  function getStats() {
    const goals = getAll();
    const todayGoals = getToday();
    
    return {
      total: goals.length,
      daily: goals.filter(g => g.period === 'daily').length,
      weekly: goals.filter(g => g.period === 'weekly').length,
      completedToday: todayGoals.filter(g => g.isCompleted).length,
      activeToday: todayGoals.filter(g => !g.isCompleted && g.period === 'daily').length,
      totalStreak: goals.reduce((sum, g) => sum + g.streak, 0),
      bestStreak: Math.max(...goals.map(g => g.streak), 0)
    };
  }
  
  /**
   * Resetea meta manualmente (vuelve a 0)
   */
  function resetGoal(id) {
    return update(id, { 
      current: 0, 
      lastReset: todayString(),
      lastCompleted: null,
      streak: 0,
      completedDates: []
    });
  }
  
  return {
    getAll,
    getById,
    create,
    update,
    remove,
    incrementProgress,
    decrementProgress,
    resetDaily,
    getToday,
    getHistory,
    getStats,
    resetGoal,
    subscribe: (fn) => parentStore.subscribe(KEY, fn)
  };
}

export default goalsStore;
