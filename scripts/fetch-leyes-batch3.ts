#!/usr/bin/env npx tsx
/**
 * Fetch more laws from LP Derecho - Batch 3
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

const LEYES: LawDefinition[] = [
  // LABORAL
  {
    id: 'ley-29783',
    name: 'Ley de Seguridad y Salud en el Trabajo',
    url: 'https://lpderecho.pe/ley-seguridad-salud-trabajo-ley-29783-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2011-08-20',
    materias: ['laboral', 'seguridad', 'salud ocupacional'],
    sumilla: 'Marco normativo de prevención de riesgos laborales',
  },
  // VIOLENCIA
  {
    id: 'ley-30364-tuo',
    name: 'TUO Ley para Prevenir y Erradicar la Violencia contra las Mujeres',
    url: 'https://lpderecho.pe/ley-para-prevenir-sancionar-y-erradicar-la-violencia-contra-las-mujeres-y-los-integrantes-del-grupo-familiar-ley-30364/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2020-09-06',
    materias: ['violencia', 'género', 'familia', 'protección'],
    sumilla:
      'Prevención, sanción y erradicación de la violencia contra las mujeres',
  },
  // CONCILIACIÓN
  {
    id: 'ley-26872',
    name: 'Ley de Conciliación',
    url: 'https://lpderecho.pe/ley-conciliacion-ley-26872/',
    rango: 'ley',
    fechaPublicacion: '1997-11-13',
    materias: ['conciliación', 'resolución de conflictos', 'extrajudicial'],
    sumilla: 'Mecanismo alternativo de solución de conflictos',
  },
  // ARBITRAJE
  {
    id: 'dleg-1071',
    name: 'Ley de Arbitraje',
    url: 'https://lpderecho.pe/decreto-legislativo-norma-arbitraje-dl-1071/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-28',
    materias: ['arbitraje', 'resolución de conflictos', 'comercial'],
    sumilla: 'Norma general de arbitraje nacional e internacional',
  },
  // NIÑOS Y ADOLESCENTES
  {
    id: 'ley-27337',
    name: 'Código de los Niños y Adolescentes',
    url: 'https://lpderecho.pe/codigo-ninos-adolescentes-ley-27337/',
    rango: 'ley',
    fechaPublicacion: '2000-08-07',
    materias: ['niños', 'adolescentes', 'familia', 'protección'],
    sumilla: 'Derechos y deberes de niños y adolescentes',
  },
  // DISCAPACIDAD
  {
    id: 'ley-29973',
    name: 'Ley General de la Persona con Discapacidad',
    url: 'https://lpderecho.pe/ley-general-persona-discapacidad-ley-29973/',
    rango: 'ley',
    fechaPublicacion: '2012-12-24',
    materias: ['discapacidad', 'inclusión', 'derechos'],
    sumilla: 'Marco legal de protección de personas con discapacidad',
  },
  // MIGRACIONES
  {
    id: 'dleg-1350',
    name: 'Ley de Migraciones',
    url: 'https://lpderecho.pe/ley-migraciones-decreto-legislativo-1350/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2017-01-07',
    materias: ['migraciones', 'extranjería', 'refugio'],
    sumilla: 'Régimen migratorio y calidades migratorias en el Perú',
  },
  // CIBERSEGURIDAD
  {
    id: 'ley-30096',
    name: 'Ley de Delitos Informáticos',
    url: 'https://lpderecho.pe/ley-delitos-informaticos-ley-30096/',
    rango: 'ley',
    fechaPublicacion: '2013-10-22',
    materias: ['penal', 'informático', 'ciberdelitos'],
    sumilla: 'Tipifica delitos informáticos y cibercrimen',
  },
  // TRAFICO DROGAS
  {
    id: 'dleg-824',
    name: 'Ley de Lucha contra el Tráfico Ilícito de Drogas',
    url: 'https://lpderecho.pe/ley-lucha-contra-trafico-ilicito-drogas-actualizada/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-04-24',
    materias: ['penal', 'drogas', 'narcotráfico'],
    sumilla: 'Represión del tráfico ilícito de drogas',
  },
  // PRESUPUESTO
  {
    id: 'ley-28411',
    name: 'Ley General del Sistema Nacional de Presupuesto',
    url: 'https://lpderecho.pe/ley-general-sistema-nacional-presupuesto-ley-28411/',
    rango: 'ley',
    fechaPublicacion: '2004-12-08',
    materias: ['presupuesto', 'finanzas públicas', 'estado'],
    sumilla: 'Principios y procedimientos del sistema presupuestario',
  },
  // TESORERÍA
  {
    id: 'dleg-1441',
    name: 'Decreto Legislativo del Sistema Nacional de Tesorería',
    url: 'https://lpderecho.pe/decreto-legislativo-sistema-nacional-tesoreria-decreto-legislativo-1441/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-16',
    materias: ['tesorería', 'finanzas públicas', 'estado'],
    sumilla: 'Gestión de fondos públicos y flujo de caja',
  },
  // ENDEUDAMIENTO
  {
    id: 'dleg-1437',
    name: 'Decreto Legislativo del Sistema Nacional de Endeudamiento Público',
    url: 'https://lpderecho.pe/decreto-legislativo-sistema-nacional-endeudamiento-publico-decreto-legislativo-1437/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-16',
    materias: ['deuda pública', 'finanzas públicas', 'estado'],
    sumilla: 'Regulación de las operaciones de endeudamiento público',
  },
  // CONTABILIDAD
  {
    id: 'dleg-1438',
    name: 'Decreto Legislativo del Sistema Nacional de Contabilidad',
    url: 'https://lpderecho.pe/decreto-legislativo-sistema-nacional-contabilidad-decreto-legislativo-1438/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-16',
    materias: ['contabilidad', 'finanzas públicas', 'estado'],
    sumilla: 'Normas de contabilidad gubernamental',
  },
  // INVERSIÓN PÚBLICA
  {
    id: 'dleg-1252',
    name: 'Decreto Legislativo que crea el Sistema Nacional de Programación Multianual',
    url: 'https://lpderecho.pe/decreto-legislativo-1252-sistema-nacional-programacion-multianual-gestion-inversiones/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2016-12-01',
    materias: ['inversión pública', 'proyectos', 'Invierte.pe'],
    sumilla: 'Sistema Invierte.pe para gestión de inversiones públicas',
  },
  // ADUANAS
  {
    id: 'dleg-1053',
    name: 'Ley General de Aduanas',
    url: 'https://lpderecho.pe/ley-general-aduanas-decreto-legislativo-1053/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-27',
    materias: ['aduanas', 'comercio exterior', 'SUNAT'],
    sumilla: 'Régimen jurídico aduanero del Perú',
  },
  // COMPETENCIA
  {
    id: 'dleg-1034',
    name: 'Ley de Represión de Conductas Anticompetitivas',
    url: 'https://lpderecho.pe/ley-represion-conductas-anticompetitivas-decreto-legislativo-1034/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-25',
    materias: ['competencia', 'INDECOPI', 'libre mercado'],
    sumilla: 'Prohibición de prácticas anticompetitivas',
  },
  // PUBLICIDAD
  {
    id: 'dleg-1044',
    name: 'Ley de Represión de la Competencia Desleal',
    url: 'https://lpderecho.pe/ley-represion-competencia-desleal-decreto-legislativo-1044/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-26',
    materias: ['competencia desleal', 'publicidad', 'INDECOPI'],
    sumilla: 'Represión de actos de competencia desleal',
  },
  // SIMPLIFICACIÓN
  {
    id: 'dleg-1246',
    name: 'Decreto Legislativo de Simplificación de Trámites',
    url: 'https://lpderecho.pe/decreto-legislativo-1246-diversas-medidas-simplificacion-administrativa/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2016-11-10',
    materias: ['simplificación', 'trámites', 'administración pública'],
    sumilla: 'Medidas de simplificación administrativa',
  },
  // TERCERIZACIÓN
  {
    id: 'ley-29245',
    name: 'Ley que regula la Tercerización',
    url: 'https://lpderecho.pe/ley-29245-regula-servicios-tercerizacion/',
    rango: 'ley',
    fechaPublicacion: '2008-06-24',
    materias: ['laboral', 'tercerización', 'outsourcing'],
    sumilla: 'Regulación de servicios de tercerización',
  },
  // INTERMEDIACIÓN
  {
    id: 'ley-27626',
    name: 'Ley que regula la Intermediación Laboral',
    url: 'https://lpderecho.pe/ley-27626-regula-actividad-empresas-especiales-servicios-cooperativas-trabajadores/',
    rango: 'ley',
    fechaPublicacion: '2002-01-09',
    materias: ['laboral', 'intermediación', 'services'],
    sumilla: 'Régimen de empresas de servicios e intermediación',
  },
  // HOSTIGAMIENTO
  {
    id: 'ley-27942',
    name: 'Ley de Prevención y Sanción del Hostigamiento Sexual',
    url: 'https://lpderecho.pe/ley-prevencion-sancion-hostigamiento-sexual-ley-27942/',
    rango: 'ley',
    fechaPublicacion: '2003-02-27',
    materias: ['laboral', 'hostigamiento sexual', 'género'],
    sumilla: 'Prevención y sanción del acoso sexual en el trabajo',
  },
  // CONTROL INTERNO
  {
    id: 'ley-28716',
    name: 'Ley de Control Interno de las Entidades del Estado',
    url: 'https://lpderecho.pe/ley-control-interno-entidades-estado-ley-28716/',
    rango: 'ley',
    fechaPublicacion: '2006-04-18',
    materias: ['control', 'gestión pública', 'contraloría'],
    sumilla: 'Sistema de control interno en entidades públicas',
  },
  // DEFENSA DEL CONSUMIDOR
  {
    id: 'ley-29571-codigo-consumidor',
    name: 'Código de Protección y Defensa del Consumidor',
    url: 'https://lpderecho.pe/codigo-de-proteccion-y-defensa-del-consumidor-ley-29571/',
    rango: 'ley',
    fechaPublicacion: '2010-09-02',
    materias: ['consumidor', 'INDECOPI', 'derechos'],
    sumilla: 'Derechos de los consumidores y mecanismos de protección',
  },
  // BANCOS
  {
    id: 'ley-26702',
    name: 'Ley General del Sistema Financiero',
    url: 'https://lpderecho.pe/ley-general-sistema-financiero-sistema-seguros-organica-sbs-ley-26702/',
    rango: 'ley',
    fechaPublicacion: '1996-12-09',
    materias: ['financiero', 'bancos', 'SBS', 'seguros'],
    sumilla: 'Regulación del sistema financiero y de seguros',
  },
  // MERCADO DE VALORES
  {
    id: 'dleg-861',
    name: 'Ley del Mercado de Valores',
    url: 'https://lpderecho.pe/ley-mercado-valores-decreto-legislativo-861/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-10-22',
    materias: ['mercado de valores', 'bolsa', 'SMV'],
    sumilla: 'Regulación del mercado de valores peruano',
  },
  // PENSIONES SPP
  {
    id: 'ds-054-97-ef',
    name: 'TUO de la Ley del Sistema Privado de Pensiones',
    url: 'https://lpderecho.pe/tuo-ley-sistema-privado-administracion-fondos-pensiones-decreto-supremo-054-97-ef/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1997-05-14',
    materias: ['pensiones', 'AFP', 'previsional'],
    sumilla: 'Sistema Privado de Pensiones administrado por AFP',
  },
  // TURISMO
  {
    id: 'ley-29408',
    name: 'Ley General de Turismo',
    url: 'https://lpderecho.pe/ley-general-turismo-ley-29408/',
    rango: 'ley',
    fechaPublicacion: '2009-09-18',
    materias: ['turismo', 'Mincetur', 'servicios turísticos'],
    sumilla: 'Marco legal para el desarrollo turístico',
  },
  // PESCA
  {
    id: 'dley-25977',
    name: 'Ley General de Pesca',
    url: 'https://lpderecho.pe/ley-general-pesca-decreto-ley-25977/',
    rango: 'decreto-ley',
    fechaPublicacion: '1992-12-22',
    materias: ['pesca', 'recursos hidrobiológicos', 'Produce'],
    sumilla: 'Régimen jurídico de la actividad pesquera',
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
  return html
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
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .trim()
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

  const markdown = `${frontmatter}\n\n# ${law.name}\n\n${content}\n`
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
  console.log('🇵🇪 Legalize PE - Batch 3')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES) {
    const result = await processLaw(law)
    if (result) success++
    else failed++
    await new Promise((r) => setTimeout(r, 2000))
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
