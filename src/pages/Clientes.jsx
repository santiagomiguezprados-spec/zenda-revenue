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

  // Enriquecer con campos numéricos flat para que el sort del hook funcione
  const enrichedClients = useMemo(() =>
    (clientsData || []).map(c => {
      const feeActual = isSheets
        ? selectedMonths.reduce((s, m) => s + (c.ventaMensual?.[m] || 0), 0)
        : (c.ventaMensual?.['Ene'] || 0)
      const vals = Object.values(c.ventaMensual || {}).filter(x => typeof x === 'number' && x > 0)
      const _promedio = vals.length ? Math.round(vals.reduce((s, x) => s + x, 0) / vals.length) : 0
      return { ...c, _feeActual: feeActual, _promedio }
    }),
    [clientsData, isSheets, selectedMonths]
  )

  const { filtered, filters, setFilters, sortConfig, requestSort } = useClientFilters(enrichedClients)

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

  // Todos los clientes ordenados por revenue total; los que suman < $1000 van a "Otros"
  const OTROS_THRESHOLD = 1000
  const MESES_LOCAL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  const { bigClients, smallClients } = useMemo(() => {
    const allCols = isSheets ? meses : MESES_LOCAL
    const sorted = [...(clientsData || [])].sort((a, b) => {
      const av = allCols.reduce((s, m) => s + (a.ventaMensual?.[m] || 0), 0)
      const bv = allCols.reduce((s, m) => s + (b.ventaMensual?.[m] || 0), 0)
      return bv - av
    })
    const big = [], small = []
    sorted.forEach(c => {
      const maxMonthly = Math.max(0, ...allCols.map(m => c.ventaMensual?.[m] || 0))
      if (maxMonthly >= OTROS_THRESHOLD) big.push(c)
      else small.push(c)
    })
    return { bigClients: big, smallClients: small }
  }, [clientsData, meses, isSheets])

  const chartClients = useMemo(() => [
    ...bigClients.map(c => c.nombre),
    ...(smallClients.length > 0 ? ['Otros'] : []),
  ], [bigClients, smallClients])

  const lineData = useMemo(() => {
    const hasOthers = smallClients.length > 0
    if (isSheets) {
      return meses.map(col => {
        const row = { mes: mesLabel(col) }
        bigClients.forEach(c => { row[c.nombre] = c.ventaMensual?.[col] || 0 })
        if (hasOthers) row['Otros'] = smallClients.reduce((s, c) => s + (c.ventaMensual?.[col] || 0), 0)
        return row
      })
    }
    return MESES_LOCAL.map(mes => {
      const row = { mes }
      bigClients.forEach(c => { row[c.nombre] = c.ventaMensual?.[mes] || 0 })
      if (hasOthers) row['Otros'] = smallClients.reduce((s, c) => s + (c.ventaMensual?.[mes] || 0), 0)
      return row
    })
  }, [bigClients, smallClients, meses, isSheets])

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
      key: '_feeActual', label: `${mesDisplay} (USD)`, sortable: true, align: 'right',
      render: v => (
        <span className={`font-semibold text-sm ${v === 0 ? 'text-danger' : 'text-textPrimary'}`}>{formatUSD(v)}</span>
      )
    },
    {
      key: '_promedio', label: 'Promedio', sortable: true, align: 'right',
      render: v => <span className="text-xs text-textSecondary">{formatUSD(v)}</span>
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
        <h2 className="text-sm font-semibold text-textPrimary mb-4">
          Facturación mensual apilada — todos los clientes (USD)
          {smallClients.length > 0 && (
            <span className="ml-2 text-xs font-normal text-textSecondary">
              · {smallClients.length} bajo {formatUSD(OTROS_THRESHOLD)}/mes agrupados en "Otros"
            </span>
          )}
        </h2>
        <ClientLineChart data={lineData} clients={chartClients} />
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
