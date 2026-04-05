#!/usr/bin/env npx tsx
/**
 * Fetch important laws from LP Derecho
 * Usage: npx tsx scripts/fetch-leyes-lpderecho.ts
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

// Laws available on LP Derecho - verified URLs
const LEYES_LPDERECHO: LawDefinition[] = [
  // Anticorrupción y Compliance
  {
    id: 'ley-30424',
    name: 'Ley que regula la Responsabilidad Administrativa de las Personas Jurídicas',
    url: 'https://lpderecho.pe/ley-30424-responsabilidad-administrativa-personas-juridicas-delito-cohecho-activo-transnacional/',
    rango: 'ley',
    fechaPublicacion: '2016-04-21',
    materias: ['penal', 'compliance', 'responsabilidad corporativa'],
    sumilla:
      'Ley de responsabilidad penal de empresas por delitos de corrupción, lavado de activos y otros',
  },
  // Digital
  {
    id: 'dleg-1412',
    name: 'Decreto Legislativo que aprueba la Ley de Gobierno Digital',
    url: 'https://lpderecho.pe/decreto-legislativo-1412-aprueba-ley-gobierno-digital/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-13',
    materias: ['digital', 'gobierno', 'tecnología'],
    sumilla:
      'Marco de gobernanza del gobierno digital, interoperabilidad y gestión de datos',
  },
  // Laboral - CTS
  {
    id: 'ds-001-97-tr',
    name: 'TUO de la Ley de Compensación por Tiempo de Servicios',
    url: 'https://lpderecho.pe/tuo-ley-de-compensacion-por-tiempo-de-servicios-ds-1-97-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1997-03-01',
    materias: ['laboral', 'CTS', 'beneficios sociales'],
    sumilla:
      'Regula la CTS como beneficio social de previsión de contingencias',
  },
  // Laboral - Descansos
  {
    id: 'dleg-713',
    name: 'Descansos Remunerados de los Trabajadores',
    url: 'https://lpderecho.pe/consolidan-legislacion-descansos-remunerados-trabajadores-actividad-privada-decreto-legislativo-713/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-11-08',
    materias: ['laboral', 'vacaciones', 'descansos'],
    sumilla: 'Vacaciones, feriados y descanso semanal obligatorio',
  },
  // Laboral - Gratificaciones
  {
    id: 'ley-27735',
    name: 'Ley que regula el Otorgamiento de las Gratificaciones',
    url: 'https://lpderecho.pe/ley-gratificaciones-fiestas-patrias-navidad-ley-27735/',
    rango: 'ley',
    fechaPublicacion: '2002-05-28',
    materias: ['laboral', 'gratificaciones', 'fiestas patrias', 'navidad'],
    sumilla:
      'Gratificaciones por Fiestas Patrias y Navidad para trabajadores del régimen privado',
  },
  // Laboral - Utilidades
  {
    id: 'dleg-892',
    name: 'Participación de los Trabajadores en las Utilidades',
    url: 'https://lpderecho.pe/participacion-trabajadores-utilidades-empresas-actividades-tercera-categoria-decreto-legislativo-892/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-11-11',
    materias: ['laboral', 'utilidades', 'beneficios'],
    sumilla:
      'Derecho de los trabajadores a participar en las utilidades de la empresa',
  },
  // Educación
  {
    id: 'ley-29944',
    name: 'Ley de Reforma Magisterial',
    url: 'https://lpderecho.pe/ley-reforma-magisterial-ley-29944/',
    rango: 'ley',
    fechaPublicacion: '2012-11-25',
    materias: ['educación', 'docentes', 'magisterio'],
    sumilla:
      'Carrera pública magisterial, formación, evaluación y remuneración docente',
  },
  // Función Pública - CAS
  {
    id: 'dleg-1057',
    name: 'Decreto Legislativo que regula el Régimen CAS',
    url: 'https://lpderecho.pe/decreto-regimen-especial-contratacion-administrativa-servicios-cas-decreto-legislativo-1057-actualizado/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-28',
    materias: ['laboral', 'función pública', 'CAS'],
    sumilla:
      'Régimen especial de contratación administrativa de servicios en el sector público',
  },
  // Función Pública - Servicio Civil
  {
    id: 'ley-30057',
    name: 'Ley del Servicio Civil',
    url: 'https://lpderecho.pe/ley-servicio-civil-ley-30057-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2013-07-04',
    materias: ['función pública', 'servicio civil', 'SERVIR'],
    sumilla:
      'Régimen único y exclusivo para personas que prestan servicios en entidades públicas',
  },
  // Contrataciones del Estado
  {
    id: 'ley-30225-tuo',
    name: 'TUO de la Ley de Contrataciones del Estado',
    url: 'https://lpderecho.pe/aprueban-tuo-ley-30225-ley-contrataciones-estado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2019-03-13',
    materias: ['contrataciones', 'estado', 'OSCE'],
    sumilla:
      'Normas para contratación de bienes, servicios y obras por entidades públicas',
  },
  // Inspección del Trabajo
  {
    id: 'ley-28806',
    name: 'Ley General de Inspección del Trabajo',
    url: 'https://lpderecho.pe/ley-28806-ley-general-de-inspeccion-del-trabajo-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2006-07-22',
    materias: ['laboral', 'inspección', 'SUNAFIL'],
    sumilla: 'Sistema de inspección del trabajo y facultades de SUNAFIL',
  },
  // Penal - Lavado de Activos
  {
    id: 'dleg-1106',
    name: 'Decreto Legislativo de Lucha contra el Lavado de Activos',
    url: 'https://lpderecho.pe/decreto-legislativo-lucha-eficaz-contra-lavado-activos-delitos-relacionados-mineria-ilegal-crimen-organizado/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2012-04-19',
    materias: ['penal', 'lavado de activos', 'crimen organizado'],
    sumilla:
      'Tipifica y sanciona el delito de lavado de activos y delitos conexos',
  },
  // Procedimiento Administrativo
  {
    id: 'ds-004-2019-jus-tuo-27444',
    name: 'TUO de la Ley del Procedimiento Administrativo General',
    url: 'https://lpderecho.pe/ley-procedimiento-administrativo-27444/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2019-01-25',
    materias: ['administrativo', 'procedimiento', 'silencio administrativo'],
    sumilla:
      'Normas comunes para actuaciones de entidades públicas y derechos de los administrados',
  },
  // Protección al Consumidor
  {
    id: 'ley-29571',
    name: 'Código de Protección y Defensa del Consumidor',
    url: 'https://lpderecho.pe/codigo-de-proteccion-y-defensa-del-consumidor-ley-29571/',
    rango: 'ley',
    fechaPublicacion: '2010-09-02',
    materias: ['consumidor', 'INDECOPI', 'derechos'],
    sumilla: 'Derechos de los consumidores y mecanismos de protección',
  },
  // Propiedad Intelectual - Derechos de Autor
  {
    id: 'dleg-822',
    name: 'Ley sobre el Derecho de Autor',
    url: 'https://lpderecho.pe/ley-sobre-derecho-autor-decreto-legislativo-822-actualizada/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-04-24',
    materias: ['propiedad intelectual', 'derechos de autor', 'INDECOPI'],
    sumilla: 'Protección de obras literarias, artísticas y derechos conexos',
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

  // Extract main content
  // LP Derecho uses entry-content class for the law content
  const contentMatch =
    html.match(
      /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:footer|div[^>]*class="[^"]*post-tags)/i,
    ) || html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)

  if (!contentMatch) {
    // Try getting the whole body
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
    // Remove scripts and styles
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    // Remove ads and social sharing
    .replace(
      /<div[^>]*class="[^"]*(?:sharedaddy|jp-relatedposts|ad-|social)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      '',
    )
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    // Paragraphs
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Bold
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    // Italic
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Lists
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?[uo]l[^>]*>/gi, '\n')
    // Links - preserve text
    .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
    // Remove remaining tags
    .replace(/<[^>]+>/g, '')
    // HTML entities
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
    // Clean up
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
  console.log('🇵🇪 Legalize PE - Fetching Laws from LP Derecho')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_LPDERECHO.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_LPDERECHO) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting
    await new Promise((r) => setTimeout(r, 2000))
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
