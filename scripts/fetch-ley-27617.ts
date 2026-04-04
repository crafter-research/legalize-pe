#!/usr/bin/env npx tsx
/**
 * Fetch Ley 27617 from SPIJ
 * Ley que dispone la reestructuración del Sistema Nacional de Pensiones del Decreto Ley 19990
 */

import { writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = join(__dirname, '../leyes/pe/ley-27617.md')

const SPIJ_API_BASE = 'https://spijwsii.minjus.gob.pe/spij-ext-back/api'

const FREE_ACCESS_CREDENTIALS = {
  user: {},
  usuario: 'usuarioNoPago',
  password: 'e10adc3949ba59abbe56e057f20f883e',
  captcha_response: true,
}

// Try different possible SPIJ IDs for Ley 27617
const POSSIBLE_SPIJ_IDS = [
  'H1109838', // From URL
  'H682816', // Estimated based on nearby laws
  'H682800', // Alternative
  'H682850', // Alternative
]

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

async function getToken(): Promise<string> {
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
  console.log('✅ Authenticated')
  return data.token
}

async function fetchLaw(token: string, spijId: string): Promise<SpijLaw | null> {
  try {
    const response = await fetch(`${SPIJ_API_BASE}/detallenorma/${spijId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Referer: 'https://spij.minjus.gob.pe/',
      },
    })

    if (!response.ok) {
      return null
    }

    return response.json() as Promise<SpijLaw>
  } catch (error) {
    return null
  }
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

async function saveLaw(spijId: string, spijData: SpijLaw): Promise<void> {
  const title = 'Ley que dispone la reestructuración del Sistema Nacional de Pensiones del Decreto Ley 19990'
  const content = htmlToMarkdown(spijData.textoCompleto)

  const frontmatter = `---
titulo: "${title}"
identificador: "ley-27617"
pais: "pe"
jurisdiccion: "pe"
rango: "ley"
fechaPublicacion: "2002-01-01"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${spijId}"
diarioOficial: "El Peruano"
---`

  const markdown = `${frontmatter}

# ${title}

${content}
`

  await writeFile(OUTPUT_FILE, markdown, 'utf-8')
  console.log(`✅ Saved: ${OUTPUT_FILE}`)
}

async function main() {
  console.log('🇵🇪 Fetching Ley 27617')
  console.log('═'.repeat(50))
  console.log()

  const token = await getToken()

  // Try each possible SPIJ ID
  for (const spijId of POSSIBLE_SPIJ_IDS) {
    console.log(`\n🔍 Trying SPIJ ID: ${spijId}`)
    const law = await fetchLaw(token, spijId)

    if (law) {
      console.log('✅ Found law!')
      console.log(`   Title: ${extractTitle(law.sumilla)}`)
      await saveLaw(spijId, law)
      return
    } else {
      console.log('   ❌ Not found')
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log('\n❌ Could not find Ley 27617 with any known SPIJ ID')
  console.log('Try searching manually at: https://spij.minjus.gob.pe/')
}

main().catch(console.error)
