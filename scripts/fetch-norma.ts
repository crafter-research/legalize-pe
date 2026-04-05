#!/usr/bin/env npx tsx
/**
 * Universal law fetcher with source fallback
 *
 * Usage:
 *   npx tsx scripts/fetch-norma.ts <identificador> [--url <url>] [--dry-run]
 *   npx tsx scripts/fetch-norma.ts --pending [--limit N]
 *   npx tsx scripts/fetch-norma.ts --validate
 */

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { allSources, type FetchResult } from './lib/sources'
import type { NormaCatalog, NormaCatalogEntry, Frontmatter } from './lib/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../leyes/pe')
const CATALOG_PATH = join(__dirname, 'catalogo-normas.json')

// Parse command line arguments
function parseArgs(): {
  identificador?: string
  url?: string
  dryRun: boolean
  pending: boolean
  limit: number
  validate: boolean
} {
  const args = process.argv.slice(2)
  const result = {
    identificador: undefined as string | undefined,
    url: undefined as string | undefined,
    dryRun: false,
    pending: false,
    limit: 10,
    validate: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--url' && args[i + 1]) {
      result.url = args[++i]
    } else if (arg === '--dry-run') {
      result.dryRun = true
    } else if (arg === '--pending') {
      result.pending = true
    } else if (arg === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[++i], 10)
    } else if (arg === '--validate') {
      result.validate = true
    } else if (!arg.startsWith('--')) {
      result.identificador = arg
    }
  }

  return result
}

// Load catalog
async function loadCatalog(): Promise<NormaCatalog> {
  if (!existsSync(CATALOG_PATH)) {
    return {
      version: '1.0',
      actualizacion: new Date().toISOString().split('T')[0],
      normas: [],
    }
  }
  const content = await readFile(CATALOG_PATH, 'utf-8')
  return JSON.parse(content)
}

// Save catalog
async function saveCatalog(catalog: NormaCatalog): Promise<void> {
  catalog.actualizacion = new Date().toISOString().split('T')[0]
  await writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8')
}

