#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 14 - Códigos civiles, MYPES, agrario y concursal
 * Usage: npx tsx scripts/fetch-leyes-batch14.ts
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

const LEYES_BATCH14: LawDefinition[] = [
  // MYPE
  {
    id: 'ley-28015',
    name: 'Ley de Promoción y Formalización de la Micro y Pequeña Empresa',
    url: 'https://lpderecho.pe/ley-promocion-formalizacion-micro-pequena-empresa-ley-28015/',
    rango: 'ley',
    fechaPublicacion: '2003-07-03',
    materias: ['laboral', 'MYPE', 'empresa', 'REMYPE'],
    sumilla: 'Regula las micro y pequeñas empresas',
  },
  // Régimen laboral agrario
  {
    id: 'ley-31110',
    name: 'Ley del Régimen Laboral Agrario',
    url: 'https://lpderecho.pe/ley-regimen-laboral-agrario-ley-31110/',
    rango: 'ley',
    fechaPublicacion: '2020-12-31',
    materias: ['laboral', 'agrario', 'agroexportación'],
    sumilla: 'Regula el régimen laboral agrario y agroexportador',
  },
  // Reglamento régimen agrario
  {
    id: 'ds-005-2021-midagri',
    name: 'Reglamento de la Ley del Régimen Laboral Agrario',
    url: 'https://lpderecho.pe/reglamento-ley-regimen-laboral-agrario-ley-31110-decreto-supremo-005-2021-midagri/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2021-03-30',
    materias: ['laboral', 'agrario', 'reglamento'],
    sumilla: 'Reglamenta la Ley 31110',
  },
  // Negociación colectiva agrario
  {
    id: 'ds-006-2021-tr',
    name: 'Reglamento de negociación colectiva del régimen agrario',
    url: 'https://lpderecho.pe/reglamento-negociacion-colectiva-condiciones-minimas-trabajo-ley-31110-decreto-supremo-006-2021-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2021-04-10',
    materias: ['laboral', 'agrario', 'negociación colectiva'],
    sumilla: 'Regula negociación colectiva en sector agrario',
  },
  // Código Civil
  {
    id: 'codigo-civil',
    name: 'Código Civil Peruano',
    url: 'https://lpderecho.pe/codigo-civil-peruano-realmente-actualizado/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1984-07-25',
    materias: ['civil', 'personas', 'contratos', 'obligaciones'],
    sumilla: 'Código Civil del Perú actualizado',
  },
  // Código Civil segunda parte
  {
    id: 'codigo-civil-2',
    name: 'Código Civil Peruano (del artículo 1132 al 2122)',
    url: 'https://lpderecho.pe/codigo-civil-peruano-segunda-parte/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1984-07-25',
    materias: ['civil', 'obligaciones', 'contratos', 'registros'],
    sumilla: 'Segunda parte del Código Civil',
  },
  // Código Procesal Civil
  {
    id: 'codigo-procesal-civil',
    name: 'Código Procesal Civil Peruano',
    url: 'https://lpderecho.pe/codigo-procesal-civil-actualizado/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1993-04-23',
    materias: ['procesal', 'civil', 'demanda', 'proceso'],
    sumilla: 'Código Procesal Civil actualizado',
  },
  // Código Procesal Civil segunda parte
  {
    id: 'codigo-procesal-civil-2',
    name: 'TUO del Código Procesal Civil (del artículo 749 al 847)',
    url: 'https://lpderecho.pe/tuo-codigo-procesal-civil-articulo-749-al-847/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1993-04-23',
    materias: ['procesal', 'civil', 'procesos especiales'],
    sumilla: 'Segunda parte del Código Procesal Civil',
  },
  // Sistema Concursal
  {
    id: 'ley-27809',
    name: 'Ley General del Sistema Concursal',
    url: 'https://lpderecho.pe/ley-general-sistema-concursal-ley-27809-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2002-08-08',
    materias: ['concursal', 'insolvencia', 'INDECOPI', 'quiebra'],
    sumilla: 'Regula los procedimientos concursales',
  },
  // Modificación sistema concursal
  {
    id: 'ley-30844',
    name: 'Ley que modifica la Ley General del Sistema Concursal',
    url: 'https://lpderecho.pe/ley-30844-modifican-ley-general-sistema-concursal/',
    rango: 'ley',
    fechaPublicacion: '2018-08-31',
    materias: ['concursal', 'insolvencia', 'INDECOPI'],
    sumilla: 'Modifica la Ley 27809',
  },
  // Sistema financiero - empresas
  {
    id: 'articulo-empresas-financiero',
    name: 'Las empresas del sistema financiero en el Perú',
    url: 'https://lpderecho.pe/empresas-sistema-financiero-peru-ley-26702/',
    rango: 'ley',
    fechaPublicacion: '1996-12-09',
    materias: ['financiero', 'banca', 'empresas'],
    sumilla: 'Análisis de empresas del sistema financiero',
  },
  // Propiedad industrial - reglamento
  {
    id: 'ds-reglamento-1075',
    name: 'Reglamento del D.L. que regula el régimen común sobre propiedad industrial',
    url: 'https://lpderecho.pe/reglamentan-d-l-regula-regimen-comun-propiedad-industrial/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2017-05-29',
    materias: ['propiedad industrial', 'marcas', 'patentes', 'INDECOPI'],
    sumilla: 'Reglamenta el D.Leg. 1075',
  },
  // Régimen REMYPE laboral
  {
    id: 'articulo-remype',
    name: 'Régimen REMYPE laboral',
    url: 'https://lpderecho.pe/regimen-remype-laboral/',
    rango: 'ley',
    fechaPublicacion: '2003-07-03',
    materias: ['laboral', 'MYPE', 'REMYPE', 'beneficios laborales'],
    sumilla: 'Análisis del régimen REMYPE',
  },
  // Régimen agrario - explicación
  {
    id: 'articulo-regimen-agrario',
    name: 'Novedades del régimen laboral agrario - Ley 31110',
    url: 'https://lpderecho.pe/regimen-laboral-agrario-ley-31110/',
    rango: 'ley',
    fechaPublicacion: '2020-12-31',
    materias: ['laboral', 'agrario', 'análisis'],
    sumilla: 'Análisis de novedades del régimen agrario',
  },
  // Casación optimiza recurso
  {
    id: 'ley-31591',
    name: 'Ley que modifica el Código Procesal Civil para optimizar el recurso de casación',
    url: 'https://lpderecho.pe/ley-31591-modifica-codigo-procesal-civil-a-fin-de-optimizar-el-recurso-de-casacion/',
    rango: 'ley',
    fechaPublicacion: '2022-10-10',
    materias: ['procesal', 'civil', 'casación'],
    sumilla: 'Optimiza el recurso de casación',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 14')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH14.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH14) {
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
