/**
 * js/utils.js
 * Funciones de utilidad puras sin dependencias del DOM ni de Supabase.
 */

/**
 * Normaliza una cadena de texto para evitar duplicados en títulos y nombres de archivo.
 * Convierte a minúsculas, remueve acentos/diacríticos y reduce espacios múltiples a uno solo.
 * Implementación exacta según las especificaciones del profesor.
 * 
 * @param {string} value - El texto a normalizar.
 * @returns {string} El texto normalizado.
 */
function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

// Exponer en el objeto global por claridad
window.normalizeText = normalizeText;
