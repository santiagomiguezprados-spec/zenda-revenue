/**
 * clientesMaestroService.js
 * CRUD para el Maestro de Clientes.
 * Intenta Supabase primero. Si falla (tabla no existe, error de red, etc.)
 * cae automáticamente a localStorage como backup.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const LOCAL_KEY = 'zenda-clientes-maestro'

// Track si Supabase funciona para esta tabla
let _supabaseOk = null // null=unknown, true=works, false=broken

// ── Helpers localStorage ───────────────────────────────────────────────────
function getLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [] }
  catch { return [] }
}
function saveLocal(clientes) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(clientes))
}

function useSupabase() {
  return isSupabaseConfigured && supabase && _supabaseOk !== false
}

// ── Mapeo snake_case ↔ camelCase ────────────────────────────────────────────
function toCamel(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    estado: row.estado,
    moneda: row.moneda,
    contrato: row.contrato,
    fechaVtoTerminacion: row.fecha_vto_terminacion,
    facturante: row.facturante,
    comentario: row.comentario,
    lastUpdate: row.last_update,
    porcentajeUltimaActualizacion: row.porcentaje_ultima_actualizacion,
    nextUpdate: row.next_update,
    limiteMinimo: row.limite_minimo,
    feeMinimo: row.fee_minimo,
    escala1Limite: row.escala1_limite,
    escala1Porcentaje: row.escala1_porcentaje,
    escala2Limite: row.escala2_limite,
    escala2Porcentaje: row.escala2_porcentaje,
    escala3Limite: row.escala3_limite,
    escala3Porcentaje: row.escala3_porcentaje,
    escala4Limite: row.escala4_limite,
    escala4Porcentaje: row.escala4_porcentaje,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toSnake(data) {
  const row = {}
  if (data.codigo !== undefined) row.codigo = data.codigo
  if (data.nombre !== undefined) row.nombre = data.nombre
  if (data.estado !== undefined) row.estado = data.estado
  if (data.moneda !== undefined) row.moneda = data.moneda
  if (data.contrato !== undefined) row.contrato = data.contrato || null
  if (data.fechaVtoTerminacion !== undefined) row.fecha_vto_terminacion = data.fechaVtoTerminacion || null
  if (data.facturante !== undefined) row.facturante = data.facturante || null
  if (data.comentario !== undefined) row.comentario = data.comentario || null
  if (data.lastUpdate !== undefined) row.last_update = data.lastUpdate || null
  if (data.porcentajeUltimaActualizacion !== undefined) row.porcentaje_ultima_actualizacion = data.porcentajeUltimaActualizacion
  if (data.nextUpdate !== undefined) row.next_update = data.nextUpdate || null
  if (data.limiteMinimo !== undefined) row.limite_minimo = data.limiteMinimo || null
  if (data.feeMinimo !== undefined) row.fee_minimo = data.feeMinimo || null
  if (data.escala1Limite !== undefined) row.escala1_limite = data.escala1Limite || null
  if (data.escala1Porcentaje !== undefined) row.escala1_porcentaje = data.escala1Porcentaje
  if (data.escala2Limite !== undefined) row.escala2_limite = data.escala2Limite || null
  if (data.escala2Porcentaje !== undefined) row.escala2_porcentaje = data.escala2Porcentaje
  if (data.escala3Limite !== undefined) row.escala3_limite = data.escala3Limite || null
  if (data.escala3Porcentaje !== undefined) row.escala3_porcentaje = data.escala3Porcentaje
  if (data.escala4Limite !== undefined) row.escala4_limite = data.escala4Limite || null
  if (data.escala4Porcentaje !== undefined) row.escala4_porcentaje = data.escala4Porcentaje
  return row
}

// ── localStorage CRUD ───────────────────────────────────────────────────────
function localCreate(data) {
  const clientes = getLocal()
  const newClient = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  clientes.push(newClient)
  saveLocal(clientes)
  return newClient
}

function localUpdate(id, data) {
  const clientes = getLocal()
  const idx = clientes.findIndex(c => c.id === id)
  if (idx === -1) return null
  clientes[idx] = { ...clientes[idx], ...data, updatedAt: new Date().toISOString() }
  saveLocal(clientes)
  return clientes[idx]
}

function localDelete(id) {
  const clientes = getLocal().filter(c => c.id !== id)
  saveLocal(clientes)
  return true
}

function localNextCodigo() {
  const clientes = getLocal()
  return clientes.length > 0 ? Math.max(...clientes.map(c => c.codigo || 0)) + 1 : 1
}

// ── CRUD (Supabase con fallback a localStorage) ─────────────────────────────

export async function listClientes() {
  if (!useSupabase()) return getLocal()
  try {
    const { data, error } = await supabase
      .from('clientes_maestro')
      .select('*')
      .order('codigo', { ascending: true })
    if (error) {
      console.warn('[clientes] list error, usando localStorage:', error.message)
      _supabaseOk = false
      return getLocal()
    }
    _supabaseOk = true
    return (data || []).map(toCamel)
  } catch (err) {
    console.warn('[clientes] list failed, usando localStorage:', err.message)
    _supabaseOk = false
    return getLocal()
  }
}

export async function createCliente(data, userId) {
  if (!useSupabase()) return localCreate(data)
  try {
    const row = toSnake(data)
    row.created_by = userId || null
    row.updated_at = new Date().toISOString()
    const { data: result, error } = await supabase
      .from('clientes_maestro')
      .insert(row)
      .select('*')
      .single()
    if (error) {
      console.warn('[clientes] create error, fallback localStorage:', error.message)
      _supabaseOk = false
      return localCreate(data)
    }
    _supabaseOk = true
    return toCamel(result)
  } catch (err) {
    console.warn('[clientes] create failed, fallback localStorage:', err.message)
    _supabaseOk = false
    return localCreate(data)
  }
}

export async function updateCliente(id, data, userId) {
  if (!useSupabase()) return localUpdate(id, data)
  try {
    const row = toSnake(data)
    row.updated_at = new Date().toISOString()
    const { data: result, error } = await supabase
      .from('clientes_maestro')
      .update(row)
      .eq('id', id)
      .select('*')
      .single()
    if (error) {
      console.warn('[clientes] update error, fallback localStorage:', error.message)
      _supabaseOk = false
      return localUpdate(id, data)
    }
    _supabaseOk = true
    return toCamel(result)
  } catch (err) {
    console.warn('[clientes] update failed, fallback localStorage:', err.message)
    _supabaseOk = false
    return localUpdate(id, data)
  }
}

export async function deleteCliente(id) {
  if (!useSupabase()) return localDelete(id)
  try {
    const { error } = await supabase.from('clientes_maestro').delete().eq('id', id)
    if (error) {
      console.warn('[clientes] delete error, fallback localStorage:', error.message)
      _supabaseOk = false
      return localDelete(id)
    }
    _supabaseOk = true
    return true
  } catch (err) {
    console.warn('[clientes] delete failed, fallback localStorage:', err.message)
    _supabaseOk = false
    return localDelete(id)
  }
}

export async function getNextCodigo() {
  if (!useSupabase()) return localNextCodigo()
  try {
    const { data, error } = await supabase
      .from('clientes_maestro')
      .select('codigo')
      .order('codigo', { ascending: false })
      .limit(1)
    if (error) {
      _supabaseOk = false
      return localNextCodigo()
    }
    _supabaseOk = true
    if (!data || data.length === 0) return localNextCodigo() || 1
    return (data[0].codigo || 0) + 1
  } catch {
    _supabaseOk = false
    return localNextCodigo()
  }
}

/** Devuelve el modo actual de storage */
export function getStorageMode() {
  if (_supabaseOk === true) return 'supabase'
  if (_supabaseOk === false) return 'local'
  return isSupabaseConfigured ? 'checking' : 'local'
}
