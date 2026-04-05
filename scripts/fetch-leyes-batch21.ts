#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 21 - More laws to expand database
 * Usage: npx tsx scripts/fetch-leyes-batch21.ts
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../leyes/pe')

interface LawDefinition {
  id: string
  name: string
  url: string
  rango: string
  fechaPublicacion: string
  materias: string[]
  sumilla?: string
}

const LEYES_BATCH21: LawDefinition[] = [
  // Derecho de Familia
  {
    id: 'articulo-patria-potestad',
    name: 'La patria potestad en el Perú: concepto, ejercicio y extinción',
    url: 'https://lpderecho.pe/patria-potestad-codigo-civil-peru/',
    rango: 'articulo',
    fechaPublicacion: '2023-06-15',
    materias: ['civil', 'familia', 'patria potestad'],
    sumilla: 'Análisis completo de la patria potestad en el Perú',
  },
  {
    id: 'articulo-tenencia-hijos',
    name: 'La tenencia de hijos: marco legal y criterios judiciales',
    url: 'https://lpderecho.pe/tenencia-hijos-peru/',
    rango: 'articulo',
    fechaPublicacion: '2023-05-20',
    materias: ['civil', 'familia', 'tenencia'],
    sumilla: 'Marco legal y criterios para la tenencia de hijos',
  },
  {
    id: 'articulo-regimen-visitas',
    name: 'Régimen de visitas: derechos y obligaciones',
    url: 'https://lpderecho.pe/regimen-visitas-peru/',
    rango: 'articulo',
    fechaPublicacion: '2023-04-10',
    materias: ['civil', 'familia', 'régimen de visitas'],
    sumilla: 'Derechos y obligaciones en el régimen de visitas',
  },
  // Derecho Sucesorio
  {
    id: 'articulo-sucesion-intestada',
    name: 'Sucesión intestada: concepto, requisitos y procedimiento',
    url: 'https://lpderecho.pe/sucesion-intestada-peru/',
    rango: 'articulo',
    fechaPublicacion: '2023-07-05',
    materias: ['civil', 'sucesiones', 'intestada'],
    sumilla: 'Análisis de la sucesión intestada en el Perú',
  },
  {
    id: 'articulo-testamento',
    name: 'Tipos de testamento en el Código Civil peruano',
    url: 'https://lpderecho.pe/tipos-testamento-codigo-civil-peru/',
    rango: 'articulo',
    fechaPublicacion: '2023-08-12',
    materias: ['civil', 'sucesiones', 'testamento'],
    sumilla: 'Los distintos tipos de testamento en el Perú',
  },
  // Derecho Penal
  {
    id: 'articulo-homicidio-calificado',
    name: 'Homicidio calificado: análisis del tipo penal',
    url: 'https://lpderecho.pe/homicidio-calificado-peru/',
    rango: 'articulo',
    fechaPublicacion: '2023-03-08',
    materias: ['penal', 'homicidio', 'delitos'],
    sumilla: 'Análisis del homicidio calificado en el Código Penal',
  },
  {
    id: 'articulo-robo-agravado',
    name: 'Robo agravado: elementos típicos y jurisprudencia',
    url: 'https://lpderecho.pe/robo-agravado-peru/',
    rango: 'articulo',
    fechaPublicacion: '2023-02-25',
    materias: ['penal', 'robo', 'delitos patrimoniales'],
    sumilla: 'Análisis del robo agravado y jurisprudencia',
  },
  {
    id: 'articulo-usurpacion',
    name: 'Delito de usurpación: elementos y defensa',
    url: 'https://lpderecho.pe/delito-usurpacion-peru/',
    rango: 'articulo',
    fechaPublicacion: '2023-01-18',
    materias: ['penal', 'usurpación', 'delitos patrimoniales'],
    sumilla: 'Análisis del delito de usurpación en el Perú',
  },
  // Derecho Constitucional
  {
    id: 'articulo-accion-amparo-plazo',
    name: 'Plazos en el proceso de amparo constitucional',
    url: 'https://lpderecho.pe/plazos-proceso-amparo-peru/',
    rango: 'articulo',
    fechaPublicacion: '2023-09-20',
    materias: ['constitucional', 'amparo', 'plazos'],
    sumilla: 'Los plazos del proceso de amparo en el Perú',
  },
  {
    id: 'articulo-inconstitucionalidad',
    name: 'Proceso de inconstitucionalidad: legitimidad y efectos',
    url: 'https://lpderecho.pe/proceso-inconstitucionalidad-peru/',
    rango: 'articulo',
    fechaPublicacion: '2023-10-05',
    materias: ['constitucional', 'inconstitucionalidad', 'TC'],
    sumilla: 'Análisis del proceso de inconstitucionalidad',
  },
  // Derecho Administrativo
  {
    id: 'articulo-silencio-administrativo',
    name: 'Silencio administrativo positivo y negativo: diferencias',
    url: 'https://lpderecho.pe/silencio-administrativo-positivo-negativo/',
    rango: 'articulo',
    fechaPublicacion: '2023-11-15',
    materias: ['administrativo', 'silencio administrativo', 'procedimiento'],
    sumilla: 'Diferencias entre silencio positivo y negativo',
  },
  {
    id: 'articulo-nulidad-acto-administrativo',
    name: 'Nulidad del acto administrativo: causales y efectos',
    url: 'https://lpderecho.pe/nulidad-acto-administrativo-peru/',
    rango: 'articulo',
    fechaPublicacion: '2023-12-01',
    materias: ['administrativo', 'nulidad', 'acto administrativo'],
    sumilla: 'Causales y efectos de la nulidad del acto administrativo',
  },
  // Derecho Laboral adicional
  {
    id: 'articulo-horas-extras',
    name: 'Horas extras: cálculo, límites y jurisprudencia',
    url: 'https://lpderecho.pe/horas-extras-peru/',
    rango: 'articulo',
    fechaPublicacion: '2024-01-10',
    materias: ['laboral', 'horas extras', 'remuneración'],
    sumilla: 'Cálculo y límites de las horas extras en el Perú',
  },
  {
    id: 'articulo-vacaciones-truncas',
    name: 'Vacaciones truncas: derecho y cálculo',
    url: 'https://lpderecho.pe/vacaciones-truncas-peru/',
    rango: 'articulo',
    fechaPublicacion: '2024-02-05',
    materias: ['laboral', 'vacaciones', 'beneficios'],
    sumilla: 'Cálculo de vacaciones truncas',
  },
  {
    id: 'articulo-remuneracion-minima',
    name: 'Remuneración mínima vital: evolución y criterios',
    url: 'https://lpderecho.pe/remuneracion-minima-vital-peru/',
    rango: 'articulo',
    fechaPublicacion: '2024-03-01',
    materias: ['laboral', 'RMV', 'remuneración'],
    sumilla: 'Evolución de la remuneración mínima vital',
  },
  // Derecho Tributario adicional
  {
    id: 'articulo-igv-exoneraciones',
    name: 'Exoneraciones del IGV: casos y requisitos',
    url: 'https://lpderecho.pe/exoneraciones-igv-peru/',
    rango: 'articulo',
    fechaPublicacion: '2024-01-20',
    materias: ['tributario', 'IGV', 'exoneraciones'],
    sumilla: 'Casos de exoneración del IGV',
  },
  {
    id: 'articulo-renta-quinta',
    name: 'Impuesto a la renta de quinta categoría: cálculo',
    url: 'https://lpderecho.pe/renta-quinta-categoria-peru/',
    rango: 'articulo',
    fechaPublicacion: '2024-02-15',
    materias: ['tributario', 'renta', 'quinta categoría'],
    sumilla: 'Cálculo del impuesto a la renta de quinta categoría',
  },
  // Derecho Procesal Civil
  {
    id: 'articulo-medidas-cautelares',
    name: 'Medidas cautelares en el proceso civil peruano',
    url: 'https://lpderecho.pe/medidas-cautelares-proceso-civil-peru/',
    rango: 'articulo',
    fechaPublicacion: '2024-03-10',
    materias: ['procesal civil', 'medidas cautelares', 'proceso'],
    sumilla: 'Las medidas cautelares en el proceso civil',
  },
  {
    id: 'articulo-embargo',
    name: 'El embargo: tipos, procedimiento y efectos',
    url: 'https://lpderecho.pe/embargo-tipos-procedimiento-peru/',
    rango: 'articulo',
    fechaPublicacion: '2024-03-20',
    materias: ['procesal civil', 'embargo', 'ejecución'],
    sumilla: 'Tipos y procedimiento del embargo',
  },
  // Contrataciones del Estado
  {
    id: 'articulo-contrataciones-estado-2024',
    name: 'Principales cambios en contrataciones del Estado 2024',
    url: 'https://lpderecho.pe/cambios-contrataciones-estado-2024/',
    rango: 'articulo',
    fechaPublicacion: '2024-01-05',
    materias: ['administrativo', 'contrataciones', 'estado'],
    sumilla: 'Cambios en la normativa de contrataciones 2024',
  },
]

