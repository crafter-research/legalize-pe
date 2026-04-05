#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 22 - Verified URLs from LP Derecho
 * Usage: npx tsx scripts/fetch-leyes-batch22.ts
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

const LEYES_BATCH22: LawDefinition[] = [
  // Laboral - URLs verificadas
  {
    id: 'ley-32155',
    name: 'Ley que modifica la Nueva Ley Procesal del Trabajo',
    url: 'https://lpderecho.pe/ley-32155-modifican-nueva-ley-procesal-trabajo-garantizar-acceso-justicia-laboral/',
    rango: 'ley',
    fechaPublicacion: '2024-08-15',
    materias: ['laboral', 'procesal laboral', 'justicia'],
    sumilla: 'Modifica Ley Procesal del Trabajo para garantizar acceso a justicia laboral',
  },
  {
    id: 'articulo-proceso-ordinario-laboral',
    name: 'El proceso ordinario laboral en la nueva ley procesal del trabajo',
    url: 'https://lpderecho.pe/proceso-ordinario-laboral-nueva-ley-procesal-trabajo/',
    rango: 'articulo',
    fechaPublicacion: '2023-06-10',
    materias: ['laboral', 'procesal laboral', 'proceso ordinario'],
    sumilla: 'Análisis del proceso ordinario laboral',
  },
  {
    id: 'articulo-principios-relacion-laboral',
    name: 'Jurisprudencia del artículo 26 de la Constitución - Principios de la relación laboral',
    url: 'https://lpderecho.pe/articulo-26-constitucion-principios-que-regulan-la-relacion-laboral/',
    rango: 'articulo',
    fechaPublicacion: '2023-05-20',
    materias: ['laboral', 'constitucional', 'principios'],
    sumilla: 'Jurisprudencia sobre principios que regulan la relación laboral',
  },
  {
    id: 'ds-078-2025-pcm',
    name: 'Reglamento de la Ley que promueve el empleo de jóvenes técnicos y profesionales',
    url: 'https://lpderecho.pe/reglamento-ley-promueve-empleo-jovenes-tecnicos-profesionales-sector-publico-decreto-supremo-078-2025-pcm/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2025-06-15',
    materias: ['laboral', 'empleo juvenil', 'sector público'],
    sumilla: 'Reglamento de empleo de jóvenes en sector público',
  },
  {
    id: 'articulo-introduccion-procesal-laboral',
    name: 'Introducción al derecho procesal laboral peruano',
    url: 'https://lpderecho.pe/introduccion-al-derecho-procesal-laboral-peruano/',
    rango: 'articulo',
    fechaPublicacion: '2023-04-15',
    materias: ['laboral', 'procesal laboral', 'introducción'],
    sumilla: 'Introducción a instituciones del proceso laboral peruano',
  },
  {
    id: 'res-0385-2026-sunafil',
    name: 'No todo accidente laboral es responsabilidad del empleador',
    url: 'https://lpderecho.pe/accidente-laboral-responsabilidad-del-empleador-resolucion-0385-2026-sunafil-tfl-primera-sala/',
    rango: 'resolucion',
    fechaPublicacion: '2026-02-20',
    materias: ['laboral', 'accidente laboral', 'Sunafil'],
    sumilla: 'Resolución sobre responsabilidad en accidentes laborales',
  },
  // Penal - URLs verificadas
  {
    id: 'articulo-justicia-penal-titulo-preliminar',
    name: 'Jurisprudencia del artículo I del Código Procesal Penal - Justicia Penal',
    url: 'https://lpderecho.pe/articulo-i-codigo-procesal-penal-justicia-penal/',
    rango: 'articulo',
    fechaPublicacion: '2023-07-10',
    materias: ['penal', 'procesal penal', 'título preliminar'],
    sumilla: 'Jurisprudencia sobre justicia penal - Título Preliminar',
  },
  {
    id: 'articulo-finalidad-preventiva-codigo-penal',
    name: 'Jurisprudencia del artículo I del Código Penal - Finalidad Preventiva',
    url: 'https://lpderecho.pe/articulo-i-codigo-penal-objeto-codigo/',
    rango: 'articulo',
    fechaPublicacion: '2023-06-15',
    materias: ['penal', 'título preliminar', 'finalidad'],
    sumilla: 'Jurisprudencia sobre finalidad preventiva del Código Penal',
  },
  {
    id: 'articulo-accion-penal',
    name: 'Jurisprudencia del artículo 1 del Código Procesal Penal - Acción Penal',
    url: 'https://lpderecho.pe/articulo-1-codigo-procesal-penal-accion-penal/',
    rango: 'articulo',
    fechaPublicacion: '2023-08-05',
    materias: ['penal', 'procesal penal', 'acción penal'],
    sumilla: 'Jurisprudencia sobre la acción penal',
  },
  {
    id: 'articulo-inimputabilidad',
    name: 'Jurisprudencia del artículo 20 del Código Penal - Inimputabilidad',
    url: 'https://lpderecho.pe/articulo-20-codigo-penal-inimputabilidad/',
    rango: 'articulo',
    fechaPublicacion: '2023-09-01',
    materias: ['penal', 'inimputabilidad', 'culpabilidad'],
    sumilla: 'Jurisprudencia sobre causales de inimputabilidad',
  },
  {
    id: 'articulo-clases-pena',
    name: 'Jurisprudencia del artículo 28 del Código Penal - Clases de Pena',
    url: 'https://lpderecho.pe/articulo-28-codigo-penal-clases-pena/',
    rango: 'articulo',
    fechaPublicacion: '2023-09-15',
    materias: ['penal', 'penas', 'clases de pena'],
    sumilla: 'Jurisprudencia sobre las clases de pena',
  },
  {
    id: 'articulo-suspension-pena',
    name: 'Jurisprudencia del artículo 57 del Código Penal - Suspensión de Pena',
    url: 'https://lpderecho.pe/articulo-57-codigo-penal-requisitos/',
    rango: 'articulo',
    fechaPublicacion: '2023-10-01',
    materias: ['penal', 'suspensión de pena', 'requisitos'],
    sumilla: 'Jurisprudencia sobre suspensión de ejecución de pena',
  },
  {
    id: 'articulo-fines-pena',
    name: 'Jurisprudencia del artículo IX del Código Penal - Fines de la Pena',
    url: 'https://lpderecho.pe/articulo-ix-codigo-penal-fines-pena-medidas-seguridad-titulo-preliminar/',
    rango: 'articulo',
    fechaPublicacion: '2023-10-15',
    materias: ['penal', 'fines de la pena', 'título preliminar'],
    sumilla: 'Jurisprudencia sobre fines de la pena y medidas de seguridad',
  },
  {
    id: 'articulo-estafa',
    name: 'Jurisprudencia del artículo 196 del Código Penal - Estafa',
    url: 'https://lpderecho.pe/articulo-196-codigo-penal-estafa/',
    rango: 'articulo',
    fechaPublicacion: '2023-11-01',
    materias: ['penal', 'estafa', 'delitos patrimoniales'],
    sumilla: 'Jurisprudencia sobre el delito de estafa',
  },
  // Civil - URLs verificadas
  {
    id: 'articulo-personas-juridicas-especiales',
    name: 'Jurisprudencia del artículo 2026 del Código Civil - Personas jurídicas especiales',
    url: 'https://lpderecho.pe/articulo-2026-del-codigo-civil-personas-juridicas-regidas-por-leyes-especiales/',
    rango: 'articulo',
    fechaPublicacion: '2023-07-20',
    materias: ['civil', 'personas jurídicas', 'registral'],
    sumilla: 'Jurisprudencia sobre personas jurídicas regidas por leyes especiales',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 22')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH22.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH22) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting - 15 seconds to avoid 403
    await new Promise((r) => setTimeout(r, 15000))
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
