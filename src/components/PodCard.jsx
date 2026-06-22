import { formatUSD, formatPct, margenColor } from '../utils/formatters'
import { POD_COLORS } from '../utils/podColors'

const MARGEN_STYLES = {
  success: { color: 'var(--up)',   bg: 'var(--up-bg)',   bar: '#0E7A4E' },
  warning: { color: 'var(--p-ga4)', bg: 'rgba(227,116,0,0.10)', bar: '#E37400' },
  danger:  { color: 'var(--down)', bg: 'var(--down-bg)', bar: '#C2334D' },
}

const EXTRA_COLORS = ['#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1','#EF4444','#22D3EE']

export default function PodCard({ pod, onClick }) {
  const idx    = parseInt(pod.id.replace(/\D/g, '')) || 0
  const color  = POD_COLORS[pod.id] || EXTRA_COLORS[idx % EXTRA_COLORS.length] || '#4c4c4f'
  const mKey   = margenColor(pod.metricas.margenPct)
  const mStyle = MARGEN_STYLES[mKey]

  return (
    <div
      onClick={onClick}
      className="cursor-pointer overflow-hidden transition-colors duration-150"
      style={{
        background:   'var(--w)',
        border:       `var(--bw) solid var(--bdr)`,
        borderTop:    `var(--bw) solid ${color}`,
        borderRadius: 'var(--r-card)',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--bdr)'
        e.currentTarget.style.borderTopColor = color
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-3">
        <div
          className="w-10 h-10 flex items-center justify-center flex-shrink-0"
          style={{
            background:   color,
            borderRadius: 'var(--r-tag)',
            color:        '#fff',
            fontFamily:   'var(--font-mono)',
            fontWeight:   700,
            fontSize:     '12px',
            letterSpacing:'0.04em',
          }}
        >
          {pod.id}
        </div>
        <div className="min-w-0">
          <h3 className="truncate" style={{
            fontFamily:    'var(--font-body)',
            fontWeight:    600,
            fontSize:      '14px',
            color:         'var(--k)',
            letterSpacing: '-0.01em',
          }}>
            {pod.nombre}
          </h3>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   '10px',
            letterSpacing: '0.06em',
            color:      'var(--mu)',
          }}>
            {pod.metricas.totalClientes} clientes · {pod.metricas.totalEquipo} personas
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 pb-4 space-y-2.5">
        {[
          { label: 'Revenue',      value: formatUSD(pod.metricas.revenue),     color: 'var(--k)' },
          { label: 'Gross Profit', value: formatUSD(pod.metricas.grossProfit), color: pod.metricas.grossProfit >= 0 ? 'var(--up)' : 'var(--down)' },
        ].map(({ label, value, color: c }) => (
          <div key={label} className="flex justify-between items-baseline">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mu)' }}>
              {label}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em', color: c }}>
              {value}
            </span>
          </div>
        ))}

        {/* Margen: valor USD + badge % */}
        <div className="flex justify-between items-center">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mu)' }}>
            Margen
          </span>
          <div className="flex items-center gap-2">
            <span style={{
              fontFamily:    'var(--font-display)',
              fontWeight:    700,
              fontSize:      '14px',
              letterSpacing: '-0.02em',
              color:         mStyle.color,
            }}>
              {formatUSD(pod.metricas.margen)}
            </span>
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontWeight:    600,
              fontSize:      '11px',
              letterSpacing: '0.04em',
              padding:       '2px 8px',
              borderRadius:  'var(--r-pill)',
              color:         mStyle.color,
              background:    mStyle.bg,
            }}>
              {formatPct(pod.metricas.margenPct)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full" style={{ background: 'var(--gray)', position: 'relative' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(Math.max((pod.metricas.margenPct + 50) / 100 * 100, 0), 100)}%`,
              background: mStyle.bar,
            }}
          />
          {/* Break-even marker at 0% margin */}
          <div style={{
            position:  'absolute',
            left:      '50%',
            top:       '-3px',
            bottom:    '-3px',
            width:     '2px',
            background: 'var(--mu)',
            transform: 'translateX(-50%)',
            borderRadius: '1px',
            zIndex:    1,
          }} />
        </div>

        {/* Top clients */}
        <div className="pt-1">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mu)', marginBottom: '6px' }}>
            Clientes principales
          </p>
          <div className="space-y-1">
            {pod.clientes.slice(0, 2).map(c => (
              <div key={c.nombre} className="flex justify-between">
                <span className="truncate mr-2" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--k)' }}>
                  {c.nombre}
                </span>
                <span className="flex-shrink-0" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mu)' }}>
                  {formatUSD(c.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
