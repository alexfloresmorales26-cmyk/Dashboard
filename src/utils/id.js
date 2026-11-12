/**
 * Generador de IDs únicos - nanoid casero
 * URL-safe, sin dependencias, ~21 chars por defecto
 */

const URL_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

let customAlphabet = URL_ALPHABET;
let customDefaultSize = 21;

/**
 * Genera un ID aleatorio seguro para URLs
 * @param {number} size - Longitud del ID (default: 21)
 * @param {string} alphabet - Alfabeto personalizado (default: URL-safe)
 * @returns {string}
 */
export function nanoid(size = customDefaultSize, alphabet = customAlphabet) {
  let id = '';
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  const mask = (2 << Math.log2(alphabet.length - 1)) - 1;
  
  for (let i = 0; i < size; i++) {
    const byte = bytes[i] & mask;
    if (byte < alphabet.length) {
      id += alphabet[byte];
    } else {
      i--; // Reintentar este byte
    }
  }
  return id;
}

/**
 * Configura alfabeto y tamaño por defecto
 */
export function customNanoid(alphabet, defaultSize = 21) {
  customAlphabet = alphabet;
  customDefaultSize = defaultSize;
  return (size = defaultSize) => nanoid(size, alphabet);
}

/**
 * ID más corto para uso interno (10 chars)
 */
export const shortId = () => nanoid(10);

/**
 * ID legible para debugging (timestamp + random)
 */
export const readableId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = nanoid(8);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

/**
 * Genera múltiples IDs de una vez
 */
export function generateIds(count, size) {
  return Array.from({ length: count }, () => nanoid(size));
}

export default nanoid;
