#!/usr/bin/env npx tsx
/**
 * Fetch important laws from SPIJ API
 * Usage: npx tsx scripts/fetch-leyes-importantes.ts
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

interface LawDefinition {
  id: string
  name: string
  searchTerm: string
  numero: string
  rango: string
  fechaPublicacion: string
  spijId?: string
  materias: string[]
  sumilla?: string
}

// Important laws to fetch
const LEYES_IMPORTANTES: LawDefinition[] = [
  // Tributario
  {
    id: 'dleg-821',
    name: 'TUO de la Ley del Impuesto a la Renta',
    searchTerm: 'Impuesto a la Renta',
    numero: '821',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-04-23',
    materias: ['tributario', 'impuestos', 'renta'],
    sumilla: 'Texto Único Ordenado de la Ley del Impuesto a la Renta',
  },
  // Anticorrupción y Compliance
  {
    id: 'ley-30424',
    name: 'Ley que regula la Responsabilidad Administrativa de las Personas Jurídicas',
    searchTerm: 'Responsabilidad Administrativa Personas Jurídicas',
    numero: '30424',
    rango: 'ley',
    fechaPublicacion: '2016-04-21',
    materias: ['penal', 'compliance', 'responsabilidad corporativa'],
    sumilla: 'Ley de responsabilidad penal de empresas por delitos de corrupción, lavado de activos y otros',
  },
  {
    id: 'ley-27693',
    name: 'Ley que crea la Unidad de Inteligencia Financiera - Perú',
    searchTerm: 'Unidad de Inteligencia Financiera',
    numero: '27693',
    rango: 'ley',
    fechaPublicacion: '2002-04-12',
    materias: ['lavado de activos', 'financiero', 'UIF'],
    sumilla: 'Ley que crea la UIF para prevenir y detectar el lavado de activos',
  },
  {
    id: 'ley-27815',
    name: 'Ley del Código de Ética de la Función Pública',
    searchTerm: 'Código de Ética Función Pública',
    numero: '27815',
    rango: 'ley',
    fechaPublicacion: '2002-08-13',
    materias: ['función pública', 'ética', 'anticorrupción'],
    sumilla: 'Principios, deberes y prohibiciones éticas de los servidores públicos',
  },
  {
    id: 'ley-28024',
    name: 'Ley que regula la gestión de intereses en la Administración Pública',
    searchTerm: 'gestión de intereses',
    numero: '28024',
    rango: 'ley',
    fechaPublicacion: '2003-07-12',
    materias: ['lobby', 'transparencia', 'función pública'],
    sumilla: 'Regula las actividades de lobby ante la administración pública',
  },
  {
    id: 'ley-26771',
    name: 'Ley de Nepotismo',
    searchTerm: 'nepotismo',
    numero: '26771',
    rango: 'ley',
    fechaPublicacion: '1997-04-15',
    materias: ['función pública', 'prohibiciones', 'anticorrupción'],
    sumilla: 'Prohíbe el ejercicio de la facultad de nombramiento de personal en favor de parientes',
  },
  // Digital
  {
    id: 'dleg-1412',
    name: 'Decreto Legislativo que aprueba la Ley de Gobierno Digital',
    searchTerm: 'Gobierno Digital',
    numero: '1412',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-13',
    materias: ['digital', 'gobierno', 'tecnología'],
    sumilla: 'Marco de gobernanza del gobierno digital, interoperabilidad y gestión de datos',
  },
  // Salud
  {
    id: 'ley-29459',
    name: 'Ley de los Productos Farmacéuticos, Dispositivos Médicos y Productos Sanitarios',
    searchTerm: 'Productos Farmacéuticos',
    numero: '29459',
    rango: 'ley',
    fechaPublicacion: '2009-11-26',
    materias: ['salud', 'medicamentos', 'DIGEMID'],
    sumilla: 'Regula la fabricación, importación, registro y comercialización de productos farmacéuticos',
  },
  {
    id: 'ley-29414',
    name: 'Ley que establece los Derechos de las Personas Usuarias de los Servicios de Salud',
    searchTerm: 'Derechos Usuarios Servicios Salud',
    numero: '29414',
    rango: 'ley',
    fechaPublicacion: '2009-10-02',
    materias: ['salud', 'derechos', 'pacientes'],
    sumilla: 'Derechos de acceso, información, atención y protección en servicios de salud',
  },
  // Laboral
  {
    id: 'dleg-650',
    name: 'TUO de la Ley de Compensación por Tiempo de Servicios',
    searchTerm: 'Compensación Tiempo Servicios',
    numero: '650',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-07-24',
    materias: ['laboral', 'CTS', 'beneficios sociales'],
    sumilla: 'Regula la CTS como beneficio social de previsión de contingencias',
  },
  {
    id: 'dleg-713',
    name: 'Descansos Remunerados de los Trabajadores Sujetos al Régimen Laboral Privado',
    searchTerm: 'Descansos Remunerados',
    numero: '713',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-11-08',
    materias: ['laboral', 'vacaciones', 'descansos'],
    sumilla: 'Vacaciones, feriados y descanso semanal obligatorio',
  },
  {
    id: 'dleg-892',
    name: 'Participación de los Trabajadores en las Utilidades de las Empresas',
    searchTerm: 'Participación Utilidades',
    numero: '892',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-11-11',
    materias: ['laboral', 'utilidades', 'beneficios'],
    sumilla: 'Derecho de los trabajadores a participar en las utilidades de la empresa',
  },
  {
    id: 'ley-27735',
    name: 'Ley que regula el Otorgamiento de las Gratificaciones',
    searchTerm: 'Gratificaciones trabajadores',
    numero: '27735',
    rango: 'ley',
    fechaPublicacion: '2002-05-28',
    materias: ['laboral', 'gratificaciones', 'fiestas patrias', 'navidad'],
    sumilla: 'Gratificaciones por Fiestas Patrias y Navidad para trabajadores del régimen privado',
  },
  {
    id: 'ley-25129',
    name: 'Ley de Asignación Familiar',
    searchTerm: 'Asignación Familiar',
    numero: '25129',
    rango: 'ley',
    fechaPublicacion: '1989-12-06',
    materias: ['laboral', 'beneficios', 'familia'],
    sumilla: 'Asignación familiar mensual para trabajadores con hijos menores o estudiantes',
  },
  // Educación
  {
    id: 'ley-29944',
    name: 'Ley de Reforma Magisterial',
    searchTerm: 'Reforma Magisterial',
    numero: '29944',
    rango: 'ley',
    fechaPublicacion: '2012-11-25',
    materias: ['educación', 'docentes', 'magisterio'],
    sumilla: 'Carrera pública magisterial, formación, evaluación y remuneración docente',
  },
  {
    id: 'ley-30512',
    name: 'Ley de Institutos y Escuelas de Educación Superior',
    searchTerm: 'Institutos Educación Superior',
    numero: '30512',
    rango: 'ley',
    fechaPublicacion: '2016-11-02',
    materias: ['educación', 'institutos', 'educación técnica'],
    sumilla: 'Regulación de institutos técnicos y escuelas de educación superior',
  },
  // Ambiental
  {
    id: 'ley-29325',
    name: 'Ley del Sistema Nacional de Evaluación y Fiscalización Ambiental',
    searchTerm: 'Fiscalización Ambiental SINEFA',
    numero: '29325',
    rango: 'ley',
    fechaPublicacion: '2009-03-05',
    materias: ['ambiental', 'OEFA', 'fiscalización'],
    sumilla: 'Sistema de evaluación, supervisión y fiscalización ambiental - OEFA',
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
  console.log('✅ Authenticated\n')
  return cachedToken
}

interface SearchResult {
  id: string
  codigoNorma: string
  sumilla: string
  titulo: string
  fechaPublicacion: string
  dispositivoLegal: string
}

async function searchLaw(searchTerm: string, numero?: string): Promise<SearchResult[]> {
  const token = await getToken()

  // Try advanced search first
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
      numero: numero || '',
      articulo: '',
      fechaInicio: '',
      fechaFin: '',
      tipo: '',
      pagina: 1,
      cantidad: 20,
    }),
  })

  if (!response.ok) {
    // Fallback to simple search
    const simpleResponse = await fetch(`${SPIJ_API_BASE}/busqueda/simple`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Referer: 'https://spij.minjus.gob.pe/',
      },
      body: JSON.stringify({
        texto: searchTerm,
        pagina: 1,
        cantidad: 20,
      }),
    })

    if (!simpleResponse.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }

    const data = await simpleResponse.json()
    return (data.results || data.normas || data.content || []) as SearchResult[]
  }

  const data = await response.json()
  return (data.results || data.normas || data.content || []) as SearchResult[]
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

async function saveLaw(law: LawDefinition, spijData: SpijLaw, spijId: string): Promise<void> {
  const content = htmlToMarkdown(spijData.textoCompleto)
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
fuente: "https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${spijId}"
diarioOficial: "El Peruano"
sumilla: "${(law.sumilla || '').replace(/"/g, '\\"')}"
materias: [${materiasYaml}]
spijId: "${spijId}"
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
    // Search for the law by number first
    console.log(`   🔍 Searching: "${law.numero}"`)
    const results = await searchLaw(law.searchTerm, law.numero)

    if (results.length === 0) {
      console.log('   ❌ No results found')
      return false
    }

    console.log(`   Found ${results.length} results`)

    // Try to find the best match
    for (const result of results) {
      if (!result.id) continue

      try {
        const spijData = await fetchLaw(result.id)

        // Verify it matches
        const text = `${spijData.sumilla || ''} ${spijData.titulo || ''}`.toLowerCase()
        const searchWords = law.searchTerm.toLowerCase().split(' ')
        const matches = searchWords.filter((w) => text.includes(w)).length

        if (matches >= Math.ceil(searchWords.length / 2)) {
          await saveLaw(law, spijData, result.id)
          console.log('   ✅ Success')
          return true
        }
      } catch {
        // Try next result
      }
    }

    console.log('   ❌ No matching result found')
    return false
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : error}`)
    return false
  }
}

async function main() {
  console.log('🇵🇪 Legalize PE - Fetching Important Laws')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_IMPORTANTES.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES_IMPORTANTES) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    // Rate limiting
    await new Promise((r) => setTimeout(r, 1500))
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
