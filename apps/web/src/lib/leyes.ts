import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseFrontmatter as parseFromParser } from '@legalize-pe/parser'
import type { LawMetadata } from '@legalize-pe/parser'
import { shouldSkipFile, RANGO_LABELS_FULL } from './constants'

// Keep local type as alias for compatibility
export type LeyFrontmatter = LawMetadata

export function parseFrontmatter(content: string): {
  meta: LeyFrontmatter
  body: string
} {
  const { frontmatter, body } = parseFromParser(content)
  return { meta: frontmatter, body }
}

export function getAllMdFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    if (shouldSkipFile(entry)) continue
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

export const rangoLabels = RANGO_LABELS_FULL
