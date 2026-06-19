export function formatUSD(value) {
  if (value === null || value === undefined) return 'USD 0'
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('es-AR', { maximumFractionDigits: 0 })
  return value < 0 ? `-USD ${formatted}` : `USD ${formatted}`
}

export function formatARS(value) {
  if (value === null || value === undefined) return '$0'
  const formatted = Math.abs(value).toLocaleString('es-AR', { maximumFractionDigits: 0 })
  return value < 0 ? `-$${formatted}` : `$${formatted}`
}

export function formatPct(value) {
  if (value === null || value === undefined) return '0%'
  return `${value.toFixed(1).replace('.', ',')}%`
}

export function formatNumber(value) {
  if (value === null || value === undefined) return '0'
  return value.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

export function isNegative(value) {
  return value < 0
}

export function valueColor(value) {
  if (value > 0) return 'text-success'
  if (value < 0) return 'text-danger'
  return 'text-textSecondary'
}

export function margenColor(pct) {
  if (pct > 20) return 'success'
  if (pct >= 0) return 'warning'
  return 'danger'
}
