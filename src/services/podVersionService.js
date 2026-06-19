/**
 * podVersionService.js
 * CRUD de versiones nombradas de configuración de PODs en Supabase.
 * Tabla: pod_config_versions (ver supabase-migration-v2.sql)
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/** Lista las últimas 50 versiones, más recientes primero */
export async function listVersions() {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase
      .from('pod_config_versions')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) { console.warn('[versions] list:', error.message); return [] }
    return data || []
  } catch (err) {
    console.warn('[versions] list failed:', err.message)
    return []
  }
}

/** Guarda una nueva versión con nombre */
export async function saveVersion(name, config, userId) {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('pod_config_versions')
      .insert({ name, config, created_by: userId || null })
      .select('id, name, created_at')
      .single()
    if (error) { console.warn('[versions] save:', error.message); return null }
    return data
  } catch (err) {
    console.warn('[versions] save failed:', err.message)
    return null
  }
}

/** Carga la config de una versión por ID */
export async function loadVersion(id) {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('pod_config_versions')
      .select('config')
      .eq('id', id)
      .single()
    if (error) { console.warn('[versions] load:', error.message); return null }
    return data?.config || null
  } catch (err) {
    console.warn('[versions] load failed:', err.message)
    return null
  }
}

/** Elimina una versión por ID */
export async function deleteVersion(id) {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('pod_config_versions')
      .delete()
      .eq('id', id)
    if (error) { console.warn('[versions] delete:', error.message); return false }
    return true
  } catch (err) {
    console.warn('[versions] delete failed:', err.message)
    return false
  }
}
