/**
 * OrgChartImporter.jsx
 * Modal para importar un organigrama desde imagen.
 * Flujo: subir imagen → Gemini Vision analiza → preview con matching → aplicar a PODs.
 */

import { useState, useCallback, useRef, useMemo } from 'react'
import { parseOrgChart } from '../services/visionService'
import { matchOrgChartTeams } from '../utils/nameMatch'
import usePodDesignStore from '../store/usePodDesignStore'
import { formatUSD } from '../utils/formatters'

const LS_KEY_GEMINI = 'zenda-gemini-api-key'
const ENV_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''

// ── Confidence badges ────────────────────────────────────────────────────────
const CONF = {
  exact:  { label: 'Exacto',  bg: 'bg-success/15 text-success border-success/30', dot: 'bg-success' },
  high:   { label: 'Alto',    bg: 'bg-emerald-100 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
  medium: { label: 'Parcial', bg: 'bg-amber-100 text-amber-700 border-amber-300', dot: 'bg-amber-500' },
  low:    { label: 'Bajo',    bg: 'bg-orange-100 text-orange-700 border-orange-300', dot: 'bg-orange-500' },
  none:   { label: 'Sin match', bg: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500' },
}

function ConfBadge({ confidence }) {
  const c = CONF[confidence] || CONF.none
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

// ── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ['upload', 'analyzing', 'preview', 'done']

export default function OrgChartImporter({ open, onClose, teamPool }) {
  // State
  const [step, setStep] = useState('upload')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_KEY_GEMINI) || ENV_KEY)
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState(null)
  const [rawTeams, setRawTeams] = useState([])
  const [matchedTeams, setMatchedTeams] = useState([])
  const [appliedCount, setAppliedCount] = useState(0)

  const fileRef = useRef(null)
  const dragRef = useRef(null)

  const store = usePodDesignStore()

  // ── Image handling ─────────────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Solo se aceptan archivos de imagen (PNG, JPG, WEBP)')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('La imagen no puede superar los 20 MB')
      return
    }
    setError(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current?.classList.remove('border-accent', 'bg-accent/5')
    const file = e.dataTransfer?.files?.[0]
    handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    dragRef.current?.classList.add('border-accent', 'bg-accent/5')
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    dragRef.current?.classList.remove('border-accent', 'bg-accent/5')
  }, [])

  // ── Analyze ────────────────────────────────────────────────────────────────
  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyze = useCallback(async () => {
    if (analyzing) return // prevent double-click
    if (!imageFile || !apiKey.trim()) {
      setError('Necesitas una imagen y una API key de Google AI')
      return
    }

    // Save key
    localStorage.setItem(LS_KEY_GEMINI, apiKey.trim())

    setError(null)
    setAnalyzing(true)
    setStep('analyzing')

    try {
      // Read file as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          // Remove data:image/xxx;base64, prefix
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(imageFile)
      })

      const teams = await parseOrgChart(base64, imageFile.type, apiKey.trim())
      setRawTeams(teams)

      // Match against team pool
      const matched = matchOrgChartTeams(teams, teamPool || [])
      setMatchedTeams(matched)
      setStep('preview')
      setAnalyzing(false)
    } catch (err) {
      setError(err.message)
      setStep('upload')
      setAnalyzing(false)
    }
  }, [imageFile, apiKey, teamPool])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const allMembers = matchedTeams.flatMap(t => t.members)
    const total = allMembers.length
    const matched = allMembers.filter(m => m.confidence !== 'none').length
    const exact = allMembers.filter(m => m.confidence === 'exact' || m.confidence === 'high').length
    const unmatched = total - matched
    return { total, matched, exact, unmatched }
  }, [matchedTeams])

  // ── Apply to store ─────────────────────────────────────────────────────────
  const handleApply = useCallback(() => {
    let count = 0

    matchedTeams.forEach(team => {
      // Create POD with team name
      store.addPod(team.team_name)

      // Get the newly created POD (last one added)
      const currentPods = usePodDesignStore.getState().pods
      const newPod = currentPods[currentPods.length - 1]
      if (!newPod) return

      // Assign matched members
      team.members.forEach(m => {
        if (m.match && m.confidence !== 'none') {
          store.assignMember(newPod.id, {
            nombre: m.match.nombre,
            costoUSD: m.match.costoUSD,
          })
          count++
        }
      })
    })

    setAppliedCount(count)
    setStep('done')
  }, [matchedTeams, store])

  // ── Reset & close ──────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setStep('upload')
    setImageFile(null)
    setImagePreview(null)
    setError(null)
    setRawTeams([])
    setMatchedTeams([])
    setAppliedCount(0)
  }, [])

  const handleClose = useCallback(() => {
    handleReset()
    onClose()
  }, [handleReset, onClose])

  if (!open) return null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-textPrimary flex items-center gap-2">
              <span className="text-xl">🏢</span>
              Importar Organigrama
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              {step === 'upload' && 'Subi una imagen del organigrama para crear PODs automaticamente'}
              {step === 'analyzing' && 'Analizando estructura con IA...'}
              {step === 'preview' && 'Revisa el matching antes de aplicar'}
              {step === 'done' && 'Importacion completada'}
            </p>
          </div>
          <button onClick={handleClose}
            className="text-gray-400 hover:text-textPrimary transition-colors text-lg p-1">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── STEP: Upload ── */}
          {step === 'upload' && (
            <div className="space-y-4">

              {/* Drop zone */}
              <div
                ref={dragRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-accent hover:bg-accent/5">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFile(e.target.files?.[0])}
                />
                {imagePreview ? (
                  <div className="space-y-3">
                    <img src={imagePreview} alt="Organigrama" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                    <p className="text-xs text-textSecondary">
                      <strong>{imageFile.name}</strong> ({(imageFile.size / 1024).toFixed(0)} KB)
                    </p>
                    <p className="text-[11px] text-accent">Click o arrastra para cambiar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl text-gray-300">📊</div>
                    <p className="text-sm font-semibold text-textPrimary">Arrastra tu organigrama aqui</p>
                    <p className="text-xs text-textSecondary">o hace click para seleccionar — PNG, JPG, WEBP hasta 20 MB</p>
                  </div>
                )}
              </div>

              {/* API Key */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {apiKey ? (
                  /* Key already configured */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-xs font-semibold text-textPrimary">API Key configurada</span>
                      <span className="text-[10px] text-textSecondary">({apiKey.slice(0, 10)}...)</span>
                    </div>
                    <button onClick={() => setShowKey(!showKey)}
                      className="text-[10px] text-accent hover:underline">
                      {showKey ? 'Ocultar' : 'Cambiar key'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-textPrimary">
                      Google AI API Key
                    </label>
                    <a href="https://aistudio.google.com/apikey"
                      target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-accent hover:underline">
                      Obtener key gratis →
                    </a>
                  </div>
                )}
                {(!apiKey || showKey) && (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                      {apiKey && (
                        <button onClick={() => setShowKey(false)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-accent hover:underline">
                          Listo
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-textSecondary">
                      Usa la misma key de Google o genera una en aistudio.google.com/apikey
                    </p>
                  </>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>
          )}

          {/* ── STEP: Analyzing ── */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-accent/30 rounded-full animate-spin border-t-accent" />
                <span className="absolute inset-0 flex items-center justify-center text-2xl">🔍</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-textPrimary">Analizando organigrama...</p>
                <p className="text-xs text-textSecondary mt-1">Gemini Vision esta extrayendo la estructura de equipos</p>
              </div>
              {imagePreview && (
                <img src={imagePreview} alt="" className="max-h-32 rounded-lg shadow-sm opacity-50" />
              )}
            </div>
          )}

          {/* ── STEP: Preview ── */}
          {step === 'preview' && (
            <div className="space-y-4">

              {/* Stats bar */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Equipos', value: matchedTeams.length, color: '#30b299' },
                  { label: 'Personas', value: stats.total, color: '#6B7280' },
                  { label: 'Match exacto', value: stats.exact, color: '#009444' },
                  { label: 'Sin match', value: stats.unmatched, color: stats.unmatched > 0 ? '#E53935' : '#009444' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-textSecondary">{s.label}</p>
                    <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Image preview (small) */}
              {imagePreview && (
                <details className="group">
                  <summary className="text-[11px] text-accent cursor-pointer hover:underline">
                    Ver imagen original
                  </summary>
                  <img src={imagePreview} alt="" className="mt-2 max-h-40 rounded-lg shadow-sm" />
                </details>
              )}

              {/* Teams */}
              <div className="space-y-3">
                {matchedTeams.map((team, ti) => (
                  <div key={ti} className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                    {/* Team header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                        <span className="text-sm font-bold text-textPrimary">{team.team_name}</span>
                        <span className="text-[10px] text-textSecondary">
                          ({team.members.length} persona{team.members.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                      {team.leader && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-textSecondary">Lider:</span>
                          <span className="font-semibold text-textPrimary">{team.leader.extracted}</span>
                          <ConfBadge confidence={team.leader.confidence} />
                        </div>
                      )}
                    </div>

                    {/* Members table */}
                    <div className="divide-y divide-gray-50">
                      {team.members.map((m, mi) => (
                        <div key={mi} className="flex items-center gap-3 px-4 py-2 text-xs hover:bg-gray-50/50">
                          {/* Extracted name */}
                          <div className="w-[35%] flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-textSecondary flex-shrink-0">
                              {m.extracted.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-textPrimary truncate">{m.extracted}</span>
                          </div>

                          {/* Arrow */}
                          <span className="text-gray-300 flex-shrink-0">→</span>

                          {/* Matched name */}
                          <div className="w-[35%] min-w-0">
                            {m.match ? (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-textPrimary truncate">{m.match.nombre}</span>
                                <span className="text-textSecondary flex-shrink-0">{formatUSD(m.match.costoUSD)}</span>
                              </div>
                            ) : (
                              <span className="text-red-400 italic">No encontrado en el sheet</span>
                            )}
                          </div>

                          {/* Confidence */}
                          <div className="flex-shrink-0">
                            <ConfBadge confidence={m.confidence} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Warnings */}
              {stats.unmatched > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
                  <strong>Atencion:</strong> {stats.unmatched} persona{stats.unmatched !== 1 ? 's' : ''} del
                  organigrama no coincide{stats.unmatched !== 1 ? 'n' : ''} con nadie en el sheet.
                  Se crearan los PODs pero esas personas no se asignaran. Podes agregarlas manualmente despues.
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>
          )}

          {/* ── STEP: Done ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center text-3xl">
                ✅
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-textPrimary">Importacion exitosa</p>
                <p className="text-sm text-textSecondary mt-1">
                  Se crearon <strong className="text-accent">{matchedTeams.length} PODs</strong> con
                  <strong className="text-accent"> {appliedCount} personas</strong> asignadas.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-textSecondary max-w-sm text-center">
                Los nuevos PODs aparecen en el Disenador. Podes renombrarlos, ajustar allocations,
                asignar clientes y agregar miembros que no se matchearon.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="text-[11px] text-textSecondary">
            {step === 'upload' && teamPool && `${teamPool.length} personas disponibles para matching`}
            {step === 'preview' && `${stats.matched}/${stats.total} matcheados`}
            {step === 'done' && 'Podes cerrar esta ventana'}
          </div>
          <div className="flex gap-2">
            {step === 'upload' && (
              <>
                <button onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg text-textSecondary hover:bg-gray-100 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleAnalyze}
                  disabled={!imageFile || !apiKey.trim()}
                  className="px-4 py-2 text-xs font-bold rounded-lg text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #30b299, #05a779)' }}>
                  🔍 Analizar con IA
                </button>
              </>
            )}

            {step === 'analyzing' && (
              <button onClick={() => setStep('upload')}
                className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg text-textSecondary hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
            )}

            {step === 'preview' && (
              <>
                <button onClick={handleReset}
                  className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg text-textSecondary hover:bg-gray-100 transition-colors">
                  Volver a intentar
                </button>
                <button onClick={handleApply}
                  className="px-4 py-2 text-xs font-bold rounded-lg text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #30b299, #05a779)' }}>
                  ✅ Aplicar al Disenador ({stats.matched} personas)
                </button>
              </>
            )}

            {step === 'done' && (
              <button onClick={handleClose}
                className="px-4 py-2 text-xs font-bold rounded-lg text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #30b299, #05a779)' }}>
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
