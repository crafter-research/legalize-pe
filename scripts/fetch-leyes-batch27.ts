#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 27 - Final batch to reach 400
 * Usage: npx tsx scripts/fetch-leyes-batch27.ts
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

const LEYES_BATCH27: LawDefinition[] = [
  // Educación universitaria
  {
    id: 'articulo-regimen-docentes-universitarios',
    name: 'Régimen laboral de los docentes universitarios',
    url: 'https://lpderecho.pe/regimen-laboral-docentes-universitarios/',
    rango: 'articulo',
    fechaPublicacion: '2023-08-15',
    materias: ['laboral', 'educación', 'docentes universitarios'],
    sumilla: 'Beneficios laborales de docentes universitarios',
  },
  {
    id: 'ley-32498-universidades',
    name: 'Ley 32498: Universidades públicas pueden incrementar remuneraciones de docentes',
    url: 'https://lpderecho.pe/ley-32498-universidades-publicas-incrementar-remuneraciones-docentes/',
    rango: 'ley',
    fechaPublicacion: '2025-12-10',
    materias: ['educación', 'universidades', 'remuneraciones'],
    sumilla: 'Incremento de remuneraciones de docentes universitarios',
  },
  {
    id: 'ley-31364-docentes',
    name: 'Ley 31364: Amplía plazo para que profesores universitarios obtengan maestría',
    url: 'https://lpderecho.pe/plantean-ampliar-plazo-para-que-docentes-universitarios-obtengan-maestria/',
    rango: 'ley',
    fechaPublicacion: '2021-11-20',
    materias: ['educación', 'docentes', 'maestría'],
    sumilla: 'Ampliación de plazo para maestría de docentes',
  },
  {
    id: 'informe-servir-docentes',
    name: 'Régimen laboral aplicable al personal docente de universidades públicas',
    url: 'https://lpderecho.pe/que-regimen-laboral-es-aplicable-al-personal-docente-o-administativo-de-universidades-publicas-informe-000724-2021-servir-gpgsc/',
    rango: 'informe',
    fechaPublicacion: '2021-06-10',
    materias: ['laboral', 'educación', 'SERVIR'],
    sumilla: 'Informe SERVIR sobre régimen laboral docente',
  },
  {
    id: 'ds-123-2024-ef-docentes',
    name: 'Nuevo monto de remuneración de docentes de universidades públicas',
    url: 'https://lpderecho.pe/monto-remuneracion-mensual-docentes-universidades-publicas-decreto-supremo-123-2024-ef/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2024-05-20',
    materias: ['educación', 'remuneraciones', 'universidades'],
    sumilla: 'Remuneración de docentes universitarios públicos',
  },
  {
    id: 'ley-32091-beneficios-docentes',
    name: 'Ley 32091: Otorgan beneficios laborales a docentes universitarios',
    url: 'https://lpderecho.pe/ley-32091-beneficios-laborales-docentes-universitarios/',
    rango: 'ley',
    fechaPublicacion: '2024-03-15',
    materias: ['laboral', 'educación', 'beneficios'],
    sumilla: 'Beneficios laborales para docentes universitarios',
  },
  {
    id: 'ley-32148-docentes-institutos',
    name: 'Ley 32148: Incremento de remuneración a docentes de institutos y escuelas',
    url: 'https://lpderecho.pe/ley-32148-incremento-remuneracion-docentes-institutos-escuelas-superiores/',
    rango: 'ley',
    fechaPublicacion: '2024-07-05',
    materias: ['educación', 'institutos', 'remuneraciones'],
    sumilla: 'Incremento de remuneración a docentes de institutos',
  },
  {
    id: 'articulo-despido-docentes-maestria',
    name: 'Despido de docentes universitarios sin maestría antes del 2025',
    url: 'https://lpderecho.pe/despedir-docentes-universitarios-maestria-antes-2025/',
    rango: 'articulo',
    fechaPublicacion: '2023-09-10',
    materias: ['laboral', 'educación', 'despido'],
    sumilla: 'Análisis sobre despido de docentes sin maestría',
  },
  {
    id: 'ley-universitaria-30220-actualizada',
    name: 'Ley Universitaria (Ley 30220) actualizada 2026',
    url: 'https://lpderecho.pe/ley-universitaria-ley-30220-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2014-07-09',
    materias: ['educación', 'universidades', 'ley universitaria'],
    sumilla: 'Ley Universitaria actualizada',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 27 (Final)')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH27.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH27) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    await new Promise((r) => setTimeout(r, 15000))
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
