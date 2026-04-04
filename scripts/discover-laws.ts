#!/usr/bin/env npx tsx
/**
 * Discover laws from SPIJ using agent-browser
 *
 * This script navigates through SPIJ's "LEGISLACIÓN POR MATERIA" categories
 * and extracts all law identifiers (SPIJ IDs) for later fetching.
 *
 * Usage: npx tsx scripts/discover-laws.ts
 */

import { execSync } from 'node:child_process'
import { writeFile, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = join(__dirname, '../data/discovered-laws.json')
const AGENT_BROWSER = '/Users/shiara/Documents/personal-projects/agent-browser/bin/agent-browser-darwin-arm64'

interface DiscoveredLaw {
  spijId: string
  title: string
  identifier: string
  category: string
  url: string
}

function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }).trim()
  } catch (error) {
    console.error(`Command failed: ${cmd}`)
    throw error
  }
}

function ab(cmd: string): string {
  return exec(`${AGENT_BROWSER} ${cmd}`)
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

async function getCategories(): Promise<string[]> {
  console.log('📂 Getting legislation categories...')

  // Navigate to "LEGISLACIÓN POR MATERIA"
  const snapshot = ab('snapshot -i')

  // Find and click the legislation by topic button
  const lines = snapshot.split('\n')
  const categoryBtn = lines.find(l => l.includes('LEGISLACIÓN POR MATERIA'))
  if (!categoryBtn) {
    throw new Error('Could not find LEGISLACIÓN POR MATERIA button')
  }

  const refMatch = categoryBtn.match(/\[ref=(\w+)\]/)
  if (!refMatch) {
    throw new Error('Could not find ref for LEGISLACIÓN POR MATERIA')
  }

  ab(`click @${refMatch[1]}`)
  await wait(2000)

  // Get all category links
  const categorySnapshot = ab('snapshot -i')
  const categoryLines = categorySnapshot.split('\n')

  const categories: string[] = []
  for (const line of categoryLines) {
    // Match lines like: - link "ADOPCIÓN" [ref=e11]
    const match = line.match(/link "([^"]+)" \[ref=(\w+)\]/)
    if (match && !match[1].includes('DECRETO') && !match[1].includes('LEY') && !match[1].includes('RESOLUC')) {
      categories.push(match[2]) // Store ref
    }
  }

  console.log(`   Found ${categories.length} categories`)
  return categories
}

async function extractLawsFromCategory(categoryRef: string, categoryName: string): Promise<DiscoveredLaw[]> {
  console.log(`\n📜 Processing category: ${categoryName}`)

  ab(`click @${categoryRef}`)
  await wait(3000)

  // Get the page HTML to extract all law links
  const html = ab('eval "document.body.innerHTML"')

  // Extract all detallenorma links
  const laws: DiscoveredLaw[] = []
  const linkRegex = /href="#\/detallenorma\/(H\d+)"[^>]*>([^<]+)/g
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    const spijId = match[1]
    const title = match[2].trim()

    // Try to extract law identifier from title (LEY N° XXXXX, DECRETO LEGISLATIVO N° XXX, etc.)
    const identifierMatch = title.match(/(LEY|DECRETO\s+LEGISLATIVO|DECRETO\s+SUPREMO|DECRETO\s+DE\s+URGENCIA|RESOLUC[IÓO]N)[^°]*N[°º]\s*(\d+[-\d]*)/i)

    let identifier = ''
    if (identifierMatch) {
      const type = identifierMatch[1].toLowerCase()
        .replace('decreto legislativo', 'dleg')
        .replace('decreto supremo', 'ds')
        .replace('decreto de urgencia', 'du')
        .replace(/resoluc[ió]n/i, 'res')
        .replace('ley', 'ley')
      identifier = `${type}-${identifierMatch[2]}`
    }

    laws.push({
      spijId,
      title,
      identifier,
      category: categoryName,
      url: `https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${spijId}`
    })
  }

  console.log(`   Found ${laws.length} laws`)

  // Go back to category list
  ab('click @e6') // "Volver" button
  await wait(2000)

  return laws
}

async function main() {
  console.log('🇵🇪 SPIJ Law Discovery Script')
  console.log('═'.repeat(50))

  const allLaws: DiscoveredLaw[] = []

  try {
    await login()

    // Get first snapshot to find category button
    const snapshot = ab('snapshot -i')

    // Click on LEGISLACIÓN POR MATERIA
    ab('click @e9')
    await wait(2000)

    // Get category snapshot
    const categorySnapshot = ab('snapshot -i')
    console.log('\n📋 Available categories:')

    // Parse categories from snapshot
    const categoryLines = categorySnapshot.split('\n')
    const categories: Array<{ref: string, name: string}> = []

    for (const line of categoryLines) {
      const match = line.match(/link "([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s,\-]+)" \[ref=(\w+)\]/)
      if (match) {
        const name = match[1]
        const ref = match[2]
        // Filter out law identifiers, only keep category names
        if (!name.match(/^(LEY|DECRETO|RESOLUC|ACUERDO|ORDENANZA)/)) {
          categories.push({ ref, name })
        }
      }
    }

    console.log(`Found ${categories.length} categories to process`)

    // Process first 5 categories as a test
    const categoriesToProcess = categories.slice(0, 5)

    for (const cat of categoriesToProcess) {
      try {
        const laws = await extractLawsFromCategory(cat.ref, cat.name)
        allLaws.push(...laws)
      } catch (error) {
        console.error(`   Error processing ${cat.name}:`, error)
      }
    }

    // Save results
    const data = {
      discoveredAt: new Date().toISOString(),
      totalLaws: allLaws.length,
      categoriesProcessed: categoriesToProcess.length,
      laws: allLaws
    }

    // Create data directory if needed
    await execSync(`mkdir -p ${dirname(OUTPUT_FILE)}`)
    await writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2))

    console.log('\n' + '═'.repeat(50))
    console.log(`✅ Discovered ${allLaws.length} laws`)
    console.log(`📁 Saved to ${OUTPUT_FILE}`)

  } finally {
    // Close browser
    try {
      ab('close')
    } catch (e) {
      // Ignore close errors
    }
  }
}

main().catch(console.error)
