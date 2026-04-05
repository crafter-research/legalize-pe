#!/usr/bin/env npx tsx
/**
 * Fetch laws from gob.pe/congreso using OCR for scanned PDFs
 * Uses Tesseract OCR + pdftoppm for image conversion
 */

import { writeFile, mkdir, readdir, unlink, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync, exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const __dirname = dirname(fileURLToPath(import.meta.url))
const LEYES_DIR = join(__dirname, '../leyes/pe')
const TEMP_DIR = '/tmp/legalize-ocr'

interface NormaGob {
  titulo: string
  numero: string
  tipo: 'ley' | 'decreto-legislativo' | 'resolucion-legislativa'
  fecha: string
  pdfUrl: string
  identificador: string
}

// List of laws to fetch with OCR (scanned PDFs from Congress)
const SCANNED_LAWS: NormaGob[] = [
  {
    numero: '32403',
    titulo: 'Ley de creación del distrito de Santa Rosa de Loreto',
    tipo: 'ley',
    fecha: '2025-07-03',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360643/6958470-ley-n-32403.pdf',
    identificador: 'ley-32403'
  },
  {
    numero: '32311',
    titulo: 'Ley de saneamiento territorial provincia Carlos Fermín Fitzcarrald',
    tipo: 'ley',
    fecha: '2025-04-26',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360659/6958469-ley-n-32311.pdf',
    identificador: 'ley-32311'
  },
  {
    numero: '32308',
    titulo: 'Ley de saneamiento límite Arequipa-Ayacucho',
    tipo: 'ley',
    fecha: '2025-04-25',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360658/6958468-ley-n-32308.pdf',
    identificador: 'ley-32308'
  },
  {
    numero: '32281',
    titulo: 'Ley redelimitación Lancones-Querecotillo Sullana',
    tipo: 'ley',
    fecha: '2025-04-02',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360657/6958467-ley-n-32281.pdf',
    identificador: 'ley-32281'
  },
  {
    numero: '32280',
    titulo: 'Ley saneamiento límite Arequipa-Ica',
    tipo: 'ley',
    fecha: '2025-04-02',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360656/6958466-ley-n-32280.pdf',
    identificador: 'ley-32280'
  },
  {
    numero: '32277',
    titulo: 'Ley saneamiento límite Piura-Tumbes',
    tipo: 'ley',
    fecha: '2025-04-02',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360655/6958465-ley-n-32277.pdf',
    identificador: 'ley-32277'
  },
  {
    numero: '32275',
    titulo: 'Ley saneamiento límite Huánuco-Pasco',
    tipo: 'ley',
    fecha: '2025-04-02',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360652/6958464-ley-n-32275.pdf',
    identificador: 'ley-32275'
  },
  {
    numero: '32239',
    titulo: 'Ley saneamiento límite Cusco-Puno',
    tipo: 'ley',
    fecha: '2025-01-10',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360651/6958463-ley-n-32239.pdf',
    identificador: 'ley-32239'
  },
  {
    numero: '32134',
    titulo: 'Ley saneamiento límite Arequipa-Cusco',
    tipo: 'ley',
    fecha: '2024-10-15',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360650/6958462-ley-n-32134.pdf',
    identificador: 'ley-32134'
  },
  {
    numero: '31999',
    titulo: 'Ley saneamiento límite Amazonas-La Libertad',
    tipo: 'ley',
    fecha: '2024-04-12',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360648/6958461-ley-n-31999.pdf',
    identificador: 'ley-31999'
  },
  {
    numero: '31853',
    titulo: 'Ley saneamiento límite Huancavelica-Lima',
    tipo: 'ley',
    fecha: '2023-07-29',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360647/6958460-ley-n-31853.pdf',
    identificador: 'ley-31853'
  },
  {
    numero: '31852',
    titulo: 'Ley saneamiento límite Cusco-Junín',
    tipo: 'ley',
    fecha: '2023-07-29',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360646/6958459-ley-n-31852.pdf',
    identificador: 'ley-31852'
  },
  {
    numero: '31851',
    titulo: 'Ley saneamiento límite Lambayeque-La Libertad',
    tipo: 'ley',
    fecha: '2023-07-28',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360645/6958458-ley-n-31851.pdf',
    identificador: 'ley-31851'
  },
  {
    numero: '31843',
    titulo: 'Ley saneamiento límite Áncash-La Libertad',
    tipo: 'ley',
    fecha: '2023-07-21',
    pdfUrl: 'https://cdn.www.gob.pe/uploads/document/file/8360644/6958457-ley-n-31843.pdf',
    identificador: 'ley-31843'
  }
]

async function downloadPdf(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    if (!response.ok) return false
    const buffer = Buffer.from(await response.arrayBuffer())
    await writeFile(outputPath, buffer)
    return true
  } catch {
    return false
  }
}

async function pdfToImages(pdfPath: string, outputDir: string): Promise<string[]> {
  // Convert PDF to PNG images (one per page)
  const outputPrefix = join(outputDir, 'page')

  try {
    execSync(`pdftoppm -png -r 300 "${pdfPath}" "${outputPrefix}"`, {
      stdio: 'pipe',
      timeout: 60000
    })

    // Find all generated images
    const files = await readdir(outputDir)
    const images = files
      .filter(f => f.startsWith('page') && f.endsWith('.png'))
      .sort()
      .map(f => join(outputDir, f))

    return images
  } catch (error) {
    console.log(`    ❌ PDF to image conversion failed`)
    return []
  }
}

