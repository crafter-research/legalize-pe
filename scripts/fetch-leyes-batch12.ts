#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 12 - Leyes laborales, familia y penitenciarias
 * Usage: npx tsx scripts/fetch-leyes-batch12.ts
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

const LEYES_BATCH12: LawDefinition[] = [
  // Trabajadores del hogar
  {
    id: 'ley-27986',
    name: 'Ley de los Trabajadores del Hogar',
    url: 'https://lpderecho.pe/ley-trabajadores-hogar-reglamento-ley-27986-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2003-06-03',
    materias: ['laboral', 'trabajadores del hogar', 'derechos laborales'],
    sumilla: 'Regula las relaciones laborales de trabajadores del hogar',
  },
  // Nueva ley trabajadoras del hogar
  {
    id: 'ley-31047',
    name: 'Ley de las Trabajadoras y Trabajadores del Hogar',
    url: 'https://lpderecho.pe/congreso-aprueba-ley-trabajadora-hogar/',
    rango: 'ley',
    fechaPublicacion: '2020-10-01',
    materias: ['laboral', 'trabajadores del hogar', 'beneficios sociales'],
    sumilla: 'Reconoce gratificaciones, CTS y otros derechos',
  },
  // Violencia contra la mujer TUO
  {
    id: 'ds-004-2020-mimp',
    name: 'TUO de la Ley para prevenir y erradicar la violencia contra las mujeres',
    url: 'https://lpderecho.pe/ley-para-prevenir-sancionar-y-erradicar-la-violencia-contra-las-mujeres-y-los-integrantes-del-grupo-familiar-ley-30364/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2020-09-06',
    materias: ['violencia', 'mujer', 'familia', 'MIMP'],
    sumilla: 'TUO de la Ley 30364 sobre violencia contra la mujer',
  },
  // Reglamento Ley 30364
  {
    id: 'ds-009-2016-mimp',
    name: 'Reglamento de la Ley para prevenir y erradicar la violencia contra las mujeres',
    url: 'https://lpderecho.pe/reglamento-ley-30364-prevenir-sancionar-erradicar-violencia-mujeres-integrantes-grupo-familiar-decreto-supremo-009-2016-mimp/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2016-07-27',
    materias: ['violencia', 'reglamento', 'mujer', 'familia'],
    sumilla: 'Reglamenta la Ley 30364',
  },
  // Ley bullying
  {
    id: 'ley-31902',
    name: 'Ley que fortalece la prevención del acoso escolar',
    url: 'https://lpderecho.pe/ley-31902-fortalecen-prevencion-contra-acoso-escolar/',
    rango: 'ley',
    fechaPublicacion: '2023-10-11',
    materias: ['educación', 'bullying', 'niños', 'adolescentes'],
    sumilla: 'Fortalece medidas contra el acoso escolar',
  },
  // Feminicidio - modificación CP
  {
    id: 'ley-30819',
    name: 'Ley que modifica el Código Penal sobre delito de feminicidio',
    url: 'https://lpderecho.pe/ley-modifica-codigo-penal-codigo-ninos-adolescentes/',
    rango: 'ley',
    fechaPublicacion: '2018-07-13',
    materias: ['penal', 'feminicidio', 'violencia', 'mujer'],
    sumilla: 'Agrava el delito de feminicidio',
  },
  // Código de Ejecución Penal TUO
  {
    id: 'ds-003-2021-jus',
    name: 'TUO del Código de Ejecución Penal',
    url: 'https://lpderecho.pe/codigo-de-ejecucion-penal-decreto-legislativo-654-actualizado-2019/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2021-02-25',
    materias: ['penal', 'penitenciario', 'ejecución penal'],
    sumilla: 'TUO del Código de Ejecución Penal',
  },
  // Reglamento Código Ejecución Penal
  {
    id: 'ds-015-2003-jus',
    name: 'Reglamento del Código de Ejecución Penal',
    url: 'https://lpderecho.pe/reglamento-codigo-ejecucion-penal-actualizado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2003-09-11',
    materias: ['penal', 'penitenciario', 'reglamento'],
    sumilla: 'Reglamenta el Código de Ejecución Penal',
  },
  // Ley relaciones colectivas de trabajo TUO
  {
    id: 'ds-010-2003-tr',
    name: 'TUO de la Ley de Relaciones Colectivas de Trabajo',
    url: 'https://lpderecho.pe/texto-unico-ordenado-ley-relaciones-colectivas-trabajo-decreto-supremo-010-2003-tr-actualizado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2003-10-05',
    materias: ['laboral', 'sindicatos', 'negociación colectiva', 'huelga'],
    sumilla: 'Regula sindicatos, negociación colectiva y huelga',
  },
  // Reglamento relaciones colectivas
  {
    id: 'ds-011-92-tr',
    name: 'Reglamento de la Ley de Relaciones Colectivas de Trabajo',
    url: 'https://lpderecho.pe/reglamento-ley-relaciones-colectivas-trabajo-decreto-supremo-011-92-tr-actualizado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1992-10-15',
    materias: ['laboral', 'sindicatos', 'reglamento'],
    sumilla: 'Reglamenta la Ley de Relaciones Colectivas',
  },
  // Jornada de trabajo TUO
  {
    id: 'ds-007-2002-tr',
    name: 'TUO de la Ley de Jornada de Trabajo, Horario y Trabajo en Sobretiempo',
    url: 'https://lpderecho.pe/tuo-ley-jornada-trabajo-horario-trabajo-sobretiempo-decreto-supremo-007-2002-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2002-07-04',
    materias: ['laboral', 'jornada', 'horas extras', 'sobretiempo'],
    sumilla: 'Regula la jornada laboral y horas extras',
  },
  // Reglamento jornada de trabajo
  {
    id: 'ds-008-2002-tr',
    name: 'Reglamento de la Ley de Jornada de Trabajo',
    url: 'https://lpderecho.pe/reglamento-ley-jornada-trabajo-horario-trabajo-sobretiempo-decreto-supremo-008-2002-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2002-07-04',
    materias: ['laboral', 'jornada', 'reglamento'],
    sumilla: 'Reglamenta el TUO de jornada de trabajo',
  },
  // Adolescentes imputables penalmente
  {
    id: 'ley-32330',
    name: 'Ley que establece responsabilidad penal de adolescentes de 16 y 17 años',
    url: 'https://lpderecho.pe/ley-32330-adolescentes-sujetos-imputables-penalmente/',
    rango: 'ley',
    fechaPublicacion: '2024-11-17',
    materias: ['penal', 'adolescentes', 'responsabilidad penal'],
    sumilla: 'Establece responsabilidad penal para adolescentes',
  },
  // Modificación reglamento violencia
  {
    id: 'ds-002-2025-mimp',
    name: 'Modifican Reglamento de la Ley 30364 para fortalecer protección',
    url: 'https://lpderecho.pe/modifican-el-reglamento-de-la-ley-30364-para-fortalecer-la-proteccion-a-mujeres-y-grupos-familiares-decreto-supremo-002-2025-mimp/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2025-04-04',
    materias: ['violencia', 'reglamento', 'mujer'],
    sumilla: 'Fortalece protección a mujeres y grupos familiares',
  },
  // Código Penal actualizado
  {
    id: 'codigo-penal',
    name: 'Código Penal Peruano',
    url: 'https://lpderecho.pe/codigo-penal-peruano-actualizado/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-04-08',
    materias: ['penal', 'delitos', 'penas'],
    sumilla: 'Código Penal del Perú actualizado',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 12')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH12.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH12) {
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
