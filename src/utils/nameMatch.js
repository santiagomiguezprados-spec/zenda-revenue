/**
 * nameMatch.js
 * Fuzzy name matching utility.
 * Compara nombres extraidos por Gemini Vision contra el pool real
 * de personas / clientes del Google Sheet.
 *
 * Niveles de confianza:
 *  - exact   (100): coincidencia exacta normalizada
 *  - high     (85): un nombre es prefijo/sufijo del otro o mismos tokens desordenados
 *  - medium   (65): mayoria de tokens coinciden (>= 60%)
 *  - low      (40): al menos un token largo coincide
 *  - none      (0): sin match
 */

/** Normaliza: minusculas, sin acentos, sin puntos/comas */
function normalize(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.,;:()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tokeniza un nombre en palabras filtradas */
function tokenize(name) {
  const stopWords = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'da', 'do'])
  return normalize(name).split(' ').filter(t => t.length > 0 && !stopWords.has(t))
}

/**
 * Compara dos nombres y devuelve un score de confianza (0-100)
 */
function compareNames(extracted, candidate) {
  const ne = normalize(extracted)
  const nc = normalize(candidate)

  // 1) Exacto
  if (ne === nc) return 100

  // 2) Uno contenido en el otro
  if (ne.includes(nc) || nc.includes(ne)) return 90

  // 3) Comparar por tokens
  const tokE = tokenize(extracted)
  const tokC = tokenize(candidate)

  if (tokE.length === 0 || tokC.length === 0) return 0

  // Tokens exactos en comun
  const setC = new Set(tokC)
  const exact = tokE.filter(t => setC.has(t))

  // Si todos los tokens coinciden (orden diferente)
  if (exact.length === tokE.length && exact.length === tokC.length) return 95

  // Tokens con prefijo comun (>= 3 chars): "Gonz" → "Gonzalez"
  const fuzzy = tokE.filter(te =>
    tokC.some(tc => te.length >= 3 && tc.length >= 3 && (tc.startsWith(te) || te.startsWith(tc)))
  )

  const matchedTokens = new Set([...exact, ...fuzzy])
  const totalRef = Math.max(tokE.length, tokC.length)
  const matchRatio = matchedTokens.size / totalRef

  if (matchRatio >= 0.8) return 85
  if (matchRatio >= 0.6) return 65

  // Al menos un token largo (>= 4 chars) coincide
  if (exact.some(t => t.length >= 4) || fuzzy.some(t => t.length >= 4)) return 40

  return 0
}

/**
 * Encuentra el mejor match en un pool para un nombre extraido.
 * @param {string} extractedName — nombre del organigrama (Gemini)
 * @param {Array<{nombre: string}>} pool — team o client pool
 * @param {number} threshold — score minimo (default 40)
 * @returns {{ match: object|null, score: number, confidence: string }}
 */
export function findBestMatch(extractedName, pool, threshold = 40) {
  let bestScore = 0
  let bestItem = null

  for (const item of pool) {
    const score = compareNames(extractedName, item.nombre)
    if (score > bestScore) {
      bestScore = score
      bestItem = item
    }
  }

  if (bestScore < threshold) {
    return { match: null, score: 0, confidence: 'none' }
  }

  const confidence =
    bestScore >= 90 ? 'exact' :
    bestScore >= 75 ? 'high' :
    bestScore >= 55 ? 'medium' : 'low'

  return { match: bestItem, score: bestScore, confidence }
}

/**
 * Hace match de un array de nombres contra un pool.
 * @param {string[]} names — nombres del organigrama
 * @param {Array<{nombre: string}>} pool — pool de datos
 * @param {number} threshold — score minimo
 * @returns {Array<{ extracted: string, match: object|null, score: number, confidence: string }>}
 */
export function matchNames(names, pool, threshold = 40) {
  return names.map(name => ({
    extracted: name,
    ...findBestMatch(name, pool, threshold),
  }))
}

/**
 * Procesa la salida de Gemini Vision y matchea contra el team pool.
 * @param {Array<{team_name, leader, members[]}>} teams — de visionService
 * @param {Array<{nombre, costoUSD}>} teamPool — del sheet
 * @returns {Array<{ team_name, leader, members: [{extracted, match, score, confidence}] }>}
 */
export function matchOrgChartTeams(teams, teamPool) {
  return teams.map(team => ({
    team_name: team.team_name,
    leader: team.leader
      ? { extracted: team.leader, ...findBestMatch(team.leader, teamPool) }
      : null,
    members: matchNames(team.members || [], teamPool),
  }))
}
