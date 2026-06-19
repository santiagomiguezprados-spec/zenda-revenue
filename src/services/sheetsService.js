/**
 * sheetsService.js
 * Conecta la app con Google Sheets API v4 (read-only via API key).
 * Configurar en .env:
 *   VITE_GOOGLE_SHEET_ID=<id del spreadsheet>
 *   VITE_GOOGLE_API_KEY=<api key de Google Cloud>
 */

const SHEET_ID   = import.meta.env.VITE_GOOGLE_SHEET_ID
const API_KEY    = import.meta.env.VITE_GOOGLE_API_KEY
const BASE       = 'https://sheets.googleapis.com/v4/spreadsheets'

export const TAB_VENTAS  = import.meta.env.VITE_TAB_VENTAS  || 'Ventas Dolarizadas'
export const TAB_TEAM    = import.meta.env.VITE_TAB_TEAM    || 'Team Costo Normalizado'
export const TAB_SUELDOS = import.meta.env.VITE_TAB_SUELDOS || 'Sueldos'

/** True si las variables de entorno están configuradas */
export const isConfigured = () =>
  !!(SHEET_ID && API_KEY && SHEET_ID !== 'YOUR_SHEET_ID' && API_KEY !== 'YOUR_API_KEY')

/** Obtiene un rango de una solapa. Devuelve array de arrays (rows). */
async function getRange(tabName, range = '') {
  const encodedTab = encodeURIComponent(tabName)
  const rangeParam = range ? `${encodedTab}!${range}` : encodedTab
  const url = `${BASE}/${SHEET_ID}/values/${rangeParam}?key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Google Sheets API error ${res.status}`)
  }
  const json = await res.json()
  return json.values || []
}

/** Convierte rows (array de arrays) en array de objetos usando la primera fila como headers */
function rowsToObjects(rows) {
  if (!rows.length) return []
  const [headers, ...data] = rows
  return data
    .filter(row => row.some(cell => cell?.toString().trim()))
    .map(row => {
      const obj = {}
      headers.forEach((h, i) => { obj[h.trim()] = row[i]?.toString().trim() ?? '' })
      return obj
    })
}

/** Parsea un string a número, manejando puntos/comas en formato AR */
function num(val) {
  if (val === null || val === undefined || val === '') return 0
  const clean = val.toString()
    .replace(/\./g, '')   // quita puntos de miles
    .replace(',', '.')    // coma decimal → punto
    .replace(/[^0-9.-]/g, '')
  return parseFloat(clean) || 0
}

/** Busca el valor de un objeto probando múltiples claves posibles */
function find(obj, keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== '') return obj[k]
  }
  return ''
}

// ─────────────────────────────────────────────
// SUELDOS  →  formato team_cost.json
// ─────────────────────────────────────────────
export async function fetchSueldos(tabName = 'Sueldos') {
  const rows = await getRange(tabName)
  const objects = rowsToObjects(rows)

  return objects.map(obj => {
    const nombre = find(obj, ['Nombre', 'nombre', 'NOMBRE', 'Empleado', 'Colaborador'])
    if (!nombre) return null

    const neto    = num(find(obj, ['Neto', 'neto', 'Sueldo Neto', 'Básico', 'Salario Neto']))
    const cargas  = num(find(obj, ['Cargas', 'Cargas Sociales', 'cargasContrataciones', 'Cargas y Contrataciones']))
    const sac     = num(find(obj, ['SAC', 'sac', 'Aguinaldo']))
    const vac     = num(find(obj, ['Vacaciones', 'vacaciones', 'Provisión Vacaciones']))
    const costoAnual = num(find(obj, ['Costo Anual ARS', 'costoAnualARS', 'Costo Total Anual'])) ||
                       (neto + cargas + sac + vac) * 12

    const usd1300 = num(find(obj, ['USD @1300', 'costoUSD_1300', 'USD 1300'])) ||
                    Math.round((neto + cargas / 12) / 1300)
    const usd1400 = num(find(obj, ['USD @1400', 'costoUSD_1400', 'USD 1400'])) ||
                    Math.round((neto + cargas / 12) / 1400)

    const catRaw  = find(obj, ['Categoria', 'categoria', 'Categoría', 'Tipo', 'Rol'])
    const esOverhead = ['ceo','cmo','coo','overhead','c-level'].some(k =>
      catRaw.toLowerCase().includes(k) || nombre.toLowerCase().includes(k)
    )

    return {
      nombre,
      costoAnualARS: costoAnual,
      cargasContrataciones: cargas,
      neto,
      sac,
      vacaciones: vac,
      costoUSD_1300: usd1300,
      costoUSD_1400: usd1400,
      ...(esOverhead && { esOverhead: true, categoria: catRaw || nombre }),
    }
  }).filter(Boolean)
}

// ─────────────────────────────────────────────
// COMERCIAL GLOBAL  →  formato clients_sales.json
// ─────────────────────────────────────────────
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MES_ALIAS = {
  Ene: ['Ene', 'Enero', 'Jan', 'January'],
  Feb: ['Feb', 'Febrero', 'February'],
  Mar: ['Mar', 'Marzo', 'March'],
  Abr: ['Abr', 'Abril', 'Apr', 'April'],
  May: ['May', 'Mayo'],
  Jun: ['Jun', 'Junio', 'June'],
  Jul: ['Jul', 'Julio', 'July'],
  Ago: ['Ago', 'Agosto', 'Aug', 'August'],
  Sep: ['Sep', 'Sept', 'Septiembre', 'September'],
  Oct: ['Oct', 'Octubre', 'October'],
  Nov: ['Nov', 'Noviembre', 'November'],
  Dic: ['Dic', 'Diciembre', 'Dec', 'December'],
}

