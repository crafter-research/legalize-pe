#!/usr/bin/env tsx
/**
 * Click-based Scraper - Navigate SPIJ by clicking sidebar links
 * This handles Angular SPA routing properly
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../../../leyes/pe')
const SCREENSHOTS_DIR = join(OUTPUT_DIR, '.screenshots')

// Laws with their link text on the SPIJ homepage sidebar
const LAWS = [
  {
    id: 'constitucion-1993',
    linkText: 'CONSTITUCION POLITICA',
    name: 'Constitución Política del Perú',
    rango: 'constitucion',
    fechaPublicacion: '1993-12-29',
  },
  {
    id: 'dleg-295',
    linkText: 'CODIGO CIVIL',
    name: 'Código Civil',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1984-07-25',
  },
  {
    id: 'dleg-635',
    linkText: 'CODIGO PENAL',
    name: 'Código Penal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-04-08',
  },
  {
    id: 'dleg-957',
    linkText: 'NUEVO CODIGO PROCESAL PENAL',
    name: 'Nuevo Código Procesal Penal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2004-07-29',
  },
  {
    id: 'dleg-768',
    linkText: 'TUO) CODIGO PROCESAL CIVIL',
    name: 'TUO Código Procesal Civil',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1993-04-23',
  },
  {
    id: 'ley-29571',
    linkText: 'CODIGO DE PROTECCION Y DEFENSA DEL CONSUMIDOR',
    name: 'Código de Protección y Defensa del Consumidor',
    rango: 'ley',
    fechaPublicacion: '2010-09-02',
  },
]

function exec(cmd: string, maxBuffer = 50 * 1024 * 1024): string {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      timeout: 120000,
      maxBuffer,
    }).trim()
  } catch (error) {
    const err = error as { stderr?: string; message?: string; stdout?: string }
    if (err.stdout) {
      return err.stdout.trim()
    }
    throw new Error(err.stderr || err.message || 'Command failed')
  }
}

function sleep(ms: number): void {
  execSync(`sleep ${ms / 1000}`)
}

function goToHomepage(): void {
  exec('agent-browser open "https://spij.minjus.gob.pe/spij-ext-web/#/inicio"')
  sleep(3000)
  exec('agent-browser snapshot -i')
  exec('agent-browser click @e1') // Click free access
  sleep(3000)
}

async function scrapeLaw(law: (typeof LAWS)[0], index: number): Promise<boolean> {
  console.log(`\n📜 [${index + 1}/${LAWS.length}] Scraping ${law.id} (${law.name})...`)

  try {
    // If not first law, go back to homepage
    if (index > 0) {
      console.log('   🏠 Going back to homepage...')
      goToHomepage()
    }

    // Take snapshot to see current page
    const snapshot = exec('agent-browser snapshot -i')
    console.log('   📋 Looking for link:', law.linkText)

    // Find the link by text content
    const findCmd = `agent-browser eval "Array.from(document.querySelectorAll('a, [role=link], h5, .mat-card')).find(el => el.textContent?.includes('${law.linkText}'))?.click() || 'NOT_FOUND'"`
    const clickResult = exec(findCmd)

    if (clickResult === 'NOT_FOUND') {
      // Try alternative: look for the heading and click
      console.log('   ⚠️ Direct click failed, trying heading approach...')
      exec(`agent-browser eval "document.querySelector('h5:contains(${law.linkText})')?.parentElement?.click()"`)
    }

    console.log('   ⏳ Waiting for content to load...')
    sleep(5000)
    exec('agent-browser wait --load networkidle')
    sleep(2000)

    // Verify we're on the right page by checking heading
    const currentHeading = exec(
      'agent-browser eval "document.querySelector(\'h1\')?.textContent || \'\'"',
    )
    console.log('   📄 Current page heading:', currentHeading.substring(0, 80))

    // Take screenshot
    const screenshotPath = join(SCREENSHOTS_DIR, `${law.id}.png`)
    exec(`agent-browser screenshot --full "${screenshotPath}"`)
    console.log('   📸 Screenshot saved')

    // Get the law content
    const lawContent = exec(
      'agent-browser eval "document.querySelector(\'[class*=contenido]\')?.innerText || document.querySelector(\'mat-sidenav-content\')?.innerText || \'\'"',
    )

    // Get current URL for fuente
    const currentUrl = exec('agent-browser get url')

    // Clean up content
    const cleanContent = lawContent
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Generate markdown file
    const frontmatter = `---
titulo: "${law.name}"
identificador: "${law.id}"
pais: "pe"
jurisdiccion: "pe"
rango: "${law.rango}"
fechaPublicacion: "${law.fechaPublicacion}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${currentUrl}"
diarioOficial: "El Peruano"
---`

    const content = `# ${law.name}

${cleanContent || '> Contenido pendiente de extracción manual.'}
`

    const markdown = `${frontmatter}\n\n${content}`
    const filePath = join(OUTPUT_DIR, `${law.id}.md`)
    await writeFile(filePath, markdown, 'utf-8')

    const contentLength = cleanContent.length
    console.log(`   ✅ Saved (${contentLength} chars) to ${filePath}`)
    return contentLength > 1000
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`   ❌ Error: ${errorMsg.substring(0, 200)}`)
    return false
  }
}

async function main() {
  console.log('🇵🇪 Legalize PE - Click-based Scraper')
  console.log('=====================================\n')

  // Ensure output directories exist
  await mkdir(OUTPUT_DIR, { recursive: true })
  await mkdir(SCREENSHOTS_DIR, { recursive: true })

  // Access SPIJ in free mode
  console.log('🌐 Accessing SPIJ...')
  goToHomepage()
  console.log('🔓 Entered free access mode')

  let successful = 0
  let partial = 0

  for (let i = 0; i < LAWS.length; i++) {
    const success = await scrapeLaw(LAWS[i]!, i)
    if (success) {
      successful++
    } else {
      partial++
    }
  }

  // Close browser
  exec('agent-browser close')

  // Summary
  console.log('\n=====================================')
  console.log('📊 Summary')
  console.log('=====================================')
  console.log(`✅ Full content: ${successful}`)
  console.log(`⚠️  Partial: ${partial}`)
  console.log(`\n📁 Output: ${OUTPUT_DIR}`)
  console.log(`📸 Screenshots: ${SCREENSHOTS_DIR}`)
  console.log('\n🎉 Done!')

  process.exit(0)
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
