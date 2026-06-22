/**
 * FinanceKPICard — pill KPI para el theme oscuro de Finance.
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
    green:   'var(--g)',
    red:     'var(--down)',
    dark:    'var(--k)',
    outline: 'transparent',
  }[variant] || 'var(--g)'

  const textColor = (variant === 'dark' || variant === 'outline') ? 'var(--w)' : 'var(--k)'
  const border    = variant === 'outline' ? 'var(--bw) solid var(--g)' : 'none'

  const padding  = { sm: '6px 18px',  md: '10px 24px', lg: '14px 32px' }[size]
  const fontSize = { sm: '1rem',       md: '1.5rem',    lg: '2.2rem'   }[size]
  const labelSz  = { sm: '9px',        md: '10px',      lg: '11px'     }[size]

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {label && (
        <span style={{
          color:         'rgba(255,255,255,0.55)',
          fontFamily:    'var(--font-mono)',
          fontSize:      labelSz,
          fontWeight:    500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          {label}
        </span>
      )}
      <div style={{
        background:    bg,
        color:         textColor,
        borderRadius:  'var(--r-pill)',
        padding,
        border,
        display:       'inline-flex',
        alignItems:    'center',
        justifyContent:'center',
        minWidth: size === 'lg' ? '160px' : size === 'md' ? '120px' : '80px',
      }}>
        <span style={{
          fontFamily:  'var(--font-display)',
          fontWeight:  900,
          fontSize,
          letterSpacing: '-0.03em',
          lineHeight:  1.1,
          whiteSpace:  'nowrap',
        }}>
          {value}
        </span>
      </div>
      {sublabel && (
        <span style={{
          color:      'rgba(255,255,255,0.4)',
          fontSize:   '10px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.06em',
        }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
