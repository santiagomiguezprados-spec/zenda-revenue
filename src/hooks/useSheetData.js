/**
 * useSheetData.js
 * Thin wrappers sobre useDataStore para compatibilidad.
 * Todos los hooks apuntan a la misma fuente central de datos —
 * ya no hay fetches independientes por componente.
 */

import useDataStore from '../store/useDataStore'

/** Datos del equipo desde Team Costo Normalizado */
export function useTeamCostoNormalizadoData() {
  const data    = useDataStore(s => s.teamData)
  const loading = useDataStore(s => s.teamLoading)
  const error   = useDataStore(s => s.teamError)
  const source  = useDataStore(s => s.teamSource)
  const reload  = useDataStore(s => s.fetchTeam)
  return { data, loading, error, source, reload }
}

/** Datos de ventas desde Ventas Dolarizadas */
export function useVentasDolarizadasData() {
  const data    = useDataStore(s => s.ventasData)
  const loading = useDataStore(s => s.ventasLoading)
  const error   = useDataStore(s => s.ventasError)
  const source  = useDataStore(s => s.ventasSource)
  const reload  = useDataStore(s => s.fetchVentas)
  return { data, loading, error, source, reload }
}

/** Alias: Team Costo → formato original team_cost.json */
export function useTeamData() {
  return useTeamCostoNormalizadoData()
}

/** Alias: Ventas → formato original clients_sales.json */
export function useClientsData() {
  return useVentasDolarizadasData()
}

/** Datos P&L mensual desde Datos Looker */
export function useDatosLookerData() {
  const data    = useDataStore(s => s.lookerData)
  const loading = useDataStore(s => s.lookerLoading)
  const error   = useDataStore(s => s.lookerError)
  const source  = useDataStore(s => s.lookerSource)
  const reload  = useDataStore(s => s.fetchLooker)
  return { data, loading, error, source, reload }
}
