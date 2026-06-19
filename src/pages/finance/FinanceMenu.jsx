import { useNavigate } from 'react-router-dom'
import PageBadge from '../../components/finance/PageBadge'
import logoWhite from '../../assets/zenda-logo-white.png'

const BUTTONS = [
  { label: 'Cash flow vs\nBalance Sheet', to: '/finance/cashflow',       row: 0 },
  { label: 'Budget vs P&L',              to: '/finance/budget',          row: 0 },
  { label: 'Pasivos y costos',           to: '/finance/pasivos-costos',  row: 0 },
  { label: 'GOP',                        to: '/finance/gop-pod',         row: 1 },
  { label: 'Cartera',                    to: '/finance/cartera',         row: 1 },
  { label: 'Indicadores People',         to: '/finance/people',          row: 1 },
  { label: 'Activos y ventas',           to: '/finance/activos-ventas',  row: 2 },
]

export default function FinanceMenu() {
  const navigate = useNavigate()
  const rows = [0, 1, 2].map(r => BUTTONS.filter(b => b.row === r))

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 64 }}>
        {/* Logo — Z mark gradiente oficial + wordmark blanco (Brand Rules #2 y #6) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, #77BFBE 0%, #53924D 100%)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(119,191,190,0.25)',
          }}>
            <span style={{ fontWeight: 900, fontSize: '1.8rem', color: '#fff', fontFamily: 'Poppins,sans-serif', letterSpacing: '-0.02em' }}>Z</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <img src={logoWhite} alt="Zenda" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Poppins,sans-serif', fontWeight: 400, fontSize: '0.78rem', letterSpacing: '0.08em' }}>
              FINANCE
            </span>
          </div>
        </div>
        <PageBadge title="Finance" />
      </div>

      {/* Navigation grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto', width: '100%' }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{
            display: 'flex',
            gap: 20,
            justifyContent: ri === 2 ? 'center' : 'flex-start',
          }}>
            {row.map(btn => (
              // Brand Rule #4: Outlined by default, fill on hover (0.4s ease)
              <button
                key={btn.to}
                onClick={() => navigate(btn.to)}
                style={{
                  flex: ri === 2 ? '0 0 240px' : 1,
                  minHeight: 90,
                  background: 'transparent',
                  border: '1.5px solid #59D7A2',
                  borderRadius: '0.5rem',
                  color: '#59D7A2',
                  fontFamily: 'Poppins,sans-serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  whiteSpace: 'pre-line',
                  textAlign: 'center',
                  padding: '20px 24px',
                  transition: 'all 0.4s ease',
                  lineHeight: 1.3,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#59D7A2'
                  e.currentTarget.style.color = '#000000'
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(89,215,162,0.30)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#59D7A2'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <p style={{
        color: 'rgba(255,255,255,0.2)',
        fontFamily: 'Poppins,sans-serif',
        fontSize: '0.7rem',
        textAlign: 'center',
        marginTop: 48,
      }}>
        Zenda Finance Dashboard v1.0 · {new Date().getFullYear()}
      </p>
    </div>
  )
}
