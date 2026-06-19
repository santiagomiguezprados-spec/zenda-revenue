/**
 * useDataStore.js
 * Central Zustand store — fuente unica de verdad para TODOS los datos live.
 *
 * Reemplaza los fetches independientes de useSheetData / useExchangeRate.
 * Auto-refresh cada 5 minutos para mantenerse sincronizado con Google Sheets
 * y el tipo de cambio blue.
 */
import { create } from 'zustand'
import {
  isConfigured,
  fetchTeamCostoNormalizado,
  fetchVentasDolarizadas,
  TAB_TEAM,
  TAB_VENTAS,
} from '../services/sheetsService'
import {
  fetchDolarBlue,
  getCachedRate,
  setCachedRate,
  clearRateCache,
} from '../services/exchangeRate'
import localTeam from '../data/team_cost.json'

// ── Constantes ───────────────────────────────────────────────────────────────
const REFRESH_MS = 5 * 60 * 1000 // 5 minutos
const RATE_FALLBACK = 1320
const MES_ABR = [
  'ene','feb','mar','abr','may','jun','jul','ago','sept','oct','nov','dic',
]

/** Encuentra la columna del mes actual en el sheet (ej: "abr-26") */
function detectCurrentMonth(meses) {
  const now = new Date()
  for (let offset = 0; offset <= 12; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const col = `${MES_ABR[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`
    if (meses.includes(col)) return col
  }
  return meses[0] || null
}

