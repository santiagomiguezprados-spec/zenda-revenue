/**
 * OverheadNode.jsx
 * Nodo único y raíz del organigrama — todo el overhead junto en una sola
 * tarjeta (src/utils/clevel.js → C_LEVEL_ALL: los 6 C-Level, fijos +
 * operativos). Solo lectura: la membresía de este nodo la define
 * exclusivamente clevel.js, no se edita desde acá.
 */
import { Handle, Position } from '@xyflow/react'

export default function OverheadNode({ data }) {
  return (
    <div className="rounded-card border-brand border-k px-5 py-3.5 min-w-[260px]" style={{ background: '#0A0A0B' }}>
      <p className="font-mono text-[9px] uppercase tracking-wide text-white/50 mb-2">Overhead · C-Level</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {data.nombres.map(n => (
          <p key={n} className="text-xs font-semibold text-white whitespace-nowrap">{n}</p>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-g" />
    </div>
  )
}
