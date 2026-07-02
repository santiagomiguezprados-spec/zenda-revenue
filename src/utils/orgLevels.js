export const CEO_NAME = 'Julian Chadwick'

// Títulos específicos por nombre — aparecen en el badge del nodo en lugar de "C-Level".
export const CLEVEL_TITLES = {
  'Julian Chadwick':  'CEO',
  'Julian Iglesias':  'COO',
  'Santiago Miguez':  'CFO',
  'Paz Larken':       'Head de HR',
  'Ignacio Telechea': 'CMO',
  'Valentin Morales': 'CTO',
}

// Solo los niveles ciclables (para equipo no-overhead).
// CEO y C-Level son fijos — vienen de clevel.js.
export const LEVELS = ['lider', 'manager', 'analista']

export const LEVEL_LABELS = {
  ceo:      'CEO',
  clevel:   'C-Level',
  lider:    'Team Leader',
  manager:  'Manager',
  analista: 'Analista',
}

// Colores de fondo y texto — calcan la paleta de la imagen de referencia.
export const LEVEL_COLORS = {
  ceo:      { bg: '#0A0A0B', text: '#FAFBF9', border: '#0A0A0B' },
  clevel:   { bg: '#3A3A3C', text: '#FAFBF9', border: '#3A3A3C' },
  lider:    { bg: '#59D7A2', text: '#0A0A0B', border: '#59D7A2' },
  manager:  { bg: '#95D6EA', text: '#0A0A0B', border: '#95D6EA' },
  analista: { bg: '#F0F1ED', text: '#3A3A3C', border: '#C4C5C1' },
}

export const DEFAULT_TEAM_LEADERS = ['Luana Maldonado', 'Federico Meyer']

// Personas que arrancan como Manager por defecto (confirmado por Santi, jul-2026).
// El resto del equipo arranca como Analista hasta clasificación manual.
// Para cambiar niveles usar el panel "Niveles" en el Organigrama — sin tocar código.
export const DEFAULT_MANAGERS = [
  'Adrián Matos',
  'Ariana Castaño',
  'Mateo',
  'Luna',
  'Nico Pergo',
  'Nico Poncho',
]

export function nextLevel(current) {
  const idx = LEVELS.indexOf(current || 'analista')
  return LEVELS[(idx + 1) % LEVELS.length]
}

export function isFixedLevel(level) {
  return level === 'ceo' || level === 'clevel'
}
