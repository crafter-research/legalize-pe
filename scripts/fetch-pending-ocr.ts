#!/usr/bin/env npx tsx
/**
 * Process pending laws with OCR
 */

import { writeFile, mkdir, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const __dirname = dirname(fileURLToPath(import.meta.url))
const LEYES_DIR = join(__dirname, '../leyes/pe')
const TEMP_DIR = '/tmp/legalize-ocr'

interface PendingLaw {
  identificador: string
  titulo: string
  rango: string
  fecha: string
  pdfUrl: string
  materias: string[]
}

const PENDING_LAWS: PendingLaw[] = [
  {
    identificador: 'du-025-2020',
    titulo: 'Medidas urgentes para reforzar vigilancia sanitaria COVID-19',
    rango: 'decreto-urgencia',
    fecha: '2020-03-11',
    pdfUrl: 'https://www.leyes.congreso.gob.pe/Documentos/2016_2021/Decretos/Urgencias/2020/DU-025-2020..pdf',
    materias: ['covid', 'salud']
  },
  {
    identificador: 'dleg-771',
    titulo: 'Ley Marco del Sistema Tributario Nacional',
    rango: 'decreto-legislativo',
    fecha: '1993-12-31',
    pdfUrl: 'https://www.leyes.congreso.gob.pe/Documentos/DecretosLegislativos/00771.pdf',
    materias: ['tributario']
  },
  {
    identificador: 'dleg-821',
    titulo: 'Ley del Impuesto General a las Ventas e Impuesto Selectivo al Consumo',
    rango: 'decreto-legislativo',
    fecha: '1996-04-23',
    pdfUrl: 'https://www.leyes.congreso.gob.pe/Documentos/DecretosLegislativos/00821.pdf',
    materias: ['tributario', 'IGV']
  },
  {
    identificador: 'dleg-1013',
    titulo: 'Ley de Creación del Ministerio del Ambiente',
    rango: 'decreto-legislativo',
    fecha: '2008-05-14',
    pdfUrl: 'https://www.leyes.congreso.gob.pe/Documentos/DecretosLegislativos/01013.pdf',
    materias: ['ambiental', 'institucional']
  },
  {
    identificador: 'dleg-1440',
    titulo: 'Decreto Legislativo del Sistema Nacional de Presupuesto Público',
    rango: 'decreto-legislativo',
    fecha: '2018-09-16',
    pdfUrl: 'https://www.leyes.congreso.gob.pe/Documentos/DecretosLegislativos/01440.pdf',
    materias: ['presupuesto', 'Estado']
  },
  {
    identificador: 'dleg-1441',
    titulo: 'Decreto Legislativo del Sistema Nacional de Tesorería',
    rango: 'decreto-legislativo',
    fecha: '2018-09-16',
    pdfUrl: 'https://www.leyes.congreso.gob.pe/Documentos/DecretosLegislativos/01441.pdf',
    materias: ['tesorería', 'Estado']
  },
  {
    identificador: 'dleg-1442',
    titulo: 'Decreto Legislativo del Sistema Nacional de Endeudamiento Público',
    rango: 'decreto-legislativo',
    fecha: '2018-09-16',
    pdfUrl: 'https://www.leyes.congreso.gob.pe/Documentos/DecretosLegislativos/01442.pdf',
    materias: ['deuda pública', 'Estado']
  },
  {
    identificador: 'ley-29230',
    titulo: 'Ley que Impulsa la Inversión Pública Regional y Local con Participación del Sector Privado',
    rango: 'ley',
    fecha: '2008-05-20',
    pdfUrl: 'https://www.leyes.congreso.gob.pe/Documentos/Leyes/29230.pdf',
    materias: ['inversión', 'tributario']
  }
]

async function downloadPdf(url: string, outputPath: string): Promise<boolean> {
  try {
    console.log(`    📥 Downloading from ${url.substring(0, 60)}...`)
    const response = await fetch(url)
    if (!response.ok) {
      console.log(`    ❌ HTTP ${response.status}`)
      return false
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    await writeFile(outputPath, buffer)
    console.log(`    ✅ Downloaded (${(buffer.length / 1024).toFixed(0)} KB)`)
    return true
  } catch (e) {
    console.log(`    ❌ Download failed: ${e}`)
    return false
  }
}

async function ocrPdf(pdfPath: string): Promise<string> {
  const ocrPdfPath = pdfPath.replace('.pdf', '-ocr.pdf')

  try {
    console.log(`    🔍 Running OCR...`)

    // Use ocrmypdf
    await execAsync(
      `ocrmypdf -l spa --force-ocr --jobs 2 "${pdfPath}" "${ocrPdfPath}" 2>&1`,
      { timeout: 600000 }
    )

    // Extract text
    const { stdout } = await execAsync(
      `pdftotext "${ocrPdfPath}" -`,
      { timeout: 60000, maxBuffer: 50 * 1024 * 1024 }
    )

    console.log(`    ✅ OCR completed (${stdout.length} chars)`)
    return stdout
  } catch (error) {
    // Try direct extraction as fallback
    try {
      const { stdout } = await execAsync(
        `pdftotext "${pdfPath}" -`,
        { timeout: 60000, maxBuffer: 50 * 1024 * 1024 }
      )
      if (stdout.length > 500) {
        console.log(`    ✅ Direct extraction (${stdout.length} chars)`)
        return stdout
      }
    } catch {}

    console.log(`    ❌ OCR failed`)
    return ''
  } finally {
    await unlink(ocrPdfPath).catch(() => {})
  }
}

function generateMarkdown(law: PendingLaw, content: string): string {
  const materias = JSON.stringify(law.materias)

  return `---
titulo: "${law.titulo.replace(/"/g, '\\"')}"
identificador: "${law.identificador}"
pais: "pe"
jurisdiccion: "pe"
rango: "${law.rango}"
fechaPublicacion: "${law.fecha}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${law.pdfUrl}"
fuenteAlternativa: "https://spij.minjus.gob.pe/"
diarioOficial: "El Peruano"
sumilla: ""
materias: ${materias}
disclaimer: true
ocrProcessed: true
---

# ${law.titulo}

${content.trim()}
`
}

async function processLaw(law: PendingLaw): Promise<boolean> {
  const filePath = join(LEYES_DIR, `${law.identificador}.md`)

  if (existsSync(filePath)) {
    console.log(`  ⏭️  ${law.identificador} already exists`)
    return true
  }

  console.log(`\n  📜 ${law.identificador}: ${law.titulo}`)

  await mkdir(TEMP_DIR, { recursive: true })
  const pdfPath = join(TEMP_DIR, `${law.identificador}.pdf`)

  // Download
  if (!await downloadPdf(law.pdfUrl, pdfPath)) {
    return false
  }

  // OCR
  const text = await ocrPdf(pdfPath)

  // Cleanup
  await unlink(pdfPath).catch(() => {})

  if (text.length < 500) {
    console.log(`    ❌ Insufficient text extracted (${text.length} chars)`)
    return false
  }

  // Save
  const markdown = generateMarkdown(law, text)
  await writeFile(filePath, markdown, 'utf-8')
  console.log(`    💾 Saved to ${law.identificador}.md`)

  return true
}

async function main() {
  console.log('🔍 Processing Pending Laws with OCR')
  console.log('══════════════════════════════════════════════════\n')

  await mkdir(LEYES_DIR, { recursive: true })

  let success = 0
  let failed = 0
  let skipped = 0

  for (const law of PENDING_LAWS) {
    const filePath = join(LEYES_DIR, `${law.identificador}.md`)
    if (existsSync(filePath)) {
      skipped++
      continue
    }

    const result = await processLaw(law)
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
