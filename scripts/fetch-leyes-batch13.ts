#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 13 - Leyes electorales, procedimentales y descentralización
 * Usage: npx tsx scripts/fetch-leyes-batch13.ts
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

const LEYES_BATCH13: LawDefinition[] = [
  // Código Procesal Penal
  {
    id: 'codigo-procesal-penal',
    name: 'Código Procesal Penal',
    url: 'https://lpderecho.pe/nuevo-codigo-procesal-penal-peruano-actualizado/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2004-07-29',
    materias: ['procesal', 'penal', 'proceso penal'],
    sumilla: 'Código Procesal Penal actualizado',
  },
  // Ley de Organizaciones Políticas
  {
    id: 'ley-28094',
    name: 'Ley de Organizaciones Políticas',
    url: 'https://lpderecho.pe/ley-organizaciones-politicas-ley-28094-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2003-11-01',
    materias: ['electoral', 'partidos políticos', 'JNE'],
    sumilla: 'Regula los partidos políticos',
  },
  // Ley de Elecciones Municipales
  {
    id: 'ley-26864',
    name: 'Ley de Elecciones Municipales',
    url: 'https://lpderecho.pe/ley-de-elecciones-municipales-ley-26864-actualizada-2025/',
    rango: 'ley',
    fechaPublicacion: '1997-10-14',
    materias: ['electoral', 'municipalidades', 'JNE'],
    sumilla: 'Regula las elecciones municipales',
  },
  // Ley de Elecciones Regionales
  {
    id: 'ley-27683',
    name: 'Ley de Elecciones Regionales',
    url: 'https://lpderecho.pe/ley-elecciones-regionales-ley-27683-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2002-03-15',
    materias: ['electoral', 'regional', 'JNE'],
    sumilla: 'Regula las elecciones regionales',
  },
  // Convocatoria elecciones 2026
  {
    id: 'ds-001-2026-pcm',
    name: 'Decreto Supremo que convoca a Elecciones Regionales y Municipales 2026',
    url: 'https://lpderecho.pe/decreto-supremo-convoca-elecciones-regionales-municipales-2026-ds-001-2026-pcm/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2026-01-05',
    materias: ['electoral', 'elecciones 2026'],
    sumilla: 'Convoca elecciones regionales y municipales 2026',
  },
  // Firmas y Certificados Digitales
  {
    id: 'ley-27269',
    name: 'Ley de Firmas y Certificados Digitales',
    url: 'https://lpderecho.pe/ley-firmas-certificados-digitales-ley-27269-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2000-05-26',
    materias: ['digital', 'firmas digitales', 'certificados'],
    sumilla: 'Regula las firmas y certificados digitales',
  },
  // Firma digital sector público
  {
    id: 'ds-082-2024-pcm',
    name: 'Medidas para promover la firma digital en el sector público',
    url: 'https://lpderecho.pe/medidas-temporales-uso-firma-digital-sector-publico-decreto-supremo-082-2024-pcm/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2024-08-06',
    materias: ['digital', 'firma digital', 'gobierno digital'],
    sumilla: 'Promueve el uso de firma digital en entidades públicas',
  },
  // Financiamiento privado partidos
  {
    id: 'ley-32254',
    name: 'Ley que restituye el financiamiento privado a los partidos políticos',
    url: 'https://lpderecho.pe/ley-32254-restituyen-financiamiento-privado-partidos-politicos/',
    rango: 'ley',
    fechaPublicacion: '2024-08-30',
    materias: ['electoral', 'partidos políticos', 'financiamiento'],
    sumilla: 'Restituye financiamiento privado a partidos',
  },
  // Directiva INDECOPI procedimientos consumidor
  {
    id: 'directiva-indecopi-consumidor',
    name: 'Directiva que regula procedimientos de protección al consumidor',
    url: 'https://lpderecho.pe/indecopi-directiva-procedimientos-proteccion-consumidor/',
    rango: 'directiva',
    fechaPublicacion: '2020-01-15',
    materias: ['consumidor', 'INDECOPI', 'procedimiento'],
    sumilla: 'Regula procedimientos de INDECOPI en protección al consumidor',
  },
  // Cronograma electoral 2026
  {
    id: 'res-0632-2025-jne',
    name: 'Cronograma electoral para elecciones regionales y municipales 2026',
    url: 'https://lpderecho.pe/cronograma-electoral-elecciones-regionales-municipales-2026-resolucion-0632-2025-jne/',
    rango: 'resolucion',
    fechaPublicacion: '2025-10-30',
    materias: ['electoral', 'cronograma', 'JNE'],
    sumilla: 'Aprueba cronograma electoral 2026',
  },
  // Reglamento primarias 2026
  {
    id: 'rj-000187-2025-onpe',
    name: 'Reglamento de primarias para elecciones 2026',
    url: 'https://lpderecho.pe/reglamento-primarias-elecciones-regionales-municipales-2026-resolucion-jefatural-000187-2025-jn-onpe/',
    rango: 'resolucion',
    fechaPublicacion: '2025-11-15',
    materias: ['electoral', 'primarias', 'ONPE'],
    sumilla: 'Reglamento de primarias para elecciones 2026',
  },
  // Reglamento recuento votos
  {
    id: 'res-0852-2025-jne',
    name: 'Reglamento sobre Recuento de Votos para Elecciones 2026',
    url: 'https://lpderecho.pe/aprueban-reglamento-sobre-recuento-de-votos-para-las-elecciones-regionales-y-municipales-res-0852-2025-jne/',
    rango: 'resolucion',
    fechaPublicacion: '2026-01-10',
    materias: ['electoral', 'recuento', 'JNE'],
    sumilla: 'Aprueba reglamento de recuento de votos',
  },
  // Plan Nacional Control 2026
  {
    id: 'res-104-2026-cg',
    name: 'Plan Nacional de Control 2026',
    url: 'https://lpderecho.pe/plan-nacional-control-2026-resolucion-de-contraloria-104-2026-cg/',
    rango: 'resolucion',
    fechaPublicacion: '2026-01-20',
    materias: ['control', 'contraloría', 'plan de control'],
    sumilla: 'Aprueba el Plan Nacional de Control 2026',
  },
  // Código Procesal Penal segunda parte
  {
    id: 'codigo-procesal-penal-2',
    name: 'Código Procesal Penal (del artículo 446 al final)',
    url: 'https://lpderecho.pe/nuevo-codigo-procesal-penal/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2004-07-29',
    materias: ['procesal', 'penal', 'proceso penal'],
    sumilla: 'Segunda parte del Código Procesal Penal',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 13')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH13.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH13) {
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
