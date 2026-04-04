#!/usr/bin/env npx tsx
/**
 * Fetch Ley 30939 from SPIJ API
 *
 * Usage: npx tsx scripts/fetch-ley-30939.ts
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../leyes/pe')
const OUTPUT_FILE = join(OUTPUT_DIR, 'ley-30939.md')

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

async function fetchLaw(spijId: string, token: string): Promise<SpijLaw> {
  console.log(`📥 Fetching law with SPIJ ID: ${spijId}`)

  const response = await fetch(`${SPIJ_API_BASE}/detallenorma/${spijId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Referer: 'https://spij.minjus.gob.pe/',
    },
  })

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`)
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

async function saveLaw(spijData: SpijLaw): Promise<void> {
  const title = extractTitle(spijData.sumilla) || spijData.titulo || 'Ley que establece el Régimen Especial de Jubilación Anticipada para Desempleados en el SPP'
  const content = htmlToMarkdown(spijData.textoCompleto)

  const frontmatter = `---
titulo: "${title.replace(/"/g, '\\"')}"
identificador: "ley-30939"
pais: "pe"
jurisdiccion: "pe"
rango: "ley"
fechaPublicacion: "${spijData.fechaPublicacion || '2019-04-23'}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${spijData.id}"
diarioOficial: "El Peruano"
---`

  const markdown = `${frontmatter}

# ${title}

${content}
`

  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(OUTPUT_FILE, markdown, 'utf-8')
  console.log(`✅ Saved: ${OUTPUT_FILE}`)
}

async function main() {
  console.log('🇵🇪 Fetching Ley 30939')
  console.log('═'.repeat(50))
  console.log()

  // Try known SPIJ ID first
  const possibleSpijIds = ['H1120590', 'H732368']

  let success = false
  const token = await getToken()

  for (const spijId of possibleSpijIds) {
    try {
      console.log(`\n🔍 Trying SPIJ ID: ${spijId}`)
      const spijData = await fetchLaw(spijId, token)

      // Verify it's the right law
      if (spijData.codigoNorma?.includes('30939') || spijData.sumilla?.includes('30939') || spijData.titulo?.includes('30939')) {
        console.log('✅ Found the correct law!')
        await saveLaw(spijData)
        success = true
        break
      } else {
        console.log('⚠️  This is not Ley 30939, trying next ID...')
      }
    } catch (error) {
      console.log(`❌ Error with ${spijId}: ${error instanceof Error ? error.message : error}`)
    }
  }

  if (!success) {
    console.log('\n❌ Could not fetch Ley 30939. Please provide the correct SPIJ ID.')
    process.exit(1)
  }

  console.log('\n' + '═'.repeat(50))
  console.log('✅ Done!')
}

main().catch(console.error)