// Generate frontmatter
function generateFrontmatter(entry: NormaCatalogEntry, source: string): string {
  const fm: Frontmatter = {
    titulo: entry.titulo,
    identificador: entry.identificador,
    pais: 'pe',
    jurisdiccion: 'pe',
    rango: entry.rango,
    fechaPublicacion: entry.fechaPublicacion,
    ultimaActualizacion: new Date().toISOString().split('T')[0],
    estado: 'vigente',
    fuente: source,
    fuenteAlternativa: 'https://spij.minjus.gob.pe/',
    diarioOficial: 'El Peruano',
    sumilla: entry.sumilla,
    materias: entry.materias,
    disclaimer: true,
  }

  const lines = ['---']
  for (const [key, value] of Object.entries(fm)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`)
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`)
    } else {
      lines.push(`${key}: "${String(value).replace(/"/g, '\\"')}"`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}

// Fetch a single law
async function fetchNorma(
  entry: NormaCatalogEntry,
  specificUrl?: string
): Promise<FetchResult | null> {
  console.log(`\n📜 ${entry.titulo}`)
  console.log(`   ID: ${entry.identificador}`)

  // Build URL list: specific URL first, then catalog URLs
  const urls = specificUrl ? [specificUrl, ...entry.fuentes] : entry.fuentes

  // Try each source
  for (const source of allSources) {
    // Try with each URL
    for (const url of urls) {
      console.log(`   Trying ${source.name}${url ? ` (${url.slice(0, 50)}...)` : ''}`)
      const result = await source.fetch(entry.identificador, url)
      if (result && result.content.length > 500) {
        console.log(`   ✅ ${source.name}: ${result.content.length} chars, ${result.garbled} garbled`)
        return result
      }
    }

    // Try without URL (for sources that can build their own)
    if (urls.length === 0) {
      console.log(`   Trying ${source.name} (auto-URL)`)
      const result = await source.fetch(entry.identificador)
      if (result && result.content.length > 500) {
        console.log(`   ✅ ${source.name}: ${result.content.length} chars, ${result.garbled} garbled`)
        return result
      }
    }
  }

  console.log(`   ❌ All sources failed`)
  return null
}

// Save law to markdown file
async function saveNorma(
  entry: NormaCatalogEntry,
  result: FetchResult
): Promise<string> {
  const frontmatter = generateFrontmatter(entry, result.source)
  const markdown = `${frontmatter}

# ${entry.titulo}

${result.content}
`

  const filePath = join(OUTPUT_DIR, `${entry.identificador}.md`)
  await writeFile(filePath, markdown, 'utf-8')
  return filePath
}

// Main
async function main() {
  const args = parseArgs()
  const catalog = await loadCatalog()

  console.log('🇵🇪 Legalize PE - Universal Law Fetcher')
  console.log('═'.repeat(50))

  if (args.pending) {
    // Fetch pending laws from catalog
    const pending = catalog.normas
      .filter(n => n.estado === 'pendiente')
      .slice(0, args.limit)

    console.log(`📋 ${pending.length} pending laws to fetch\n`)

    let success = 0
    let failed = 0

    for (const entry of pending) {
      const result = await fetchNorma(entry)
      if (result) {
        if (!args.dryRun) {
          const path = await saveNorma(entry, result)
          entry.estado = 'descargado'
          console.log(`   📝 Saved: ${path}`)
        }
        success++
      } else {
        entry.estado = 'error'
        failed++
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 1000))
    }

    if (!args.dryRun) {
      await saveCatalog(catalog)
    }

    console.log(`\n${'═'.repeat(50)}`)
    console.log(`✅ Success: ${success}`)
    console.log(`❌ Failed: ${failed}`)
  } else if (args.identificador) {
    // Fetch single law
    let entry = catalog.normas.find(n => n.identificador === args.identificador)

    if (!entry) {
      // Create temporary entry
      entry = {
        identificador: args.identificador,
        titulo: args.identificador.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        rango: inferRango(args.identificador),
        fechaPublicacion: 'unknown',
        estado: 'pendiente',
        fuentes: args.url ? [args.url] : [],
        materias: [],
      }
    }

    const result = await fetchNorma(entry, args.url)
    if (result) {
      if (!args.dryRun) {
        const path = await saveNorma(entry, result)
        console.log(`\n✅ Saved: ${path}`)
      } else {
        console.log(`\n✅ Would save: ${entry.identificador}.md (${result.content.length} chars)`)
      }
    } else {
      console.log(`\n❌ Failed to fetch ${args.identificador}`)
      process.exit(1)
    }
  } else {
    console.log(`
Usage:
  npx tsx scripts/fetch-norma.ts <identificador> [--url <url>] [--dry-run]
  npx tsx scripts/fetch-norma.ts --pending [--limit N]

Options:
  --url <url>    Specific URL to fetch from
  --dry-run      Don't save files, just test
  --pending      Fetch all pending laws from catalog
  --limit N      Limit number of pending laws to fetch (default: 10)

Examples:
  npx tsx scripts/fetch-norma.ts ley-27815
  npx tsx scripts/fetch-norma.ts ley-30424 --url https://lpderecho.pe/ley-30424/
  npx tsx scripts/fetch-norma.ts --pending --limit 5
`)
  }
}

// Infer rango from identifier
function inferRango(id: string): NormaCatalogEntry['rango'] {
  if (id.startsWith('constitucion')) return 'constitucion'
  if (id.startsWith('ley-')) return 'ley'
  if (id.startsWith('dleg-')) return 'decreto-legislativo'
  if (id.startsWith('dl-') || id.startsWith('dley-')) return 'decreto-ley'
  if (id.startsWith('ds-')) return 'decreto-supremo'
  if (id.startsWith('res-') || id.startsWith('rm-') || id.startsWith('ra-')) return 'resolucion'
  return 'otro'
}

main().catch(console.error)
