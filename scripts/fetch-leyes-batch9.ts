#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 9 - Leyes laborales específicas
 * Usage: npx tsx scripts/fetch-leyes-batch9.ts
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

const LEYES_BATCH9: LawDefinition[] = [
  // Descansos remunerados
  {
    id: 'dleg-713',
    name: 'Decreto Legislativo que regula los Descansos Remunerados',
    url: 'https://lpderecho.pe/consolidan-legislacion-descansos-remunerados-trabajadores-actividad-privada-decreto-legislativo-713/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-11-08',
    materias: ['laboral', 'vacaciones', 'descansos', 'feriados'],
    sumilla: 'Regula vacaciones, feriados y descanso semanal obligatorio',
  },
  {
    id: 'ds-012-92-tr',
    name: 'Reglamento del Decreto Legislativo 713 - Descansos Remunerados',
    url: 'https://lpderecho.pe/reglamento-decreto-legislativo-descansos-remunerados-trabajadores-regimen-laboral-actividad-privada-decreto-supremo-012-92-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1992-12-03',
    materias: ['laboral', 'vacaciones', 'reglamento'],
    sumilla: 'Reglamenta los descansos remunerados del D.Leg. 713',
  },
  // Gratificaciones
  {
    id: 'ley-27735',
    name: 'Ley que regula las Gratificaciones por Fiestas Patrias y Navidad',
    url: 'https://lpderecho.pe/ley-gratificaciones-fiestas-patrias-navidad-ley-27735/',
    rango: 'ley',
    fechaPublicacion: '2002-05-28',
    materias: ['laboral', 'gratificaciones', 'fiestas patrias', 'navidad'],
    sumilla: 'Establece las gratificaciones por Fiestas Patrias y Navidad',
  },
  {
    id: 'ds-005-2002-tr',
    name: 'Reglamento de la Ley de Gratificaciones',
    url: 'https://lpderecho.pe/reglamento-ley-gratificiaciones-fiestas-patrias-navidad-decreto-supremo-005-2002-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2002-07-04',
    materias: ['laboral', 'gratificaciones', 'reglamento'],
    sumilla: 'Reglamenta la Ley 27735 de gratificaciones',
  },
  // CTS
  {
    id: 'ds-001-97-tr',
    name: 'TUO de la Ley de Compensación por Tiempo de Servicios',
    url: 'https://lpderecho.pe/tuo-ley-de-compensacion-por-tiempo-de-servicios-ds-1-97-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1997-03-01',
    materias: ['laboral', 'CTS', 'beneficios sociales'],
    sumilla: 'Regula la CTS como beneficio social de previsión',
  },
  // Retiro CTS
  {
    id: 'ley-32322',
    name: 'Ley que autoriza el retiro del 100% de la CTS',
    url: 'https://lpderecho.pe/ley-32322-retiro-cts-diciembre-2026/',
    rango: 'ley',
    fechaPublicacion: '2024-11-14',
    materias: ['laboral', 'CTS', 'retiro'],
    sumilla: 'Autoriza el retiro del 100% de la CTS hasta diciembre 2026',
  },
  // CAS con gratificaciones y CTS
  {
    id: 'ley-32563',
    name: 'Ley que incorpora Gratificaciones y CTS al Régimen CAS',
    url: 'https://lpderecho.pe/ley-32563-trabajadores-cas-recibiran-gratificaciones-cts/',
    rango: 'ley',
    fechaPublicacion: '2025-03-06',
    materias: ['laboral', 'función pública', 'CAS', 'gratificaciones', 'CTS'],
    sumilla: 'Otorga gratificaciones y CTS a trabajadores CAS',
  },
  // Contrato de trabajo
  {
    id: 'ds-003-97-tr',
    name: 'TUO del D.Leg. 728 - Ley de Productividad y Competitividad Laboral',
    url: 'https://lpderecho.pe/tuo-728-ley-de-productividad-y-competitividad-laboral-actualizado-ds-3-97-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1997-03-27',
    materias: ['laboral', 'contrato de trabajo', 'despido'],
    sumilla: 'Regula contratos de trabajo, estabilidad y despido',
  },
  // Ley de Pesca
  {
    id: 'dley-25977',
    name: 'Ley General de Pesca',
    url: 'https://lpderecho.pe/ley-general-pesca-decreto-ley-25977/',
    rango: 'decreto-ley',
    fechaPublicacion: '1992-12-22',
    materias: ['pesca', 'recursos naturales', 'acuicultura'],
    sumilla: 'Regula la actividad pesquera y acuícola',
  },
  // Sistema Financiero
  {
    id: 'ley-26702',
    name: 'Ley General del Sistema Financiero y del Sistema de Seguros',
    url: 'https://lpderecho.pe/ley-general-sistema-financiero-ley-26702/',
    rango: 'ley',
    fechaPublicacion: '1996-12-09',
    materias: ['financiero', 'banca', 'seguros', 'SBS'],
    sumilla: 'Regula el sistema financiero, seguros y SBS',
  },
  // Código Tributario
  {
    id: 'ds-133-2013-ef',
    name: 'TUO del Código Tributario',
    url: 'https://lpderecho.pe/tuo-codigo-tributario-decreto-supremo-133-2013-ef-actualizado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2013-06-22',
    materias: ['tributario', 'SUNAT', 'obligaciones tributarias'],
    sumilla: 'Código que regula las relaciones entre contribuyentes y SUNAT',
  },
  // Impuesto a la Renta
  {
    id: 'ds-179-2004-ef',
    name: 'TUO de la Ley del Impuesto a la Renta',
    url: 'https://lpderecho.pe/tuo-ley-impuesto-renta-decreto-supremo-179-2004-ef/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2004-12-08',
    materias: ['tributario', 'impuesto a la renta', 'SUNAT'],
    sumilla: 'Regula el Impuesto a la Renta de personas y empresas',
  },
  // IGV
  {
    id: 'ds-055-99-ef',
    name: 'TUO de la Ley del IGV e ISC',
    url: 'https://lpderecho.pe/tuo-ley-igv-isc-decreto-supremo-055-99-ef/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1999-04-15',
    materias: ['tributario', 'IGV', 'ISC', 'SUNAT'],
    sumilla: 'Regula el Impuesto General a las Ventas y Selectivo al Consumo',
  },
  // Procedimiento Administrativo
  {
    id: 'ds-004-2019-jus',
    name: 'TUO de la Ley del Procedimiento Administrativo General',
    url: 'https://lpderecho.pe/ley-procedimiento-administrativo-27444/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2019-01-25',
    materias: ['administrativo', 'procedimiento', 'silencio administrativo'],
    sumilla: 'TUO de la LPAG que regula actuaciones administrativas',
  },
  // EsSalud
  {
    id: 'ley-27056',
    name: 'Ley de Creación del Seguro Social de Salud - EsSalud',
    url: 'https://lpderecho.pe/ley-creacion-seguro-social-salud-essalud-ley-27056/',
    rango: 'ley',
    fechaPublicacion: '1999-01-30',
    materias: ['salud', 'EsSalud', 'seguridad social'],
    sumilla: 'Crea EsSalud como organismo público descentralizado',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 9')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH9.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH9) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting - 10 seconds
    await new Promise((r) => setTimeout(r, 10000))
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