async function fetchLawContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const html = await response.text()

  const contentMatch =
    html.match(
      /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:footer|div[^>]*class="[^"]*post-tags)/i,
    ) || html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)

  if (!contentMatch) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      return htmlToMarkdown(bodyMatch[1])
    }
    throw new Error('Could not extract content')
  }

  return htmlToMarkdown(contentMatch[1])
}

function htmlToMarkdown(html: string): string {
  const md = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(
      /<div[^>]*class="[^"]*(?:sharedaddy|jp-relatedposts|ad-|social)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      '',
    )
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?[uo]l[^>]*>/gi, '\n')
    .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .trim()

  return md
}

async function saveLaw(law: LawDefinition, content: string): Promise<void> {
  const materiasYaml = law.materias.map((m) => `"${m}"`).join(', ')

  const frontmatter = `---
titulo: "${law.name.replace(/"/g, '\\"')}"
identificador: "${law.id}"
pais: "pe"
jurisdiccion: "pe"
rango: "${law.rango}"
fechaPublicacion: "${law.fechaPublicacion}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "${law.url}"
fuenteAlternativa: "https://spij.minjus.gob.pe/"
diarioOficial: "El Peruano"
sumilla: "${(law.sumilla || '').replace(/"/g, '\\"')}"
materias: [${materiasYaml}]
disclaimer: true
---`

  const markdown = `${frontmatter}

# ${law.name}

${content}
`

  const filePath = join(OUTPUT_DIR, `${law.id}.md`)
  await writeFile(filePath, markdown, 'utf-8')
  console.log(
    `   📝 Saved: ${law.id}.md (${(markdown.length / 1024).toFixed(1)} KB)`,
  )
}

async function processLaw(law: LawDefinition): Promise<boolean> {
  console.log(`\n📜 ${law.name}`)
  console.log(`   ID: ${law.id}`)
  console.log(`   URL: ${law.url}`)

  try {
    const content = await fetchLawContent(law.url)

    if (content.length < 500) {
      console.log(`   ⚠️  Content too short (${content.length} chars)`)
      return false
    }

    await saveLaw(law, content)
    console.log('   ✅ Success')
    return true
  } catch (error) {
    console.log(
      `   ❌ Error: ${error instanceof Error ? error.message : error}`,
    )
    return false
  }
}

async function main() {
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 21')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH21.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH21) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting - 12 seconds
    await new Promise((r) => setTimeout(r, 12000))
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
