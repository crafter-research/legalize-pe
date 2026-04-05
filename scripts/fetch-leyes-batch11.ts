#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 11 - Leyes de transparencia, control y datos
 * Usage: npx tsx scripts/fetch-leyes-batch11.ts
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

const LEYES_BATCH11: LawDefinition[] = [
  // Transparencia
  {
    id: 'ley-27806-tuo',
    name: 'TUO de la Ley de Transparencia y Acceso a la Información Pública',
    url: 'https://lpderecho.pe/tuo-ley-transparencia-acceso-informacion-publica-ley-27806-actualizada/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2019-12-11',
    materias: [
      'transparencia',
      'acceso a la información',
      'administración pública',
    ],
    sumilla: 'Promueve la transparencia de los actos del Estado',
  },
  // Reglamento transparencia
  {
    id: 'ds-007-2024-jus',
    name: 'Reglamento de la Ley de Transparencia y Acceso a la Información Pública',
    url: 'https://lpderecho.pe/nuevo-reglamento-ley-transparencia-acceso-informacion-publica-decreto-supremo-007-2024-jus/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2024-05-16',
    materias: ['transparencia', 'reglamento', 'procedimiento'],
    sumilla: 'Reglamenta la Ley de Transparencia',
  },
  // Derecho de Autor
  {
    id: 'dleg-822',
    name: 'Ley sobre el Derecho de Autor',
    url: 'https://lpderecho.pe/ley-sobre-derecho-autor-decreto-legislativo-822-actualizada/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-04-24',
    materias: ['propiedad intelectual', 'derechos de autor', 'INDECOPI'],
    sumilla: 'Protege las obras literarias y artísticas',
  },
  // LOPE
  {
    id: 'ley-29158',
    name: 'Ley Orgánica del Poder Ejecutivo',
    url: 'https://lpderecho.pe/ley-organica-poder-ejecutivo-ley-29158-actualizado/',
    rango: 'ley-organica',
    fechaPublicacion: '2007-12-20',
    materias: ['organización del estado', 'poder ejecutivo', 'ministerios'],
    sumilla: 'Regula la organización del Poder Ejecutivo',
  },
  // Código Procesal Constitucional
  {
    id: 'ley-31307',
    name: 'Nuevo Código Procesal Constitucional',
    url: 'https://lpderecho.pe/codigo-procesal-constitucional-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2021-07-23',
    materias: ['procesal', 'constitucional', 'amparo', 'habeas corpus'],
    sumilla: 'Regula los procesos constitucionales',
  },
  // Carrera administrativa
  {
    id: 'dleg-276',
    name: 'Ley de Bases de la Carrera Administrativa',
    url: 'https://lpderecho.pe/ley-bases-carrera-administrativa-decreto-legislativo-276/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1984-03-24',
    materias: [
      'función pública',
      'carrera administrativa',
      'servidores públicos',
    ],
    sumilla: 'Regula la carrera administrativa del sector público',
  },
  // Reglamento carrera administrativa
  {
    id: 'ds-005-90-pcm',
    name: 'Reglamento de la Ley de Carrera Administrativa',
    url: 'https://lpderecho.pe/reglamento-ley-carrera-administrativa-decreto-legislativo-276-decreto-supremo-05-90-pcm/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1990-01-18',
    materias: ['función pública', 'reglamento', 'carrera administrativa'],
    sumilla: 'Reglamenta el D.Leg. 276',
  },
  // Presupuesto 2026
  {
    id: 'ley-32513',
    name: 'Ley de Presupuesto del Sector Público para el Año Fiscal 2026',
    url: 'https://lpderecho.pe/ley-32513-ley-presupuesto-sector-publico-ano-fiscal-2026/',
    rango: 'ley',
    fechaPublicacion: '2025-12-08',
    materias: ['presupuesto', 'hacienda pública', 'MEF'],
    sumilla: 'Aprueba el presupuesto del sector público 2026',
  },
  // Equilibrio financiero
  {
    id: 'ley-32514',
    name: 'Ley de Equilibrio Financiero del Presupuesto del Sector Público 2026',
    url: 'https://lpderecho.pe/ley-32514-ley-equilibrio-financiero-presupuesto-sector-publico-2026/',
    rango: 'ley',
    fechaPublicacion: '2025-12-08',
    materias: ['presupuesto', 'equilibrio financiero', 'MEF'],
    sumilla: 'Establece el equilibrio financiero del presupuesto 2026',
  },
  // Protección de datos
  {
    id: 'ley-29733',
    name: 'Ley de Protección de Datos Personales',
    url: 'https://lpderecho.pe/ley-proteccion-datos-personales-ley-29733-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2011-07-03',
    materias: ['datos personales', 'privacidad', 'MINJUS'],
    sumilla: 'Protege el tratamiento de datos personales',
  },
  // Reglamento datos personales
  {
    id: 'ds-016-2024-jus',
    name: 'Reglamento de la Ley de Protección de Datos Personales',
    url: 'https://lpderecho.pe/reglamento-ley-proteccion-datos-personales-decreto-supremo-016-2024-jus/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2024-11-30',
    materias: ['datos personales', 'reglamento', 'privacidad'],
    sumilla: 'Reglamenta la Ley 29733',
  },
  // Modificación sistema financiero
  {
    id: 'dleg-1531',
    name: 'Decreto Legislativo que modifica la Ley del Sistema Financiero',
    url: 'https://lpderecho.pe/modifican-ley-general-sistema-financiero-sistema-seguros-decreto-legislativo-1531/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2022-03-19',
    materias: ['financiero', 'banca', 'SBS'],
    sumilla: 'Modifica la Ley 26702 del sistema financiero',
  },
  // Defensoría del Pueblo fortalecimiento
  {
    id: 'ley-32028',
    name: 'Ley que fortalece la Defensoría del Pueblo',
    url: 'https://lpderecho.pe/ley-32028-defensor-pueblo-facultad-nombrar-defensores-adjuntos/',
    rango: 'ley',
    fechaPublicacion: '2024-05-18',
    materias: ['defensoría', 'derechos fundamentales'],
    sumilla: 'Fortalece institucionalmente a la Defensoría del Pueblo',
  },
  // Modernización de la gestión
  {
    id: 'dleg-1554',
    name: 'Decreto Legislativo que modifica la Ley Marco de Modernización del Estado',
    url: 'https://lpderecho.pe/modifican-ley-marco-modernizacion-gestion-estado-decreto-legislativo-1554/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2023-05-11',
    materias: ['modernización', 'gestión pública', 'PCM'],
    sumilla: 'Modifica la Ley 27658 de modernización',
  },
  // Continuidad Contralor
  {
    id: 'ley-32073',
    name: 'Ley sobre continuidad del Contralor General',
    url: 'https://lpderecho.pe/aprueban-ley-contralor-continuidad-funciones-hasta-designacion-nuevo/',
    rango: 'ley',
    fechaPublicacion: '2024-06-27',
    materias: ['control', 'contraloría', 'función pública'],
    sumilla: 'Dispone continuidad del Contralor hasta designación de uno nuevo',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 11')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH11.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH11) {
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
