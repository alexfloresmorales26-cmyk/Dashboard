/**
 * Helpers de fecha - Formateo, comparaciones, localización ES
 */

const LOCALE = 'es-ES';

export function formatDate(date, options = {}) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const defaultOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  };
  
  return d.toLocaleDateString(LOCALE, defaultOptions);
}

export function formatDateShort(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatRelativeDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays === -1) return 'Ayer';
  if (diffDays > 1 && diffDays <= 7) return `En ${diffDays} días`;
  if (diffDays < -1 && diffDays >= -7) return `Hace ${Math.abs(diffDays)} días`;
  
  return formatDate(d);
}

export function formatTime(date, options = {}) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  });
}

export function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${formatDate(d)}, ${formatTime(d)}`;
}

export function isToday(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;
  
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

export function isPast(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  
  return target < today;
}

export function isFuture(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  
  return target > today;
}

export function startOfDay(date) {
  const d = date instanceof Date ? new Date(date) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = date instanceof Date ? new Date(date) : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date, days) {
  const d = date instanceof Date ? new Date(date) : new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function diffDays(date1, date2) {
  const d1 = startOfDay(date1 instanceof Date ? date1 : new Date(date1));
  const d2 = startOfDay(date2 instanceof Date ? date2 : new Date(date2));
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function toDateInputValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function fromDateInputValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getDayName(date, short = false) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(LOCALE, { weekday: short ? 'short' : 'long' });
}

export function getMonthName(date, short = false) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(LOCALE, { month: short ? 'short' : 'long' });
}

export function nowISO() {
  return new Date().toISOString();
}

export function todayString() {
  return toDateInputValue(new Date());
}
