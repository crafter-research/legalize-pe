#!/usr/bin/env tsx
/**
 * Scrape MVP Laws from SPIJ
 *
 * This script fetches the 10 fundamental laws defined in the MVP
 * and converts them to Markdown files.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchLaw, MVP_LAWS, type SpijLaw } from './spij-api'
import {
  convertHtmlToMarkdown,
  extractTitle,
  determineRango,
  generateFrontmatter,
  type LawMetadata,
} from './html-to-markdown'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../../../leyes/pe')

interface ScrapeResult {
  identifier: string
  success: boolean
  error?: string
  filePath?: string
}

async function scrapeLaw(
  identifier: string,
  spijId: string,
): Promise<ScrapeResult> {
  console.log(`📜 Scraping ${identifier} (SPIJ ID: ${spijId})...`)

  try {
    // Fetch law from SPIJ API
    const law = await fetchLaw(spijId)

    // Extract metadata
    const titulo = extractTitle(law.sumilla, law.codigoNorma)
    const rango = determineRango(law.dispositivoLegal, law.codigoNorma)

    const metadata: LawMetadata = {
      titulo,
      identificador: identifier,
      pais: 'pe',
      jurisdiccion: 'pe',
      rango,
      sector: law.sector.toLowerCase().replace(/\s+/g, '-'),
      fechaPublicacion: law.fechaPublicacion,
      ultimaActualizacion: new Date().toISOString().split('T')[0],
      estado: 'vigente',
      fuente: `https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${spijId}`,
      diarioOficial: 'El Peruano',
    }

    // Convert HTML to Markdown
    const content = convertHtmlToMarkdown(law.textoCompleto)

    // Generate full markdown with frontmatter
    const frontmatter = generateFrontmatter(metadata)
    const markdown = `${frontmatter}\n\n# ${titulo}\n\n${content}`

    // Write to file
    const filePath = join(OUTPUT_DIR, `${identifier}.md`)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, markdown, 'utf-8')

    console.log(`   ✅ Saved to ${filePath}`)

    return {
      identifier,
      success: true,
      filePath,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`   ❌ Error: ${errorMessage}`)

    return {
      identifier,
      success: false,
      error: errorMessage,
    }
  }
}

async function main() {
  console.log('🇵🇪 Legalize PE - MVP Scraper')
  console.log('================================\n')
  console.log(`Output directory: ${OUTPUT_DIR}\n`)

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true })

  const results: ScrapeResult[] = []

  // Scrape each MVP law
  for (const [identifier, spijId] of Object.entries(MVP_LAWS)) {
    const result = await scrapeLaw(identifier, spijId)
    results.push(result)

    // Add a small delay between requests to be nice to the server
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Print summary
  console.log('\n================================')
  console.log('📊 Summary')
  console.log('================================\n')

  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  console.log(`✅ Successful: ${successful.length}`)
  console.log(`❌ Failed: ${failed.length}`)

  if (failed.length > 0) {
    console.log('\nFailed laws:')
    for (const result of failed) {
      console.log(`  - ${result.identifier}: ${result.error}`)
    }
  }

  console.log('\n🎉 Done!')

  // Exit with error code if any failures
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
