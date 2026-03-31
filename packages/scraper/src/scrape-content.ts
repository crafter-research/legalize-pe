#!/usr/bin/env tsx
/**
 * Content Scraper - Extract actual law content from SPIJ
 * Uses agent-browser with proper wait strategies for SPA content
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../../../leyes/pe')
const SCREENSHOTS_DIR = join(OUTPUT_DIR, '.screenshots')

// Correct SPIJ IDs from the homepage links
const LAWS = [
  {
    id: 'constitucion-1993',
    spijId: 'H682678',
    name: 'Constitución Política del Perú',
    rango: 'constitucion',
    fechaPublicacion: '1993-12-29',
  },
  {
    id: 'dleg-295',
    spijId: 'H682684',
    name: 'Código Civil',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1984-07-25',
  },
  {
    id: 'dleg-635',
    spijId: 'H682692',
    name: 'Código Penal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-04-08',
  },
  {
    id: 'dleg-957',
    spijId: 'H682695',
    name: 'Nuevo Código Procesal Penal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2004-07-29',
  },
  {
    id: 'dleg-768',
    spijId: 'H682685',
    name: 'TUO Código Procesal Civil',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1993-04-23',
  },
  {
    id: 'ley-29571',
    spijId: 'H682697',
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
    // If we have stdout, return it even if there was an error
    if (err.stdout) {
      return err.stdout.trim()
    }
    throw new Error(err.stderr || err.message || 'Command failed')
  }
}

function sleep(ms: number): void {
  execSync(`sleep ${ms / 1000}`)
}

async function scrapeLaw(law: (typeof LAWS)[0]): Promise<boolean> {
  console.log(`\n📜 Scraping ${law.id} (${law.name})...`)

  try {
    // Navigate to the law's page
    const url = `https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${law.spijId}`
    exec(`agent-browser open "${url}"`)
    console.log('   ⏳ Waiting for page load...')
    sleep(5000)

    // Wait for network idle
    exec('agent-browser wait --load networkidle')
    sleep(2000)

    // Take interactive snapshot to see what's available
    const snapshot = exec('agent-browser snapshot -i')
    console.log('   📋 Snapshot preview:', snapshot.substring(0, 300))

    // Take screenshot
    const screenshotPath = join(SCREENSHOTS_DIR, `${law.id}.png`)
    exec(`agent-browser screenshot --full "${screenshotPath}"`)
    console.log('   📸 Screenshot saved')

    // Try to get the law content from the main content area
    // SPIJ uses Angular, content is usually in a specific div
    const contentSelectors = [
      '.contenido-norma',
      '.detalle-norma',
      '[class*="contenido"]',
      '[class*="norma"]',
      'mat-sidenav-content',
      'main',
      '.mat-drawer-content',
    ]

    let lawContent = ''
    for (const selector of contentSelectors) {
      try {
        const content = exec(
          `agent-browser eval "document.querySelector('${selector}')?.innerText || ''"`,
        )
        if (content.length > 500 && !content.includes('BUSCADOR DE NORMAS')) {
          lawContent = content
          console.log(`   ✓ Found content with selector: ${selector}`)
          break
        }
      } catch {
        continue
      }
    }

    // If selectors didn't work, try getting body text and filtering
    if (!lawContent) {
      console.log('   ⚠ Selectors failed, trying body text extraction...')
      const bodyText = exec(
        'agent-browser eval "document.body.innerText"',
      )

      // Try to find where the actual law content starts
      const contentStart = bodyText.indexOf('CONSTITUCION') !== -1
        ? bodyText.indexOf('CONSTITUCION')
        : bodyText.indexOf('TITULO') !== -1
          ? bodyText.indexOf('TITULO')
          : bodyText.indexOf('Artículo') !== -1
            ? bodyText.indexOf('Artículo')
            : 0

      lawContent = bodyText.substring(contentStart, contentStart + 50000)
    }

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
fuente: "${url}"
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
  console.log('🇵🇪 Legalize PE - Content Scraper')
  console.log('================================\n')

  // Ensure output directories exist
  await mkdir(OUTPUT_DIR, { recursive: true })
  await mkdir(SCREENSHOTS_DIR, { recursive: true })

  // First, access SPIJ in free mode
  console.log('🌐 Accessing SPIJ...')
  exec('agent-browser open "https://spij.minjus.gob.pe/spij-ext-web/#/inicio"')
  sleep(3000)

  // Take snapshot and click free access
  exec('agent-browser snapshot -i')
  exec('agent-browser click @e1')
  console.log('🔓 Entered free access mode')
  sleep(3000)

  let successful = 0
  let partial = 0
  let failed = 0

  for (const law of LAWS) {
    const success = await scrapeLaw(law)
    if (success) {
      successful++
    } else {
      partial++
    }
    sleep(2000)
  }

  // Close browser
  exec('agent-browser close')

  // Summary
  console.log('\n================================')
  console.log('📊 Summary')
  console.log('================================')
  console.log(`✅ Full content: ${successful}`)
  console.log(`⚠️  Partial: ${partial}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`\n📁 Output: ${OUTPUT_DIR}`)
  console.log(`📸 Screenshots: ${SCREENSHOTS_DIR}`)
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
