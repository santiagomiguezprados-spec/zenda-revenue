/**
 * MaestroClientes.jsx
 * Maestro de clientes con estructura de fees, alertas de actualización
 * y CRUD completo. Persistido en Supabase.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { listClientes, createCliente, updateCliente, deleteCliente, getNextCodigo, getStorageMode } from '../services/clientesMaestroService'
import { formatPct } from '../utils/formatters'
import clientesSeed from '../data/clientesSeed'
import CsvImporter from '../components/CsvImporter'

// ── Constantes ──────────────────────────────────────────────────────────────
const MES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const FACTURANTES = ['SRL', 'LLC', 'SAC', 'Liam']
const EMPTY_FORM = {
  codigo: '', nombre: '', estado: 'Activa', moneda: 'ARS', contrato: '',
  fechaVtoTerminacion: '', facturante: '', comentario: '',
  lastUpdate: '', porcentajeUltimaActualizacion: '', nextUpdate: '',
  limiteMinimo: '', feeMinimo: '',
  escala1Limite: '', escala1Porcentaje: '',
  escala2Limite: '', escala2Porcentaje: '',
  escala3Limite: '', escala3Porcentaje: '',
  escala4Limite: '', escala4Porcentaje: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatYM(ym) {
  if (!ym) return '—'
  const [y, m] = ym.split('-')
  return `${MES_CORTO[parseInt(m) - 1] || m}-${y.slice(2)}`
}

function currentYM() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getAlertLevel(nextUpdate) {
  if (!nextUpdate) return null
  const now = new Date()
  const [y, m] = nextUpdate.split('-').map(Number)
  const target = new Date(y, m - 1, 1)
  const diffDays = (target - now) / (1000 * 60 * 60 * 24)
  if (diffDays <= 0) return 'urgent'
  if (diffDays <= 30) return 'upcoming'
  if (diffDays <= 60) return 'warning'
  return null
}

function alertColor(level) {
  if (level === 'urgent') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🔴', label: 'Vencido' }
  if (level === 'upcoming') return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '🟠', label: 'Próximo' }
  if (level === 'warning') return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '🟡', label: 'Aviso' }
  return { bg: '', border: '', text: '', icon: '', label: '' }
}

function contratoStatus(client) {
  if (client.estado === 'Inactiva') return 'inactive'
  if (client.contrato && (client.contrato.startsWith('http') || client.contrato.startsWith('/'))) return 'ok'
  if (client.contrato) return 'pending'
  return 'missing'
}

function contratoIndicator(status) {
  if (status === 'ok') return { color: 'bg-emerald-400', label: 'Contrato OK' }
  if (status === 'pending') return { color: 'bg-yellow-400', label: 'Pendiente firma' }
  if (status === 'missing') return { color: 'bg-red-400', label: 'Sin contrato' }
  return { color: 'bg-gray-300', label: 'Inactivo' }
}

/** Calcula periodicidad en meses entre dos YYYY-MM */
function calcPeriodicity(from, to) {
  if (!from || !to) return 12
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  const diff = (ty * 12 + tm) - (fy * 12 + fm)
  return diff > 0 ? diff : 12
}

/** Suma meses a un YYYY-MM */
function addMonths(ym, months) {
  const [y, m] = ym.split('-').map(Number)
  const total = (y * 12 + m - 1) + months
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return `${ny}-${String(nm).padStart(2, '0')}`
}

