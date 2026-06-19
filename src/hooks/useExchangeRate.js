/**
 * useExchangeRate.js
 * Thin wrapper sobre useDataStore para compatibilidad.
 * Ya no hace fetch propio — consume del store central.
 */

import { useCallback } from 'react'
import useDataStore from '../store/useDataStore'

export default function useExchangeRate() {
  const rate      = useDataStore(s => s.rate)
  const rateData  = useDataStore(s => s.rateData)
  const loading   = useDataStore(s => s.rateLoading)
  const error     = useDataStore(s => s.rateError)
  const fetchRate = useDataStore(s => s.fetchRate)

  const refresh = useCallback(() => fetchRate(true), [fetchRate])

  return { rate, rateData, loading, error, refresh }
}
