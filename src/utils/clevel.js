// C-Level fijo: costo de overhead permanente, NO asignable a PODs
export const C_LEVEL_FIJO = new Set(['Santiago Miguez', 'Paz Larken'])

// C-Level operativo: aparece en el pool del POD designer, asignable a clientes
export const C_LEVEL_OP = new Set(['Julian Chadwick', 'Julian Iglesias', 'Valentin Morales', 'Ignacio Telechea'])

export const C_LEVEL_ALL = new Set([...C_LEVEL_FIJO, ...C_LEVEL_OP])

// Detección por apellido (case-insensitive substring) — para parseo del Sheet
const APELLIDOS_FIJO = ['larken', 'miguez']
const APELLIDOS_OP   = ['chadwick', 'morales', 'iglesias', 'telechea']

/**
 * Dado un nombre del Sheet, devuelve { esOverhead, cLevelOperativo } si es C-Level,
 * o null si no matchea ningún apellido.
 */
export function detectCLevel(nombre) {
  const lower = (nombre || '').toLowerCase()
  if (APELLIDOS_FIJO.some(a => lower.includes(a))) return { esOverhead: true, cLevelOperativo: false }
  if (APELLIDOS_OP.some(a => lower.includes(a)))   return { esOverhead: true, cLevelOperativo: true }
  return null
}