// ── Componente principal ────────────────────────────────────────────────────
export default function MaestroClientes() {
  const { session } = useAuth()
  const userId = session && session !== 'bypass' ? session.user?.id : null

  // ── State ─────────────────────────────────────────────────────────────────
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ estado: '', moneda: '', facturante: '' })
  const [sortKey, setSortKey] = useState('codigo')
  const [sortDir, setSortDir] = useState('asc')
  const [panel, setPanel] = useState(null) // null | 'new' | client object
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [showAlerts, setShowAlerts] = useState(true)
  const [updateConfirm, setUpdateConfirm] = useState(null) // client for fee update
  const [updatePct, setUpdatePct] = useState('')
  const [storageMode, setStorageMode] = useState('checking')
  const [toast, setToast] = useState(null) // { type: 'success'|'error', msg }
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [showCsvImporter, setShowCsvImporter] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // client to delete

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    const data = await listClientes()
    setClientes(data)
    setStorageMode(getStorageMode())
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Computed: alerts ──────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    return clientes
      .filter(c => c.estado === 'Activa' && c.nextUpdate)
      .map(c => {
        const level = getAlertLevel(c.nextUpdate)
        return level ? { ...c, alertLevel: level } : null
      })
      .filter(Boolean)
      .sort((a, b) => {
        const order = { urgent: 0, upcoming: 1, warning: 2 }
        return (order[a.alertLevel] || 99) - (order[b.alertLevel] || 99)
      })
  }, [clientes])

  // ── Computed: metrics ─────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const activos = clientes.filter(c => c.estado === 'Activa')
    return {
      totalActivos: activos.length,
      activosARS: activos.filter(c => c.moneda === 'ARS').length,
      activosUSD: activos.filter(c => c.moneda === 'USD').length,
      inactivos: clientes.filter(c => c.estado === 'Inactiva').length,
      alertas: alerts.length,
      urgentes: alerts.filter(a => a.alertLevel === 'urgent').length,
    }
  }, [clientes, alerts])

  // ── Computed: facturantes únicos ──────────────────────────────────────────
  const facturantesUnicos = useMemo(() => {
    const set = new Set(clientes.map(c => c.facturante).filter(Boolean))
    FACTURANTES.forEach(f => set.add(f))
    return [...set].sort()
  }, [clientes])

  // ── Computed: filtered + sorted ───────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = clientes.filter(c => {
      if (filters.estado && c.estado !== filters.estado) return false
      if (filters.moneda && c.moneda !== filters.moneda) return false
      if (filters.facturante && c.facturante !== filters.facturante) return false
      if (search && !c.nombre.toLowerCase().includes(search.toLowerCase()) && !String(c.codigo).includes(search)) return false
      return true
    })
    result.sort((a, b) => {
      const aVal = a[sortKey] ?? ''
      const bVal = b[sortKey] ?? ''
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'es')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [clientes, filters, search, sortKey, sortDir])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSort = useCallback((key) => {
    setSortKey(prev => {
      if (prev === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return key }
      setSortDir('asc')
      return key
    })
  }, [])

  const openNewClient = useCallback(async () => {
    const next = await getNextCodigo()
    setForm({ ...EMPTY_FORM, codigo: next })
    setPanel('new')
  }, [])

  const openEditClient = useCallback((client) => {
    setForm({
      codigo: client.codigo || '',
      nombre: client.nombre || '',
      estado: client.estado || 'Activa',
      moneda: client.moneda || 'ARS',
      contrato: client.contrato || '',
      fechaVtoTerminacion: client.fechaVtoTerminacion || '',
      facturante: client.facturante || '',
      comentario: client.comentario || '',
      lastUpdate: client.lastUpdate || '',
      porcentajeUltimaActualizacion: client.porcentajeUltimaActualizacion ?? '',
      nextUpdate: client.nextUpdate || '',
      limiteMinimo: client.limiteMinimo || '',
      feeMinimo: client.feeMinimo || '',
      escala1Limite: client.escala1Limite || '',
      escala1Porcentaje: client.escala1Porcentaje ?? '',
      escala2Limite: client.escala2Limite || '',
      escala2Porcentaje: client.escala2Porcentaje ?? '',
      escala3Limite: client.escala3Limite || '',
      escala3Porcentaje: client.escala3Porcentaje ?? '',
      escala4Limite: client.escala4Limite || '',
      escala4Porcentaje: client.escala4Porcentaje ?? '',
    })
    setPanel(client)
  }, [])

  const closePanel = useCallback(() => { setPanel(null); setForm(EMPTY_FORM) }, [])

  const handleSave = useCallback(async () => {
    if (!form.nombre?.trim() || !form.codigo) return
    // Check duplicates
    const isDupe = clientes.some(c =>
      (panel === 'new' || c.id !== panel?.id) &&
      (c.nombre.toLowerCase() === form.nombre.trim().toLowerCase() || c.codigo === Number(form.codigo))
    )
    if (isDupe) { alert('Ya existe un cliente con ese nombre o código.'); return }

    setSaving(true)
    const data = {
      ...form,
      codigo: Number(form.codigo),
      porcentajeUltimaActualizacion: form.porcentajeUltimaActualizacion === '' ? null : Number(form.porcentajeUltimaActualizacion),
      escala1Porcentaje: form.escala1Porcentaje === '' ? null : Number(form.escala1Porcentaje),
      escala2Porcentaje: form.escala2Porcentaje === '' ? null : Number(form.escala2Porcentaje),
      escala3Porcentaje: form.escala3Porcentaje === '' ? null : Number(form.escala3Porcentaje),
      escala4Porcentaje: form.escala4Porcentaje === '' ? null : Number(form.escala4Porcentaje),
    }

    let result
    if (panel === 'new') {
      result = await createCliente(data, userId)
    } else {
      result = await updateCliente(panel.id, data, userId)
    }
    setStorageMode(getStorageMode())
    if (!result) {
      setToast({ type: 'error', msg: 'Error al guardar. Intentá de nuevo.' })
      setSaving(false)
      return
    }
    await loadAll()
    closePanel()
    setSaving(false)
    setToast({ type: 'success', msg: panel === 'new' ? 'Cliente creado' : 'Cliente actualizado' })
  }, [form, panel, clientes, userId, loadAll, closePanel])

  const handleArchive = useCallback(async () => {
    if (!panel?.id) return
    setSaving(true)
    await updateCliente(panel.id, { estado: 'Inactiva' }, userId)
    await loadAll()
    closePanel()
    setSaving(false)
  }, [panel, userId, loadAll, closePanel])

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm?.id) return
    setSaving(true)
    await deleteCliente(deleteConfirm.id)
    await loadAll()
    setDeleteConfirm(null)
    closePanel()
    setSaving(false)
    setToast({ type: 'success', msg: `"${deleteConfirm.nombre}" eliminado.` })
  }, [deleteConfirm, loadAll, closePanel])

  const handleMarkUpdate = useCallback(async () => {
    if (!updateConfirm?.id || !updatePct) return
    const pct = Number(updatePct)
    const periodicity = calcPeriodicity(updateConfirm.lastUpdate, updateConfirm.nextUpdate)
    const now = currentYM()
    const newNext = addMonths(now, periodicity)
    await updateCliente(updateConfirm.id, {
      lastUpdate: now,
      porcentajeUltimaActualizacion: pct,
      nextUpdate: newNext,
    }, userId)
    await loadAll()
    setUpdateConfirm(null)
    setUpdatePct('')
  }, [updateConfirm, updatePct, userId, loadAll])

  const setF = useCallback((key, value) => setForm(f => ({ ...f, [key]: value })), [])

  // ── Importar datos iniciales desde seed ──────────────────────────────────
  const handleImportSeed = useCallback(async () => {
    if (importing) return
    const existingCodes = new Set(clientes.map(c => c.codigo))
    const toImport = clientesSeed.filter(c => !existingCodes.has(c.codigo))
    if (toImport.length === 0) {
      setToast({ type: 'success', msg: 'Todos los clientes ya están cargados.' })
      return
    }
    setImporting(true)
    setImportProgress(0)
    let ok = 0
    let fail = 0
    for (let i = 0; i < toImport.length; i++) {
      try {
        const result = await createCliente(toImport[i], userId)
        if (result) ok++; else fail++
      } catch { fail++ }
      setImportProgress(Math.round(((i + 1) / toImport.length) * 100))
    }
    await loadAll()
    setImporting(false)
    setImportProgress(0)
    setToast({
      type: fail === 0 ? 'success' : 'error',
      msg: `Importados ${ok} clientes${fail > 0 ? ` (${fail} errores)` : ''}.`,
    })
  }, [clientes, importing, userId, loadAll])

  // ── CSV import callback ───────────────────────────────────────────────────
  const handleCsvImportRow = useCallback(async (data) => {
    // Auto-generate codigo if missing
    if (!data.codigo) {
      const next = await getNextCodigo()
      data.codigo = next
    }
    return await createCliente(data, userId)
  }, [userId])

  const handleCsvImportDone = useCallback(async () => {
    await loadAll()
    setShowCsvImporter(false)
    setToast({ type: 'success', msg: 'Importación CSV completada.' })
  }, [loadAll])

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-textPrimary">Maestro de Clientes</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-textSecondary">
              Gestión de contratos, fees y alertas de actualización.
            </p>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              storageMode === 'supabase' ? 'bg-emerald-100 text-emerald-700' :
              storageMode === 'local' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {storageMode === 'supabase' ? '☁ Supabase' : storageMode === 'local' ? '💾 Local' : '⟳ ...'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCsvImporter(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg border-2 border-accent text-accent hover:bg-accent hover:text-white transition-colors flex items-center gap-1.5">
            📥 Importar Excel / CSV
          </button>
          {clientes.length < clientesSeed.length && (
            <button onClick={handleImportSeed} disabled={importing}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-textSecondary hover:border-accent hover:text-accent transition-colors disabled:opacity-60 flex items-center gap-1.5">
              {importing ? (
                <>
                  <span className="animate-spin text-sm">⟳</span>
                  <span>Importando… {importProgress}%</span>
                </>
              ) : (
                <>📋 Seed ({clientesSeed.length - clientes.length})</>
              )}
            </button>
          )}
          <button onClick={openNewClient}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors shadow-md"
            style={{ background: 'linear-gradient(135deg, #30b299, #05a779)' }}>
            + Agregar cliente
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
          <p className="text-xs text-textSecondary mb-1">Activos ARS</p>
          <p className="text-xl font-bold text-blue-600">{metrics.activosARS}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
          <p className="text-xs text-textSecondary mb-1">Activos USD</p>
          <p className="text-xl font-bold text-emerald-600">{metrics.activosUSD}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
          <p className="text-xs text-textSecondary mb-1">Total Activos</p>
          <p className="text-xl font-bold text-textPrimary">{metrics.totalActivos}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
          <p className="text-xs text-textSecondary mb-1">Inactivos</p>
          <p className="text-xl font-bold text-gray-400">{metrics.inactivos}</p>
        </div>
        <div className={`rounded-xl shadow-sm p-3 border ${metrics.urgentes > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <p className="text-xs text-textSecondary mb-1">⚠ Alertas Fee</p>
          <p className={`text-xl font-bold ${metrics.urgentes > 0 ? 'text-red-600' : metrics.alertas > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
            {metrics.alertas}
            {metrics.urgentes > 0 && <span className="text-xs font-normal ml-1">({metrics.urgentes} urgentes)</span>}
          </p>
        </div>
      </div>

      {/* Alertas de fee */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button onClick={() => setShowAlerts(!showAlerts)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
            <span className="text-sm font-bold text-textPrimary flex items-center gap-2">
              🔔 Alertas de actualización de fees
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">{alerts.length}</span>
            </span>
            <span className="text-textSecondary text-sm">{showAlerts ? '▾' : '▸'}</span>
          </button>

          {showAlerts && (
            <div className="px-5 pb-4">
              <div className="space-y-2">
                {alerts.map(a => {
                  const ac = alertColor(a.alertLevel)
                  return (
                    <div key={a.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${ac.bg} ${ac.border}`}>
                      <span className="text-base flex-shrink-0">{ac.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-textPrimary">{a.nombre}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${a.moneda === 'USD' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {a.moneda}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ac.bg} ${ac.text}`}>
                            {ac.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-textSecondary mt-0.5">
                          Última: {formatYM(a.lastUpdate)} ({a.porcentajeUltimaActualizacion != null ? `${a.porcentajeUltimaActualizacion}%` : '—'})
                          {' · '}Próxima: <strong className={ac.text}>{formatYM(a.nextUpdate)}</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => { setUpdateConfirm(a); setUpdatePct(String(a.porcentajeUltimaActualizacion || '')) }}
                        className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-white border border-gray-200 text-textPrimary hover:border-accent hover:text-accent transition-colors flex-shrink-0 shadow-sm">
                        ✓ Marcar actualizada
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal confirmar actualización */}
      {updateConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setUpdateConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-textPrimary">Marcar actualización de fee</h3>
            <p className="text-xs text-textSecondary">
              <strong>{updateConfirm.nombre}</strong> · {updateConfirm.moneda}
            </p>
            <div>
              <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-wide">% aplicado</label>
              <input type="number" value={updatePct} onChange={e => setUpdatePct(e.target.value)}
                className="w-full mt-1 text-sm border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder="Ej: 5" autoFocus />
            </div>
            <p className="text-[10px] text-textSecondary">
              Periodicidad detectada: <strong>{calcPeriodicity(updateConfirm.lastUpdate, updateConfirm.nextUpdate)} meses</strong>
              <br />Próxima actualización sugerida: <strong>{formatYM(addMonths(currentYM(), calcPeriodicity(updateConfirm.lastUpdate, updateConfirm.nextUpdate)))}</strong>
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setUpdateConfirm(null)}
                className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg text-textSecondary hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleMarkUpdate} disabled={!updatePct}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #30b299, #05a779)' }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg">🗑</div>
              <div>
                <h3 className="text-sm font-bold text-textPrimary">Eliminar cliente</h3>
                <p className="text-[10px] text-textSecondary">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-xs text-red-800">
                ¿Estás seguro de eliminar a <strong>{deleteConfirm.nombre}</strong>?
              </p>
              <p className="text-[10px] text-red-600 mt-1">
                Código: {deleteConfirm.codigo} · {deleteConfirm.moneda} · {deleteConfirm.facturante || '—'}
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg text-textSecondary hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">
                {saving ? '⟳ Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <input type="text" placeholder="Buscar por nombre o código..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] text-xs border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          <select value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/30">
            <option value="">Todos los estados</option>
            <option value="Activa">Activa</option>
            <option value="Inactiva">Inactiva</option>
          </select>
          <select value={filters.moneda} onChange={e => setFilters(f => ({ ...f, moneda: e.target.value }))}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/30">
            <option value="">Todas las monedas</option>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
          <select value={filters.facturante} onChange={e => setFilters(f => ({ ...f, facturante: e.target.value }))}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/30">
            <option value="">Todos los facturantes</option>
            {facturantesUnicos.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          {(search || Object.values(filters).some(Boolean)) && (
            <button onClick={() => { setSearch(''); setFilters({ estado: '', moneda: '', facturante: '' }) }}
              className="text-xs text-red-500 hover:underline px-2">Limpiar</button>
          )}
          <span className="text-[10px] text-textSecondary ml-auto">{filtered.length} clientes</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {[
                  { key: null, label: '', w: 'w-6' },
                  { key: 'codigo', label: '#' },
                  { key: 'nombre', label: 'Nombre' },
                  { key: 'estado', label: 'Estado' },
                  { key: 'moneda', label: 'Moneda' },
                  { key: 'facturante', label: 'Facturante' },
                  { key: null, label: 'Fee Mín.' },
                  { key: null, label: 'E1 %' },
                  { key: null, label: 'E2 %' },
                  { key: null, label: 'E3 %' },
                  { key: 'lastUpdate', label: 'Últ. Act.' },
                  { key: null, label: '%' },
                  { key: 'nextUpdate', label: 'Próx. Act.' },
                  { key: null, label: '📎' },
                ].map((col, i) => (
                  <th key={i}
                    onClick={() => col.key && handleSort(col.key)}
                    className={`px-3 py-2.5 text-left font-semibold text-textSecondary whitespace-nowrap ${col.w || ''} ${col.key ? 'cursor-pointer hover:text-textPrimary select-none' : ''}`}>
                    {col.label}
                    {col.key && sortKey === col.key && (
                      <span className="ml-0.5 text-accent">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const cs = contratoStatus(c)
                const ci = contratoIndicator(cs)
                const alert = c.estado === 'Activa' && c.nextUpdate ? getAlertLevel(c.nextUpdate) : null
                const ac = alert ? alertColor(alert) : null
                return (
                  <tr key={c.id}
                    onClick={() => openEditClient(c)}
                    className="border-b border-gray-50 hover:bg-gray-50/80 cursor-pointer transition-colors group">
                    {/* Indicador contrato */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${ci.color}`} title={ci.label} />
                    </td>
                    {/* Código */}
                    <td className="px-3 py-2.5 text-textSecondary font-mono">{c.codigo}</td>
                    {/* Nombre */}
                    <td className="px-3 py-2.5 font-semibold text-textPrimary max-w-[180px] truncate">{c.nombre}</td>
                    {/* Estado */}
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>{c.estado}</span>
                    </td>
                    {/* Moneda */}
                    <td className="px-3 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        c.moneda === 'USD' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>{c.moneda}</span>
                    </td>
                    {/* Facturante */}
                    <td className="px-3 py-2.5 text-textSecondary">{c.facturante || '—'}</td>
                    {/* Fee Mínimo */}
                    <td className="px-3 py-2.5 text-textSecondary font-medium">{c.feeMinimo || '—'}</td>
                    {/* Escala 1 */}
                    <td className="px-3 py-2.5 text-textPrimary font-semibold">
                      {c.escala1Porcentaje != null ? `${c.escala1Porcentaje}%` : '—'}
                    </td>
                    {/* Escala 2 */}
                    <td className="px-3 py-2.5 text-textSecondary">
                      {c.escala2Porcentaje != null ? `${c.escala2Porcentaje}%` : '—'}
                    </td>
                    {/* Escala 3 */}
                    <td className="px-3 py-2.5 text-textSecondary">
                      {c.escala3Porcentaje != null ? `${c.escala3Porcentaje}%` : '—'}
                    </td>
                    {/* Last Update */}
                    <td className="px-3 py-2.5 text-textSecondary">{formatYM(c.lastUpdate)}</td>
                    {/* % */}
                    <td className="px-3 py-2.5 text-textSecondary">
                      {c.porcentajeUltimaActualizacion != null ? `${c.porcentajeUltimaActualizacion}%` : '—'}
                    </td>
                    {/* Next Update */}
                    <td className="px-3 py-2.5">
                      {c.nextUpdate ? (
                        <span className={`inline-flex items-center gap-1 ${ac ? ac.text : 'text-textSecondary'}`}>
                          {ac && <span className="text-[10px]">{ac.icon}</span>}
                          <span className={ac ? 'font-bold' : ''}>{formatYM(c.nextUpdate)}</span>
                        </span>
                      ) : '—'}
                    </td>
                    {/* Contrato link */}
                    <td className="px-3 py-2.5">
                      {c.contrato && c.contrato.startsWith('http') ? (
                        <a href={c.contrato} target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-accent hover:underline text-[10px] font-bold">
                          🔗
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-5 py-10 text-center text-textSecondary text-sm italic">
                    {clientes.length === 0
                      ? 'No hay clientes cargados. Usá "Importar clientes" para cargar los datos iniciales.'
                      : 'Sin resultados para los filtros aplicados.'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Panel lateral de edición/creación ─── */}
      {panel !== null && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={closePanel} />
          <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-in">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-bold text-textPrimary">
                {panel === 'new' ? '+ Nuevo cliente' : `Editar: ${panel.nombre}`}
              </h2>
              <button onClick={closePanel} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Sección: Información básica */}
              <section>
                <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Información básica
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Código *" value={form.codigo}
                    onChange={v => setF('codigo', v)} type="number" />
                  <Field label="Nombre *" value={form.nombre}
                    onChange={v => setF('nombre', v)} span2 />
                  <Field label="Estado" value={form.estado}
                    onChange={v => setF('estado', v)} type="select" options={['Activa', 'Inactiva']} />
                  <Field label="Moneda" value={form.moneda}
                    onChange={v => setF('moneda', v)} type="select" options={['ARS', 'USD']} />
                  <Field label="Facturante" value={form.facturante}
                    onChange={v => setF('facturante', v)} type="select-free" options={facturantesUnicos} />
                </div>
              </section>

              {/* Sección: Contrato */}
              <section>
                <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Contrato
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <Field label="URL Contrato" value={form.contrato}
                    onChange={v => setF('contrato', v)} placeholder="https://..." />
                  <Field label="Condición Vto / Terminación" value={form.fechaVtoTerminacion}
                    onChange={v => setF('fechaVtoTerminacion', v)} placeholder="Ej: Indefinido - 30 dias" />
                  <Field label="Comentario" value={form.comentario}
                    onChange={v => setF('comentario', v)} type="textarea" />
                </div>
              </section>

              {/* Sección: Actualización de fees */}
              <section>
                <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Actualización de fees
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Última actualización" value={form.lastUpdate}
                    onChange={v => setF('lastUpdate', v)} type="month" />
                  <Field label="% aplicado" value={form.porcentajeUltimaActualizacion}
                    onChange={v => setF('porcentajeUltimaActualizacion', v)} type="number" placeholder="Ej: 5" />
                  <Field label="Próxima actualización" value={form.nextUpdate}
                    onChange={v => setF('nextUpdate', v)} type="month" />
                </div>
              </section>

              {/* Sección: Estructura de fees */}
              <section>
                <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Estructura de fees
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Límite Mínimo" value={form.limiteMinimo}
                    onChange={v => setF('limiteMinimo', v)} placeholder="Ej: ARS 11.600.000" />
                  <Field label="Fee Mínimo" value={form.feeMinimo}
                    onChange={v => setF('feeMinimo', v)} placeholder="Ej: ARS 1.400.000" />
                </div>
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="grid grid-cols-2 gap-3 mt-2">
                    <Field label={`Escala ${n} — Límite`} value={form[`escala${n}Limite`]}
                      onChange={v => setF(`escala${n}Limite`, v)} placeholder={n === 3 ? 'Ej: Sin Limite' : `Ej: ARS 20.000.000`} />
                    <Field label={`Escala ${n} — %`} value={form[`escala${n}Porcentaje`]}
                      onChange={v => setF(`escala${n}Porcentaje`, v)} type="number" placeholder="Ej: 12" />
                  </div>
                ))}
              </section>
            </div>

            {/* Panel footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2">
              {panel !== 'new' && (
                <div className="flex items-center gap-2 mr-auto">
                  <button onClick={() => setDeleteConfirm(panel)}
                    className="px-3 py-2 text-xs font-medium border border-red-200 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors">
                    🗑 Eliminar
                  </button>
                  <button onClick={handleArchive}
                    className="px-3 py-2 text-xs font-medium border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                    📦 Archivar
                  </button>
                </div>
              )}
              <button onClick={closePanel}
                className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg text-textSecondary hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.nombre?.trim()}
                className="px-5 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50 transition-colors shadow-md"
                style={{ background: 'linear-gradient(135deg, #30b299, #05a779)' }}>
                {saving ? '⟳ Guardando...' : panel === 'new' ? 'Crear cliente' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* CSV Importer modal */}
      <CsvImporter
        open={showCsvImporter}
        onClose={async () => { setShowCsvImporter(false); await loadAll() }}
        onImport={handleCsvImportRow}
        existingClientes={clientes}
      />

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 200ms ease-out; }
      `}</style>
    </div>
  )
}

// ── Field component ─────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder, options, span2 }) {
  const base = "w-full text-xs border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"

  if (type === 'select') {
    return (
      <div className={span2 ? 'col-span-2' : ''}>
        <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-wide block mb-1">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className={base}>
          {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  if (type === 'select-free') {
    return (
      <div className={span2 ? 'col-span-2' : ''}>
        <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-wide block mb-1">{label}</label>
        <input list={`dl-${label}`} value={value} onChange={e => onChange(e.target.value)} className={base} placeholder={placeholder} />
        <datalist id={`dl-${label}`}>
          {(options || []).map(o => <option key={o} value={o} />)}
        </datalist>
      </div>
    )
  }

  if (type === 'textarea') {
    return (
      <div className={span2 ? 'col-span-2' : ''}>
        <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-wide block mb-1">{label}</label>
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className={base} placeholder={placeholder} />
      </div>
    )
  }

  if (type === 'month') {
    return (
      <div className={span2 ? 'col-span-2' : ''}>
        <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-wide block mb-1">{label}</label>
        <input type="month" value={value} onChange={e => onChange(e.target.value)} className={base} />
      </div>
    )
  }

  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="text-[10px] font-semibold text-textSecondary uppercase tracking-wide block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={base} placeholder={placeholder} />
    </div>
  )
}
