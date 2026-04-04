#!/usr/bin/env npx tsx
/**
 * Fetch Ley 29903 - Ley de Reforma del Sistema Privado de Pensiones
 *
 * Usage: npx tsx scripts/fetch-ley-29903.ts
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
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

interface SearchResult {
  items: Array<{
    id: string
    codigoNorma: string
    dispositivoLegal: string
    titulo: string
    sumilla: string
    fechaPublicacion: string
  }>
  totalItems: number
}

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

async function searchLaw(query: string): Promise<SearchResult> {
  const token = await getToken()

  const response = await fetch(`${SPIJ_API_BASE}/busqueda?texto=${encodeURIComponent(query)}&pagina=1&porPagina=20`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Referer: 'https://spij.minjus.gob.pe/',
    },
  })

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`)
  }

  return response.json() as Promise<SearchResult>
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
  let md = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
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
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return md
}

function extractTitle(sumilla: string): string {
  return sumilla
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

async function saveLaw(
  lawId: string,
  spijData: SpijLaw,
  name: string,
  fechaPublicacion: string
): Promise<void> {
  const title = name || extractTitle(spijData.sumilla) || spijData.titulo
  const content = htmlToMarkdown(spijData.textoCompleto)

  const frontmatter = `---
titulo: "${title.replace(/"/g, '\\"')}"
identificador: "${lawId}"
pais: "pe"
jurisdiccion: "pe"
rango: "ley"
fechaPublicacion: "${fechaPublicacion}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${spijData.id}"
diarioOficial: "El Peruano"
---`

  const markdown = `${frontmatter}

# ${title}

${content}
`

  const filePath = join(OUTPUT_DIR, `${lawId}.md`)
  await writeFile(filePath, markdown, 'utf-8')
  console.log(`✅ Saved: ${filePath}`)
}

async function main() {
  console.log('🇵🇪 Fetching Ley 29903')
  console.log('═'.repeat(50))

  await mkdir(OUTPUT_DIR, { recursive: true })

  // Try with known SPIJ ID pattern for Ley 29903
  // Based on pattern from other laws around the same time period (2012)
  const possibleSpijIds = [
    'H704348', // Approximate based on pattern: Ley 29973 (2012) = H704336
    'H704340',
    'H704342',
    'H704344',
    'H704346',
    'H704350',
  ]

  console.log('\n📥 Trying known SPIJ ID patterns...')

  for (const spijId of possibleSpijIds) {
    try {
      console.log(`\nTrying SPIJ ID: ${spijId}`)
      const lawData = await fetchLaw(spijId)

      // Check if this is Ley 29903
      if (lawData.codigoNorma?.includes('29903') ||
          lawData.titulo?.includes('29903') ||
          lawData.sumilla?.includes('29903')) {
        console.log(`✅ Found Ley 29903 with SPIJ ID: ${spijId}`)
        console.log(`   Title: ${extractTitle(lawData.sumilla)}`)

        await saveLaw(
          'ley-29903',
          lawData,
          'Ley de Reforma del Sistema Privado de Pensiones',
          '2012-07-19'
        )

        console.log('\n' + '═'.repeat(50))
        console.log('✅ Success!')
        return
      }
    } catch (error) {
      console.log(`   ❌ Not found or error`)
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log('\n❌ Could not find Ley 29903 with known SPIJ IDs')
  console.log('Trying search API...')

  try {
    const searchResults = await searchLaw('29903')
    console.log(`📋 Found ${searchResults.totalItems} results`)

    if (searchResults.items.length === 0) {
      console.log('❌ No results found')
      return
    }

    // Find Ley 29903
    const ley29903 = searchResults.items.find(
      (item) =>
        item.codigoNorma?.includes('29903') ||
        item.titulo?.includes('29903') ||
        item.sumilla?.includes('29903')
    )

    if (!ley29903) {
      console.log('❌ Ley 29903 not found in search results')
      console.log('\n📋 Available results:')
      for (const item of searchResults.items.slice(0, 5)) {
        console.log(`   ${item.codigoNorma}: ${item.titulo?.substring(0, 60) || item.sumilla?.substring(0, 60)}`)
      }
      return
    }

    console.log(`\n📜 Found: ${ley29903.codigoNorma}`)
    console.log(`   SPIJ ID: ${ley29903.id}`)
    console.log(`   Title: ${ley29903.titulo || ley29903.sumilla}`)

    console.log('\n📥 Fetching full text...')
    const lawData = await fetchLaw(ley29903.id)

    await saveLaw(
      'ley-29903',
      lawData,
      'Ley de Reforma del Sistema Privado de Pensiones',
      ley29903.fechaPublicacion || '2012-07-19'
    )

    console.log('\n' + '═'.repeat(50))
    console.log('✅ Success!')
  } catch (error) {
    console.log(`❌ Search API failed: ${error instanceof Error ? error.message : error}`)
  }
}

main().catch(console.error)
