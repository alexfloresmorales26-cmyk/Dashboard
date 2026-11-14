/**
 * DataManager - Modal para Exportar/Importar/Limpiar datos
 * GLASSMORPHISM EDITION
 */

import { db } from '../../store/index.js';

const ICONS = {
  download: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  upload: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  trash: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  database: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  check: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  alert: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  close: '<svg class="icon icon--md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  info: '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

export function DataManager({ onClose }) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  
  // State
  let activeTab = 'export';
  let importFile = null;
  let importStatus = null;
  let importMessage = '';
  
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  
  function render() {
    modal.innerHTML = `
      <div class="modal" style="max-width: 560px;">
        <header class="modal__header">
          <h2 class="modal__title">${ICONS.database} Gestión de Datos</h2>
          <button class="btn btn--ghost btn--icon modal__close" data-close aria-label="Cerrar">${ICONS.close}</button>
        </header>
        
        <div class="modal__body" style="padding: var(--space-lg);">
          <div class="data-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-md); margin-bottom: var(--space-xl); padding: var(--space-md); background: var(--glass-bg-subtle); border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
            <div style="text-align: center;">
              <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-primary);">${db.tasks.getStats().total}</div>
              <div style="font-size: var(--font-size-xs); color: var(--text-muted);">Tareas (${db.tasks.getStats().completed} ✓)</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-success);">${db.notes.getStats().total}</div>
              <div style="font-size: var(--font-size-xs); color: var(--text-muted);">Notas (${db.notes.getStats().pinned} 📌)</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-warning);">${db.goals.getStats().total}</div>
              <div style="font-size: var(--font-size-xs); color: var(--text-muted);">Metas (${db.goals.getStats().daily} diarias)</div>
            </div>
          </div>
          
          <div class="data-tabs" style="display: flex; gap: var(--space-xs); margin-bottom: var(--space-lg); border-bottom: 1px solid var(--glass-border); padding-bottom: var(--space-sm);">
            <button class="data-tab ${activeTab === 'export' ? 'active' : ''}" data-tab="export" style="flex: 1; padding: var(--space-sm) var(--space-md); background: transparent; border: none; color: ${activeTab === 'export' ? 'var(--color-primary)' : 'var(--text-muted)'}; font-weight: ${activeTab === 'export' ? '600' : '500'}; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: var(--space-xs); border-radius: var(--radius-md); transition: all var(--transition-fast);">
              ${ICONS.download} Exportar
            </button>
            <button class="data-tab ${activeTab === 'import' ? 'active' : ''}" data-tab="import" style="flex: 1; padding: var(--space-sm) var(--space-md); background: transparent; border: none; color: ${activeTab === 'import' ? 'var(--color-primary)' : 'var(--text-muted)'}; font-weight: ${activeTab === 'import' ? '600' : '500'}; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: var(--space-xs); border-radius: var(--radius-md); transition: all var(--transition-fast);">
              ${ICONS.upload} Importar
            </button>
            <button class="data-tab ${activeTab === 'clear' ? 'active' : ''}" data-tab="clear" style="flex: 1; padding: var(--space-sm) var(--space-md); background: transparent; border: none; color: ${activeTab === 'clear' ? 'var(--color-danger)' : 'var(--text-muted)'}; font-weight: ${activeTab === 'clear' ? '600' : '500'}; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: var(--space-xs); border-radius: var(--radius-md); transition: all var(--transition-fast);">
              ${ICONS.trash} Limpiar
            </button>
          </div>
          
          <div class="data-panels">
            ${renderExportPanel()}
            ${renderImportPanel()}
            ${renderClearPanel()}
          </div>
        </div>
        
        <footer class="modal__footer">
          ${activeTab === 'export' ? `
            <button class="btn btn--primary" data-action="export">${ICONS.download} Descargar JSON</button>
          ` : activeTab === 'import' ? `
            <button class="btn btn--secondary" data-cancel-import>Cancelar</button>
            <button class="btn btn--primary" data-action="import" ${!importFile ? 'disabled' : ''}>${ICONS.upload} Importar</button>
          ` : `
            <button class="btn btn--secondary" data-cancel-clear>Cancelar</button>
            <button class="btn btn--danger" data-action="clear">${ICONS.trash} Eliminar Todo</button>
          `}
        </footer>
      </div>
    `;
    
    bindEvents();
  }
  
  function renderExportPanel() {
    if (activeTab !== 'export') return '';
    
    return `
      <div class="data-panel" data-panel="export" style="animation: fadeIn var(--transition-fast);">
        <div class="glass" style="padding: var(--space-lg); border-radius: var(--radius-lg);">
          <h3 style="margin: 0 0 var(--space-sm); color: var(--text-primary);">Exportar Datos</h3>
          <p style="margin: 0 0 var(--space-lg); color: var(--text-muted); font-size: var(--font-size-sm);">
            Descarga un archivo JSON con todas tus tareas, notas y metas. Incluye timestamp y versión.
          </p>
          <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
            <label class="checkbox" style="font-size: var(--font-size-sm);">
              <input type="checkbox" class="checkbox__input" id="export-completed" checked>
              <span class="checkbox__box"></span>
              <span class="checkbox__label">Incluir tareas completadas</span>
            </label>
            <label class="checkbox" style="font-size: var(--font-size-sm);">
              <input type="checkbox" class="checkbox__input" id="export-pinned" checked>
              <span class="checkbox__box"></span>
              <span class="checkbox__label">Incluir notas fijadas</span>
            </label>
            <label class="checkbox" style="font-size: var(--font-size-sm);">
              <input type="checkbox" class="checkbox__input" id="export-goals-history" checked>
              <span class="checkbox__box"></span>
              <span class="checkbox__label">Incluir historial de metas</span>
            </label>
          </div>
          <div style="margin-top: var(--space-lg); padding: var(--space-md); background: var(--glass-bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--glass-border); font-size: var(--font-size-xs); color: var(--text-muted);">
            <strong>Formato:</strong> JSON con estructura { tasks, notes, goals, exportedAt, version }
          </div>
        </div>
      </div>
    `;
  }
  
  function renderImportPanel() {
    if (activeTab !== 'import') return '';
    
    return `
      <div class="data-panel" data-panel="import" style="animation: fadeIn var(--transition-fast);">
        <div class="glass" style="padding: var(--space-lg); border-radius: var(--radius-lg);">
          <h3 style="margin: 0 0 var(--space-sm); color: var(--text-primary);">Importar Datos</h3>
          <p style="margin: 0 0 var(--space-lg); color: var(--text-muted); font-size: var(--font-size-sm);">
            Selecciona un archivo JSON exportado previamente. <strong>Se fusionarán los datos</strong> (no se elimina lo existente).
          </p>
          
          <div class="drop-zone" id="drop-zone" style="border: 2px dashed var(--glass-border); border-radius: var(--radius-lg); padding: var(--space-xl); text-align: center; cursor: pointer; transition: all var(--transition-fast); ${importFile ? 'border-color: var(--color-primary); background: rgba(59,130,246,0.05);' : ''}">
            <input type="file" id="file-input" accept=".json" style="display: none;">
            ${importFile ? `
              <div style="display: flex; align-items: center; justify-content: center; gap: var(--space-md); color: var(--text-primary);">
                ${ICONS.database}
                <div>
                  <div style="font-weight: 500;">${importFile.name}</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">${formatFileSize(importFile.size)}</div>
                </div>
              </div>
            ` : `
              ${ICONS.upload}
              <p style="margin: var(--space-sm) 0 0; color: var(--text-muted);">Arrastra un archivo JSON aquí o haz clic para seleccionar</p>
              <p style="font-size: var(--font-size-xs); color: var(--text-subtle); margin-top: var(--space-xs);">Máx. 5 MB · .json</p>
            `}
          </div>
          
          ${importStatus === 'success' ? `
            <div style="margin-top: var(--space-md); padding: var(--space-md); background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); border-radius: var(--radius-md); color: var(--color-success); display: flex; align-items: center; gap: var(--space-sm);">
              <svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ${importMessage}
            </div>
          ` : importStatus === 'error' ? `
            <div style="margin-top: var(--space-md); padding: var(--space-md); background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); color: var(--color-danger); display: flex; align-items: center; gap: var(--space-sm);">
              <svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${importMessage}
            </div>
          ` : ''}
          
          <div style="margin-top: var(--space-lg); padding: var(--space-md); background: var(--glass-bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--glass-border); font-size: var(--font-size-xs); color: var(--text-muted);">
            <strong>Formato esperado:</strong> { tasks[], notes[], goals[], exportedAt?, version? }
          </div>
        </div>
      </div>
    `;
  }
  
  function renderClearPanel() {
    if (activeTab !== 'clear') return '';
    
    return `
      <div class="data-panel" data-panel="clear" style="animation: fadeIn var(--transition-fast);">
        <div class="glass glass-danger" style="padding: var(--space-lg); border-radius: var(--radius-lg);">
          <div style="display: flex; align-items: flex-start; gap: var(--space-md);">
            <svg class="icon icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div style="flex: 1;">
              <h3 style="margin: 0 0 var(--space-sm); color: var(--color-danger);">⚠️ Eliminar Todos los Datos</h3>
              <p style="margin: 0 0 var(--space-lg); color: var(--text-secondary); font-size: var(--font-size-sm);">
                Esta acción <strong>no se puede deshacer</strong>. Se eliminarán permanentemente:
              </p>
              <ul style="margin: 0 0 var(--space-lg); padding-left: var(--space-lg); color: var(--text-secondary); font-size: var(--font-size-sm); line-height: 2;">
                <li>Todas las tareas (${db.tasks.getStats().total})</li>
                <li>Todas las notas (${db.notes.getStats().total})</li>
                <li>Todas las metas y su historial (${db.goals.getStats().total})</li>
              </ul>
              <p style="margin: 0; font-size: var(--font-size-xs); color: var(--text-muted);">
                Se recomienda <strong>exportar un backup</strong> antes de continuar.
              </p>
            </div>
          </div>
          
          <div style="margin-top: var(--space-lg); padding: var(--space-md); background: var(--glass-bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
            <label class="checkbox" style="font-size: var(--font-size-sm);">
              <input type="checkbox" class="checkbox__input" id="confirm-clear" required>
              <span class="checkbox__box"></span>
              <span class="checkbox__label"><strong>Confirmo que quiero eliminar TODOS mis datos permanentemente</strong></span>
            </label>
          </div>
        </div>
      </div>
    `;
  }
  
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  
  function bindEvents() {
    modal.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => onClose?.());
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) onClose?.();
    });
    
    modal.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });
    
    modal.querySelector('[data-action="export"]')?.addEventListener('click', () => {
      const includeCompleted = modal.querySelector('#export-completed')?.checked;
      const includePinned = modal.querySelector('#export-pinned')?.checked;
      const includeHistory = modal.querySelector('#export-goals-history')?.checked;
      handleExport({ includeCompleted, includePinned, includeHistory });
    });
    
    const dropZone = modal.querySelector('#drop-zone');
    const fileInput = modal.querySelector('#file-input');
    
    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--color-primary)';
      dropZone.style.background = 'rgba(59,130,246,0.1)';
    });
    dropZone?.addEventListener('dragleave', () => {
      dropZone.style.borderColor = '';
      dropZone.style.background = '';
    });
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '';
      dropZone.style.background = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/json') handleFileSelect(file);
    });
    modal.querySelector('#file-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFileSelect(file);
    });
    
    modal.querySelector('[data-action="import"]')?.addEventListener('click', () => {
      if (importFile) handleImport(importFile);
    });
    
    modal.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
      const confirmed = modal.querySelector('#confirm-clear')?.checked;
      if (confirmed) handleClear();
    });
    
    modal.querySelector('[data-cancel-import]')?.addEventListener('click', () => onClose?.());
    modal.querySelector('[data-cancel-clear]')?.addEventListener('click', () => onClose?.());
  }
  
  function handleFileSelect(file) {
    if (!file.name.endsWith('.json')) {
      importStatus = 'error';
      importMessage = 'El archivo debe ser .json';
      render();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      importStatus = 'error';
      importMessage = 'Archivo muy grande (máx. 5 MB)';
      render();
      return;
    }
    importFile = file;
    importStatus = null;
    render();
  }
  
  function handleExport(options) {
    try {
      const data = JSON.parse(db.exportData());
      
      if (!options.includeCompleted) {
        data.tasks = data.tasks.filter(t => !t.completed);
      }
      if (!options.includePinned) {
        data.notes = data.notes.filter(n => !n.isPinned);
      }
      if (!options.includeHistory) {
        data.goals = data.goals.map(g => ({
          ...g,
          completedDates: [],
          streak: 0,
          lastCompleted: null
        }));
      }
      
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `productividad-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      const btn = modal.querySelector('[data-action="export"]');
      btn.innerHTML = '✓ Descargado';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = `${ICONS.download} Descargar JSON`;
        btn.disabled = false;
      }, 2000);
    } catch (e) {
      console.error('[DataManager] Export error:', e);
      alert('Error al exportar: ' + e.message);
    }
  }
  
  function handleImport(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target.result;
        const success = db.importData(json);
        
        if (success) {
          importStatus = 'success';
          importMessage = 'Datos importados correctamente';
        } else {
          importStatus = 'error';
          importMessage = 'Formato JSON inválido o datos corruptos';
        }
        render();
      } catch (err) {
        importStatus = 'error';
        importMessage = 'Error al leer archivo: ' + err.message;
        render();
      }
    };
    reader.readAsText(file);
  }
  
  function handleClear() {
    if (confirm('¿ESTÁS SEGURO? Se eliminarán TODOS los datos permanentemente.')) {
      db.clearAll();
      onClose?.();
      const event = new CustomEvent('app:toast', { 
        detail: { type: 'success', message: 'Todos los datos eliminados' } 
      });
      window.dispatchEvent(event);
    }
  }
  
  // Init
  render();
  
  modal.destroy = () => {};
  
  return modal;
}

export default DataManager;
