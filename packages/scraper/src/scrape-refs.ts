#!/usr/bin/env tsx
/**
 * Ref-based Scraper - Navigate SPIJ using agent-browser refs
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../../../leyes/pe')
const SCREENSHOTS_DIR = join(OUTPUT_DIR, '.screenshots')

const LAWS = [
  {
    id: 'constitucion-1993',
    name: 'Constitución Política del Perú',
    rango: 'constitucion',
    fechaPublicacion: '1993-12-29',
  },
  {
    id: 'dleg-295',
    name: 'Código Civil',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1984-07-25',
  },
  {
    id: 'dleg-635',
    name: 'Código Penal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-04-08',
  },
  {
    id: 'dleg-957',
    name: 'Nuevo Código Procesal Penal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2004-07-29',
  },
  {
    id: 'dleg-768',
    name: 'TUO Código Procesal Civil',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1993-04-23',
  },
  {
    id: 'ley-29571',
    name: 'Código de Protección y Defensa del Consumidor',
    rango: 'ley',
    fechaPublicacion: '2010-09-02',
  },
]

// Mapping of law id to text pattern in sidebar
const LAW_PATTERNS: Record<string, string> = {
  'constitucion-1993': 'CONSTITUCION POLITICA',
  'dleg-295': 'CODIGO CIVIL',
  'dleg-635': 'CODIGO PENAL',
  'dleg-957': 'NUEVO CODIGO PROCESAL PENAL',
  'dleg-768': 'CODIGO PROCESAL CIVIL',
  'ley-29571': 'PROTECCION Y DEFENSA',
}

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

async function scrapeLaw(law: (typeof LAWS)[0], index: number): Promise<boolean> {
  console.log(`\n📜 [${index + 1}/${LAWS.length}] ${law.name}`)
  console.log('   ─────────────────────────────────────')

  try {
    // Fresh start: open SPIJ homepage
    console.log('   🌐 Opening SPIJ homepage...')
    exec('agent-browser open "https://spij.minjus.gob.pe/spij-ext-web/#/inicio"')
    sleep(3000)

    // Click free access
    exec('agent-browser snapshot -i')
    exec('agent-browser click @e1')
    console.log('   🔓 Clicked free access')
    sleep(3000)

    // Take snapshot and find the law link
    console.log('   🔍 Looking for law link...')
    const snapshot = exec('agent-browser snapshot -i')

    const pattern = LAW_PATTERNS[law.id]!
    const lines = snapshot.split('\n')
    let targetRef = ''

    // Find the ref for our law
    for (const line of lines) {
      if (line.includes(pattern)) {
        const refMatch = line.match(/\[ref=(e\d+)\]/)
        if (refMatch) {
          targetRef = refMatch[1]!
          console.log(`   ✓ Found ref: @${targetRef}`)
          break
        }
      }
    }

    if (!targetRef) {
      // Try using text-based click
      console.log('   ⚠️ No ref found, trying text click...')
      exec(`agent-browser eval "document.evaluate(\\"//h5[contains(text(), '${pattern}')]\\", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.click()"`)
    } else {
      exec(`agent-browser click @${targetRef}`)
    }

    console.log('   ⏳ Waiting for content to load...')
    sleep(5000)

    // Take a snapshot to verify we're on the right page
    const detailSnapshot = exec('agent-browser snapshot -i')
    const heading = detailSnapshot.match(/heading "([^"]+)" \[level=1/)?.[1] || 'Unknown'
    console.log(`   📄 Page: ${heading.substring(0, 60)}...`)

    // Take screenshot
    const screenshotPath = join(SCREENSHOTS_DIR, `${law.id}.png`)
    exec(`agent-browser screenshot --full "${screenshotPath}"`)
    console.log('   📸 Screenshot saved')

    // Extract content
    const lawContent = exec(
      'agent-browser eval "document.querySelector(\'mat-sidenav-content\')?.innerText || document.querySelector(\'[class*=contenido]\')?.innerText || document.body.innerText"',
    )

    // Get URL
    const currentUrl = exec('agent-browser get url')

    // Clean and validate content
    const cleanContent = lawContent
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Check if we got the correct content
    const contentMatch = heading.toLowerCase().includes(pattern.toLowerCase().split(' ')[0]!)

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

${cleanContent || '> Contenido pendiente de extracción manual.'}
`

    const markdown = `${frontmatter}\n\n${content}`
    const filePath = join(OUTPUT_DIR, `${law.id}.md`)
    await writeFile(filePath, markdown, 'utf-8')

    console.log(`   ✅ Saved (${cleanContent.length} chars)`)
    console.log(`   ${contentMatch ? '✓ Content verified' : '⚠️ Content might not match'}`)

    // Close browser to reset state
    exec('agent-browser close')
    sleep(1000)

    return cleanContent.length > 1000 && contentMatch
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`   ❌ Error: ${errorMsg.substring(0, 200)}`)
    try {
      exec('agent-browser close')
    } catch {
      // Ignore
    }
    return false
  }
}

async function main() {
  console.log('🇵🇪 Legalize PE - Ref-based Scraper')
  console.log('═══════════════════════════════════════\n')

  // Ensure output directories exist
  await mkdir(OUTPUT_DIR, { recursive: true })
  await mkdir(SCREENSHOTS_DIR, { recursive: true })

  let successful = 0
  let partial = 0

  for (let i = 0; i < LAWS.length; i++) {
    const success = await scrapeLaw(LAWS[i]!, i)
    if (success) {
      successful++
    } else {
      partial++
    }
    sleep(2000)
  }

  // Summary
  console.log('\n═══════════════════════════════════════')
  console.log('📊 Summary')
  console.log('═══════════════════════════════════════')
  console.log(`✅ Full content: ${successful}`)
  console.log(`⚠️  Partial/Failed: ${partial}`)
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
