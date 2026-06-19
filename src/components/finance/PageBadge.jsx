/**
 * PageBadge — Dark gray rounded rectangle with white bold text (top-right of pages).
 */
export default function PageBadge({ title }) {
  return (
    <div style={{
      background: '#1A1A1A',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '10px',
      padding: '6px 18px',
      display: 'inline-flex',
      alignItems: 'center',
    }}>
      <span style={{
        color: '#FFFFFF',
        fontFamily: 'Poppins, sans-serif',
        fontWeight: 700,
        fontSize: '0.8rem',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}>
        {title}
      </span>
    </div>
  )
}