async function ocrImage(imagePath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `tesseract "${imagePath}" stdout -l spa --psm 1 2>/dev/null`,
      { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
    )
    return stdout
  } catch {
    return ''
  }
}

async function ocrPdf(pdfPath: string): Promise<string> {
  const ocrPdfPath = pdfPath.replace('.pdf', '-ocr.pdf')

  try {
    console.log(`    🔍 Running OCR with ocrmypdf...`)

    // Use ocrmypdf for better OCR results
    await execAsync(
      `ocrmypdf -l spa --force-ocr --jobs 2 "${pdfPath}" "${ocrPdfPath}" 2>/dev/null`,
      { timeout: 300000 }
    )

    // Extract text from OCR'd PDF
    const { stdout } = await execAsync(
      `pdftotext "${ocrPdfPath}" -`,
      { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
    )

    console.log(`    ✅ OCR completed`)
    return stdout
  } catch (error) {
    // Fallback: try direct pdftotext
    try {
      const { stdout } = await execAsync(
        `pdftotext "${pdfPath}" -`,
        { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
      )
      if (stdout.length > 200) {
        console.log(`    ✅ Extracted text directly`)
        return stdout
      }
    } catch {}
    console.log(`    ❌ OCR failed`)
    return ''
  } finally {
    // Cleanup
    await unlink(ocrPdfPath).catch(() => {})
  }
}

function generateFrontmatter(norma: NormaGob): string {
  return `---
titulo: "${norma.titulo.replace(/"/g, '\\"')}"
identificador: "${norma.identificador}"
pais: "pe"
jurisdiccion: "pe"
rango: "${norma.tipo}"
fechaPublicacion: "${norma.fecha}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${norma.pdfUrl}"
fuenteAlternativa: "https://spij.minjus.gob.pe/"
diarioOficial: "El Peruano"
sumilla: ""
materias: ["territorial"]
disclaimer: true
ocrProcessed: true
---`
}

function cleanOcrText(text: string): string {
  return text
    // Fix common OCR errors
    .replace(/\|/g, 'l')  // | -> l
    .replace(/0(?=[a-z])/g, 'o')  // 0 before letter -> o
    .replace(/1(?=[a-z])/g, 'l')  // 1 before letter -> l
    // Remove excessive whitespace
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/[ \t]+/g, ' ')
    // Clean up line breaks
    .replace(/([a-z])-\n([a-z])/g, '$1$2')  // rejoin hyphenated words
    .trim()
}

async function processNorma(norma: NormaGob): Promise<boolean> {
  const filePath = join(LEYES_DIR, `${norma.identificador}.md`)

  // Skip if exists
  if (existsSync(filePath)) {
    console.log(`  ⏭️  ${norma.identificador} already exists`)
    return true
  }

  console.log(`  📜 ${norma.identificador}: ${norma.titulo}`)

  // Download PDF
  const pdfPath = join(TEMP_DIR, `${norma.identificador}.pdf`)
  await mkdir(TEMP_DIR, { recursive: true })

  console.log(`    📥 Downloading PDF...`)
  if (!await downloadPdf(norma.pdfUrl, pdfPath)) {
    console.log(`    ❌ Download failed`)
    return false
  }

  // OCR the PDF
  const text = await ocrPdf(pdfPath)

  // Cleanup PDF
  await unlink(pdfPath).catch(() => {})

  if (text.length < 200) {
    console.log(`    ❌ OCR extracted insufficient text (${text.length} chars)`)
    return false
  }

  const cleanedText = cleanOcrText(text)
  const frontmatter = generateFrontmatter(norma)

  const markdown = `${frontmatter}

# ${norma.titulo}

**Ley N° ${norma.numero}**

${cleanedText}
`

  await writeFile(filePath, markdown, 'utf-8')
  console.log(`    ✅ Saved (${cleanedText.length} chars from OCR)`)

  return true
}

async function main() {
  const args = process.argv.slice(2)
  const limit = args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1])
    : SCANNED_LAWS.length

  console.log('🔍 Congreso OCR Fetcher')
  console.log('══════════════════════════════════════════════════')
  console.log(`Processing ${Math.min(limit, SCANNED_LAWS.length)} scanned PDFs with OCR\n`)

  await mkdir(LEYES_DIR, { recursive: true })
  await mkdir(TEMP_DIR, { recursive: true })

  let success = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < Math.min(limit, SCANNED_LAWS.length); i++) {
    const norma = SCANNED_LAWS[i]
    const filePath = join(LEYES_DIR, `${norma.identificador}.md`)

    if (existsSync(filePath)) {
      skipped++
      continue
    }

    const result = await processNorma(norma)
    if (result) {
      success++
    } else {
      failed++
    }
  }

  console.log('\n══════════════════════════════════════════════════')
  console.log(`✅ Success: ${success}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('══════════════════════════════════════════════════')
}

main().catch(console.error)
