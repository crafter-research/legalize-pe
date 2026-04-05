#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 15 - Notariado, SUNARP, inspección y telecomunicaciones
 * Usage: npx tsx scripts/fetch-leyes-batch15.ts
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

const LEYES_BATCH15: LawDefinition[] = [
  // Notariado
  {
    id: 'dleg-1049',
    name: 'Decreto Legislativo del Notariado',
    url: 'https://lpderecho.pe/decreto-legislativo-notariado-decreto-legislativo-1049/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-26',
    materias: ['notariado', 'instrumentos públicos', 'fe pública'],
    sumilla: 'Regula la función notarial',
  },
  // Competencia notarial
  {
    id: 'ley-26662',
    name: 'Ley de Competencia Notarial en Asuntos No Contenciosos',
    url: 'https://lpderecho.pe/ley-competencia-notarial-asuntos-no-contenciosos-ley-26662/',
    rango: 'ley',
    fechaPublicacion: '1996-09-22',
    materias: ['notariado', 'asuntos no contenciosos', 'procedimiento'],
    sumilla: 'Regula la competencia notarial en asuntos no contenciosos',
  },
  // Reglamento notariado
  {
    id: 'ds-010-2010-jus',
    name: 'TUO del Reglamento del Decreto Legislativo del Notariado',
    url: 'https://lpderecho.pe/reglamento-decreto-legislativo-notariado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2010-07-22',
    materias: ['notariado', 'reglamento'],
    sumilla: 'Reglamenta el D.Leg. 1049 del Notariado',
  },
  // SUNARP
  {
    id: 'ley-26366',
    name: 'Ley que crea el Sistema Nacional y Superintendencia de los Registros Públicos',
    url: 'https://lpderecho.pe/ley-sistema-nacional-superintendencia-registros-publicos-sunarp-ley-26366/',
    rango: 'ley',
    fechaPublicacion: '1994-10-16',
    materias: ['registros públicos', 'SUNARP', 'sistema registral'],
    sumilla: 'Crea SUNARP y el Sistema Nacional de Registros Públicos',
  },
  // Reglamento registros públicos
  {
    id: 'res-126-2012-sunarp',
    name: 'TUO del Reglamento General de los Registros Públicos',
    url: 'https://lpderecho.pe/texto-unico-ordenado-reglamento-general-registros-publicos-resolucion-126-2012-sunarp-sn/',
    rango: 'resolucion',
    fechaPublicacion: '2012-05-17',
    materias: ['registros públicos', 'SUNARP', 'reglamento'],
    sumilla: 'TUO del Reglamento de Registros Públicos',
  },
  // Modernización SUNARP
  {
    id: 'ley-31309',
    name: 'Ley para modernizar y fortalecer los servicios de SUNARP',
    url: 'https://lpderecho.pe/ley-31309-ley-modernizacion-fortalecimiento-servicios-sunarp/',
    rango: 'ley',
    fechaPublicacion: '2021-07-27',
    materias: ['registros públicos', 'SUNARP', 'modernización'],
    sumilla: 'Moderniza y fortalece los servicios de SUNARP',
  },
  // Inspección del trabajo
  {
    id: 'ley-28806',
    name: 'Ley General de Inspección del Trabajo',
    url: 'https://lpderecho.pe/ley-28806-ley-general-de-inspeccion-del-trabajo-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2006-07-22',
    materias: ['laboral', 'inspección', 'SUNAFIL'],
    sumilla: 'Regula el Sistema de Inspección del Trabajo',
  },
  // Reglamento inspección
  {
    id: 'ds-019-2006-tr',
    name: 'Reglamento de la Ley General de Inspección del Trabajo',
    url: 'https://lpderecho.pe/reglamento-ley-general-inspeccion-trabajo-decreto-supremo-19-2006-tr-actualizado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2006-10-29',
    materias: ['laboral', 'inspección', 'reglamento'],
    sumilla: 'Reglamenta la Ley 28806',
  },
  // Fortalecimiento SUNAFIL
  {
    id: 'ley-30814',
    name: 'Ley de fortalecimiento del Sistema de Inspección del Trabajo',
    url: 'https://lpderecho.pe/ley-30814-fortalece-sistema-inspeccion-trabajo/',
    rango: 'ley',
    fechaPublicacion: '2018-07-05',
    materias: ['laboral', 'inspección', 'SUNAFIL'],
    sumilla: 'Fortalece el Sistema de Inspección del Trabajo',
  },
  // Telecomunicaciones modificación
  {
    id: 'ds-018-2021-mtc',
    name: 'Modifican el TUO del Reglamento General de la Ley de Telecomunicaciones',
    url: 'https://lpderecho.pe/modifican-texto-unico-ordenado-reglamento-general-ley-telecomunicaciones-decreto-supremo-018-2021-mtc/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2021-05-27',
    materias: ['telecomunicaciones', 'MTC', 'OSIPTEL'],
    sumilla: 'Modifica el reglamento de telecomunicaciones',
  },
  // Radio y televisión modificación
  {
    id: 'ds-001-2022-mtc',
    name: 'Modifican el Reglamento de la Ley de Radio y Televisión',
    url: 'https://lpderecho.pe/modifican-reglamento-ley-radio-television-decreto-supremo-001-2022-mtc/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2022-01-17',
    materias: ['radiodifusión', 'televisión', 'MTC'],
    sumilla: 'Modifica el reglamento de radio y televisión',
  },
  // Radio televisión 2020
  {
    id: 'ds-019-2020-mtc',
    name: 'Modifican Reglamento de la Ley de Radio y Televisión 2020',
    url: 'https://lpderecho.pe/modifican-reglamento-ley-radio-television-decreto-supremo-019-2020-mtc/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2020-10-26',
    materias: ['radiodifusión', 'televisión', 'reglamento'],
    sumilla: 'Modifica el reglamento de radio y televisión',
  },
  // Código ética radiodifusión
  {
    id: 'rm-586-2021-mtc',
    name: 'Código de Ética para la prestación de servicios de radiodifusión',
    url: 'https://lpderecho.pe/codigo-etica-prestacion-servicios-de-radiodifusion-resolucion-ministerial-586-2021-mtc-01/',
    rango: 'resolucion',
    fechaPublicacion: '2021-08-20',
    materias: ['radiodifusión', 'ética', 'MTC'],
    sumilla: 'Aprueba el Código de Ética de radiodifusión',
  },
  // Ley amplía competencia notarial
  {
    id: 'ley-29560',
    name: 'Ley que amplía la competencia notarial en asuntos no contenciosos',
    url: 'https://lpderecho.pe/ley-29560-amplia-ley-competencia-notarial-asuntos-contenciosos-ley-general-sociedades/',
    rango: 'ley',
    fechaPublicacion: '2010-07-16',
    materias: ['notariado', 'sociedades', 'no contenciosos'],
    sumilla: 'Amplía competencia notarial y modifica LGS',
  },
  // Regímenes laborales
  {
    id: 'articulo-regimenes-laborales',
    name: 'Regímenes laborales en el Perú',
    url: 'https://lpderecho.pe/cuales-son-los-regimenes-laborales-en-el-peru-bien-explicado/',
    rango: 'articulo',
    fechaPublicacion: '2023-01-15',
    materias: ['laboral', 'regímenes', 'análisis'],
    sumilla: 'Explicación de regímenes laborales en Perú',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 15')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH15.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH15) {
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
