#!/usr/bin/env tsx
/**
 * Simple Scraper - Take screenshots and save basic metadata
 * The full content will be manually added later
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

function exec(cmd: string, maxBuffer = 1024 * 1024): string {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      timeout: 60000,
      maxBuffer,
    }).trim()
  } catch (error) {
    const err = error as { stderr?: string; message?: string }
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
    sleep(4000)

    // Take screenshot
    const screenshotPath = join(SCREENSHOTS_DIR, `${law.id}.png`)
    exec(`agent-browser screenshot --full "${screenshotPath}"`)
    console.log(`   📸 Screenshot saved`)

    // Get a small sample of text for verification
    const sampleText = exec(
      'agent-browser eval "document.body.innerText.substring(0, 2000)"',
    )

    // Generate markdown file with placeholder content
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

    // Create a placeholder file
    const content = `# ${law.name}

> Este archivo fue generado automáticamente. El contenido completo se extraerá posteriormente.

## Fuente

- SPIJ ID: ${law.spijId}
- URL: ${url}
- Screenshot: .screenshots/${law.id}.png

## Vista previa

\`\`\`
${sampleText.substring(0, 1000)}...
\`\`\`
`

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

async function main() {
  console.log('🇵🇪 Legalize PE - Simple Scraper')
  console.log('================================\n')

  // Ensure output directories exist
  await mkdir(OUTPUT_DIR, { recursive: true })
  await mkdir(SCREENSHOTS_DIR, { recursive: true })

  // First, access SPIJ in free mode
  console.log('🌐 Accessing SPIJ...')
  exec('agent-browser open "https://spij.minjus.gob.pe/spij-ext-web/#/inicio"')
  sleep(2000)

  // Take snapshot and click free access
  exec('agent-browser snapshot -i')
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
    sleep(1000)
  }

  // Close browser
  exec('agent-browser close')

  // Summary
  console.log('\n================================')
  console.log('📊 Summary')
  console.log('================================')
  console.log(`✅ Successful: ${successful}`)
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
