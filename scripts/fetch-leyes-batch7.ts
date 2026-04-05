#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 7 - URLs verificadas finales
 * Usage: npx tsx scripts/fetch-leyes-batch7.ts
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

const LEYES_BATCH7: LawDefinition[] = [
  // Aduanas
  {
    id: 'dleg-1053',
    name: 'Decreto Legislativo que aprueba la Ley General de Aduanas',
    url: 'https://lpderecho.pe/decreto-legislativo-ley-general-aduanas-decreto-legislativo-1053/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-27',
    materias: ['aduanas', 'comercio exterior', 'SUNAT'],
    sumilla:
      'Ley General de Aduanas que regula el ingreso y salida de mercancías',
  },
  {
    id: 'ley-28008',
    name: 'Ley de los Delitos Aduaneros',
    url: 'https://lpderecho.pe/ley-delitos-aduaneros-ley-28008-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2003-06-19',
    materias: ['penal', 'aduanas', 'contrabando'],
    sumilla: 'Tipifica los delitos aduaneros: contrabando, defraudación, etc.',
  },
  // Tributario
  {
    id: 'dleg-813',
    name: 'Ley Penal Tributaria',
    url: 'https://lpderecho.pe/ley-penal-tributaria-actualizada/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-04-20',
    materias: ['penal', 'tributario', 'defraudación tributaria'],
    sumilla: 'Tipifica los delitos tributarios y establece sus sanciones',
  },
  // Procesal Civil complementario
  {
    id: 'ley-26636',
    name: 'Ley Procesal del Trabajo',
    url: 'https://lpderecho.pe/ley-procesal-del-trabajo-ley-26636/',
    rango: 'ley',
    fechaPublicacion: '1996-06-21',
    materias: ['laboral', 'procesal'],
    sumilla: 'Proceso laboral aplicable donde no rige la Nueva Ley Procesal',
  },
  // Minería
  {
    id: 'ley-26821',
    name: 'Ley Orgánica para el Aprovechamiento Sostenible de los Recursos Naturales',
    url: 'https://lpderecho.pe/ley-organica-aprovechamiento-sostenible-recursos-naturales-ley-26821/',
    rango: 'ley-organica',
    fechaPublicacion: '1997-06-26',
    materias: ['ambiental', 'recursos naturales', 'concesiones'],
    sumilla: 'Regula el régimen de aprovechamiento de los recursos naturales',
  },
  // Hidrocarburos
  {
    id: 'ley-26221',
    name: 'Ley Orgánica de Hidrocarburos',
    url: 'https://lpderecho.pe/ley-organica-hidrocarburos-ley-26221/',
    rango: 'ley-organica',
    fechaPublicacion: '1993-08-20',
    materias: ['energía', 'hidrocarburos', 'petróleo'],
    sumilla: 'Regula la exploración y explotación de hidrocarburos',
  },
  // Electricidad
  {
    id: 'dley-25844',
    name: 'Ley de Concesiones Eléctricas',
    url: 'https://lpderecho.pe/ley-concesiones-electricas-decreto-ley-25844/',
    rango: 'decreto-ley',
    fechaPublicacion: '1992-11-19',
    materias: ['energía', 'electricidad', 'concesiones'],
    sumilla:
      'Regula las actividades de generación, transmisión y distribución eléctrica',
  },
  // Telecomunicaciones
  {
    id: 'ds-013-93-tcc',
    name: 'TUO de la Ley de Telecomunicaciones',
    url: 'https://lpderecho.pe/tuo-ley-telecomunicaciones-decreto-supremo-013-93-tcc/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1993-05-06',
    materias: ['telecomunicaciones', 'radiodifusión', 'MTC'],
    sumilla: 'Regula las telecomunicaciones en el Perú',
  },
  // Salud complementario
  {
    id: 'ley-29344',
    name: 'Ley Marco de Aseguramiento Universal en Salud',
    url: 'https://lpderecho.pe/ley-marco-aseguramiento-universal-salud-ley-29344/',
    rango: 'ley',
    fechaPublicacion: '2009-04-09',
    materias: ['salud', 'aseguramiento', 'AUS'],
    sumilla: 'Establece el marco del aseguramiento universal en salud',
  },
  // Pensiones públicas
  {
    id: 'dl-20530',
    name: 'Régimen de Pensiones del Decreto Ley 20530',
    url: 'https://lpderecho.pe/regimen-pensiones-decreto-ley-20530/',
    rango: 'decreto-ley',
    fechaPublicacion: '1974-02-26',
    materias: ['pensiones', 'función pública', 'seguridad social'],
    sumilla: 'Régimen de pensiones a cargo del Estado (cerrado)',
  },
  // Cooperativas
  {
    id: 'dleg-85',
    name: 'Ley General de Cooperativas',
    url: 'https://lpderecho.pe/ley-general-cooperativas-ds-074-90-tr/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1981-05-20',
    materias: ['comercial', 'cooperativas', 'economía social'],
    sumilla: 'Regula la constitución y funcionamiento de cooperativas',
  },
  // Competencia
  {
    id: 'dleg-1034',
    name: 'Ley de Represión de Conductas Anticompetitivas',
    url: 'https://lpderecho.pe/ley-represion-conductas-anticompetitivas-decreto-legislativo-1034/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-25',
    materias: ['competencia', 'INDECOPI', 'libre competencia'],
    sumilla: 'Prohíbe y sanciona las conductas anticompetitivas',
  },
  {
    id: 'dleg-1044',
    name: 'Ley de Represión de la Competencia Desleal',
    url: 'https://lpderecho.pe/ley-represion-competencia-desleal-decreto-legislativo-1044/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-26',
    materias: ['competencia', 'INDECOPI', 'publicidad'],
    sumilla: 'Reprime los actos de competencia desleal',
  },
  // INDECOPI complementario
  {
    id: 'dleg-1033',
    name: 'Ley de Organización y Funciones del INDECOPI',
    url: 'https://lpderecho.pe/ley-organizacion-funciones-indecopi-decreto-legislativo-1033/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-25',
    materias: ['INDECOPI', 'competencia', 'consumidor'],
    sumilla: 'Regula la organización y funciones del INDECOPI',
  },
  // Propiedad Industrial
  {
    id: 'dleg-1075',
    name: 'Decreto Legislativo que aprueba Disposiciones Complementarias a la Decisión 486',
    url: 'https://lpderecho.pe/decreto-legislativo-disposiciones-complementarias-decision-486-propiedad-industrial-decreto-legislativo-1075/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-28',
    materias: ['propiedad industrial', 'marcas', 'patentes'],
    sumilla: 'Disposiciones complementarias sobre propiedad industrial',
  },
  // Mercado de valores
  {
    id: 'dleg-861',
    name: 'Ley del Mercado de Valores',
    url: 'https://lpderecho.pe/ley-mercado-valores-decreto-legislativo-861/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-10-22',
    materias: ['financiero', 'valores', 'SMV'],
    sumilla: 'Regula el mercado de valores y la SMV',
  },
  // AFP - Sistema Privado de Pensiones
  {
    id: 'ds-054-97-ef',
    name: 'TUO de la Ley del Sistema Privado de Pensiones',
    url: 'https://lpderecho.pe/tuo-ley-sistema-privado-pensiones-decreto-supremo-054-97-ef/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1997-05-14',
    materias: ['pensiones', 'AFP', 'SPP'],
    sumilla: 'Regula el Sistema Privado de Pensiones administrado por las AFP',
  },
  // Áreas Naturales Protegidas
  {
    id: 'ley-26834',
    name: 'Ley de Áreas Naturales Protegidas',
    url: 'https://lpderecho.pe/ley-areas-naturales-protegidas-ley-26834/',
    rango: 'ley',
    fechaPublicacion: '1997-07-04',
    materias: ['ambiental', 'áreas protegidas', 'SERNANP'],
    sumilla: 'Regula la gestión de las áreas naturales protegidas',
  },
  // Pasivos ambientales
  {
    id: 'ley-28090',
    name: 'Ley que regula el Cierre de Minas',
    url: 'https://lpderecho.pe/ley-cierre-minas-ley-28090/',
    rango: 'ley',
    fechaPublicacion: '2003-10-14',
    materias: ['minería', 'ambiental', 'cierre de minas'],
    sumilla: 'Regula las obligaciones de cierre de minas',
  },
  // Fiscal complementario
  {
    id: 'dleg-824',
    name: 'Ley de Lucha contra la Evasión y para la Formalización de la Economía',
    url: 'https://lpderecho.pe/ley-lucha-evasion-formalizacion-economia-decreto-legislativo-824/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-04-24',
    materias: ['tributario', 'evasión', 'formalización'],
    sumilla: 'Medidas contra la evasión tributaria',
  },
  // Derechos Reales de Garantía
  {
    id: 'ley-28677',
    name: 'Ley de la Garantía Mobiliaria',
    url: 'https://lpderecho.pe/ley-garantia-mobiliaria-ley-28677/',
    rango: 'ley',
    fechaPublicacion: '2006-03-01',
    materias: ['civil', 'garantías', 'crédito'],
    sumilla: 'Ley original de garantía mobiliaria (antes del DLeg 1400)',
  },
  // Función Pública - SERVIR
  {
    id: 'dleg-1023',
    name: 'Decreto Legislativo que crea la Autoridad Nacional del Servicio Civil - SERVIR',
    url: 'https://lpderecho.pe/decreto-legislativo-crea-autoridad-nacional-servicio-civil-decreto-legislativo-1023/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-21',
    materias: ['función pública', 'SERVIR', 'servicio civil'],
    sumilla: 'Crea SERVIR como ente rector del sistema de recursos humanos',
  },
  // Inversión extranjera
  {
    id: 'dleg-662',
    name: 'Régimen de Estabilidad Jurídica a la Inversión Extranjera',
    url: 'https://lpderecho.pe/regimen-estabilidad-juridica-inversion-extranjera-decreto-legislativo-662/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-09-02',
    materias: ['inversión', 'extranjera', 'contratos ley'],
    sumilla: 'Establece estabilidad jurídica para la inversión extranjera',
  },
  // Simplificación administrativa
  {
    id: 'dleg-1246',
    name: 'Decreto Legislativo de Diversas Medidas de Simplificación Administrativa',
    url: 'https://lpderecho.pe/decreto-legislativo-diversas-medidas-simplificacion-administrativa-decreto-legislativo-1246/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2016-11-10',
    materias: ['administrativo', 'simplificación', 'interoperabilidad'],
    sumilla: 'Establece medidas de simplificación administrativa',
  },
  // Gobierno abierto
  {
    id: 'dleg-1353',
    name: 'Decreto Legislativo que crea la Autoridad Nacional de Transparencia',
    url: 'https://lpderecho.pe/d-l-1353-crea-autoridad-nacional-de-transparencia-y-acceso-a-la-informacion-publica-fortalece-el-regimen-de-proteccion-de-datos-personales-y-la-regulacion-de-la-gestion-de-intereses/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2017-01-07',
    materias: ['transparencia', 'datos personales', 'lobbies'],
    sumilla:
      'Crea la Autoridad Nacional de Transparencia y regula gestión de intereses',
  },
  // Policía complementario
  {
    id: 'dleg-1149',
    name: 'Ley de la Carrera y Situación del Personal de la PNP',
    url: 'https://lpderecho.pe/ley-carrera-situacion-personal-pnp-decreto-legislativo-1149/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2012-12-11',
    materias: ['PNP', 'carrera policial', 'régimen disciplinario'],
    sumilla: 'Regula la carrera y situación del personal policial',
  },
  // Militar
  {
    id: 'dleg-1094',
    name: 'Código Penal Militar Policial',
    url: 'https://lpderecho.pe/codigo-penal-militar-policial-decreto-legislativo-1094/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2010-09-01',
    materias: ['penal', 'militar', 'policial'],
    sumilla: 'Código Penal aplicable al personal militar y policial',
  },
  // Régimen disciplinario
  {
    id: 'ley-29131',
    name: 'Ley del Régimen Disciplinario de las Fuerzas Armadas',
    url: 'https://lpderecho.pe/ley-regimen-disciplinario-fuerzas-armadas-ley-29131/',
    rango: 'ley',
    fechaPublicacion: '2007-11-09',
    materias: ['militar', 'disciplinario', 'fuerzas armadas'],
    sumilla: 'Establece el régimen disciplinario de las Fuerzas Armadas',
  },
  // Teletrabajo
  {
    id: 'ley-31572',
    name: 'Ley del Teletrabajo',
    url: 'https://lpderecho.pe/ley-teletrabajo-ley-31572/',
    rango: 'ley',
    fechaPublicacion: '2022-09-09',
    materias: ['laboral', 'teletrabajo', 'trabajo remoto'],
    sumilla: 'Regula el teletrabajo como modalidad laboral',
  },
  // Tercerización
  {
    id: 'ley-29245',
    name: 'Ley que regula los Servicios de Tercerización',
    url: 'https://lpderecho.pe/ley-regula-servicios-tercerizacion-ley-29245/',
    rango: 'ley',
    fechaPublicacion: '2008-06-24',
    materias: ['laboral', 'tercerización', 'outsourcing'],
    sumilla: 'Regula la tercerización de servicios',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 7')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH7.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH7) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting - 5 seconds
    await new Promise((r) => setTimeout(r, 5000))
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
