import Fuse from 'fuse.js'
import type { CompactLey } from './search-index'

interface SearchResult {
  law: CompactLey
  score: number
  matchReasons: string[]
}

// Common legal terms and their related keywords
const LEGAL_KEYWORDS: Record<string, string[]> = {
  // Labor topics
  laboral: ['trabajo', 'trabajador', 'empleador', 'empleo', 'despido', 'contrato', 'remuneracion', 'salario', 'sueldo', 'empleado'],
  cts: ['compensacion', 'tiempo', 'servicios', 'beneficios'],
  despido: ['cese', 'terminacion', 'desvinculacion', 'finalizacion', 'despidos', 'despedido'],
  despidos: ['despido', 'cese', 'terminacion', 'desvinculacion'],
  vacaciones: ['descanso', 'feriado', 'licencia'],
  remuneracion: ['salario', 'sueldo', 'pago', 'remuneraciones'],

  // Housing/rental topics
  inquilino: ['alquiler', 'arrendamiento', 'arrendatario', 'vivienda', 'renta'],
  propietario: ['dueno', 'arrendador', 'propiedad'],

  // Public procurement
  contratacion: ['adquisiciones', 'compras', 'licitacion', 'concurso'],
  publica: ['estado', 'gobierno', 'publico'],

  // Civil topics
  civil: ['codigo', 'obligaciones', 'contratos', 'familia', 'sucesiones', 'propiedad'],
  matrimonio: ['casamiento', 'conyuges', 'esposos', 'union', 'matrimonios'],
  divorcio: ['separacion', 'disolucion', 'divorcios', 'separaciones'],
  separacion: ['divorcio', 'disolucion', 'separaciones'],
  familia: ['matrimonio', 'divorcio', 'patria', 'potestad', 'alimentos', 'hijos'],

  // Criminal topics
  penal: ['delito', 'pena', 'sancion', 'crimen', 'criminal'],
  robo: ['hurto', 'sustraccion', 'apropiacion'],

  // Tax topics
  tributario: ['impuesto', 'tributo', 'fiscal', 'sunat', 'igv', 'renta'],
  igv: ['iva', 'valor agregado', 'ventas'],

  // Business topics
  empresa: ['sociedad', 'compania', 'negocio', 'comercio'],
  comercio: ['comercial', 'mercantil', 'empresarial'],

  // Administrative topics
  administrativo: ['procedimiento', 'silencio', 'recurso', 'impugnacion'],

  // Constitutional topics
  constitucion: ['constitucional', 'derechos fundamentales', 'garantias'],
  amparo: ['tutela', 'proteccion', 'derechos'],

  // Consumer topics
  consumidor: ['cliente', 'usuario', 'indecopi', 'proteccion'],

  // Environmental topics
  ambiental: ['medio ambiente', 'ecologia', 'contaminacion', 'recursos naturales'],
}

// Stop words to remove from queries
const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'al', 'a', 'en', 'con', 'por', 'para',
  'que', 'mi', 'su', 'me', 'se', 'no', 'si', 'como',
  'es', 'son', 'esta', 'estas', 'ese', 'esos',
  'sobre', 'dice', 'dicen', 'puede', 'pueden',
  'hacer', 'tengo', 'tiene', 'hay', 'cuales', 'cual',
  'mis', 'sus', 'mis', 'tus', 'nuestro', 'vuestro',
])

/**
 * Extract keywords from natural language query
 */
function extractKeywords(query: string): string[] {
  const normalized = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[?!¿¡.,;:]/g, ' ')
    .trim()

  const words = normalized.split(/\s+/)
  const keywords: string[] = []

  // Filter out stop words and extract meaningful keywords
  for (const word of words) {
    if (word.length < 3 || STOP_WORDS.has(word)) continue

    // Add the original word
    keywords.push(word)

    // Also add singular/plural variations
    if (word.endsWith('s') && word.length > 4) {
      keywords.push(word.slice(0, -1)) // Remove plural 's'
    } else if (!word.endsWith('s')) {
      keywords.push(word + 's') // Add plural
    }
  }

  return keywords
}

/**
 * Expand keywords using legal terminology mappings
 */
function expandKeywords(keywords: string[]): string[] {
  const expanded = new Set(keywords)

  for (const keyword of keywords) {
    // Check if this keyword has related terms
    if (LEGAL_KEYWORDS[keyword]) {
      for (const related of LEGAL_KEYWORDS[keyword]) {
        expanded.add(related)
      }
    }

    // Also check if any legal keyword maps contain this term
    for (const [key, values] of Object.entries(LEGAL_KEYWORDS)) {
      if (values.includes(keyword)) {
        expanded.add(key)
        for (const related of values) {
          expanded.add(related)
        }
      }
    }
  }

  return Array.from(expanded)
}

