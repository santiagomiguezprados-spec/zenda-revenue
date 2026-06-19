// Paleta oficial Zenda — BRAND.md
const BORDER_COLORS = {
  default:   '#0A0A0B',   // Near Black
  accent:    '#59D7A2',   // Zenda Green
  success:   '#59D7A2',   // Zenda Green
  danger:    '#E53935',
  warning:   '#F59E0B',
  secondary: '#E71CA2',   // Zenda Pink
  tertiary:  '#95D6EA',   // Zenda Cyan
}

const VALUE_COLORS = {
  default:   '#0A0A0B',
  accent:    '#59D7A2',
  success:   '#53924D',   // logo forest (más oscuro, más legible)
  danger:    '#E53935',
  warning:   '#F59E0B',
  secondary: '#E71CA2',
  tertiary:  '#3BA8C8',
}

const ICON_BG = {
  default:   'rgba(10,10,11,0.06)',
  accent:    'rgba(89,215,162,0.12)',
  success:   'rgba(89,215,162,0.12)',
  danger:    'rgba(229,57,53,0.10)',
  warning:   'rgba(245,158,11,0.10)',
  secondary: 'rgba(231,28,162,0.10)',
  tertiary:  'rgba(149,214,234,0.15)',
}

export default function KPICard({ title, value, subtitle, color = 'default', icon }) {
  const borderColor = BORDER_COLORS[color] || BORDER_COLORS.default
  const valueColor  = VALUE_COLORS[color]  || VALUE_COLORS.default
  const iconBg      = ICON_BG[color]       || ICON_BG.default

  return (
    <div
      className="bg-white flex flex-col gap-2"
      style={{
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        borderRadius: '1rem',
        padding: '1.25rem',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(10,10,11,0.64)', fontFamily: 'Poppins, sans-serif' }}>
          {title}
        </p>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ backgroundColor: iconBg }}>
            {icon}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold leading-tight"
        style={{ color: valueColor, fontFamily: 'Poppins, sans-serif' }}>
        {value}
      </p>

      {subtitle && (
        <p className="text-xs" style={{ color: 'rgba(10,10,11,0.45)', fontFamily: 'Poppins, sans-serif' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
