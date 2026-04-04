#!/usr/bin/env npx tsx
/**
 * OCR Ley 29903 PDF
 * Since the PDF is image-based, we need to use OCR
 */

import { execSync } from 'node:child_process'
import { writeFile, readFile, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PDF_PATH = join(__dirname, '../temp-ley-29903.pdf')
const OUTPUT_DIR = join(__dirname, '../temp-ocr')
const OUTPUT_FILE = join(__dirname, '../leyes/pe/ley-29903.md')

async function main() {
  console.log('🇵🇪 OCR for Ley 29903')
  console.log('═'.repeat(50))

  // Check if PDF exists
  if (!existsSync(PDF_PATH)) {
    console.log('❌ PDF not found at:', PDF_PATH)
    return
  }

  console.log('📄 Converting PDF to images...')

  try {
    // Use ImageMagick or similar to convert PDF to images
    // For now, let's try a simpler approach with pdfimages
    execSync(`pdfimages -png "${PDF_PATH}" "${OUTPUT_DIR}/page"`, {
      stdio: 'inherit',
    })
  } catch (error) {
    console.log('❌ Error converting PDF to images')
    console.log('Trying alternative method...')

    try {
      // Try with convert (ImageMagick)
      execSync(`convert -density 300 "${PDF_PATH}" "${OUTPUT_DIR}/page-%03d.png"`, {
        stdio: 'inherit',
      })
    } catch (error2) {
      console.log('❌ Could not convert PDF. Please install ImageMagick or poppler-utils')
      return
    }
  }

  console.log('✅ PDF converted to images')

  console.log('\n📝 Running OCR with tesseract...')

  // Get list of image files
  const files = execSync(`ls ${OUTPUT_DIR}/page*.png`, { encoding: 'utf-8' })
    .trim()
    .split('\n')

  console.log(`Found ${files.length} pages`)

  let fullText = ''

  for (const file of files) {
    console.log(`Processing: ${file}`)
    try {
      const text = execSync(`tesseract "${file}" stdout -l spa`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      })
      fullText += text + '\n\n---\n\n'
    } catch (error) {
      console.log(`  ❌ Error processing ${file}`)
    }
  }

  console.log('\n📝 Saving markdown file...')

  const frontmatter = `---
titulo: "Ley de Reforma del Sistema Privado de Pensiones"
identificador: "ley-29903"
pais: "pe"
jurisdiccion: "pe"
rango: "ley"
fechaPublicacion: "2012-07-19"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "https://leyes.congreso.gob.pe/Documentos/Leyes/29903.pdf"
diarioOficial: "El Peruano"
notas: "Texto extraído mediante OCR del PDF oficial del Congreso"
---`

  const markdown = `${frontmatter}

# Ley de Reforma del Sistema Privado de Pensiones

${fullText}
`

  await writeFile(OUTPUT_FILE, markdown, 'utf-8')

  console.log(`✅ Saved to: ${OUTPUT_FILE}`)

  // Clean up
  console.log('\n🧹 Cleaning up...')
  try {
    await rm(OUTPUT_DIR, { recursive: true, force: true })
  } catch (error) {
    console.log('Could not clean up temp files')
  }

  console.log('\n' + '═'.repeat(50))
  console.log('✅ Done!')
}

main().catch(console.error)
