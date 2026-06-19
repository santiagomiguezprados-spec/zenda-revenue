import { useState, useMemo } from 'react'
import DataTable from '../components/DataTable'
import HorizontalBarChart from '../components/Charts/HorizontalBarChart'
import KPICard from '../components/KPICard'
import { formatUSD, formatARS } from '../utils/formatters'
import { useTeamCostoNormalizadoData } from '../hooks/useSheetData'
import useExchangeRate from '../hooks/useExchangeRate'
import useSimulationStore from '../store/useSimulationStore'

export default function Equipo() {
  const { data: rawTeam, source } = useTeamCostoNormalizadoData()
  const { rate: liveRate, rateData, loading: tcLoading, refresh: refreshTC } = useExchangeRate()

  const {
    simMode, tc, teamOverrides, newPeople,
    toggleSimMode, setTC, setTeamOverride, addPerson, removePerson, resetAll,
  } = useSimulationStore()

  const [newNombre, setNewNombre] = useState('')
  const [newNeto, setNewNeto]     = useState('')

  const effectiveTC = simMode ? tc : liveRate

  const equipo   = useMemo(() => (rawTeam || []).filter(p => !p.esOverhead), [rawTeam])
  const overhead = useMemo(() => (rawTeam || []).filter(p => p.esOverhead),  [rawTeam])

  // Equipo con USD dinámico y overrides de simulación
  const equipoEfectivo = useMemo(() => {
    const base = equipo.map(p => {
      const costoBase = p.costoMensualARS || p.neto
      const costoEfectivo = simMode && teamOverrides[p.nombre] !== undefined
        ? teamOverrides[p.nombre]
        : costoBase
      return {
        ...p,
        netoEfectivo: costoEfectivo,
        costoUSD:     Math.round(costoEfectivo / effectiveTC),
        costoUSDBase: Math.round(costoBase / liveRate),
        overridden: simMode && teamOverrides[p.nombre] !== undefined,
      }
    })
    const extra = newPeople.map((p, i) => ({
      nombre: p.nombre,
      neto: p.neto,
      netoEfectivo: p.neto,
      costoUSD: Math.round(p.neto / effectiveTC),
      costoUSDBase: 0,
      esNuevo: true,
      _idx: i,
    }))
    return [...base, ...extra]
  }, [equipo, simMode, teamOverrides, newPeople, effectiveTC, liveRate])

  const overheadEfectivo = useMemo(() =>
    overhead.map(p => ({ ...p, costoUSD: Math.round((p.costoMensualARS || p.neto) / effectiveTC) })),
    [overhead, effectiveTC]
  )

  const totalUSD        = useMemo(() => equipoEfectivo.reduce((s, p) => s + p.costoUSD, 0), [equipoEfectivo])
  const totalUSDBase    = useMemo(() => equipo.reduce((s, p) => s + Math.round((p.costoMensualARS || p.neto) / liveRate), 0), [equipo, liveRate])
  const totalOverheadUSD = useMemo(() => overheadEfectivo.reduce((s, p) => s + p.costoUSD, 0), [overheadEfectivo])
  const headcount       = equipo.length + newPeople.length
  const promedio        = headcount ? Math.round(totalUSD / headcount) : 0
  const deltaTotal      = simMode ? totalUSD - totalUSDBase : 0

  const chartData = useMemo(() =>
    [...equipoEfectivo].sort((a, b) => b.costoUSD - a.costoUSD),
    [equipoEfectivo]
  )

  function handleAddPerson() {
    if (!newNombre.trim() || !newNeto) return
    addPerson({ nombre: newNombre.trim(), neto: Number(newNeto) })
    setNewNombre('')
    setNewNeto('')
  }

  // Columnas modo simulación
  const simColumns = [
    {
      key: 'nombre', id: 'sim_nombre', label: 'Nombre',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          {row.esNuevo && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">NUEVO</span>
          )}
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">
              {v.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </span>
          </div>
          <span className="font-medium text-textPrimary text-sm">{v}</span>
        </div>
      ),
    },
    {
      key: 'netoEfectivo', id: 'sim_neto', label: 'Costo Total ARS', align: 'right',
      render: (v, row) => row.esNuevo ? (
        <span className="text-sm text-primary font-semibold">{formatARS(v)}</span>
      ) : (
        <input
          type="number"
          className="w-28 text-right text-sm border border-primary/40 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={teamOverrides[row.nombre] !== undefined ? teamOverrides[row.nombre] : row.neto}
          onChange={e => setTeamOverride(row.nombre, e.target.value)}
        />
      ),
    },
    {
      key: 'costoUSDBase', id: 'sim_base', label: 'USD Base', align: 'right',
      render: v => <span className="text-xs text-textSecondary">{v ? formatUSD(v) : '—'}</span>,
    },
    {
      key: 'costoUSD', id: 'sim_usd', label: 'USD Sim', align: 'right',
      render: (v, row) => (
        <span className={`font-semibold ${row.overridden || row.esNuevo ? 'text-primary' : 'text-textPrimary'}`}>
          {formatUSD(v)}
        </span>
      ),
    },
    {
      key: 'costoUSD', id: 'sim_delta', label: 'Δ', align: 'right',
      render: (v, row) => {
        if (row.esNuevo) return <span className="text-xs text-primary font-semibold">+{formatUSD(v)}</span>
        const d = v - (row.costoUSDBase || 0)
        if (d === 0) return <span className="text-xs text-textSecondary">—</span>
        return (
          <span className={`text-xs font-semibold ${d < 0 ? 'text-success' : 'text-danger'}`}>
            {d > 0 ? '+' : ''}{formatUSD(d)}
          </span>
        )
      },
    },
    {
      key: 'nombre', id: 'sim_remove', label: '',
      render: (v, row) => row.esNuevo ? (
        <button
          onClick={() => removePerson(row._idx)}
          className="text-danger hover:text-danger/70 text-xs font-bold px-2"
        >✕</button>
      ) : null,
    },
  ]

  // Columnas modo normal
  const normalColumns = [
    {
      key: 'nombre', label: 'Nombre', sortable: true,
      render: v => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">
              {v.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </span>
          </div>
          <span className="font-medium text-textPrimary text-sm">{v}</span>
        </div>
      ),
    },
    { key: 'neto', label: 'Costo Total ARS', sortable: true, align: 'right', render: v => <span className="text-sm">{formatARS(v)}</span> },
    {
      key: 'costoUSD', label: `USD @TC ${effectiveTC.toLocaleString('es-AR')}`, sortable: true, align: 'right',
      render: v => <span className="font-semibold text-primary">{formatUSD(v)}</span>,
    },
  ]

  const overheadColumns = [
    { key: 'categoria', label: 'Rol', render: v => <span className="font-semibold text-textPrimary">{v}</span> },
    { key: 'neto', label: 'Costo Total ARS', align: 'right', render: v => formatARS(v) },
    { key: 'costoUSD', label: `USD @${effectiveTC.toLocaleString('es-AR')}`, align: 'right', render: v => <span className="font-semibold text-warning">{formatUSD(v)}</span> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* TC badge */}
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary">
              {tcLoading ? 'Actualizando TC…' : `TC Blue: $${liveRate.toLocaleString('es-AR')}`}
            </span>
            {rateData && (
              <span className="text-xs text-textSecondary">
                (C:{rateData.compra} / V:{rateData.venta})
              </span>
            )}
            <button onClick={refreshTC} title="Refrescar" className="text-primary/60 hover:text-primary text-xs">↻</button>
          </div>

          {source === 'sheets' && (
            <span className="text-xs bg-success/10 text-success border border-success/20 rounded-xl px-2 py-1 font-medium">
              Google Sheets · live
            </span>
          )}
        </div>

        <button
          onClick={toggleSimMode}
          className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
            simMode
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-white border border-gray-200 text-textPrimary hover:border-primary/40 hover:text-primary'
          }`}
        >
          {simMode ? '⚡ Simulación Activa' : '⚡ Modo Simulación'}
        </button>
      </div>

      {/* Panel de simulación */}
      {simMode && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* TC input */}
            <div>
              <label className="text-xs font-semibold text-textSecondary block mb-1.5">
                Tipo de Cambio (ARS → USD)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-textSecondary text-sm font-medium">$</span>
                <input
                  type="number"
                  className="w-24 text-sm font-semibold border border-primary/40 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={tc}
                  min={1}
                  onChange={e => setTC(e.target.value)}
                />
                <button
                  onClick={() => setTC(liveRate)}
                  className="text-xs text-textSecondary hover:text-primary border border-gray-200 rounded-lg px-2 py-1 transition-colors"
                >
                  Usar Blue (${liveRate.toLocaleString('es-AR')})
                </button>
              </div>
            </div>

            {/* Delta total */}
            {deltaTotal !== 0 && (
              <div className="bg-white rounded-xl border border-gray-200 px-4 py-2">
                <p className="text-xs text-textSecondary">Impacto mensual equipo</p>
                <p className={`text-sm font-bold ${deltaTotal < 0 ? 'text-success' : 'text-danger'}`}>
                  {deltaTotal > 0 ? '+' : ''}{formatUSD(deltaTotal)}/mes
                </p>
              </div>
            )}

            <button
              onClick={resetAll}
              className="ml-auto text-xs text-danger border border-danger/30 hover:bg-danger/5 rounded-lg px-3 py-1.5 font-medium transition-colors"
            >
              Resetear todo
            </button>
          </div>

          {/* Agregar persona */}
          <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-primary/10">
            <p className="w-full text-xs font-semibold text-textSecondary -mb-1">Simular nueva contratación</p>
            <div>
              <label className="text-xs text-textSecondary block mb-1">Nombre</label>
              <input
                type="text"
                placeholder="Nombre Apellido"
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPerson()}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-44 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-textSecondary block mb-1">Costo Total ARS</label>
              <input
                type="number"
                placeholder="600000"
                value={newNeto}
                onChange={e => setNewNeto(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPerson()}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={handleAddPerson}
              className="text-sm font-semibold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              + Agregar
            </button>
            {newNeto > 0 && (
              <span className="text-xs text-textSecondary self-end pb-1.5">
                ≈ {formatUSD(Math.round(Number(newNeto) / effectiveTC))}/mes
              </span>
            )}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Headcount"
          value={headcount}
          color="accent"
          icon="👤"
          subtitle={newPeople.length ? `(+${newPeople.length} simulados)` : 'Equipo operativo'}
        />
        <KPICard
          title="Costo Total Equipo"
          value={formatUSD(totalUSD)}
          color="default"
          icon="💰"
          subtitle={`USD @${effectiveTC.toLocaleString('es-AR')}/mes`}
        />
        <KPICard
          title="Promedio por Persona"
          value={formatUSD(promedio)}
          color="success"
          icon="📊"
          subtitle="USD/mes"
        />
        <KPICard
          title="Total Overhead"
          value={formatUSD(totalOverheadUSD)}
          color="warning"
          icon="🏢"
          subtitle="C-Level + Ops"
        />
      </div>

      {/* Chart + Overhead */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-textPrimary mb-4">
            Costo por Persona (USD @{effectiveTC.toLocaleString('es-AR')})
          </h2>
          <HorizontalBarChart data={chartData} dataKey="costoUSD" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-textPrimary mb-4">Overhead C-Level</h2>
          <DataTable columns={overheadColumns} data={overheadEfectivo} compact />
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
            <span className="text-xs font-semibold text-textSecondary">Total Overhead</span>
            <span className="text-sm font-bold text-warning">{formatUSD(totalOverheadUSD)}/mes</span>
          </div>
        </div>
      </div>

      {/* Team table */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-textPrimary mb-4">
          Equipo Operativo {simMode && <span className="text-primary text-xs font-normal ml-1">— modo simulación activo</span>}
        </h2>
        <DataTable
          columns={simMode ? simColumns : normalColumns}
          data={simMode ? equipoEfectivo : [...equipoEfectivo].sort((a, b) => b.costoUSD - a.costoUSD)}
          compact
        />
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs font-semibold text-textSecondary">
            Total ({headcount} personas)
          </span>
          <div className="flex items-center gap-3">
            {simMode && deltaTotal !== 0 && (
              <span className={`text-xs font-semibold ${deltaTotal < 0 ? 'text-success' : 'text-danger'}`}>
                {deltaTotal > 0 ? '+' : ''}{formatUSD(deltaTotal)}
              </span>
            )}
            <span className="text-sm font-bold text-primary">{formatUSD(totalUSD)}/mes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
