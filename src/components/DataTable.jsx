export default function DataTable({ columns, data, onSort, sortConfig, compact }) {
  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) return '↕'
    return sortConfig.dir === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e8eeec' }}>
      <table className="w-full text-sm" style={{ fontFamily: 'Montserrat, Trebuchet MS, sans-serif' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4faf7', borderBottom: '1px solid #e8eeec' }}>
            {columns.map((col, ci) => (
              <th
                key={(col.id || col.key) + '_' + ci}
                onClick={() => col.sortable && onSort && onSort(col.key)}
                className={`px-4 ${compact ? 'py-2' : 'py-3'} text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap
                  ${col.sortable ? 'cursor-pointer select-none' : ''}
                  ${col.align === 'right' ? 'text-right' : ''}`}
                style={{ color: '#4c4c4f' }}
              >
                {col.label}
                {col.sortable && (
                  <span className="ml-1 text-gray-400">{getSortIcon(col.key)}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center" style={{ color: '#9CA3AF' }}>
                Sin resultados
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className="transition-colors"
                style={{ borderTop: '1px solid #f0f5f3' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f7fbf9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
              >
                {columns.map((col, ci) => (
                  <td
                    key={(col.id || col.key) + '_' + ci}
                    className={`px-4 ${compact ? 'py-2' : 'py-3'} whitespace-nowrap
                      ${col.align === 'right' ? 'text-right' : ''}`}
                    style={{ color: '#4c4c4f' }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
