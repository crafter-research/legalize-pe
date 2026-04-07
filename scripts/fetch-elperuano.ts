#!/usr/bin/env npx tsx
/**
 * Descarga normas del Diario Oficial El Peruano vía API.
 * Tipos: Ley, Decreto Legislativo, Decreto de Urgencia, Decreto Supremo.
 *
 * Uso:
 *   npx tsx scripts/fetch-elperuano.ts [--from YYYY-MM] [--to YYYY-MM] [--limit N] [--types ley,dleg,du,ds]
 */

import { writeFile, mkdir, unlink } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)
const __dirname = dirname(fileURLToPath(import.meta.url))
const LEYES_DIR = join(__dirname, '../leyes/pe')
const TEMP_DIR = join(__dirname, '../tmp/elperuano-pdfs')

// Windows paths for OCR tools
const TESSERACT_EXE = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'
const PDFTOPPM_EXE = 'C:\\Users\\Shiara\\AppData\\Local\\Microsoft\\WinGet\\Packages\\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\\poppler-25.07.0\\Library\\bin\\pdftoppm.exe'
const TESSDATA_PREFIX = 'C:\\Users\\Shiara\\.tessdata'
const OCR_ENV = { ...process.env, TESSDATA_PREFIX }

type TipoNorma = 'ley' | 'decreto-legislativo' | 'decreto-urgencia' | 'decreto-supremo'

interface NormaElPeruano {
  title: string
  date: string
  tipo: TipoNorma
  numero: string       // e.g. "32539", "1555", "010-2025", "149-2025-PCM"
  identificador: string
  dataUrl: string
  sector: string
}

