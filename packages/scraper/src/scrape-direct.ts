#!/usr/bin/env tsx
/**
 * Direct Scraper - Navigate directly to each law's page
 */

import { execSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../../../leyes/pe')

// Correct SPIJ IDs from the homepage links
const LAWS = [
  {
    id: 'constitucion-1993',
    spijId: 'H682678',
    name: 'Constitución Política del Perú',
    rango: 'constitucion',
  },
  {
    id: 'dleg-295',
    spijId: 'H682684',
    name: 'Código Civil',
    rango: 'decreto-legislativo',
  },
  {
    id: 'dleg-635',
    spijId: 'H682692',
    name: 'Código Penal',
    rango: 'decreto-legislativo',
  },
  {
    id: 'dleg-957',
    spijId: 'H682695',
    name: 'Nuevo Código Procesal Penal',
    rango: 'decreto-legislativo',
  },
  {
    id: 'dleg-768',
    spijId: 'H682685',
    name: 'TUO Código Procesal Civil',
    rango: 'decreto-legislativo',
  },
  {
    id: 'ley-29571',
    spijId: 'H682697',
    name: 'Código de Protección y Defensa del Consumidor',
    rango: 'ley',
  },
]

function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 60000 }).trim()
  } catch (error) {
    const err = error as { stderr?: string; message?: string }
    throw new Error(err.stderr || err.message || 'Command failed')
  }
}

function sleep(ms: number): void {
  execSync(`sleep ${ms / 1000}`)
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

async function scrapeLaw(law: (typeof LAWS)[0]): Promise<boolean> {
  console.log(`\n📜 Scraping ${law.id} (${law.name})...`)

  try {
    // Navigate to the law's page
    const url = `https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${law.spijId}`
    exec(`agent-browser open "${url}"`)
    sleep(3000)

    // Wait for content to load
    exec('agent-browser wait --load networkidle')
    sleep(1000)

    // Get the page content
    const bodyHtml = exec(
      'agent-browser eval "document.querySelector(\'.contenido-norma, .contenido, main, article, body\')?.innerHTML || document.body.innerHTML"',
    )

    // Get metadata from page
    const pageText = exec('agent-browser eval "document.body.innerText"')

    // Extract date
    const dateMatch = pageText.match(
      /Fecha de Publicación:\s*(\d+\s+de\s+\w+\s+de\s+\d{4})/,
    )
    const fechaPublicacion = dateMatch
      ? parseDateSpanish(dateMatch[1] || '')
      : ''

    // Extract sector
    const sectorMatch = pageText.match(/Sector:\s*([^\n]+)/)
    const sector = sectorMatch
      ? sectorMatch[1]?.trim().toLowerCase().replace(/\s+/g, '-')
      : ''

    // Generate frontmatter
    const frontmatter = `---
titulo: "${law.name}"
identificador: "${law.id}"
pais: "pe"
jurisdiccion: "pe"
rango: "${law.rango}"
sector: "${sector}"
fechaPublicacion: "${fechaPublicacion}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${url}"
diarioOficial: "El Peruano"
---`

    // Convert HTML to simple markdown (basic conversion)
    const content = convertToMarkdown(bodyHtml, law.name)

    // Combine and save
    const markdown = `${frontmatter}\n\n${content}`
    const filePath = join(OUTPUT_DIR, `${law.id}.md`)
    await writeFile(filePath, markdown, 'utf-8')

    console.log(`   ✅ Saved to ${filePath}`)
    return true
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`   ❌ Error: ${errorMsg}`)
    return false
  }
}

function convertToMarkdown(html: string, title: string): string {
  // Basic HTML to Markdown conversion
  const md = `# ${title}\n\n`

  // Remove scripts and styles
  let content = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')

  // Convert headers
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n')
  content = content.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n')

  // Convert paragraphs
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')

  // Convert bold and italic
  content = content.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
  content = content.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')

  // Convert line breaks
  content = content.replace(/<br\s*\/?>/gi, '\n')

  // Convert links
  content = content.replace(
    /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    '[$2]($1)',
  )

  // Remove remaining HTML tags
  content = content.replace(/<[^>]+>/g, '')

  // Decode HTML entities
  content = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code)),
    )

  // Clean up whitespace
  content = content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()

  return `${md + content}\n`
}

async function main() {
  console.log('🇵🇪 Legalize PE - Direct Scraper')
  console.log('================================\n')

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true })

  // First, access SPIJ in free mode
  console.log('🌐 Accessing SPIJ...')
  exec('agent-browser open "https://spij.minjus.gob.pe/spij-ext-web/#/inicio"')
  sleep(2000)

  // Take snapshot to get refs
  exec('agent-browser snapshot -i')

  // Click free access button (INGRESAR)
  exec('agent-browser click @e1')
  sleep(2000)

  let successful = 0
  let failed = 0

  for (const law of LAWS) {
    const success = await scrapeLaw(law)
    if (success) {
      successful++
    } else {
      failed++
    }
    sleep(500)
  }

  // Close browser
  exec('agent-browser close')

  // Summary
  console.log('\n================================')
  console.log('📊 Summary')
  console.log('================================')
  console.log(`✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('\n🎉 Done!')

  process.exit(failed > 0 ? 1 : 0)
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
