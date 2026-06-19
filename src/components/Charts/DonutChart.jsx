import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { formatUSD } from '../../utils/formatters'
import { POD_COLORS } from '../../utils/podColors'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-textPrimary">{d.name}</p>
      <p className="text-textSecondary">{formatUSD(d.value)} <span className="text-xs">({d.payload.pctLabel}%)</span></p>
    </div>
  )
}

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent: rechartsPct }) => {
  if (rechartsPct < 0.05) return null
  const percent = rechartsPct
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.revenue, 0)
  const chartData = data.map(d => ({
    name: d.pod.replace(/^A\d+\s/, ''),
    value: d.revenue,
    id: d.pod.match(/^(A\d+)/)?.[1] || 'A1',
    pctLabel: ((d.revenue / total) * 100).toFixed(1),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
          label={renderLabel}
        >
          {chartData.map((entry) => (
            <Cell key={entry.id} fill={POD_COLORS[entry.id] || '#6B7280'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '11px' }}
          formatter={(value) => <span style={{ color: '#6B7280' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
