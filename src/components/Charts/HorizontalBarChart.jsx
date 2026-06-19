import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { formatUSD } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-textPrimary">{label}</p>
      <p className="text-textSecondary">{formatUSD(payload[0].value)}/mes</p>
    </div>
  )
}

export default function HorizontalBarChart({ data, dataKey = 'costoUSD_1300' }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 36 + 40, 200)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
        <XAxis type="number" tickFormatter={v => `${v}`} tick={{ fontSize: 11, fill: '#6B7280' }} />
        <YAxis
          type="category"
          dataKey="nombre"
          width={130}
          tick={{ fontSize: 11, fill: '#6B7280' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={dataKey} radius={[0,4,4,0]} label={{ position: 'right', fontSize: 11, fill: '#6B7280', formatter: v => formatUSD(v) }}>
          {data.map((_, i) => (
            <Cell key={i} fill={i % 2 === 0 ? '#0A2540' : '#00C896'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
