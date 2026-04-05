#!/usr/bin/env npx tsx
/**
 * PDF to Markdown converter using pdf-parse
 * Usage: npx tsx scripts/pdf-to-markdown.ts <pdf-url-or-path> [output-file]
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { PDFParse } from 'pdf-parse'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface PdfMetadata {
  title?: string
  author?: string
  subject?: string
  creator?: string
  producer?: string
}

async function fetchPdf(url: string): Promise<Buffer> {
  console.log(`📥 Downloading PDF from: ${url}`)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'application/pdf',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function loadPdf(source: string): Promise<Buffer> {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return fetchPdf(source)
  }

  // Local file
  const filePath = source.startsWith('/') ? source : join(process.cwd(), source)
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  console.log(`📄 Reading local PDF: ${filePath}`)
  return readFile(filePath)
}

function cleanText(text: string): string {
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive whitespace
    .replace(/[ \t]+/g, ' ')
    // Clean up multiple newlines (but preserve paragraph breaks)
    .replace(/\n{4,}/g, '\n\n\n')
    // Remove leading/trailing whitespace from lines
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove empty lines at start/end
    .trim()
}

function detectArticles(text: string): string {
  // Detect article patterns and format them as headings
  let formatted = text
    // "Artículo X." or "Artículo X.-" or "ARTÍCULO X"
    .replace(/^(Art[íi]culo\s+\d+[°º]?\.?-?\s*)/gim, '\n\n## $1')
    // "TÍTULO X" or "Título X"
    .replace(/^(T[ÍI]TULO\s+[IVXLCDM\d]+\.?-?\s*)/gim, '\n\n# $1')
    // "CAPÍTULO X" or "Capítulo X"
    .replace(/^(CAP[ÍI]TULO\s+[IVXLCDM\d]+\.?-?\s*)/gim, '\n\n## $1')
    // "SUBCAPÍTULO X"
    .replace(/^(SUBCAP[ÍI]TULO\s+[IVXLCDM\d]+\.?-?\s*)/gim, '\n\n### $1')
    // "SECCIÓN X"
    .replace(/^(SECCI[ÓO]N\s+[IVXLCDM\d]+\.?-?\s*)/gim, '\n\n### $1')
    // "DISPOSICIONES" sections
    .replace(/^(DISPOSICIONES\s+(?:COMPLEMENTARIAS|TRANSITORIAS|FINALES|DEROGATORIAS)[^\n]*)/gim, '\n\n# $1')

  return formatted
}

function textToMarkdown(text: string): string {
  let md = cleanText(text)

  // Try to detect and format legal structure
  md = detectArticles(md)

  // Clean up excessive newlines created by formatting
  md = md.replace(/\n{4,}/g, '\n\n\n')

  return md
}

export async function pdfToMarkdown(
  source: string,
): Promise<{ text: string; markdown: string; pages: number; metadata: PdfMetadata }> {
  const pdfBuffer = await loadPdf(source)

  console.log(`📝 Parsing PDF (${(pdfBuffer.length / 1024).toFixed(1)} KB)...`)

  // Create PDFParse instance and load the document
  const parser = new PDFParse({ data: pdfBuffer })
  await parser.load()

  // Get text content
  const textResult = await parser.getText()
  const text = textResult.pages.map(p => p.text).join('\n\n')

  // Get metadata
  const infoResult = await parser.getInfo()
  const metadata: PdfMetadata = {
    title: infoResult.meta?.Title,
    author: infoResult.meta?.Author,
    subject: infoResult.meta?.Subject,
    creator: infoResult.meta?.Creator,
    producer: infoResult.meta?.Producer,
  }

  const pages = textResult.pages.length

  console.log(`   Pages: ${pages}`)
  console.log(`   Characters: ${text.length}`)

  // Clean up
  await parser.destroy()

  const markdown = textToMarkdown(text)

  return {
    text,
    markdown,
    pages,
    metadata,
  }
}

export function createFrontmatter(options: {
  titulo: string
  identificador: string
  rango: string
  fechaPublicacion: string
  fuente: string
  sumilla?: string
  materias?: string[]
}): string {
  const materiasYaml = options.materias
    ? `[${options.materias.map(m => `"${m}"`).join(', ')}]`
    : '[]'

  return `---
titulo: "${options.titulo.replace(/"/g, '\\"')}"
identificador: "${options.identificador}"
pais: "pe"
jurisdiccion: "pe"
rango: "${options.rango}"
fechaPublicacion: "${options.fechaPublicacion}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${options.fuente}"
fuenteAlternativa: "https://spij.minjus.gob.pe/"
diarioOficial: "El Peruano"
sumilla: "${(options.sumilla || '').replace(/"/g, '\\"')}"
materias: ${materiasYaml}
disclaimer: true
---`
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
📄 PDF to Markdown Converter

Usage:
  npx tsx scripts/pdf-to-markdown.ts <pdf-url-or-path> [output-file]

Examples:
  npx tsx scripts/pdf-to-markdown.ts https://example.com/ley.pdf
  npx tsx scripts/pdf-to-markdown.ts ./temp/documento.pdf output.md
  npx tsx scripts/pdf-to-markdown.ts https://img.lpderecho.pe/wp-content/uploads/2025/12/DS-301-2025-EF.pdf leyes/pe/ds-301-2025-ef.md

Environment variables for metadata:
  TITLE="Ley XYZ" ID="ley-xyz" RANGO="ley" FECHA="2024-01-01" SUMILLA="Descripción"
`)
    process.exit(0)
  }

  const source = args[0]
  const outputFile = args[1]

  try {
    const result = await pdfToMarkdown(source)

    console.log('\n📊 PDF Metadata:')
    if (result.metadata.title) console.log(`   Title: ${result.metadata.title}`)
    if (result.metadata.author) console.log(`   Author: ${result.metadata.author}`)
    if (result.metadata.subject) console.log(`   Subject: ${result.metadata.subject}`)

    if (outputFile) {
      // Create frontmatter from env vars or defaults
      const frontmatter = createFrontmatter({
        titulo: process.env.TITLE || result.metadata.title || basename(source, '.pdf'),
        identificador: process.env.ID || basename(source, '.pdf').toLowerCase().replace(/\s+/g, '-'),
        rango: process.env.RANGO || 'norma',
        fechaPublicacion: process.env.FECHA || new Date().toISOString().split('T')[0],
        fuente: source.startsWith('http') ? source : '',
        sumilla: process.env.SUMILLA || result.metadata.subject || '',
      })

      const fullMarkdown = `${frontmatter}

# ${process.env.TITLE || result.metadata.title || 'Documento'}

${result.markdown}
`

      // Ensure directory exists
      const dir = dirname(outputFile)
      if (dir && dir !== '.') {
        await mkdir(dir, { recursive: true })
      }

      await writeFile(outputFile, fullMarkdown, 'utf-8')
      console.log(`\n✅ Saved to: ${outputFile}`)
      console.log(`   Size: ${(fullMarkdown.length / 1024).toFixed(1)} KB`)
    } else {
      // Print to stdout
      console.log('\n' + '═'.repeat(50))
      console.log(result.markdown.slice(0, 2000))
      if (result.markdown.length > 2000) {
        console.log(`\n... (${result.markdown.length - 2000} more characters)`)
      }
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
}

main()
