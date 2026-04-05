#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 6 - URLs verificadas adicionales
 * Usage: npx tsx scripts/fetch-leyes-batch6.ts
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

const LEYES_BATCH6: LawDefinition[] = [
  // Código de Niños y Adolescentes - URL correcta
  {
    id: 'ley-27337',
    name: 'Código de los Niños y Adolescentes',
    url: 'https://lpderecho.pe/codigo-ninos-adolescentes-ley-27337-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2000-08-07',
    materias: ['familia', 'menores', 'derechos del niño'],
    sumilla: 'Código que protege los derechos de niños, niñas y adolescentes',
  },
  // Código de Responsabilidad Penal de Adolescentes
  {
    id: 'dleg-1348',
    name: 'Código de Responsabilidad Penal de Adolescentes',
    url: 'https://lpderecho.pe/codigo-de-responsabilidad-penal-de-adolescentes-actualizado/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2017-01-07',
    materias: ['penal', 'menores', 'justicia penal juvenil'],
    sumilla:
      'Regula el sistema de responsabilidad penal de adolescentes infractores',
  },
  // Seguridad y Salud en el Trabajo
  {
    id: 'ley-29783',
    name: 'Ley de Seguridad y Salud en el Trabajo',
    url: 'https://lpderecho.pe/ley-seguridad-salud-trabajo-ley-29783-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2011-08-20',
    materias: ['laboral', 'seguridad', 'salud ocupacional'],
    sumilla: 'Promueve una cultura de prevención de riesgos laborales',
  },
  {
    id: 'ds-005-2012-tr',
    name: 'Reglamento de la Ley de Seguridad y Salud en el Trabajo',
    url: 'https://lpderecho.pe/reglamento-ley-seguridad-salud-trabajo-ley-decreto-supremo-005-2012-tr-actualizado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2012-04-25',
    materias: ['laboral', 'seguridad', 'reglamento'],
    sumilla: 'Reglamenta la Ley 29783 de seguridad y salud en el trabajo',
  },
  // Hostigamiento Sexual
  {
    id: 'ley-27942',
    name: 'Ley de Prevención y Sanción del Hostigamiento Sexual',
    url: 'https://lpderecho.pe/ley-prevencion-sancion-hostigamiento-sexual-ley-27942/',
    rango: 'ley',
    fechaPublicacion: '2003-02-27',
    materias: ['laboral', 'género', 'hostigamiento sexual'],
    sumilla:
      'Previene y sanciona el hostigamiento sexual en relaciones de autoridad',
  },
  {
    id: 'ds-014-2019-mimp',
    name: 'Reglamento de la Ley de Hostigamiento Sexual',
    url: 'https://lpderecho.pe/reglamento-ley-prevencion-sancion-hostigamiento-sexual-decreto-supremo-014-2019-mimp/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2019-07-22',
    materias: ['laboral', 'género', 'reglamento'],
    sumilla: 'Reglamenta la Ley 27942 de prevención del hostigamiento sexual',
  },
  // Arbitraje - URL alternativa
  {
    id: 'dleg-1071',
    name: 'Decreto Legislativo que norma el Arbitraje',
    url: 'https://lpderecho.pe/decreto-legislativo-1071-ley-arbitraje/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-28',
    materias: ['arbitraje', 'MARC', 'resolución de conflictos'],
    sumilla:
      'Ley de Arbitraje vigente que regula el arbitraje nacional e internacional',
  },
  // Protección de Datos Personales - URL alternativa
  {
    id: 'ley-29733',
    name: 'Ley de Protección de Datos Personales',
    url: 'https://lpderecho.pe/ley-proteccion-datos-personales-ley-29733/',
    rango: 'ley',
    fechaPublicacion: '2011-07-03',
    materias: ['digital', 'datos personales', 'privacidad'],
    sumilla:
      'Protege el derecho fundamental de las personas a sus datos personales',
  },
  // Habeas Corpus
  {
    id: 'ley-23506',
    name: 'Ley de Hábeas Corpus y Amparo',
    url: 'https://lpderecho.pe/ley-habeas-corpus-amparo-ley-23506/',
    rango: 'ley',
    fechaPublicacion: '1982-12-08',
    materias: ['constitucional', 'habeas corpus', 'amparo'],
    sumilla:
      'Regulaba los procesos de habeas corpus y amparo (derogada por CPC)',
  },
  // Ley del Ministerio Público
  {
    id: 'dleg-052',
    name: 'Ley Orgánica del Ministerio Público',
    url: 'https://lpderecho.pe/ley-organica-ministerio-publico-actualizada/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1981-03-18',
    materias: ['ministerio público', 'fiscalía', 'justicia'],
    sumilla: 'Regula la organización y funciones del Ministerio Público',
  },
  // Ley de la PNP
  {
    id: 'dleg-1267',
    name: 'Ley de la Policía Nacional del Perú',
    url: 'https://lpderecho.pe/ley-policia-nacional-peru-decreto-legislativo-1267/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2016-12-18',
    materias: ['PNP', 'seguridad ciudadana', 'policía'],
    sumilla:
      'Regula la organización y funciones de la Policía Nacional del Perú',
  },
  // Ley Marco del Empleo Público
  {
    id: 'ley-28175',
    name: 'Ley Marco del Empleo Público',
    url: 'https://lpderecho.pe/ley-marco-empleo-publico-ley-28175/',
    rango: 'ley',
    fechaPublicacion: '2004-02-19',
    materias: ['función pública', 'empleo público', 'servicio civil'],
    sumilla: 'Establece los lineamientos generales del empleo público',
  },
  // Carrera Administrativa
  {
    id: 'dleg-276',
    name: 'Ley de Bases de la Carrera Administrativa',
    url: 'https://lpderecho.pe/decreto-legislativo-276-ley-bases-carrera-administrativa-remuneraciones-sector-publico/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1984-03-24',
    materias: ['función pública', 'carrera administrativa', 'remuneraciones'],
    sumilla:
      'Establece las bases de la carrera administrativa y remuneraciones',
  },
  // Ley de Control Interno
  {
    id: 'ley-28716',
    name: 'Ley de Control Interno de las Entidades del Estado',
    url: 'https://lpderecho.pe/ley-control-interno-entidades-estado-ley-28716/',
    rango: 'ley',
    fechaPublicacion: '2006-04-18',
    materias: ['control gubernamental', 'control interno', 'anticorrupción'],
    sumilla: 'Establece normas para el control interno en entidades públicas',
  },
  // Ley de Contrataciones del Estado
  {
    id: 'ley-30225',
    name: 'Ley de Contrataciones del Estado',
    url: 'https://lpderecho.pe/ley-30225-ley-contrataciones-del-estado/',
    rango: 'ley',
    fechaPublicacion: '2014-07-11',
    materias: ['contrataciones', 'estado', 'OSCE'],
    sumilla: 'Ley original de contrataciones del Estado (antes del TUO)',
  },
  // Ley del Sistema Nacional de Presupuesto
  {
    id: 'dleg-1440',
    name: 'Decreto Legislativo del Sistema Nacional de Presupuesto Público',
    url: 'https://lpderecho.pe/decreto-legislativo-sistema-nacional-presupuesto-publico-decreto-legislativo-1440/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-16',
    materias: ['presupuesto', 'finanzas públicas', 'MEF'],
    sumilla: 'Regula el Sistema Nacional de Presupuesto Público',
  },
  // Ley de Endeudamiento del Sector Público
  {
    id: 'dleg-1437',
    name: 'Decreto Legislativo del Sistema Nacional de Endeudamiento Público',
    url: 'https://lpderecho.pe/decreto-legislativo-del-sistema-nacional-de-endeudamiento-publico-decreto-legislativo-1437/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-16',
    materias: ['endeudamiento', 'finanzas públicas', 'deuda pública'],
    sumilla: 'Regula el Sistema Nacional de Endeudamiento Público',
  },
  // Ley del Sistema Nacional de Tesorería
  {
    id: 'dleg-1441',
    name: 'Decreto Legislativo del Sistema Nacional de Tesorería',
    url: 'https://lpderecho.pe/decreto-legislativo-del-sistema-nacional-de-tesoreria-decreto-legislativo-1441/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-16',
    materias: ['tesorería', 'finanzas públicas', 'gestión de fondos'],
    sumilla: 'Regula el Sistema Nacional de Tesorería',
  },
  // Ley del Sistema Nacional de Contabilidad
  {
    id: 'dleg-1438',
    name: 'Decreto Legislativo del Sistema Nacional de Contabilidad',
    url: 'https://lpderecho.pe/decreto-legislativo-del-sistema-nacional-de-contabilidad-decreto-legislativo-1438/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-16',
    materias: ['contabilidad', 'finanzas públicas', 'cuenta general'],
    sumilla: 'Regula el Sistema Nacional de Contabilidad',
  },
  // Ley de Gestión Fiscal de los Recursos Humanos
  {
    id: 'dleg-1442',
    name: 'Decreto Legislativo de la Gestión Fiscal de los Recursos Humanos',
    url: 'https://lpderecho.pe/decreto-legislativo-gestion-fiscal-recursos-humanos-sector-publico-decreto-legislativo-1442/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-16',
    materias: ['recursos humanos', 'finanzas públicas', 'planillas'],
    sumilla:
      'Regula la gestión fiscal de recursos humanos en el sector público',
  },
  // Ley de Inversión Pública
  {
    id: 'dleg-1252',
    name: 'Decreto Legislativo del Sistema Nacional de Programación Multianual',
    url: 'https://lpderecho.pe/decreto-legislativo-sistema-nacional-programacion-multianual-gestion-inversiones-decreto-legislativo-1252/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2016-12-01',
    materias: ['inversión pública', 'proyectos', 'invierte.pe'],
    sumilla:
      'Crea el Sistema Nacional de Programación Multianual (Invierte.pe)',
  },
  // Ley de Simplificación Administrativa
  {
    id: 'ley-27444',
    name: 'Ley del Procedimiento Administrativo General',
    url: 'https://lpderecho.pe/ley-procedimiento-administrativo-27444/',
    rango: 'ley',
    fechaPublicacion: '2001-04-11',
    materias: ['administrativo', 'procedimiento', 'silencio administrativo'],
    sumilla: 'Ley original del procedimiento administrativo general',
  },
  // Código de Ética de la Función Pública
  {
    id: 'ley-27815',
    name: 'Ley del Código de Ética de la Función Pública',
    url: 'https://lpderecho.pe/ley-codigo-etica-funcion-publica-ley-27815/',
    rango: 'ley',
    fechaPublicacion: '2002-08-13',
    materias: ['función pública', 'ética', 'integridad'],
    sumilla: 'Establece principios y deberes éticos de los servidores públicos',
  },
  // Ley de Nepotismo
  {
    id: 'ley-26771',
    name: 'Ley de Nepotismo',
    url: 'https://lpderecho.pe/ley-nepotismo-ley-26771/',
    rango: 'ley',
    fechaPublicacion: '1997-04-15',
    materias: ['función pública', 'nepotismo', 'anticorrupción'],
    sumilla: 'Prohibe el nepotismo en las contrataciones del Estado',
  },
  // Ley Universitaria
  {
    id: 'ley-30220',
    name: 'Ley Universitaria',
    url: 'https://lpderecho.pe/ley-universitaria-ley-30220-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2014-07-09',
    materias: ['educación', 'universidades', 'SUNEDU'],
    sumilla:
      'Regula la creación, funcionamiento y supervisión de universidades',
  },
  // Ley General de Educación
  {
    id: 'ley-28044',
    name: 'Ley General de Educación',
    url: 'https://lpderecho.pe/ley-general-educacion-ley-28044/',
    rango: 'ley',
    fechaPublicacion: '2003-07-29',
    materias: ['educación', 'sistema educativo', 'MINEDU'],
    sumilla: 'Establece los lineamientos generales de la educación',
  },
  // Ley del SINEACE
  {
    id: 'ley-28740',
    name: 'Ley del Sistema Nacional de Evaluación de la Calidad Educativa',
    url: 'https://lpderecho.pe/ley-sistema-nacional-evaluacion-acreditacion-certificacion-calidad-educativa-ley-28740/',
    rango: 'ley',
    fechaPublicacion: '2006-05-19',
    materias: ['educación', 'acreditación', 'SINEACE'],
    sumilla: 'Crea el Sistema Nacional de Evaluación de la Calidad Educativa',
  },
  // Ley del Artista
  {
    id: 'ley-28131',
    name: 'Ley del Artista Intérprete y Ejecutante',
    url: 'https://lpderecho.pe/ley-artista-interprete-ejecutante-ley-28131/',
    rango: 'ley',
    fechaPublicacion: '2003-12-19',
    materias: ['laboral', 'cultura', 'artistas'],
    sumilla: 'Reconoce los derechos de los artistas intérpretes y ejecutantes',
  },
  // Ley de Modalidades Formativas Laborales
  {
    id: 'ley-28518',
    name: 'Ley sobre Modalidades Formativas Laborales',
    url: 'https://lpderecho.pe/ley-modalidades-formativas-laborales-ley-28518/',
    rango: 'ley',
    fechaPublicacion: '2005-05-24',
    materias: ['laboral', 'formación laboral', 'prácticas'],
    sumilla:
      'Regula las prácticas preprofesionales y otras modalidades formativas',
  },
  // Ley de la Persona con Discapacidad
  {
    id: 'ley-29973',
    name: 'Ley General de la Persona con Discapacidad',
    url: 'https://lpderecho.pe/ley-general-persona-discapacidad-ley-29973/',
    rango: 'ley',
    fechaPublicacion: '2012-12-24',
    materias: ['discapacidad', 'inclusión', 'derechos'],
    sumilla:
      'Establece el marco legal para la inclusión de personas con discapacidad',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 6')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH6.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH6) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting - 5 seconds to avoid 403
    await new Promise((r) => setTimeout(r, 5000))
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
