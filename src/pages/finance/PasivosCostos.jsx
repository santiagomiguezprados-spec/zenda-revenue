import { useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'
import PageBadge from '../../components/finance/PageBadge'
import FinanceCard from '../../components/finance/FinanceCard'
import FinanceKPICard from '../../components/finance/FinanceKPICard'
import {
  pasivosKPI, costosTrimestrales, distribucionCostos, pivotCostos,
} from '../../data/finance/mockData'

const darkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(89,215,162,0.25)', borderRadius: 8, padding: '8px 14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins,sans-serif', fontSize: '0.72rem', margin: '0 0 4px' }}>{label || payload[0]?.name}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || '#59D7A2', fontFamily: 'Poppins,sans-serif', fontSize: '0.82rem', fontWeight: 700, margin: '2px 0' }}>
          {p.value?.toFixed?.(1) ?? p.value}
          {p.payload?.value ? `  (${p.payload.value}%)` : ' mil'}
        </p>
      ))}
    </div>
  )
}

export default function PasivosCostos() {
  const [expanded, setExpanded] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(89,215,162,0.15)', border: '1px solid #59D7A2',
            borderRadius: '50px', padding: '4px 14px',
          }}>
            <span style={{ color: '#59D7A2', fontFamily: 'Poppins,sans-serif', fontSize: '0.75rem', fontWeight: 600 }}>
              {pasivosKPI.tcEstatico}
            </span>
          </div>
          <FinanceKPICard label="Saldo Planes USD"  value={pasivosKPI.saldoPlanesUSD} size="sm" variant="green" />
          <FinanceKPICard label="Préstamos USD"     value={pasivosKPI.prestamosUSD}   size="sm" variant="green" />
          <FinanceKPICard label="Saldo IVA diferido" value={pasivosKPI.saldoIVA}      size="sm" variant="green" />
        </div>
        <PageBadge title="Pasivos y Costos" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <FinanceCard title="Costos Trimestrales">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={costosTrimestrales} margin={{ top: 16, right: 10, bottom: 24, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="q" tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 150]} tickFormatter={v => `${v}k`} />
              <Tooltip content={darkTooltip} />
              <Bar dataKey="v" fill="#59D7A2" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </FinanceCard>

        <FinanceCard title="Distribución de Costos">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={distribucionCostos}
                cx="50%" cy="50%"
                innerRadius={0} outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${value}%`}
                labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              >
                {distribucionCostos.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={darkTooltip} />
              <Legend
                formatter={(val) => <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Poppins,sans-serif', fontSize: '0.72rem' }}>{val}</span>}
                iconSize={10}
              />
            </PieChart>
          </ResponsiveContainer>
        </FinanceCard>
      </div>

      {/* Pivot table */}
      <FinanceCard title="P&L por Categoría (USD)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', minWidth: 800 }}>
            <thead>
              <tr style={{ background: '#59D7A2' }}>
                <th style={{
                  padding: '8px 12px', color: '#000', fontFamily: 'Poppins,sans-serif',
                  fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap', cursor: 'pointer',
                }}
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? '▼' : '▶'} P&L
                </th>
                {pivotCostos.cols.map(c => (
                  <th key={c} style={{
                    padding: '8px 10px', color: '#000', fontFamily: 'Poppins,sans-serif',
                    fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap',
                  }}>{c}</th>
                ))}
              </tr>
            </thead>
            {expanded && (
              <tbody>
                {pivotCostos.rows.map((row, ri) => (
                  <tr key={ri} style={{
                    background: ri % 2 === 0 ? '#0D0D0D' : '#111111',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <td style={{ padding: '7px 12px', color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins,sans-serif', whiteSpace: 'nowrap', paddingLeft: 24 }}>
                      {row.cat}
                    </td>
                    {row.vals.map((v, vi) => (
                      <td key={vi} style={{
                        padding: '7px 10px', color: vi === row.vals.length - 1 ? '#59D7A2' : '#FFFFFF',
                        fontFamily: 'Poppins,sans-serif', fontWeight: vi === row.vals.length - 1 ? 700 : 400,
                        textAlign: 'right', whiteSpace: 'nowrap',
                      }}>
                        {v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Total row */}
                <tr style={{ background: '#1A1A1A', borderTop: '2px solid rgba(89,215,162,0.3)' }}>
                  <td style={{ padding: '8px 12px', color: '#59D7A2', fontFamily: 'Poppins,sans-serif', fontWeight: 700, paddingLeft: 24 }}>Total</td>
                  {pivotCostos.cols.map((c, ci) => {
                    const total = pivotCostos.totals
                      ? pivotCostos.totals[ci]
                      : pivotCostos.rows.reduce((s, r) => s + (r.vals[ci] || 0), 0)
                    return (
                      <td key={ci} style={{ padding: '8px 10px', color: '#59D7A2', fontFamily: 'Poppins,sans-serif', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </FinanceCard>
    </div>
  )
}
