import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import PageBadge from '../../components/finance/PageBadge'
import FinanceCard from '../../components/finance/FinanceCard'
import FinanceKPICard from '../../components/finance/FinanceKPICard'
import FinanceTable from '../../components/finance/FinanceTable'
import { peopleKPI, payrollData, headcountData, notebooksData } from '../../data/finance/mockData'

const PAYROLL_SERIES = [
  { key: 'strategist',   label: 'Sueldos Strategist', color: '#59D7A2' },
  { key: 'managers',     label: 'Sueldos Managers',   color: '#5B8CDB' },
  { key: 'tls',          label: 'Sueldos TLs',        color: '#7EC8E3' },
  { key: 'businessLead', label: 'Business Lead',      color: '#8E8FA8' },
  { key: 'gerentes',     label: 'Sueldo Gerentes JC', color: '#3A3D6E' },
  { key: 'pasantes',     label: 'Pasante',            color: '#C9CDD4' },
]

const darkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(89,215,162,0.25)', borderRadius: 8, padding: '8px 14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins,sans-serif', fontSize: '0.72rem', margin: '0 0 6px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color, fontFamily: 'Poppins,sans-serif', fontSize: '0.75rem', fontWeight: 600, margin: '2px 0' }}>
          {p.name}: {p.value?.toFixed(1)}k
        </p>
      ))}
    </div>
  )
}

// Custom label for stacked bars total
const StackedTotalLabel = (props) => {
  const { x, y, width, value, index, data } = props
  if (index === undefined || !data) return null
  const row = data[index]
  if (!row) return null
  const total = PAYROLL_SERIES.reduce((s, s2) => s + (row[s2.key] || 0), 0)
  return (
    <text x={x + width / 2} y={y - 4} fill="rgba(255,255,255,0.5)" textAnchor="middle"
      fontFamily="Poppins,sans-serif" fontSize={9}>
      {total.toFixed(1)}k
    </text>
  )
}

export default function IndicadoresPeople() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PageBadge title="People" />
      </div>

      {/* Headcount KPI */}
      <FinanceCard>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Poppins,sans-serif', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
              Headcount vs Previo
            </p>
            <FinanceKPICard label="Headcount actual" value={peopleKPI.headcount} size="lg" />
          </div>
          <div style={{ height: 80, width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <FinanceKPICard label="Período anterior" value={peopleKPI.prev} size="md" variant="outline" />
          </div>
        </div>
      </FinanceCard>

      {/* Payroll stacked chart */}
      <FinanceCard title="Payroll — Total Nómina">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={payrollData} margin={{ top: 20, right: 10, bottom: 5, left: 10 }} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)}k`} />
            <Tooltip content={darkTooltip} />
            <Legend
              wrapperStyle={{ fontFamily: 'Poppins,sans-serif', fontSize: '0.72rem' }}
              formatter={(val, entry) => (
                <span style={{ color: entry.color }}>{val}</span>
              )}
            />
            {PAYROLL_SERIES.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                stackId="payroll"
                radius={i === PAYROLL_SERIES.length - 1 ? [4,4,0,0] : [0,0,0,0]}
                label={i === PAYROLL_SERIES.length - 1
                  ? <StackedTotalLabel data={payrollData} />
                  : undefined
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </FinanceCard>

      {/* Headcount + Notebooks row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
        <FinanceCard title="Headcount">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={headcountData} margin={{ top: 16, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }} axisLine={false} tickLine={false} domain={[20, 40]} />
              <Tooltip content={darkTooltip} />
              <Bar dataKey="n" fill="#59D7A2" radius={[4,4,0,0]} name="Headcount"
                label={{ position: 'top', fill: 'rgba(255,255,255,0.5)', fontSize: 9 }} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Poppins,sans-serif', fontSize: '0.68rem', marginTop: 8 }}>
            *No se contabiliza COO ni Outsourcing. (Piso +3)
          </p>
        </FinanceCard>

        <div style={{ minWidth: 220 }}>
          <FinanceTable
            title="Notebooks"
            columns={[
              { key: 'estado', label: 'Estado'  },
              { key: 'zender', label: 'Zender'  },
            ]}
            data={notebooksData}
          />
        </div>
      </div>
    </div>
  )
}
