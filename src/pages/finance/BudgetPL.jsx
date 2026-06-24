import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts'
import PageBadge from '../../components/finance/PageBadge'
import FinanceCard from '../../components/finance/FinanceCard'
import FinanceKPICard from '../../components/finance/FinanceKPICard'
import FinanceFilter from '../../components/finance/FinanceFilter'
import { budgetEbitda, budgetRevenue } from '../../data/finance/mockData'
import { useDatosLookerData } from '../../hooks/useSheetData'

const YEAR_OPTS = [
  { value: 'all',  label: 'Todos' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
]

const darkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(89,215,162,0.25)', borderRadius: 8, padding: '8px 14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins,sans-serif', fontSize: '0.72rem', margin: '0 0 4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontFamily: 'Poppins,sans-serif', fontSize: '0.8rem', fontWeight: 700, margin: '2px 0' }}>
          {p.name}: {p.value != null ? p.value.toFixed(1) : '—'}
        </p>
      ))}
    </div>
  )
}

function deltaColor(val) {
  if (val > 0)  return '#59D7A2'
  if (val < 0)  return '#E57373'
  return 'rgba(255,255,255,0.4)'
}

function fmtK(val) {
  if (val == null || isNaN(val)) return '—'
  return `${val.toFixed(1)} k`
}

function pct(real, budget) {
  if (!budget) return null
  return ((real - budget) / Math.abs(budget)) * 100
}

