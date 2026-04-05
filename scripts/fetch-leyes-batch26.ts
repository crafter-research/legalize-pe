#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 26 - More verified URLs to reach 400
 * Usage: npx tsx scripts/fetch-leyes-batch26.ts
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

const LEYES_BATCH26: LawDefinition[] = [
  // Tribunal Constitucional
  {
    id: 'articulo-tipos-sentencias-tc',
    name: 'TC: Tipos de sentencias y efectos de la jurisprudencia constitucional',
    url: 'https://lpderecho.pe/tc-tipos-sentencias-efectos-jurisprudencia-constitucional/',
    rango: 'articulo',
    fechaPublicacion: '2023-05-10',
    materias: ['constitucional', 'TC', 'sentencias'],
    sumilla: 'Tipos de sentencias del Tribunal Constitucional',
  },
  {
    id: 'articulo-sentencias-tc-2017',
    name: 'Las 10 sentencias más importantes del Tribunal Constitucional en el 2017',
    url: 'https://lpderecho.pe/10-sentencias-mas-importantes-tribunal-constitucional-2017/',
    rango: 'articulo',
    fechaPublicacion: '2018-01-05',
    materias: ['constitucional', 'TC', 'sentencias 2017'],
    sumilla: 'Sentencias importantes del TC 2017',
  },
  {
    id: 'articulo-precedentes-vinculantes-tc',
    name: 'Precedentes vinculantes del Tribunal Constitucional - Descarga PDF',
    url: 'https://lpderecho.pe/descargue-los-precedentes-vinculantes-del-tribunal-constitucional/',
    rango: 'articulo',
    fechaPublicacion: '2023-06-15',
    materias: ['constitucional', 'TC', 'precedentes vinculantes'],
    sumilla: 'Precedentes vinculantes del TC',
  },
  {
    id: 'articulo-precedentes-penales-tc',
    name: 'Precedentes vinculantes del TC en materia penal y procesal penal',
    url: 'https://lpderecho.pe/precedentes-vinculantes-penal-tribunal-constitucional/',
    rango: 'articulo',
    fechaPublicacion: '2023-07-20',
    materias: ['constitucional', 'penal', 'precedentes'],
    sumilla: 'Precedentes penales del TC',
  },
  {
    id: 'articulo-sentencias-tc-2019',
    name: 'Las 7 sentencias del Tribunal Constitucional más importantes del 2019',
    url: 'https://lpderecho.pe/siete-sentencias-tribunal-constitucional-importantes-2019/',
    rango: 'articulo',
    fechaPublicacion: '2020-01-10',
    materias: ['constitucional', 'TC', 'sentencias 2019'],
    sumilla: 'Sentencias importantes del TC 2019',
  },
  // EsSalud y Salud
  {
    id: 'ley-32566-essalud',
    name: 'Ley 32566: Cambio de contrato CAS-COVID a CAS para personal de EsSalud',
    url: 'https://lpderecho.pe/ley-32566-cambio-contrato-cas-covid-cas-personal-essalud/',
    rango: 'ley',
    fechaPublicacion: '2026-01-20',
    materias: ['laboral', 'salud', 'EsSalud', 'CAS'],
    sumilla: 'Cambio de CAS-COVID a CAS en EsSalud',
  },
  {
    id: 'ley-32568-essalud',
    name: 'Ley 32568: Nombramiento de personal CAS de salud al régimen 728',
    url: 'https://lpderecho.pe/ley-32568-autorizan-nombramiento-personal-cas-salud-regimen-728-minsa-essalud/',
    rango: 'ley',
    fechaPublicacion: '2026-01-25',
    materias: ['laboral', 'salud', 'EsSalud', 'nombramiento'],
    sumilla: 'Nombramiento de CAS salud al régimen 728',
  },
  {
    id: 'ds-007-2023-tr-essalud',
    name: 'Reglamento de incorporación de CAS EsSalud al régimen 728',
    url: 'https://lpderecho.pe/reglamento-ley-incorpora-personal-cas-indeterminado-essalud-regimen-laboral-dl-728-decreto-supremo-007-2023-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2023-07-15',
    materias: ['laboral', 'salud', 'EsSalud', 'CAS'],
    sumilla: 'Reglamento de Ley 31703 sobre CAS EsSalud',
  },
  {
    id: 'ds-001-2025-tr-essalud',
    name: 'DS que modifica requisitos de cobertura para gestantes en EsSalud',
    url: 'https://lpderecho.pe/essalud-modifican-requisitos-cobertura-gestantes-accidentes-ds-001-2025-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2025-01-10',
    materias: ['salud', 'EsSalud', 'gestantes', 'cobertura'],
    sumilla: 'Modifica requisitos de cobertura EsSalud',
  },
  {
    id: 'ley-31469-gestantes-essalud',
    name: 'Ley 31469: Atención inmediata a mujeres gestantes en EsSalud',
    url: 'https://lpderecho.pe/ley-31469-atencion-inmediata-mujeres-gestantes-essalud/',
    rango: 'ley',
    fechaPublicacion: '2022-04-15',
    materias: ['salud', 'EsSalud', 'gestantes', 'atención'],
    sumilla: 'Atención inmediata a gestantes en EsSalud',
  },
  {
    id: 'ds-020-2021-tr-essalud',
    name: 'Servicios prestados en exclusividad por EsSalud',
    url: 'https://lpderecho.pe/servicios-prestados-exclusividad-brindados-essalud-decreto-supremo-020-2021-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2021-09-20',
    materias: ['salud', 'EsSalud', 'servicios exclusivos'],
    sumilla: 'Servicios exclusivos de EsSalud',
  },
  {
    id: 'ley-32136-essalud-plazas',
    name: 'Ley 32136: EsSalud asigna plazas vacantes a trabajadores promovidos',
    url: 'https://lpderecho.pe/ley-32136-essalud-asignar-plazas-vacantes-trabajadores-promovidos-internamente/',
    rango: 'ley',
    fechaPublicacion: '2024-06-10',
    materias: ['laboral', 'salud', 'EsSalud', 'promoción'],
    sumilla: 'Asignación de plazas vacantes en EsSalud',
  },
  {
    id: 'ds-012-2019-tr-essalud',
    name: 'Reglamento de inscripción de familiares del trabajador en EsSalud',
    url: 'https://lpderecho.pe/aprueban-reglamento-inscripcion-familiares-trabajador-essalud-decreto-supremo-012-2019-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2019-08-15',
    materias: ['salud', 'EsSalud', 'inscripción', 'familiares'],
    sumilla: 'Reglamento de inscripción de familiares en EsSalud',
  },
  {
    id: 'ley-30555-essalud-728',
    name: 'Ley 30555: Incorpora al régimen 728 de EsSalud a trabajadores CAS',
    url: 'https://lpderecho.pe/ley-30555-incorpora-regimen-728-essalud-trabajadores-cas/',
    rango: 'ley',
    fechaPublicacion: '2017-05-15',
    materias: ['laboral', 'salud', 'EsSalud', 'CAS'],
    sumilla: 'Incorpora CAS de EsSalud al régimen 728',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 26')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH26.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH26) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    await new Promise((r) => setTimeout(r, 15000))
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
