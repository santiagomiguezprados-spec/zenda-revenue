/**
 * PersonNode.jsx
 * Nodo individual de una persona en el organigrama.
 * - Badge de nivel cliqueable (cicla lider→manager→analista; CEO/C-Level fijos)
 * - Zona de drop para clientes (drag desde paleta → asigna cliente a persona)
 * - Chips de clientes asignados con botón de quitar
 */
import { Handle, Position } from '@xyflow/react'
import { LEVEL_LABELS, LEVEL_COLORS, isFixedLevel } from '../../utils/orgLevels'

export const DND_CLIENT = 'application/zenda-org-client'

export default function PersonNode({ data }) {
  const { nombre, level, title, clients = [], readOnly, onCycleLevel, onDropClient, onRemoveClient } = data
  const col   = LEVEL_COLORS[level] || LEVEL_COLORS.analista
  const fixed = isFixedLevel(level)
  const badgeLabel = title || LEVEL_LABELS[level] || level

  const handleDragOver = (e) => { if (!readOnly) e.preventDefault() }
  const handleDrop = (e) => {
    e.preventDefault()
    if (readOnly) return
    const raw = e.dataTransfer.getData(DND_CLIENT)
    if (!raw) return
    onDropClient(JSON.parse(raw))
  }

  // Colores sutiles para la zona de clientes — adaptan según el nivel del nodo
  const clientZoneBg  = 'rgba(255,255,255,0.10)'
  const chipBg        = 'rgba(255,255,255,0.20)'
  const chipText      = col.text

  return (
    <div
      style={{
        background:    col.bg,
        border:        `1.5px solid ${col.border}`,
        borderRadius:  '12px',
        width:         '185px',
        padding:       '8px 10px',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           '5px',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: col.text, borderColor: col.bg, width: 8, height: 8 }}
      />

      {/* Nombre */}
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize:   '11px',
        fontWeight: 600,
        color:      col.text,
        textAlign:  'center',
        lineHeight: 1.3,
      }}>
        {nombre}
      </span>

      {/* Badge de nivel */}
      {(!fixed && !readOnly) ? (
        <button
          onClick={e => { e.stopPropagation(); onCycleLevel(nombre) }}
          title="Click para cambiar nivel"
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '9px',
            fontWeight:    700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color:         col.text,
            background:    'rgba(255,255,255,0.18)',
            border:        'none',
            borderRadius:  '20px',
            padding:       '2px 8px',
            cursor:        'pointer',
          }}
        >
          {badgeLabel}
        </button>
      ) : (
        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '9px',
          fontWeight:    700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color:         col.text,
          background:    'rgba(255,255,255,0.12)',
          borderRadius:  '20px',
          padding:       '2px 8px',
        }}>
          {badgeLabel}
        </span>
      )}

      {/* Zona de clientes */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          width:        '100%',
          minHeight:    clients.length === 0 ? '28px' : 'auto',
          background:   clientZoneBg,
          borderRadius: '8px',
          padding:      '4px 6px',
          marginTop:    '1px',
        }}
      >
        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '8px',
          fontWeight:    700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color:         col.text,
          opacity:       0.6,
          display:       'block',
          marginBottom:  '3px',
        }}>
          {clients.length > 0 ? `Clientes (${clients.length})` : !readOnly ? 'Clientes — drop acá' : 'Sin clientes'}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
          {clients.map(c => (
            <span
              key={c.nombre}
              style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          '2px',
                background:   chipBg,
                color:        chipText,
                borderRadius: '20px',
                fontSize:     '9px',
                fontWeight:   500,
                padding:      '1px 5px',
                maxWidth:     '155px',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.nombre}
              </span>
              {!readOnly && (
                <button
                  onClick={e => { e.stopPropagation(); onRemoveClient(c.nombre) }}
                  style={{
                    background: 'none',
                    border:     'none',
                    cursor:     'pointer',
                    color:      col.text,
                    opacity:    0.7,
                    padding:    '0 1px',
                    lineHeight: 1,
                    fontSize:   '9px',
                  }}
                >✕</button>
              )}
            </span>
          ))}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: col.text, borderColor: col.bg, width: 8, height: 8 }}
      />
    </div>
  )
}
