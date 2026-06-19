/**
 * visionService.js
 * Envía una imagen de organigrama a Google Gemini (vision) para extraer
 * la estructura de equipos/pods con los nombres de las personas.
 */

const GEMINI_MODEL = 'gemini-2.0-flash'

const PROMPT = `Eres un asistente que analiza imagenes de organigramas organizacionales.

Analiza la imagen y extrae la estructura de equipos, pods o departamentos.

Para cada equipo que identifiques, devuelve:
- team_name: nombre del equipo, departamento o pod
- leader: nombre completo del lider del equipo (si es identificable, sino null)
- members: array con los nombres completos de TODOS los miembros (incluyendo al lider si aplica)

REGLAS:
- Extrae los nombres EXACTAMENTE como aparecen en la imagen
- Si hay roles/cargos junto al nombre, ignora el cargo y devuelve solo el nombre
- Si no hay equipos claros, agrupa por la estructura visual (ramas del organigrama)
- Si una persona aparece sola sin equipo, crea un equipo con su nombre
- Incluye TODAS las personas que veas en la imagen, no omitas ninguna

Devuelve SOLO un JSON array valido, sin texto adicional ni markdown:
[{"team_name": "Nombre Equipo", "leader": "Nombre Lider", "members": ["Nombre 1", "Nombre 2"]}]`

/**
 * Analiza una imagen de organigrama usando Google Gemini Vision.
 * @param {string} imageBase64 — la imagen codificada en base64 (sin prefijo data:)
 * @param {string} mimeType — ej: "image/png", "image/jpeg"
 * @param {string} apiKey — API key de Google (con Generative Language API habilitado)
 * @returns {Promise<Array>} — array de {team_name, leader, members[]}
 */
export async function parseOrgChart(imageBase64, mimeType, apiKey) {
  if (!apiKey) throw new Error('Se requiere una API key de Google AI (Gemini)')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inlineData: { mimeType, data: imageBase64 } },
      ],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `Gemini API error ${res.status}`
    if (res.status === 403 || msg.includes('not enabled') || msg.includes('permission')) {
      throw new Error(
        'La API de Gemini no esta habilitada en tu proyecto de Google Cloud. ' +
        'Tenes que ir a console.cloud.google.com → APIs & Services → Library → ' +
        'buscar "Generative Language API" → Habilitar. ' +
        'O genera una key nueva en aistudio.google.com/apikey y pegala en "Cambiar key".'
      )
    }
    throw new Error(msg)
  }

  const json = await res.json()

  // Extraer el texto de la respuesta
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini no devolvio contenido')

  try {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error('Formato inesperado')
    return parsed
  } catch (e) {
    // Intentar extraer JSON de la respuesta si viene envuelto en markdown
    const match = text.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    throw new Error('No se pudo parsear la respuesta de Gemini: ' + text.slice(0, 200))
  }
}
