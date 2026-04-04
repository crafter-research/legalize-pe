#!/usr/bin/env npx tsx
/**
 * Format codigo-penal.md from raw SPIJ text to structured Markdown
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const INPUT_FILE = join(__dirname, '../leyes/pe/codigo-penal.md')
const OUTPUT_FILE = join(__dirname, '../leyes/pe/dleg-635.md')

const FRONTMATTER = `---
titulo: "Decreto Legislativo N° 635 - Código Penal"
identificador: "dleg-635"
pais: "pe"
jurisdiccion: "pe"
rango: "decreto-legislativo"
fechaPublicacion: "1991-04-08"
fechaPromulgacion: "1991-04-03"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "https://spij.minjus.gob.pe/"
fuenteAlternativa: "https://lpderecho.pe/codigo-penal-peruano-actualizado/"
diarioOficial: "El Peruano"
sumilla: "Código Penal del Perú"
materias: ["penal", "delitos", "penas", "sanciones"]
disclaimer: true
spijId: "H683660"
---`

async function main() {
  console.log('📜 Formateando Código Penal...')

  let content = await readFile(INPUT_FILE, 'utf-8')
  console.log(`   Tamaño original: ${(content.length / 1024).toFixed(1)} KB`)

  // 1. Remove SPIJ navigation cruft (everything before "CODIGO PENAL\n\nDECRETO")
  const startMarker = 'CODIGO PENAL'
  const startIndex = content.indexOf(startMarker)
  if (startIndex > 0) {
    content = content.slice(startIndex)
    console.log('   ✓ Removido encabezado SPIJ')
  }

  // 2. Normalize line breaks (SPIJ uses \n literally in the text)
  content = content.replace(/\\n/g, '\n')

  // 3. Add line breaks before structural elements
  // TITULO
  content = content.replace(/([^\n])(TITULO [IVXLCDM]+)/g, '$1\n\n## $2')
  content = content.replace(/^(TITULO [IVXLCDM]+)/gm, '\n\n## $1')

  // CAPITULO
  content = content.replace(/([^\n])(CAPITULO [IVXLCDM]+)/g, '$1\n\n### $2')
  content = content.replace(/^(CAPITULO [IVXLCDM]+)/gm, '\n\n### $1')

  // SECCION
  content = content.replace(/([^\n])(SECCION [IVXLCDM]+)/g, '$1\n\n#### $2')
  content = content.replace(/^(SECCION [IVXLCDM]+)/gm, '\n\n#### $1')

  // SUB CAPITULO / SUBCAPITULO
  content = content.replace(/([^\n])(SUB ?CAPITULO [IVXLCDM]+)/g, '$1\n\n#### $2')
  content = content.replace(/^(SUB ?CAPITULO [IVXLCDM]+)/gm, '\n\n#### $1')

  // 4. Format articles
  // "Artículo 108.-" → line break before, bold
  content = content.replace(/([^\n])(Artículo \d+(-[A-Z])?\.?-)/g, '$1\n\n**$2**')
  content = content.replace(/^(Artículo \d+(-[A-Z])?\.?-)/gm, '\n\n**$1**')

  // 5. Format modification annotations
  // "(*) Artículo modificado por..." → line break, italic
  content = content.replace(/\(\*\)\s*(Artículo|Numeral|Literal|Inciso|Párrafo)/g, '\n\n> (*) $1')
  content = content.replace(/\(\*\)\s*(De conformidad|Mediante|Conforme)/g, '\n\n> (*) $1')
  content = content.replace(/\(\*\)\s*(modificado|incorporado|derogado)/gi, '\n\n> (*) $1')

  // 6. Format LIBRO (Book)
  content = content.replace(/([^\n])(LIBRO [IVXLCDM]+)/g, '$1\n\n# $2')
  content = content.replace(/^(LIBRO [IVXLCDM]+)/gm, '\n\n# $1')

  // 7. Format PARTE (Part)
  content = content.replace(/([^\n])(PARTE [A-Z]+)/g, '$1\n\n# $2')
  content = content.replace(/^(PARTE [A-Z]+)/gm, '\n\n# $1')

  // 8. Clean up tabs and excessive spaces
  content = content.replace(/\\t/g, '')
  content = content.replace(/\t/g, '')
  content = content.replace(/^ +/gm, '') // leading spaces
  content = content.replace(/ +$/gm, '') // trailing spaces

  // 9. Clean up escaped quotes
  content = content.replace(/\\"/g, '"')

  // 10. Clean up multiple newlines
  content = content.replace(/\n{4,}/g, '\n\n\n')

  // 11. Clean up leading/trailing whitespace
  content = content.trim()

  // 12. Add proper title
  const titleMatch = content.match(/^CODIGO PENAL/)
  if (titleMatch) {
    content = content.replace(/^CODIGO PENAL/, '# CÓDIGO PENAL')
  }

  // 13. Add frontmatter
  const finalContent = `${FRONTMATTER}\n\n${content}\n`

  // Write output
  await writeFile(OUTPUT_FILE, finalContent, 'utf-8')

  const lines = finalContent.split('\n').length
  console.log(`   Tamaño final: ${(finalContent.length / 1024).toFixed(1)} KB`)
  console.log(`   Líneas: ${lines}`)
  console.log(`   ✅ Guardado: ${OUTPUT_FILE}`)
}

main().catch(console.error)
