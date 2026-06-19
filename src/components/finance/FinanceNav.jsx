import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logoWhite from '../../assets/zenda-logo-white.png'

const NAV = [
  { label: 'Menu', to: '/finance' },
  {
    label: 'Balance',
    children: [
      { label: 'Cashflow',    to: '/finance/cashflow' },
      { label: 'Budget vs P&L', to: '/finance/budget' },
    ],
  },
  {
    label: 'Sales & Cost',
    children: [
      { label: 'Activos + Ventas',  to: '/finance/activos-ventas' },
      { label: 'Pasivos + Costos',  to: '/finance/pasivos-costos' },
    ],
  },
  {
    label: 'Operations',
    children: [
      { label: 'GOP by POD',         to: '/finance/gop-pod' },
      { label: 'Cartera',            to: '/finance/cartera' },
      { label: 'Indicadores People', to: '/finance/people' },
    ],
  },
]

export default function FinanceNav() {
  const [open, setOpen] = useState(null)
  const navigate = useNavigate()

  return (
    <nav style={{
      background: '#0A0A0A',
      borderBottom: '1px solid rgba(89,215,162,0.15)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      height: 52,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo — Z mark con gradiente oficial + logo blanco (Brand Rule #6) */}
      <NavLink to="/finance" style={{ textDecoration: 'none', marginRight: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Z mark — gradiente #77BFBE → #53924D (135deg) */}
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, #77BFBE 0%, #53924D 100%)',
          borderRadius: '7px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(119,191,190,0.30)',
        }}>
          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff', fontFamily: 'Poppins,sans-serif', letterSpacing: '-0.02em' }}>Z</span>
        </div>
        {/* White wordmark (Brand Rule: white on dark) */}
        <img src={logoWhite} alt="Zenda" style={{ height: 22, width: 'auto', objectFit: 'contain' }} />
        <span style={{
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'Poppins,sans-serif',
          fontWeight: 400,
          fontSize: '0.7rem',
          borderLeft: '1px solid rgba(255,255,255,0.15)',
          paddingLeft: 8,
          marginLeft: 2,
        }}>finance</span>
      </NavLink>

      {/* Nav items */}
      {NAV.map((item) => {
        if (!item.children) {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              style={({ isActive }) => ({
                color: isActive ? '#3DDC84' : 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                fontFamily: 'Poppins,sans-serif',
                fontWeight: 600,
                fontSize: '0.8rem',
                padding: '4px 12px',
                borderBottom: isActive ? '2px solid #3DDC84' : '2px solid transparent',
                transition: 'all 0.2s',
              })}
            >
              {item.label}
            </NavLink>
          )
        }

        return (
          <div
            key={item.label}
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpen(item.label)}
            onMouseLeave={() => setOpen(null)}
          >
            <button style={{
              color: open === item.label ? '#3DDC84' : 'rgba(255,255,255,0.7)',
              background: 'none',
              border: 'none',
              fontFamily: 'Poppins,sans-serif',
              fontWeight: 600,
              fontSize: '0.8rem',
              padding: '4px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderBottom: open === item.label ? '2px solid #3DDC84' : '2px solid transparent',
            }}>
              {item.label}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke={open === item.label ? '#3DDC84' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {open === item.label && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: '#111111',
                border: '1px solid rgba(89,215,162,0.2)',
                borderRadius: '8px',
                minWidth: '180px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                zIndex: 200,
              }}>
                {item.children.map(child => (
                  <button
                    key={child.to}
                    onClick={() => { navigate(child.to); setOpen(null) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 16px',
                      color: '#fff',
                      background: 'none',
                      border: 'none',
                      fontFamily: 'Poppins,sans-serif',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(89,215,162,0.1)'}
                    onMouseLeave={e => e.target.style.background = 'none'}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Back to main app */}
      <div style={{ marginLeft: 'auto' }}>
        <NavLink to="/" style={{
          color: 'rgba(255,255,255,0.4)',
          textDecoration: 'none',
          fontFamily: 'Poppins,sans-serif',
          fontSize: '0.72rem',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50px',
          padding: '4px 12px',
          transition: 'all 0.2s',
        }}>
          ← Revenue Ops
        </NavLink>
      </div>
    </nav>
  )
}
