import { useState, useMemo } from 'react'
import KPICard from '../components/KPICard'
import DataTable from '../components/DataTable'
import RevenueBarChart from '../components/Charts/RevenueBarChart'
import DonutChart from '../components/Charts/DonutChart'
import { usePeriodValues } from '../hooks/useGlobalPeriod'
import useExchangeRate from '../hooks/useExchangeRate'
import { useVentasDolarizadasData, useTeamCostoNormalizadoData } from '../hooks/useSheetData'
import { usePodMetrics } from '../hooks/usePodMetrics'
import resumenData from '../data/resumen_equipos.json'
import { formatUSD, formatPct } from '../utils/formatters'
import { POD_COLORS } from '../utils/podColors'

export default function Dashboard() {
  const { rate, rateData, loading: loadingRate } = useExchangeRate()
  const { data: ventasData, source: ventasSource } = useVentasDolarizadasData()
  const { data: teamData, source: teamSource } = useTeamCostoNormalizadoData()
  const { podMetrics, globalMetrics: podGlobal, hasDesign, resumenFromDesign, overheadUSD } = usePodMetrics()
  const [sortConfig, setSortConfig] = useState({ key: 'revenue', dir: 'desc' })

  // ── Periodo ────────────────────────────────────────────────────────────────
  const { periodLabel, modeLabel, selectedMonths, costMultiplier } = usePeriodValues()

  // ── Live data from sheets (period-aware) ──────────────────────────────────
  const liveRevenue = useMemo(() => {
    if (!ventasData || selectedMonths.length === 0) return null
    return ventasData.reduce((sum, c) => {
      const clientRev = selectedMonths.reduce((ms, m) => ms + (c.ventaMensual?.[m] || 0), 0)
      return sum + clientRev
    }, 0)
  }, [ventasData, selectedMonths])

  const liveCostoOperativo = useMemo(() => {
    if (!teamData || teamData.length === 0 || !rate) return null
    const monthlyCost = Math.round(
      teamData
        .filter(p => !p.esOverhead)
        .reduce((sum, p) => sum + (p.costoMensualARS || p.neto || 0), 0) / rate
    )
    return monthlyCost * costMultiplier
  }, [teamData, rate, costMultiplier])

  const GLOBAL = useMemo(() => {
    // Si hay diseno activo de PODs, usar esos datos (escalados por periodo)
    if (hasDesign) {
      const overhead = (podGlobal.overhead || overheadUSD || 17413) * costMultiplier
      return {
        revenueClientes: podGlobal.revenue * costMultiplier,
        costoOperativo: podGlobal.teamCost * costMultiplier,
        costoOverhead: overhead,
        gop: podGlobal.gop * costMultiplier,
        profits: podGlobal.margin * costMultiplier,
      }
    }
    // Fallback: datos crudos del sheet o JSON
    const revenue = liveRevenue ?? 39196 * costMultiplier
    const operativo = liveCostoOperativo ?? 28338 * costMultiplier
    const overhead = (overheadUSD || 17413) * costMultiplier
    const gop = revenue - operativo
    const profits = gop - overhead
    return { revenueClientes: revenue, costoOperativo: operativo, costoOverhead: overhead, gop, profits }
  }, [hasDesign, podGlobal, liveRevenue, liveCostoOperativo, overheadUSD, costMultiplier])

  const isLive = ventasSource === 'sheets' || teamSource === 'sheets'

  // ── POD table: use design data if available, fallback to JSON ─────────────
  const tableData = useMemo(() => {
    if (hasDesign) {
      // Scale design data by period multiplier
      return resumenFromDesign.map(d => ({
        ...d,
        revenue: d.revenue * costMultiplier,
        costoEquipo: d.costoEquipo * costMultiplier,
        gop: d.gop * costMultiplier,
        overhead: d.overhead * costMultiplier,
        margen: d.margen * costMultiplier,
        // Percentages stay the same
      }))
    }
    return resumenData.filter(d => d.periodo === 'Enero')
  }, [hasDesign, resumenFromDesign, costMultiplier])

  const sorted = useMemo(() => {
    if (!sortConfig.key) return tableData
    return [...tableData].sort((a, b) => {
      const av = a[sortConfig.key], bv = b[sortConfig.key]
      return sortConfig.dir === 'asc' ? av - bv : bv - av
    })
  }, [tableData, sortConfig])

  const requestSort = (k) => {
    setSortConfig(prev => ({ key: k, dir: prev.key === k && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const columns = [
    {
      key: 'pod', label: 'POD', sortable: true,
      render: (v, row) => {
        const id = row.id || v.match(/^(A\d+)/)?.[1] || 'A1'
        return (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: POD_COLORS[id] || '#999' }} />
            <span className="font-medium text-textPrimary text-xs">{v}</span>
          </div>
        )
      }
    },
    { key: 'revenue', label: 'Revenue', sortable: true, align: 'right', render: v => <span className="font-semibold">{formatUSD(v)}</span> },
    { key: 'costoEquipo', label: 'Costo', sortable: true, align: 'right', render: v => formatUSD(v) },
    {
      key: 'gopPct', label: 'GOP%', sortable: true, align: 'right',
      render: v => (
        <span className={v >= 30 ? 'text-success font-semibold' : v >= 20 ? 'text-warning font-semibold' : 'text-danger font-semibold'}>
          {formatPct(v)}
        </span>
      )
    },
    {
      key: 'margen', label: 'Margen USD', sortable: true, align: 'right',
      render: v => <span className={v >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>{formatUSD(v)}</span>
    },
    {
      key: 'margenPct', label: 'Margen%', sortable: true, align: 'right',
      render: v => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold
          ${v > 20 ? 'bg-success/10 text-success' : v >= 0 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
          {formatPct(v)}
        </span>
      )
    },
  ]

  // Chart data
  const chartData = useMemo(() => {
    if (hasDesign) {
      return resumenFromDesign.map(d => ({
        ...d,
        revenue: d.revenue * costMultiplier,
        costoEquipo: d.costoEquipo * costMultiplier,
        overhead: d.overhead * costMultiplier,
        margen: d.margen * costMultiplier,
      }))
    }
    return resumenData.filter(d => d.periodo === 'Enero')
  }, [hasDesign, resumenFromDesign, costMultiplier])

  const gopPct = GLOBAL.revenueClientes ? ((GLOBAL.gop / GLOBAL.revenueClientes) * 100).toFixed(1) : '0.0'
  const overheadPct = GLOBAL.revenueClientes ? ((GLOBAL.costoOverhead / GLOBAL.revenueClientes) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      {/* Source badge */}
      <div className="flex items-center gap-2 text-xs text-textSecondary flex-wrap">
        {isLive && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>Datos en vivo · {periodLabel} · Google Sheets</span>
          </>
        )}
        {hasDesign && (
          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium ml-1">
            PODs · diseño activo
          </span>
        )}
        <span className="px-2 py-0.5 bg-gray-100 text-textSecondary rounded-full font-medium">
          {modeLabel}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Revenue Clientes" value={formatUSD(GLOBAL.revenueClientes)} color="accent" icon="💵" />
        <KPICard
          title="Costo Operativo"
          value={formatUSD(GLOBAL.costoOperativo)}
          subtitle={`${((GLOBAL.costoOperativo / (GLOBAL.revenueClientes || 1)) * 100).toFixed(1)}% del revenue`}
          color="default"
          icon="⚙️"
        />
        <KPICard
          title="GOP"
          value={formatUSD(GLOBAL.gop)}
          subtitle={`GOP% ${gopPct}%`}
          color={GLOBAL.gop >= 0 ? 'success' : 'danger'}
          icon="📈"
        />
        <KPICard
          title="Overhead"
          value={formatUSD(GLOBAL.costoOverhead)}
          subtitle={`${overheadPct}% del revenue`}
          color="warning"
          icon="🏢"
        />
        <KPICard
          title="Profits"
          value={formatUSD(GLOBAL.profits)}
          subtitle="Resultado neto"
          color={GLOBAL.profits >= 0 ? 'success' : 'danger'}
          icon={GLOBAL.profits >= 0 ? '📈' : '📉'}
        />
        <KPICard
          title="Dólar Blue"
          value={loadingRate ? '...' : `$${rate.toLocaleString('es-AR')}`}
          subtitle={rateData
            ? <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block" />
                En vivo · compra ${rateData.compra} / venta ${rateData.venta}
              </span>
            : 'TC del mes'
          }
          color="default"
          icon="💱"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-textPrimary mb-4">Revenue vs. Costo por POD</h2>
          <RevenueBarChart data={chartData} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-textPrimary mb-4">Distribución de Revenue por POD</h2>
          <DonutChart data={chartData} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-textPrimary mb-4">
          Resumen por POD —{' '}
          <span className="text-accent">
            {hasDesign ? `Diseño PODs (${periodLabel})` : `${periodLabel}`}
          </span>
        </h2>
        <DataTable columns={columns} data={sorted} onSort={requestSort} sortConfig={sortConfig} />
      </div>
    </div>
  )
}
