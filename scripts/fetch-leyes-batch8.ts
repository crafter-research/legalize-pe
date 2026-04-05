#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 8 - URLs verificadas con delays largos
 * Usage: npx tsx scripts/fetch-leyes-batch8.ts
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

const LEYES_BATCH8: LawDefinition[] = [
  // Tercerización
  {
    id: 'ley-29245',
    name: 'Ley que regula los Servicios de Tercerización',
    url: 'https://lpderecho.pe/ley-tercerizacion-ley-29245/',
    rango: 'ley',
    fechaPublicacion: '2008-06-24',
    materias: ['laboral', 'tercerización', 'outsourcing'],
    sumilla: 'Regula la tercerización de servicios empresariales',
  },
  // Teletrabajo - Reglamento
  {
    id: 'ds-002-2023-tr',
    name: 'Reglamento de la Ley del Teletrabajo',
    url: 'https://lpderecho.pe/reglamento-de-la-ley-31572-ley-del-teletrabajo-decreto-supremo-002-2023-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2023-02-26',
    materias: ['laboral', 'teletrabajo', 'reglamento'],
    sumilla: 'Reglamenta la Ley 31572 del Teletrabajo',
  },
  // Sociedades
  {
    id: 'ley-26887',
    name: 'Ley General de Sociedades',
    url: 'https://lpderecho.pe/ley-general-sociedades-ley-26887-actualizado/',
    rango: 'ley',
    fechaPublicacion: '1997-12-09',
    materias: ['comercial', 'sociedades', 'empresas'],
    sumilla: 'Regula la constitución y funcionamiento de sociedades',
  },
  // Intermediación laboral
  {
    id: 'ley-27626',
    name: 'Ley que regula la Actividad de las Empresas Especiales de Servicios',
    url: 'https://lpderecho.pe/ley-intermediacion-laboral-ley-27626/',
    rango: 'ley',
    fechaPublicacion: '2002-01-09',
    materias: ['laboral', 'intermediación', 'services'],
    sumilla: 'Regula la intermediación laboral y cooperativas de trabajadores',
  },
  // Trabajo del hogar
  {
    id: 'ley-31047',
    name: 'Ley de las Trabajadoras y Trabajadores del Hogar',
    url: 'https://lpderecho.pe/ley-trabajadoras-trabajadores-hogar-ley-31047/',
    rango: 'ley',
    fechaPublicacion: '2020-10-01',
    materias: ['laboral', 'trabajo del hogar', 'trabajadores domésticos'],
    sumilla: 'Regula los derechos de los trabajadores del hogar',
  },
  // Trabajador agrario
  {
    id: 'ley-31110',
    name: 'Ley del Régimen Laboral Agrario',
    url: 'https://lpderecho.pe/ley-regimen-laboral-agrario-ley-31110/',
    rango: 'ley',
    fechaPublicacion: '2020-12-31',
    materias: ['laboral', 'agrario', 'agroexportación'],
    sumilla: 'Nuevo régimen laboral agrario y de incentivos',
  },
  // Negociación colectiva sector público
  {
    id: 'ley-31188',
    name: 'Ley de Negociación Colectiva en el Sector Estatal',
    url: 'https://lpderecho.pe/ley-negociacion-colectiva-sector-estatal-ley-31188/',
    rango: 'ley',
    fechaPublicacion: '2021-05-02',
    materias: ['laboral', 'función pública', 'negociación colectiva'],
    sumilla: 'Regula la negociación colectiva en el sector público',
  },
  // Sindicatos
  {
    id: 'ds-010-2003-tr',
    name: 'TUO de la Ley de Relaciones Colectivas de Trabajo',
    url: 'https://lpderecho.pe/tuo-ley-relaciones-colectivas-trabajo-decreto-supremo-010-2003-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2003-10-05',
    materias: ['laboral', 'sindicatos', 'huelga', 'negociación colectiva'],
    sumilla: 'Regula sindicatos, negociación colectiva y huelga',
  },
  // Participación en las utilidades
  {
    id: 'dleg-892',
    name: 'Participación de los Trabajadores en las Utilidades',
    url: 'https://lpderecho.pe/participacion-trabajadores-utilidades-decreto-legislativo-892/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-11-11',
    materias: ['laboral', 'utilidades', 'beneficios'],
    sumilla: 'Regula el derecho a participar en las utilidades de la empresa',
  },
  // Asignación familiar
  {
    id: 'ley-25129',
    name: 'Ley de Asignación Familiar',
    url: 'https://lpderecho.pe/ley-asignacion-familiar-ley-25129/',
    rango: 'ley',
    fechaPublicacion: '1989-12-06',
    materias: ['laboral', 'asignación familiar', 'beneficios'],
    sumilla: 'Establece el derecho a la asignación familiar',
  },
  // Licencia por paternidad
  {
    id: 'ley-30807',
    name: 'Ley de Licencia por Paternidad',
    url: 'https://lpderecho.pe/ley-licencia-paternidad-ley-30807/',
    rango: 'ley',
    fechaPublicacion: '2018-07-05',
    materias: ['laboral', 'paternidad', 'licencia'],
    sumilla: 'Establece la licencia por paternidad de 10 días',
  },
  // Licencia por maternidad
  {
    id: 'ley-26644',
    name: 'Ley de Descanso Pre y Post Natal',
    url: 'https://lpderecho.pe/ley-descanso-pre-post-natal-ley-26644/',
    rango: 'ley',
    fechaPublicacion: '1996-06-27',
    materias: ['laboral', 'maternidad', 'licencia'],
    sumilla: 'Establece el descanso pre y post natal de 98 días',
  },
  // Lactancia
  {
    id: 'ley-27240',
    name: 'Ley de Lactancia Materna',
    url: 'https://lpderecho.pe/ley-lactancia-materna-ley-27240/',
    rango: 'ley',
    fechaPublicacion: '1999-12-22',
    materias: ['laboral', 'maternidad', 'lactancia'],
    sumilla: 'Otorga permiso por lactancia a la madre trabajadora',
  },
  // Ley del Inquilino
  {
    id: 'ley-30201',
    name: 'Ley que crea el Registro de Deudores Judiciales Morosos',
    url: 'https://lpderecho.pe/ley-registro-deudores-judiciales-morosos-ley-30201/',
    rango: 'ley',
    fechaPublicacion: '2014-05-28',
    materias: ['civil', 'arrendamiento', 'desalojo'],
    sumilla: 'Crea el REDJUM y facilita el desalojo de inquilinos morosos',
  },
  // Propiedad horizontal
  {
    id: 'ley-27157',
    name: 'Ley de Regularización de Edificaciones',
    url: 'https://lpderecho.pe/ley-regularizacion-edificaciones-ley-27157/',
    rango: 'ley',
    fechaPublicacion: '1999-07-20',
    materias: ['civil', 'propiedad', 'edificaciones', 'regularización'],
    sumilla: 'Regula la regularización de edificaciones y propiedad horizontal',
  },
  // Garantías hipotecarias
  {
    id: 'ley-28698',
    name: 'Ley que facilita la Constitución y Ejecución de Garantías',
    url: 'https://lpderecho.pe/ley-facilita-constitucion-ejecucion-garantias-ley-28698/',
    rango: 'ley',
    fechaPublicacion: '2006-03-22',
    materias: ['civil', 'garantías', 'hipoteca'],
    sumilla: 'Facilita la constitución y ejecución de garantías hipotecarias',
  },
  // Prescripción adquisitiva
  {
    id: 'ley-27333',
    name: 'Ley Complementaria a la Ley de Regularización de Edificaciones',
    url: 'https://lpderecho.pe/ley-complementaria-regularizacion-edificaciones-ley-27333/',
    rango: 'ley',
    fechaPublicacion: '2000-07-30',
    materias: ['civil', 'propiedad', 'prescripción'],
    sumilla: 'Complementa la Ley 27157 sobre prescripción adquisitiva',
  },
  // Arbitraje de consumo
  {
    id: 'ds-046-2011-pcm',
    name: 'Reglamento del Sistema de Arbitraje de Consumo',
    url: 'https://lpderecho.pe/reglamento-sistema-arbitraje-consumo-decreto-supremo-046-2011-pcm/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2011-05-24',
    materias: ['consumidor', 'arbitraje', 'INDECOPI'],
    sumilla: 'Regula el arbitraje para controversias de consumo',
  },
  // Libro de reclamaciones
  {
    id: 'ds-011-2011-pcm',
    name: 'Reglamento del Libro de Reclamaciones',
    url: 'https://lpderecho.pe/reglamento-libro-reclamaciones-decreto-supremo-011-2011-pcm/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2011-02-19',
    materias: ['consumidor', 'reclamaciones', 'INDECOPI'],
    sumilla: 'Regula el libro de reclamaciones para proveedores',
  },
  // Ley Antimonopolio
  {
    id: 'ley-31112',
    name: 'Ley de Control de Concentraciones Empresariales',
    url: 'https://lpderecho.pe/ley-control-concentraciones-empresariales-ley-31112/',
    rango: 'ley',
    fechaPublicacion: '2021-01-07',
    materias: ['competencia', 'fusiones', 'INDECOPI'],
    sumilla: 'Control previo de fusiones y adquisiciones empresariales',
  },
  // Rondas campesinas
  {
    id: 'ley-27908',
    name: 'Ley de Rondas Campesinas',
    url: 'https://lpderecho.pe/ley-rondas-campesinas-ley-27908/',
    rango: 'ley',
    fechaPublicacion: '2003-01-07',
    materias: ['constitucional', 'rondas campesinas', 'justicia comunal'],
    sumilla: 'Reconoce a las rondas campesinas como organizaciones autónomas',
  },
  // Consulta previa
  {
    id: 'ley-29785',
    name: 'Ley del Derecho a la Consulta Previa a los Pueblos Indígenas',
    url: 'https://lpderecho.pe/ley-consulta-previa-pueblos-indigenas-ley-29785/',
    rango: 'ley',
    fechaPublicacion: '2011-09-07',
    materias: ['constitucional', 'pueblos indígenas', 'consulta previa'],
    sumilla: 'Regula el derecho de consulta previa a pueblos indígenas',
  },
  // Migraciones
  {
    id: 'dleg-1350',
    name: 'Decreto Legislativo de Migraciones',
    url: 'https://lpderecho.pe/decreto-legislativo-migraciones-decreto-legislativo-1350/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2017-01-07',
    materias: ['migraciones', 'extranjería', 'MIGRACIONES'],
    sumilla: 'Regula el ingreso, permanencia y salida de extranjeros',
  },
  // Refugiados
  {
    id: 'ley-27891',
    name: 'Ley del Refugiado',
    url: 'https://lpderecho.pe/ley-refugiado-ley-27891/',
    rango: 'ley',
    fechaPublicacion: '2002-12-22',
    materias: ['migraciones', 'refugiados', 'asilo'],
    sumilla: 'Establece el estatuto del refugiado en el Perú',
  },
  // Nacionalidad
  {
    id: 'ley-26574',
    name: 'Ley de Nacionalidad',
    url: 'https://lpderecho.pe/ley-nacionalidad-ley-26574/',
    rango: 'ley',
    fechaPublicacion: '1996-01-11',
    materias: ['constitucional', 'nacionalidad', 'ciudadanía'],
    sumilla: 'Regula la adquisición y pérdida de la nacionalidad peruana',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 8')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH8.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH8) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting - 8 seconds to avoid 403
    await new Promise((r) => setTimeout(r, 8000))
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
