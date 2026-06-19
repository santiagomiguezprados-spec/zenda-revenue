import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { formatUSD } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-textPrimary mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-textSecondary">{p.name}:</span>
          <span className="font-medium">{formatUSD(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function RevenueBarChart({ data }) {
  const formatted = data.map(d => ({
    ...d,
    name: d.pod.replace(/^A\d+\s/, '').substring(0, 12),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
        <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6B7280' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey="revenue"    name="Revenue"      fill="#30b299" radius={[4,4,0,0]} />
        <Bar dataKey="costoEquipo" name="Costo Equipo" fill="#4c4c4f" radius={[4,4,0,0]} />
        <Bar dataKey="overhead"   name="Overhead"     fill="#41bfbe" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
