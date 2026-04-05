#!/usr/bin/env npx tsx
/**
 * Fetch códigos penales from SPIJ API
 * Usage: npx tsx scripts/fetch-codigos-penales.ts
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

interface SearchResult {
  id: string
  codigoNorma: string
  sumilla: string
  titulo: string
  fechaPublicacion: string
  dispositivoLegal: string
}

// Códigos penales a buscar
const CODIGOS_PENALES = [
  {
    id: 'dleg-635',
    name: 'Código Penal',
    searchTerm: 'Código Penal',
    decreto: '635',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-04-08',
  },
  {
    id: 'dleg-638',
    name: 'Código Procesal Penal',
    searchTerm: 'Código Procesal Penal',
    decreto: '638',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-04-25',
  },
  {
    id: 'dleg-957',
    name: 'Nuevo Código Procesal Penal',
    searchTerm: 'Nuevo Código Procesal Penal',
    decreto: '957',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2004-07-29',
  },
  {
    id: 'dleg-654',
    name: 'Código de Ejecución Penal',
    searchTerm: 'Código de Ejecución Penal',
    decreto: '654',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-08-02',
  },
  {
    id: 'dleg-1094',
    name: 'Código Penal Militar Policial',
    searchTerm: 'Código Penal Militar Policial',
    decreto: '1094',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2010-09-01',
  },
  {
    id: 'dleg-1348',
    name: 'Código de Responsabilidad Penal de Adolescentes',
    searchTerm: 'Responsabilidad Penal de Adolescentes',
    decreto: '1348',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2017-01-07',
  },
]

// IDs SPIJ conocidos (basados en el formato de SPIJ)
// Estos son IDs estimados basados en el patrón H6XXXXX y la época de promulgación
const KNOWN_SPIJ_IDS: Record<string, string> = {
  'dleg-635': 'H683660', // Código Penal - 1991
  'dleg-638': 'H683680', // Código Procesal Penal - 1991
  'dleg-957': 'H699680', // Nuevo Código Procesal Penal - 2004
  'dleg-654': 'H683720', // Código de Ejecución Penal - 1991
  'dleg-1094': 'H703780', // Código Penal Militar Policial - 2010
  'dleg-1348': 'H728532', // Código de Responsabilidad Penal Adolescentes - 2017
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

async function searchLaw(searchTerm: string): Promise<SearchResult[]> {
  const token = await getToken()

  const response = await fetch(`${SPIJ_API_BASE}/busqueda/avanzada`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Referer: 'https://spij.minjus.gob.pe/',
    },
    body: JSON.stringify({
      texto: searchTerm,
      dispositivo: '',
      numero: '',
      articulo: '',
      fechaInicio: '',
      fechaFin: '',
      tipo: 'CODIGO',
      pagina: 1,
      cantidad: 10,
    }),
  })

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`)
  }

  const data = await response.json()
  return (data.results || data.normas || []) as SearchResult[]
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
  const md = html
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
  law: (typeof CODIGOS_PENALES)[0],
  spijData: SpijLaw,
  spijId: string,
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
fuente: "https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${spijId}"
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

async function tryFetchWithId(
  law: (typeof CODIGOS_PENALES)[0],
  spijId: string,
): Promise<boolean> {
  try {
    console.log(`   Trying ID: ${spijId}`)
    const spijData = await fetchLaw(spijId)

    // Verify this is the right law
    const text = (spijData.sumilla || '') + (spijData.titulo || '')
    if (
      text.toLowerCase().includes(law.searchTerm.toLowerCase().split(' ')[0])
    ) {
      await saveLaw(law, spijData, spijId)
      return true
    }
    console.log(`   ⚠️  ID ${spijId} does not match expected content`)
    return false
  } catch (error) {
    console.log(
      `   ❌ ID ${spijId} failed: ${error instanceof Error ? error.message : error}`,
    )
    return false
  }
}

async function main() {
  console.log('🇵🇪 Legalize PE - Códigos Penales Fetcher')
  console.log('═'.repeat(50))
  console.log()

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of CODIGOS_PENALES) {
    console.log(`\n📜 ${law.name}`)
    console.log(`   ID: ${law.id}`)
    console.log(`   Decreto: ${law.decreto}`)

    try {
      // First try with known ID
      const knownId = KNOWN_SPIJ_IDS[law.id]
      if (knownId) {
        const found = await tryFetchWithId(law, knownId)
        if (found) {
          success++
          console.log('   ✅ Success')
          await new Promise((r) => setTimeout(r, 1000))
          continue
        }
      }

      // Try search API
      console.log(`   🔍 Searching for: ${law.searchTerm}`)
      const results = await searchLaw(law.searchTerm)

      if (results.length > 0) {
        console.log(`   Found ${results.length} results`)
        for (const result of results) {
          if (result.id) {
            const found = await tryFetchWithId(law, result.id)
            if (found) {
              success++
              console.log('   ✅ Success via search')
              break
            }
          }
        }
      } else {
        console.log('   No search results')
        failed++
      }
    } catch (error) {
      failed++
      console.log(
        `   ❌ Error: ${error instanceof Error ? error.message : error}`,
      )
    }

    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
