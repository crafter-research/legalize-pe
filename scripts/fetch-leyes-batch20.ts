#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 20 - Final laws to reach 300+
 * Usage: npx tsx scripts/fetch-leyes-batch20.ts
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

const LEYES_BATCH20: LawDefinition[] = [
  // Derecho registral
  {
    id: 'articulo-derecho-registral',
    name: 'Introducción al derecho registral peruano',
    url: 'https://lpderecho.pe/breves-comentarios-sobre-el-nuevo-reglamento-de-inscripcion-de-cooperativas-ric/',
    rango: 'articulo',
    fechaPublicacion: '2022-01-15',
    materias: ['registros públicos', 'SUNARP', 'cooperativas'],
    sumilla: 'Comentarios sobre el reglamento de cooperativas',
  },
  // Regularización migratoria
  {
    id: 'ds-003-2023-in',
    name: 'Decreto Supremo que aprueba regularización migratoria de extranjeros',
    url: 'https://lpderecho.pe/aprueba-regularizacion-migratoria-extranjeros-con-cpp-decreto-supremo-003-2023-in/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2023-03-10',
    materias: ['migraciones', 'extranjería', 'regularización'],
    sumilla: 'Aprueba regularización migratoria de extranjeros con CPP',
  },
  // Reglamento Ley Migraciones
  {
    id: 'articulo-reglamento-migraciones',
    name: 'Reglamentan Ley de Migraciones y nuevas calidades migratorias',
    url: 'https://lpderecho.pe/reglamentan-ley-de-migraciones-y-crean-nuevas-calidades-migratorias/',
    rango: 'articulo',
    fechaPublicacion: '2017-03-15',
    materias: ['migraciones', 'calidades migratorias', 'análisis'],
    sumilla: 'Análisis del reglamento de la Ley de Migraciones',
  },
  // Part time
  {
    id: 'articulo-part-time',
    name: 'Trabajadores a tiempo parcial: derechos, beneficios, jurisprudencia',
    url: 'https://lpderecho.pe/trabajadores-tiempo-parcial-part-time-derecho-laboral/',
    rango: 'articulo',
    fechaPublicacion: '2023-04-20',
    materias: ['laboral', 'part time', 'beneficios'],
    sumilla: 'Guía sobre trabajadores a tiempo parcial',
  },
  // CAS gratificaciones CTS
  {
    id: 'ley-32563',
    name: 'Ley que otorga gratificaciones y CTS a trabajadores CAS',
    url: 'https://lpderecho.pe/ley-32563-trabajadores-cas-recibiran-gratificaciones-cts/',
    rango: 'ley',
    fechaPublicacion: '2026-01-10',
    materias: ['laboral', 'CAS', 'gratificaciones', 'CTS'],
    sumilla: 'Otorga gratificaciones y CTS a trabajadores CAS',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 20 (Final)')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH20.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH20) {
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
