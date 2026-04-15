import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

export interface LeyFrontmatter {
  titulo: string
  identificador: string
  pais: string
  jurisdiccion: string
  rango: string
  fechaPublicacion: string
  ultimaActualizacion: string
  estado: string
  fuente: string
  diarioOficial: string
  ocrProcessed?: boolean
  ocrQuality?: 'poor' | 'medium' | 'good'
}

export function parseFrontmatter(content: string): {
  meta: LeyFrontmatter
  body: string
} {
  const parts = content.split(/^---\s*$/m)
  const yamlBlock = parts[1] ?? ''
  const body = parts.slice(2).join('---').trim()
  const result: Record<string, string | boolean> = {}
  for (const line of yamlBlock.split('\n')) {
    const match = line.match(/^(\w+):\s*"?([^"]*?)"?\s*$/)
    if (match) {
      const value = match[2].trim()
      if (value === 'true') {
        result[match[1]] = true
      } else if (value === 'false') {
        result[match[1]] = false
      } else {
        result[match[1]] = value
      }
    }
  }
  return { meta: result as unknown as LeyFrontmatter, body }
}

export function getAllMdFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...getAllMdFiles(fullPath, baseDir))
    } else if (entry.endsWith('.md')) {
      files.push(relative(baseDir, fullPath))
    }
  }
  return files
}

export function buildIdToFileMap(dir: string): Map<string, string> {
  const map = new Map<string, string>()
  const files = getAllMdFiles(dir)
  for (const filename of files) {
    const content = readFileSync(join(dir, filename), 'utf-8')
    const parts = content.split(/^---\s*$/m)
    const yamlBlock = parts[1] ?? ''
    for (const line of yamlBlock.split('\n')) {
      const match = line.match(/^identificador:\s*"?([^"]*?)"?\s*$/)
      if (match) {
        map.set(match[1].trim(), filename)
        break
      }
    }
    const idFromFilename = filename.replace(/\.md$/, '').replace(/\//g, '-')
    if (!map.has(idFromFilename)) {
      map.set(idFromFilename, filename)
    }
  }
  return map
}

export const LEYES_DIR = join(process.cwd(), '../../leyes/pe')

export const rangoLabels: Record<string, string> = {
  constitucion: 'Constitución',
  ley: 'Ley',
  'decreto-legislativo': 'Decreto Legislativo',
  'decreto-urgencia': 'Decreto de Urgencia',
  'decreto-supremo': 'Decreto Supremo',
}
