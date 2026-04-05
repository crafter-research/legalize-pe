#!/usr/bin/env npx tsx
/**
 * Fast parallel law fetcher with concurrency control
 * Usage: npx tsx scripts/fetch-laws-fast.ts <start> <end> [concurrency]
 */

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFParse } from 'pdf-parse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../leyes/pe')

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .split('\n')
    .map((line) => line.trim())
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
    .replace(
      /^(DISPOSICIONES\s+(?:COMPLEMENTARIAS|TRANSITORIAS|FINALES|DEROGATORIAS)[^\n]*)/gim,
      '\n\n# $1',
    )
}

async function processLaw(
  numero: number,
): Promise<{ success: boolean; skipped: boolean }> {
  const url = `https://www.leyes.congreso.gob.pe/documentos/leyes/${numero}.pdf`
  const filePath = join(OUTPUT_DIR, `ley-${numero}.md`)

  if (existsSync(filePath)) return { success: false, skipped: true }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/pdf',
      },
    })

    if (!response.ok) return { success: false, skipped: false }

    const buffer = Buffer.from(await response.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    await parser.load()
    const textResult = await parser.getText()
    const text = textResult.pages.map((p) => p.text).join('\n\n')
    const pages = textResult.pages.length
    await parser.destroy()

    if (text.length < 200) return { success: false, skipped: false }

    let markdown = cleanText(text)
    markdown = detectArticles(markdown)

    const frontmatter = `---
titulo: "Ley ${numero}"
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

    await writeFile(
      filePath,
      `${frontmatter}\n\n# Ley ${numero}\n\n${markdown}\n`,
      'utf-8',
    )
    console.log(`✅ ${numero} (${pages}p)`)
    return { success: true, skipped: false }
  } catch {
    return { success: false, skipped: false }
  }
}

async function processWithConcurrency(
  items: number[],
  concurrency: number,
  fn: (item: number) => Promise<{ success: boolean; skipped: boolean }>,
): Promise<{ success: number; failed: number; skipped: number }> {
  let success = 0
  let failed = 0
  let skipped = 0
  let index = 0

  const workers = Array(concurrency)
    .fill(null)
    .map(async () => {
      while (index < items.length) {
        const currentIndex = index++
        const item = items[currentIndex]
        const result = await fn(item)
        if (result.skipped) skipped++
        else if (result.success) success++
        else failed++

        // Small delay to avoid overwhelming the server
        await new Promise((r) => setTimeout(r, 200))
      }
    })

  await Promise.all(workers)
  return { success, failed, skipped }
}

async function main() {
  const args = process.argv.slice(2)
  const start = Number.parseInt(args[0]) || 27110
  const end = Number.parseInt(args[1]) || 27500
  const concurrency = Number.parseInt(args[2]) || 5

  console.log(`🇵🇪 Fetching laws ${start}-${end} (concurrency: ${concurrency})`)
  await mkdir(OUTPUT_DIR, { recursive: true })

  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  const result = await processWithConcurrency(numbers, concurrency, processLaw)

  console.log('\n════════════════════════')
  console.log(`✅ Success: ${result.success}`)
  console.log(`⏭️  Skipped: ${result.skipped}`)
  console.log(`❌ Failed: ${result.failed}`)
}

main().catch(console.error)
