#!/usr/bin/env npx tsx
/**
 * Fetch laws batch 25 - More verified URLs to reach 400
 * Usage: npx tsx scripts/fetch-leyes-batch25.ts
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

const LEYES_BATCH25: LawDefinition[] = [
  // Laboral
  {
    id: 'ds-003-2024-tr',
    name: 'Reglamento para el retiro del 100% de la CTS',
    url: 'https://lpderecho.pe/reglamento-retiro-cts-decreto-supremo-003-2024-tr/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2024-05-15',
    materias: ['laboral', 'CTS', 'beneficios'],
    sumilla: 'Reglamento para retiro del 100% de la CTS',
  },
  {
    id: 'compendio-laboral',
    name: 'Compendio LP de normas laborales régimen privado',
    url: 'https://lpderecho.pe/descargue-compendio-normas-laborales-regimen-privado/',
    rango: 'articulo',
    fechaPublicacion: '2023-06-01',
    materias: ['laboral', 'compendio', 'régimen privado'],
    sumilla: 'Compendio de normas laborales actualizado',
  },
  // Contrataciones
  {
    id: 'ley-32069-contrataciones',
    name: 'Ley 32069, Ley General de Contrataciones Públicas',
    url: 'https://lpderecho.pe/ley-general-de-contrataciones-publicas-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2024-06-24',
    materias: ['administrativo', 'contrataciones', 'estado'],
    sumilla: 'Ley General de Contrataciones Públicas',
  },
  // Minería y Energía
  {
    id: 'ley-30705-minem',
    name: 'Ley de Organización y Funciones del Ministerio de Energía y Minas',
    url: 'https://lpderecho.pe/ley-organizacion-funciones-ministerio-energia-minas-ley-30705/',
    rango: 'ley',
    fechaPublicacion: '2017-12-21',
    materias: ['energía', 'minería', 'organización'],
    sumilla: 'LOF del Ministerio de Energía y Minas',
  },
  {
    id: 'ds-009-2025-em',
    name: 'Reglamento de la Ley para ampliar el plazo de formalización minera',
    url: 'https://lpderecho.pe/reglamento-ley-ampliar-plazo-proceso-formalizacion-minera-decreto-supremo-009-2025-em/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2025-03-15',
    materias: ['minería', 'formalización', 'pequeña minería'],
    sumilla: 'Reglamento de formalización minera',
  },
  {
    id: 'articulo-tercerizacion-mineria',
    name: 'Tercerización en el sector minero: registro de empresas contratistas',
    url: 'https://lpderecho.pe/todas-las-empresas-que-suscriben-contratos-de-tercerizacion-en-el-sector-minero-deben-obligatoriamente-inscribirse-en-el-registro-de-empresas-contratistas/',
    rango: 'articulo',
    fechaPublicacion: '2023-08-10',
    materias: ['minería', 'tercerización', 'registro'],
    sumilla: 'Registro de empresas contratistas mineras',
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
  console.log('🇵🇪 Legalize PE - Fetching Laws Batch 25')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_BATCH25.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_BATCH25) {
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
