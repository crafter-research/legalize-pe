#!/usr/bin/env npx tsx
/**
 * Fetch Código de Ética de la Función Pública (Ley 27815)
 */

import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFParse } from 'pdf-parse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../leyes/pe')

async function fetchPdfAsText(url: string): Promise<string> {
  console.log(`   Downloading PDF from: ${url}`)
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  console.log(`   PDF size: ${(buffer.length / 1024).toFixed(1)} KB`)

  const parser = new PDFParse({ data: buffer })
  await parser.load()
  const textResult = await parser.getText()
  const text = textResult.pages.map((p: { text: string }) => p.text).join('\n\n')
  const pages = textResult.pages.length
  console.log(`   Pages: ${pages}`)
  await parser.destroy()
  return text
}

function formatText(text: string): string {
  return text
    // Fix common OCR issues
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    // Format articles
    .replace(/Artículo\s+(\d+)/gi, '\n\n## Artículo $1')
    // Format chapters
    .replace(/CAPÍTULO\s+([IVX]+)/gi, '\n\n# CAPÍTULO $1')
    // Format titles
    .replace(/TÍTULO\s+([IVX]+)/gi, '\n\n# TÍTULO $1')
    .trim()
}

async function main() {
  console.log('📜 Fetching Código de Ética de la Función Pública (Ley 27815)...\n')

  const pdfUrl = 'https://idehpucp.pucp.edu.pe/images/documentos/anticorrupcion/normativa/ley27815_actual.pdf'

  try {
    const text = await fetchPdfAsText(pdfUrl)
    const content = formatText(text)

    // Count garbled characters
    const garbled = (content.match(/�/g) || []).length
    console.log(`   Chars: ${content.length} Garbled: ${garbled}`)

    if (garbled > 50) {
      console.log(`⚠️ Too many garbled characters, PDF may have encoding issues`)
    }

    const frontmatter = `---
titulo: "Ley del Código de Ética de la Función Pública"
identificador: "ley-27815"
pais: "pe"
jurisdiccion: "pe"
rango: "ley"
fechaPublicacion: "2002-08-13"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${pdfUrl}"
fuenteAlternativa: "https://spij.minjus.gob.pe/"
diarioOficial: "El Peruano"
sumilla: "Establece los principios, deberes y prohibiciones éticas que rigen para los servidores públicos"
materias: ["función pública", "ética", "anticorrupción"]
disclaimer: true
---`

    const markdown = `${frontmatter}

# Ley del Código de Ética de la Función Pública - Ley N° 27815

${content}
`

    const filePath = join(OUTPUT_DIR, 'ley-27815.md')
    await writeFile(filePath, markdown, 'utf-8')
    console.log(`✅ Saved: ley-27815.md (${(markdown.length / 1024).toFixed(1)} KB)`)
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : error}`)
  }
}

main().catch(console.error)
