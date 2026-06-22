import { useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { chartDefaults } from '../../lib/zendaChartTheme'
import { formatUSD } from '../../utils/formatters'

const CLIENT_COLORS = [
  '#59D7A2', '#E71CA2', '#95D6EA', '#F59E0B',
  '#8B5CF6', '#F97316', '#14B8A6', '#6366F1',
  '#EC4899', '#22D3EE',
]

export default function ClientLineChart({ data, clients }) {
  const activeBarRef = useRef(null)

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    const activeName = activeBarRef.current
    const entry = payload.find(p => p.dataKey === activeName)
    if (!entry) return null

    return (
      <div style={{
        background:   '#0A0A0B',
        borderRadius: '8px',
        padding:      '10px 14px',
        fontFamily:   "'Circular Std', sans-serif",
        fontSize:     '11px',
        color:        '#fff',
        minWidth:     '180px',
      }}>
        <p style={{ fontWeight: 700, marginBottom: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
          {label}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: entry.fill, flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.75)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
            {entry.name}
          </span>
          <span style={{ fontWeight: 700, flexShrink: 0, color: entry.fill }}>
            {formatUSD(entry.value)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid {...chartDefaults.cartesianGrid} />
        <XAxis dataKey="mes" {...chartDefaults.xAxis} />
        <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} {...chartDefaults.yAxis} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(10,10,11,0.04)' }} />
        <Legend {...chartDefaults.legend} />
        {clients.map((name, i) => {
          const colorIndex = clients.slice(0, i).filter(n => n !== 'Otros').length
          return (
            <Bar
              key={name}
              dataKey={name}
              stackId="revenue"
              fill={name === 'Otros' ? '#9CA3AF' : CLIENT_COLORS[colorIndex % CLIENT_COLORS.length]}
              radius={i === clients.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              onMouseEnter={() => { activeBarRef.current = name }}
              onMouseLeave={() => { activeBarRef.current = null }}
            />
          )
        })}
      </BarChart>
    </ResponsiveContainer>
  )
}
