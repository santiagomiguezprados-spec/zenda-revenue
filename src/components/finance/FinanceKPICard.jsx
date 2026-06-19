/**
 * FinanceKPICard — Pill-shaped KPI card for Zenda Finance dark theme.
 * Green pill with black text (default) or custom variant.
 */
export default function FinanceKPICard({
  label,
  value,
  sublabel,
  variant = 'green',   // 'green' | 'red' | 'dark' | 'outline'
  size = 'md',         // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const bg = {
    green:   '#59D7A2',
    red:     '#E57373',
    dark:    '#1A1A1A',
    outline: 'transparent',
  }[variant] || '#59D7A2'

  const textColor = (variant === 'dark' || variant === 'outline') ? '#FFFFFF' : '#000000'
  const border    = variant === 'outline' ? '1.5px solid #59D7A2' : 'none'

  const padding = { sm: '6px 18px', md: '10px 24px', lg: '14px 32px' }[size]
  const fontSize = { sm: '1rem',    md: '1.5rem',    lg: '2.2rem'   }[size]
  const labelSz  = { sm: '0.6rem',  md: '0.7rem',    lg: '0.75rem'  }[size]

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {label && (
        <span style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: labelSz,
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {label}
        </span>
      )}
      <div style={{
        background: bg,
        color: textColor,
        borderRadius: '50px',
        padding,
        border,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: size === 'lg' ? '160px' : size === 'md' ? '120px' : '80px',
      }}>
        <span style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          fontSize,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
        }}>
          {value}
        </span>
      </div>
      {sublabel && (
        <span style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '0.65rem',
          fontFamily: 'Poppins, sans-serif',
        }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
