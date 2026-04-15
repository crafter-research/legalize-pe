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
    const { meta } = parseFrontmatter(content)

    if (!meta.titulo || !meta.identificador) continue

    leyes.push({
      id: meta.identificador,
      t: meta.titulo,
      r: meta.rango || '',
      e: meta.estado || 'vigente',
      f: meta.fechaPublicacion || '',
    })
  }

  return leyes.sort((a, b) => (b.f ?? '').localeCompare(a.f ?? ''))
}
