#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 5 - URLs verificadas
 * Usage: npx tsx scripts/fetch-leyes-batch5.ts
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

const LEYES_BATCH5: LawDefinition[] = [
  // Títulos Valores
  {
    id: 'ley-27287',
    name: 'Ley de Títulos Valores',
    url: 'https://lpderecho.pe/ley-titulos-valores-ley-27287/',
    rango: 'ley',
    fechaPublicacion: '2000-06-19',
    materias: ['comercial', 'títulos valores', 'letra de cambio', 'pagaré'],
    sumilla: 'Regula los títulos valores: letras, pagarés, cheques, acciones, etc.',
  },
  // Transparencia
  {
    id: 'ds-021-2019-jus-tuo-27806',
    name: 'TUO de la Ley de Transparencia y Acceso a la Información Pública',
    url: 'https://lpderecho.pe/tuo-ley-transparencia-acceso-informacion-publica-ley-27806-actualizada/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2019-12-11',
    materias: ['transparencia', 'acceso a información', 'gobierno abierto'],
    sumilla: 'TUO que garantiza el derecho de acceso a la información pública',
  },
  // Conciliación
  {
    id: 'ley-26872',
    name: 'Ley de Conciliación',
    url: 'https://lpderecho.pe/ley-conciliacion-ley-26872/',
    rango: 'ley',
    fechaPublicacion: '1997-11-13',
    materias: ['procesal', 'conciliación', 'MARC'],
    sumilla: 'Establece la conciliación extrajudicial como mecanismo alternativo',
  },
  {
    id: 'ds-017-2021-jus',
    name: 'TUO del Reglamento de la Ley de Conciliación',
    url: 'https://lpderecho.pe/texto-unico-ordenado-reglamento-ley-conciliacion-decreto-supremo-017-2021-jus/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2021-11-17',
    materias: ['procesal', 'conciliación', 'reglamento'],
    sumilla: 'Reglamenta la Ley 26872 de Conciliación Extrajudicial',
  },
  // Arbitraje
  {
    id: 'dleg-1071',
    name: 'Decreto Legislativo que norma el Arbitraje',
    url: 'https://lpderecho.pe/decreto-legislativo-norma-arbitraje-dl-1071/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-28',
    materias: ['arbitraje', 'MARC', 'resolución de conflictos'],
    sumilla: 'Ley de Arbitraje vigente que regula el arbitraje nacional e internacional',
  },
  // Garantía Mobiliaria
  {
    id: 'dleg-1400',
    name: 'Decreto Legislativo que aprueba el Régimen de Garantía Mobiliaria',
    url: 'https://lpderecho.pe/decreto-legislativo-1400-que-aprueba-el-regimen-de-garantia-inmobiliaria/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-09',
    materias: ['civil', 'garantías', 'mobiliario', 'crédito'],
    sumilla: 'Nuevo régimen de garantía mobiliaria para impulsar el acceso al crédito',
  },
  // Extinción de Dominio
  {
    id: 'dleg-1373',
    name: 'Decreto Legislativo sobre Extinción de Dominio',
    url: 'https://lpderecho.pe/decreto-legislativo-sobre-extincion-de-dominio-actualizado/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-08-04',
    materias: ['penal', 'extinción de dominio', 'anticorrupción'],
    sumilla: 'Regula la extinción de dominio de bienes de origen o destino ilícito',
  },
  {
    id: 'ds-007-2019-jus-extincion',
    name: 'Reglamento del Decreto Legislativo sobre Extinción de Dominio',
    url: 'https://lpderecho.pe/reglamento-decreto-legislativo-extincion-dominio/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2019-02-21',
    materias: ['penal', 'extinción de dominio', 'reglamento'],
    sumilla: 'Reglamenta el DLeg 1373 sobre extinción de dominio',
  },
  // Reglamento Ley 30364
  {
    id: 'ds-009-2016-mimp',
    name: 'Reglamento de la Ley para Prevenir la Violencia contra las Mujeres',
    url: 'https://lpderecho.pe/reglamento-ley-30364-prevenir-sancionar-erradicar-violencia-mujeres-integrantes-grupo-familiar-decreto-supremo-009-2016-mimp/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2016-07-27',
    materias: ['género', 'violencia', 'familia', 'reglamento'],
    sumilla: 'Reglamenta la Ley 30364 contra la violencia hacia las mujeres',
  },
  // Contrataciones Públicas - Nueva Ley
  {
    id: 'ley-32069',
    name: 'Ley General de Contrataciones Públicas',
    url: 'https://lpderecho.pe/ley-general-de-contrataciones-publicas-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2024-06-24',
    materias: ['contrataciones', 'estado', 'OSCE'],
    sumilla: 'Nueva ley de contrataciones públicas que reemplaza la Ley 30225',
  },
  // Reglamento Registros Públicos
  {
    id: 'res-126-2012-sunarp',
    name: 'TUO del Reglamento General de los Registros Públicos',
    url: 'https://lpderecho.pe/texto-unico-ordenado-reglamento-general-registros-publicos-resolucion-126-2012-sunarp-sn/',
    rango: 'resolucion',
    fechaPublicacion: '2012-05-18',
    materias: ['registral', 'SUNARP', 'propiedad'],
    sumilla: 'Reglamento general de los registros públicos administrados por SUNARP',
  },
  // Protección de Datos Personales
  {
    id: 'ley-29733',
    name: 'Ley de Protección de Datos Personales',
    url: 'https://lpderecho.pe/ley-29733-ley-de-proteccion-de-datos-personales/',
    rango: 'ley',
    fechaPublicacion: '2011-07-03',
    materias: ['digital', 'datos personales', 'privacidad'],
    sumilla: 'Protege el derecho fundamental de las personas a sus datos personales',
  },
  // Reglamento de Protección de Datos - actualizado 2024
  {
    id: 'ds-016-2024-jus',
    name: 'Reglamento de la Ley de Protección de Datos Personales',
    url: 'https://lpderecho.pe/reglamento-ley-proteccion-datos-personales-decreto-supremo-016-2024-jus/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2024-09-20',
    materias: ['digital', 'datos personales', 'privacidad', 'reglamento'],
    sumilla: 'Nuevo reglamento de la Ley 29733 de protección de datos personales',
  },
  // Ley del Notariado
  {
    id: 'dleg-1049',
    name: 'Decreto Legislativo del Notariado',
    url: 'https://lpderecho.pe/decreto-legislativo-notariado-decreto-legislativo-1049/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-26',
    materias: ['notarial', 'fe pública', 'escrituras'],
    sumilla: 'Regula la función notarial y organización del notariado',
  },
  // Ley General de Salud
  {
    id: 'ley-26842',
    name: 'Ley General de Salud',
    url: 'https://lpderecho.pe/ley-general-salud-ley-26842/',
    rango: 'ley',
    fechaPublicacion: '1997-07-20',
    materias: ['salud', 'derecho a la salud', 'sistema de salud'],
    sumilla: 'Establece el marco general del derecho a la salud en el Perú',
  },
  // Ley de Recursos Hídricos
  {
    id: 'ley-29338',
    name: 'Ley de Recursos Hídricos',
    url: 'https://lpderecho.pe/ley-recursos-hidricos-ley-29338/',
    rango: 'ley',
    fechaPublicacion: '2009-03-31',
    materias: ['ambiental', 'agua', 'recursos hídricos', 'ANA'],
    sumilla: 'Regula el uso y gestión integrada de los recursos hídricos',
  },
  // Ley Forestal y de Fauna Silvestre
  {
    id: 'ley-29763',
    name: 'Ley Forestal y de Fauna Silvestre',
    url: 'https://lpderecho.pe/ley-forestal-fauna-silvestre-ley-29763/',
    rango: 'ley',
    fechaPublicacion: '2011-07-22',
    materias: ['ambiental', 'forestal', 'fauna', 'biodiversidad'],
    sumilla: 'Regula la gestión sostenible de los recursos forestales y de fauna',
  },
  // Ley General del Ambiente
  {
    id: 'ley-28611',
    name: 'Ley General del Ambiente',
    url: 'https://lpderecho.pe/ley-general-ambiente-ley-28611/',
    rango: 'ley',
    fechaPublicacion: '2005-10-15',
    materias: ['ambiental', 'medio ambiente', 'desarrollo sostenible'],
    sumilla: 'Establece los principios de la gestión ambiental del Estado',
  },
  // Código de Niños y Adolescentes
  {
    id: 'ley-27337',
    name: 'Código de los Niños y Adolescentes',
    url: 'https://lpderecho.pe/codigo-ninos-adolescentes-ley-27337/',
    rango: 'ley',
    fechaPublicacion: '2000-08-07',
    materias: ['familia', 'menores', 'derechos del niño'],
    sumilla: 'Protege los derechos de niños, niñas y adolescentes',
  },
  // Ley de Habeas Data
  {
    id: 'ley-26301',
    name: 'Ley de Habeas Data y Acción de Cumplimiento',
    url: 'https://lpderecho.pe/ley-habeas-data-accion-cumplimiento-ley-26301/',
    rango: 'ley',
    fechaPublicacion: '1994-05-03',
    materias: ['constitucional', 'habeas data', 'protección de datos'],
    sumilla: 'Regula el proceso de habeas data para proteger datos personales',
  },
  // Ley de Firma Digital
  {
    id: 'ley-27269',
    name: 'Ley de Firmas y Certificados Digitales',
    url: 'https://lpderecho.pe/ley-firmas-certificados-digitales-ley-27269/',
    rango: 'ley',
    fechaPublicacion: '2000-05-28',
    materias: ['digital', 'firma electrónica', 'certificados'],
    sumilla: 'Regula la firma digital y los certificados digitales',
  },
  // Ley General de Minería
  {
    id: 'ds-014-92-em',
    name: 'TUO de la Ley General de Minería',
    url: 'https://lpderecho.pe/tuo-ley-general-mineria-decreto-supremo-014-92-em/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1992-06-04',
    materias: ['minería', 'recursos naturales', 'concesiones'],
    sumilla: 'Regula la actividad minera en el Perú',
  },
  // Ley de Promoción de Inversiones en el Sector Agrario
  {
    id: 'dleg-885',
    name: 'Ley de Promoción del Sector Agrario',
    url: 'https://lpderecho.pe/ley-promocion-sector-agrario-decreto-legislativo-885/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-11-10',
    materias: ['agrario', 'inversiones', 'sector agrícola'],
    sumilla: 'Promueve las inversiones en el sector agrario',
  },
  // Ley del Sistema de Inteligencia Nacional
  {
    id: 'dleg-1141',
    name: 'Ley del Sistema de Inteligencia Nacional - SINA',
    url: 'https://lpderecho.pe/decreto-legislativo-fortalecimiento-direccion-inteligencia-nacional-sina-1141/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2012-12-11',
    materias: ['defensa', 'inteligencia', 'seguridad nacional'],
    sumilla: 'Regula el Sistema de Inteligencia Nacional',
  },
  // Ley de Delitos Informáticos
  {
    id: 'ley-30096',
    name: 'Ley de Delitos Informáticos',
    url: 'https://lpderecho.pe/ley-delitos-informaticos-ley-30096/',
    rango: 'ley',
    fechaPublicacion: '2013-10-22',
    materias: ['penal', 'ciberdelitos', 'delitos informáticos'],
    sumilla: 'Tipifica los delitos informáticos y cibernéticos',
  },
  // Ley de Partidos Políticos
  {
    id: 'ley-28094',
    name: 'Ley de Organizaciones Políticas',
    url: 'https://lpderecho.pe/ley-organizaciones-politicas-ley-28094/',
    rango: 'ley',
    fechaPublicacion: '2003-11-01',
    materias: ['electoral', 'partidos políticos', 'democracia'],
    sumilla: 'Regula la constitución y funcionamiento de partidos políticos',
  },
  // Ley Orgánica de Elecciones Regionales
  {
    id: 'ley-27683',
    name: 'Ley de Elecciones Regionales',
    url: 'https://lpderecho.pe/ley-elecciones-regionales-ley-27683/',
    rango: 'ley',
    fechaPublicacion: '2002-03-15',
    materias: ['electoral', 'elecciones regionales', 'democracia'],
    sumilla: 'Regula el proceso electoral para gobiernos regionales',
  },
  // Ley de Elecciones Municipales
  {
    id: 'ley-26864',
    name: 'Ley de Elecciones Municipales',
    url: 'https://lpderecho.pe/ley-elecciones-municipales-ley-26864/',
    rango: 'ley',
    fechaPublicacion: '1997-10-14',
    materias: ['electoral', 'elecciones municipales', 'democracia'],
    sumilla: 'Regula el proceso electoral para gobiernos locales',
  },
  // Ley del Procedimiento de Ejecución Coactiva
  {
    id: 'ley-26979',
    name: 'Ley del Procedimiento de Ejecución Coactiva',
    url: 'https://lpderecho.pe/ley-procedimiento-ejecucion-coactiva-ley-26979/',
    rango: 'ley',
    fechaPublicacion: '1998-09-23',
    materias: ['administrativo', 'cobranza coactiva', 'tributario'],
    sumilla: 'Regula la ejecución coactiva de obligaciones tributarias',
  },
  // Ley de Reestructuración Patrimonial
  {
    id: 'ley-27146',
    name: 'Ley de Fortalecimiento del Sistema de Reestructuración Patrimonial',
    url: 'https://lpderecho.pe/ley-fortalecimiento-sistema-reestructuracion-patrimonial-ley-27146/',
    rango: 'ley',
    fechaPublicacion: '1999-06-24',
    materias: ['comercial', 'concursal', 'insolvencia'],
    sumilla: 'Fortaleció el sistema concursal antes de la Ley 27809',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 5')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH5.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH5) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting - 4 seconds to avoid 403
    await new Promise((r) => setTimeout(r, 4000))
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
