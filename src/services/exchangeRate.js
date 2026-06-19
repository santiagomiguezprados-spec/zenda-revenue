/**
 * exchangeRate.js
 * Obtiene el tipo de cambio dólar blue en tiempo real desde dolarapi.com
 */

const DOLAR_API = 'https://dolarapi.com/v1/dolares/blue'
const CACHE_KEY = 'zenda_dolar_blue_cache'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutos

/** Devuelve { compra, venta, promedio, fecha } del dólar blue */
export async function fetchDolarBlue() {
  const res = await fetch(DOLAR_API)
  if (!res.ok) throw new Error(`Error al obtener tipo de cambio: ${res.status}`)
  const data = await res.json()
  return {
    compra:   Math.round(data.compra),
    venta:    Math.round(data.venta),
    promedio: Math.round((data.compra + data.venta) / 2),
    fecha:    data.fechaActualizacion || new Date().toISOString(),
  }
}

/** Lee del cache local. Devuelve null si expiró o no existe. */
export function getCachedRate() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (Date.now() - cached.ts > CACHE_TTL) return null
    return cached
  } catch {
    return null
  }
}

/** Guarda en cache con timestamp */
export function setCachedRate(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() }))
  } catch {}
}

/** Borra el cache (fuerza refresh en el próximo useExchangeRate) */
export function clearRateCache() {
  localStorage.removeItem(CACHE_KEY)
}
