/**
 * PodNode.jsx
 * Nodo de un POD en el organigrama. Header = mismo id/nombre que el
 * Diseñador de PODs. Las secciones Equipo/Clientes son zonas de drop que
 * llaman DIRECTAMENTE a las acciones de usePodDesignStore (assignMember,
 * removeMember, assignClient, removeClient) — no hay membresía propia acá.
 *
 * El Equipo se agrupa por nivel (Team Leader/Manager/Analista) usando
 * useOrgChartStore.roleLevels — click en el badge de nivel de un chip para
 * reclasificar a esa persona (cicla lider → manager → analista).
 */
import { Handle, Position } from '@xyflow/react'
import Chip from './Chip'
import { LEVELS, LEVEL_LABELS } from '../../utils/orgLevels'

const DND_MEMBER = 'application/zenda-member'
const DND_CLIENT = 'application/zenda-client'
const LEVEL_BADGE = { lider: 'L', manager: 'M', analista: 'A' }

export default function PodNode({ data }) {
  const {
    pod, members, clients, roleLevels,
    onDropMember, onDropClient, onRemoveMember, onRemoveClient, onCycleLevel, readOnly,
  } = data

  const handleDrop = (e, kind) => {
    e.preventDefault()
    if (readOnly) return
    const mime = kind === 'member' ? DND_MEMBER : DND_CLIENT
    const raw = e.dataTransfer.getData(mime)
    if (!raw) return
    const payload = JSON.parse(raw)
    if (kind === 'member') onDropMember(payload)
    else onDropClient(payload)
  }

  const groups = LEVELS
    .map(level => ({
      level,
      members: members.filter(m => (roleLevels[m.nombre] || 'analista') === level),
    }))
    .filter(g => g.members.length > 0)

  return (
    <div className="rounded-card border-brand border-bdr bg-w px-3 py-3 w-[230px]">
      <Handle type="target" position={Position.Top} className="!bg-g" />

      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2 pb-2" style={{ borderBottom: '1.5px solid #E4E5E1' }}>
        <span className="font-mono text-[10px] font-bold text-g-ink">{pod.id}</span>
        <span className="text-xs font-semibold text-textPrimary truncate">
          {pod.nombre || 'Sin nombre'}
        </span>
      </div>

      {/* Equipo — agrupado por nivel */}
      <div
        onDragOver={e => !readOnly && e.preventDefault()}
        onDrop={e => handleDrop(e, 'member')}
        className="mb-2 min-h-[32px] rounded-tag p-1"
        style={{ background: readOnly ? 'transparent' : 'rgba(89,215,162,0.06)' }}>
        <p className="font-mono text-[8px] uppercase tracking-wide text-textSecondary mb-1">
          Equipo {members.length > 0 && `(${members.length})`}
        </p>
        {members.length === 0 && (
          <span className="text-[9px] italic text-textSecondary">Arrastrá acá</span>
        )}
        <div className="space-y-1">
          {groups.map(g => (
            <div key={g.level}>
              <p className="text-[8px] font-semibold text-textSecondary/70 mb-0.5">{LEVEL_LABELS[g.level]}</p>
              <div className="flex flex-wrap gap-1">
                {g.members.map(m => (
                  <span key={m.nombre}
                    className="inline-flex items-center gap-1 pl-1 pr-1 py-0.5 rounded-pill border-brand border-g/40 bg-g/15 text-[10px] font-medium leading-none text-g-ink">
                    {!readOnly ? (
                      <button
                        onClick={e => { e.stopPropagation(); onCycleLevel(m.nombre) }}
                        className="w-3.5 h-3.5 rounded-full bg-k text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0"
                        title={`Nivel: ${LEVEL_LABELS[roleLevels[m.nombre] || 'analista']} — click para cambiar`}>
                        {LEVEL_BADGE[g.level]}
                      </button>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-k text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                        {LEVEL_BADGE[g.level]}
                      </span>
                    )}
                    <span className="truncate max-w-[100px]">{m.nombre}</span>
                    {!readOnly && (
                      <button onClick={e => { e.stopPropagation(); onRemoveMember(m.nombre) }}
                        className="text-textSecondary hover:text-danger leading-none px-0.5" title="Quitar">✕</button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clientes */}
      <div
        onDragOver={e => !readOnly && e.preventDefault()}
        onDrop={e => handleDrop(e, 'client')}
        className="min-h-[32px] rounded-tag p-1"
        style={{ background: readOnly ? 'transparent' : 'rgba(231,28,162,0.05)' }}>
        <p className="font-mono text-[8px] uppercase tracking-wide text-textSecondary mb-1">
          Clientes {clients.length > 0 && `(${clients.length})`}
        </p>
        <div className="flex flex-wrap gap-1">
          {clients.length === 0 && (
            <span className="text-[9px] italic text-textSecondary">Arrastrá acá</span>
          )}
          {clients.map(c => (
            <Chip key={c.nombre} label={c.nombre} tone="m"
              onRemove={readOnly ? null : () => onRemoveClient(c.nombre)} />
          ))}
        </div>
      </div>
    </div>
  )
}

export { DND_MEMBER, DND_CLIENT }
