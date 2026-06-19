/**
 * DataFreshnessBar.jsx
 * Barra compacta que muestra el estado de sincronizacion de datos.
 * Visible en todas las paginas, dentro del Layout.
 */
import { useMemo } from 'react'
import useDataStore from '../store/useDataStore'
import usePodDesignStore from '../store/usePodDesignStore'

function timeAgo(ts) {
  if (!ts) return null
  const diff = Math.round((Date.now() - ts) / 1000)
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

function StatusDot({ ok, loading, error }) {
  if (loading) return <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
  if (error) return <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
  if (ok) return <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
  return <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
}

export default function DataFreshnessBar() {
  const teamSource    = useDataStore(s => s.teamSource)
  const teamLoading   = useDataStore(s => s.teamLoading)
  const teamError     = useDataStore(s => s.teamError)
  const teamLastFetch = useDataStore(s => s.teamLastFetch)

  const ventasSource    = useDataStore(s => s.ventasSource)
  const ventasLoading   = useDataStore(s => s.ventasLoading)
  const ventasError     = useDataStore(s => s.ventasError)
  const ventasLastFetch = useDataStore(s => s.ventasLastFetch)

  const rate          = useDataStore(s => s.rate)
  const rateLoading   = useDataStore(s => s.rateLoading)
  const rateError     = useDataStore(s => s.rateError)
  const rateLastFetch = useDataStore(s => s.rateLastFetch)

  const autoRefreshEnabled = useDataStore(s => s.autoRefreshEnabled)
  const refreshAll         = useDataStore(s => s.refreshAll)
  const toggleAutoRefresh  = useDataStore(s => s.toggleAutoRefresh)

  const orphanedMembers = usePodDesignStore(s => s._orphanedMembers)
  const orphanedClients = usePodDesignStore(s => s._orphanedClients)
  const lastSync        = usePodDesignStore(s => s._lastSync)

  const isRefreshing = teamLoading || ventasLoading || rateLoading
  const hasOrphans   = orphanedMembers.length > 0 || orphanedClients.length > 0

  const sources = useMemo(() => [
    {
      label: 'Equipo',
      ok: teamSource === 'sheets',
      loading: teamLoading,
      error: teamError,
      time: timeAgo(teamLastFetch),
    },
    {
      label: 'Revenue',
      ok: ventasSource === 'sheets',
      loading: ventasLoading,
      error: ventasError,
      time: timeAgo(ventasLastFetch),
    },
    {
      label: `TC $${rate?.toLocaleString('es-AR') || '—'}`,
      ok: !!rateLastFetch,
      loading: rateLoading,
      error: rateError,
      time: timeAgo(rateLastFetch),
    },
  ], [
    teamSource, teamLoading, teamError, teamLastFetch,
    ventasSource, ventasLoading, ventasError, ventasLastFetch,
    rate, rateLoading, rateError, rateLastFetch,
  ])

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-white/60 backdrop-blur-sm border-b border-gray-100 text-[11px] text-gray-500 flex-wrap">
      {/* Data source indicators */}
      {sources.map(src => (
        <div key={src.label} className="flex items-center gap-1.5" title={src.error || ''}>
          <StatusDot ok={src.ok} loading={src.loading} error={src.error} />
          <span className={src.error ? 'text-red-500' : src.ok ? 'text-gray-600' : 'text-gray-400'}>
            {src.label}
          </span>
          {src.time && (
            <span className="text-gray-400">{src.time}</span>
          )}
        </div>
      ))}

      {/* Separator */}
      <span className="text-gray-200">|</span>

      {/* Sync status */}
      {lastSync && (
        <span className="text-gray-400">
          Sync {timeAgo(lastSync)}
        </span>
      )}

      {/* Orphan warning */}
      {hasOrphans && (
        <span className="text-amber-500 font-medium" title={
          `${orphanedMembers.length} miembros y ${orphanedClients.length} clientes ya no estan en el sheet`
        }>
          {orphanedMembers.length + orphanedClients.length} cambios detectados
        </span>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => refreshAll()}
          disabled={isRefreshing}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
            isRefreshing
              ? 'text-blue-400 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          title="Refrescar datos"
        >
          <span className={isRefreshing ? 'animate-spin' : ''}>↻</span>
          {isRefreshing ? 'Actualizando...' : 'Refrescar'}
        </button>
        <button
          onClick={toggleAutoRefresh}
          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
            autoRefreshEnabled
              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
              : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
          }`}
          title={autoRefreshEnabled ? 'Auto-refresh cada 5 min (click para desactivar)' : 'Auto-refresh desactivado (click para activar)'}
        >
          Auto {autoRefreshEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  )
}
