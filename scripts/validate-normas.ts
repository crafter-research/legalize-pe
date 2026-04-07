#!/usr/bin/env npx tsx
/**
 * Validate downloaded law files
 *
 * Usage:
 *   npx tsx scripts/validate-normas.ts [--fix] [--verbose]
 *   npx tsx scripts/validate-normas.ts <file.md>
 */

import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NormaCatalog, ValidationResult } from './lib/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LEYES_DIR = join(__dirname, '../leyes/pe')
const CATALOG_PATH = join(__dirname, 'catalogo-normas.json')

// Required frontmatter fields
const REQUIRED_FIELDS = [
  'titulo',
  'identificador',
  'pais',
  'jurisdiccion',
  'rango',
  'fechaPublicacion',
  'estado',
]

// Valid rango values
const VALID_RANGOS = [
  'constitucion',
  'ley',
  'decreto-legislativo',
  'decreto-ley',
  'decreto-supremo',
  'resolucion',
  'directiva',
  'otro',
]

// Parse frontmatter from markdown
function parseFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const yaml = match[1]
  const result: Record<string, unknown> = {}

  for (const line of yaml.split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value: string | string[] | boolean = line.slice(colonIndex + 1).trim()

      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value
          .slice(1, -1)
          .split(',')
          .map((v) => v.trim().replace(/^["']|["']$/g, ''))
      }
      // Handle booleans
      else if (value === 'true') value = true
      else if (value === 'false') value = false
      // Handle quoted strings
      else if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      result[key] = value
    }
  }

  return result
}

// Extract body from markdown (after frontmatter)
function extractBody(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/)
  return match ? match[1].trim() : content
}

// Validate a single file
async function validateFile(filePath: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      chars: 0,
      lines: 0,
      articles: 0,
      garbled: 0,
    },
  }

  try {
    const content = await readFile(filePath, 'utf-8')
    const frontmatter = parseFrontmatter(content)
    const body = extractBody(content)

    // Stats
    result.stats.chars = content.length
    result.stats.lines = content.split('\n').length
    result.stats.articles = (body.match(/artículo/gi) || []).length
    result.stats.garbled = (content.match(/�/g) || []).length

    // Validate frontmatter exists
    if (!frontmatter) {
      result.valid = false
      result.errors.push('Missing or invalid frontmatter')
      return result
    }

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!frontmatter[field]) {
        result.valid = false
        result.errors.push(`Missing required field: ${field}`)
      }
    }

    // Validate rango
    if (
      frontmatter.rango &&
      !VALID_RANGOS.includes(frontmatter.rango as string)
    ) {
      result.warnings.push(`Unknown rango: ${frontmatter.rango}`)
    }

    // Validate body has real content
    if (body.length < 500) {
      result.valid = false
      result.errors.push(`Body too short: ${body.length} chars (min 500)`)
    }

    // Warn about excessive garbled characters (don't fail, just warn)
    if (result.stats.garbled > 50) {
      result.warnings.push(
        `Too many garbled characters: ${result.stats.garbled}`,
      )
    }

    // Warning for codes with few articles
    if (
      frontmatter.identificador?.toString().includes('codigo') &&
      result.stats.articles < 10
    ) {
      result.warnings.push(
        `Code file has very few articles: ${result.stats.articles}`,
      )
    }

    // Warning for HTML remnants
    if (
      body.includes('</div>') ||
      body.includes('</span>') ||
      body.includes('class="')
    ) {
      result.warnings.push('Body contains HTML remnants')
    }

    // Warning for encoding issues
    if (body.includes('Ã') || body.includes('Â')) {
      result.warnings.push('Possible UTF-8 encoding issues')
    }
  } catch (error) {
    result.valid = false
    result.errors.push(
      `Error reading file: ${error instanceof Error ? error.message : error}`,
    )
  }

  return result
}

// Main
async function main() {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose')
  const fix = args.includes('--fix')
  const singleFile = args.find((a) => a.endsWith('.md'))

  console.log('🔍 Legalize PE - Law Validator')
  console.log('═'.repeat(50))

  if (singleFile) {
    // Validate single file
    const filePath = singleFile.startsWith('/')
      ? singleFile
      : join(LEYES_DIR, singleFile)
    console.log(`\nValidating: ${filePath}\n`)

    const result = await validateFile(filePath)
    printResult(singleFile, result, true)
    process.exit(result.valid ? 0 : 1)
  }

  // Validate all files
  const files = await readdir(LEYES_DIR)
  const mdFiles = files.filter((f) => f.endsWith('.md'))

  console.log(`\n📋 Validating ${mdFiles.length} files...\n`)

  let valid = 0
  let invalid = 0
  let warnings = 0
  const invalidFiles: string[] = []

  for (const file of mdFiles) {
    const filePath = join(LEYES_DIR, file)
    const result = await validateFile(filePath)

    if (result.valid) {
      valid++
      if (result.warnings.length > 0) {
        warnings++
        if (verbose) {
          printResult(file, result, false)
        }
      }
    } else {
      invalid++
      invalidFiles.push(file)
      printResult(file, result, verbose)
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Valid: ${valid}`)
  console.log(`⚠️  With warnings: ${warnings}`)
  console.log(`❌ Invalid: ${invalid}`)

  if (invalidFiles.length > 0) {
    console.log('\nInvalid files:')
    for (const file of invalidFiles) {
      console.log(`  - ${file}`)
    }
  }

  // Update catalog if --fix
  if (fix && invalidFiles.length > 0) {
    console.log('\nUpdating catalog...')
    try {
      const catalogContent = await readFile(CATALOG_PATH, 'utf-8')
      const catalog: NormaCatalog = JSON.parse(catalogContent)

      for (const file of invalidFiles) {
        const id = file.replace('.md', '')
        const entry = catalog.normas.find((n) => n.identificador === id)
        if (entry) {
          entry.estado = 'error'
        }
      }

      await writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8')
      console.log('✅ Catalog updated')
    } catch {
      console.log('⚠️  Could not update catalog')
    }
  }

  // Exit with error if invalid files found
  process.exit(invalid > 0 ? 1 : 0)
}

function printResult(
  file: string,
  result: ValidationResult,
  detailed: boolean,
) {
  const status = result.valid ? '✅' : '❌'
  const stats = `${result.stats.chars} chars, ${result.stats.articles} art, ${result.stats.garbled} garbled`

  if (detailed) {
    console.log(`${status} ${file}`)
    console.log(`   Stats: ${stats}`)

    for (const error of result.errors) {
      console.log(`   ❌ ${error}`)
    }
    for (const warning of result.warnings) {
      console.log(`   ⚠️  ${warning}`)
    }
    console.log()
  } else {
    console.log(`${status} ${file}: ${stats}`)
    for (const error of result.errors) {
      console.log(`   ❌ ${error}`)
    }
  }
}

main().catch(console.error)
