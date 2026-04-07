#!/usr/bin/env npx tsx
/**
 * Descarga leyes faltantes de gob.pe/congreso scrapeadas con agent-browser.
 * Fuente: normas-legales-gob.json
 */

import { execSync } from 'node:child_process'
import { exec } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execAsync = promisify(exec)
const __dirname = dirname(fileURLToPath(import.meta.url))
const LEYES_DIR = join(__dirname, '../leyes/pe')
const TEMP_DIR = join(__dirname, '../tmp/congreso-pdfs')

// Windows paths for OCR tools
const TESSERACT_EXE = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'
const PDFTOPPM_EXE =
  'C:\\Users\\Shiara\\AppData\\Local\\Microsoft\\WinGet\\Packages\\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\\poppler-25.07.0\\Library\\bin\\pdftoppm.exe'
const TESSDATA_PREFIX = 'C:\\Users\\Shiara\\.tessdata'
const OCR_ENV = { ...process.env, TESSDATA_PREFIX }

interface NormaRaw {
  titulo: string
  detailUrl: string
  pdfUrl: string
  numero: string | null
}

interface Norma {
  titulo: string
  detailUrl: string
  pdfUrl: string
  numero: string
  tipo: 'ley' | 'decreto-legislativo' | 'resolucion-legislativa'
  identificador: string
}

function parseNorma(raw: NormaRaw): Norma | null {
  // Detect type from title first (more reliable than URL)
  const titulo = raw.titulo
  let tipo: Norma['tipo'] = 'ley'
  let numero = raw.numero ?? ''

  if (
    titulo.match(/Decreto Legislativo/i) &&
    !titulo.match(/modifica.*Decreto Legislativo/i)
  ) {
    tipo = 'decreto-legislativo'
    // Extract number from detail URL or title
    const mUrl = raw.detailUrl.match(/-(\d+)$/)
    const mTitle = titulo.match(/Decreto Legislativo[^0-9]*(\d+)/i)
    if (mTitle) numero = mTitle[1]
    else if (mUrl) numero = mUrl[1]
  } else if (titulo.match(/Resolución Legislativa/i)) {
    tipo = 'resolucion-legislativa'
    const m = raw.detailUrl.match(/-(\d+)$/)
    if (m) numero = m[1]
  } else {
    // It's a ley - extract number from URL or raw.numero
    if (!numero) {
      const m = raw.detailUrl.match(/-(\d+)$/)
      if (m) numero = m[1]
    }
  }

  if (!numero) return null

  let identificador: string
  if (tipo === 'decreto-legislativo') identificador = `dleg-${numero}`
  else if (tipo === 'resolucion-legislativa') identificador = `rl-${numero}`
  else identificador = `ley-${numero}`

  return {
    titulo,
    detailUrl: raw.detailUrl,
    pdfUrl: raw.pdfUrl,
    numero,
    tipo,
    identificador,
  }
}

function extractCleanTitle(
  rawTitulo: string,
  numero: string,
  tipo: string,
): string {
  // The raw titulo looks like: "Ley N.° 32413Ley que habilita...descripción..."
  // We want just the short title after the number, before the long description

  // Pattern 1: "Ley N.° XXXXX" followed by the title on same token
  // Find where the law number ends and the actual title starts
  const numPattern = new RegExp(
    `(?:Ley|Decreto Legislativo|Resolución Legislativa)[^\\d]*${numero}[-–\\s]*`,
    'i',
  )
  const afterNum = rawTitulo.replace(numPattern, '').trim()

  if (afterNum.length > 10) {
    // Take the first chunk before a long repetition or description separator
    // The title often repeats: "Ley que habilita...Normativa que promueve..."
    const lines = afterNum.split(/\n/)
    const firstLine = lines[0].trim()

    // If first line is reasonable length, use it
    if (firstLine.length >= 15 && firstLine.length <= 200) {
      // Remove trailing repetitions (same text that appears again)
      const words = firstLine.split(' ')
      // Check if after ~80% of the string it starts repeating
      const half = Math.floor(words.length / 2)
      const firstHalf = words.slice(0, half).join(' ').toLowerCase()
      const secondHalf = words.slice(half).join(' ').toLowerCase()
      if (
        secondHalf.includes(firstHalf.slice(0, 20)) &&
        firstHalf.length > 20
      ) {
        return words.slice(0, half).join(' ')
      }
      return firstLine
    }

    // Take up to first sentence
    const sentence = afterNum.split(/[.!?]/)[0].trim()
    if (sentence.length >= 15 && sentence.length <= 200) return sentence
  }

  // Fallback: use tipo + numero
  if (tipo === 'decreto-legislativo') return `Decreto Legislativo N.° ${numero}`
  if (tipo === 'resolucion-legislativa')
    return `Resolución Legislativa N.° ${numero}`
  return `Ley N.° ${numero}`
}

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

