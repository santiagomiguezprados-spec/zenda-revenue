/**
 * orgChartService.js
 * Persiste la capa propia del organigrama (jerarquía + posiciones) en Supabase
 * para que todos los usuarios vean la misma versión. La membresía (quién está
 * en qué POD) NO vive acá — sigue viviendo en pod_configs vía podConfigService.
 *
 * Tabla: org_charts (ver supabase/migrations/002_org_charts.sql)
 *   - id: 'current' (single-row, siempre la última versión)
 *   - config: jsonb con {roleLevels, positions}
 *   - updated_by: uuid del usuario que guardó
 *   - updated_at: timestamp
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const CONFIG_ID = 'current'

/**
 * Carga la configuración del organigrama desde Supabase.
 * Retorna null si no hay configuración guardada o Supabase no está configurado.
 */
export async function loadOrgChart() {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('org_charts')
      .select('config, updated_at, updated_by')
      .eq('id', CONFIG_ID)
      .single()

    if (error) {
      // PGRST116 = no rows → primera vez, no es error real
      if (error.code === 'PGRST116') return null
      console.warn('[orgChart] Error loading:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('[orgChart] Load failed:', err.message)
    return null
  }
}

/**
 * Guarda la configuración del organigrama en Supabase (upsert).
 * @param {object} config - { hierarchy, positions }
 * @param {string} userId - UUID del usuario que guarda
 */
export async function saveOrgChart(config, userId) {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('org_charts')
      .upsert({
        id: CONFIG_ID,
        config,
        updated_by: userId || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (error) {
      console.warn('[orgChart] Error saving:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[orgChart] Save failed:', err.message)
    return false
  }
}
