#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 17 - Tributario, laboral, financiero y aduanas
 * Usage: npx tsx scripts/fetch-leyes-batch17.ts
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

const LEYES_BATCH17: LawDefinition[] = [
  // Código Tributario
  {
    id: 'ds-133-2013-ef',
    name: 'TUO del Código Tributario',
    url: 'https://lpderecho.pe/tuo-codigo-tributario-decreto-supremo-133-2013-ef-actualizado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2013-06-22',
    materias: ['tributario', 'SUNAT', 'impuestos'],
    sumilla: 'TUO del Código Tributario actualizado',
  },
  // Ley Penal Tributaria
  {
    id: 'dleg-813',
    name: 'Ley Penal Tributaria',
    url: 'https://lpderecho.pe/ley-penal-tributaria-actualizada/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-04-20',
    materias: ['tributario', 'penal', 'delitos tributarios'],
    sumilla: 'Tipifica los delitos tributarios',
  },
  // Tributación Municipal
  {
    id: 'ds-156-2004-ef',
    name: 'TUO de la Ley de Tributación Municipal',
    url: 'https://lpderecho.pe/texto-unico-ordenado-ley-tributacion-municipal/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2004-11-15',
    materias: ['tributario', 'municipal', 'impuestos locales'],
    sumilla: 'Regula los tributos municipales',
  },
  // Seguridad y Salud en el Trabajo
  {
    id: 'ley-29783',
    name: 'Ley de Seguridad y Salud en el Trabajo',
    url: 'https://lpderecho.pe/ley-seguridad-salud-trabajo-ley-29783-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2011-08-20',
    materias: ['laboral', 'seguridad', 'salud ocupacional'],
    sumilla: 'Regula la seguridad y salud en el trabajo',
  },
  // Reglamento SST
  {
    id: 'ds-005-2012-tr',
    name: 'Reglamento de la Ley de Seguridad y Salud en el Trabajo',
    url: 'https://lpderecho.pe/reglamento-ley-seguridad-salud-trabajo-ley-decreto-supremo-005-2012-tr-actualizado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2012-04-25',
    materias: ['laboral', 'seguridad', 'reglamento'],
    sumilla: 'Reglamenta la Ley 29783',
  },
  // CTS
  {
    id: 'ds-001-97-tr',
    name: 'TUO de la Ley de Compensación por Tiempo de Servicios',
    url: 'https://lpderecho.pe/tuo-ley-de-compensacion-por-tiempo-de-servicios-ds-1-97-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1997-03-01',
    materias: ['laboral', 'CTS', 'beneficios sociales'],
    sumilla: 'Regula la compensación por tiempo de servicios',
  },
  // Descansos remunerados
  {
    id: 'dleg-713',
    name: 'Ley de Descansos Remunerados',
    url: 'https://lpderecho.pe/consolidan-legislacion-descansos-remunerados-trabajadores-actividad-privada-decreto-legislativo-713/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-11-08',
    materias: ['laboral', 'vacaciones', 'descansos'],
    sumilla: 'Consolida legislación sobre descansos remunerados',
  },
  // Gratificaciones
  {
    id: 'ley-27735',
    name: 'Ley de Gratificaciones por Fiestas Patrias y Navidad',
    url: 'https://lpderecho.pe/ley-gratificaciones-fiestas-patrias-navidad-ley-27735/',
    rango: 'ley',
    fechaPublicacion: '2002-05-28',
    materias: ['laboral', 'gratificaciones', 'beneficios sociales'],
    sumilla: 'Regula las gratificaciones legales',
  },
  // Reglamento gratificaciones
  {
    id: 'ds-005-2002-tr',
    name: 'Reglamento de la Ley de Gratificaciones',
    url: 'https://lpderecho.pe/reglamento-ley-gratificiaciones-fiestas-patrias-navidad-decreto-supremo-005-2002-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2002-07-04',
    materias: ['laboral', 'gratificaciones', 'reglamento'],
    sumilla: 'Reglamenta la Ley 27735',
  },
  // Sistema Financiero modificación
  {
    id: 'dleg-1531',
    name: 'Decreto Legislativo que modifica la Ley del Sistema Financiero',
    url: 'https://lpderecho.pe/modifican-ley-general-sistema-financiero-sistema-seguros-decreto-legislativo-1531/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2022-03-19',
    materias: ['financiero', 'SBS', 'banca'],
    sumilla: 'Modifica la Ley 26702 del Sistema Financiero',
  },
  // SBS Cooperativas
  {
    id: 'ley-30822',
    name: 'Ley que permite a la SBS supervisar cooperativas de ahorro',
    url: 'https://lpderecho.pe/ley-30822-permite-sbs-supervisar-cooperativas-ahorro/',
    rango: 'ley',
    fechaPublicacion: '2018-07-19',
    materias: ['financiero', 'SBS', 'cooperativas'],
    sumilla: 'Modifica la Ley del Sistema Financiero para cooperativas',
  },
  // Ley General de Aduanas
  {
    id: 'dleg-1053',
    name: 'Ley General de Aduanas',
    url: 'https://lpderecho.pe/decreto-legislativo-ley-general-aduanas-decreto-legislativo-1053/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-27',
    materias: ['aduanas', 'comercio exterior', 'importación'],
    sumilla: 'Regula los regímenes aduaneros',
  },
  // Delitos Aduaneros
  {
    id: 'ley-28008',
    name: 'Ley de Delitos Aduaneros',
    url: 'https://lpderecho.pe/ley-delitos-aduaneros-ley-28008-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2003-06-19',
    materias: ['aduanas', 'penal', 'contrabando'],
    sumilla: 'Tipifica los delitos aduaneros',
  },
  // Hostigamiento Sexual
  {
    id: 'ley-27942',
    name: 'Ley de Prevención y Sanción del Hostigamiento Sexual',
    url: 'https://lpderecho.pe/ley-prevencion-sancion-hostigamiento-sexual-ley-27942/',
    rango: 'ley',
    fechaPublicacion: '2003-02-27',
    materias: ['laboral', 'hostigamiento sexual', 'prevención'],
    sumilla: 'Previene y sanciona el hostigamiento sexual',
  },
  // Reglamento Hostigamiento Sexual
  {
    id: 'ds-014-2019-mimp',
    name: 'Reglamento de la Ley de Hostigamiento Sexual',
    url: 'https://lpderecho.pe/reglamento-ley-prevencion-sancion-hostigamiento-sexual-decreto-supremo-014-2019-mimp/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2019-07-22',
    materias: ['laboral', 'hostigamiento sexual', 'reglamento'],
    sumilla: 'Reglamenta la Ley 27942',
  },
  // Lactancia Materna
  {
    id: 'ley-27240',
    name: 'Ley que otorga permiso por lactancia materna',
    url: 'https://lpderecho.pe/ley-permiso-lactancia-materna-ley-27240/',
    rango: 'ley',
    fechaPublicacion: '1999-12-23',
    materias: ['laboral', 'lactancia', 'maternidad'],
    sumilla: 'Establece permiso por lactancia materna',
  },
  // Retiro CTS 100%
  {
    id: 'ley-32322',
    name: 'Ley que autoriza el retiro del 100% de la CTS',
    url: 'https://lpderecho.pe/ley-32322-retiro-cts-diciembre-2026/',
    rango: 'ley',
    fechaPublicacion: '2024-10-30',
    materias: ['laboral', 'CTS', 'retiro'],
    sumilla: 'Autoriza retiro del 100% de CTS hasta 2026',
  },
  // CTS explicación
  {
    id: 'articulo-cts',
    name: 'CTS: todo sobre la compensación por tiempo de servicio',
    url: 'https://lpderecho.pe/cts-compensacion-tiempo-servicio/',
    rango: 'articulo',
    fechaPublicacion: '2023-05-01',
    materias: ['laboral', 'CTS', 'análisis'],
    sumilla: 'Análisis completo de la CTS',
  },
  // Sistema financiero empresas
  {
    id: 'articulo-empresas-financieras',
    name: 'Las empresas del sistema financiero en el Perú',
    url: 'https://lpderecho.pe/empresas-sistema-financiero-peru-ley-26702/',
    rango: 'articulo',
    fechaPublicacion: '2022-01-15',
    materias: ['financiero', 'banca', 'análisis'],
    sumilla: 'Análisis de empresas del sistema financiero',
  },
  // Descansos remunerados explicación
  {
    id: 'articulo-descansos-remunerados',
    name: 'Los descansos remunerados según la ley',
    url: 'https://lpderecho.pe/descansos-remunerados-ley/',
    rango: 'articulo',
    fechaPublicacion: '2022-06-01',
    materias: ['laboral', 'vacaciones', 'análisis'],
    sumilla: 'Análisis de los descansos remunerados',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 17')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH17.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH17) {
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
