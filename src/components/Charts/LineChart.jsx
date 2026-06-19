import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { formatUSD } from '../../utils/formatters'

const COLORS = ['#0A2540', '#00C896', '#F0B429', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#64748B', '#EF4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold text-textPrimary mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-textSecondary text-xs truncate">{p.name}:</span>
          <span className="font-medium text-xs">{formatUSD(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ClientLineChart({ data, clients }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6B7280' }} />
        <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6B7280' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '10px' }} />
        {clients.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