async function extractText(
  pdfPath: string,
): Promise<{ text: string; method: string }> {
  // Try pdftotext first (fast, works on text PDFs)
  try {
    const { stdout } = await execAsync(`pdftotext "${pdfPath}" -`, {
      timeout: 30000,
      maxBuffer: 20 * 1024 * 1024,
    })
    if (stdout.trim().length > 300) {
      return { text: stdout, method: 'pdftotext' }
    }
  } catch {}

  // OCR: pdftoppm → tesseract page by page
  try {
    console.log('    🔍 OCR (pdftoppm + tesseract)...')
    const pagesDir = pdfPath.replace('.pdf', '-pages')
    const pagesPrefix = `${pagesDir}\\p`
    await mkdir(pagesDir, { recursive: true })

    execSync(`"${PDFTOPPM_EXE}" -png -r 200 "${pdfPath}" "${pagesPrefix}"`, {
      timeout: 120000,
      stdio: 'pipe',
    })

    const { readdirSync } = await import('node:fs')
    const pages = readdirSync(pagesDir)
      .filter((f) => f.endsWith('.png'))
      .sort()
    const texts: string[] = []

    for (const page of pages.slice(0, 40)) {
      try {
        const imgPath = `${pagesDir}\\${page}`
        const { stdout } = await execAsync(
          `"${TESSERACT_EXE}" "${imgPath}" stdout -l spa --psm 1`,
          { timeout: 60000, maxBuffer: 5 * 1024 * 1024, env: OCR_ENV },
        )
        if (stdout.trim()) texts.push(stdout.trim())
      } catch {}
    }

    // Cleanup
    for (const p of pages) await unlink(`${pagesDir}\\${p}`).catch(() => {})
    await execAsync(`rmdir "${pagesDir}"`).catch(() => {})

    if (texts.length > 0) {
      return { text: texts.join('\n\n'), method: 'tesseract' }
    }
  } catch {}

  return { text: '', method: 'failed' }
}

function cleanText(text: string): string {
  return text
    .replace(/\f/g, '\n\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/([a-záéíóúñ])-\n([a-záéíóúñ])/gi, '$1$2')
    .replace(/^\d+\s*$/gm, '')
    .trim()
}

function generateFrontmatter(
  norma: Norma,
  titulo: string,
  fecha: string,
  ocrProcessed: boolean,
): string {
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
disclaimer: true${ocrProcessed ? '\nocrProcessed: true' : ''}
---`
}

function extractDate(text: string): string {
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
  const m = text.match(
    /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/i,
  )
  if (m) {
    const day = m[1].padStart(2, '0')
    const month = months[m[2].toLowerCase()]
    return `${m[3]}-${month}-${day}`
  }
  return new Date().toISOString().split('T')[0]
}

async function processNorma(norma: Norma): Promise<'ok' | 'skip' | 'fail'> {
  const filePath = join(LEYES_DIR, `${norma.identificador}.md`)

  if (existsSync(filePath)) return 'skip'

  console.log(`\n  📜 ${norma.identificador}`)

  const pdfPath = join(TEMP_DIR, `${norma.identificador}.pdf`)

  console.log('    📥 Descargando PDF...')
  if (!(await downloadPdf(norma.pdfUrl, pdfPath))) {
    console.log('    ❌ Descarga fallida')
    return 'fail'
  }

  const { text, method } = await extractText(pdfPath)
  await unlink(pdfPath).catch(() => {})

  if (text.length < 200) {
    console.log(
      `    ❌ Texto insuficiente (${text.length} chars, método: ${method})`,
    )
    return 'fail'
  }

  console.log(`    ✅ Texto extraído (${text.length} chars, método: ${method})`)

  const cleanedText = cleanText(text)
  const fecha = extractDate(cleanedText)
  const titulo = extractCleanTitle(norma.titulo, norma.numero, norma.tipo)
  const frontmatter = generateFrontmatter(
    norma,
    titulo,
    fecha,
    method !== 'pdftotext',
  )

  const tipoHeader =
    norma.tipo === 'decreto-legislativo'
      ? `Decreto Legislativo N.° ${norma.numero}`
      : norma.tipo === 'resolucion-legislativa'
        ? `Resolución Legislativa N.° ${norma.numero}`
        : `Ley N.° ${norma.numero}`

  const markdown = `${frontmatter}\n\n# ${titulo}\n\n**${tipoHeader}**\n\n${cleanedText}\n`

  await writeFile(filePath, markdown, 'utf-8')
  return 'ok'
}

async function main() {
  const args = process.argv.slice(2)
  const limit = args.includes('--limit')
    ? Number.parseInt(args[args.indexOf('--limit') + 1])
    : 999
  const startFrom = args.includes('--from')
    ? Number.parseInt(args[args.indexOf('--from') + 1])
    : 0

  console.log('🏛️  Congreso de la República — Descarga masiva')
  console.log('═══════════════════════════════════════════════\n')

  await mkdir(LEYES_DIR, { recursive: true })
  await mkdir(TEMP_DIR, { recursive: true })

  const raw: NormaRaw[] = JSON.parse(
    readFileSync(join(__dirname, '../normas-legales-gob.json'), 'utf-8'),
  )

  const normas = raw
    .map(parseNorma)
    .filter((n): n is Norma => n !== null)
    .filter(
      (n, i, arr) =>
        arr.findIndex((x) => x.identificador === n.identificador) === i,
    )
    .filter((n) => !existsSync(join(LEYES_DIR, `${n.identificador}.md`)))
    .slice(startFrom, startFrom + limit)

  console.log(`📋 ${normas.length} normas por descargar\n`)

  let ok = 0
  let fail = 0
  let skip = 0

  for (const norma of normas) {
    const result = await processNorma(norma)
    if (result === 'ok') ok++
    else if (result === 'fail') fail++
    else skip++
    await new Promise((r) => setTimeout(r, 800))
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log(`✅ Descargadas: ${ok}`)
  console.log(`⏭️  Ya existían: ${skip}`)
  console.log(`❌ Fallidas:    ${fail}`)
  console.log('═══════════════════════════════════════════════')
}

main().catch(console.error)
