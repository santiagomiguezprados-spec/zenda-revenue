import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import PageBadge from '../../components/finance/PageBadge'
import FinanceCard from '../../components/finance/FinanceCard'
import FinanceKPICard from '../../components/finance/FinanceKPICard'
import FinanceFilter from '../../components/finance/FinanceFilter'
import { gopKPI, gopPods } from '../../data/finance/mockData'

const FECHA_OPTS = [
  { value: 'all', label: 'Todos' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
]
const POD_OPTS = [
  { value: 'all', label: 'Todos los PODs' },
  ...gopPods.map(p => ({ value: p.id, label: `${p.id} - ${p.nombre}` })),
]

const darkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(89,215,162,0.25)', borderRadius: 8, padding: '8px 14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins,sans-serif', fontSize: '0.72rem', margin: '0 0 4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill, fontFamily: 'Poppins,sans-serif', fontSize: '0.8rem', fontWeight: 700, margin: '2px 0' }}>
          {p.name}: {p.value?.toFixed(0)}
        </p>
      ))}
    </div>
  )
}

const ABBR_MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const FULL_MONTHS  = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
function abbrMonth(mes) {
  const idx = FULL_MONTHS.indexOf(mes)
  return idx >= 0 ? ABBR_MONTHS[idx] : mes
}

function PODChart({ pod }) {
  const isNegative = pod.margen.startsWith('-')
  const dotColor = isNegative ? '#E57373' : '#59D7A2'
  const chartData = pod.data.map(d => ({ ...d, mes: abbrMonth(d.mes) }))
  return (
    <FinanceCard style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: dotColor,
            display: 'inline-block', flexShrink: 0,
          }} />
          <h3 style={{ color: '#fff', fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: '0.82rem', margin: 0 }}>
            {pod.id} — {pod.nombre}
          </h3>
        </div>
        <div style={{
          background: isNegative ? '#E57373' : '#59D7A2',
          borderRadius: '50px',
          padding: '3px 12px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <span style={{ color: '#000', fontFamily: 'Poppins,sans-serif', fontSize: '0.6rem', fontWeight: 600 }}>Margen con G&A</span>
          <span style={{ color: '#000', fontFamily: 'Poppins,sans-serif', fontSize: '0.85rem', fontWeight: 700 }}>{pod.margen}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }} barGap={2} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
          <Tooltip content={darkTooltip} />
          <Legend
            wrapperStyle={{ fontFamily: 'Poppins,sans-serif', fontSize: '0.7rem' }}
            formatter={val => <span style={{ color: val === 'venta' ? '#59D7A2' : '#E57373' }}>{val}</span>}
          />
          <Bar dataKey="costo" fill="#E57373" radius={[3,3,0,0]} name="costo" />
          <Bar dataKey="venta" fill="#59D7A2" radius={[3,3,0,0]} name="venta" />
        </BarChart>
      </ResponsiveContainer>
    </FinanceCard>
  )
}

export default function GOPbyPOD() {
  const [fecha, setFecha] = useState('all')
  const [pod, setPod] = useState('all')

  const visiblePods = pod === 'all' ? gopPods : gopPods.filter(p => p.id === pod)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <FinanceFilter label="Fecha"  options={FECHA_OPTS} value={fecha} onChange={setFecha} />
          <FinanceFilter label="POD"    options={POD_OPTS}   value={pod}   onChange={setPod}   />
        </div>
        <PageBadge title="GOP by POD" />
      </div>

      {/* Global KPIs */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <FinanceKPICard label="Contribucion USD" value={gopKPI.contribucionUSD} size="md" />
        <FinanceKPICard label="Contribucion ARS" value={gopKPI.contribucionARS} size="md" />
        <FinanceKPICard label="Clientes"         value={gopKPI.clientes}        size="md" />
        <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Poppins,sans-serif', fontSize: '0.7rem', margin: 0 }}>
          *solo incluye margen operativo. Sin G&A
        </p>
      </div>

      {/* POD charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
        {visiblePods.map(p => <PODChart key={p.id} pod={p} />)}
      </div>
    </div>
  )
}
