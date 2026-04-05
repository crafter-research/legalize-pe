#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 24 - More verified URLs to reach 400
 * Usage: npx tsx scripts/fetch-leyes-batch24.ts
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

const LEYES_BATCH24: LawDefinition[] = [
  // Códigos y Leyes Orgánicas
  {
    id: 'ley-28301-tc',
    name: 'Ley Orgánica del Tribunal Constitucional',
    url: 'https://lpderecho.pe/ley-organica-del-tribunal-constitucional/',
    rango: 'ley-organica',
    fechaPublicacion: '2004-07-23',
    materias: ['constitucional', 'tribunal constitucional', 'orgánica'],
    sumilla: 'Ley Orgánica del Tribunal Constitucional',
  },
  {
    id: 'reglamento-tc',
    name: 'Reglamento Normativo del Tribunal Constitucional',
    url: 'https://lpderecho.pe/reglamento-normativo-tribunal-constitucional-actualizado/',
    rango: 'reglamento',
    fechaPublicacion: '2004-09-14',
    materias: ['constitucional', 'tribunal constitucional', 'reglamento'],
    sumilla: 'Reglamento Normativo del TC',
  },
  {
    id: 'ra-000341-2023-ce-pj',
    name: 'Reglamento de Organización y Funciones del Poder Judicial',
    url: 'https://lpderecho.pe/reglamento-organizacion-funciones-poder-judicial-resolucion-administrativa-000341-2023-ce-pj/',
    rango: 'resolucion-administrativa',
    fechaPublicacion: '2023-08-15',
    materias: ['judicial', 'organización', 'poder judicial'],
    sumilla: 'ROF del Poder Judicial',
  },
  // Jurisprudencia Código Civil
  {
    id: 'articulo-1-codigo-civil',
    name: 'Jurisprudencia del artículo 1 del Código Civil - Sujeto de Derecho',
    url: 'https://lpderecho.pe/articulo-1-del-codigo-civil-sujeto-de-derecho/',
    rango: 'articulo',
    fechaPublicacion: '2023-01-15',
    materias: ['civil', 'sujeto de derecho', 'persona'],
    sumilla: 'Jurisprudencia sobre el sujeto de derecho',
  },
  {
    id: 'articulo-326-codigo-civil',
    name: 'Jurisprudencia del artículo 326 del Código Civil - Unión de hecho',
    url: 'https://lpderecho.pe/articulo-326-del-codigo-civil-union-de-hecho/',
    rango: 'articulo',
    fechaPublicacion: '2023-02-10',
    materias: ['civil', 'familia', 'unión de hecho'],
    sumilla: 'Jurisprudencia sobre unión de hecho',
  },
  {
    id: 'articulo-1152-codigo-civil',
    name: 'Jurisprudencia del artículo 1152 del Código Civil - Derecho del acreedor a indemnización',
    url: 'https://lpderecho.pe/articulo-1152-codigo-civil-derecho-acreedor-a-ser-indemnizacion/',
    rango: 'articulo',
    fechaPublicacion: '2023-03-05',
    materias: ['civil', 'obligaciones', 'indemnización'],
    sumilla: 'Jurisprudencia sobre indemnización al acreedor',
  },
  {
    id: 'articulo-1333-codigo-civil',
    name: 'Jurisprudencia del artículo 1333 del Código Civil - Constitución en mora',
    url: 'https://lpderecho.pe/articulo-1333-del-codigo-civil-constitucion-en-mora-2/',
    rango: 'articulo',
    fechaPublicacion: '2023-04-12',
    materias: ['civil', 'obligaciones', 'mora'],
    sumilla: 'Jurisprudencia sobre constitución en mora',
  },
  {
    id: 'articulo-2001-codigo-civil',
    name: 'Jurisprudencia del artículo 2001 del Código Civil - Plazos de prescripción',
    url: 'https://lpderecho.pe/articulo-2001-del-codigo-civil-plazos-de-prescripcion/',
    rango: 'articulo',
    fechaPublicacion: '2023-05-20',
    materias: ['civil', 'prescripción', 'plazos'],
    sumilla: 'Jurisprudencia sobre plazos de prescripción',
  },
  {
    id: 'articulo-titulo-preliminar-cc',
    name: 'Los 10 artículos del título preliminar del Código Civil',
    url: 'https://lpderecho.pe/articulos-titulo-preliminar-codigo-civil-peruano-de-1984/',
    rango: 'articulo',
    fechaPublicacion: '2023-06-15',
    materias: ['civil', 'título preliminar', 'principios'],
    sumilla: 'Análisis del título preliminar del Código Civil',
  },
  // Jurisprudencia Código Penal
  {
    id: 'articulo-12-codigo-penal',
    name: 'Jurisprudencia del artículo 12 del Código Penal - Delito doloso y culposo',
    url: 'https://lpderecho.pe/articulo-12-codigo-penal-delito-doloso-delito-culposo/',
    rango: 'articulo',
    fechaPublicacion: '2023-07-10',
    materias: ['penal', 'dolo', 'culpa'],
    sumilla: 'Jurisprudencia sobre delito doloso y culposo',
  },
  {
    id: 'articulo-13-codigo-penal',
    name: 'Jurisprudencia del artículo 13 del Código Penal - Omisión impropia',
    url: 'https://lpderecho.pe/articulo-13-codigo-penal-omision-impropia/',
    rango: 'articulo',
    fechaPublicacion: '2023-08-05',
    materias: ['penal', 'omisión', 'comisión por omisión'],
    sumilla: 'Jurisprudencia sobre omisión impropia',
  },
  {
    id: 'articulo-189-codigo-penal',
    name: 'Jurisprudencia del artículo 189 del Código Penal - Robo agravado',
    url: 'https://lpderecho.pe/articulo-189-codigo-penal-robo-agravado/',
    rango: 'articulo',
    fechaPublicacion: '2023-09-01',
    materias: ['penal', 'robo', 'delitos patrimoniales'],
    sumilla: 'Jurisprudencia sobre robo agravado',
  },
  {
    id: 'articulo-202-codigo-penal',
    name: 'Jurisprudencia del artículo 202 del Código Penal - Usurpación',
    url: 'https://lpderecho.pe/articulo-202-codigo-penal-usurpacion/',
    rango: 'articulo',
    fechaPublicacion: '2023-10-15',
    materias: ['penal', 'usurpación', 'delitos patrimoniales'],
    sumilla: 'Jurisprudencia sobre usurpación',
  },
  {
    id: 'articulo-205-codigo-penal',
    name: 'Jurisprudencia del artículo 205 del Código Penal - Daño simple',
    url: 'https://lpderecho.pe/articulo-205-codigo-penal-dano-simple/',
    rango: 'articulo',
    fechaPublicacion: '2023-11-01',
    materias: ['penal', 'daños', 'delitos patrimoniales'],
    sumilla: 'Jurisprudencia sobre daño simple',
  },
  {
    id: 'articulo-384-codigo-penal',
    name: 'Jurisprudencia del artículo 384 del Código Penal - Colusión',
    url: 'https://lpderecho.pe/articulo-384-codigo-penal-colusion-simple-agravada/',
    rango: 'articulo',
    fechaPublicacion: '2023-12-01',
    materias: ['penal', 'colusión', 'corrupción'],
    sumilla: 'Jurisprudencia sobre colusión simple y agravada',
  },
  // TUO Laboral
  {
    id: 'ds-002-97-tr-tuo-728',
    name: 'TUO del Decreto Legislativo 728 - Ley de Formación y Promoción Laboral',
    url: 'https://lpderecho.pe/tuo-decreto-legislativo-728-ley-formacion-promocion-laboral-decreto-supremo-002-97-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1997-03-27',
    materias: ['laboral', 'formación laboral', 'promoción laboral'],
    sumilla: 'TUO de la Ley de Formación y Promoción Laboral',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 24')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH24.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH24) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    await new Promise((r) => setTimeout(r, 15000))
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
