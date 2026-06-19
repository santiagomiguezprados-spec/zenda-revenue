/**
 * CsvImporter.jsx
 * Modal de importación CSV / Excel (.xlsx) para el Maestro de Clientes.
 * Drag & drop → parseo → mapeo de columnas → preview → importación masiva.
 * Genera plantilla Excel con formato, validaciones y colores.
 */
import { useState, useRef, useCallback, useMemo } from 'react'
import * as XLSX from 'xlsx'

// ── Campos del maestro ─────────────────────────────────────────────────────
const FIELDS = [
  { key: 'codigo',       label: 'Código',        type: 'number', required: true,  group: 'info',  example: '1', hint: 'Número único. Se auto-genera si se deja vacío.' },
  { key: 'nombre',       label: 'Nombre',        type: 'text',   required: true,  group: 'info',  example: 'Empresa Ejemplo', hint: 'Razón social o nombre comercial.' },
  { key: 'estado',       label: 'Estado',         type: 'text',   required: false, group: 'info',  example: 'Activa', hint: 'Activa o Inactiva. Default: Activa.' },
  { key: 'moneda',       label: 'Moneda',         type: 'text',   required: false, group: 'info',  example: 'ARS', hint: 'ARS o USD.' },
  { key: 'facturante',   label: 'Facturante',     type: 'text',   required: false, group: 'info',  example: 'SRL', hint: 'SRL, LLC, SAC, Liam.' },
  { key: 'contrato',     label: 'Contrato (URL)', type: 'text',   required: false, group: 'contrato', example: 'https://drive.google.com/...', hint: 'Link al contrato firmado.' },
  { key: 'fechaVtoTerminacion', label: 'Vto / Terminación', type: 'text', required: false, group: 'contrato', example: 'Indefinido - 30 días', hint: 'Condición de terminación.' },
  { key: 'comentario',   label: 'Comentario',     type: 'text',   required: false, group: 'contrato', example: '', hint: 'Notas generales del cliente.' },
  { key: 'lastUpdate',   label: 'Última Act.',    type: 'month',  required: false, group: 'fees',  example: '2025-01', hint: 'Formato: YYYY-MM (ej: 2025-06).' },
  { key: 'porcentajeUltimaActualizacion', label: '% Última Act.', type: 'number', required: false, group: 'fees', example: '5', hint: 'Porcentaje aplicado (número sin %).' },
  { key: 'nextUpdate',   label: 'Próxima Act.',   type: 'month',  required: false, group: 'fees',  example: '2025-07', hint: 'Formato: YYYY-MM.' },
  { key: 'limiteMinimo', label: 'Límite Mínimo',  type: 'text',   required: false, group: 'escalas', example: 'ARS 11.600.000', hint: 'Monto mínimo de facturación.' },
  { key: 'feeMinimo',    label: 'Fee Mínimo',     type: 'text',   required: false, group: 'escalas', example: 'ARS 1.400.000', hint: 'Fee por debajo del límite mínimo.' },
  { key: 'escala1Limite',     label: 'Escala 1 Límite', type: 'text',   required: false, group: 'escalas', example: 'ARS 20.000.000', hint: 'Tope de la primera escala.' },
  { key: 'escala1Porcentaje', label: 'Escala 1 %',      type: 'number', required: false, group: 'escalas', example: '12', hint: '% de fee de la escala 1.' },
  { key: 'escala2Limite',     label: 'Escala 2 Límite', type: 'text',   required: false, group: 'escalas', example: 'ARS 40.000.000', hint: '' },
  { key: 'escala2Porcentaje', label: 'Escala 2 %',      type: 'number', required: false, group: 'escalas', example: '10', hint: '' },
  { key: 'escala3Limite',     label: 'Escala 3 Límite', type: 'text',   required: false, group: 'escalas', example: 'Sin límite', hint: '' },
  { key: 'escala3Porcentaje', label: 'Escala 3 %',      type: 'number', required: false, group: 'escalas', example: '8', hint: '' },
  { key: 'escala4Limite',     label: 'Escala 4 Límite', type: 'text',   required: false, group: 'escalas', example: '', hint: '' },
  { key: 'escala4Porcentaje', label: 'Escala 4 %',      type: 'number', required: false, group: 'escalas', example: '', hint: '' },
]

