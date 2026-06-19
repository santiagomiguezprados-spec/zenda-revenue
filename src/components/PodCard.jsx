import { formatUSD, formatPct, margenColor } from '../utils/formatters'
import { POD_COLORS } from '../utils/podColors'

// Colores semáforo alineados a paleta Zenda
const MARGEN_STYLES = {
  success: { color: '#009444', bg: 'rgba(0,148,68,0.09)',   bar: '#009444' },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', bar: '#F59E0B' },
  danger:  { color: '#E53935', bg: 'rgba(229,57,53,0.10)',  bar: '#E53935' },
}

const EXTRA_COLORS = ['#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1','#EF4444','#22D3EE']

export default function PodCard({ pod, onClick }) {
  const idx = parseInt(pod.id.replace(/\D/g, '')) || 0
  const color  = POD_COLORS[pod.id] || EXTRA_COLORS[idx % EXTRA_COLORS.length] || '#4c4c4f'
  const mKey   = margenColor(pod.metricas.margenPct)
  const mStyle = MARGEN_STYLES[mKey]

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl cursor-pointer overflow-hidden transition-all duration-200"
      style={{
        borderTop: `4px solid ${color}`,
        boxShadow: '0 1px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.12), 0 0 0 1px ${color}40`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)'}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}bb)`,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          {pod.id}
        </div>
        <div className="min-w-0">
          <h3
            className="font-semibold text-sm truncate"
            style={{ color: '#2d2d30', fontFamily: 'Montserrat, sans-serif' }}
          >
            {pod.nombre}
          </h3>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            {pod.metricas.totalClientes} clientes · {pod.metricas.totalEquipo} personas
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 pb-4 space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: '#9CA3AF' }}>Revenue</span>
          <span className="text-sm font-semibold" style={{ color: '#2d2d30', fontFamily: 'Montserrat, sans-serif' }}>
            {formatUSD(pod.metricas.revenue)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: '#9CA3AF' }}>Gross Profit</span>
          <span
            className="text-sm font-semibold"
            style={{ color: pod.metricas.grossProfit >= 0 ? '#009444' : '#E53935', fontFamily: 'Montserrat, sans-serif' }}
          >
            {formatUSD(pod.metricas.grossProfit)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: '#9CA3AF' }}>Margen</span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ color: mStyle.color, backgroundColor: mStyle.bg, fontFamily: 'Montserrat, sans-serif' }}
          >
            {formatPct(pod.metricas.margenPct)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f0f0f1' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(Math.max((pod.metricas.margenPct + 50) / 100 * 100, 0), 100)}%`,
              backgroundColor: mStyle.bar,
            }}
          />
        </div>

        {/* Top clients */}
        <div className="pt-1">
          <p className="text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Clientes principales</p>
          <div className="space-y-1">
            {pod.clientes.slice(0, 2).map(c => (
              <div key={c.nombre} className="flex justify-between text-xs">
                <span className="truncate mr-2" style={{ color: '#4c4c4f' }}>{c.nombre}</span>
                <span className="flex-shrink-0" style={{ color: '#9CA3AF' }}>{formatUSD(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
