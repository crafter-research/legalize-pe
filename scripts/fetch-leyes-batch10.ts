#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 10 - Leyes Generales y Orgánicas
 * Usage: npx tsx scripts/fetch-leyes-batch10.ts
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

const LEYES_BATCH10: LawDefinition[] = [
  // Contrataciones del Estado
  {
    id: 'ley-32069',
    name: 'Ley General de Contrataciones Públicas',
    url: 'https://lpderecho.pe/ley-general-de-contrataciones-publicas-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2024-06-24',
    materias: ['contrataciones', 'función pública', 'OSCE'],
    sumilla: 'Regula las contrataciones de bienes, servicios y obras del Estado',
  },
  // Código de Protección al Consumidor
  {
    id: 'ley-29571',
    name: 'Código de Protección y Defensa del Consumidor',
    url: 'https://lpderecho.pe/codigo-de-proteccion-y-defensa-del-consumidor-ley-29571/',
    rango: 'ley',
    fechaPublicacion: '2010-09-02',
    materias: ['consumidor', 'INDECOPI', 'derechos del consumidor'],
    sumilla: 'Código que protege los derechos de los consumidores',
  },
  // Arbitraje
  {
    id: 'dleg-1071',
    name: 'Decreto Legislativo que norma el Arbitraje',
    url: 'https://lpderecho.pe/decreto-legislativo-norma-arbitraje-dl-1071/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-28',
    materias: ['arbitraje', 'resolución de conflictos'],
    sumilla: 'Norma el arbitraje nacional e internacional',
  },
  // Ley Orgánica de Municipalidades
  {
    id: 'ley-27972',
    name: 'Ley Orgánica de Municipalidades',
    url: 'https://lpderecho.pe/ley-organica-municipalidades-ley-27972-actualizado/',
    rango: 'ley-organica',
    fechaPublicacion: '2003-05-27',
    materias: ['municipal', 'gobiernos locales', 'descentralización'],
    sumilla: 'Regula la organización y funciones de municipalidades',
  },
  // Servicio Civil
  {
    id: 'ley-30057',
    name: 'Ley del Servicio Civil',
    url: 'https://lpderecho.pe/ley-servicio-civil-ley-30057-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2013-07-03',
    materias: ['función pública', 'SERVIR', 'empleo público'],
    sumilla: 'Establece un régimen único para el servicio civil',
  },
  // Ley General de Salud
  {
    id: 'ley-26842',
    name: 'Ley General de Salud',
    url: 'https://lpderecho.pe/ley-general-salud-ley-26842/',
    rango: 'ley',
    fechaPublicacion: '1997-07-20',
    materias: ['salud', 'salud pública', 'MINSA'],
    sumilla: 'Regula el derecho a la protección de la salud',
  },
  // Ley Universitaria
  {
    id: 'ley-30220',
    name: 'Ley Universitaria',
    url: 'https://lpderecho.pe/ley-universitaria-ley-30220-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2014-07-09',
    materias: ['educación', 'universidad', 'SUNEDU'],
    sumilla: 'Regula las universidades públicas y privadas',
  },
  // Gobiernos Regionales
  {
    id: 'ley-27867',
    name: 'Ley Orgánica de Gobiernos Regionales',
    url: 'https://lpderecho.pe/ley-organica-gobiernos-regionales-ley-27867-actualizada/',
    rango: 'ley-organica',
    fechaPublicacion: '2002-11-16',
    materias: ['regional', 'descentralización', 'gobiernos regionales'],
    sumilla: 'Regula la estructura y funciones de gobiernos regionales',
  },
  // Reglamento Servicio Civil
  {
    id: 'ds-040-2014-pcm',
    name: 'Reglamento General de la Ley del Servicio Civil',
    url: 'https://lpderecho.pe/reglamento-general-ley-30057-ley-servicio-civil-decreto-supremo-040-2014-pcm/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2014-06-13',
    materias: ['función pública', 'SERVIR', 'reglamento'],
    sumilla: 'Reglamenta la Ley 30057 del Servicio Civil',
  },
  // Ley de Nacionalidad
  {
    id: 'ley-32421',
    name: 'Nueva Ley de Nacionalidad',
    url: 'https://lpderecho.pe/ley-32421-nueva-ley-nacionalidad/',
    rango: 'ley',
    fechaPublicacion: '2024-10-16',
    materias: ['nacionalidad', 'ciudadanía', 'extranjería'],
    sumilla: 'Regula la adquisición, conservación y pérdida de la nacionalidad',
  },
  // Modificación de Migraciones
  {
    id: 'dleg-1720',
    name: 'Decreto Legislativo que modifica el DL de Migraciones',
    url: 'https://lpderecho.pe/modifican-decreto-legislativo-migraciones-mejorar-identificacion-extranjeros-decreto-legislativo-1720/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2026-02-07',
    materias: ['migraciones', 'extranjería', 'identificación'],
    sumilla: 'Mejora la identificación de extranjeros',
  },
  // Clases virtuales universidades
  {
    id: 'ley-32105',
    name: 'Ley que aprueba clases virtuales y licenciamiento permanente en universidades',
    url: 'https://lpderecho.pe/ley-32105-licenciamiento-permanente-universidades-clases-virtuales/',
    rango: 'ley',
    fechaPublicacion: '2024-07-23',
    materias: ['educación', 'universidad', 'educación virtual'],
    sumilla: 'Permite clases 100% virtuales y licenciamiento permanente',
  },
  // Gratificaciones y CTS para CAS (ya puede estar)
  // Ley que modifica continuidad docentes
  {
    id: 'ley-32551',
    name: 'Ley que modifica la Ley Universitaria sobre continuidad académica de docentes',
    url: 'https://lpderecho.pe/ley-32551-modifican-la-ley-universitaria-para-garantizar-la-continuidad-academica-de-docentes-universitarios-nombrados-bajo-la-derogada-ley-23733/',
    rango: 'ley',
    fechaPublicacion: '2026-01-09',
    materias: ['educación', 'universidad', 'docentes'],
    sumilla: 'Garantiza continuidad de docentes nombrados bajo Ley 23733',
  },
  // Ley de educación inclusiva modificación
  {
    id: 'ds-007-2021-minedu',
    name: 'Modifican Reglamento de la Ley General de Educación para promover educación inclusiva',
    url: 'https://lpderecho.pe/modifican-reglamento-ley-general-educacion-promover-educacion-inclusiva-decreto-supremo-007-2021-minedu/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2021-04-28',
    materias: ['educación', 'inclusión', 'discapacidad'],
    sumilla: 'Promueve la educación inclusiva en todas las etapas',
  },
  // Código del Consumidor modificación alertas
  {
    id: 'ley-32230',
    name: 'Ley que modifica el Código de Protección del Consumidor - Sistema de Alertas',
    url: 'https://lpderecho.pe/ley-32230-modifica-codigo-proteccion-defensa-consumidor-con-el-fin-de-fortalecer-el-sistema-de-alertas-de-productos-y-servicios-peligrosos/',
    rango: 'ley',
    fechaPublicacion: '2024-08-14',
    materias: ['consumidor', 'INDECOPI', 'alertas', 'seguridad'],
    sumilla: 'Fortalece el Sistema de Alertas de Productos Peligrosos',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 10')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH10.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH10) {
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