const GROUP_COLORS = {
  info:     { header: '1B5E20', fill: 'E8F5E9', label: 'Información básica' },
  contrato: { header: '0D47A1', fill: 'E3F2FD', label: 'Contrato' },
  fees:     { header: 'E65100', fill: 'FFF3E0', label: 'Actualización de fees' },
  escalas:  { header: '4A148C', fill: 'F3E5F5', label: 'Estructura de fees' },
}

// ── Sinónimos para auto-mapeo ──────────────────────────────────────────────
const SYNONYMS = {
  codigo: ['codigo', 'código', 'code', 'cod', 'id', '#', 'nro', 'numero', 'número'],
  nombre: ['nombre', 'name', 'cliente', 'client', 'razon social', 'razón social', 'empresa'],
  estado: ['estado', 'status', 'activo', 'activa', 'state'],
  moneda: ['moneda', 'currency', 'divisa', 'coin', 'mon'],
  facturante: ['facturante', 'entidad', 'billing', 'entity', 'sociedad'],
  contrato: ['contrato', 'contract', 'url contrato', 'link contrato', 'url'],
  fechaVtoTerminacion: ['vencimiento', 'terminacion', 'terminación', 'vto', 'fecha vto', 'condicion'],
  comentario: ['comentario', 'comment', 'nota', 'notas', 'observacion', 'observación', 'obs'],
  lastUpdate: ['ultima actualizacion', 'última actualización', 'last update', 'ult act', 'ult. act.', 'fecha act'],
  porcentajeUltimaActualizacion: ['% ultima', '% última', 'porcentaje', '% act', 'pct', '%'],
  nextUpdate: ['proxima actualizacion', 'próxima actualización', 'next update', 'prox act', 'próx. act.'],
  limiteMinimo: ['limite minimo', 'límite mínimo', 'min limit', 'lim min'],
  feeMinimo: ['fee minimo', 'fee mínimo', 'min fee', 'fee min'],
  escala1Limite: ['escala 1 limite', 'escala 1 límite', 'e1 limite', 'e1 lim', 'esc1 lim'],
  escala1Porcentaje: ['escala 1 %', 'escala 1 porcentaje', 'e1 %', 'e1%', 'esc1 %'],
  escala2Limite: ['escala 2 limite', 'escala 2 límite', 'e2 limite', 'e2 lim', 'esc2 lim'],
  escala2Porcentaje: ['escala 2 %', 'escala 2 porcentaje', 'e2 %', 'e2%', 'esc2 %'],
  escala3Limite: ['escala 3 limite', 'escala 3 límite', 'e3 limite', 'e3 lim', 'esc3 lim'],
  escala3Porcentaje: ['escala 3 %', 'escala 3 porcentaje', 'e3 %', 'e3%', 'esc3 %'],
  escala4Limite: ['escala 4 limite', 'escala 4 límite', 'e4 limite', 'e4 lim', 'esc4 lim'],
  escala4Porcentaje: ['escala 4 %', 'escala 4 porcentaje', 'e4 %', 'e4%', 'esc4 %'],
}

// ── Parser CSV robusto ─────────────────────────────────────────────────────
function parseCsvRobust(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const firstLine = lines.split('\n')[0] || ''
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ','

  const result = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < lines.length; i++) {
    const ch = lines[i]
    if (inQuotes) {
      if (ch === '"') {
        if (lines[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === sep) {
        row.push(field.trim())
        field = ''
      } else if (ch === '\n') {
        row.push(field.trim())
        if (row.some(c => c)) result.push(row)
        row = []
        field = ''
      } else {
        field += ch
      }
    }
  }
  row.push(field.trim())
  if (row.some(c => c)) result.push(row)
  return result
}

// ── Parser Excel ───────────────────────────────────────────────────────────
function parseExcel(buffer) {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  // Buscar la hoja "Clientes" o usar la primera
  const sheetName = wb.SheetNames.find(n =>
    n.toLowerCase().includes('cliente')
  ) || wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]

  // Convertir a array de arrays, manejando celdas vacías
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false })

  // Filtrar filas completamente vacías
  return {
    rows: raw.filter(r => r.some(c => c !== '' && c != null)).map(r => r.map(c => String(c ?? '').trim())),
    sheetName,
    sheetNames: wb.SheetNames,
  }
}

