#!/usr/bin/env npx tsx
/**
 * Create markdown files from extracted PDF text for códigos penales
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../leyes/pe')
const TEMP_DIR = '/tmp/codigos-penales'

interface CodigoPenal {
  id: string
  titulo: string
  rango: string
  fechaPublicacion: string
  textFile: string
  fuente: string
}

const CODIGOS: CodigoPenal[] = [
  {
    id: 'dleg-635',
    titulo: 'Código Penal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-04-08',
    textFile: 'codigo-penal.txt',
    fuente: 'https://www2.congreso.gob.pe/sicr/cendocbib/con2_uibd.nsf/771198DA8AB8D48A052577BD006EABC3/$FILE/DLeg_635.pdf',
  },
  {
    id: 'dleg-957',
    titulo: 'Nuevo Código Procesal Penal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2004-07-29',
    textFile: 'ncpp.txt',
    fuente: 'https://www2.congreso.gob.pe/sicr/cendocbib/con2_uibd.nsf/0CF515CB9C1E6BF2052577BD006ECE85/$FILE/DLeg_957.pdf',
  },
  {
    id: 'dleg-654',
    titulo: 'Código de Ejecución Penal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-08-02',
    textFile: 'cep.txt',
    fuente: 'https://www2.congreso.gob.pe/sicr/cendocbib/con2_uibd.nsf/D27846E9F259B76C052577BD006EC164/$FILE/DLeg_654.pdf',
  },
  {
    id: 'dleg-1094',
    titulo: 'Código Penal Militar Policial',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2010-09-01',
    textFile: 'cpmp-1094.txt',
    fuente: 'https://www.legal-tools.org/doc/6895aa/pdf/',
  },
  {
    id: 'dleg-1348',
    titulo: 'Código de Responsabilidad Penal de Adolescentes',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2017-01-07',
    textFile: 'crpa-1348.txt',
    fuente: 'https://spijweb.minjus.gob.pe/wp-content/uploads/2020/08/DECRETO_LEGISLATIVO_1348.pdf',
  },
]

async function main() {
  console.log('🇵🇪 Creating Códigos Penales Markdown Files')
  console.log('═'.repeat(50))

  for (const codigo of CODIGOS) {
    console.log(`\n📜 ${codigo.titulo}`)
    console.log(`   ID: ${codigo.id}`)

    try {
      const textPath = join(TEMP_DIR, codigo.textFile)
      const content = await readFile(textPath, 'utf-8')

      const frontmatter = `---
titulo: "${codigo.titulo}"
identificador: "${codigo.id}"
pais: "pe"
jurisdiccion: "pe"
rango: "${codigo.rango}"
fechaPublicacion: "${codigo.fechaPublicacion}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${codigo.fuente}"
diarioOficial: "El Peruano"
---`

      const markdown = `${frontmatter}

# ${codigo.titulo}

${content}
`

      const outputPath = join(OUTPUT_DIR, `${codigo.id}.md`)
      await writeFile(outputPath, markdown, 'utf-8')
      console.log(`   ✅ Saved: ${outputPath}`)
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : error}`)
    }
  }

  console.log('\n' + '═'.repeat(50))
  console.log('✅ Done!')
}

main().catch(console.error)
