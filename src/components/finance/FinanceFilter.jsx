/**
 * FinanceFilter — Green outlined pill-style dropdown filter.
 */
export default function FinanceFilter({ label, options = [], value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {label && (
        <span style={{
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'Poppins, sans-serif',
          fontSize: '0.75rem',
          fontWeight: 500,
        }}>
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        style={{
          background: 'transparent',
          border: '1.5px solid #59D7A2',
          borderRadius: '50px',
          color: '#59D7A2',
          fontFamily: 'Poppins, sans-serif',
          fontSize: '0.78rem',
          fontWeight: 600,
          padding: '5px 28px 5px 14px',
          appearance: 'none',
          cursor: 'pointer',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%233DDC84' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: '#111', color: '#fff' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
