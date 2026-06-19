import { useLocation } from 'react-router-dom'
import useGlobalPeriod, { MES_LABELS } from '../hooks/useGlobalPeriod'

const titles = {
  '/': 'Dashboard General',
  '/pods': 'Vista por POD',
  '/pod-designer': 'Diseñador de PODs',
  '/clientes': 'Clientes',
  '/equipo': 'Equipo y Costos',
  '/rentabilidad': 'Rentabilidad',
}

const MODES = [
  { key: 'mensual', label: 'Mensual' },
  { key: 'trimestral', label: 'Trimestral' },
  { key: 'anual', label: 'Anual' },
]

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const title = titles[location.pathname] || 'Dashboard'

  const {
    mode, selectedMonth, selectedQuarter, selectedYear,
    availableMonths, setMode, setSelectedMonth, setSelectedQuarter,
  } = useGlobalPeriod()

  // Extraer meses unicos y years
  const years = [...new Set(availableMonths.map(m => m.split('-')[1]))].sort()
  const monthsForYear = availableMonths.filter(m => m.split('-')[1] === selectedYear)

  return (
    <header className="bg-white border-b px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-10"
      style={{ borderColor: 'rgba(89,215,162,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
          style={{ color: '#0A0A0B' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: 'Poppins, sans-serif', color: '#0A0A0B', letterSpacing: '-0.02em' }}
        >
          {title}
        </h1>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: 'rgba(89,215,162,0.08)' }}>
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200"
              style={
                mode === m.key
                  ? {
                      background: 'linear-gradient(135deg, #59D7A2, #53924D)',
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(89,215,162,0.30)',
                      fontFamily: 'Poppins, sans-serif',
                    }
                  : {
                      color: 'rgba(10,10,11,0.55)',
                      fontFamily: 'Poppins, sans-serif',
                    }
              }
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Period picker */}
        {mode === 'mensual' && monthsForYear.length > 0 && (
          <select
            value={selectedMonth || ''}
            onChange={e => setSelectedMonth(e.target.value)}
            className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {monthsForYear.map(m => {
              const prefix = m.split('-')[0]
              const yr = m.split('-')[1]
              return (
                <option key={m} value={m}>
                  {MES_LABELS[prefix] || prefix} '{yr}
                </option>
              )
            })}
          </select>
        )}

        {mode === 'trimestral' && (
          <div className="flex items-center gap-0.5 rounded-lg p-0.5 bg-gray-100">
            {[1, 2, 3, 4].map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedQuarter === q
                    ? 'bg-white text-textPrimary shadow-sm'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Q{q}
              </button>
            ))}
          </div>
        )}

        {mode === 'anual' && years.length > 1 && (
          <select
            value={selectedYear}
            onChange={e => useGlobalPeriod.getState().setSelectedYear(e.target.value)}
            className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {years.map(y => (
              <option key={y} value={y}>20{y}</option>
            ))}
          </select>
        )}
      </div>
    </header>
  )
}
