/**
 * Organigrama.jsx
 * Armador jerárquico drag&drop — personas individuales como nodos,
 * sin métricas ni números. Solo estructura de reporte.
 *
 * Fuentes reutilizadas (no duplicadas):
 *  - C-Level/CEO → src/utils/clevel.js + orgLevels.CEO_NAME
 *  - Equipo del período → useTeamCostoNormalizadoData (mismo patrón que PodDesigner)
 *  - Período cerrado → usePeriodValues
 *
 * Datos propios (useOrgChartStore):
 *  - roleLevels:  quién es lider/manager/analista dentro del equipo
 *  - reportingTo: jerarquía de reporte (quién reporta a quién)
 *  - positions:   layout del canvas
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  ReactFlow, ReactFlowProvider, Background, Controls,
  useNodesState, useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useTeamCostoNormalizadoData, useVentasDolarizadasData } from '../hooks/useSheetData'
import useOrgChartStore from '../store/useOrgChartStore'
import { usePeriodValues } from '../hooks/useGlobalPeriod'
import { useAuth } from '../context/AuthContext'
import { C_LEVEL_ALL } from '../utils/clevel'
import { CEO_NAME, CLEVEL_TITLES, LEVEL_COLORS, LEVEL_LABELS, nextLevel } from '../utils/orgLevels'
import {
  listOrgChartVersions, saveOrgChartVersion, loadOrgChartVersion, deleteOrgChartVersion,
} from '../services/orgChartVersionService'

import PersonNode, { DND_CLIENT } from '../components/orgchart/PersonNode'
import DeletableEdge from '../components/orgchart/DeletableEdge'

const NODE_TYPES = { person: PersonNode }
const EDGE_TYPES = { deletable: DeletableEdge }

// ── Layout por default (cuando no hay posición guardada) ─────────────────────
const LEVEL_ORDER = ['ceo', 'clevel', 'lider', 'manager', 'analista']
const LEVEL_Y     = { ceo: 0, clevel: 130, lider: 260, manager: 390, analista: 520 }
const X_SPACING   = 185

function computeDefaultPositions(people) {
  const groups = Object.fromEntries(LEVEL_ORDER.map(l => [l, []]))
  people.forEach(({ nombre, level }) => {
    if (groups[level]) groups[level].push(nombre)
  })

  const positions = {}
  LEVEL_ORDER.forEach(level => {
    const names = groups[level]
    const totalW = names.length * X_SPACING
    const startX = -totalW / 2 + X_SPACING / 2
    names.forEach((nombre, i) => {
      positions[nombre] = { x: startX + i * X_SPACING, y: LEVEL_Y[level] }
    })
  })
  return positions
}

// ── Canvas ───────────────────────────────────────────────────────────────────
function OrganigramaCanvas() {
  const { data: teamRaw }   = useTeamCostoNormalizadoData()
  const { data: ventasData } = useVentasDolarizadasData()
  const { session, role } = useAuth()
  const userId = session && session !== 'bypass' ? session.user?.id : null
  const isHR = role === 'hr'

  const { periodLabel, isCurrentPeriodClosed } = usePeriodValues()
  const readOnly = isCurrentPeriodClosed

  const {
    roleLevels, reportingTo, positions, personClientAssignments,
    setRoleLevel, setReportingTo, removeReportingTo, setPosition,
    assignClientToPerson, removeClientFromPerson,
  } = useOrgChartStore()

  // ── Lista de todas las personas del canvas ──────────────────────────────
  const allPeople = useMemo(() => {
    const list = []

    // CEO siempre primero
    list.push({ nombre: CEO_NAME, level: 'ceo' })

    // Resto de C-Level (los 5 que no son CEO)
    ;[...C_LEVEL_ALL].filter(n => n !== CEO_NAME).forEach(n => {
      list.push({ nombre: n, level: 'clevel' })
    })

    // Equipo del sheet (no-overhead)
    if (teamRaw) {
      teamRaw
        .filter(p => !p.esOverhead)
        .forEach(p => {
          list.push({ nombre: p.nombre, level: roleLevels[p.nombre] || 'analista' })
        })
    }

    return list
  }, [teamRaw, roleLevels])

  // ── Pool de clientes ──────────────────────────────────────────────────
  const clientPool = useMemo(() => {
    if (!ventasData) return []
    const seen = new Set()
    return ventasData
      .filter(c => { if (seen.has(c.nombre)) return false; seen.add(c.nombre); return true })
      .map(c => ({ nombre: c.nombre, tipo: c.tipo || '' }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [ventasData])

  const assignedClientNames = useMemo(() => {
    const s = new Set()
    Object.values(personClientAssignments).forEach(arr => arr.forEach(c => s.add(c.nombre)))
    return s
  }, [personClientAssignments])

  // ── Nodos y edges ──────────────────────────────────────────────────────
  const initialGraph = useMemo(() => {
    const defaultPos = computeDefaultPositions(allPeople)

    const nodes = allPeople.map(({ nombre, level }) => ({
      id:       nombre,
      type:     'person',
      position: positions[nombre] || defaultPos[nombre] || { x: 0, y: 0 },
      data: {
        nombre,
        level,
        title:    CLEVEL_TITLES[nombre] || null,
        clients:  personClientAssignments[nombre] || [],
        readOnly,
        onCycleLevel:    (n) => {
          if (level === 'ceo' || level === 'clevel') return
          setRoleLevel(n, nextLevel(roleLevels[n] || 'analista'))
        },
        onDropClient:    (client) => assignClientToPerson(nombre, client),
        onRemoveClient:  (clientNombre) => removeClientFromPerson(nombre, clientNombre),
      },
      draggable: !readOnly,
    }))

    // Cada persona puede tener múltiples managers (doble mando).
    // reportingTo[report] es un array de nombres de managers.
    const edges = []
    Object.entries(reportingTo).forEach(([report, managers]) => {
      const list = Array.isArray(managers) ? managers : (managers ? [managers] : [])
      list.filter(Boolean).forEach(manager => {
        edges.push({
          id:         `${manager}→${report}`,
          type:       'deletable',
          source:     manager,
          target:     report,
          deletable:  !readOnly,
          selectable: !readOnly,
          data:       { readOnly },
          style:      { stroke: '#3A3A3C', strokeWidth: 1.5 },
          markerEnd:  { type: 'arrowclosed', color: '#3A3A3C', width: 16, height: 16 },
        })
      })
    })

    return { nodes, edges }
  }, [allPeople, positions, reportingTo, readOnly, roleLevels, personClientAssignments,
      setRoleLevel, assignClientToPerson, removeClientFromPerson])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges)

  useEffect(() => {
    setNodes(initialGraph.nodes)
    setEdges(initialGraph.edges)
  }, [initialGraph, setNodes, setEdges])

  const handleNodeDragStop = useCallback((_e, node) => {
    if (readOnly) return
    setPosition(node.id, node.position)
  }, [readOnly, setPosition])

  const handleConnect = useCallback(({ source, target }) => {
    if (readOnly) return
    setReportingTo(target, source)
  }, [readOnly, setReportingTo])

  const handleEdgesDelete = useCallback((deletedEdges) => {
    if (readOnly) return
    // Pasa source (manager) y target (reporte) para borrar solo esa conexión
    deletedEdges.forEach(e => removeReportingTo(e.target, e.source))
  }, [readOnly, removeReportingTo])

  // ── Panel derecho (Niveles | Clientes) ───────────────────────────────────
  // Solo uno puede estar abierto a la vez.
  const [rightPanel, setRightPanel]   = useState(null) // null | 'niveles' | 'clientes'
  const showLevels  = rightPanel === 'niveles'
  const showClients = rightPanel === 'clientes'
  const togglePanel = (panel) => setRightPanel(p => p === panel ? null : panel)
  const canEditLevels = !isHR && !readOnly

  const [clientSearch, setClientSearch] = useState('')
  const [levelSearch, setLevelSearch]   = useState('')

  // Todas las personas del equipo (no C-Level) para el panel de niveles
  const teamPeople = useMemo(() => {
    if (!teamRaw) return []
    return teamRaw
      .filter(p => !p.esOverhead)
      .map(p => ({ nombre: p.nombre, level: roleLevels[p.nombre] || 'analista' }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [teamRaw, roleLevels])

  const filteredTeamPeople = useMemo(() =>
    teamPeople.filter(p => p.nombre.toLowerCase().includes(levelSearch.toLowerCase())),
    [teamPeople, levelSearch]
  )

  // ── Versiones ────────────────────────────────────────────────────────────
  const [showVersions, setShowVersions]     = useState(false)
  const [versions, setVersions]             = useState([])
  const [versionName, setVersionName]       = useState('')
  const [savingVersion, setSavingVersion]   = useState(false)

  const loadVersions = useCallback(async () => {
    setVersions(await listOrgChartVersions())
  }, [])

  const handleToggleVersions = useCallback(async () => {
    if (!showVersions) await loadVersions()
    setShowVersions(v => !v)
  }, [showVersions, loadVersions])

  const handleSaveVersion = useCallback(async () => {
    if (savingVersion) return
    setSavingVersion(true)
    const name   = versionName.trim() || `Versión ${new Date().toLocaleDateString('es-AR')}`
    const config = { roleLevels, reportingTo, positions }
    const result = await saveOrgChartVersion(name, config, userId)
    if (result) { setVersionName(''); await loadVersions() }
    setSavingVersion(false)
  }, [savingVersion, versionName, roleLevels, reportingTo, positions, userId, loadVersions])

  const handleRestoreVersion = useCallback(async (id) => {
    const config = await loadOrgChartVersion(id)
    if (config) useOrgChartStore.getState().restoreConfig(config)
  }, [])

  const handleDeleteVersion = useCallback(async (id) => {
    await deleteOrgChartVersion(id)
    await loadVersions()
  }, [loadVersions])

  // ── Leyenda ──────────────────────────────────────────────────────────────
  const LEGEND = [
    { level: 'ceo',      label: 'CEO' },
    { level: 'clevel',   label: 'C-Level' },
    { level: 'lider',    label: 'Team Leader' },
    { level: 'manager',  label: 'Manager' },
    { level: 'analista', label: 'Analista' },
  ]

  return (
    <div className="space-y-4">
      {readOnly && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-card border-brand border-bdr bg-w">
          <span className="text-base">🔒</span>
          <p className="text-xs font-semibold text-textPrimary">
            {periodLabel} — período cerrado · Organigrama solo lectura
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-bold text-textPrimary">Organigrama</h1>
          <div className="flex items-center gap-1.5 flex-wrap">
            {LEGEND.map(({ level, label }) => {
              const col = LEVEL_COLORS[level]
              return (
                <span key={level} style={{
                  background:    col.bg,
                  color:         col.text,
                  border:        `1px solid ${col.border}`,
                  borderRadius:  '20px',
                  fontSize:      '9px',
                  fontFamily:    'var(--font-mono)',
                  fontWeight:    700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding:       '2px 8px',
                }}>
                  {label}
                </span>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => togglePanel('clientes')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-tag border-brand border-bdr transition-colors ${showClients ? 'bg-m text-white' : 'bg-w hover:bg-gray'}`}
          >
            Clientes
          </button>
          <button
            onClick={() => togglePanel('niveles')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-tag border-brand border-bdr transition-colors ${showLevels ? 'bg-g text-k' : 'bg-w hover:bg-gray'}`}
          >
            Niveles
          </button>

          {!isHR && (
          <div className="relative">
            <button
              onClick={handleToggleVersions}
              className="text-xs font-semibold px-3 py-1.5 rounded-tag border-brand border-bdr bg-w hover:bg-gray transition-colors"
            >
              📋 Versiones
            </button>
            {showVersions && (
              <div className="absolute right-0 mt-1 w-72 rounded-card border-brand border-bdr bg-w p-3 z-10">
                {!readOnly && (
                  <div className="flex gap-1 mb-2">
                    <input
                      type="text"
                      value={versionName}
                      onChange={e => setVersionName(e.target.value)}
                      placeholder="Nombre de la versión..."
                      className="flex-1 text-xs border-brand border-bdr rounded-tag px-2 py-1 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveVersion}
                      disabled={savingVersion}
                      className="text-xs font-semibold px-2 py-1 rounded-tag bg-g text-k"
                    >
                      Guardar
                    </button>
                  </div>
                )}
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {versions.length === 0 && (
                    <p className="text-[11px] text-textSecondary italic">Sin versiones guardadas</p>
                  )}
                  {versions.map(v => (
                    <div key={v.id} className="flex items-center justify-between text-[11px] gap-2">
                      <span className="truncate flex-1">{v.name}</span>
                      {!readOnly && (
                        <>
                          <button onClick={() => handleRestoreVersion(v.id)} className="text-g-ink hover:underline">Cargar</button>
                          <button onClick={() => handleDeleteVersion(v.id)} className="text-danger hover:underline">✕</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {!readOnly && (
        <p className="text-[11px] text-textSecondary">
          Arrastrá para mover · Conectá el handle inferior del manager al handle superior del reporte · Click en el badge para cambiar nivel
        </p>
      )}

      {/* Canvas + panel de niveles */}
      <div className="flex gap-3" style={{ height: '76vh' }}>
        <div className="flex-1 rounded-card border-brand border-bdr overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={readOnly ? undefined : onNodesChange}
            onEdgesChange={readOnly ? undefined : onEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            onConnect={readOnly ? undefined : handleConnect}
            onEdgesDelete={readOnly ? undefined : handleEdgesDelete}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            elementsSelectable={!readOnly}
            deleteKeyCode={readOnly ? null : 'Delete'}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.15 }}
          >
            <Background color="#E4E5E1" gap={20} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        {/* Panel: Clientes */}
        {showClients && (
          <div className="w-64 flex-shrink-0 rounded-card border-brand border-bdr bg-w p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-textPrimary">Clientes</span>
              <button onClick={() => setRightPanel(null)} className="text-textSecondary hover:text-textPrimary text-sm leading-none">✕</button>
            </div>
            {!readOnly && (
              <p className="text-[10px] text-textSecondary mb-2">
                Arrastrá un cliente al nodo de la persona responsable
              </p>
            )}
            <input
              type="text"
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="text-xs border-brand border-bdr rounded-tag px-2 py-1.5 mb-2 focus:outline-none"
            />
            <div className="flex-1 overflow-y-auto space-y-1">
              {clientPool
                .filter(c => !assignedClientNames.has(c.nombre))
                .filter(c => c.nombre.toLowerCase().includes(clientSearch.toLowerCase()))
                .map(c => (
                  <div
                    key={c.nombre}
                    draggable={!readOnly}
                    onDragStart={e => e.dataTransfer.setData(DND_CLIENT, JSON.stringify(c))}
                    className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-tag border-brand border-bdr bg-w cursor-grab active:cursor-grabbing hover:border-m"
                  >
                    <span className="flex-1 truncate">{c.nombre}</span>
                    {c.tipo && (
                      <span className="text-[9px] font-mono text-textSecondary flex-shrink-0">{c.tipo}</span>
                    )}
                  </div>
                ))
              }
              {clientPool.filter(c => !assignedClientNames.has(c.nombre)).length === 0 && (
                <p className="text-[11px] text-textSecondary italic">Todos los clientes asignados</p>
              )}
            </div>
            {/* Clientes ya asignados (colapsable) */}
            {assignedClientNames.size > 0 && (
              <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--bdr)' }}>
                <p className="text-[10px] font-mono text-textSecondary mb-1">
                  Asignados ({assignedClientNames.size})
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {[...assignedClientNames].sort().map(n => (
                    <div key={n} className="text-[10px] text-textSecondary px-1 truncate">{n}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel: Niveles */}
        {showLevels && (
          <div className="w-64 flex-shrink-0 rounded-card border-brand border-bdr bg-w p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-textPrimary">Niveles de Equipo</span>
              <button onClick={() => setRightPanel(null)} className="text-textSecondary hover:text-textPrimary text-sm leading-none">✕</button>
            </div>
            <input
              type="text"
              value={levelSearch}
              onChange={e => setLevelSearch(e.target.value)}
              placeholder="Buscar persona..."
              className="text-xs border-brand border-bdr rounded-tag px-2 py-1.5 mb-2 focus:outline-none"
            />
            {!canEditLevels && (
              <p className="text-[10px] text-textSecondary italic mb-1">Solo lectura</p>
            )}
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {filteredTeamPeople.length === 0 && (
                <p className="text-[11px] text-textSecondary italic">Sin resultados</p>
              )}
              {filteredTeamPeople.map(p => (
                <div key={p.nombre} className="flex items-center gap-2 py-0.5">
                  <span className="text-xs flex-1 truncate text-textPrimary">{p.nombre}</span>
                  {canEditLevels ? (
                    <select
                      value={p.level}
                      onChange={e => setRoleLevel(p.nombre, e.target.value)}
                      style={{
                        fontFamily:   'var(--font-mono)',
                        fontSize:     '10px',
                        color:        'var(--k)',
                        background:   'var(--w)',
                        border:       'var(--bw) solid var(--bdr)',
                        borderRadius: 'var(--r-tag)',
                        padding:      '2px 4px',
                        outline:      'none',
                        cursor:       'pointer',
                        flexShrink:   0,
                      }}
                    >
                      <option value="lider">Team Leader</option>
                      <option value="manager">Manager</option>
                      <option value="analista">Analista</option>
                    </select>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mu)' }}>
                      {LEVEL_LABELS[p.level] || p.level}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Organigrama() {
  return (
    <ReactFlowProvider>
      <OrganigramaCanvas />
    </ReactFlowProvider>
  )
}
