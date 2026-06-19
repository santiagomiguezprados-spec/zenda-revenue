import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, Dot,
} from 'recharts'
import PageBadge from '../../components/finance/PageBadge'
import FinanceCard from '../../components/finance/FinanceCard'
import FinanceKPICard from '../../components/finance/FinanceKPICard'
import FinanceTable from '../../components/finance/FinanceTable'
import {
  activosKPI, ventasTrimestrales, saldosBancarios,
  cobranzasUSD, cobranzasARS,
} from '../../data/finance/mockData'

const darkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(89,215,162,0.25)', borderRadius: 8, padding: '8px 14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins,sans-serif', fontSize: '0.72rem', margin: '0 0 4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: '#59D7A2', fontFamily: 'Poppins,sans-serif', fontSize: '0.82rem', fontWeight: 700, margin: '2px 0' }}>
          {p.value?.toFixed(1)} mil
        </p>
      ))}
    </div>
  )
}

export default function ActivosVentas() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PageBadge title="Apertura Activos + Ventas" />
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <FinanceKPICard label="Saldo Bancario USD — Pesificado" value={activosKPI.bancarioUSD} size="md" />
        <FinanceKPICard label="Saldo Bancario USD — Dolarizado" value={activosKPI.dolarizado} size="md" />
        <FinanceKPICard label="Total Con Deudas y Deudores" value={activosKPI.totalConDeudas} size="md" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Ventas Trimestrales */}
        <FinanceCard title="Ventas Trimestrales">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ventasTrimestrales} margin={{ top: 16, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="q" tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v} mil`} />
              <Tooltip content={darkTooltip} />
              <Bar dataKey="v" fill="#59D7A2" radius={[4,4,0,0]}
                label={{ position: 'top', fill: 'rgba(255,255,255,0.5)', fontSize: 9, formatter: v => `${String(v).replace('.', ',')} mil` }} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Poppins,sans-serif', fontSize: '0.68rem', marginTop: 8 }}>
            *Netas de factura B
          </p>
        </FinanceCard>

        {/* Saldos Bancarios */}
        <FinanceCard title="Saldos Bancarios (Dolarizado)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={saldosBancarios} margin={{ top: 16, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins,sans-serif', fontSize: 9 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif', fontSize: 10 }} axisLine={false} tickLine={false} domain={[70, 200]} tickFormatter={v => `${v}k`} />
              <Tooltip content={darkTooltip} />
              <Legend
                wrapperStyle={{ fontFamily: 'Poppins,sans-serif', fontSize: '0.7rem' }}
                formatter={() => <span style={{ color: 'rgba(255,255,255,0.7)' }}>Dolarizado</span>}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke="#59D7A2"
                strokeWidth={2}
                dot={{ fill: '#59D7A2', r: 3 }}
                activeDot={{ r: 5 }}
                name="Dolarizado"
                label={{ position: 'top', fill: 'rgba(255,255,255,0.45)', fontSize: 8, formatter: v => `${v}` }}
              />
            </LineChart>
          </ResponsiveContainer>
        </FinanceCard>
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <FinanceTable
          title="Cobranzas Pendientes USD"
          columns={[
            { key: 'cliente',   label: 'Cliente',     sortable: true },
            { key: 'porCobrar', label: 'Por Cobrar ▾', sortable: true },
          ]}
          data={cobranzasUSD}
        />
        <FinanceTable
          title="Cobranzas Pendientes ARS"
          columns={[
            { key: 'cliente',   label: 'Cliente',     sortable: true },
            { key: 'porCobrar', label: 'Por Cobrar ▾', sortable: true },
          ]}
          data={cobranzasARS}
        />
      </div>
    </div>
  )
}
