const VALUE_COLORS = {
  default:   'var(--k)',
  accent:    'var(--g-ink)',
  success:   'var(--up)',
  danger:    'var(--down)',
  warning:   'var(--p-ga4)',
  secondary: 'var(--m)',
  tertiary:  '#1a6a8a',
}

const BORDER_COLORS = {
  default:   'var(--bdr)',
  accent:    'var(--g)',
  success:   'var(--g)',
  danger:    'var(--down)',
  warning:   'var(--p-ga4)',
  secondary: 'var(--m)',
  tertiary:  'var(--s)',
}

const ICON_BG = {
  default:   'rgba(10,10,11,0.06)',
  accent:    'rgba(89,215,162,0.12)',
  success:   'var(--up-bg)',
  danger:    'var(--down-bg)',
  warning:   'rgba(227,116,0,0.10)',
  secondary: 'rgba(231,28,162,0.08)',
  tertiary:  'rgba(149,214,234,0.16)',
}

export default function KPICard({ title, value, subtitle, color = 'default', icon }) {
  const valueColor  = VALUE_COLORS[color]  || VALUE_COLORS.default
  const borderColor = BORDER_COLORS[color] || BORDER_COLORS.default
  const iconBg      = ICON_BG[color]       || ICON_BG.default

  return (
    <div
      className="flex flex-col gap-2 transition-colors"
      style={{
        background:     'var(--w)',
        border:         `var(--bw) solid ${borderColor}`,
        borderRadius:   'var(--r-card)',
        padding:        '18px 20px',
        containerType:  'inline-size',
      }}
    >
      <div className="flex items-center justify-between">
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '10.5px',
          fontWeight:    500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         'var(--mu)',
        }}>
          {title}
        </p>
        {icon && (
          <div className="w-8 h-8 flex items-center justify-center text-base"
            style={{ backgroundColor: iconBg, borderRadius: 'var(--r-tag)' }}>
            {icon}
          </div>
        )}
      </div>

      <p style={{
        fontFamily:    'var(--font-display)',
        fontWeight:    900,
        fontSize:      'clamp(16px, 13cqi, 24px)',
        letterSpacing: '-0.03em',
        lineHeight:    1,
        color:         valueColor,
        whiteSpace:    'nowrap',
        overflow:      'hidden',
      }}>
        {value}
      </p>

      {subtitle && (
        <p style={{ fontSize: '12px', color: 'var(--mu)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
