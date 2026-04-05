#!/usr/bin/env npx tsx
/**
 * Fetch Código de Procedimientos Penales (Ley 9024) - complete version
 */

import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFParse } from 'pdf-parse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../leyes/pe')

async function fetchPdfAsText(url: string): Promise<{ text: string; pages: number }> {
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
  await parser.destroy()

  return { text, pages }
}

function formatText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    // Format articles
    .replace(/Art[íi]culo\s+(\d+)/gi, '\n\n## Artículo $1')
    // Format sections/titles
    .replace(/SECCIÓN\s+([IVX]+)/gi, '\n\n# SECCIÓN $1')
    .replace(/TÍTULO\s+([IVX]+)/gi, '\n\n# TÍTULO $1')
    .replace(/LIBRO\s+([IVX]+)/gi, '\n\n# LIBRO $1')
    .trim()
}

async function main() {
  console.log('📜 Fetching Código de Procedimientos Penales (Ley 9024)...\n')

  // Try multiple sources
  const sources = [
    'https://www.wipo.int/edocs/lexdocs/laws/es/pe/pe038es.pdf',
    'https://hrlibrary.umn.edu/research/Peru-Codigo%20de%20Procedimientos%20Penales.pdf',
    'https://www.munlima.gob.pe/images/descargas/normas-administrativas/C%C3%B3digo%20de%20Procedimientos%20Penales.pdf',
  ]

  for (const pdfUrl of sources) {
    try {
      console.log(`\nTrying source: ${pdfUrl.split('/').pop()}`)
      const { text, pages } = await fetchPdfAsText(pdfUrl)
      const content = formatText(text)

      const garbled = (content.match(/�/g) || []).length
      console.log(`   Pages: ${pages} Chars: ${content.length} Garbled: ${garbled}`)

      if (garbled > 100) {
        console.log(`   ⚠️ Too many garbled characters, trying next source...`)
        continue
      }

      if (content.length < 50000) {
        console.log(`   ⚠️ Content seems incomplete, trying next source...`)
        continue
      }

      const frontmatter = `---
titulo: "Código de Procedimientos Penales"
identificador: "ley-9024"
pais: "pe"
jurisdiccion: "pe"
rango: "ley"
fechaPublicacion: "1940-03-23"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${pdfUrl}"
fuenteAlternativa: "https://spij.minjus.gob.pe/"
diarioOficial: "El Peruano"
sumilla: "Código de Procedimientos Penales de 1940, aún parcialmente vigente para procesos iniciados antes de la implementación del Nuevo Código Procesal Penal"
materias: ["procesal penal", "derecho penal", "procedimientos"]
disclaimer: true
---`

      const markdown = `${frontmatter}

# Código de Procedimientos Penales - Ley N° 9024

${content}
`

      const filePath = join(OUTPUT_DIR, 'ley-9024.md')
      await writeFile(filePath, markdown, 'utf-8')
      console.log(`\n✅ Saved: ley-9024.md (${(markdown.length / 1024).toFixed(1)} KB)`)
      return
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : error}`)
    }
  }

  console.error('\n❌ All sources failed')
}

main().catch(console.error)
