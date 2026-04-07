import * as fs from 'node:fs'
import {
  type LawMetadata,
  convertHtmlToMarkdown,
  generateFrontmatter,
} from './html-to-markdown'

interface NormaElPeruano {
  tipo: string
  numero: string
  fecha: string
  sumilla: string
  entidad: string
  url: string
  urlDescarga: string
  idNorma: string
}

interface NormaConContenido {
  norma: NormaElPeruano
  content: string
  error?: string
}

function determineRango(tipo: string): string {
  const tipoLower = tipo.toLowerCase()

  if (tipoLower.includes('decreto legislativo')) return 'decreto-legislativo'
  if (tipoLower.includes('decreto de urgencia')) return 'decreto-de-urgencia'
  if (tipoLower.includes('decreto supremo')) return 'decreto-supremo'
  if (
    tipoLower.includes('resolucion ministerial') ||
    tipoLower.includes('resolución ministerial')
  )
    return 'resolucion-ministerial'
  if (
    tipoLower.includes('resolucion suprema') ||
    tipoLower.includes('resolución suprema')
  )
    return 'resolucion-suprema'
  if (
    tipoLower.includes('resolucion jefatural') ||
    tipoLower.includes('resolución jefatural')
  )
    return 'resolucion-jefatural'
  if (
    tipoLower.includes('resolucion directoral') ||
    tipoLower.includes('resolución directoral')
  )
    return 'resolucion-directoral'
  if (tipoLower.includes('ordenanza')) return 'ordenanza'
  if (tipoLower.includes('resolucion') || tipoLower.includes('resolución'))
    return 'resolucion'
  if (tipoLower.includes('ley')) return 'ley'

  return 'norma'
}

function generateIdentificador(tipo: string, numero: string): string {
  const rango = determineRango(tipo)
  // Limpiar el número y convertir a formato de identificador
  const cleanNumero = numero
    .replace(/\s+/g, '-')
    .replace(/[\/\\]/g, '-')
    .toLowerCase()

  return `${rango}-${cleanNumero}`
}

function convertFechaToISO(fecha: string): string {
  // Convertir de DD/MM/YYYY a YYYY-MM-DD
  const parts = fecha.split('/')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return fecha
}

function convertToMarkdown(item: NormaConContenido): {
  filename: string
  content: string
} {
  const { norma, content } = item

  // Generar identificador
  const identificador = generateIdentificador(norma.tipo, norma.numero)

  // Crear metadata
  const metadata: LawMetadata = {
    titulo: norma.sumilla || `${norma.tipo} N° ${norma.numero}`,
    identificador,
    pais: 'pe',
    jurisdiccion: 'nacional',
    rango: determineRango(norma.tipo),
    sector: norma.entidad || undefined,
    fechaPublicacion: convertFechaToISO(norma.fecha),
    estado: 'vigente',
    fuente: norma.url,
    diarioOficial: 'El Peruano',
  }

  // Generar frontmatter
  const frontmatter = generateFrontmatter(metadata)

  // Convertir contenido HTML a Markdown
  const markdownContent = convertHtmlToMarkdown(content)

  // Combinar frontmatter y contenido
  const fullMarkdown = `${frontmatter}\n\n${markdownContent}`

  return {
    filename: `${identificador}.md`,
    content: fullMarkdown,
  }
}

async function main() {
  console.log('Cargando normas desde elperuano-normas-contenido.json...')

  const jsonContent = fs.readFileSync(
    'elperuano-normas-contenido.json',
    'utf-8',
  )
  const normas: NormaConContenido[] = JSON.parse(jsonContent)

  console.log(`Total normas a convertir: ${normas.length}`)

  // Crear directorio de salida
  const outputDir = 'elperuano-md'
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  let successCount = 0
  let errorCount = 0

  for (const item of normas) {
    if (item.error || !item.content) {
      console.log(
        `  ✗ ${item.norma.tipo} N° ${item.norma.numero}: Sin contenido`,
      )
      errorCount++
      continue
    }

    try {
      const { filename, content } = convertToMarkdown(item)
      const filepath = `${outputDir}/${filename}`

      fs.writeFileSync(filepath, content)
      console.log(`  ✓ ${filename}`)
      successCount++
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.log(`  ✗ ${item.norma.tipo} N° ${item.norma.numero}: ${errorMsg}`)
      errorCount++
    }
  }

  console.log('\nConversión completada:')
  console.log(`  - Exitosos: ${successCount}`)
  console.log(`  - Fallidos: ${errorCount}`)
  console.log(`  - Archivos en: ${outputDir}/`)
}

main().catch(console.error)
