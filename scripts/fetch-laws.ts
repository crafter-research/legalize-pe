#!/usr/bin/env npx tsx
/**
 * Fetch laws from SPIJ API
 * Usage: npx tsx scripts/fetch-laws.ts
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../leyes/pe')

const SPIJ_API_BASE = 'https://spijwsii.minjus.gob.pe/spij-ext-back/api'

const FREE_ACCESS_CREDENTIALS = {
  user: {},
  usuario: 'usuarioNoPago',
  password: 'e10adc3949ba59abbe56e057f20f883e',
  captcha_response: true,
}

interface SpijLaw {
  id: string
  codigoNorma: string
  sumilla: string
  titulo: string
  textoCompleto: string
  fechaPublicacion: string
  sector: string
  dispositivoLegal: string
  ruta: string
  migrado: string
}

// Known SPIJ IDs for laws to fetch
const LAWS_TO_FETCH: Array<{
  id: string
  spijId: string
  name: string
  rango: string
  fechaPublicacion: string
}> = [
  // Tax laws
  {
    id: 'ds-179-2004-ef',
    spijId: 'H699579',
    name: 'TUO de la Ley del Impuesto a la Renta',
    rango: 'decreto-supremo',
    fechaPublicacion: '2004-12-08',
  },
  {
    id: 'ds-055-99-ef',
    spijId: 'H688952',
    name: 'TUO de la Ley del IGV e ISC',
    rango: 'decreto-supremo',
    fechaPublicacion: '1999-04-15',
  },
  // Environmental
  {
    id: 'ley-28245',
    spijId: 'H695459',
    name: 'Ley Marco del Sistema Nacional de Gestión Ambiental',
    rango: 'ley',
    fechaPublicacion: '2004-06-08',
  },
  // Industrial property
  {
    id: 'dleg-1075',
    spijId: 'H701056',
    name: 'Decreto Legislativo que aprueba Disposiciones Complementarias a la Decisión 486 de la CAN',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-28',
  },
  // Judicial organization
  {
    id: 'dleg-767',
    spijId: 'H684688',
    name: 'Ley Orgánica del Poder Judicial',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-12-04',
  },
  // Additional important laws
  {
    id: 'ley-26979',
    spijId: 'H688216',
    name: 'Ley de Procedimiento de Ejecución Coactiva',
    rango: 'ley',
    fechaPublicacion: '1998-09-23',
  },
  {
    id: 'ley-28015',
    spijId: 'H694031',
    name: 'Ley de Promoción y Formalización de la Micro y Pequeña Empresa',
    rango: 'ley',
    fechaPublicacion: '2003-07-03',
  },
  {
    id: 'dleg-1353',
    spijId: 'H727919',
    name: 'Decreto Legislativo que crea la Autoridad Nacional de Transparencia y Acceso a la Información Pública',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2017-01-07',
  },
  {
    id: 'ley-29381',
    spijId: 'H703400',
    name: 'Ley de Organización y Funciones del Ministerio de Trabajo y Promoción del Empleo',
    rango: 'ley',
    fechaPublicacion: '2009-06-16',
  },
  {
    id: 'dleg-1438',
    spijId: 'H780335',
    name: 'Decreto Legislativo del Sistema Nacional de Abastecimiento',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-16',
  },
  // Consumer and competition
  {
    id: 'dleg-1033',
    spijId: 'H700872',
    name: 'Ley de Organización y Funciones del INDECOPI',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-25',
  },
  // Electronic signature
  {
    id: 'ley-27291',
    spijId: 'H689244',
    name: 'Ley que modifica el Código Civil permitiendo la utilización de los medios electrónicos',
    rango: 'ley',
    fechaPublicacion: '2000-06-24',
  },
  // Telecommunications
  {
    id: 'dleg-702',
    spijId: 'H684248',
    name: 'Ley de Telecomunicaciones',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-11-05',
  },
  // Electricity
  {
    id: 'dleg-25844',
    spijId: 'H685280',
    name: 'Ley de Concesiones Eléctricas',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1992-11-19',
  },
  // Hydrocarbons
  {
    id: 'ley-26221',
    spijId: 'H686136',
    name: 'Ley Orgánica de Hidrocarburos',
    rango: 'ley-organica',
    fechaPublicacion: '1993-08-20',
  },
]

let cachedToken: string | null = null

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken

  console.log('🔐 Authenticating with SPIJ...')
  const response = await fetch(`${SPIJ_API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://spij.minjus.gob.pe/',
    },
    body: JSON.stringify(FREE_ACCESS_CREDENTIALS),
  })

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`)
  }

  const data = (await response.json()) as { token: string }
  cachedToken = data.token
  console.log('✅ Authenticated')
  return cachedToken
}

async function fetchLaw(spijId: string): Promise<SpijLaw> {
  const token = await getToken()

  const response = await fetch(`${SPIJ_API_BASE}/detallenorma/${spijId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Referer: 'https://spij.minjus.gob.pe/',
    },
  })

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`)
  }

  return response.json() as Promise<SpijLaw>
}

function htmlToMarkdown(html: string): string {
  // Simple HTML to Markdown conversion
  const md = html
    // Remove scripts and styles
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Convert headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    // Convert paragraphs and breaks
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert formatting
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Convert lists
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?[uo]l[^>]*>/gi, '\n')
    // Remove remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return md
}

function extractTitle(sumilla: string): string {
  // Remove HTML tags and get clean text
  return sumilla
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

async function saveLaw(
  law: (typeof LAWS_TO_FETCH)[0],
  spijData: SpijLaw,
): Promise<void> {
  const title = law.name || extractTitle(spijData.sumilla) || spijData.titulo
  const content = htmlToMarkdown(spijData.textoCompleto)

  const frontmatter = `---
titulo: "${title.replace(/"/g, '\\"')}"
identificador: "${law.id}"
pais: "pe"
jurisdiccion: "pe"
rango: "${law.rango}"
fechaPublicacion: "${law.fechaPublicacion}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${law.spijId}"
diarioOficial: "El Peruano"
---`

  const markdown = `${frontmatter}

# ${title}

${content}
`

  const filePath = join(OUTPUT_DIR, `${law.id}.md`)
  await writeFile(filePath, markdown, 'utf-8')
  console.log(`   📝 Saved: ${filePath}`)
}

async function main() {
  console.log('🇵🇪 Legalize PE - Law Fetcher')
  console.log('═'.repeat(50))
  console.log()

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LAWS_TO_FETCH) {
    console.log(`\n📜 ${law.name}`)
    console.log(`   ID: ${law.id}`)

    try {
      const spijData = await fetchLaw(law.spijId)
      await saveLaw(law, spijData)
      success++
      console.log('   ✅ Success')
    } catch (error) {
      failed++
      console.log(
        `   ❌ Error: ${error instanceof Error ? error.message : error}`,
      )
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
