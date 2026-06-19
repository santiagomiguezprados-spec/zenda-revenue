import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import PageBadge from '../../components/finance/PageBadge'
import FinanceCard from '../../components/finance/FinanceCard'
import FinanceKPICard from '../../components/finance/FinanceKPICard'
import FinanceFilter from '../../components/finance/FinanceFilter'
import { cashflowWaterfall, cashflowKPI } from '../../data/finance/mockData'

const PERIODO_OPTS = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2023', label: '2023' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(89,215,162,0.3)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: '#fff', fontFamily: 'Poppins,sans-serif', fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>{label}</p>
      <p style={{ color: v >= 0 ? '#59D7A2' : '#E57373', fontFamily: 'Poppins,sans-serif', fontSize: '0.85rem', fontWeight: 700, margin: '4px 0 0' }}>
        {v >= 0 ? '+' : ''}{v.toLocaleString('es-AR')}
      </p>
    </div>
  )
}

export default function Cashflow() {
  const [periodo, setPeriodo] = useState('2024')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <FinanceFilter label="Periodo" options={PERIODO_OPTS} value={periodo} onChange={setPeriodo} />
        <PageBadge title="Cashflow & Balance Sheet" />
      </div>

      {/* Waterfall chart */}
      <FinanceCard title="Cashflow">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={cashflowWaterfall} margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.7)', fontFamily: 'Poppins,sans-serif', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} label={{ position: 'top', fill: 'rgba(255,255,255,0.6)', fontSize: 10, formatter: v => v >= 0 ? `+${(v/1000).toFixed(1)}k` : `${(v/1000).toFixed(1)}k` }}>
              {cashflowWaterfall.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </FinanceCard>

      {/* KPI row — Saldo Bancario USD */}
      <FinanceCard>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
          Saldo Bancario USD
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <FinanceKPICard label="Pesificado" value={cashflowKPI.pesificado} size="md" />
          <span style={{ color: '#59D7A2', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Poppins,sans-serif' }}>+</span>
          <FinanceKPICard label="Dolarizado" value={cashflowKPI.dolarizado} size="md" />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Poppins,sans-serif' }}>=</span>
          <FinanceKPICard label="Neto 2024" value={cashflowKPI.neto2024} size="lg" />
        </div>
      </FinanceCard>
    </div>
  )
}