export default function BudgetPL() {
  const [year, setYear] = useState('all')
  const { data: lookerData, source: lookerSource } = useDatosLookerData()
  const isLive = lookerSource === 'sheets' && lookerData?.length > 0

  // ── Datos filtrados por año ────────────────────────────────────────────────
  const suffix = year !== 'all' ? year.slice(-2) : null

  const revenueData = useMemo(() => {
    const base = isLive
      ? lookerData.map(d => ({ mes: d.mes, real: d.revenueHistory, budget: d.revenue }))
      : budgetRevenue
    return suffix ? base.filter(d => d.mes.includes(suffix)) : base
  }, [isLive, lookerData, suffix])

  const ebitdaData = useMemo(() => {
    const base = isLive
      ? lookerData.map(d => ({ mes: d.mes, real: d.ebitdaHistory, budget: d.ebitda }))
      : budgetEbitda
    return suffix ? base.filter(d => d.mes.includes(suffix)) : base
  }, [isLive, lookerData, suffix])

  const ebitdaAcum = useMemo(() =>
    ebitdaData.map((d, i) => ({
      mes: d.mes,
      acum: ebitdaData.slice(0, i + 1).reduce((s, x) => s + (x.real || 0), 0),
    })),
    [ebitdaData]
  )

  // ── KPIs (suma del período filtrado) ──────────────────────────────────────
  const revReal   = revenueData.reduce((s, d) => s + (d.real   || 0), 0)
  const revBudget = revenueData.reduce((s, d) => s + (d.budget || 0), 0)
  const revDelta  = pct(revReal, revBudget)

  const ebiReal   = ebitdaData.reduce((s, d) => s + (d.real   || 0), 0)
  const ebiBudget = ebitdaData.reduce((s, d) => s + (d.budget || 0), 0)
  const ebiDelta  = pct(ebiReal, ebiBudget)

  const periodLabel = year === 'all' ? 'Total histórico' : year

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FinanceFilter label="Periodo (Año)" options={YEAR_OPTS} value={year} onChange={setYear} />
          {isLive && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#59D7A2', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Datos Looker · live
            </span>
          )}
        </div>
        <PageBadge title="Budget Vs P&L" />
      </div>

      {/* KPIs — Revenue */}
      <FinanceCard>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Poppins,sans-serif', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
          Revenue · {periodLabel}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Poppins,sans-serif', fontSize: '0.68rem', marginBottom: 4 }}>History (Real)</p>
            <FinanceKPICard label="RV History" value={fmtK(revReal)} size="lg" />
          </div>
          <div style={{ height: 60, width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Poppins,sans-serif', fontSize: '0.68rem', marginBottom: 4 }}>RV100 (Budget)</p>
            <FinanceKPICard label="RV Budget" value={fmtK(revBudget)} size="lg" variant="outline" />
          </div>
          {revDelta != null && (
            <>
              <div style={{ height: 60, width: 1, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Poppins,sans-serif', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>vs Budget</p>
                <span style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: '1.5rem', color: deltaColor(revDelta) }}>
                  {revDelta > 0 ? '+' : ''}{revDelta.toFixed(1)}%
                </span>
              </div>
            </>
          )}
        </div>
      </FinanceCard>

      {/* KPIs — EBITDA */}
      <FinanceCard>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Poppins,sans-serif', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
          EBITDA · {periodLabel}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Poppins,sans-serif', fontSize: '0.68rem', marginBottom: 4 }}>History (Real)</p>
            <FinanceKPICard label="EBITDA History" value={fmtK(ebiReal)} size="lg" />
          </div>
          <div style={{ height: 60, width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Poppins,sans-serif', fontSize: '0.68rem', marginBottom: 4 }}>E300 (Budget)</p>
            <FinanceKPICard label="EBITDA Budget" value={fmtK(ebiBudget)} size="lg" variant="outline" />
          </div>
          {ebiDelta != null && (
            <>
              <div style={{ height: 60, width: 1, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Poppins,sans-serif', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>vs Budget</p>
                <span style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: '1.5rem', color: deltaColor(ebiDelta) }}>
                  {ebiDelta > 0 ? '+' : ''}{ebiDelta.toFixed(1)}%
                </span>
              </div>
            </>
          )}
        </div>
      </FinanceCard>

      {/* Revenue History vs RV100 */}
      <FinanceCard title="Revenue History vs RV100 — Budget">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueData} margin={{ top: 16, right: 16, bottom: 5, left: 10 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
            <Tooltip content={darkTooltip} />
            <Legend
              wrapperStyle={{ fontFamily: 'Poppins,sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}
              formatter={(val) => (
                <span style={{ color: val === 'real' ? '#59D7A2' : '#95D6EA' }}>
                  {val === 'real' ? 'History' : 'RV100 Budget'}
                </span>
              )}
            />
            <Bar dataKey="real"   fill="#59D7A2"              radius={[3,3,0,0]} name="real" />
            <Bar dataKey="budget" fill="rgba(149,214,234,0.4)" radius={[3,3,0,0]} name="budget" stroke="#95D6EA" strokeWidth={1} />
          </BarChart>
        </ResponsiveContainer>
      </FinanceCard>

      {/* EBITDA History vs E300 */}
      <FinanceCard title="EBITDA History vs E300 — Budget">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={ebitdaData} margin={{ top: 16, right: 16, bottom: 5, left: 10 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
            <Tooltip content={darkTooltip} />
            <Legend
              wrapperStyle={{ fontFamily: 'Poppins,sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}
              formatter={(val) => (
                <span style={{ color: val === 'real' ? '#59D7A2' : '#95D6EA' }}>
                  {val === 'real' ? 'History' : 'E300 Budget'}
                </span>
              )}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Bar dataKey="real"   fill="#59D7A2"              radius={[3,3,0,0]} name="real" />
            <Bar dataKey="budget" fill="rgba(149,214,234,0.4)" radius={[3,3,0,0]} name="budget" stroke="#95D6EA" strokeWidth={1} />
          </BarChart>
        </ResponsiveContainer>
      </FinanceCard>

      {/* EBITDA Acumulado */}
      <FinanceCard title="EBITDA Acumulado (History)">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={ebitdaAcum} margin={{ top: 10, right: 16, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#59D7A2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#59D7A2" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={darkTooltip} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Area type="monotone" dataKey="acum" stroke="#59D7A2" strokeWidth={2} fill="url(#greenGrad)" dot={false} name="Acumulado" />
          </AreaChart>
        </ResponsiveContainer>
      </FinanceCard>

    </div>
  )
}
