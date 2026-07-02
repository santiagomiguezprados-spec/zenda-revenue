/**
 * orgChartVersionService.js
 * CRUD de versiones nombradas de la configuración del organigrama en Supabase.
 * Tabla: org_chart_versions (ver supabase/migrations/002_org_charts.sql)
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/** Lista las últimas 50 versiones, más recientes primero */
export async function listOrgChartVersions() {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase
      .from('org_chart_versions')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) { console.warn('[orgChartVersions] list:', error.message); return [] }
    return data || []
  } catch (err) {
    console.warn('[orgChartVersions] list failed:', err.message)
    return []
  }
}

/** Guarda una nueva versión con nombre */
export async function saveOrgChartVersion(name, config, userId) {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('org_chart_versions')
      .insert({ name, config, created_by: userId || null })
      .select('id, name, created_at')
      .single()
    if (error) { console.warn('[orgChartVersions] save:', error.message); return null }
    return data
  } catch (err) {
    console.warn('[orgChartVersions] save failed:', err.message)
    return null
  }
}

/** Carga la config de una versión por ID */
export async function loadOrgChartVersion(id) {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('org_chart_versions')
      .select('config')
      .eq('id', id)
      .single()
    if (error) { console.warn('[orgChartVersions] load:', error.message); return null }
    return data?.config || null
  } catch (err) {
    console.warn('[orgChartVersions] load failed:', err.message)
    return null
  }
}

/** Elimina una versión por ID */
export async function deleteOrgChartVersion(id) {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('org_chart_versions')
      .delete()
      .eq('id', id)
    if (error) { console.warn('[orgChartVersions] delete:', error.message); return false }
    return true
  } catch (err) {
    console.warn('[orgChartVersions] delete failed:', err.message)
    return false
  }
}
