/**
 * podConfigService.js
 * Persiste la configuración de PODs en Supabase para que todos los
 * usuarios vean la misma versión del diseño.
 *
 * Tabla: pod_configs (ver supabase-migration.sql)
 *   - id: 'current' (single-row, siempre la última versión)
 *   - config: jsonb con {pods, assignments, clientAssignments, revenueOverrides, overheadShareOverrides, overheadManual}
 *   - updated_by: uuid del usuario que guardó
 *   - updated_at: timestamp
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const CONFIG_ID = 'current'

/**
 * Carga la configuración de PODs desde Supabase.
 * Retorna null si no hay configuración guardada o Supabase no está configurado.
 */
export async function loadPodConfig() {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('pod_configs')
      .select('config, updated_at, updated_by')
      .eq('id', CONFIG_ID)
      .single()

    if (error) {
      // PGRST116 = no rows → primera vez, no es error real
      if (error.code === 'PGRST116') return null
      console.warn('[podConfig] Error loading:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('[podConfig] Load failed:', err.message)
    return null
  }
}

/**
 * Guarda la configuración de PODs en Supabase (upsert).
 * @param {object} config - El estado parcializado del store
 * @param {string} userId - UUID del usuario que guarda
 */
export async function savePodConfig(config, userId) {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('pod_configs')
      .upsert({
        id: CONFIG_ID,
        config,
        updated_by: userId || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (error) {
      console.warn('[podConfig] Error saving:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[podConfig] Save failed:', err.message)
    return false
  }
}
