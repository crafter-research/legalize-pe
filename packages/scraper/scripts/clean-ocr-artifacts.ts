#!/usr/bin/env tsx
/**
 * Clean OCR artifacts from existing markdown files
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const LEYES_DIR = join(process.cwd(), '../../leyes/pe')

// OCR artifact patterns to remove
const OCR_ARTIFACT_PATTERNS = [
  // Navigation artifacts
  /Ver jurisprudencia aquí\.?/gi,
  /Ver jurisprudencia aqu[ií]\.?/gi,
  /Inicio \*\* Legislación/gi,
  /Inicio\s*\*+\s*Legislaci[oó]n/gi,

  // El Peruano artifacts
  /Firmado por:.*?(?=\n|$)/gi,
  /NORMAS LEGALES\s*/g,
  /El Peruano\s*\/?\s*\w+\s+\d+\s+de\s+\w+\s+de\s+\d+/gi,

  // Page headers/footers
  /^P[aá]gina\s+\d+\s*$/gim,
  /^\d+\s+NORMAS LEGALES\s*$/gim,

  // Broken link placeholders
  /\[Ver enlace\]/gi,
  /\[link\]/gi,

  // Common repeated headers
  /^-{3,}\s*$/gm, // More than 3 dashes on a line
]

function cleanOcrArtifacts(content: string): string {
  let cleaned = content

  // Apply all patterns
  for (const pattern of OCR_ARTIFACT_PATTERNS) {
    cleaned = cleaned.replace(pattern, '')
  }

  // Clean up excessive whitespace
  cleaned = cleaned
    .replace(/\n{4,}/g, '\n\n\n') // Max 2 blank lines
    .replace(/[ \t]+$/gm, '') // Trailing whitespace
    .replace(/^\s+$/gm, '') // Lines with only whitespace
    .trim()

  return cleaned
}

function getAllMdFiles(dir: string): string[] {
  const files: string[] = []
  const entries = readdirSync(dir)

  for (const entry of entries) {
    if (entry.startsWith('.')) continue

    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      files.push(...getAllMdFiles(fullPath))
    } else if (entry.endsWith('.md') && !entry.startsWith('HISTORIAL')) {
      files.push(fullPath)
    }
  }

  return files
}

function main() {
  console.log('🧹 Cleaning OCR artifacts from law files...\n')

  const files = getAllMdFiles(LEYES_DIR)
  let cleaned = 0
  let unchanged = 0

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8')
    const cleanedContent = cleanOcrArtifacts(content)

    if (cleanedContent !== content) {
      writeFileSync(filePath, cleanedContent, 'utf-8')
      console.log(`✓ Cleaned: ${filePath.replace(LEYES_DIR + '/', '')}`)
      cleaned++
    } else {
      unchanged++
    }
  }

  console.log('\n─────────────────────────')
  console.log(`✅ Cleaned: ${cleaned}`)
  console.log(`⏭️  Unchanged: ${unchanged}`)
  console.log(`📊 Total: ${files.length}`)
  console.log('─────────────────────────')
}

main()