export async function fetchComercial(tabName = 'Comercial Global') {
  const rows = await getRange(tabName)
  const objects = rowsToObjects(rows)

  return objects.map(obj => {
    const nombre = find(obj, ['Cliente', 'cliente', 'Nombre', 'nombre', 'Account', 'Cuenta'])
    if (!nombre) return null

    const ventaMensual = {}
    MESES.forEach(mes => {
      const aliases = MES_ALIAS[mes]
      const val = find(obj, aliases)
      ventaMensual[mes] = num(val)
    })

    return {
      nombre,
      tipo:        find(obj, ['Tipo', 'tipo', 'Tier']) || 'B',
      categoria:   find(obj, ['Categoria', 'categoría', 'Categoría', 'Servicio']) || 'General',
      pais:        find(obj, ['País', 'Pais', 'pais', 'Country']) || 'Argentina',
      responsable: find(obj, ['Responsable', 'responsable', 'Account Manager', 'AM', 'Lead']),
      exterior:    ['si','sí','yes','true'].includes(
                     find(obj, ['Exterior', 'exterior', 'Internacional']).toLowerCase()
                   ),
      estado:      find(obj, ['Estado', 'estado', 'Status']) || 'Activo',
      inicioMes:   find(obj, ['Inicio', 'inicioMes', 'Mes Inicio', 'Start']),
      ventaMensual,
    }
  }).filter(Boolean)
}

// ─────────────────────────────────────────────
// TEAM COSTO NORMALIZADO  →  formato team_cost.json
// ─────────────────────────────────────────────
export async function fetchTeamCostoNormalizado(tabName = 'Team Costo Normalizado') {
  const rows = await getRange(tabName)
  const objects = rowsToObjects(rows)

  return objects.map(obj => {
    const nombre = find(obj, ['Team', 'team', 'Nombre', 'nombre', 'Empleado', 'Colaborador'])
    if (!nombre) return null

    const costoMensualARS = num(find(obj, ['Total ARS', 'Total', 'total ARS', 'Costo Total', 'Costo Mensual']))
    const cargas  = num(find(obj, ['Cargas y Contr', 'Cargas y Contrib.', 'Cargas y Contrib', 'Cargas', 'cargas', 'Cargas Sociales', 'Cargas y Contrataciones']))
    const neto    = num(find(obj, ['Neto', 'neto', 'Sueldo Neto', 'Salario Neto']))
    const sac     = num(find(obj, ['SAC', 'sac', 'Aguinaldo']))
    const vac     = num(find(obj, ['Vac', 'Vac.', 'Vacaciones', 'vacaciones', 'Provisión Vacaciones']))

    const catRaw = find(obj, ['Categoria', 'categoria', 'Categoría', 'Tipo', 'Rol'])
    const esOverhead = ['ceo', 'cmo', 'coo', 'overhead', 'c-level'].some(k =>
      catRaw.toLowerCase().includes(k) || nombre.toLowerCase().includes(k)
    )

    const efectivoMensual = costoMensualARS || (neto + cargas + sac / 12 + vac / 12)

    // Ignorar filas sin costo (personas inactivas / placeholders)
    if (efectivoMensual === 0) return null

    return {
      nombre,
      costoMensualARS: efectivoMensual,
      costoAnualARS: efectivoMensual * 12,
      cargasContrataciones: cargas,
      neto,
      sac,
      vacaciones: vac,
      ...(esOverhead && { esOverhead: true, categoria: catRaw || nombre }),
    }
  }).filter(Boolean)
}

// ─────────────────────────────────────────────
// VENTAS DOLARIZADAS  →  array de clientes con revenue mensual USD
// ─────────────────────────────────────────────
// Captura columnas tipo ene-26, feb-26, sept-26 (3 o 4 letras)
const MES_COL_RE = /^[a-z]{3,4}-\d{2}$/i

export async function fetchVentasDolarizadas(tabName = 'Ventas Dolarizadas') {
  const rows = await getRange(tabName)
  if (!rows.length) return []

  const [headers] = rows
  const mesHeaders = headers.map(h => h.trim()).filter(h => MES_COL_RE.test(h))
  const objects = rowsToObjects(rows)

  return objects.map(obj => {
    const nombre = find(obj, ['Cliente', 'cliente', 'Nombre', 'nombre', 'Account', 'Cuenta'])
    if (!nombre) return null

    const estado = find(obj, ['Estado', 'estado', 'Status']) || 'Activo'
    if (['inactivo', 'cancelado', 'baja'].some(s => estado.toLowerCase().includes(s))) return null

    // Valores en el sheet están en miles de USD → multiplicar ×1000
    const ventaMensual = {}
    mesHeaders.forEach(col => { ventaMensual[col] = Math.round(num(obj[col]) * 1000) })

    return {
      nombre,
      tipo:     find(obj, ['Tipo de Cliente', 'Tipo', 'tipo', 'Tier']) || 'B',
      categoria:find(obj, ['Categoria', 'Categoría', 'categoría', 'Servicio']) || 'General',
      pais:     find(obj, ['País', 'Pais', 'pais', 'Country']) || 'Argentina',
      estado,
      inicio:   find(obj, ['Inicio', 'inicioMes', 'Mes Inicio', 'Start']),
      ventaMensual,
      meses: mesHeaders,
    }
  }).filter(Boolean)
}

/** Expone los nombres de las solapas disponibles en el spreadsheet */
export async function fetchSheetNames() {
  if (!isConfigured()) return []
  const url = `${BASE}/${SHEET_ID}?key=${API_KEY}&fields=sheets.properties.title`
  const res = await fetch(url)
  if (!res.ok) return []
  const json = await res.json()
  return (json.sheets || []).map(s => s.properties.title)
}