/**
 * Calculate relevance score for a law based on keyword matches
 */
function calculateRelevance(
  law: CompactLey,
  keywords: string[],
  expandedKeywords: string[]
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Normalize text for matching
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

  const tituloNorm = normalize(law.t)
  const bodyNorm = normalize(law.b)
  const materiasNorm = law.m.map(m => normalize(m))

  // Check for exact keyword matches in title (highest weight)
  for (const keyword of keywords) {
    if (tituloNorm.includes(keyword)) {
      score += 10
      reasons.push(`Título contiene "${keyword}"`)
    }
  }

  // Check for keyword matches in materias (high weight)
  for (const materia of materiasNorm) {
    for (const keyword of expandedKeywords) {
      if (materia.includes(keyword)) {
        score += 8
        if (!reasons.some(r => r.startsWith('Materia:'))) {
          reasons.push(`Materia: ${law.m.find(m => normalize(m).includes(keyword))}`)
        }
      }
    }
  }

  // Check for keyword matches in body (medium weight)
  for (const keyword of expandedKeywords) {
    if (bodyNorm.includes(keyword)) {
      score += 3
      if (reasons.length < 3) {
        reasons.push(`Contenido menciona "${keyword}"`)
      }
    }
  }

  // Bonus for multiple keyword matches
  const matchedKeywords = keywords.filter(k =>
    tituloNorm.includes(k) || bodyNorm.includes(k) || materiasNorm.some(m => m.includes(k))
  )

  if (matchedKeywords.length > 1) {
    score += matchedKeywords.length * 2
  }

  // Penalty for very old laws (prefer recent legislation)
  if (law.f && law.f < '1990-01-01') {
    score *= 0.8
  }

  // Bonus for vigente laws
  if (law.e === 'vigente') {
    score *= 1.2
  }

  return { score, reasons }
}

/**
 * Perform smart search on laws using natural language query
 */
export function smartSearch(
  query: string,
  laws: CompactLey[],
  limit = 10
): SearchResult[] {
  if (!query.trim()) return []

  // Extract and expand keywords
  const keywords = extractKeywords(query)
  if (keywords.length === 0) return []

  const expandedKeywords = expandKeywords(keywords)

  // Calculate relevance for each law
  const results: SearchResult[] = []

  for (const law of laws) {
    const { score, reasons } = calculateRelevance(law, keywords, expandedKeywords)

    if (score > 0) {
      results.push({
        law,
        score,
        matchReasons: reasons,
      })
    }
  }

  // Sort by score (descending) and return top results
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, limit)
}

/**
 * Perform fuzzy search using Fuse.js as fallback
 */
export function fuzzySearch(
  query: string,
  laws: CompactLey[],
  limit = 10
): SearchResult[] {
  const fuse = new Fuse(laws, {
    keys: [
      { name: 't', weight: 0.5 },
      { name: 'b', weight: 0.3 },
      { name: 'm', weight: 0.2 },
    ],
    threshold: 0.4,
    includeScore: true,
  })

  const fuseResults = fuse.search(query, { limit })

  return fuseResults.map(result => ({
    law: result.item,
    score: (1 - (result.score ?? 0)) * 100, // Convert to 0-100 scale
    matchReasons: ['Coincidencia por búsqueda difusa'],
  }))
}

/**
 * Combined smart search with fuzzy fallback
 */
export function intelligentSearch(
  query: string,
  laws: CompactLey[],
  limit = 10
): SearchResult[] {
  // Try smart search first
  const smartResults = smartSearch(query, laws, limit)

  // If we have good results, return them
  if (smartResults.length >= 5 && smartResults[0].score > 10) {
    return smartResults
  }

  // Otherwise, combine with fuzzy search
  const fuzzyResults = fuzzySearch(query, laws, limit)

  // Merge results, avoiding duplicates
  const seen = new Set(smartResults.map(r => r.law.id))
  const combined = [...smartResults]

  for (const fuzzyResult of fuzzyResults) {
    if (!seen.has(fuzzyResult.law.id)) {
      combined.push(fuzzyResult)
      seen.add(fuzzyResult.law.id)
    }
  }

  // Re-sort and limit
  combined.sort((a, b) => b.score - a.score)
  return combined.slice(0, limit)
}
