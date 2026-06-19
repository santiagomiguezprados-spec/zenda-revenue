import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import PageBadge from '../../components/finance/PageBadge'
import FinanceCard from '../../components/finance/FinanceCard'
import FinanceKPICard from '../../components/finance/FinanceKPICard'
import { carteraKPI, carteraBarData } from '../../data/finance/mockData'

const darkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(89,215,162,0.25)', borderRadius: 8, padding: '8px 14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins,sans-serif', fontSize: '0.72rem', margin: '0 0 4px' }}>{label}</p>
      <p style={{ color: '#59D7A2', fontFamily: 'Poppins,sans-serif', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
        USD {payload[0].value?.toLocaleString('es-AR')}
      </p>
    </div>
  )
}

export default function Cartera() {
  const [dateRange] = useState('1 ene 2026 - 29 mar 2026')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Date pill */}
          <div style={{
            background: 'rgba(89,215,162,0.12)',
            border: '1.5px solid #59D7A2',
            borderRadius: '50px',
            padding: '5px 16px',
          }}>
            <span style={{ color: '#59D7A2', fontFamily: 'Poppins,sans-serif', fontSize: '0.78rem', fontWeight: 600 }}>
              📅 {dateRange}
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins,sans-serif', fontSize: '0.8rem', fontWeight: 600 }}>
            Plataformas
          </span>
        </div>
        <PageBadge title="Cartera" />
      </div>

      {/* KPI + label */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Cuentas
          </p>
          <FinanceKPICard label="Cartera Mensual" value={carteraKPI.carteraMensual} size="lg" />
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Placeholder table */}
        <FinanceCard title="Apertura por Cuenta">
          <div style={{
            height: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 8,
            border: '1px dashed rgba(255,255,255,0.1)',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Poppins,sans-serif', fontSize: '0.8rem' }}>
              No hay datos para el período
            </span>
          </div>
        </FinanceCard>

        {/* Bar chart month / cost */}
        <FinanceCard title="Month / Cost USD">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={carteraBarData} margin={{ top: 16, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={darkTooltip} />
              <Bar dataKey="cost" fill="#59D7A2" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </FinanceCard>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Poppins,sans-serif', fontSize: '0.7rem' }}>
        *Solo Meta y Google
      </p>
    </div>
  )
}
