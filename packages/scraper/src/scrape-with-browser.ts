#!/usr/bin/env tsx
/**
 * Scrape MVP Laws from SPIJ using agent-browser
 *
 * This script uses agent-browser to navigate SPIJ and extract laws,
 * then saves them as Markdown files.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import {
  convertHtmlToMarkdown,
  extractTitle,
  determineRango,
  generateFrontmatter,
  type LawMetadata,
} from './html-to-markdown'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../../../leyes/pe')

interface LawConfig {
  identifier: string
  name: string
  ref?: string // Ref from snapshot
}

// Laws visible on the SPIJ homepage
const HOMEPAGE_LAWS: LawConfig[] = [
  { identifier: 'constitucion-1993', name: 'CONSTITUCION POLITICA' },
  { identifier: 'dleg-295', name: 'CODIGO CIVIL' },
  { identifier: 'dleg-635', name: 'CODIGO PENAL' },
  { identifier: 'dleg-957', name: 'NUEVO CODIGO PROCESAL PENAL' },
]

function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 60000 }).trim()
  } catch (error) {
    const err = error as { stderr?: string; message?: string }
    throw new Error(err.stderr || err.message || 'Command failed')
  }
}

function execJson(cmd: string): unknown {
  const result = exec(`${cmd} --json`)
  return JSON.parse(result)
}

interface NetworkRequestData {
  responseBody?: string
  url?: string
}

interface NetworkRequestResult {
  success: boolean
  data?: NetworkRequestData
}

async function scrapeLawFromPage(
  identifier: string,
): Promise<{ html: string; metadata: Partial<LawMetadata> }> {
  // Get current URL to extract SPIJ ID
  const url = exec('agent-browser get url')
  const spijId = url.split('/').pop() || ''

  // Get page content via network request or eval
  const html = exec(
    'agent-browser eval "document.querySelector(\'body\').innerHTML"',
  )

  // Get metadata from page
  const dateText = exec(
    'agent-browser eval "document.body.innerText.match(/Fecha de Publicación:\\s*([^\\n]+)/)?.[1] || \'\'"',
  )
  const sectorText = exec(
    'agent-browser eval "document.body.innerText.match(/Sector:\\s*([^\\n]+)/)?.[1] || \'\'"',
  )

  // Parse date (format: "25 de julio de 1984")
  const parsedDate = parseDateSpanish(dateText)

  return {
    html,
    metadata: {
      identificador: identifier,
      fechaPublicacion: parsedDate,
      sector: sectorText.toLowerCase().replace(/\s+/g, '-'),
      fuente: url,
    },
  }
}

function parseDateSpanish(dateStr: string): string {
  const months: Record<string, string> = {
    enero: '01',
    febrero: '02',
    marzo: '03',
    abril: '04',
    mayo: '05',
    junio: '06',
    julio: '07',
    agosto: '08',
    septiembre: '09',
    octubre: '10',
    noviembre: '11',
    diciembre: '12',
  }

  const match = dateStr.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/)
  if (!match) return ''

  const [, day, monthName, year] = match
  const month = months[monthName?.toLowerCase() || ''] || '01'

  return `${year}-${month}-${day?.padStart(2, '0')}`
}

async function main() {
  console.log('🇵🇪 Legalize PE - Browser Scraper')
  console.log('================================\n')

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true })

  // Open SPIJ and click free access
  console.log('🌐 Opening SPIJ...')
  exec('agent-browser open "https://spij.minjus.gob.pe/spij-ext-web/#/inicio"')
  exec('sleep 2')

  // Click "INGRESAR" for free access
  console.log('🔓 Accessing free mode...')
  let snapshot = exec('agent-browser snapshot -i -c')
  console.log('Snapshot:', snapshot.substring(0, 500))

  // Find and click the INGRESAR button (first one for free access)
  exec('agent-browser click @e1')
  exec('sleep 2')

  // Now we should be on the homepage with laws listed
  snapshot = exec('agent-browser snapshot -i -c')
  console.log('\nHomepage snapshot:', snapshot.substring(0, 1000))

  // Scrape each law from the homepage
  const results: Array<{ identifier: string; success: boolean; error?: string }> = []

  for (const law of HOMEPAGE_LAWS) {
    console.log(`\n📜 Scraping ${law.identifier}...`)

    try {
      // Find and click the law link
      // The laws are listed as headings with links before them
      const searchCmd = `agent-browser find text "${law.name}" click`
      exec(searchCmd)
      exec('sleep 3')

      // Scrape the page
      const { html, metadata } = await scrapeLawFromPage(law.identifier)

      // Get the title from the page
      const titleText = exec(
        'agent-browser eval "document.body.innerText.match(/^([A-Z][A-Z\\\\s]+)$/m)?.[1] || \'\'"',
      )

      // Determine rango from identifier
      const rango = law.identifier.startsWith('constitucion')
        ? 'constitucion'
        : law.identifier.startsWith('dleg')
          ? 'decreto-legislativo'
          : law.identifier.startsWith('ley')
            ? 'ley'
            : 'ley'

      const fullMetadata: LawMetadata = {
        titulo: titleText || law.name,
        identificador: law.identifier,
        pais: 'pe',
        jurisdiccion: 'pe',
        rango,
        sector: metadata.sector,
        fechaPublicacion: metadata.fechaPublicacion || '',
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        estado: 'vigente',
        fuente: metadata.fuente || '',
        diarioOficial: 'El Peruano',
      }

      // Convert to markdown
      const content = convertHtmlToMarkdown(html)
      const frontmatter = generateFrontmatter(fullMetadata)
      const markdown = `${frontmatter}\n\n# ${fullMetadata.titulo}\n\n${content}`

      // Save file
      const filePath = join(OUTPUT_DIR, `${law.identifier}.md`)
      await writeFile(filePath, markdown, 'utf-8')

      console.log(`   ✅ Saved to ${filePath}`)
      results.push({ identifier: law.identifier, success: true })

      // Go back to homepage
      exec('agent-browser back')
      exec('sleep 1')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`   ❌ Error: ${errorMsg}`)
      results.push({ identifier: law.identifier, success: false, error: errorMsg })

      // Try to recover by going to homepage
      try {
        exec(
          'agent-browser open "https://spij.minjus.gob.pe/spij-ext-web/#/inicio"',
        )
        exec('sleep 1')
        exec('agent-browser click @e1')
        exec('sleep 1')
      } catch {
        // Ignore recovery errors
      }
    }
  }

  // Close browser
  exec('agent-browser close')

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
}

main().catch((error) => {
  console.error('Fatal error:', error)
  try {
    execSync('agent-browser close', { encoding: 'utf-8' })
  } catch {
    // Ignore
  }
  process.exit(1)
})
