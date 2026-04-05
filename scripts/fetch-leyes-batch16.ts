#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 16 - Proceso contencioso, delitos informáticos, pensiones
 * Usage: npx tsx scripts/fetch-leyes-batch16.ts
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

const LEYES_BATCH16: LawDefinition[] = [
  // Proceso contencioso administrativo
  {
    id: 'ds-011-2019-jus',
    name: 'TUO de la Ley que regula el proceso contencioso administrativo',
    url: 'https://lpderecho.pe/ley-27584-ley-que-regula-proceso-contencioso-administrativo/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2019-05-04',
    materias: ['procesal', 'administrativo', 'contencioso'],
    sumilla: 'TUO de la Ley 27584 del proceso contencioso administrativo',
  },
  // Modificación proceso contencioso
  {
    id: 'ley-31370',
    name: 'Ley que modifica la Ley del proceso contencioso administrativo',
    url: 'https://lpderecho.pe/ley-31370-modifican-ley-regula-proceso-contencioso-administrativo-ley-procedimiento-ejecucion-coactiva/',
    rango: 'ley',
    fechaPublicacion: '2021-12-08',
    materias: ['procesal', 'administrativo', 'ejecución coactiva'],
    sumilla: 'Modifica la Ley del proceso contencioso y ejecución coactiva',
  },
  // Ejecución coactiva
  {
    id: 'ds-018-2008-jus',
    name: 'TUO de la Ley de procedimiento de ejecución coactiva',
    url: 'https://lpderecho.pe/texto-unico-ordenado-ley-procedimiento-ejecucion-coactiva-decreto-supremo-18-2008-jus-actualizado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2008-12-06',
    materias: ['administrativo', 'ejecución coactiva', 'cobranza'],
    sumilla: 'TUO de la Ley 26979 de ejecución coactiva',
  },
  // Delitos informáticos
  {
    id: 'ley-30096',
    name: 'Ley de Delitos Informáticos',
    url: 'https://lpderecho.pe/ley-delitos-informaticos-ley-30096/',
    rango: 'ley',
    fechaPublicacion: '2013-10-22',
    materias: ['penal', 'delitos informáticos', 'ciberdelitos'],
    sumilla: 'Previene y sanciona los delitos informáticos',
  },
  // Delito tráfico datos
  {
    id: 'dleg-1700',
    name: 'Decreto Legislativo que incorpora delito de tráfico ilícito de datos',
    url: 'https://lpderecho.pe/incorporan-delito-informatico-sanciona-adquisicion-posesion-trafico-ilicito-datos-informaticos-decreto-legislativo-1700/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2025-10-31',
    materias: ['penal', 'delitos informáticos', 'datos'],
    sumilla: 'Incorpora delito de tráfico ilícito de datos',
  },
  // Modificación delitos informáticos
  {
    id: 'ley-32451',
    name: 'Ley que modifica el Código Penal sobre delitos informáticos',
    url: 'https://lpderecho.pe/ley-32451-modifican-codigo-penal-delitos-informaticos/',
    rango: 'ley',
    fechaPublicacion: '2025-09-22',
    materias: ['penal', 'delitos informáticos'],
    sumilla: 'Modifica delitos informáticos del Código Penal',
  },
  // Sistema Nacional de Pensiones
  {
    id: 'dley-19990',
    name: 'Decreto Ley que crea el Sistema Nacional de Pensiones',
    url: 'https://lpderecho.pe/decreto-ley-19990-sistema-nacional-pensiones-seguridad-social-actualizado/',
    rango: 'decreto-ley',
    fechaPublicacion: '1973-04-30',
    materias: ['pensiones', 'ONP', 'seguridad social'],
    sumilla: 'Crea el Sistema Nacional de Pensiones de la Seguridad Social',
  },
  // Pensiones proporcionales
  {
    id: 'ley-31301',
    name: 'Ley que garantiza acceso a pensión en ONP con menos de 20 años',
    url: 'https://lpderecho.pe/onp-gobierno-propone-personas-menos-20-anos-aportes-reciban-pension/',
    rango: 'ley',
    fechaPublicacion: '2021-07-23',
    materias: ['pensiones', 'ONP', 'pensión proporcional'],
    sumilla: 'Permite pensión con menos de 20 años de aportes',
  },
  // Reglamento pensiones proporcionales
  {
    id: 'ds-282-2021-ef',
    name: 'Reglamento para entrega de pensiones proporcionales ONP',
    url: 'https://lpderecho.pe/onp-reglamento-pensiones-entrega-proporcionales-decreto-supremo-282-2021-ef/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2021-11-05',
    materias: ['pensiones', 'ONP', 'reglamento'],
    sumilla: 'Reglamenta pensiones proporcionales de ONP',
  },
  // Reglamento unificado pensiones
  {
    id: 'ds-354-2020-ef',
    name: 'Reglamento unificado del Sistema Nacional de Pensiones',
    url: 'https://lpderecho.pe/reglamento-unificado-normas-legales-sistema-nacional-pensiones-decreto-supremo-354-2020-ef/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2020-12-08',
    materias: ['pensiones', 'ONP', 'reglamento'],
    sumilla: 'Reglamento unificado del SNP',
  },
  // Retiro aportes ONP
  {
    id: 'ley-31083',
    name: 'Ley que permite retiro de aportes a ONP',
    url: 'https://lpderecho.pe/ley-31083-permite-retiro-aportes-onp/',
    rango: 'ley',
    fechaPublicacion: '2020-12-08',
    materias: ['pensiones', 'ONP', 'retiro'],
    sumilla: 'Permite retiro de aportes a la ONP',
  },
  // Amparo
  {
    id: 'articulo-amparo',
    name: 'Amparo: características, derechos protegidos, tipos y procedimiento',
    url: 'https://lpderecho.pe/amparo-caracteristicas-derechos-protegidos-tipos-procedimiento/',
    rango: 'articulo',
    fechaPublicacion: '2023-01-01',
    materias: ['constitucional', 'amparo', 'garantías'],
    sumilla: 'Análisis del proceso de amparo',
  },
  // Control difuso
  {
    id: 'articulo-control-difuso',
    name: 'Reglas del control difuso - Precedente vinculante',
    url: 'https://lpderecho.pe/nuevas-reglas-sobre-control-difuso-precedente-vinculante-casacion-1266-2022/',
    rango: 'jurisprudencia',
    fechaPublicacion: '2024-03-15',
    materias: ['constitucional', 'control difuso', 'precedente'],
    sumilla: 'Nuevas reglas sobre el control difuso',
  },
  // Proceso contencioso explicación
  {
    id: 'articulo-proceso-contencioso',
    name: 'El proceso contencioso administrativo: principios, partes, modelo',
    url: 'https://lpderecho.pe/proceso-contencioso-administrativo-principios-partes-modelo/',
    rango: 'articulo',
    fechaPublicacion: '2022-06-01',
    materias: ['procesal', 'administrativo', 'análisis'],
    sumilla: 'Análisis del proceso contencioso administrativo',
  },
  // Ejecución coactiva explicación
  {
    id: 'articulo-ejecucion-coactiva',
    name: 'Introducción al procedimiento de ejecución coactiva',
    url: 'https://lpderecho.pe/introduccion-procedimiento-ejecucion-coativa-fundamentos-coaccion-administrativa/',
    rango: 'articulo',
    fechaPublicacion: '2022-01-15',
    materias: ['administrativo', 'ejecución coactiva', 'análisis'],
    sumilla: 'Fundamentos de la ejecución coactiva',
  },
  // 50 años SNP
  {
    id: 'articulo-50-anos-snp',
    name: '50 años del Sistema Nacional de Pensiones',
    url: 'https://lpderecho.pe/50-anos-sistema-nacional-pensiones-pasado-presente-futuro/',
    rango: 'articulo',
    fechaPublicacion: '2023-04-30',
    materias: ['pensiones', 'ONP', 'historia'],
    sumilla: 'Historia del Sistema Nacional de Pensiones',
  },
  // Garantía mobiliaria explicación
  {
    id: 'articulo-garantia-mobiliaria',
    name: 'Aspectos claves de la nueva ley de garantía mobiliaria',
    url: 'https://lpderecho.pe/claves-entender-nueva-ley-garantia-mobiliaria/',
    rango: 'articulo',
    fechaPublicacion: '2018-09-10',
    materias: ['civil', 'garantía mobiliaria', 'análisis'],
    sumilla: 'Análisis de la ley de garantía mobiliaria',
  },
  // Novedades garantía mobiliaria
  {
    id: 'articulo-novedades-garantia-mobiliaria',
    name: 'Novedades del régimen de garantía mobiliaria',
    url: 'https://lpderecho.pe/novedades-nuevo-regimen-garantia-mobiliaria-principios-registrales-afectados/',
    rango: 'articulo',
    fechaPublicacion: '2018-09-20',
    materias: ['civil', 'garantía mobiliaria', 'registros'],
    sumilla: 'Novedades del régimen de garantía mobiliaria',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 16')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH16.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH16) {
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
