#!/usr/bin/env npx tsx
/**
 * Fetch more laws from LP Derecho - Batch 2
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
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

const LEYES: LawDefinition[] = [
  // CÓDIGOS FUNDAMENTALES
  {
    id: 'codigo-civil',
    name: 'Código Civil',
    url: 'https://lpderecho.pe/codigo-civil-peruano-realmente-actualizado/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1984-07-24',
    materias: ['civil', 'contratos', 'familia', 'sucesiones'],
    sumilla: 'Código Civil del Perú - Decreto Legislativo 295',
  },
  {
    id: 'codigo-procesal-civil',
    name: 'Código Procesal Civil',
    url: 'https://lpderecho.pe/codigo-procesal-civil-actualizado/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1993-04-22',
    materias: ['procesal', 'civil', 'proceso judicial'],
    sumilla: 'Código Procesal Civil - Decreto Legislativo 768',
  },
  {
    id: 'codigo-procesal-penal',
    name: 'Código Procesal Penal',
    url: 'https://lpderecho.pe/nuevo-codigo-procesal-penal-peruano-actualizado/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2004-07-29',
    materias: ['procesal', 'penal', 'proceso judicial'],
    sumilla: 'Nuevo Código Procesal Penal - Decreto Legislativo 957',
  },
  {
    id: 'codigo-procesal-constitucional',
    name: 'Código Procesal Constitucional',
    url: 'https://lpderecho.pe/codigo-procesal-constitucional-actualizado/',
    rango: 'ley',
    fechaPublicacion: '2021-07-23',
    materias: ['constitucional', 'procesal', 'amparo', 'habeas corpus'],
    sumilla: 'Nuevo Código Procesal Constitucional - Ley 31307',
  },
  // TRIBUTARIO
  {
    id: 'ds-133-2013-ef-codigo-tributario',
    name: 'TUO del Código Tributario',
    url: 'https://lpderecho.pe/tuo-codigo-tributario-decreto-supremo-133-2013-ef-actualizado/',
    rango: 'decreto-supremo',
    fechaPublicacion: '2013-06-22',
    materias: ['tributario', 'SUNAT', 'impuestos'],
    sumilla: 'Texto Único Ordenado del Código Tributario',
  },
  {
    id: 'dleg-813',
    name: 'Ley Penal Tributaria',
    url: 'https://lpderecho.pe/ley-penal-tributaria-actualizada/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-04-20',
    materias: ['penal', 'tributario', 'defraudación'],
    sumilla: 'Tipifica delitos tributarios y establece sanciones penales',
  },
  {
    id: 'ley-28008',
    name: 'Ley de los Delitos Aduaneros',
    url: 'https://lpderecho.pe/ley-delitos-aduaneros-ley-28008-actualizada/',
    rango: 'ley',
    fechaPublicacion: '2003-06-19',
    materias: ['penal', 'aduanas', 'contrabando'],
    sumilla: 'Tipifica delitos aduaneros como contrabando y defraudación',
  },
  // COMERCIAL Y SOCIETARIO
  {
    id: 'ley-26887',
    name: 'Ley General de Sociedades',
    url: 'https://lpderecho.pe/ley-general-sociedades-ley-26887-actualizado/',
    rango: 'ley',
    fechaPublicacion: '1997-12-09',
    materias: ['comercial', 'sociedades', 'empresas'],
    sumilla:
      'Regula la constitución y funcionamiento de sociedades mercantiles',
  },
  // ORGANIZACIÓN DEL ESTADO - JUDICIAL
  {
    id: 'ds-017-93-jus-lopj',
    name: 'TUO de la Ley Orgánica del Poder Judicial',
    url: 'https://lpderecho.pe/ley-organica-poder-judicial-actualizada/',
    rango: 'decreto-supremo',
    fechaPublicacion: '1993-06-02',
    materias: ['organización judicial', 'poder judicial', 'jueces'],
    sumilla: 'Organización y funciones del Poder Judicial',
  },
  {
    id: 'dleg-052',
    name: 'Ley Orgánica del Ministerio Público',
    url: 'https://lpderecho.pe/ley-organica-ministerio-publico-actualizada/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1981-03-18',
    materias: ['ministerio público', 'fiscalía', 'organización'],
    sumilla:
      'Organización y funciones del Ministerio Público - Fiscalía de la Nación',
  },
  // PENAL ESPECIAL
  {
    id: 'dleg-1150',
    name: 'Ley del Régimen Disciplinario de la Policía Nacional',
    url: 'https://lpderecho.pe/ley-regimen-disciplinario-policia-nacional-peru/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2012-12-11',
    materias: ['policial', 'disciplinario', 'PNP'],
    sumilla: 'Régimen disciplinario de la Policía Nacional del Perú',
  },
  {
    id: 'ley-30077',
    name: 'Ley contra el Crimen Organizado',
    url: 'https://lpderecho.pe/ley-30077-ley-crimen-organizado/',
    rango: 'ley',
    fechaPublicacion: '2013-08-20',
    materias: ['penal', 'crimen organizado', 'investigación'],
    sumilla: 'Define y sanciona el crimen organizado en el Perú',
  },
  // LABORAL ADICIONALES
  {
    id: 'ley-29497',
    name: 'Nueva Ley Procesal del Trabajo',
    url: 'https://lpderecho.pe/nueva-ley-procesal-trabajo-ley-29497/',
    rango: 'ley',
    fechaPublicacion: '2010-01-15',
    materias: ['laboral', 'procesal', 'trabajo'],
    sumilla: 'Regula los procesos judiciales en materia laboral',
  },
  // MUNICIPAL Y REGIONAL
  {
    id: 'ley-27972',
    name: 'Ley Orgánica de Municipalidades',
    url: 'https://lpderecho.pe/ley-organica-municipalidades-ley-27972/',
    rango: 'ley',
    fechaPublicacion: '2003-05-27',
    materias: ['municipal', 'gobiernos locales', 'descentralización'],
    sumilla: 'Organización, competencias y funciones de las municipalidades',
  },
  {
    id: 'ley-27867',
    name: 'Ley Orgánica de Gobiernos Regionales',
    url: 'https://lpderecho.pe/ley-organica-gobiernos-regionales-ley-27867/',
    rango: 'ley',
    fechaPublicacion: '2002-11-18',
    materias: ['regional', 'gobiernos regionales', 'descentralización'],
    sumilla: 'Estructura, organización y funciones de los gobiernos regionales',
  },
  // ELECTORAL
  {
    id: 'ley-26859',
    name: 'Ley Orgánica de Elecciones',
    url: 'https://lpderecho.pe/ley-organica-elecciones-ley-26859/',
    rango: 'ley',
    fechaPublicacion: '1997-10-01',
    materias: ['electoral', 'elecciones', 'votación'],
    sumilla: 'Regula los procesos electorales nacionales',
  },
  {
    id: 'ley-28094',
    name: 'Ley de Organizaciones Políticas',
    url: 'https://lpderecho.pe/ley-organizaciones-politicas-ley-28094/',
    rango: 'ley',
    fechaPublicacion: '2003-11-01',
    materias: ['electoral', 'partidos políticos', 'democracia'],
    sumilla: 'Regula la constitución y funcionamiento de partidos políticos',
  },
  // NOTARIAL Y REGISTRAL
  {
    id: 'dleg-1049',
    name: 'Ley del Notariado',
    url: 'https://lpderecho.pe/ley-notariado-decreto-legislativo-1049/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-26',
    materias: ['notarial', 'fe pública', 'documentos'],
    sumilla: 'Regula la función notarial y el acceso al notariado',
  },
  // ARBITRAJE
  {
    id: 'dleg-1071',
    name: 'Ley de Arbitraje',
    url: 'https://lpderecho.pe/ley-arbitraje-decreto-legislativo-1071/',
    rango: 'decreto-legislativo',
    fechaPublicacion: '2008-06-28',
    materias: ['arbitraje', 'resolución de conflictos', 'comercial'],
    sumilla: 'Norma general de arbitraje nacional e internacional',
  },
  // SEGURIDAD Y SALUD EN EL TRABAJO
  {
    id: 'ley-29783',
    name: 'Ley de Seguridad y Salud en el Trabajo',
    url: 'https://lpderecho.pe/ley-29783-seguridad-salud-trabajo/',
    rango: 'ley',
    fechaPublicacion: '2011-08-20',
    materias: ['laboral', 'seguridad', 'salud ocupacional'],
    sumilla: 'Marco normativo de prevención de riesgos laborales',
  },
  // TRANSPARENCIA Y ACCESO A LA INFORMACIÓN
  {
    id: 'ley-27806',
    name: 'Ley de Transparencia y Acceso a la Información Pública',
    url: 'https://lpderecho.pe/ley-transparencia-acceso-informacion-publica-ley-27806/',
    rango: 'ley',
    fechaPublicacion: '2002-08-03',
    materias: ['transparencia', 'acceso a la información', 'gobierno abierto'],
    sumilla: 'Garantiza el derecho de acceso a la información pública',
  },
  // PROTECCIÓN DE DATOS
  {
    id: 'ley-29733',
    name: 'Ley de Protección de Datos Personales',
    url: 'https://lpderecho.pe/ley-proteccion-datos-personales-ley-29733/',
    rango: 'ley',
    fechaPublicacion: '2011-07-03',
    materias: ['datos personales', 'privacidad', 'digital'],
    sumilla: 'Protección del derecho a la privacidad y datos personales',
  },
  // FIRMAS Y CERTIFICADOS DIGITALES
  {
    id: 'ley-27269',
    name: 'Ley de Firmas y Certificados Digitales',
    url: 'https://lpderecho.pe/ley-firmas-certificados-digitales-ley-27269/',
    rango: 'ley',
    fechaPublicacion: '2000-05-28',
    materias: ['digital', 'firma electrónica', 'comercio electrónico'],
    sumilla:
      'Regula la utilización de firmas electrónicas y certificados digitales',
  },
  // MEDIO AMBIENTE
  {
    id: 'ley-28611',
    name: 'Ley General del Ambiente',
    url: 'https://lpderecho.pe/ley-general-ambiente-ley-28611/',
    rango: 'ley',
    fechaPublicacion: '2005-10-15',
    materias: ['ambiental', 'medio ambiente', 'sostenibilidad'],
    sumilla: 'Marco normativo para la gestión ambiental en el Perú',
  },
  // RECURSOS HÍDRICOS
  {
    id: 'ley-29338',
    name: 'Ley de Recursos Hídricos',
    url: 'https://lpderecho.pe/ley-recursos-hidricos-ley-29338/',
    rango: 'ley',
    fechaPublicacion: '2009-03-31',
    materias: ['ambiental', 'agua', 'recursos naturales'],
    sumilla: 'Regula el uso y gestión de los recursos hídricos',
  },
  // SALUD
  {
    id: 'ley-26842',
    name: 'Ley General de Salud',
    url: 'https://lpderecho.pe/ley-general-salud-ley-26842/',
    rango: 'ley',
    fechaPublicacion: '1997-07-20',
    materias: ['salud', 'derecho a la salud', 'servicios de salud'],
    sumilla: 'Marco legal del sistema de salud peruano',
  },
  // EDUCACIÓN
  {
    id: 'ley-28044',
    name: 'Ley General de Educación',
    url: 'https://lpderecho.pe/ley-general-educacion-ley-28044/',
    rango: 'ley',
    fechaPublicacion: '2003-07-29',
    materias: ['educación', 'derecho a la educación', 'sistema educativo'],
    sumilla: 'Fundamentos y principios del sistema educativo peruano',
  },
  // DEFENSORÍA DEL PUEBLO
  {
    id: 'ley-26520',
    name: 'Ley Orgánica de la Defensoría del Pueblo',
    url: 'https://lpderecho.pe/ley-organica-defensoria-pueblo-ley-26520/',
    rango: 'ley',
    fechaPublicacion: '1995-08-08',
    materias: ['constitucional', 'defensoría', 'derechos humanos'],
    sumilla: 'Organización y funciones de la Defensoría del Pueblo',
  },
  // CONTRALORÍA
  {
    id: 'ley-27785',
    name: 'Ley Orgánica del Sistema Nacional de Control',
    url: 'https://lpderecho.pe/ley-organica-sistema-nacional-control-contraloria-ley-27785/',
    rango: 'ley',
    fechaPublicacion: '2002-07-23',
    materias: ['control', 'contraloría', 'auditoría gubernamental'],
    sumilla: 'Sistema Nacional de Control y atribuciones de la Contraloría',
  },
  // CONCILIACIÓN
  {
    id: 'ley-26872',
    name: 'Ley de Conciliación',
    url: 'https://lpderecho.pe/ley-conciliacion-extrajudicial-ley-26872/',
    rango: 'ley',
    fechaPublicacion: '1997-11-13',
    materias: ['conciliación', 'resolución de conflictos', 'extrajudicial'],
    sumilla: 'Mecanismo alternativo de solución de conflictos',
  },
  // VIOLENCIA FAMILIAR
  {
    id: 'ley-30364',
    name: 'Ley para Prevenir y Erradicar la Violencia contra las Mujeres',
    url: 'https://lpderecho.pe/ley-30364-violencia-mujeres-integrantes-grupo-familiar/',
    rango: 'ley',
    fechaPublicacion: '2015-11-23',
    materias: ['violencia', 'género', 'familia', 'protección'],
    sumilla:
      'Prevención, sanción y erradicación de la violencia contra las mujeres',
  },
  // TÍTULOS VALORES
  {
    id: 'ley-27287',
    name: 'Ley de Títulos Valores',
    url: 'https://lpderecho.pe/ley-titulos-valores-ley-27287/',
    rango: 'ley',
    fechaPublicacion: '2000-06-19',
    materias: ['comercial', 'títulos valores', 'letras', 'pagarés'],
    sumilla: 'Regula los títulos valores en el Perú',
  },
  // GARANTÍA MOBILIARIA
  {
    id: 'ley-28677',
    name: 'Ley de la Garantía Mobiliaria',
    url: 'https://lpderecho.pe/ley-garantia-mobiliaria-ley-28677/',
    rango: 'ley',
    fechaPublicacion: '2006-03-01',
    materias: ['comercial', 'garantías', 'bienes muebles'],
    sumilla: 'Régimen de garantías sobre bienes muebles',
  },
]

async function fetchLawContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const html = await response.text()
  const contentMatch =
    html.match(
      /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:footer|div[^>]*class="[^"]*post-tags)/i,
    ) || html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)

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
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(
      /<div[^>]*class="[^"]*(?:sharedaddy|jp-relatedposts|ad-|social)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      '',
    )
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
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .trim()
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
  console.log(
    `   📝 Saved: ${law.id}.md (${(markdown.length / 1024).toFixed(1)} KB)`,
  )
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
    console.log(
      `   ❌ Error: ${error instanceof Error ? error.message : error}`,
    )
    return false
  }
}

async function main() {
  console.log('🇵🇪 Legalize PE - Batch 2: Códigos y Leyes Importantes')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES.length} laws to fetch\n`)

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const law of LEYES) {
    const result = await processLaw(law)
    if (result) {
      success++
    } else {
      failed++
    }
    await new Promise((r) => setTimeout(r, 2000))
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
