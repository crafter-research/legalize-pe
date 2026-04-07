#!/usr/bin/env npx tsx
/**
 * Fetch laws from gob.pe/congreso-de-la-republica/normas-legales
 * Downloads PDFs and converts to markdown
 */

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LEYES_DIR = join(__dirname, '../leyes/pe')
const BASE_URL =
  'https://www.gob.pe/institucion/congreso-de-la-republica/normas-legales'

interface NormaGob {
  titulo: string
  numero: string
  tipo: 'ley' | 'decreto-legislativo' | 'resolucion-legislativa'
  fecha: string
  pdfUrl: string
  identificador: string
}

// Parse the HTML to extract normas
async function fetchNormasPage(page: number): Promise<NormaGob[]> {
  const url = page === 1 ? BASE_URL : `${BASE_URL}?page=${page}`
  console.log(`  Fetching page ${page}...`)

  const response = await fetch(url)
  const html = await response.text()

  const normas: NormaGob[] = []

  // Extract law entries using regex patterns
  // Pattern for PDF links: cdn.www.gob.pe/uploads/document/file/...
  const pdfPattern =
    /href="(https:\/\/cdn\.www\.gob\.pe\/uploads\/document\/file\/[^"]+\.(?:pdf|PDF))"/gi
  const titlePattern =
    /<h3[^>]*class="[^"]*text-primary[^"]*"[^>]*>([^<]+)<\/h3>/gi

  // Simpler approach: look for law numbers in the content
  const lawMatches = html.matchAll(/Ley\s+(?:N[°.]?\s*)?(\d{5})/gi)
  const dlegMatches = html.matchAll(
    /Decreto\s+Legislativo\s+(?:N[°.]?\s*)?(\d{3,4})/gi,
  )

  // Extract all PDF URLs
  const pdfMatches = [...html.matchAll(pdfPattern)]

  for (const match of pdfMatches) {
    const pdfUrl = match[1]

    // Try to extract law number from URL
    let numero = ''
    let tipo: NormaGob['tipo'] = 'ley'
    let identificador = ''

    // Pattern: ley-32413, ley-n-32403, etc
    const leyMatch = pdfUrl.match(/ley[_-]?(?:n[_-]?)?(\d{5})/i)
    const dlegMatch = pdfUrl.match(/decreto[_-]legislativo[_-]?(\d{3,4})/i)

    if (leyMatch) {
      numero = leyMatch[1]
      tipo = 'ley'
      identificador = `ley-${numero}`
    } else if (dlegMatch) {
      numero = dlegMatch[1]
      tipo = 'decreto-legislativo'
      identificador = `dleg-${numero}`
    } else {
      // Try generic number extraction
      const numMatch = pdfUrl.match(/(\d{5})/)
      if (numMatch) {
        numero = numMatch[1]
        identificador = `ley-${numero}`
      } else {
        continue // Skip if we can't identify the law
      }
    }

    // Skip if we already have this one
    if (normas.some((n) => n.identificador === identificador)) continue

    normas.push({
      titulo: `Ley ${numero}`, // Will be updated from PDF
      numero,
      tipo,
      fecha: '', // Will be extracted from PDF
      pdfUrl,
      identificador,
    })
  }

  return normas
}

async function extractTextFromPdf(pdfUrl: string): Promise<string | null> {
  try {
    console.log('    Downloading PDF...')
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      console.log(`    ❌ HTTP ${response.status}`)
      return null
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    // Check file size (skip if > 10MB - likely scanned)
    if (buffer.length > 10 * 1024 * 1024) {
      console.log(
        `    ⚠️ PDF too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB), likely scanned`,
      )
      return null
    }

    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    await parser.load()
    const textResult = await parser.getText()
    const text = textResult.pages
      .map((p: { text: string }) => p.text)
      .join('\n\n')
    await parser.destroy()

    // Check if text is meaningful (not scanned)
    if (text.length < 500) {
      console.log(
        `    ⚠️ Insufficient text (${text.length} chars), likely scanned`,
      )
      return null
    }

    // Check for garbled characters (be more lenient - ratio based)
    // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally detecting control chars in PDF text
    const garbledCount = (text.match(/[\ufffd\u0000-\u001f]/g) || []).length
    const garbledRatio = garbledCount / text.length
    if (garbledRatio > 0.05) {
      // More than 5% garbled
      console.log(
        `    ⚠️ Too many garbled characters (${garbledCount}, ${(garbledRatio * 100).toFixed(1)}%)`,
      )
      return null
    }

    return text
  } catch (error) {
    console.log(
      `    ❌ PDF extraction failed: ${error instanceof Error ? error.message : error}`,
    )
    return null
  }
}

