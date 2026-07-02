/**
 * DeletableEdge.jsx
 * Edge custom con botón ✕ en el centro para eliminar la conexión sin teclado.
 */
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'
import useOrgChartStore from '../../store/useOrgChartStore'

export default function DeletableEdge({
  id, source, target,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style, markerEnd, data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  const removeReportingTo = useOrgChartStore(s => s.removeReportingTo)

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      {!data?.readOnly && (
        <EdgeLabelRenderer>
          <div
            style={{
              position:  'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 10,
            }}
            className="nodrag nopan"
          >
            <button
              onClick={e => { e.stopPropagation(); removeReportingTo(target, source) }}
              title="Eliminar conexión"
              style={{
                width:          16,
                height:         16,
                background:     '#E71CA2',
                color:          '#fff',
                border:         'none',
                borderRadius:   '50%',
                fontSize:       '9px',
                fontWeight:     700,
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                lineHeight:     1,
                opacity:        0.85,
              }}
            >✕</button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
