#!/usr/bin/env npx tsx
/**
 * Fetch laws batch B: 27501-27999
 */

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFParse } from 'pdf-parse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../leyes/pe')

const LAW_NUMBERS = Array.from({ length: 499 }, (_, i) => 27501 + i)

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

async function processLaw(numero: number): Promise<boolean> {
  const url = `https://www.leyes.congreso.gob.pe/documentos/leyes/${numero}.pdf`
  const filePath = join(OUTPUT_DIR, `ley-${numero}.md`)

  if (existsSync(filePath)) return false

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/pdf',
      },
    })

    if (!response.ok) return false

    const buffer = Buffer.from(await response.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    await parser.load()
    const textResult = await parser.getText()
    const text = textResult.pages.map((p) => p.text).join('\n\n')
    const pages = textResult.pages.length
    await parser.destroy()

    if (text.length < 200) return false

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
    console.log(
      `✅ ${numero} (${pages}p, ${(text.length / 1024).toFixed(1)}KB)`,
    )
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log(`🇵🇪 Batch B: 27501-27999 (${LAW_NUMBERS.length} laws)`)
  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  for (const numero of LAW_NUMBERS) {
    const result = await processLaw(numero)
    if (result) success++
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log(`\n✅ Total: ${success}`)
}

main().catch(console.error)
