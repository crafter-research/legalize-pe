#!/usr/bin/env npx tsx
/**
 * Script to clean OCR artifacts from law files
 * Run with: npx tsx scripts/clean-ocr.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const LEYES_DIR = join(process.cwd(), 'leyes/pe')

// Patterns to remove (OCR artifacts)
const PATTERNS_TO_REMOVE = [
  // El Peruano headers
  /^Firmado por:.*$/gm,
  /^[%Y£H]+\s*NORMAS LEGALES.*$/gm,
  /^\d+\s*NORMAS LEGALES.*$/gm,
  /^NORMAS LEGALES\s+(Lunes|Martes|Miércoles|Miercoles|Jueves|Viernes|Sábado|Sabado|Domingo).*$/gim,
  /^NORMAS LEGALES$/gm,
  /^[$Y%]\s*NORMAS LEGALES$/gm,
  /^SEPARATA DE NORMAS LEGALES.*$/gim,
  /^PUBLICACIÓN VIRTUAL DE NORMAS LEGALES.*$/gim,
  // Date headers (Spanish days)
  /^(Lunes|Martes|Miércoles|Miercoles|Jueves|Viernes|Sábado|Sabado|Domingo)\s+\d+\s+de\s+\w+\s+de\s+\d{4}\s*[\/|]\s*El Peruano.*$/gim,
  /^El Peruano\s*[\/|]\s*(Lunes|Martes|Miércoles|Miercoles|Jueves|Viernes|Sábado|Sabado|Domingo)\s+\d+\s+de\s+\w+\s+de\s+\d{4}.*$/gim,
  // Website navigation/marketing text
  /^USO DEL SISTEMA PGA PARA PUBLICACIÓN DE NORMAS LEGALES.*$/gim,
  /^NORMAS LEGALES ACTUALIZADAS.*$/gim,
  /^INGRESA A NORMAS LEGALES ACTUALIZADAS.*$/gim,
  /^MANTENTE INFORMADO CON LO ÚLTIMO EN NORMAS LEGALES.*$/gim,
  // Page markers
  /^-\s*\d+\s*-$/gm,
  // Empty markdown links
  /\[([^\]]*)\]\(\s*\)/g,
  // "Ver jurisprudencia aquí" without actual links
  /Ver jurisprudencia aqu[ií]\.?/gi,
]

// Common encoding fixes (Spanish characters)
const ENCODING_FIXES: [RegExp, string][] = [
  // Vowels with accents
  [/á/g, 'á'], [/é/g, 'é'], [/í/g, 'í'], [/ó/g, 'ó'], [/ú/g, 'ú'],
  [/Á/g, 'Á'], [/É/g, 'É'], [/Í/g, 'Í'], [/Ó/g, 'Ó'], [/Ú/g, 'Ú'],
  // Ñ
  [/ñ/g, 'ñ'], [/Ñ/g, 'Ñ'],
  // Ü
  [/ü/g, 'ü'], [/Ü/g, 'Ü'],
  // Remove replacement character (can't guess what it was)
  [/�/g, ''],
]

// Whitespace normalization
const WHITESPACE_FIXES: [RegExp, string][] = [
  // Multiple blank lines -> max 2
  [/\n{4,}/g, '\n\n\n'],
  // Trailing whitespace
  [/[ \t]+$/gm, ''],
  // Multiple spaces -> single
  [/  +/g, ' '],
]

function getAllMdFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry.startsWith('HISTORIAL')) continue
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...getAllMdFiles(fullPath, baseDir))
    } else if (entry.endsWith('.md')) {
      files.push(fullPath)
    }
  }
  return files
}

function cleanContent(content: string): string {
  let cleaned = content

  // Apply pattern removals
  for (const pattern of PATTERNS_TO_REMOVE) {
    cleaned = cleaned.replace(pattern, '')
  }

  // Apply encoding fixes
  for (const [pattern, replacement] of ENCODING_FIXES) {
    cleaned = cleaned.replace(pattern, replacement)
  }

  // Apply whitespace normalization
  for (const [pattern, replacement] of WHITESPACE_FIXES) {
    cleaned = cleaned.replace(pattern, replacement)
  }

  return cleaned
}

function processFile(filepath: string): { changed: boolean; removedLines: number } {
  const original = readFileSync(filepath, 'utf-8')
  const cleaned = cleanContent(original)

  const originalLines = original.split('\n').length
  const cleanedLines = cleaned.split('\n').length
  const removedLines = originalLines - cleanedLines

  if (original !== cleaned) {
    writeFileSync(filepath, cleaned, 'utf-8')
    return { changed: true, removedLines }
  }

  return { changed: false, removedLines: 0 }
}

// Main
console.log('🧹 Cleaning OCR artifacts from law files...\n')

const files = getAllMdFiles(LEYES_DIR)
let totalChanged = 0
let totalLinesRemoved = 0

for (const filepath of files) {
  const { changed, removedLines } = processFile(filepath)
  if (changed) {
    totalChanged++
    totalLinesRemoved += removedLines
    const rel = relative(LEYES_DIR, filepath)
    if (removedLines > 0) {
      console.log(`  ✓ ${rel} (-${removedLines} lines)`)
    } else {
      console.log(`  ✓ ${rel} (cleaned)`)
    }
  }
}

console.log(`\n✅ Done!`)
console.log(`   Files processed: ${files.length}`)
console.log(`   Files modified: ${totalChanged}`)
console.log(`   Lines removed: ${totalLinesRemoved}`)
