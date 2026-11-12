/**
 * Wrapper Markdown - marked + DOMPurify (cargados vía CDN ESM)
 * Sanitizado XSS seguro para preview en tiempo real
 */

let marked = null;
let DOMPurify = null;
let loadPromise = null;

/**
 * Carga marked y DOMPurify desde CDN (una sola vez)
 */
async function loadLibraries() {
  if (loadPromise) return loadPromise;
  
  loadPromise = (async () => {
    // marked via esm.sh (ESM compatible)
    const markedModule = await import('https://esm.sh/marked@12.0.0');
    marked = markedModule.marked || markedModule.default;
    
    // DOMPurify via esm.sh
    const purifyModule = await import('https://esm.sh/dompurify@3.0.8');
    DOMPurify = purifyModule.default || purifyModule;
    
    // Configurar marked
    marked.setOptions({
      breaks: true,           // Saltos de línea = <br>
      gfm: true,              // GitHub Flavored Markdown
      headerIds: false,       // No IDs en headers
      mangle: false,          // No ofuscar emails
      silent: false
    });
    
    return { marked, DOMPurify };
  })();
  
  return loadPromise;
}

/**
 * Renderiza Markdown a HTML sanitizado
 * @param {string} markdown - Texto en Markdown
 * @returns {Promise<string>} HTML seguro
 */
export async function renderMarkdown(markdown) {
  if (!markdown || !markdown.trim()) return '';
  
  await loadLibraries();
  
  // Renderizar con marked
  const rawHtml = marked.parse(markdown);
  
  // Sanitizar con DOMPurify
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote',
      'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'del', 'ins', 'mark', 'sub', 'sup',
      'details', 'summary'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'target', 'rel',
      'colspan', 'rowspan', 'align'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_SCRIPTS: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });
  
  return cleanHtml;
}

/**
 * Renderiza Markdown de forma síncrona (usa cache si ya cargó)
 * @param {string} markdown
 * @returns {string} HTML o placeholder si librerías no listas
 */
export function renderMarkdownSync(markdown) {
  if (!markdown || !markdown.trim()) return '';
  
  if (!marked || !DOMPurify) {
    // Placeholder mientras cargan las librerías
    return `<div class="markdown-loading">Cargando preview...</div>`;
  }
  
  const rawHtml = marked.parse(markdown);
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote',
      'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'del', 'ins', 'mark', 'sub', 'sup'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
    FORBID_SCRIPTS: true
  });
}

/**
 * Extrae texto plano del Markdown (para previews/búsqueda)
 */
export function extractPlainText(markdown) {
  if (!markdown) return '';
  
  return markdown
    .replace(/[#*`_~\[\]()]/g, '') // Quitar sintaxis MD básica
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // Links/imágenes -> texto
    .replace(/```[\s\S]*?```/g, '') // Bloques código
    .replace(/`([^`]+)`/g, '$1') // Código inline
    .replace(/\n+/g, ' ') // Saltos línea -> espacios
    .trim();
}

/**
 * Obtiene primera línea/párrafo no vacío (para preview en lista)
 */
export function getFirstParagraph(markdown, maxLength = 160) {
  const text = extractPlainText(markdown);
  const firstParagraph = text.split('. ')[0] || text;
  return firstParagraph.length > maxLength 
    ? firstParagraph.slice(0, maxLength) + '…'
    : firstParagraph;
}

/**
 * Verifica si las librerías están listas
 */
export function isReady() {
  return !!marked && !!DOMPurify;
}

/**
 * Precarga las librerías (llamar al iniciar app)
 */
export function preload() {
  return loadLibraries();
}

export default { renderMarkdown, renderMarkdownSync, extractPlainText, getFirstParagraph, preload, isReady };