// ─── HTML parsing ──────────────────────────────────────────────────────────────

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function stripTags(s: string): string {
  return decodeHtmlEntities(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function parseTipo(title: string): TipoNorma | null {
  if (title.match(/^LEY\s+(?:ORGÁNICA\s+)?N[°º]/i)) return 'ley'
  if (title.match(/^DECRETO\s+LEGISLATIVO\s+N[°º]/i)) return 'decreto-legislativo'
  if (title.match(/^DECRETO\s+DE\s+URGENCIA\s+N[°º]/i)) return 'decreto-urgencia'
  if (title.match(/^DECRETO\s+SUPREMO\s+N[°º]/i)) return 'decreto-supremo'
  return null
}

function parseNumero(title: string, tipo: TipoNorma): string {
  // Extract the part after "N°"
  const m = title.match(/N[°º]\s*(.+)/i)
  if (!m) return ''
  const rest = m[1].trim()

  if (tipo === 'ley' || tipo === 'decreto-legislativo') {
    // e.g. "32539" or "32539 Ley que..."
    const n = rest.match(/^(\d+)/)
    return n ? n[1] : ''
  }
  // DU: "010-2025" → "010-2025"
  // DS: "149-2025-PCM" → "149-2025-PCM"
  const n = rest.match(/^([\d]+-\d{4}(?:-[A-Z]+)?)/)
  return n ? n[1] : rest.split(/\s/)[0]
}

function buildIdentificador(tipo: TipoNorma, numero: string): string {
  const n = numero.toLowerCase()
  switch (tipo) {
    case 'ley': return `ley-${n}`
    case 'decreto-legislativo': return `dleg-${n}`
    case 'decreto-urgencia': return `du-${n}`
    case 'decreto-supremo': return `ds-${n}`
  }
}

function parseArticles(html: string, enabledTypes: Set<TipoNorma>): NormaElPeruano[] {
  const articleRe = /<article[^>]*edicionesoficiales_articulos[^>]*>([\s\S]*?)<\/article>/gi
  const titleRe = /<h5[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i
  const dateRe = /<p[^>]*>[\s\S]*?<b[^>]*>([\s\S]*?)<\/b>/i
  const sectorRe = /<h4[^>]*>([\s\S]*?)<\/h4>/i
  // First input with data-tipo="DiNl" (individual download)
  const downloadRe = /<input[^>]*data-tipo="DiNl"[^>]*data-url="([^"]+)"[^>]*/i

  const results: NormaElPeruano[] = []
  let match: RegExpExecArray | null

  while ((match = articleRe.exec(html)) !== null) {
    const art = match[1]
    const titleMatch = titleRe.exec(art)
    const dateMatch = dateRe.exec(art)
    const sectorMatch = sectorRe.exec(art)
    const dlMatch = downloadRe.exec(art)

    if (!titleMatch || !dlMatch) continue

    const title = stripTags(titleMatch[1])
    const date = stripTags(dateMatch?.[1] ?? '').replace(/^Fecha:\s*/i, '')
    const sector = stripTags(sectorMatch?.[1] ?? '')
    const dataUrl = dlMatch[1]

    const tipo = parseTipo(title)
    if (!tipo || !enabledTypes.has(tipo)) continue

    const numero = parseNumero(title, tipo)
    if (!numero) continue

    const identificador = buildIdentificador(tipo, numero)

    results.push({ title, date, tipo, numero, identificador, dataUrl, sector })
  }

  return results
}

// ─── API fetching ──────────────────────────────────────────────────────────────

async function fetchMonth(year: number, month: number, enabledTypes: Set<TipoNorma>): Promise<NormaElPeruano[]> {
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()
  const fromDate = `01/${pad(month)}/${year}`
  const toDate = `${lastDay}/${pad(month)}/${year}`
  const dateParam = encodeURIComponent(`${pad(month)}/${lastDay}/${year} 00:00:00`)

  const body = new URLSearchParams({
    cddesde: fromDate,
    cdhasta: toDate,
    'X-Requested-With': 'XMLHttpRequest'
  }).toString()

  try {
    const res = await fetch(
      `https://diariooficial.elperuano.pe/Normas/Filtro?dateparam=${dateParam}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://diariooficial.elperuano.pe/normas',
        },
        body,
      }
    )
    if (!res.ok) {
      console.log(`  ⚠️  API error ${res.status} for ${year}-${pad(month)}`)
      return []
    }
    const html = await res.text()
    return parseArticles(html, enabledTypes)
  } catch (e) {
    console.log(`  ⚠️  Fetch failed for ${year}-${pad(month)}: ${e}`)
    return []
  }
}

// ─── PDF download & text extraction ───────────────────────────────────────────

async function downloadPdf(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: { 'Referer': 'https://diariooficial.elperuano.pe/normas' }
    })
    if (!response.ok) return false
    const buffer = Buffer.from(await response.arrayBuffer())
    await writeFile(outputPath, buffer)
    return true
  } catch {
    return false
  }
}

async function extractText(pdfPath: string): Promise<{ text: string; method: string }> {
  // Try pdftotext first
  try {
    const { stdout } = await execAsync(
      `pdftotext "${pdfPath}" -`,
      { timeout: 30000, maxBuffer: 20 * 1024 * 1024 }
    )
    if (stdout.trim().length > 300) {
      return { text: stdout, method: 'pdftotext' }
    }
  } catch {}

  // OCR fallback
  try {
    console.log('    🔍 OCR (pdftoppm + tesseract)...')
    const pagesDir = pdfPath.replace('.pdf', '-pages')
    const pagesPrefix = pagesDir + '\\p'
    await mkdir(pagesDir, { recursive: true })

    execSync(`"${PDFTOPPM_EXE}" -png -r 200 "${pdfPath}" "${pagesPrefix}"`, {
      timeout: 120000,
      stdio: 'pipe',
    })

    const { readdirSync } = await import('node:fs')
    const pages = readdirSync(pagesDir).filter(f => f.endsWith('.png')).sort()
    const texts: string[] = []

    for (const page of pages.slice(0, 40)) {
      try {
        const imgPath = `${pagesDir}\\${page}`
        const { stdout } = await execAsync(
          `"${TESSERACT_EXE}" "${imgPath}" stdout -l spa --psm 1`,
          { timeout: 60000, maxBuffer: 5 * 1024 * 1024, env: OCR_ENV }
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

function extractDateFromText(text: string, fallbackDate: string): string {
  const months: Record<string, string> = {
    enero: '01', febrero: '02', marzo: '03', abril: '04',
    mayo: '05', junio: '06', julio: '07', agosto: '08',
    septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
  }
  const m = text.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/i)
  if (m) {
    const day = m[1].padStart(2, '0')
    const month = months[m[2].toLowerCase()]
    return `${m[3]}-${month}-${day}`
  }
  // Parse from API date format "DD/MM/YYYY"
  const dm = fallbackDate.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (dm) return `${dm[3]}-${dm[2]}-${dm[1]}`
  return new Date().toISOString().split('T')[0]
}

function formatRango(tipo: TipoNorma): string {
  switch (tipo) {
    case 'ley': return 'ley'
    case 'decreto-legislativo': return 'decreto-legislativo'
    case 'decreto-urgencia': return 'decreto-urgencia'
    case 'decreto-supremo': return 'decreto-supremo'
  }
}

function buildTitle(norma: NormaElPeruano): string {
  switch (norma.tipo) {
    case 'ley': return `Ley N.° ${norma.numero}`
    case 'decreto-legislativo': return `Decreto Legislativo N.° ${norma.numero}`
    case 'decreto-urgencia': return `Decreto de Urgencia N.° ${norma.numero}`
    case 'decreto-supremo': return `Decreto Supremo N.° ${norma.numero}`
  }
}

function generateFrontmatter(norma: NormaElPeruano, fecha: string, titulo: string, ocrProcessed: boolean): string {
  return `---
titulo: "${titulo.replace(/"/g, '\\"')}"
identificador: "${norma.identificador}"
pais: "pe"
jurisdiccion: "pe"
rango: "${formatRango(norma.tipo)}"
fechaPublicacion: "${fecha}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${norma.dataUrl}"
fuenteAlternativa: "https://diariooficial.elperuano.pe/normas"
diarioOficial: "El Peruano"
sector: "${norma.sector}"
sumilla: ""
materias: []
disclaimer: true${ocrProcessed ? '\nocrProcessed: true' : ''}
---`
}

async function processNorma(norma: NormaElPeruano): Promise<'ok' | 'skip' | 'fail'> {
  const filePath = join(LEYES_DIR, `${norma.identificador}.md`)
  if (existsSync(filePath)) return 'skip'

  console.log(`\n  📜 ${norma.identificador}  [${norma.date}]`)

  const pdfPath = join(TEMP_DIR, `${norma.identificador}.pdf`)

  console.log(`    📥 Descargando PDF...`)
  if (!await downloadPdf(norma.dataUrl, pdfPath)) {
    console.log(`    ❌ Descarga fallida`)
    return 'fail'
  }

  const { text, method } = await extractText(pdfPath)
  await unlink(pdfPath).catch(() => {})

  if (text.length < 100) {
    console.log(`    ❌ Texto insuficiente (${text.length} chars, método: ${method})`)
    return 'fail'
  }

  console.log(`    ✅ Texto extraído (${text.length} chars, método: ${method})`)

  const cleanedText = cleanText(text)
  const fecha = extractDateFromText(cleanedText, norma.date)
  const titulo = buildTitle(norma)
  const frontmatter = generateFrontmatter(norma, fecha, titulo, method !== 'pdftotext')

  const markdown = `${frontmatter}\n\n# ${titulo}\n\n${cleanedText}\n`
  await writeFile(filePath, markdown, 'utf-8')
  return 'ok'
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  const fromArg = args.find((_, i) => args[i - 1] === '--from') ?? '2020-01'
  const toArg = args.find((_, i) => args[i - 1] === '--to') ?? new Date().toISOString().slice(0, 7)
  const limit = args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1])
    : 9999
  const dryRun = args.includes('--dry-run')
  const typesArg = args.find((_, i) => args[i - 1] === '--types')
  const enabledTypesFromArg: Set<TipoNorma> = typesArg
    ? new Set(typesArg.split(',') as TipoNorma[])
    : new Set(['ley', 'decreto-legislativo', 'decreto-urgencia', 'decreto-supremo'])

  const [fromYear, fromMonth] = fromArg.split('-').map(Number)
  const [toYear, toMonth] = toArg.split('-').map(Number)

  console.log('📰 Diario Oficial El Peruano — Descarga masiva')
  console.log('═══════════════════════════════════════════════')
  console.log(`📅 Rango: ${fromArg} → ${toArg}`)
  if (dryRun) console.log('🔍 Modo dry-run (sin descarga)')
  console.log()

  await mkdir(LEYES_DIR, { recursive: true })
  await mkdir(TEMP_DIR, { recursive: true })

  // Collect all normas across months
  const allNormas: NormaElPeruano[] = []
  const seen = new Set<string>()

  let y = fromYear, m = fromMonth
  while (y < toYear || (y === toYear && m <= toMonth)) {
    const pad = (n: number) => String(n).padStart(2, '0')
    process.stdout.write(`  📡 ${y}-${pad(m)}... `)
    const normas = await fetchMonth(y, m, enabledTypesFromArg)
    let newCount = 0
    for (const n of normas) {
      if (!seen.has(n.identificador)) {
        seen.add(n.identificador)
        allNormas.push(n)
        newCount++
      }
    }
    console.log(`${normas.length} normas, ${newCount} nuevas`)

    // Advance month
    m++
    if (m > 12) { m = 1; y++ }

    await new Promise(r => setTimeout(r, 500))
  }

  // Filter out existing files
  const pending = allNormas.filter(n => !existsSync(join(LEYES_DIR, `${n.identificador}.md`)))

  console.log(`\n📋 Total encontradas: ${allNormas.length}`)
  console.log(`📋 Por descargar: ${pending.length}`)

  if (dryRun) {
    console.log('\nDry-run completado. Normas a descargar:')
    pending.slice(0, 30).forEach(n => console.log(`  - ${n.identificador}  ${n.title}`))
    if (pending.length > 30) console.log(`  ... y ${pending.length - 30} más`)
    return
  }

  let ok = 0, fail = 0, skip = 0
  const batch = pending.slice(0, limit)

  for (const norma of batch) {
    const result = await processNorma(norma)
    if (result === 'ok') ok++
    else if (result === 'fail') fail++
    else skip++
    await new Promise(r => setTimeout(r, 800))
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log(`✅ Descargadas: ${ok}`)
  console.log(`⏭️  Ya existían: ${skip}`)
  console.log(`❌ Fallidas:    ${fail}`)
  console.log('═══════════════════════════════════════════════')
}

main().catch(console.error)
