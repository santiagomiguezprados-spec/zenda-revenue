/**
 * FinanceCard — Dark surface card container for Finance pages.
 */
export default function FinanceCard({ title, children, className = '', style = {} }) {
  return (
    <div style={{
      background: '#0D0D0D',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '1rem',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
      ...style,
    }} className={className}>
      {title && (
        <h3 style={{
          color: '#FFFFFF',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 600,
          fontSize: '0.85rem',
          marginBottom: '16px',
          letterSpacing: '0.01em',
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
