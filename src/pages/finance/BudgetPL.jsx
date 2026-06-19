import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts'
import PageBadge from '../../components/finance/PageBadge'
import FinanceCard from '../../components/finance/FinanceCard'
import FinanceKPICard from '../../components/finance/FinanceKPICard'
import FinanceFilter from '../../components/finance/FinanceFilter'
import { budgetKPI, budgetEbitda, budgetSuma } from '../../data/finance/mockData'

const YEAR_OPTS = [
  { value: 'all', label: 'Todos' },
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
          {p.name}: {p.value?.toFixed(1)}
        </p>
      ))}
    </div>
  )
}

export default function BudgetPL() {
  const [year, setYear] = useState('all')
  const filtered = year === 'all' ? budgetEbitda : budgetEbitda.filter(d => d.mes.includes(year.slice(-2)))
  const filteredSuma = year === 'all' ? budgetSuma : budgetSuma.filter(d => d.mes.includes(year.slice(-2)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <FinanceFilter label="Periodo (Año)" options={YEAR_OPTS} value={year} onChange={setYear} />
        <PageBadge title="Budget Vs P&L" />
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 24 }}>
        <FinanceKPICard label="Neto 2025" value={budgetKPI.neto2025} size="lg" />
        <FinanceKPICard label="Neto 2024" value={budgetKPI.neto2024} size="lg" />
      </div>

      {/* Ebitda Bar Chart */}
      <FinanceCard title="Ebitda — Real vs Budget">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={filtered} margin={{ top: 16, right: 16, bottom: 5, left: 10 }} barGap={2} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
            <Tooltip content={darkTooltip} />
            <Legend
              wrapperStyle={{ fontFamily: 'Poppins,sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}
              formatter={(val) => <span style={{ color: val === 'real' ? '#59D7A2' : '#95D6EA' }}>{val}</span>}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Bar dataKey="real"   fill="#59D7A2" radius={[3,3,0,0]} name="real" />
            <Bar dataKey="budget" fill="rgba(78,204,163,0.35)" radius={[3,3,0,0]} name="budget" stroke="#95D6EA" strokeWidth={1} />
          </BarChart>
        </ResponsiveContainer>
      </FinanceCard>

      {/* Suma area chart */}
      <FinanceCard title="Acumulado (Suma)">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={filteredSuma} margin={{ top: 10, right: 16, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#59D7A2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#59D7A2" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={darkTooltip} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Area type="monotone" dataKey="acum" stroke="#59D7A2" strokeWidth={2} fill="url(#greenGrad)" dot={false} name="Suma" />
          </AreaChart>
        </ResponsiveContainer>
      </FinanceCard>
    </div>
  )
}
