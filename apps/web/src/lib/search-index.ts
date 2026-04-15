import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LEYES_DIR, getAllMdFiles, parseFrontmatter } from './leyes'

export interface SearchableLey {
  identificador: string
  titulo: string
  rango: string
  estado: string
  fechaPublicacion: string
  body: string
}

export interface CompactLey {
  id: string
  t: string // titulo
  r: string // rango
  e: string // estado
  f: string // fechaPublicacion
  b: string // body preview (cleaned)
  m: string[] // materias
}

function cleanBodyForSearch(body: string): string {
  return body
    // Remove OCR artifacts from El Peruano
    .replace(/Firmado por:.*?(?=\n|$)/gi, '')
    .replace(/NORMAS LEGALES/g, '')
    .replace(/El Peruano\s*\/?\s*\w+\s+\d+\s+de\s+\w+\s+de\s+\d+/gi, '')
    // Remove markdown formatting
    .replace(/^#+\s+/gm, '')
    .replace(/\*+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove common legal boilerplate
    .replace(/Ver jurisprudencia aqu[ií]\.?/gi, '')
    .replace(/CONCORDANCIAS:.*?(?=\n\n|\n[A-Z])/gs, '')
    // Fix encoding issues (replace invalid chars)
    .replace(/�/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildSearchIndex(): SearchableLey[] {
  const files = getAllMdFiles(LEYES_DIR)
  const leyes: SearchableLey[] = []

  for (const filename of files) {
    if (filename.startsWith('HISTORIAL')) continue

    const content = readFileSync(join(LEYES_DIR, filename), 'utf-8')
    const { meta, body } = parseFrontmatter(content)

    if (!meta.titulo || !meta.identificador) continue

    // Extract first 500 chars of body for search (reduced for smaller index)
    const bodyPreview = body
      .replace(/^#+\s+/gm, '') // Remove markdown headers
      .replace(/\*+/g, '') // Remove bold/italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Extract link text
      .slice(0, 500)

    leyes.push({
      identificador: meta.identificador,
      titulo: meta.titulo,
      rango: meta.rango || '',
      estado: meta.estado || 'vigente',
      fechaPublicacion: meta.fechaPublicacion || '',
      body: bodyPreview,
    })
  }

  return leyes.sort((a, b) =>
    (b.fechaPublicacion ?? '').localeCompare(a.fechaPublicacion ?? ''),
  )
}

export function buildCompactSearchIndex(): CompactLey[] {
  const files = getAllMdFiles(LEYES_DIR)
  const leyes: CompactLey[] = []

  for (const filename of files) {
    if (filename.startsWith('HISTORIAL')) continue

    const content = readFileSync(join(LEYES_DIR, filename), 'utf-8')
    const { meta, body } = parseFrontmatter(content)

    if (!meta.titulo || !meta.identificador) continue

    // Clean and extract first 300 chars of body for search
    const cleanedBody = cleanBodyForSearch(body).slice(0, 300)

    leyes.push({
      id: meta.identificador,
      t: meta.titulo,
      r: meta.rango || '',
      e: meta.estado || 'vigente',
      f: meta.fechaPublicacion || '',
      b: cleanedBody,
      m: Array.isArray(meta.materias) ? meta.materias : [],
    })
  }

  return leyes.sort((a, b) => (b.f ?? '').localeCompare(a.f ?? ''))
}
