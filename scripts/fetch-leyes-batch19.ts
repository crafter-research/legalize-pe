#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 19 - Migraciones, niños, INDECOPI, garantías constitucionales
 * Usage: npx tsx scripts/fetch-leyes-batch19.ts
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
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

const LEYES_BATCH19: LawDefinition[] = [
  // Código de los Niños y Adolescentes
  {
    id: 'ley-27337',
    name: 'Código de los Niños y Adolescentes',
    url: 'https://lpderecho.pe/codigo-ninos-adolescentes-ley-27337-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2000-08-07',
    materias: ['familia', 'niños', 'adolescentes', 'alimentos'],
    sumilla: 'Código de los Niños y Adolescentes actualizado',
  },
  // LOF INDECOPI
  {
    id: 'dleg-1033',
    name: 'Ley de Organización y Funciones del INDECOPI',
    url: 'https://lpderecho.pe/ley-organizacion-funciones-indecopi-decreto-legislativo-1033-actualizada/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-25',
    materias: ['INDECOPI', 'propiedad intelectual', 'competencia'],
    sumilla: 'Ley de Organización y Funciones del INDECOPI',
  },
  // Nueva Ley de Nacionalidad
  {
    id: 'ley-32421',
    name: 'Nueva Ley de Nacionalidad',
    url: 'https://lpderecho.pe/ley-32421-nueva-ley-nacionalidad/',
    rango: 'ley',
    fechaPublicacion: '2025-08-01',
    materias: ['migraciones', 'nacionalidad', 'extranjería'],
    sumilla: 'Regula la adquisición de la nacionalidad peruana',
  },
  // Expulsión extranjeros
  {
    id: 'dleg-1582',
    name: 'Decreto Legislativo sobre expulsión de extranjeros irregulares',
    url: 'https://lpderecho.pe/decreto-legislativo-1582-procedimiento-expulsion-rapida-extranjeros-situacion-irregular/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2023-11-14',
    materias: ['migraciones', 'extranjería', 'expulsión'],
    sumilla: 'Procedimiento de expulsión de extranjeros',
  },
  // Secretaría Seguridad y Defensa
  {
    id: 'dleg-1684',
    name: 'Decreto Legislativo que crea la Secretaría de Seguridad y Defensa Nacional',
    url: 'https://lpderecho.pe/crean-secretaria-seguridad-defensa-nacional-decreto-legislativo-1684/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2024-10-02',
    materias: ['defensa nacional', 'seguridad', 'PCM'],
    sumilla: 'Crea la Secretaría de Seguridad y Defensa Nacional',
  },
  // Alimentos análisis
  {
    id: 'articulo-alimentos',
    name: 'El derecho de alimentos: características, fijación y prorrateo',
    url: 'https://lpderecho.pe/derecho-alimentos-caracteres-fijacion-conyuge-hijos-prorrateo/',
    rango: 'articulo',
    fechaPublicacion: '2022-05-15',
    materias: ['familia', 'alimentos', 'análisis'],
    sumilla: 'Análisis del derecho de alimentos',
  },
  // Pensión alimentos
  {
    id: 'articulo-pension-alimentos',
    name: 'Pensión de alimentos: qué abarca y cómo calcularla',
    url: 'https://lpderecho.pe/pension-alimentos-derecho-civil/',
    rango: 'articulo',
    fechaPublicacion: '2023-01-20',
    materias: ['familia', 'alimentos', 'pensión'],
    sumilla: 'Guía sobre la pensión de alimentos',
  },
  // Habeas corpus
  {
    id: 'articulo-habeas-corpus',
    name: 'Hábeas corpus: características, derechos protegidos, tipos y procedimiento',
    url: 'https://lpderecho.pe/habeas-corpus-caracteristicas-derechos-protegidos-tipos-procedimiento/',
    rango: 'articulo',
    fechaPublicacion: '2022-07-10',
    materias: ['constitucional', 'hábeas corpus', 'garantías'],
    sumilla: 'Análisis del proceso de hábeas corpus',
  },
  // Habeas data
  {
    id: 'articulo-habeas-data',
    name: 'Hábeas data: características, derechos protegidos, tipos y procedimiento',
    url: 'https://lpderecho.pe/habeas-data-caracteristicas-derechos-protegidos-tipos-procedimiento/',
    rango: 'articulo',
    fechaPublicacion: '2022-08-05',
    materias: ['constitucional', 'hábeas data', 'datos personales'],
    sumilla: 'Análisis del proceso de hábeas data',
  },
  // Propiedad intelectual
  {
    id: 'articulo-propiedad-intelectual',
    name: 'Qué estudia la propiedad intelectual',
    url: 'https://lpderecho.pe/que-estudia-propiedad-intelectual/',
    rango: 'articulo',
    fechaPublicacion: '2022-04-20',
    materias: ['propiedad intelectual', 'INDECOPI', 'análisis'],
    sumilla: 'Introducción a la propiedad intelectual',
  },
  // Patentes y registros
  {
    id: 'articulo-patentar-registrar',
    name: 'Propiedad intelectual: patentar vs registrar',
    url: 'https://lpderecho.pe/propiedad-intelectual-es-lo-mismo-patentar-y-registrar/',
    rango: 'articulo',
    fechaPublicacion: '2022-06-10',
    materias: ['propiedad intelectual', 'patentes', 'marcas'],
    sumilla: 'Diferencias entre patentar y registrar',
  },
  // Productos y servicios registrables
  {
    id: 'articulo-productos-servicios-registrar',
    name: 'Propiedad intelectual: clases de productos o servicios registrables',
    url: 'https://lpderecho.pe/propiedad-intelectual-productos-servicios-registrar/',
    rango: 'articulo',
    fechaPublicacion: '2022-05-25',
    materias: ['propiedad intelectual', 'marcas', 'INDECOPI'],
    sumilla: 'Clases de productos y servicios registrables',
  },
  // Tipos habeas corpus
  {
    id: 'articulo-tipos-habeas-corpus',
    name: 'Los tipos de hábeas corpus en la jurisprudencia del TC',
    url: 'https://lpderecho.pe/tipos-habeas-corpus-jurisprudencia-tribunal-constitucional/',
    rango: 'articulo',
    fechaPublicacion: '2023-03-15',
    materias: ['constitucional', 'hábeas corpus', 'TC'],
    sumilla: 'Tipos de hábeas corpus según el TC',
  },
  // Habeas corpus correctivo
  {
    id: 'articulo-habeas-corpus-correctivo',
    name: 'El Tribunal Constitucional y el hábeas corpus correctivo',
    url: 'https://lpderecho.pe/tribunal-constitucional-habeas-corpus-correctivo/',
    rango: 'articulo',
    fechaPublicacion: '2022-09-20',
    materias: ['constitucional', 'hábeas corpus', 'penitenciario'],
    sumilla: 'Análisis del hábeas corpus correctivo',
  },
  // Reformas habeas corpus
  {
    id: 'articulo-reformas-habeas-corpus',
    name: 'Reformas del hábeas corpus en el Nuevo Código Procesal Constitucional',
    url: 'https://lpderecho.pe/reformas-habeas-corpus-nuevo-codigo-procesal-constitucional-edhin-campos/',
    rango: 'articulo',
    fechaPublicacion: '2021-08-10',
    materias: ['constitucional', 'hábeas corpus', 'procesal'],
    sumilla: 'Reformas al hábeas corpus en el nuevo código',
  },
  // Jurisprudencia alimentos
  {
    id: 'articulo-jurisprudencia-alimentos',
    name: 'Jurisprudencia relevante y actualizada sobre alimentos',
    url: 'https://lpderecho.pe/jurisprudencia-relevante-actualizada-alimentos/',
    rango: 'jurisprudencia',
    fechaPublicacion: '2023-04-01',
    materias: ['familia', 'alimentos', 'jurisprudencia'],
    sumilla: 'Compilación de jurisprudencia sobre alimentos',
  },
  // Proceso alimentos virtual
  {
    id: 'directiva-007-2020-ce-pj',
    name: 'Directiva sobre procesos virtuales de alimentos',
    url: 'https://lpderecho.pe/directiva-proceso-simplificado-virtual-pension-alimentos-nina-nino-adolescente/',
    rango: 'directiva',
    fechaPublicacion: '2020-10-15',
    materias: ['familia', 'alimentos', 'proceso virtual'],
    sumilla: 'Regula el proceso virtual de alimentos',
  },
  // Protección niños sin cuidados parentales
  {
    id: 'ds-006-2024-mimp',
    name: 'Modifican el Reglamento para protección de niños sin cuidados parentales',
    url: 'https://lpderecho.pe/modifican-reglamento-decreto-legislativo-1297-proteccion-ninos-adolescentes-cuidados-parentales-decreto-supremo-006-2024-mimp/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2024-04-15',
    materias: ['familia', 'niños', 'protección'],
    sumilla: 'Modifica reglamento DLeg. 1297',
  },
  // Licencia paternidad
  {
    id: 'articulo-licencia-paternidad',
    name: 'Licencia por paternidad: todo lo que debes saber',
    url: 'https://lpderecho.pe/licencia-maternidad-derecho-laboral/',
    rango: 'articulo',
    fechaPublicacion: '2023-02-10',
    materias: ['laboral', 'paternidad', 'licencias'],
    sumilla: 'Guía sobre licencia por maternidad',
  },
  // Despido laboral
  {
    id: 'articulo-despido-laboral',
    name: 'Régimen del despido laboral en el Perú',
    url: 'https://lpderecho.pe/como-acoso-hostigamiento-sexual-laboral/',
    rango: 'articulo',
    fechaPublicacion: '2022-10-15',
    materias: ['laboral', 'hostigamiento', 'denuncia'],
    sumilla: 'Cómo actuar frente al hostigamiento sexual',
  },
  // Obligaciones empleador hostigamiento
  {
    id: 'articulo-obligaciones-hostigamiento',
    name: 'Obligaciones del empleador frente al hostigamiento sexual',
    url: 'https://lpderecho.pe/obligaciones-empleador-hostigamiento-sexual-laboral-sector-privado/',
    rango: 'articulo',
    fechaPublicacion: '2022-11-20',
    materias: ['laboral', 'hostigamiento sexual', 'empleador'],
    sumilla: 'Obligaciones del empleador ante hostigamiento',
  },
  // Jurisprudencia hostigamiento
  {
    id: 'articulo-jurisprudencia-hostigamiento',
    name: 'Jurisprudencia relevante sobre hostigamiento sexual laboral',
    url: 'https://lpderecho.pe/jurisprudencia-hostigamiento-sexual-laboral/',
    rango: 'jurisprudencia',
    fechaPublicacion: '2023-05-10',
    materias: ['laboral', 'hostigamiento sexual', 'jurisprudencia'],
    sumilla: 'Compilación de jurisprudencia sobre hostigamiento',
  },
  // Plazos hostigamiento
  {
    id: 'articulo-plazos-hostigamiento',
    name: 'Plazos en el procedimiento de hostigamiento sexual laboral',
    url: 'https://lpderecho.pe/cuales-todos-plazos-procedimiento-investigacion-sancion-hostigamiento-sexual-laboral/',
    rango: 'articulo',
    fechaPublicacion: '2023-06-05',
    materias: ['laboral', 'hostigamiento sexual', 'plazos'],
    sumilla: 'Plazos del procedimiento de hostigamiento sexual',
  },
  // Gratificaciones análisis
  {
    id: 'articulo-gratificaciones',
    name: 'Gratificación: qué es, cuándo se paga y cómo calcularla',
    url: 'https://lpderecho.pe/gratificaciones-laborales-concepto-calculo/',
    rango: 'articulo',
    fechaPublicacion: '2023-07-01',
    materias: ['laboral', 'gratificaciones', 'análisis'],
    sumilla: 'Guía completa sobre gratificaciones',
  },
  // Beneficios sociales liquidación
  {
    id: 'articulo-liquidacion-beneficios',
    name: 'Cómo calcular una liquidación de beneficios sociales',
    url: 'https://lpderecho.pe/como-calcular-liquidacion-beneficios-sociales/',
    rango: 'articulo',
    fechaPublicacion: '2023-03-20',
    materias: ['laboral', 'beneficios sociales', 'liquidación'],
    sumilla: 'Guía para calcular liquidación de beneficios',
  },
]

async function fetchLawContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const html = await response.text()

  const contentMatch =
    html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:footer|div[^>]*class="[^"]*post-tags)/i) ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)

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
  let md = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<div[^>]*class="[^"]*(?:sharedaddy|jp-relatedposts|ad-|social)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
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
  console.log(`   📝 Saved: ${law.id}.md (${(markdown.length / 1024).toFixed(1)} KB)`)
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
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : error}`)
    return false
  }
}

async function main() {
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 19')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH19.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH19) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting - 12 seconds
    await new Promise((r) => setTimeout(r, 12000))
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
