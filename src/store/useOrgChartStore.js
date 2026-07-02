/**
 * useOrgChartStore.js
 *
 * reportingTo: { [nombre]: string[] }  — ARRAY de managers (soporta doble mando).
 * Migración automática: si Supabase o localStorage tienen el formato viejo
 * (string en vez de array), normalizeReportingTo() lo convierte al vuelo.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loadOrgChart, saveOrgChart } from '../services/orgChartService'
import { DEFAULT_TEAM_LEADERS, DEFAULT_MANAGERS, CEO_NAME } from '../utils/orgLevels'
import { C_LEVEL_ALL } from '../utils/clevel'

const COO_NAME = 'Julian Iglesias'

const INITIAL_ROLE_LEVELS = {
  ...Object.fromEntries(DEFAULT_TEAM_LEADERS.map(n => [n, 'lider'])),
  ...Object.fromEntries(DEFAULT_MANAGERS.map(n => [n, 'manager'])),
}

// Todos los valores son arrays — soporta doble mando desde el inicio.
const INITIAL_REPORTING_TO = {
  ...Object.fromEntries(
    [...C_LEVEL_ALL].filter(n => n !== CEO_NAME).map(n => [n, [CEO_NAME]])
  ),
  'Federico Meyer':  [COO_NAME],
  'Luana Maldonado': [COO_NAME],
  'Ariana Castaño':  ['Federico Meyer'],
  'Mateo':           ['Federico Meyer'],
  'Luna':            ['Luana Maldonado'],
  'Nico Pergo':      ['Luana Maldonado'],
  'Nico Poncho':     ['Luana Maldonado'],
  'Adrián Matos':    ['Luana Maldonado'],
}

// Convierte formato viejo (string) a nuevo (array) sin romper datos existentes.
function normalizeReportingTo(rt) {
  if (!rt) return {}
  const out = {}
  Object.entries(rt).forEach(([person, managers]) => {
    if (Array.isArray(managers)) {
      out[person] = managers.filter(Boolean)
    } else if (managers) {
      out[person] = [managers]
    }
  })
  return out
}

const useOrgChartStore = create(
  persist(
    (set, get) => ({
      roleLevels:              INITIAL_ROLE_LEVELS,
      reportingTo:             INITIAL_REPORTING_TO,
      positions:               {},
      personClientAssignments: {},

      // ── Niveles ────────────────────────────────────────────────────────────
      setRoleLevel: (nombre, level) => set(s => ({
        roleLevels: { ...s.roleLevels, [nombre]: level },
      })),

      // ── Jerarquía ──────────────────────────────────────────────────────────
      // Agrega un manager al array (doble mando: puede tener varios).
      // Si ya está conectado, no hace nada (evita duplicados).
      setReportingTo: (person, manager) => set(s => {
        const current = s.reportingTo[person] || []
        if (current.includes(manager)) return s
        return { reportingTo: { ...s.reportingTo, [person]: [...current, manager] } }
      }),

      // Elimina solo la conexión específica persona↔manager.
      // Si queda sin managers, elimina la clave del objeto.
      removeReportingTo: (person, manager) => set(s => {
        const current = s.reportingTo[person] || []
        const updated  = current.filter(m => m !== manager)
        if (updated.length === 0) {
          const { [person]: _, ...rest } = s.reportingTo
          return { reportingTo: rest }
        }
        return { reportingTo: { ...s.reportingTo, [person]: updated } }
      }),

      // ── Posiciones ─────────────────────────────────────────────────────────
      setPosition: (nodeId, pos) => set(s => ({
        positions: { ...s.positions, [nodeId]: pos },
      })),

      // ── Clientes por persona ───────────────────────────────────────────────
      assignClientToPerson: (personNombre, client) => set(s => ({
        personClientAssignments: {
          ...s.personClientAssignments,
          [personNombre]: [
            ...(s.personClientAssignments[personNombre] || []).filter(c => c.nombre !== client.nombre),
            client,
          ],
        },
      })),
      removeClientFromPerson: (personNombre, clientNombre) => set(s => ({
        personClientAssignments: {
          ...s.personClientAssignments,
          [personNombre]: (s.personClientAssignments[personNombre] || []).filter(c => c.nombre !== clientNombre),
        },
      })),

      // ── Reset ──────────────────────────────────────────────────────────────
      resetAll: () => {
        set({
          roleLevels:              INITIAL_ROLE_LEVELS,
          reportingTo:             INITIAL_REPORTING_TO,
          positions:               {},
          personClientAssignments: {},
        })
        scheduleSave()
      },

      // ── Supabase sync ──────────────────────────────────────────────────────
      _supabaseLoaded: false,
      _saving:         false,
      _readOnly:       false,

      restoreConfig: (config) => set({
        roleLevels:              { ...INITIAL_ROLE_LEVELS,  ...(config?.roleLevels  || {}) },
        reportingTo:             { ...INITIAL_REPORTING_TO, ...normalizeReportingTo(config?.reportingTo) },
        positions:               config?.positions               || {},
        personClientAssignments: config?.personClientAssignments || {},
        _readOnly: false,
      }),

      restoreSnapshot: (config) => set({
        roleLevels:              { ...INITIAL_ROLE_LEVELS,  ...(config?.roleLevels  || {}) },
        reportingTo:             { ...INITIAL_REPORTING_TO, ...normalizeReportingTo(config?.reportingTo) },
        positions:               config?.positions               || {},
        personClientAssignments: config?.personClientAssignments || {},
        _readOnly: true,
      }),

      setLive: async () => {
        if (!get()._readOnly) return
        set({ _readOnly: false })
        await get().loadFromSupabase()
      },

      loadFromSupabase: async () => {
        const result = await loadOrgChart()
        if (result?.config && Object.keys(result.config).length > 0) {
          const c = result.config
          set({
            roleLevels:              { ...INITIAL_ROLE_LEVELS,  ...(c.roleLevels  || {}) },
            reportingTo:             { ...INITIAL_REPORTING_TO, ...normalizeReportingTo(c.reportingTo) },
            positions:               c.positions               || {},
            personClientAssignments: c.personClientAssignments || {},
            _supabaseLoaded: true,
          })
          return true
        }
        set({ _supabaseLoaded: true })
        return false
      },

      saveToSupabase: async (userId) => {
        const s = get()
        if (s._saving) return
        set({ _saving: true })
        await saveOrgChart(
          {
            roleLevels:              s.roleLevels,
            reportingTo:             s.reportingTo,
            positions:               s.positions,
            personClientAssignments: s.personClientAssignments,
          },
          userId,
        )
        set({ _saving: false })
      },
    }),
    {
      name: 'zenda-org-chart',
      partialize: (state) => ({
        roleLevels:              state.roleLevels,
        reportingTo:             state.reportingTo,
        positions:               state.positions,
        personClientAssignments: state.personClientAssignments,
      }),
      // Normaliza el formato al rehidratar desde localStorage (migración).
      onRehydrateStorage: () => (state) => {
        if (state?.reportingTo) {
          state.reportingTo = {
            ...INITIAL_REPORTING_TO,
            ...normalizeReportingTo(state.reportingTo),
          }
        }
      },
    }
  )
)

// ── Auto-save debounced ────────────────────────────────────────────────────────
let _saveTimer = null
function scheduleSave() {
  const s = useOrgChartStore.getState()
  if (!s._supabaseLoaded) return
  if (s._readOnly) return
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    useOrgChartStore.getState().saveToSupabase()
  }, 1500)
}

useOrgChartStore.subscribe((state, prevState) => {
  if (
    state.roleLevels              !== prevState.roleLevels              ||
    state.reportingTo             !== prevState.reportingTo             ||
    state.positions               !== prevState.positions               ||
    state.personClientAssignments !== prevState.personClientAssignments
  ) {
    scheduleSave()
  }
})

export default useOrgChartStore
