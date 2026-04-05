/**
 * SPIJ API Client
 *
 * Handles authentication and data fetching from SPIJ (Sistema Peruano de Información Jurídica)
 */

const SPIJ_API_BASE = 'https://spijwsii.minjus.gob.pe/spij-ext-back/api'

// Free access credentials (usuarioNoPago)
const FREE_ACCESS_CREDENTIALS = {
  user: {},
  usuario: 'usuarioNoPago',
  password: 'e10adc3949ba59abbe56e057f20f883e', // MD5 of "123456"
  captcha_response: true,
}

export interface SpijLaw {
  id: string
  codigoNorma: string
  sumilla: string
  titulo: string
  textoCompleto: string
  fechaPublicacion: string
  sector: string
  dispositivoLegal: string
  ruta: string
  migrado: string
}

export interface SpijLoginResponse {
  token: string
}

let cachedToken: string | null = null
let tokenExpiry = 0

/**
 * Get authentication token for SPIJ API
 */
export async function getSpijToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const response = await fetch(`${SPIJ_API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://spij.minjus.gob.pe/',
    },
    body: JSON.stringify(FREE_ACCESS_CREDENTIALS),
  })

  if (!response.ok) {
    throw new Error(`SPIJ login failed: ${response.status}`)
  }

  const data = (await response.json()) as SpijLoginResponse
  cachedToken = data.token

  // Token expires in 7 days, but we'll refresh after 6 days to be safe
  tokenExpiry = Date.now() + 6 * 24 * 60 * 60 * 1000

  return cachedToken
}

/**
 * Fetch law details from SPIJ API
 */
export async function fetchLaw(spijId: string): Promise<SpijLaw> {
  const token = await getSpijToken()

  const response = await fetch(`${SPIJ_API_BASE}/detallenorma/${spijId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Referer: 'https://spij.minjus.gob.pe/',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch law ${spijId}: ${response.status}`)
  }

  return response.json() as Promise<SpijLaw>
}

/**
 * Search for laws in SPIJ
 * Note: This requires browser automation as the search API is more complex
 */
export async function searchLaws(query: string): Promise<string[]> {
  // TODO: Implement search using agent-browser
  // For now, we'll use known SPIJ IDs
  throw new Error('Search not implemented - use known SPIJ IDs')
}

/**
 * Known SPIJ IDs for MVP laws
 */
export const MVP_LAWS: Record<string, string> = {
  // Constitución y Códigos principales
  'constitucion-1993': 'H679920', // Constitución Política del Perú
  'dleg-295': 'H682684', // Código Civil
  'dleg-635': 'H683648', // Código Penal
  'dleg-957': 'H697295', // Nuevo Código Procesal Penal
  // Otros códigos
  'dleg-768': 'H684704', // TUO Código Procesal Civil
  'dleg-822': 'H685016', // Ley de Derechos de Autor
  'dleg-728': 'H684384', // Ley de Productividad y Competitividad Laboral
  // Leyes importantes
  'ley-27444': 'H689068', // Ley de Procedimiento Administrativo General
  'ley-26702': 'H687512', // Ley General del Sistema Financiero
  'ley-29571': 'H703096', // Código de Protección al Consumidor
}
