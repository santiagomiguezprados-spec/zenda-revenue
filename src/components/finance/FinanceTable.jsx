/**
 * FinanceTable — Dark-themed table with green header row.
 */
export default function FinanceTable({ columns = [], data = [], title }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      {title && (
        <div style={{
          background: '#59D7A2',
          borderRadius: '8px 8px 0 0',
          padding: '8px 16px',
        }}>
          <span style={{
            color: '#000',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            fontSize: '0.8rem',
          }}>{title}</span>
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr style={{ background: title ? '#53924D' : '#59D7A2' }}>
            {columns.map((col, i) => (
              <th key={i} style={{
                padding: '8px 12px',
                color: '#000',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                textAlign: i === 0 ? 'left' : 'right',
                whiteSpace: 'nowrap',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
              }}>
                {col.label}
                {col.sortable && <span style={{ marginLeft: 4, opacity: 0.6 }}>▾</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri} style={{
              background: ri % 2 === 0 ? '#0D0D0D' : '#111111',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              {columns.map((col, ci) => (
                <td key={ci} style={{
                  padding: '7px 12px',
                  color: row._highlight ? '#59D7A2' : '#FFFFFF',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: row._bold ? 700 : 400,
                  textAlign: ci === 0 ? 'left' : 'right',
                  whiteSpace: 'nowrap',
                }}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
