#!/usr/bin/env npx tsx
/**
 * Extract real SPIJ IDs from the web interface using agent-browser
 *
 * This script navigates through SPIJ categories and extracts actual SPIJ IDs
 * from the URLs when clicking on law links.
 *
 * Usage: npx tsx scripts/extract-spij-ids.ts
 */

import { execSync } from 'node:child_process'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = join(__dirname, '../data/spij-ids.json')
const AGENT_BROWSER = '/Users/shiara/Documents/personal-projects/agent-browser/bin/agent-browser-darwin-arm64'

interface SpijLawId {
  spijId: string
  identifier: string
  title: string
  category: string
}

function ab(cmd: string): string {
  try {
    return execSync(`${AGENT_BROWSER} ${cmd}`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000
    }).trim()
  } catch (error: any) {
    if (error.stdout) return error.stdout.toString().trim()
    throw error
  }
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function login(): Promise<void> {
  console.log('🔐 Logging into SPIJ...')
  ab('open "https://spij.minjus.gob.pe/"')
  await wait(3000)

  ab('fill @e3 "usuarioNoPago"')
  ab('fill @e4 "123456"')
  ab('click @e2')
  await wait(3000)
  console.log('✅ Logged in')
}

async function extractIdsFromCategory(categoryName: string): Promise<SpijLawId[]> {
  const laws: SpijLawId[] = []

  console.log(`\n📂 Processing: ${categoryName}`)

  // Get the page HTML to extract all law links with their hrefs
  const evalResult = ab(`eval "JSON.stringify(Array.from(document.querySelectorAll('a[href*=detallenorma]')).map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() })))"`)

  try {
    const links = JSON.parse(evalResult) as Array<{ href: string; text: string }>

    for (const link of links) {
      // Extract SPIJ ID from href like "#/detallenorma/H682716"
      const match = link.href.match(/detallenorma\/(H\d+)/)
      if (match) {
        const spijId = match[1]

        // Extract identifier from text like "LEY N° 27594" or "DECRETO LEGISLATIVO N° 1291"
        const idMatch = link.text.match(/(LEY|DECRETO\s+LEGISLATIVO|DECRETO\s+SUPREMO|DECRETO\s+DE\s+URGENCIA|RESOLUC[IÓO]N)[^°º]*N[°º]\s*([\d\-]+)/i)

        let identifier = ''
        if (idMatch) {
          const type = idMatch[1].toLowerCase()
            .replace(/\s+/g, '-')
            .replace('decreto-legislativo', 'dleg')
            .replace('decreto-supremo', 'ds')
            .replace('decreto-de-urgencia', 'du')
            .replace(/resoluc[ió]n/i, 'res')
          identifier = `${type}-${idMatch[2]}`
        }

        laws.push({
          spijId,
          identifier,
          title: link.text,
          category: categoryName
        })
      }
    }

    console.log(`   Found ${laws.length} laws with SPIJ IDs`)
  } catch (e) {
    console.log(`   Error parsing links: ${e}`)
  }

  return laws
}

async function main() {
  console.log('🇵🇪 SPIJ ID Extractor')
  console.log('═'.repeat(50))

  const allLaws: SpijLawId[] = []

  try {
    await login()

    // Click on LEGISLACIÓN POR MATERIA
    ab('click @e9')
    await wait(2000)

    // Get snapshot to find categories
    const snapshot = ab('snapshot -i')
    const lines = snapshot.split('\n')

    // Extract category refs and names
    const categories: Array<{ ref: string; name: string }> = []
    for (const line of lines) {
      const match = line.match(/link "([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s,\-]+)" \[ref=(\w+)\]/)
      if (match) {
        const name = match[1]
        const ref = match[2]
        // Filter to only category names (exclude law identifiers)
        if (!name.match(/^(LEY|DECRETO|RESOLUC|ACUERDO|ORDENANZA)/i)) {
          categories.push({ ref, name })
        }
      }
    }

    console.log(`\n📋 Found ${categories.length} categories`)

    // Process a subset of important categories
    const priorityCategories = [
      'ANTICORRUPCIÓN',
      'LABORAL Y SEGURIDAD SOCIAL',
      'SALUD',
      'EDUCACIÓN',
      'MEDIO AMBIENTE',
      'PENAL',
      'CONSTITUCIONAL',
      'TRIBUTACIÓN',
      'PROCEDIMIENTO ADMINISTRATIVO',
      'CONTRATACIONES Y ADQUISICIONES DEL ESTADO'
    ]

    for (const cat of categories) {
      if (priorityCategories.some(p => cat.name.includes(p))) {
        try {
          // Click on category
          ab(`click @${cat.ref}`)
          await wait(2000)

          // Extract IDs from this category
          const laws = await extractIdsFromCategory(cat.name)
          allLaws.push(...laws)

          // Go back to category list
          const backSnapshot = ab('snapshot -i')
          const backMatch = backSnapshot.match(/button "[^"]*Volver[^"]*" \[ref=(\w+)\]/)
          if (backMatch) {
            ab(`click @${backMatch[1]}`)
            await wait(2000)
          }
        } catch (error) {
          console.log(`   Error: ${error}`)
        }
      }
    }

    // Save results
    await mkdir(dirname(OUTPUT_FILE), { recursive: true })

    const data = {
      extractedAt: new Date().toISOString(),
      totalLaws: allLaws.length,
      laws: allLaws
    }

    await writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2))

    console.log('\n' + '═'.repeat(50))
    console.log(`✅ Extracted ${allLaws.length} SPIJ IDs`)
    console.log(`📁 Saved to ${OUTPUT_FILE}`)

    // Print sample for verification
    console.log('\n📋 Sample laws:')
    for (const law of allLaws.slice(0, 10)) {
      console.log(`   ${law.spijId}: ${law.identifier || 'N/A'} - ${law.title.substring(0, 60)}...`)
    }

  } finally {
    try {
      ab('close')
    } catch (e) {
      // Ignore
    }
  }
}

main().catch(console.error)