// ── Store ────────────────────────────────────────────────────────────────────
const useDataStore = create((set, get) => ({
  // ── Team Costo Normalizado ────────────────────────────────────────────────
  teamData: localTeam,
  teamSource: 'local',
  teamLoading: false,
  teamError: null,
  teamLastFetch: null,

  // ── Ventas Dolarizadas ────────────────────────────────────────────────────
  ventasData: null,
  ventasSource: 'local',
  ventasLoading: false,
  ventasError: null,
  ventasLastFetch: null,

  // ── Tipo de Cambio ────────────────────────────────────────────────────────
  rate: RATE_FALLBACK,
  rateData: null,
  rateLoading: false,
  rateError: null,
  rateLastFetch: null,

  // ── Auto-refresh ──────────────────────────────────────────────────────────
  autoRefreshEnabled: true,
  _intervalId: null,
  _initialized: false,

  // ── Fetch: Team ───────────────────────────────────────────────────────────
  fetchTeam: async () => {
    if (!isConfigured()) return
    set({ teamLoading: true, teamError: null })
    try {
      const data = await fetchTeamCostoNormalizado(TAB_TEAM)
      if (data && data.length > 0) {
        set({ teamData: data, teamSource: 'sheets', teamLastFetch: Date.now() })
      }
    } catch (err) {
      set({ teamError: err.message })
    } finally {
      set({ teamLoading: false })
    }
  },

  // ── Fetch: Ventas ─────────────────────────────────────────────────────────
  fetchVentas: async () => {
    if (!isConfigured()) return
    set({ ventasLoading: true, ventasError: null })
    try {
      const data = await fetchVentasDolarizadas(TAB_VENTAS)
      if (data && data.length > 0) {
        set({ ventasData: data, ventasSource: 'sheets', ventasLastFetch: Date.now() })
      }
    } catch (err) {
      set({ ventasError: err.message })
    } finally {
      set({ ventasLoading: false })
    }
  },

  // ── Fetch: Exchange Rate ──────────────────────────────────────────────────
  fetchRate: async (force = false) => {
    if (force) clearRateCache()
    const cached = getCachedRate()
    if (cached && !force) {
      set({ rate: cached.promedio, rateData: cached, rateLastFetch: cached.ts })
      return
    }
    set({ rateLoading: true, rateError: null })
    try {
      const data = await fetchDolarBlue()
      setCachedRate(data)
      set({ rate: data.promedio, rateData: data, rateLastFetch: Date.now() })
    } catch (err) {
      set({ rateError: err.message })
    } finally {
      set({ rateLoading: false })
    }
  },

  // ── Refresh All ───────────────────────────────────────────────────────────
  refreshAll: async () => {
    const { fetchTeam, fetchVentas, fetchRate } = get()
    await Promise.allSettled([fetchTeam(), fetchVentas(), fetchRate(true)])
  },

  // ── Initialize (called once from Layout) ──────────────────────────────────
  initialize: async () => {
    if (get()._initialized) return
    set({ _initialized: true })
    const { fetchTeam, fetchVentas, fetchRate, startAutoRefresh } = get()
    // Fetch in parallel on first load
    await Promise.allSettled([fetchTeam(), fetchVentas(), fetchRate()])
    startAutoRefresh()
  },

  // ── Auto-refresh control ──────────────────────────────────────────────────
  startAutoRefresh: () => {
    const { _intervalId, refreshAll } = get()
    if (_intervalId) return
    const id = setInterval(() => refreshAll(), REFRESH_MS)
    set({ _intervalId: id, autoRefreshEnabled: true })
  },

  stopAutoRefresh: () => {
    const { _intervalId } = get()
    if (_intervalId) {
      clearInterval(_intervalId)
      set({ _intervalId: null, autoRefreshEnabled: false })
    }
  },

  toggleAutoRefresh: () => {
    const { autoRefreshEnabled, startAutoRefresh, stopAutoRefresh } = get()
    if (autoRefreshEnabled) stopAutoRefresh()
    else startAutoRefresh()
  },

  // ── Derived helpers (no son reactivos — usar con useMemo en componentes) ──
  /** Mes actual detectado del sheet de ventas */
  getCurrentMonth: () => {
    const { ventasData } = get()
    const meses = ventasData?.[0]?.meses || []
    return detectCurrentMonth(meses)
  },

  /** Costo overhead USD (C-Level + Ops) computado desde el sheet */
  getOverheadUSD: () => {
    const { teamData, rate } = get()
    if (!teamData || !rate) return 0
    return Math.round(
      teamData
        .filter(p => p.esOverhead)
        .reduce((sum, p) => sum + (p.costoMensualARS || p.neto || 0), 0) / rate
    )
  },

  /** Costo operativo USD (equipo sin overhead) */
  getOperativeCostUSD: () => {
    const { teamData, rate } = get()
    if (!teamData || !rate) return 0
    return Math.round(
      teamData
        .filter(p => !p.esOverhead)
        .reduce((sum, p) => sum + (p.costoMensualARS || p.neto || 0), 0) / rate
    )
  },

  /** Revenue total del mes actual */
  getTotalRevenue: () => {
    const { ventasData } = get()
    const month = get().getCurrentMonth()
    if (!ventasData || !month) return 0
    return ventasData.reduce((sum, c) => sum + (c.ventaMensual?.[month] || 0), 0)
  },

  /** Pool de equipo operativo (sin overhead) con costo USD */
  getTeamPool: () => {
    const { teamData, rate } = get()
    if (!teamData) return []
    return teamData
      .filter(p => !p.esOverhead)
      .map(p => ({
        ...p,
        costoUSD: Math.round((p.costoMensualARS || p.neto || 0) / rate),
      }))
  },

  /** Pool de clientes activos con revenue del mes */
  getClientPool: () => {
    const { ventasData } = get()
    const month = get().getCurrentMonth()
    if (!ventasData || !month) return []
    return ventasData
      .map(c => ({
        nombre: c.nombre,
        tipo: c.tipo,
        revenue: c.ventaMensual?.[month] || 0,
      }))
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
  },

  /** Indica si hay datos live (no solo locales) */
  isLive: () => {
    const { teamSource, ventasSource } = get()
    return teamSource === 'sheets' || ventasSource === 'sheets'
  },

  /** Indica si hay algún error activo */
  hasErrors: () => {
    const { teamError, ventasError, rateError } = get()
    return !!(teamError || ventasError || rateError)
  },
}))

export default useDataStore
