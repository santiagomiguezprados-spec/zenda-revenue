import { NavLink, useNavigate } from 'react-router-dom'
import ZendaLogo from './ZendaLogo'
import useGlobalPeriod, { MES_LABELS, MES_ABR } from '../hooks/useGlobalPeriod'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function buildFallbackMonths() {
  const now = new Date()
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${MES_ABR[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`)
  }
  return months
}

const nav = [
  {
    to: '/', label: 'Dashboard', icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )
  },
  {
    to: '/pods', label: 'PODs', icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" strokeDasharray="3 2"/>
        <circle cx="12" cy="12" r="1" fill="currentColor"/>
      </svg>
    )
  },
  {
    to: '/pod-designer', label: 'Diseñador de PODs', icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    to: '/clientes', label: 'Clientes', icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  {
    to: '/maestro-clientes', label: 'Maestro Clientes', icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/><path d="M9 21V9"/>
        <circle cx="15" cy="15" r="2" fill="currentColor" opacity="0.4"/>
      </svg>
    )
  },
  {
    to: '/equipo', label: 'Equipo y Costos', icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
        <path d="M12 12v9" strokeDasharray="2 2"/>
      </svg>
    )
  },
  {
    to: '/rentabilidad', label: 'Rentabilidad', icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    )
  },
]

function PeriodSelector() {
  const mode            = useGlobalPeriod(s => s.mode)
  const setMode         = useGlobalPeriod(s => s.setMode)
  const selectedMonth   = useGlobalPeriod(s => s.selectedMonth)
  const setSelectedMonth = useGlobalPeriod(s => s.setSelectedMonth)
  const selectedQuarter = useGlobalPeriod(s => s.selectedQuarter)
  const setSelectedQuarter = useGlobalPeriod(s => s.setSelectedQuarter)
  const selectedYear    = useGlobalPeriod(s => s.selectedYear)
  const setSelectedYear = useGlobalPeriod(s => s.setSelectedYear)
  const availableMonths = useGlobalPeriod(s => s.availableMonths)

  const usingSheet = import.meta.env.VITE_GOOGLE_SHEET_ID && import.meta.env.VITE_GOOGLE_API_KEY
  const months = availableMonths.length > 0 ? availableMonths : (usingSheet ? [] : buildFallbackMonths())
  const years = [...new Set(months.map(m => m.split('-')[1]))].sort()

  const effectiveMonth = selectedMonth && months.includes(selectedMonth)
    ? selectedMonth
    : months[months.length - 1]

  function formatMonth(col) {
    const [prefix, yr] = col.split('-')
    return `${MES_LABELS[prefix] || prefix} '${yr}`
  }

  const pill = 'flex-1 py-1 text-xs font-medium rounded-lg transition-all duration-150 text-center'
  const pillActive = 'text-[#0A0A0B] font-semibold'
  const pillInactive = 'text-white/50 hover:text-white/80'

  return (
    <div className="mx-3 mb-3 px-3 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-2">Período</p>

      {/* Mode pills */}
      <div className="flex gap-1 mb-3">
        {[['mensual','Mensual'],['trimestral','Trim.'],['anual','Anual']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setMode(val)}
            className={`${pill} ${mode === val ? pillActive : pillInactive}`}
            style={mode === val ? { background: 'linear-gradient(135deg, #59D7A2, #53924D)' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mensual: dropdown de mes */}
      {mode === 'mensual' && (
        <select
          value={effectiveMonth || ''}
          onChange={e => setSelectedMonth(e.target.value)}
          className="w-full bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none border border-white/10 focus:border-[#59D7A2] transition cursor-pointer"
        >
          {months.map(m => (
            <option key={m} value={m} className="bg-[#1a1a1b] text-white">
              {formatMonth(m)}
            </option>
          ))}
        </select>
      )}

      {/* Trimestral: Q buttons + year */}
      {mode === 'trimestral' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {[1,2,3,4].map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all ${
                  selectedQuarter === q
                    ? 'text-[#0A0A0B] font-semibold'
                    : 'text-white/50 hover:text-white/80 bg-white/5'
                }`}
                style={selectedQuarter === q ? { background: 'linear-gradient(135deg, #59D7A2, #53924D)' } : {}}
              >
                Q{q}
              </button>
            ))}
          </div>
          {years.length > 1 && (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none border border-white/10 focus:border-[#59D7A2] transition cursor-pointer"
            >
              {years.map(y => (
                <option key={y} value={y} className="bg-[#1a1a1b] text-white">'{y}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Anual: solo year */}
      {mode === 'anual' && years.length > 0 && (
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          className="w-full bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none border border-white/10 focus:border-[#59D7A2] transition cursor-pointer"
        >
          {years.map(y => (
            <option key={y} value={y} className="bg-[#1a1a1b] text-white">'{y}</option>
          ))}
        </select>
      )}
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const { session } = useAuth()

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
      navigate('/login', { replace: true })
    }
  }

  // Extraer email del usuario
  const userEmail = session && session !== 'bypass' ? session.user?.email : null

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-30 flex flex-col
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:h-screen lg:flex-shrink-0
        `}
        style={{ background: 'linear-gradient(180deg, #141415 0%, #0A0A0B 60%, #050505 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <ZendaLogo size="md" variant="sidebar" />
          <button onClick={onClose} className="text-white/50 hover:text-white lg:hidden text-lg ml-3">✕</button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {nav.map(({ to, label, icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'text-white font-semibold shadow-lg'
                  : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                }`
              }
              title={label}
              style={({ isActive }) => isActive
                ? { background: 'linear-gradient(135deg, #59D7A2, #53924D)', boxShadow: '0 4px 15px rgba(89,215,162,0.30)' }
                : {}
              }
            >
              <span className="flex-shrink-0">{icon}</span>
              <span className="font-['Poppins'] flex-1">{label}</span>
              {badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(89,215,162,0.15)', color: '#59D7A2' }}>
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>


        {/* Period selector */}
        <PeriodSelector />

        {/* Divider + user / logout */}
        <div className="mx-4 mb-2 h-px bg-white/10" />
        <div className="px-5 py-4">
          {userEmail ? (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #59D7A2, #53924D)' }}>
                {userEmail.split('@')[0].slice(0,2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white/80 text-xs font-medium truncate">{userEmail.split('@')[0]}</p>
                <p className="text-white/30 text-[10px] truncate">{userEmail}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#59D7A2' }} />
              <span className="text-white/50 text-xs font-medium">En vivo</span>
            </div>
          )}
          {isSupabaseConfigured && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/8 transition-all"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesión
            </button>
          )}
          <p className="text-white/25 text-[10px] mt-2">Zenda Dashboard v1.0</p>
        </div>
      </aside>
    </>
  )
}
