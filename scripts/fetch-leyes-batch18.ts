#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 18 - Educación, transporte, cooperativas, saneamiento, tercerización
 * Usage: npx tsx scripts/fetch-leyes-batch18.ts
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

const LEYES_BATCH18: LawDefinition[] = [
  // Ley Universitaria
  {
    id: 'ley-30220',
    name: 'Ley Universitaria',
    url: 'https://lpderecho.pe/ley-universitaria-ley-30220-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2014-07-09',
    materias: ['educación', 'universidades', 'SUNEDU'],
    sumilla: 'Regula la educación universitaria',
  },
  // Modificación Ley Universitaria
  {
    id: 'ley-32105',
    name: 'Ley que modifica la Ley Universitaria sobre clases virtuales',
    url: 'https://lpderecho.pe/ley-32105-licenciamiento-permanente-universidades-clases-virtuales/',
    rango: 'ley',
    fechaPublicacion: '2024-04-23',
    materias: ['educación', 'universidades', 'virtualidad'],
    sumilla: 'Establece clases virtuales y licenciamiento permanente',
  },
  // Ley General de Transporte
  {
    id: 'ley-27181',
    name: 'Ley General de Transporte y Tránsito Terrestre',
    url: 'https://lpderecho.pe/ley-27181-ley-general-transporte-transito-terrestre/',
    rango: 'ley',
    fechaPublicacion: '1999-10-08',
    materias: ['transporte', 'tránsito', 'MTC'],
    sumilla: 'Regula el transporte y tránsito terrestre',
  },
  // Código de Tránsito
  {
    id: 'ds-016-2009-mtc',
    name: 'TUO del Reglamento Nacional de Tránsito - Código de Tránsito',
    url: 'https://lpderecho.pe/tuo-reglamento-nacional-transito-codigo-transito-ds-016-2009-mtc/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2009-04-22',
    materias: ['transporte', 'tránsito', 'vehículos'],
    sumilla: 'Código de Tránsito actualizado',
  },
  // TUO Ley General Cooperativas
  {
    id: 'ds-001-2026-produce',
    name: 'TUO de la Ley General de Cooperativas',
    url: 'https://lpderecho.pe/texto-unico-ordenado-ley-general-cooperativas-decreto-supremo-001-2026-produce/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2026-01-15',
    materias: ['cooperativas', 'asociatividad', 'economía social'],
    sumilla: 'TUO de la Ley General de Cooperativas',
  },
  // Ley General de Sociedades
  {
    id: 'ley-26887',
    name: 'Ley General de Sociedades',
    url: 'https://lpderecho.pe/ley-general-sociedades-ley-26887-actualizado/',
    rango: 'ley',
    fechaPublicacion: '1997-12-09',
    materias: ['societario', 'empresas', 'sociedades'],
    sumilla: 'Regula las sociedades comerciales',
  },
  // Servicio universal agua potable
  {
    id: 'ds-001-2025-vivienda',
    name: 'TUO de la Ley del servicio universal de agua potable y saneamiento',
    url: 'https://lpderecho.pe/texto-unico-ordenado-ley-servicio-universal-agua-potable-saneamiento-decreto-supremo-001-2025-vivienda/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2025-01-20',
    materias: ['saneamiento', 'agua potable', 'servicios públicos'],
    sumilla: 'TUO del DLeg. 1280 sobre agua potable y saneamiento',
  },
  // Acceso universal agua potable
  {
    id: 'ley-32065',
    name: 'Ley que establece medidas para asegurar el acceso universal al agua potable',
    url: 'https://lpderecho.pe/ley-32065-acceso-universal-agua-potable/',
    rango: 'ley',
    fechaPublicacion: '2024-02-15',
    materias: ['saneamiento', 'agua potable', 'derechos fundamentales'],
    sumilla: 'Garantiza acceso universal al agua potable',
  },
  // Tercerización
  {
    id: 'ley-29245',
    name: 'Ley que regula los servicios de tercerización',
    url: 'https://lpderecho.pe/ley-tercerizacion-ley-29245/',
    rango: 'ley',
    fechaPublicacion: '2008-06-24',
    materias: ['laboral', 'tercerización', 'outsourcing'],
    sumilla: 'Regula la tercerización laboral',
  },
  // Asignación familiar
  {
    id: 'ley-25129',
    name: 'Ley que regula la asignación familiar',
    url: 'https://lpderecho.pe/ley-regula-asignacion-familiar-ley-25129/',
    rango: 'ley',
    fechaPublicacion: '1989-12-06',
    materias: ['laboral', 'asignación familiar', 'beneficios sociales'],
    sumilla: 'Establece la asignación familiar',
  },
  // Residuos sólidos
  {
    id: 'ley-32212',
    name: 'Ley de gestión y manejo de residuos sólidos',
    url: 'https://lpderecho.pe/ley-32212-gestion-manejo-residuos-solidos/',
    rango: 'ley',
    fechaPublicacion: '2024-07-10',
    materias: ['ambiental', 'residuos sólidos', 'reciclaje'],
    sumilla: 'Regula la gestión de residuos sólidos',
  },
  // Gestión ambiental agrario
  {
    id: 'ds-006-2024-midagri',
    name: 'Reglamento de gestión ambiental del sector agrario y de riego',
    url: 'https://lpderecho.pe/reglamento-gestion-ambiental-sector-agrario-riego-decreto-supremo-006-2024-midagri/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2024-05-20',
    materias: ['ambiental', 'agrario', 'riego'],
    sumilla: 'Regula gestión ambiental del sector agrario',
  },
  // Cooperativas agrarias
  {
    id: 'ley-31335',
    name: 'Ley de perfeccionamiento de la asociatividad de productores agrarios en cooperativas',
    url: 'https://lpderecho.pe/ley-31335-ley-perfeccionamiento-asociatividad-productores-agrarios-cooperativas-agrarias/',
    rango: 'ley',
    fechaPublicacion: '2021-08-05',
    materias: ['agrario', 'cooperativas', 'productores'],
    sumilla: 'Fortalece cooperativas agrarias',
  },
  // Fortalece cooperativas
  {
    id: 'ley-31725',
    name: 'Ley que amplía participación y fortalece a las cooperativas',
    url: 'https://lpderecho.pe/ley-31725-amplia-participacion-fortalece-cooperativas/',
    rango: 'ley',
    fechaPublicacion: '2023-05-18',
    materias: ['cooperativas', 'asociatividad'],
    sumilla: 'Fortalece el régimen cooperativo',
  },
  // Arrendamiento análisis
  {
    id: 'articulo-arrendamiento',
    name: 'El contrato de arrendamiento en el Código Civil',
    url: 'https://lpderecho.pe/contrato-arrendamiento-articulo-1666-codigo-civil/',
    rango: 'articulo',
    fechaPublicacion: '2023-01-15',
    materias: ['civil', 'arrendamiento', 'contratos'],
    sumilla: 'Análisis del contrato de arrendamiento',
  },
  // Impuestos arrendamiento
  {
    id: 'ley-32430',
    name: 'Ley que regula pago de impuestos por arrendamiento de inmuebles',
    url: 'https://lpderecho.pe/ley-32430-regulan-pago-impuestos-arrendamiento-inmuebles/',
    rango: 'ley',
    fechaPublicacion: '2025-08-15',
    materias: ['tributario', 'arrendamiento', 'impuesto a la renta'],
    sumilla: 'Regula tributación de arrendamientos',
  },
  // Intermediación laboral
  {
    id: 'articulo-intermediacion-laboral',
    name: 'La intermediación laboral: concepto y regulación',
    url: 'https://lpderecho.pe/intermediacion-laboral/',
    rango: 'articulo',
    fechaPublicacion: '2022-03-10',
    materias: ['laboral', 'intermediación', 'services'],
    sumilla: 'Análisis de la intermediación laboral',
  },
  // Diferencias tercerización intermediación
  {
    id: 'articulo-tercerizacion-intermediacion',
    name: 'Diferencias entre tercerización e intermediación laboral',
    url: 'https://lpderecho.pe/tercerizacion-intermediacion-laboral-diferencias/',
    rango: 'articulo',
    fechaPublicacion: '2022-08-20',
    materias: ['laboral', 'tercerización', 'intermediación'],
    sumilla: 'Comparación entre tercerización e intermediación',
  },
  // Asignación familiar aspectos
  {
    id: 'articulo-asignacion-familiar',
    name: 'Asignación familiar: aspectos claves',
    url: 'https://lpderecho.pe/asignacion-familiar-aspectos-claves/',
    rango: 'articulo',
    fechaPublicacion: '2023-02-01',
    materias: ['laboral', 'asignación familiar', 'análisis'],
    sumilla: 'Aspectos claves de la asignación familiar',
  },
  // Derecho ambiental
  {
    id: 'articulo-derecho-ambiental',
    name: 'Derecho ambiental: definición, relevancia, temas y características',
    url: 'https://lpderecho.pe/derecho-ambiental-definicion-relevancia-temas-caracteristicas-y-fuentes/',
    rango: 'articulo',
    fechaPublicacion: '2022-06-15',
    materias: ['ambiental', 'doctrina', 'análisis'],
    sumilla: 'Introducción al derecho ambiental',
  },
  // Evaluación impacto ambiental
  {
    id: 'articulo-evaluacion-impacto-ambiental',
    name: 'Evaluación de impacto ambiental: origen, concepto y evolución',
    url: 'https://lpderecho.pe/evaluacion-impacto-ambiental-origen-concepto-evolucion/',
    rango: 'articulo',
    fechaPublicacion: '2022-04-20',
    materias: ['ambiental', 'EIA', 'SEIA'],
    sumilla: 'Análisis de la evaluación de impacto ambiental',
  },
  // Asociación, fundación y comité
  {
    id: 'articulo-asociacion-fundacion-comite',
    name: 'Asociación, fundación y comité en el Código Civil',
    url: 'https://lpderecho.pe/asociacion-fundacion-y-comite-las-personas-juridicas-en-el-codigo-civil-peruano/',
    rango: 'articulo',
    fechaPublicacion: '2022-09-10',
    materias: ['civil', 'personas jurídicas', 'asociaciones'],
    sumilla: 'Análisis de las personas jurídicas no societarias',
  },
  // Derecho administrativo tránsito
  {
    id: 'articulo-derecho-transito',
    name: 'Introducción al derecho administrativo de tránsito',
    url: 'https://lpderecho.pe/introduccion-derecho-administrativo-transito/',
    rango: 'articulo',
    fechaPublicacion: '2022-11-05',
    materias: ['transporte', 'tránsito', 'administrativo'],
    sumilla: 'Introducción al derecho de tránsito',
  },
  // Alquiler seguro
  {
    id: 'articulo-alquiler-seguro',
    name: 'Cómo alquilar un inmueble de forma segura',
    url: 'https://lpderecho.pe/contrato-arrendamiento-seguro/',
    rango: 'articulo',
    fechaPublicacion: '2023-03-15',
    materias: ['civil', 'arrendamiento', 'contratos'],
    sumilla: 'Guía para alquiler seguro de inmuebles',
  },
  // Desalojo express
  {
    id: 'articulo-desalojo-express',
    name: 'El verdadero desalojo express en el Perú',
    url: 'https://lpderecho.pe/peru-tenemos-verdadero-desalojo-express-pero-nadie-usa/',
    rango: 'articulo',
    fechaPublicacion: '2023-05-20',
    materias: ['civil', 'desalojo', 'arrendamiento'],
    sumilla: 'Análisis del proceso de desalojo',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 18')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH18.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH18) {
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
