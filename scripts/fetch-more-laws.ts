#!/usr/bin/env npx tsx
/**
 * Fetch additional laws from SPIJ API
 * These are laws discovered from SPIJ's category pages
 *
 * Usage: npx tsx scripts/fetch-more-laws.ts
 */

import { writeFile, mkdir, readdir } from 'node:fs/promises'
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

// Additional important laws to fetch
// SPIJ IDs discovered from category pages
const LAWS_TO_FETCH: Array<{
  id: string
  spijId: string
  name: string
  rango: string
  fechaPublicacion: string
}> = [
  // ANTICORRUPCIÓN
  {
    id: 'ley-27594',
    spijId: 'H682716',
    name: 'Ley que regula la participación del Poder Ejecutivo en el nombramiento y designación de funcionarios públicos',
    rango: 'ley',
    fechaPublicacion: '2001-12-14',
  },
  {
    id: 'ley-30742',
    spijId: 'H731948',
    name: 'Ley de fortalecimiento de la Contraloría General de la República y del Sistema Nacional de Control',
    rango: 'ley',
    fechaPublicacion: '2018-03-28',
  },
  {
    id: 'ley-29976',
    spijId: 'H704364',
    name: 'Ley que crea la Comisión de Alto Nivel Anticorrupción',
    rango: 'ley',
    fechaPublicacion: '2013-01-04',
  },
  {
    id: 'dleg-1291',
    spijId: 'H728339',
    name: 'Decreto Legislativo que aprueba herramientas para la lucha contra la corrupción en el Sector Interior',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2016-12-30',
  },
  {
    id: 'ley-27815',
    spijId: 'H684924',
    name: 'Ley del Código de Ética de la Función Pública',
    rango: 'ley',
    fechaPublicacion: '2002-08-13',
  },
  {
    id: 'ley-28024',
    spijId: 'H694052',
    name: 'Ley que regula la gestión de intereses en la administración pública',
    rango: 'ley',
    fechaPublicacion: '2003-07-12',
  },
  {
    id: 'ley-26771',
    spijId: 'H687684',
    name: 'Establecen prohibición de ejercer la facultad de nombramiento y contratación de personal en el sector público, en casos de parentesco',
    rango: 'ley',
    fechaPublicacion: '1997-04-15',
  },
  {
    id: 'ley-27693',
    spijId: 'H690576',
    name: 'Ley que crea la Unidad de Inteligencia Financiera - Perú',
    rango: 'ley',
    fechaPublicacion: '2002-04-12',
  },
  {
    id: 'dleg-1327',
    spijId: 'H728515',
    name: 'Decreto Legislativo que establece medidas de protección para el denunciante de actos de corrupción',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2017-01-06',
  },
  {
    id: 'ley-30161',
    spijId: 'H710668',
    name: 'Ley que regula la presentación de declaración jurada de ingresos, bienes y rentas de los funcionarios y servidores públicos del Estado',
    rango: 'ley',
    fechaPublicacion: '2014-01-28',
  },
  {
    id: 'ley-27697',
    spijId: 'H690592',
    name: 'Ley que otorga facultad al Fiscal para la intervención y control de comunicaciones y documentos privados',
    rango: 'ley',
    fechaPublicacion: '2002-04-12',
  },
  {
    id: 'ley-28950',
    spijId: 'H701888',
    name: 'Ley contra la trata de personas y el tráfico ilícito de migrantes',
    rango: 'ley',
    fechaPublicacion: '2007-01-16',
  },
  {
    id: 'ley-27770',
    spijId: 'H691136',
    name: 'Ley que regula el otorgamiento de beneficios penales y penitenciarios a aquellos que cometen delitos graves contra la Administración Pública',
    rango: 'ley',
    fechaPublicacion: '2002-06-28',
  },
  {
    id: 'ley-30737',
    spijId: 'H731860',
    name: 'Ley que asegura el pago inmediato de la reparación civil a favor del Estado peruano en casos de corrupción',
    rango: 'ley',
    fechaPublicacion: '2018-03-12',
  },
  {
    id: 'ley-29542',
    spijId: 'H703572',
    name: 'Ley de protección al denunciante en el ámbito administrativo y de colaboración eficaz en el ámbito penal',
    rango: 'ley',
    fechaPublicacion: '2010-06-22',
  },
  {
    id: 'ley-27379',
    spijId: 'H689448',
    name: 'Ley de procedimiento para adoptar medidas excepcionales de limitación de derechos en investigaciones preliminares',
    rango: 'ley',
    fechaPublicacion: '2000-12-21',
  },
  {
    id: 'dleg-925',
    spijId: 'H693564',
    name: 'Decreto Legislativo que regula la colaboración eficaz en Delitos de Terrorismo',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2003-02-20',
  },
  {
    id: 'ley-31564',
    spijId: 'H780456',
    name: 'Ley de prevención y mitigación del conflicto de intereses en el acceso y salida de personal del servicio público',
    rango: 'ley',
    fechaPublicacion: '2022-08-24',
  },
  {
    id: 'ley-29660',
    spijId: 'H704096',
    name: 'Ley que establece medidas para sancionar la manipulación de precios en el mercado de valores',
    rango: 'ley',
    fechaPublicacion: '2011-02-04',
  },

  // LABORAL Y SEGURIDAD SOCIAL (important labor laws)
  {
    id: 'ley-29497',
    spijId: 'H703460',
    name: 'Nueva Ley Procesal del Trabajo',
    rango: 'ley',
    fechaPublicacion: '2010-01-15',
  },
  {
    id: 'dleg-650',
    spijId: 'H683704',
    name: 'Ley de Compensación por Tiempo de Servicios',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-07-24',
  },
  {
    id: 'dleg-713',
    spijId: 'H684308',
    name: 'Consolidan la legislación sobre descansos remunerados de los trabajadores sujetos al régimen laboral de la actividad privada',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-11-08',
  },
  {
    id: 'dleg-688',
    spijId: 'H684168',
    name: 'Ley de Consolidación de Beneficios Sociales',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-11-05',
  },
  {
    id: 'ley-25129',
    spijId: 'H685028',
    name: 'Ley que regula la asignación familiar',
    rango: 'ley',
    fechaPublicacion: '1989-12-06',
  },
  {
    id: 'ley-27735',
    spijId: 'H690900',
    name: 'Ley que regula el otorgamiento de las gratificaciones para los trabajadores del régimen de la actividad privada por Fiestas Patrias y Navidad',
    rango: 'ley',
    fechaPublicacion: '2002-05-28',
  },
  {
    id: 'dleg-892',
    spijId: 'H688092',
    name: 'Regulan el derecho de los trabajadores a participar en las utilidades de las empresas',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-11-11',
  },
  {
    id: 'ley-27360',
    spijId: 'H689384',
    name: 'Ley que aprueba las Normas de Promoción del Sector Agrario',
    rango: 'ley',
    fechaPublicacion: '2000-10-31',
  },

  // SALUD
  {
    id: 'ley-26790',
    spijId: 'H687756',
    name: 'Ley de Modernización de la Seguridad Social en Salud',
    rango: 'ley',
    fechaPublicacion: '1997-05-17',
  },
  {
    id: 'ley-29344',
    spijId: 'H703096',
    name: 'Ley Marco de Aseguramiento Universal en Salud',
    rango: 'ley',
    fechaPublicacion: '2009-04-09',
  },
  {
    id: 'dleg-1153',
    spijId: 'H708912',
    name: 'Decreto Legislativo que regula la política integral de compensaciones y entregas económicas del personal de la salud',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2013-09-12',
  },
  {
    id: 'ley-29414',
    spijId: 'H703308',
    name: 'Ley que establece los derechos de las personas usuarias de los servicios de salud',
    rango: 'ley',
    fechaPublicacion: '2009-10-02',
  },
  {
    id: 'ley-30024',
    spijId: 'H705528',
    name: 'Ley que crea el Registro Nacional de Historias Clínicas Electrónicas',
    rango: 'ley',
    fechaPublicacion: '2013-05-22',
  },

  // EDUCACIÓN
  {
    id: 'ley-28044',
    spijId: 'H694100',
    name: 'Ley General de Educación',
    rango: 'ley',
    fechaPublicacion: '2003-07-29',
  },
  {
    id: 'ley-29944',
    spijId: 'H704292',
    name: 'Ley de Reforma Magisterial',
    rango: 'ley',
    fechaPublicacion: '2012-11-25',
  },
  {
    id: 'ley-30512',
    spijId: 'H728076',
    name: 'Ley de Institutos y Escuelas de Educación Superior y de la Carrera Pública de sus Docentes',
    rango: 'ley',
    fechaPublicacion: '2016-11-02',
  },

  // MEDIO AMBIENTE
  {
    id: 'ley-28611',
    spijId: 'H699836',
    name: 'Ley General del Ambiente',
    rango: 'ley',
    fechaPublicacion: '2005-10-15',
  },
  {
    id: 'ley-27446',
    spijId: 'H689924',
    name: 'Ley del Sistema Nacional de Evaluación de Impacto Ambiental',
    rango: 'ley',
    fechaPublicacion: '2001-04-23',
  },
  {
    id: 'dleg-1013',
    spijId: 'H700804',
    name: 'Decreto Legislativo que aprueba la Ley de Creación, Organización y Funciones del Ministerio del Ambiente',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-05-14',
  },
  {
    id: 'ley-29325',
    spijId: 'H703028',
    name: 'Ley del Sistema Nacional de Evaluación y Fiscalización Ambiental',
    rango: 'ley',
    fechaPublicacion: '2009-03-05',
  },
  {
    id: 'ley-30754',
    spijId: 'H732036',
    name: 'Ley Marco sobre Cambio Climático',
    rango: 'ley',
    fechaPublicacion: '2018-04-18',
  },

  // MINERÍA Y ENERGÍA
  {
    id: 'ley-26821',
    spijId: 'H687832',
    name: 'Ley Orgánica para el aprovechamiento sostenible de los recursos naturales',
    rango: 'ley-organica',
    fechaPublicacion: '1997-06-26',
  },
  {
    id: 'dleg-1002',
    spijId: 'H700748',
    name: 'Decreto Legislativo de promoción de la inversión para la generación de electricidad con el uso de energías renovables',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-05-02',
  },

  // PROPIEDAD INTELECTUAL
  {
    id: 'dleg-822',
    spijId: 'H685016',
    name: 'Ley sobre el Derecho de Autor',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-04-24',
  },
  {
    id: 'dleg-823',
    spijId: 'H685024',
    name: 'Ley de Propiedad Industrial',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-04-24',
  },

  // GOBIERNO DIGITAL
  {
    id: 'dleg-1412',
    spijId: 'H732684',
    name: 'Decreto Legislativo que aprueba la Ley de Gobierno Digital',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2018-09-13',
  },
  {
    id: 'ley-27269',
    spijId: 'H689176',
    name: 'Ley de Firmas y Certificados Digitales',
    rango: 'ley',
    fechaPublicacion: '2000-05-28',
  },
  {
    id: 'dleg-1246',
    spijId: 'H727843',
    name: 'Decreto Legislativo que aprueba diversas medidas de simplificación administrativa',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2016-11-10',
  },
  {
    id: 'ley-29733',
    spijId: 'H704036',
    name: 'Ley de Protección de Datos Personales',
    rango: 'ley',
    fechaPublicacion: '2011-07-03',
  },

  // CONTRATACIONES DEL ESTADO
  {
    id: 'ley-30225',
    spijId: 'H712056',
    name: 'Ley de Contrataciones del Estado',
    rango: 'ley',
    fechaPublicacion: '2014-07-11',
  },

  // INVERSIÓN PÚBLICA
  {
    id: 'dleg-1252',
    spijId: 'H727891',
    name: 'Decreto Legislativo que crea el Sistema Nacional de Programación Multianual y Gestión de Inversiones',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2016-12-01',
  },

  // DEFENSA DEL CONSUMIDOR
  {
    id: 'ley-29571',
    spijId: 'H703652',
    name: 'Código de Protección y Defensa del Consumidor',
    rango: 'ley',
    fechaPublicacion: '2010-09-02',
  },

  // COMPETENCIA
  {
    id: 'dleg-1034',
    spijId: 'H700884',
    name: 'Ley de Represión de Conductas Anticompetitivas',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-25',
  },
  {
    id: 'dleg-1044',
    spijId: 'H700932',
    name: 'Ley de Represión de la Competencia Desleal',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-26',
  },

  // ARBITRAJE
  {
    id: 'dleg-1071',
    spijId: 'H701024',
    name: 'Decreto Legislativo que norma el Arbitraje',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-28',
  },

  // SOCIEDADES
  {
    id: 'ley-26887',
    spijId: 'H687976',
    name: 'Ley General de Sociedades',
    rango: 'ley',
    fechaPublicacion: '1997-12-09',
  },

  // BANCOS Y SISTEMA FINANCIERO
  {
    id: 'ley-26702',
    spijId: 'H687512',
    name: 'Ley General del Sistema Financiero y del Sistema de Seguros y Orgánica de la Superintendencia de Banca y Seguros',
    rango: 'ley',
    fechaPublicacion: '1996-12-09',
  },
  {
    id: 'ley-27287',
    spijId: 'H689200',
    name: 'Ley de Títulos Valores',
    rango: 'ley',
    fechaPublicacion: '2000-06-19',
  },

  // GARANTÍAS
  {
    id: 'ley-28677',
    spijId: 'H700108',
    name: 'Ley de la Garantía Mobiliaria',
    rango: 'ley',
    fechaPublicacion: '2006-03-01',
  },

  // CONCURSAL
  {
    id: 'ley-27809',
    spijId: 'H691244',
    name: 'Ley General del Sistema Concursal',
    rango: 'ley',
    fechaPublicacion: '2002-08-08',
  },

  // VIOLENCIA
  {
    id: 'ley-30364',
    spijId: 'H727400',
    name: 'Ley para prevenir, sancionar y erradicar la violencia contra las mujeres y los integrantes del grupo familiar',
    rango: 'ley',
    fechaPublicacion: '2015-11-23',
  },

  // PERSONAS CON DISCAPACIDAD
  {
    id: 'ley-29973',
    spijId: 'H704336',
    name: 'Ley General de la Persona con Discapacidad',
    rango: 'ley',
    fechaPublicacion: '2012-12-24',
  },

  // SERVICIO CIVIL
  {
    id: 'ley-30057',
    spijId: 'H705664',
    name: 'Ley del Servicio Civil',
    rango: 'ley',
    fechaPublicacion: '2013-07-04',
  },

  // DEFENSORÍA DEL PUEBLO
  {
    id: 'ley-26520',
    spijId: 'H686364',
    name: 'Ley Orgánica de la Defensoría del Pueblo',
    rango: 'ley-organica',
    fechaPublicacion: '1995-08-08',
  },

  // SISTEMA ELECTORAL
  {
    id: 'ley-26859',
    spijId: 'H687880',
    name: 'Ley Orgánica de Elecciones',
    rango: 'ley-organica',
    fechaPublicacion: '1997-10-01',
  },
  {
    id: 'ley-28094',
    spijId: 'H694472',
    name: 'Ley de Organizaciones Políticas',
    rango: 'ley',
    fechaPublicacion: '2003-11-01',
  },

  // SEGURIDAD CIUDADANA
  {
    id: 'ley-27933',
    spijId: 'H692336',
    name: 'Ley del Sistema Nacional de Seguridad Ciudadana',
    rango: 'ley',
    fechaPublicacion: '2003-02-12',
  },
  {
    id: 'dleg-1267',
    spijId: 'H728099',
    name: 'Ley de la Policía Nacional del Perú',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2016-12-18',
  },

  // CONTROL GUBERNAMENTAL
  {
    id: 'ley-27785',
    spijId: 'H691184',
    name: 'Ley Orgánica del Sistema Nacional de Control y de la Contraloría General de la República',
    rango: 'ley-organica',
    fechaPublicacion: '2002-07-23',
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

async function getExistingLaws(): Promise<Set<string>> {
  const files = await readdir(OUTPUT_DIR)
  const laws = new Set<string>()
  for (const file of files) {
    if (file.endsWith('.md')) {
      laws.add(file.replace('.md', ''))
    }
  }
  return laws
}

async function main() {
  console.log('🇵🇪 Legalize PE - Additional Law Fetcher')
  console.log('═'.repeat(50))
  console.log()

  await mkdir(OUTPUT_DIR, { recursive: true })

  // Get existing laws to avoid duplicates
  const existingLaws = await getExistingLaws()
  console.log(`📚 Found ${existingLaws.size} existing laws`)

  // Filter out laws we already have
  const lawsToFetch = LAWS_TO_FETCH.filter(law => !existingLaws.has(law.id))
  console.log(`📥 Will fetch ${lawsToFetch.length} new laws`)
  console.log()

  let success = 0
  let failed = 0

  for (const law of lawsToFetch) {
    console.log(`\n📜 ${law.name}`)
    console.log(`   ID: ${law.id}`)

    try {
      const spijData = await fetchLaw(law.spijId)
      await saveLaw(law, spijData)
      success++
      console.log('   ✅ Success')
    } catch (error) {
      failed++
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : error}`)
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📚 Total laws now: ${existingLaws.size + success}`)
}

main().catch(console.error)
