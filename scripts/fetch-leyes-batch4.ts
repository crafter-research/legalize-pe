#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 4 - Leyes Orgánicas y Complementarias
 * Usage: npx tsx scripts/fetch-leyes-batch4.ts
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

const LEYES_BATCH4: LawDefinition[] = [
  // Leyes Orgánicas
  {
    id: 'ley-28301',
    name: 'Ley Orgánica del Tribunal Constitucional',
    url: 'https://lpderecho.pe/ley-organica-del-tribunal-constitucional/',
    rango: 'ley-organica',
    fechaPublicacion: '2004-07-23',
    materias: ['constitucional', 'tribunal constitucional', 'justicia'],
    sumilla:
      'Regula la organización y funcionamiento del Tribunal Constitucional',
  },
  {
    id: 'ley-26520',
    name: 'Ley Orgánica de la Defensoría del Pueblo',
    url: 'https://lpderecho.pe/ley-organica-de-la-defensoria-del-pueblo/',
    rango: 'ley-organica',
    fechaPublicacion: '1995-08-08',
    materias: ['constitucional', 'defensoría del pueblo', 'derechos humanos'],
    sumilla:
      'Regula la Defensoría del Pueblo como órgano constitucional autónomo',
  },
  {
    id: 'dley-26123',
    name: 'Ley Orgánica del Banco Central de Reserva del Perú',
    url: 'https://lpderecho.pe/ley-organica-del-banco-central-de-reserva-del-peru/',
    rango: 'decreto-ley',
    fechaPublicacion: '1992-12-30',
    materias: ['constitucional', 'banca', 'economía', 'BCRP'],
    sumilla: 'Regula el BCRP con función de preservar la estabilidad monetaria',
  },
  {
    id: 'ley-26889',
    name: 'Ley Marco para la Producción y Sistematización Legislativa',
    url: 'https://lpderecho.pe/ley-marco-produccion-sistematizacion-legislativa-ley-26889/',
    rango: 'ley',
    fechaPublicacion: '1997-12-09',
    materias: ['legislativo', 'técnica legislativa'],
    sumilla: 'Establece lineamientos para la elaboración de normas',
  },
  // Laboral complementario
  {
    id: 'ds-002-97-tr',
    name: 'TUO del D.Leg. 728, Ley de Formación y Promoción Laboral',
    url: 'https://lpderecho.pe/tuo-decreto-legislativo-728-ley-formacion-promocion-laboral-decreto-supremo-002-97-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1997-03-27',
    materias: ['laboral', 'formación laboral', 'promoción'],
    sumilla: 'Regula la formación laboral y promoción del empleo',
  },
  {
    id: 'ds-007-2002-tr',
    name: 'TUO de la Ley de Jornada de Trabajo',
    url: 'https://lpderecho.pe/tuo-ley-jornada-trabajo-horario-trabajo-sobretiempo-decreto-supremo-007-2002-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2002-07-04',
    materias: ['laboral', 'jornada laboral', 'horas extra'],
    sumilla: 'Regula la jornada de trabajo, horario y trabajo en sobretiempo',
  },
  {
    id: 'ley-29277',
    name: 'Ley de la Carrera Judicial',
    url: 'https://lpderecho.pe/ley-carrera-judicial-ley-29277-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2008-11-07',
    materias: ['judicial', 'carrera judicial', 'jueces'],
    sumilla: 'Regula el ingreso, permanencia, ascenso y terminación de jueces',
  },
  // Financiero
  {
    id: 'dleg-1531',
    name: 'Decreto Legislativo que modifica la Ley del Sistema Financiero',
    url: 'https://lpderecho.pe/modifican-ley-general-sistema-financiero-sistema-seguros-decreto-legislativo-1531/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2022-03-10',
    materias: ['financiero', 'banca', 'seguros', 'SBS'],
    sumilla: 'Modifica la Ley 26702 del sistema financiero y de seguros',
  },
  {
    id: 'ley-30822',
    name: 'Ley de Supervisión de Cooperativas de Ahorro',
    url: 'https://lpderecho.pe/ley-30822-permite-sbs-supervisar-cooperativas-ahorro/',
    rango: 'ley',
    fechaPublicacion: '2018-07-19',
    materias: ['financiero', 'cooperativas', 'SBS'],
    sumilla: 'Permite a la SBS supervisar cooperativas de ahorro y crédito',
  },
  {
    id: 'ley-31143',
    name: 'Ley contra la Usura',
    url: 'https://lpderecho.pe/ley-usura-tasas-interes-servicios-financieros/',
    rango: 'ley',
    fechaPublicacion: '2021-03-18',
    materias: ['financiero', 'consumidor', 'tasas de interés'],
    sumilla: 'Protege a usuarios de servicios financieros de tasas usureras',
  },
  // Control gubernamental
  {
    id: 'ley-30742',
    name: 'Ley de Fortalecimiento de la Contraloría General',
    url: 'https://lpderecho.pe/ley-30742-fortalece-contraloria-general-republica/',
    rango: 'ley',
    fechaPublicacion: '2018-03-28',
    materias: ['control gubernamental', 'contraloría', 'anticorrupción'],
    sumilla: 'Fortalece la CGR y el Sistema Nacional de Control',
  },
  // Energía
  {
    id: 'ley-30705',
    name: 'Ley de Organización y Funciones del MINEM',
    url: 'https://lpderecho.pe/ley-organizacion-funciones-ministerio-energia-minas-ley-30705/',
    rango: 'ley',
    fechaPublicacion: '2017-12-21',
    materias: ['energía', 'minería', 'organización estatal'],
    sumilla: 'Define la naturaleza jurídica y funciones del MINEM',
  },
  // Ambiental
  {
    id: 'ley-27446',
    name: 'Ley del Sistema Nacional de Evaluación de Impacto Ambiental',
    url: 'https://lpderecho.pe/ley-sistema-nacional-evaluacion-impacto-ambiental-ley-27446/',
    rango: 'ley',
    fechaPublicacion: '2001-04-23',
    materias: ['ambiental', 'impacto ambiental', 'SEIA'],
    sumilla:
      'Crea el SEIA como sistema único para identificar impactos ambientales',
  },
  // Electoral complementario
  {
    id: 'ley-26486',
    name: 'Ley Orgánica del Jurado Nacional de Elecciones',
    url: 'https://lpderecho.pe/ley-organica-del-jurado-nacional-de-elecciones/',
    rango: 'ley-organica',
    fechaPublicacion: '1995-06-21',
    materias: ['electoral', 'JNE', 'justicia electoral'],
    sumilla: 'Regula la organización y funcionamiento del JNE',
  },
  {
    id: 'ley-26487',
    name: 'Ley Orgánica de la ONPE',
    url: 'https://lpderecho.pe/ley-organica-de-la-oficina-nacional-de-procesos-electorales/',
    rango: 'ley-organica',
    fechaPublicacion: '1995-06-21',
    materias: ['electoral', 'ONPE', 'procesos electorales'],
    sumilla: 'Regula la organización de procesos electorales',
  },
  {
    id: 'ley-26497',
    name: 'Ley Orgánica del RENIEC',
    url: 'https://lpderecho.pe/ley-organica-del-registro-nacional-de-identificacion-y-estado-civil/',
    rango: 'ley-organica',
    fechaPublicacion: '1995-07-12',
    materias: ['electoral', 'RENIEC', 'identidad'],
    sumilla: 'Regula el registro de identidad y estado civil',
  },
  // Transparencia
  {
    id: 'ley-27806',
    name: 'Ley de Transparencia y Acceso a la Información Pública',
    url: 'https://lpderecho.pe/ley-transparencia-acceso-informacion-publica-ley-27806/',
    rango: 'ley',
    fechaPublicacion: '2002-08-03',
    materias: ['transparencia', 'acceso a información', 'gobierno abierto'],
    sumilla: 'Promueve la transparencia y acceso a información del Estado',
  },
  // Procedimientos especiales
  {
    id: 'ley-27584',
    name: 'Ley que regula el Proceso Contencioso Administrativo',
    url: 'https://lpderecho.pe/ley-proceso-contencioso-administrativo-27584/',
    rango: 'ley',
    fechaPublicacion: '2001-12-07',
    materias: ['administrativo', 'procesal', 'contencioso administrativo'],
    sumilla: 'Regula el proceso judicial para impugnar actos administrativos',
  },
  {
    id: 'ley-26636',
    name: 'Ley Procesal del Trabajo',
    url: 'https://lpderecho.pe/ley-procesal-trabajo-ley-26636-actualizada/',
    rango: 'ley',
    fechaPublicacion: '1996-06-21',
    materias: ['laboral', 'procesal laboral'],
    sumilla: 'Proceso laboral anterior a la Nueva Ley Procesal del Trabajo',
  },
  // Propiedad y Registros
  {
    id: 'ley-26366',
    name: 'Ley de Creación del Sistema Nacional de Registros Públicos',
    url: 'https://lpderecho.pe/ley-creacion-sistema-nacional-registros-publicos-sunarp-ley-26366/',
    rango: 'ley',
    fechaPublicacion: '1994-10-16',
    materias: ['registral', 'SUNARP', 'propiedad'],
    sumilla: 'Crea el Sistema Nacional de Registros Públicos y la SUNARP',
  },
  {
    id: 'ley-29080',
    name: 'Ley de Creación del Registro del Agente Inmobiliario',
    url: 'https://lpderecho.pe/ley-creacion-registro-agente-inmobiliario-ministerio-vivienda-ley-29080/',
    rango: 'ley',
    fechaPublicacion: '2007-09-11',
    materias: ['inmobiliario', 'registral', 'vivienda'],
    sumilla: 'Crea el registro de agentes inmobiliarios',
  },
  // Salud
  {
    id: 'ley-26790',
    name: 'Ley de Modernización de la Seguridad Social en Salud',
    url: 'https://lpderecho.pe/ley-modernizacion-seguridad-social-salud-ley-26790/',
    rango: 'ley',
    fechaPublicacion: '1997-05-17',
    materias: ['salud', 'seguridad social', 'EsSalud'],
    sumilla: 'Moderniza la seguridad social en salud y crea las EPS',
  },
  {
    id: 'ds-009-97-sa',
    name: 'Reglamento de la Ley de Modernización de la Seguridad Social en Salud',
    url: 'https://lpderecho.pe/reglamento-ley-de-modernizacion-de-la-seguridad-social-en-salud-decreto-supremo-009-97-sa/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1997-09-09',
    materias: ['salud', 'seguridad social', 'EPS'],
    sumilla: 'Reglamenta la Ley 26790 de seguridad social en salud',
  },
  // Defensa
  {
    id: 'dleg-1134',
    name: 'Ley de Organización y Funciones del Ministerio de Defensa',
    url: 'https://lpderecho.pe/ley-organizacion-funciones-ministerio-defensa-decreto-legislativo-1134/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2012-12-10',
    materias: ['defensa', 'fuerzas armadas', 'organización estatal'],
    sumilla: 'Define naturaleza jurídica y funciones del MINDEF',
  },
  // Interior
  {
    id: 'dleg-1266',
    name: 'Ley de Organización y Funciones del Ministerio del Interior',
    url: 'https://lpderecho.pe/ley-organizacion-funciones-ministerio-interior-decreto-legislativo-1266/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2016-12-17',
    materias: ['interior', 'PNP', 'seguridad ciudadana'],
    sumilla: 'Define naturaleza jurídica y funciones del MININTER',
  },
  // Penal complementario
  {
    id: 'ley-30838',
    name: 'Ley que modifica el Código Penal en Delitos Sexuales',
    url: 'https://lpderecho.pe/ley-30838-modifica-codigo-penal-delitos-contra-libertad-sexual/',
    rango: 'ley',
    fechaPublicacion: '2018-08-04',
    materias: ['penal', 'delitos sexuales', 'violencia'],
    sumilla: 'Modifica el Código Penal en delitos contra la libertad sexual',
  },
  {
    id: 'ley-30364',
    name: 'Ley para Prevenir, Sancionar y Erradicar la Violencia contra las Mujeres',
    url: 'https://lpderecho.pe/ley-prevenir-sancionar-erradicar-violencia-mujeres-integrantes-grupo-familiar-30364/',
    rango: 'ley',
    fechaPublicacion: '2015-11-23',
    materias: ['penal', 'violencia', 'género', 'familia'],
    sumilla:
      'Establece mecanismos para prevenir y sancionar la violencia contra las mujeres',
  },
  // Civil complementario
  {
    id: 'ley-27287',
    name: 'Ley de Títulos Valores',
    url: 'https://lpderecho.pe/ley-titulos-valores-ley-27287-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2000-06-19',
    materias: ['comercial', 'títulos valores', 'letra de cambio'],
    sumilla: 'Regula los títulos valores: letras, pagarés, cheques, etc.',
  },
  {
    id: 'ley-27809',
    name: 'Ley General del Sistema Concursal',
    url: 'https://lpderecho.pe/ley-general-sistema-concursal-ley-27809-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2002-08-08',
    materias: ['comercial', 'concursal', 'insolvencia', 'INDECOPI'],
    sumilla: 'Regula la reestructuración patrimonial y liquidación de empresas',
  },
  // Descentralización
  {
    id: 'ley-27783',
    name: 'Ley de Bases de la Descentralización',
    url: 'https://lpderecho.pe/ley-bases-descentralizacion-ley-27783/',
    rango: 'ley',
    fechaPublicacion: '2002-07-20',
    materias: [
      'descentralización',
      'gobiernos regionales',
      'gobiernos locales',
    ],
    sumilla: 'Desarrolla el proceso de descentralización del Estado',
  },
  {
    id: 'ley-27867',
    name: 'Ley Orgánica de Gobiernos Regionales',
    url: 'https://lpderecho.pe/ley-organica-gobiernos-regionales-ley-27867/',
    rango: 'ley-organica',
    fechaPublicacion: '2002-11-18',
    materias: ['descentralización', 'gobiernos regionales', 'autonomía'],
    sumilla: 'Regula la estructura y funcionamiento de gobiernos regionales',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 4')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH4.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH4) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting - 3 seconds to avoid 403
    await new Promise((r) => setTimeout(r, 3000))
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