function generateFrontmatter(norma: NormaGob, content: string): string {
  // Try to extract title from content
  let titulo = norma.titulo
  const titleMatch =
    content.match(/LEY\s+(?:N[°.]?\s*)?\d+\s*[-–]\s*([^\n]+)/i) ||
    content.match(/^([A-ZÁÉÍÓÚÑ][^\n]{10,100})/m)
  if (titleMatch) {
    titulo = titleMatch[1].trim().replace(/\s+/g, ' ')
  }

  // Try to extract date
  let fecha = norma.fecha || new Date().toISOString().split('T')[0]
  const dateMatch = content.match(
    /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/i,
  )
  if (dateMatch) {
    const months: Record<string, string> = {
      enero: '01',
      febrero: '02',
      marzo: '03',
      abril: '04',
      mayo: '05',
      junio: '06',
      julio: '07',
      agosto: '08',
      septiembre: '09',
      octubre: '10',
      noviembre: '11',
      diciembre: '12',
    }
    const day = dateMatch[1].padStart(2, '0')
    const month = months[dateMatch[2].toLowerCase()]
    const year = dateMatch[3]
    fecha = `${year}-${month}-${day}`
  }

  return `---
titulo: "${titulo.replace(/"/g, '\\"')}"
identificador: "${norma.identificador}"
pais: "pe"
jurisdiccion: "pe"
rango: "${norma.tipo}"
fechaPublicacion: "${fecha}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${norma.pdfUrl}"
fuenteAlternativa: "https://spij.minjus.gob.pe/"
diarioOficial: "El Peruano"
sumilla: ""
materias: []
disclaimer: true
---`
}

function cleanContent(text: string): string {
  return (
    text
      // Remove excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      // Clean up common PDF artifacts
      .replace(/\f/g, '\n\n')
      // Remove page numbers
      .replace(/^\d+\s*$/gm, '')
      // Fix broken words at line endings
      .replace(/(\w)-\n(\w)/g, '$1$2')
      .trim()
  )
}

async function downloadNorma(norma: NormaGob): Promise<boolean> {
  const filePath = join(LEYES_DIR, `${norma.identificador}.md`)

  // Skip if already exists
  if (existsSync(filePath)) {
    console.log(`  ⏭️  ${norma.identificador} already exists`)
    return true
  }

  console.log(`  📜 ${norma.identificador}`)

  const text = await extractTextFromPdf(norma.pdfUrl)
  if (!text) {
    return false
  }

  const cleanedContent = cleanContent(text)
  const frontmatter = generateFrontmatter(norma, cleanedContent)

  const markdown = `${frontmatter}

# ${norma.titulo}

${cleanedContent}
`

  await writeFile(filePath, markdown, 'utf-8')
  console.log(`    ✅ Saved (${cleanedContent.length} chars)`)
  return true
}

async function main() {
  console.log('🏛️  Congreso de la República - Law Fetcher')
  console.log('══════════════════════════════════════════════════\n')

  // Ensure directory exists
  await mkdir(LEYES_DIR, { recursive: true })

  // Fetch all pages (approximately 21 pages for 210 results)
  const allNormas: NormaGob[] = []
  const maxPages = 22

  console.log('📋 Fetching law list from gob.pe...\n')

  for (let page = 1; page <= maxPages; page++) {
    try {
      const normas = await fetchNormasPage(page)
      if (normas.length === 0) {
        console.log(`  Page ${page}: No more results`)
        break
      }
      allNormas.push(...normas)
      console.log(`  Page ${page}: Found ${normas.length} laws`)

      // Small delay to be nice to the server
      await new Promise((r) => setTimeout(r, 500))
    } catch (error) {
      console.log(`  Page ${page}: Error - ${error}`)
      break
    }
  }

  // Deduplicate
  const uniqueNormas = allNormas.filter(
    (n, i, arr) =>
      arr.findIndex((x) => x.identificador === n.identificador) === i,
  )

  console.log(`\n📊 Found ${uniqueNormas.length} unique laws\n`)
  console.log('📥 Downloading PDFs and converting to markdown...\n')

  let success = 0
  let failed = 0
  let skipped = 0

  for (const norma of uniqueNormas) {
    const filePath = join(LEYES_DIR, `${norma.identificador}.md`)
    if (existsSync(filePath)) {
      skipped++
      continue
    }

    const result = await downloadNorma(norma)
    if (result) {
      success++
    } else {
      failed++
    }

    // Delay between downloads
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log('\n══════════════════════════════════════════════════')
  console.log(`✅ Downloaded: ${success}`)
  console.log(`⏭️  Skipped (existing): ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('══════════════════════════════════════════════════')
}

main().catch(console.error)
