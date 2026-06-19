import { useMemo } from 'react'
import DataTable from '../components/DataTable'
import ClientLineChart from '../components/Charts/LineChart'
import KPICard from '../components/KPICard'
import { useClientFilters } from '../hooks/useFilters'
import { useVentasDolarizadasData } from '../hooks/useSheetData'
import clientsFallback from '../data/clients_sales.json'
import { formatUSD, formatPct } from '../utils/formatters'
import { usePeriodValues, MES_LABELS } from '../hooks/useGlobalPeriod'

function mesLabel(col) {
  const [abr, yr] = col.split('-')
  return `${MES_LABELS[abr] || abr} ${yr ? `'${yr}` : ''}`
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))]
}

export default function Clientes() {
  const { data: ventasData, source, loading } = useVentasDolarizadasData()

  // Normalizar datos: si vienen de sheets (con meses tipo "ene-26") o de JSON local (con "Ene")
  const isSheets = source === 'sheets' && ventasData && ventasData.length > 0
  const meses = isSheets ? (ventasData[0]?.meses || []) : []

  // Periodo global
  const { selectedMonth, selectedMonths, periodLabel } = usePeriodValues()

  // Adaptar datos locales al mismo formato si no hay sheets
  const clientsData = useMemo(() => {
    if (isSheets) return ventasData
    return clientsFallback
  }, [isSheets, ventasData])

  // Determinar qué key de mes usar para la columna principal
  const mesKey = isSheets ? selectedMonth : 'Ene'
  const mesDisplay = isSheets ? periodLabel : 'Enero'

  const { filtered, filters, setFilters, sortConfig, requestSort } = useClientFilters(clientsData || [])

  const activos = useMemo(() =>
    (clientsData || []).filter(c => !c.estado || c.estado === 'Activo'),
    [clientsData]
  )

  const totalRevenue = activos.reduce((s, c) => {
    if (isSheets) return s + selectedMonths.reduce((ms, m) => ms + (c.ventaMensual?.[m] || 0), 0)
    return s + (c.ventaMensual?.['Ene'] || 0)
  }, 0)
  const promedio = activos.length ? totalRevenue / activos.length : 0
  const enCero = activos.filter(c => {
    if (isSheets) {
      const val = selectedMonths.reduce((s, m) => s + (c.ventaMensual?.[m] || 0), 0)
      return !val
    }
    return !(c.ventaMensual?.['Ene'])
  }).length
  const pctCero = activos.length ? (enCero / activos.length * 100).toFixed(0) : 0

  // Top 8 by current month revenue for line chart
  const top8 = useMemo(() => {
    return [...(clientsData || [])]
      .sort((a, b) => {
        const av = isSheets ? selectedMonths.reduce((s, m) => s + (a.ventaMensual?.[m] || 0), 0) : (a.ventaMensual?.['Ene'] || 0)
        const bv = isSheets ? selectedMonths.reduce((s, m) => s + (b.ventaMensual?.[m] || 0), 0) : (b.ventaMensual?.['Ene'] || 0)
        return bv - av
      })
      .slice(0, 8)
  }, [clientsData, selectedMonths, isSheets])

  const lineData = useMemo(() => {
    if (isSheets) {
      return meses.map(col => {
        const row = { mes: mesLabel(col) }
        top8.forEach(c => { row[c.nombre] = c.ventaMensual?.[col] || 0 })
        return row
      })
    }
    const MESES_LOCAL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return MESES_LOCAL.map(mes => {
      const row = { mes }
      top8.forEach(c => { row[c.nombre] = c.ventaMensual?.[mes] || 0 })
      return row
    })
  }, [top8, meses, isSheets])

  const getRevenue = (ventaMensual) => {
    if (isSheets) return selectedMonths.reduce((s, m) => s + (ventaMensual?.[m] || 0), 0)
    return ventaMensual?.['Ene'] || 0
  }

  const columns = [
    { key: 'nombre', label: 'Cliente', sortable: true, render: v => <span className="font-medium text-textPrimary">{v}</span> },
    {
      key: 'tipo', label: 'Tipo', sortable: true,
      render: v => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
          ${v === 'A' ? 'bg-primary/10 text-primary' : v === 'B' ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-textSecondary'}`}>
          {v}
        </span>
      )
    },
    { key: 'categoria', label: 'Categoría', sortable: true, render: v => <span className="text-xs text-textSecondary">{v}</span> },
    {
      key: 'pais', label: 'País', sortable: true,
      render: v => {
        const flags = { Argentina: '🇦🇷', España: '🇪🇸', Peru: '🇵🇪', Perú: '🇵🇪' }
        return <span className="text-xs">{flags[v] || ''} {v}</span>
      }
    },
    {
      key: 'ventaMensual', label: `${mesDisplay} (USD)`, sortable: false, align: 'right',
      render: v => {
        const val = getRevenue(v)
        return <span className={`font-semibold text-sm ${val === 0 ? 'text-danger' : 'text-textPrimary'}`}>{formatUSD(val)}</span>
      }
    },
    {
      key: 'ventaMensual', id: 'promedio', label: 'Promedio', sortable: false, align: 'right',
      render: v => {
        const vals = Object.values(v || {}).filter(x => typeof x === 'number' && x > 0)
        const avg = vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : 0
        return <span className="text-xs text-textSecondary">{formatUSD(Math.round(avg))}</span>
      }
    },
    {
      key: 'estado', label: 'Estado', sortable: true,
      render: v => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
          ${v === 'Activo' ? 'bg-success/10 text-success' : 'bg-gray-100 text-textSecondary'}`}>
          {v}
        </span>
      )
    },
  ]

  const tipos = uniq((clientsData || []).map(c => c.tipo))
  const categorias = uniq((clientsData || []).map(c => c.categoria))
  const paises = uniq((clientsData || []).map(c => c.pais))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Source badge */}
      {isSheets && (
        <div className="flex items-center gap-2 text-xs text-textSecondary">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>Ventas reales · {mesDisplay} · Google Sheets</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Clientes Activos" value={activos.length} color="accent" icon="👥" />
        <KPICard title={`Revenue ${mesDisplay}`} value={formatUSD(totalRevenue)} color="default" icon="💵" />
        <KPICard title="Promedio por Cliente" value={formatUSD(Math.round(promedio))} color="success" icon="📊" />
        <KPICard
          title={`En $0 (${mesDisplay})`}
          value={`${enCero} clientes (${pctCero}%)`}
          color={enCero > 0 ? 'danger' : 'success'}
          icon="⚠️"
        />
      </div>

      {/* Line chart */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-textPrimary mb-4">Evolución mensual — Top 8 Clientes (USD)</h2>
        <ClientLineChart data={lineData} clients={top8.map(c => c.nombre)} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filters.tipo}
            onChange={e => setFilters(f => ({ ...f, tipo: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Todos los tipos</option>
            {tipos.map(t => <option key={t} value={t}>Tipo {t}</option>)}
          </select>
          <select
            value={filters.categoria}
            onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filters.pais}
            onChange={e => setFilters(f => ({ ...f, pais: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Todos los países</option>
            {paises.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={filters.estado}
            onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => setFilters({ tipo: '', categoria: '', pais: '', estado: '' })}
              className="text-sm text-danger hover:underline px-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <p className="text-xs text-textSecondary mb-3">{filtered.length} clientes encontrados</p>
        <DataTable columns={columns} data={filtered} onSort={requestSort} sortConfig={sortConfig} compact />
      </div>
    </div>
  )
}