// ── Auto-mapeo de columnas ─────────────────────────────────────────────────
function autoMapColumns(headers) {
  const mapping = {}
  const used = new Set()
  const normalizedHeaders = headers.map(h => (h || '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
  )

  for (const field of FIELDS) {
    const syns = SYNONYMS[field.key] || [field.key.toLowerCase()]
    let bestIdx = -1

    // Exact match
    for (const syn of syns) {
      const normSyn = syn.normalize('NFD').replace(/[̀-ͯ]/g, '')
      const idx = normalizedHeaders.findIndex((h, i) => h === normSyn && !used.has(i))
      if (idx !== -1) { bestIdx = idx; break }
    }

    // Includes match
    if (bestIdx === -1) {
      for (const syn of syns) {
        const normSyn = syn.normalize('NFD').replace(/[̀-ͯ]/g, '')
        if (normSyn.length < 2) continue
        const idx = normalizedHeaders.findIndex((h, i) =>
          !used.has(i) && h.length >= 2 && (h.includes(normSyn) || normSyn.includes(h))
        )
        if (idx !== -1) { bestIdx = idx; break }
      }
    }

    mapping[field.key] = bestIdx
    if (bestIdx >= 0) used.add(bestIdx)
  }

  return mapping
}

// ── Generador de plantilla Excel ───────────────────────────────────────────
function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new()

  // ── Hoja principal: "Clientes" ──
  const headerRow = FIELDS.map(f => f.label)
  const hintsRow  = FIELDS.map(f => f.hint || '')
  const exampleRow = FIELDS.map(f => f.example || '')

  const wsData = [headerRow, hintsRow, exampleRow]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Anchos de columna
  ws['!cols'] = FIELDS.map(f => ({
    wch: Math.max(f.label.length + 2, (f.example || '').length + 2, 14)
  }))

  // Estilos de cabeceras (grupo por color)
  FIELDS.forEach((f, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
    const gc = GROUP_COLORS[f.group]
    if (!ws[cellRef]) ws[cellRef] = { v: f.label, t: 's' }
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: gc.header } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        bottom: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: 'CCCCCC' } },
      },
    }

    // Fila de hints
    const hintRef = XLSX.utils.encode_cell({ r: 1, c: i })
    if (!ws[hintRef]) ws[hintRef] = { v: f.hint || '', t: 's' }
    ws[hintRef].s = {
      font: { italic: true, color: { rgb: '666666' }, sz: 9 },
      fill: { fgColor: { rgb: gc.fill } },
      alignment: { wrapText: true },
    }

    // Fila de ejemplo
    const exRef = XLSX.utils.encode_cell({ r: 2, c: i })
    if (!ws[exRef]) ws[exRef] = { v: f.example || '', t: 's' }
    ws[exRef].s = {
      font: { color: { rgb: '999999' }, sz: 10 },
      fill: { fgColor: { rgb: 'FAFAFA' } },
    }
  })

  // Freeze primer fila
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Data validations
  const estadoCol = FIELDS.findIndex(f => f.key === 'estado')
  const monedaCol = FIELDS.findIndex(f => f.key === 'moneda')
  const facCol    = FIELDS.findIndex(f => f.key === 'facturante')

  ws['!dataValidation'] = []
  if (estadoCol >= 0) {
    ws['!dataValidation'].push({
      sqref: `${XLSX.utils.encode_col(estadoCol)}4:${XLSX.utils.encode_col(estadoCol)}1000`,
      type: 'list',
      formula1: '"Activa,Inactiva"',
      showDropDown: true,
    })
  }
  if (monedaCol >= 0) {
    ws['!dataValidation'].push({
      sqref: `${XLSX.utils.encode_col(monedaCol)}4:${XLSX.utils.encode_col(monedaCol)}1000`,
      type: 'list',
      formula1: '"ARS,USD"',
      showDropDown: true,
    })
  }
  if (facCol >= 0) {
    ws['!dataValidation'].push({
      sqref: `${XLSX.utils.encode_col(facCol)}4:${XLSX.utils.encode_col(facCol)}1000`,
      type: 'list',
      formula1: '"SRL,LLC,SAC,Liam"',
      showDropDown: true,
    })
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Clientes')

  // ── Hoja de instrucciones ──
  const instrData = [
    ['INSTRUCCIONES - Plantilla Maestro de Clientes Zenda'],
    [''],
    ['Cómo usar esta plantilla:'],
    ['1. La fila 1 contiene los nombres de las columnas (NO MODIFICAR).'],
    ['2. La fila 2 tiene descripciones de cada campo (podés borrarla antes de importar).'],
    ['3. La fila 3 tiene un ejemplo (podés borrarla antes de importar o reemplazarla con datos reales).'],
    ['4. Empezá a cargar datos desde la fila 3 o 4.'],
    [''],
    ['Campos obligatorios:'],
    ['• Nombre: es el único campo requerido. El código se auto-genera si no se completa.'],
    [''],
    ['Campos con validación:'],
    ['• Estado: "Activa" o "Inactiva" (dropdown). Default: Activa.'],
    ['• Moneda: "ARS" o "USD" (dropdown).'],
    ['• Facturante: "SRL", "LLC", "SAC", "Liam" (dropdown, o texto libre).'],
    [''],
    ['Formato de fechas:'],
    ['• Última/Próxima Actualización: usar formato YYYY-MM (ej: 2025-06).'],
    ['• Los porcentajes se ingresan como número sin signo % (ej: 12 y no 12%).'],
    [''],
    ['Estructura de fees:'],
    ['• Límite mínimo y Fee mínimo son montos (texto libre, ej: "ARS 1.400.000").'],
    ['• Cada escala tiene un Límite (texto) y un Porcentaje (número).'],
    ['• Usar "Sin límite" para la última escala si no tiene tope.'],
    [''],
    ['Importación:'],
    ['• Guardá este archivo como .xlsx y usá el botón "Importar CSV/Excel" en el dashboard.'],
    ['• El importador auto-detecta las columnas. Podés ajustar el mapeo manualmente.'],
    ['• Los clientes duplicados (mismo nombre o código) se marcan y podés omitirlos.'],
  ]
  const wsInstr = XLSX.utils.aoa_to_sheet(instrData)
  wsInstr['!cols'] = [{ wch: 90 }]

  // Título
  const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 })
  if (wsInstr[titleCell]) {
    wsInstr[titleCell].s = {
      font: { bold: true, sz: 14, color: { rgb: '1B5E20' } },
    }
  }

  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucciones')

  // Exportar
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Zenda_Plantilla_Clientes.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Componente principal ───────────────────────────────────────────────────
export default function CsvImporter({ open, onClose, onImport, existingClientes = [] }) {
  const [step, setStep] = useState('upload') // upload | map | preview | importing | done
  const [rawRows, setRawRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({})
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('') // 'csv' | 'xlsx'
  const [sheetName, setSheetName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState({ ok: 0, skip: 0, fail: 0, errors: [] })
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const fileRef = useRef(null)

  // ── Parsear archivo ───────────────────────────────────────────────────────
  const loadParsedData = useCallback((hdrs, data, fName, fType, sName) => {
    setHeaders(hdrs)
    setRawRows(data)
    setFileName(fName)
    setFileType(fType)
    setSheetName(sName || '')
    const autoMap = autoMapColumns(hdrs)
    setMapping(autoMap)
    setStep('map')
  }, [])

  const processFile = useCallback((file) => {
    if (!file) return
    const name = file.name.toLowerCase()
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'

    if (isExcel) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const { rows, sheetName: sn } = parseExcel(e.target.result)
          if (rows.length < 2) {
            alert('El archivo no tiene datos suficientes.')
            return
          }
          loadParsedData(rows[0], rows.slice(1), file.name, 'xlsx', sn)
        } catch (err) {
          alert(`Error al leer el Excel: ${err.message}`)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const rows = parseCsvRobust(e.target.result)
        if (rows.length < 2) {
          alert('El archivo no tiene datos suficientes.')
          return
        }
        loadParsedData(rows[0], rows.slice(1), file.name, 'csv', '')
      }
      reader.readAsText(file, 'UTF-8')
    }
  }, [loadParsedData])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (!file) return
    const name = file.name.toLowerCase()
    if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
      processFile(file)
    } else {
      alert('Formatos soportados: .csv, .xlsx, .xls')
    }
  }, [processFile])

  const handleFileSelect = useCallback((e) => {
    processFile(e.target.files?.[0])
  }, [processFile])

  // ── Preview data ──────────────────────────────────────────────────────────
  const previewData = useMemo(() => {
    return rawRows.map((row, rowIdx) => {
      const obj = { _rowIdx: rowIdx }
      const errors = []

      for (const field of FIELDS) {
        const colIdx = mapping[field.key]
        let val = colIdx >= 0 ? (row[colIdx] || '').trim() : ''

        // Auto-normalize estado
        if (field.key === 'estado' && val) {
          const low = val.toLowerCase()
          if (['activa', 'activo', 'active', 'si', 'sí', '1', 'true'].includes(low)) val = 'Activa'
          else if (['inactiva', 'inactivo', 'inactive', 'no', '0', 'false'].includes(low)) val = 'Inactiva'
        }

        // Auto-normalize moneda
        if (field.key === 'moneda' && val) {
          const up = val.toUpperCase().trim()
          if (['ARS', 'PESOS', 'AR$', '$'].includes(up)) val = 'ARS'
          else if (['USD', 'DOLARES', 'DÓLARES', 'US$', 'U$S'].includes(up)) val = 'USD'
          else val = up
        }

        // Numeric fields
        if (field.type === 'number' && val) {
          const cleaned = String(val).replace(/[^0-9.,\-]/g, '').replace(',', '.')
          const num = parseFloat(cleaned)
          if (!isNaN(num)) val = num
          else { val = ''; errors.push(`${field.label}: valor numérico inválido`) }
        }

        obj[field.key] = val
      }

      if (!obj.nombre) errors.push('Nombre es obligatorio')

      const isDupe = existingClientes.some(c =>
        c.nombre?.toLowerCase() === (obj.nombre || '').toString().toLowerCase() ||
        (obj.codigo && c.codigo === Number(obj.codigo))
      )
      obj._isDupe = isDupe
      obj._errors = errors

      return obj
    }).filter(obj => obj.nombre || obj.codigo)
  }, [rawRows, mapping, existingClientes])

  const dupeCount = previewData.filter(d => d._isDupe).length
  const errorCount = previewData.filter(d => d._errors.length > 0).length
  const readyCount = previewData.filter(d => d._errors.length === 0 && !(skipDuplicates && d._isDupe)).length

  // ── Importar ──────────────────────────────────────────────────────────────
  const handleStartImport = useCallback(async () => {
    const toImport = previewData.filter(d => d._errors.length === 0 && !(skipDuplicates && d._isDupe))
    if (toImport.length === 0) return

    setStep('importing')
    setImportProgress(0)
    const results = { ok: 0, skip: 0, fail: 0, errors: [] }

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i]
      const data = {}
      for (const field of FIELDS) {
        if (row[field.key] !== undefined && row[field.key] !== '') {
          data[field.key] = row[field.key]
        }
      }
      if (!data.estado) data.estado = 'Activa'

      try {
        const result = await onImport(data)
        if (result) results.ok++
        else { results.fail++; results.errors.push(`Fila ${row._rowIdx + 2}: error al guardar`) }
      } catch (err) {
        results.fail++
        results.errors.push(`Fila ${row._rowIdx + 2}: ${err.message || 'error'}`)
      }
      setImportProgress(Math.round(((i + 1) / toImport.length) * 100))
    }

    setImportResults(results)
    setStep('done')
  }, [previewData, skipDuplicates, onImport])

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setStep('upload')
    setRawRows([])
    setHeaders([])
    setMapping({})
    setFileName('')
    setFileType('')
    setSheetName('')
    setImportProgress(0)
    setImportResults({ ok: 0, skip: 0, fail: 0, errors: [] })
  }, [])

  if (!open) return null

  const fileIcon = fileType === 'xlsx' ? '📊' : '📄'
  const mappedCount = FIELDS.filter(f => mapping[f.key] >= 0).length

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      <div className="fixed inset-4 sm:inset-8 lg:inset-y-6 lg:inset-x-20 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-in">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-sm font-bold text-textPrimary flex items-center gap-2">
              📥 Importar Clientes
              {fileName && (
                <span className="text-[10px] font-normal text-textSecondary bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {fileIcon} {fileName}
                  {sheetName && <span className="text-gray-400">· {sheetName}</span>}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              {['upload', 'map', 'preview', 'importing', 'done'].map((s, i) => {
                const labels = ['Subir archivo', 'Mapear columnas', 'Preview', 'Importando', 'Resultado']
                const icons = ['📁', '🔗', '👁', '⏳', '✅']
                const stepIdx = ['upload', 'map', 'preview', 'importing', 'done'].indexOf(step)
                const isActive = i === stepIdx
                const isDone = i < stepIdx
                return (
                  <span key={s} className="flex items-center gap-1">
                    <span className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full transition-all ${
                      isActive ? 'bg-accent/10 text-accent font-bold' :
                      isDone ? 'text-accent/60 font-medium' :
                      'text-gray-300'
                    }`}>
                      <span>{icons[i]}</span>
                      <span className="hidden sm:inline">{labels[i]}</span>
                    </span>
                    {i < 4 && <span className="text-gray-200 text-xs">›</span>}
                  </span>
                )
              })}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg p-1">✕</button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ═════════ STEP: UPLOAD ═════════ */}
          {step === 'upload' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-accent bg-accent/5 scale-[1.01]'
                    : 'border-gray-200 hover:border-accent/50 hover:bg-gray-50'
                }`}
              >
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm font-semibold text-textPrimary">
                  Arrastrá tu archivo acá
                </p>
                <p className="text-xs text-textSecondary mt-1">
                  o hacé click para seleccionar
                </p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">.xlsx</span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">.xls</span>
                  <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-500 text-[10px] font-bold border border-gray-200">.csv</span>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Template downloads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="text-xs font-bold text-emerald-800 mb-1">Plantilla Excel</p>
                      <p className="text-[10px] text-emerald-600 mb-2">
                        Archivo .xlsx con formato, colores por sección, dropdowns de validación (Estado, Moneda, Facturante), fila de ejemplo y hoja de instrucciones.
                      </p>
                      <button onClick={downloadExcelTemplate}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg hover:shadow-sm transition-all">
                        ⬇ Descargar plantilla .xlsx
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="text-xs font-bold text-gray-700 mb-1">Plantilla CSV</p>
                      <p className="text-[10px] text-gray-500 mb-2">
                        Archivo .csv simple con encabezados. Útil si preferís un formato más liviano o ya tenés tus datos en texto plano.
                      </p>
                      <button onClick={() => {
                        const hdr = FIELDS.map(f => f.label).join(',')
                        const ex = FIELDS.map(f => f.example || '').join(',')
                        const blob = new Blob([`${hdr}\n${ex}`], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url; a.download = 'Zenda_Plantilla_Clientes.csv'; a.click()
                        URL.revokeObjectURL(url)
                      }}
                        className="text-[10px] font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:shadow-sm transition-all">
                        ⬇ Descargar plantilla .csv
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wide flex items-center gap-1.5">
                  💡 Tips para importar
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  {[
                    'La primera fila debe tener encabezados',
                    'El único campo obligatorio es Nombre',
                    'El código se auto-genera si no existe',
                    'Estado: Activa/Inactiva (o activo/si/1)',
                    'Moneda: ARS/USD (o pesos/$, dólares/U$S)',
                    'Fechas: formato YYYY-MM (ej: 2025-06)',
                    'Porcentajes: número sin % (ej: 12)',
                    'Duplicados se detectan y podés omitirlos',
                  ].map((tip, i) => (
                    <p key={i} className="text-[10px] text-blue-700 flex items-start gap-1">
                      <span className="text-blue-400 mt-0.5">•</span> {tip}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═════════ STEP: MAP ═════════ */}
          {step === 'map' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                <p className="text-xs text-blue-800 flex items-center gap-2">
                  <span className="text-sm">🔗</span>
                  Auto-detectamos <strong>{mappedCount}</strong> de {FIELDS.length} columnas.
                  Revisá el mapeo y ajustá si es necesario.
                </p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  mappedCount >= 5 ? 'bg-emerald-100 text-emerald-700' :
                  mappedCount >= 2 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {mappedCount}/{FIELDS.length}
                </span>
              </div>

              {/* Mapeo agrupado por sección */}
              {Object.entries(GROUP_COLORS).map(([groupKey, gc]) => (
                <div key={groupKey}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
                    style={{ color: `#${gc.header}` }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${gc.header}` }} />
                    {gc.label}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {FIELDS.filter(f => f.group === groupKey).map(field => {
                      const colIdx = mapping[field.key]
                      const isMapped = colIdx >= 0
                      return (
                        <div key={field.key}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
                            isMapped ? 'border-accent/30 bg-accent/5' : 'border-gray-100 bg-white'
                          }`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-textPrimary leading-tight">
                              {field.label} {field.required && <span className="text-red-400">*</span>}
                            </p>
                          </div>
                          <span className="text-gray-300 text-xs">←</span>
                          <select
                            value={colIdx >= 0 ? colIdx : -1}
                            onChange={e => setMapping(m => ({ ...m, [field.key]: parseInt(e.target.value) }))}
                            className={`text-[11px] border rounded-lg px-2 py-1.5 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                              isMapped ? 'border-accent/40 text-textPrimary font-medium' : 'border-gray-200 text-gray-400'
                            }`}
                          >
                            <option value={-1}>— No importar —</option>
                            {headers.map((h, i) => (
                              <option key={i} value={i}>Col {i + 1}: {h}</option>
                            ))}
                          </select>
                          {isMapped && <span className="text-accent text-xs">✓</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Sample data */}
              <div>
                <p className="text-[10px] font-bold text-textSecondary uppercase tracking-wide mb-2">
                  Muestra de datos (primeras 3 filas del archivo)
                </p>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-gray-50">
                        {headers.map((h, i) => {
                          const mappedField = FIELDS.find(f => mapping[f.key] === i)
                          return (
                            <th key={i} className="px-3 py-2 text-left font-semibold whitespace-nowrap border-b">
                              <span className="text-textSecondary">{h}</span>
                              {mappedField && (
                                <span className="ml-1 text-accent font-bold">→ {mappedField.label}</span>
                              )}
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 3).map((row, ri) => (
                        <tr key={ri} className="border-b border-gray-50">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-1.5 text-textPrimary whitespace-nowrap max-w-[200px] truncate">
                              {cell || <span className="text-gray-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ STEP: PREVIEW ═════════ */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
                  <p className="text-[10px] text-textSecondary">Total filas</p>
                  <p className="text-lg font-bold text-textPrimary">{previewData.length}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                  <p className="text-[10px] text-emerald-600">Listos</p>
                  <p className="text-lg font-bold text-emerald-700">{readyCount}</p>
                </div>
                {dupeCount > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                    <p className="text-[10px] text-amber-600">Duplicados</p>
                    <p className="text-lg font-bold text-amber-700">{dupeCount}</p>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                    <p className="text-[10px] text-red-600">Errores</p>
                    <p className="text-lg font-bold text-red-700">{errorCount}</p>
                  </div>
                )}
              </div>

              {dupeCount > 0 && (
                <label className="flex items-center gap-2 text-xs text-textSecondary cursor-pointer select-none bg-amber-50/50 px-3 py-2 rounded-lg border border-amber-100">
                  <input type="checkbox" checked={skipDuplicates} onChange={e => setSkipDuplicates(e.target.checked)}
                    className="rounded border-gray-300 text-accent focus:ring-accent/30" />
                  Omitir {dupeCount} duplicado{dupeCount > 1 ? 's' : ''} (ya existen en el maestro)
                </label>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-2 py-2 text-left font-semibold text-textSecondary w-8">#</th>
                      <th className="px-2 py-2 text-center font-semibold text-textSecondary w-8">✓</th>
                      {FIELDS.filter(f => mapping[f.key] >= 0).map(f => (
                        <th key={f.key} className="px-3 py-2 text-left font-semibold text-textSecondary whitespace-nowrap">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 50).map((row, i) => {
                      const hasError = row._errors.length > 0
                      const isDupe = row._isDupe
                      return (
                        <tr key={i} className={`border-b border-gray-50 ${
                          hasError ? 'bg-red-50/50' : isDupe ? 'bg-amber-50/50' : 'hover:bg-gray-50/50'
                        }`}>
                          <td className="px-2 py-1.5 text-textSecondary font-mono">{row._rowIdx + 2}</td>
                          <td className="px-2 py-1.5 text-center">
                            {hasError ? (
                              <span title={row._errors.join(', ')} className="text-red-500 cursor-help">✕</span>
                            ) : isDupe ? (
                              <span title="Duplicado" className="text-amber-500 cursor-help">⚠</span>
                            ) : (
                              <span className="text-emerald-500">✓</span>
                            )}
                          </td>
                          {FIELDS.filter(f => mapping[f.key] >= 0).map(f => (
                            <td key={f.key} className="px-3 py-1.5 text-textPrimary whitespace-nowrap max-w-[180px] truncate">
                              {row[f.key] !== undefined && row[f.key] !== '' ? String(row[f.key]) : <span className="text-gray-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {previewData.length > 50 && (
                  <div className="px-4 py-2 bg-gray-50 text-[10px] text-textSecondary text-center">
                    Mostrando 50 de {previewData.length} filas
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════ STEP: IMPORTING ═════════ */}
          {step === 'importing' && (
            <div className="max-w-md mx-auto text-center space-y-6 py-12">
              <div className="text-5xl animate-bounce">📥</div>
              <div>
                <p className="text-sm font-bold text-textPrimary">Importando clientes...</p>
                <p className="text-xs text-textSecondary mt-1">No cierres esta ventana</p>
              </div>
              <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%`, background: 'linear-gradient(90deg, #30b299, #05a779)' }}
                />
              </div>
              <p className="text-2xl font-bold text-accent">{importProgress}%</p>
            </div>
          )}

          {/* ═════════ STEP: DONE ═════════ */}
          {step === 'done' && (
            <div className="max-w-md mx-auto text-center space-y-6 py-12">
              <div className="text-5xl">{importResults.fail === 0 ? '🎉' : '⚠️'}</div>
              <p className="text-sm font-bold text-textPrimary">
                {importResults.fail === 0 ? 'Importación completada' : 'Importación con errores'}
              </p>
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{importResults.ok}</p>
                  <p className="text-[10px] text-textSecondary">Importados</p>
                </div>
                {importResults.skip > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-500">{importResults.skip}</p>
                    <p className="text-[10px] text-textSecondary">Omitidos</p>
                  </div>
                )}
                {importResults.fail > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{importResults.fail}</p>
                    <p className="text-[10px] text-textSecondary">Errores</p>
                  </div>
                )}
              </div>
              {importResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-left">
                  <p className="text-[10px] font-bold text-red-700 mb-1">Detalle de errores:</p>
                  {importResults.errors.slice(0, 10).map((err, i) => (
                    <p key={i} className="text-[10px] text-red-600">{err}</p>
                  ))}
                  {importResults.errors.length > 10 && (
                    <p className="text-[10px] text-red-400 mt-1">...y {importResults.errors.length - 10} más</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2">
          {step !== 'importing' && (
            <button onClick={step === 'done' ? () => { handleReset(); onClose() } : onClose}
              className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg text-textSecondary hover:bg-gray-50 transition-colors">
              {step === 'done' ? 'Cerrar' : 'Cancelar'}
            </button>
          )}

          <div className="flex-1" />

          {step === 'map' && (
            <>
              <button onClick={() => { handleReset() }}
                className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg text-textSecondary hover:bg-gray-50 transition-colors">
                ← Cambiar archivo
              </button>
              <button
                onClick={() => {
                  if (mapping.nombre < 0) {
                    alert('Necesitás mapear al menos la columna "Nombre".')
                    return
                  }
                  setStep('preview')
                }}
                className="px-5 py-2 text-xs font-semibold rounded-lg text-white shadow-md transition-colors"
                style={{ background: 'linear-gradient(135deg, #30b299, #05a779)' }}>
                Siguiente: Preview →
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button onClick={() => setStep('map')}
                className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg text-textSecondary hover:bg-gray-50 transition-colors">
                ← Volver al mapeo
              </button>
              <button
                onClick={handleStartImport}
                disabled={readyCount === 0}
                className="px-5 py-2 text-xs font-semibold rounded-lg text-white shadow-md transition-colors disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #30b299, #05a779)' }}>
                📥 Importar {readyCount} cliente{readyCount !== 1 ? 's' : ''}
              </button>
            </>
          )}

          {step === 'done' && (
            <button onClick={() => { handleReset(); onClose() }}
              className="px-5 py-2 text-xs font-semibold rounded-lg text-white shadow-md transition-colors"
              style={{ background: 'linear-gradient(135deg, #30b299, #05a779)' }}>
              ✓ Listo
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-in { animation: slideIn 200ms ease-out; }
      `}</style>
    </>
  )
}
