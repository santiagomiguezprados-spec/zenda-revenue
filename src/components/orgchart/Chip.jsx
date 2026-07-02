/**
 * Chip.jsx
 * Pastilla reutilizable para mostrar una persona o cliente dentro de un
 * nodo del organigrama. Sin métricas — solo el nombre.
 */
export default function Chip({ label, onRemove, tone = 'neutral' }) {
  const toneClass = {
    neutral: 'bg-w text-textPrimary border-bdr',
    g: 'bg-g/15 text-g-ink border-g/40',
    m: 'bg-m/10 text-m-ink border-m/30',
  }[tone] || 'bg-w text-textPrimary border-bdr'

  return (
    <span className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-pill border-brand text-[10px] font-medium leading-none ${toneClass}`}>
      <span className="truncate max-w-[110px]">{label}</span>
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="text-textSecondary hover:text-danger leading-none px-0.5"
          title="Quitar">
          ✕
        </button>
      )}
    </span>
  )
}
