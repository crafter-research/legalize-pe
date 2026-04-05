#!/usr/bin/env npx tsx
/**
 * Fetch laws from Congress PDFs
 * Usage: npx tsx scripts/fetch-leyes-congreso-pdf.ts
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { PDFParse } from 'pdf-parse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../leyes/pe')

// Law numbers to fetch (available on Congress site, not in our repo)
const LAW_NUMBERS = [
  // Batch 3 - Newer laws (more likely to have text)
  29200, 29250, 29300, 29350, 29400,
  29450, 29500, 29550, 29600, 29650,
  29700, 29750, 29800, 29850, 29900,
  29950, 30000, 30050, 30100, 30150,
]

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim()
}

function detectArticles(text: string): string {
  return text
    .replace(/^(Art[íi]culo\s+\d+[°º]?\.?-?\s*)/gim, '\n\n## $1')
    .replace(/^(T[ÍI]TULO\s+[IVXLCDM\d]+\.?-?\s*)/gim, '\n\n# $1')
    .replace(/^(CAP[ÍI]TULO\s+[IVXLCDM\d]+\.?-?\s*)/gim, '\n\n## $1')
    .replace(/^(SUBCAP[ÍI]TULO\s+[IVXLCDM\d]+\.?-?\s*)/gim, '\n\n### $1')
    .replace(/^(SECCI[ÓO]N\s+[IVXLCDM\d]+\.?-?\s*)/gim, '\n\n### $1')
    .replace(/^(DISPOSICIONES\s+(?:COMPLEMENTARIAS|TRANSITORIAS|FINALES|DEROGATORIAS)[^\n]*)/gim, '\n\n# $1')
}

function extractLawTitle(text: string, numero: number): string {
  // Try to extract title from PDF content
  const patterns = [
    new RegExp(`LEY\\s+(?:N[°º]?\\s*)?${numero}[^\\n]*\\n+([^\\n]+)`, 'i'),
    /LEY\s+QUE\s+[^\n]+/i,
    /LEY\s+(?:GENERAL|ORGÁNICA|DE)[^\n]+/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0].replace(/\s+/g, ' ').trim().slice(0, 200)
    }
  }

  return `Ley ${numero}`
}

async function fetchPdf(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/pdf',
      },
    })

    if (!response.ok) {
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

async function processPdf(buffer: Buffer): Promise<{ text: string; pages: number } | null> {
  try {
    const parser = new PDFParse({ data: buffer })
    await parser.load()

    const textResult = await parser.getText()
    const text = textResult.pages.map(p => p.text).join('\n\n')
    const pages = textResult.pages.length

    await parser.destroy()

    return { text, pages }
  } catch {
    return null
  }
}

async function processLaw(numero: number): Promise<boolean> {
  const url = `https://www.leyes.congreso.gob.pe/documentos/leyes/${numero}.pdf`
  const filePath = join(OUTPUT_DIR, `ley-${numero}.md`)

  // Check if file already exists
  if (existsSync(filePath)) {
    console.log(`\n⏭️  Ley ${numero} - already exists`)
    return false
  }

  console.log(`\n📜 Ley ${numero}`)
  console.log(`   URL: ${url}`)

  const buffer = await fetchPdf(url)
  if (!buffer) {
    console.log('   ❌ PDF not found')
    return false
  }

  console.log(`   📥 Downloaded (${(buffer.length / 1024).toFixed(1)} KB)`)

  const result = await processPdf(buffer)
  if (!result) {
    console.log('   ❌ Could not parse PDF')
    return false
  }

  console.log(`   📝 Parsed: ${result.pages} pages, ${result.text.length} chars`)

  // Clean and format text
  let markdown = cleanText(result.text)
  markdown = detectArticles(markdown)
  markdown = markdown.replace(/\n{4,}/g, '\n\n\n')

  // Check if content is too short
  if (markdown.length < 200) {
    console.log('   ⚠️  Content too short (might be scanned image)')
    return false
  }

  // Extract title
  const titulo = extractLawTitle(result.text, numero)

  const frontmatter = `---
titulo: "${titulo.replace(/"/g, '\\"')}"
identificador: "ley-${numero}"
pais: "pe"
jurisdiccion: "pe"
rango: "ley"
fechaPublicacion: ""
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${url}"
fuenteAlternativa: "https://spij.minjus.gob.pe/"
diarioOficial: "El Peruano"
sumilla: ""
materias: []
disclaimer: true
---`

  const fullMarkdown = `${frontmatter}

# Ley ${numero}

${markdown}
`

  await writeFile(filePath, fullMarkdown, 'utf-8')
  console.log(`   ✅ Saved: ley-${numero}.md (${(fullMarkdown.length / 1024).toFixed(1)} KB)`)
  return true
}

async function main() {
  console.log('🇵🇪 Legalize PE - Fetching Laws from Congress PDFs')
  console.log('═'.repeat(50))
  console.log(`📋 ${LAW_NUMBERS.length} laws to check\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0
  let skipped = 0

  for (const numero of LAW_NUMBERS) {
    const filePath = join(OUTPUT_DIR, `ley-${numero}.md`)
    if (existsSync(filePath)) {
      skipped++
      continue
    }

    const result = await processLaw(numero)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Success: ${success}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
