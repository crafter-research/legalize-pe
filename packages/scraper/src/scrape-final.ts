#!/usr/bin/env tsx
/**
 * Final Scraper - Navigate SPIJ using known refs from interactive testing
 */

import { execSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../../../leyes/pe')
const SCREENSHOTS_DIR = join(OUTPUT_DIR, '.screenshots')

// Laws with their homepage refs (found via interactive testing)
// After clicking free access (@e1), these refs are consistent:
// Pattern: links are e11, e13, e15, e17, e19, e21, e23, e25...
const LAWS = [
  {
    id: 'constitucion-1993',
    ref: 'e11',
    name: 'Constitución Política del Perú',
    rango: 'constitucion',
    fechaPublicacion: '1993-12-29',
  },
  {
    id: 'dleg-295',
    ref: 'e17',
    name: 'Código Civil',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1984-07-25',
  },
  {
    id: 'dleg-768',
    ref: 'e19',
    name: 'TUO Código Procesal Civil',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1993-04-23',
  },
  {
    id: 'dleg-635',
    ref: 'e21',
    name: 'Código Penal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-04-08',
  },
  {
    id: 'dleg-957',
    ref: 'e25',
    name: 'Nuevo Código Procesal Penal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2004-07-29',
  },
  {
    id: 'ley-29571',
    ref: 'e39',
    name: 'Código de Protección y Defensa del Consumidor',
    rango: 'ley',
    fechaPublicacion: '2010-09-02',
  },
]

function exec(cmd: string, maxBuffer = 50 * 1024 * 1024): string {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      timeout: 180000,
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

async function scrapeLaw(
  law: (typeof LAWS)[0],
  index: number,
): Promise<boolean> {
  console.log(`\n📜 [${index + 1}/${LAWS.length}] ${law.name}`)
  console.log('   ─────────────────────────────────────')

  try {
    // Click the law link
    console.log(`   🔗 Clicking @${law.ref}...`)
    exec(`agent-browser click @${law.ref}`)
    console.log('   ⏳ Loading content...')
    sleep(5000)

    // Take snapshot to verify we're on the right page
    const snapshot = exec('agent-browser snapshot -i')
    const headingMatch = snapshot.match(/heading "([^"]+)" \[level=1/)
    const heading = headingMatch ? headingMatch[1] : 'Unknown'
    console.log(`   📄 Page: ${heading?.substring(0, 50)}...`)

    // Take screenshot
    const screenshotPath = join(SCREENSHOTS_DIR, `${law.id}.png`)
    exec(`agent-browser screenshot --full "${screenshotPath}"`)
    console.log('   📸 Screenshot saved')

    // Get URL
    const currentUrl = exec('agent-browser get url')

    // Extract content
    const lawContent = exec(
      'agent-browser eval "document.querySelector(\'mat-sidenav-content\')?.innerText || document.body.innerText"',
    )

    // Clean content
    const cleanContent = lawContent
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^Calendarios.*Usuario Libre\n*/m, '') // Remove header
      .trim()

    // Generate markdown
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

${cleanContent}
`

    const markdown = `${frontmatter}\n\n${content}`
    const filePath = join(OUTPUT_DIR, `${law.id}.md`)
    await writeFile(filePath, markdown, 'utf-8')

    const contentLength = cleanContent.length
    console.log(`   ✅ Saved (${contentLength} chars)`)

    // Go back to homepage
    console.log('   🔙 Going back...')
    exec('agent-browser click @e6') // "Volver" button
    sleep(3000)

    // Take snapshot to confirm we're back
    exec('agent-browser snapshot -i')

    return contentLength > 10000
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`   ❌ Error: ${errorMsg.substring(0, 200)}`)
    // Try to recover by navigating back
    try {
      exec('agent-browser click @e6')
      sleep(2000)
    } catch {
      // Ignore
    }
    return false
  }
}

async function main() {
  console.log('🇵🇪 Legalize PE - Final Scraper')
  console.log('═══════════════════════════════════════\n')

  // Ensure output directories exist
  await mkdir(OUTPUT_DIR, { recursive: true })
  await mkdir(SCREENSHOTS_DIR, { recursive: true })

  // Open SPIJ and access free mode
  console.log('🌐 Opening SPIJ...')
  exec('agent-browser open "https://spij.minjus.gob.pe/spij-ext-web/#/inicio"')
  sleep(3000)

  console.log('🔓 Clicking free access...')
  exec('agent-browser snapshot -i')
  exec('agent-browser click @e1')
  sleep(3000)

  // Take snapshot to verify we're on the homepage with laws
  const homeSnapshot = exec('agent-browser snapshot -i')
  console.log(
    '✓ On homepage. Laws visible:',
    homeSnapshot.includes('CONSTITUCION'),
  )

  let successful = 0
  let failed = 0

  for (let i = 0; i < LAWS.length; i++) {
    const law = LAWS[i]
    if (!law) continue
    const success = await scrapeLaw(law, i)
    if (success) {
      successful++
    } else {
      failed++
    }
  }

  // Close browser
  exec('agent-browser close')

  // Summary
  console.log('\n═══════════════════════════════════════')
  console.log('📊 Summary')
  console.log('═══════════════════════════════════════')
  console.log(`✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`\n📁 Output: ${OUTPUT_DIR}`)
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
