import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import { formatUSD } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-textPrimary mb-1">{label}</p>
      {payload.map(p => p.name !== 'invisible' && (
        <p key={p.name} style={{ color: p.fill }} className="font-medium">
          {formatUSD(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function WaterfallChart({ revenue, gop, overhead, profits }) {
  const data = [
    { name: 'Revenue', value: revenue, start: 0, end: revenue, color: '#0A2540' },
    { name: 'Costo Equipo', value: -(revenue - gop), start: gop, end: revenue, color: '#EF4444' },
    { name: 'GOP', value: gop, start: 0, end: gop, color: '#00C896' },
    { name: 'Overhead', value: -overhead, start: profits < 0 ? profits : 0, end: gop, color: '#F0B429' },
    { name: 'Profits', value: profits, start: 0, end: profits, color: profits >= 0 ? '#10B981' : '#EF4444' },
  ]

  const chartData = data.map(d => ({
    name: d.name,
    invisible: Math.min(d.start, d.end),
    value: Math.abs(d.end - d.start),
    color: d.color,
    rawValue: d.value,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
        <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6B7280' }} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#9CA3AF" />
        <Bar dataKey="invisible" stackId="a" fill="transparent" />
        <Bar dataKey="value" stackId="a" radius={[4,4,0,0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
