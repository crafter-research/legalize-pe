#!/usr/bin/env npx tsx
/**
 * Fetch missing laws from SPIJ using agent-browser
 * Usage: npx tsx scripts/fetch-leyes-faltantes.ts
 */

import { execSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../leyes/pe')
const AGENT_BROWSER =
  '/Users/shiara/Documents/personal-projects/agent-browser/bin/agent-browser-darwin-arm64'

interface LeyFaltante {
  id: string
  nombre: string
  busqueda: string
  rango: string
  fechaPublicacion: string
}

const LEYES_FALTANTES: LeyFaltante[] = [
  // Anticorrupción
  {
    id: 'ley-27815',
    nombre: 'Ley del Código de Ética de la Función Pública',
    busqueda: 'Ley 27815',
    rango: 'ley',
    fechaPublicacion: '2002-08-13',
  },
  {
    id: 'ley-28024',
    nombre:
      'Ley que regula la gestión de intereses en la administración pública',
    busqueda: 'Ley 28024',
    rango: 'ley',
    fechaPublicacion: '2003-07-12',
  },
  {
    id: 'ley-26771',
    nombre: 'Ley de Nepotismo',
    busqueda: 'Ley 26771',
    rango: 'ley',
    fechaPublicacion: '1997-04-15',
  },
  {
    id: 'ley-27693',
    nombre: 'Ley que crea la Unidad de Inteligencia Financiera - Perú',
    busqueda: 'Ley 27693',
    rango: 'ley',
    fechaPublicacion: '2002-04-12',
  },
  // Laboral
  {
    id: 'dleg-650',
    nombre: 'TUO de la Ley de Compensación por Tiempo de Servicios',
    busqueda: 'Decreto Legislativo 650',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-07-24',
  },
  {
    id: 'dleg-713',
    nombre: 'Descansos Remunerados de los Trabajadores',
    busqueda: 'Decreto Legislativo 713',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-11-08',
  },
  {
    id: 'dleg-688',
    nombre: 'Ley de Consolidación de Beneficios Sociales',
    busqueda: 'Decreto Legislativo 688',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1991-11-05',
  },
  {
    id: 'dleg-892',
    nombre: 'Participación de los Trabajadores en las Utilidades',
    busqueda: 'Decreto Legislativo 892',
    rango: 'decreto-legislativo',
    fechaPublicacion: '1996-11-11',
  },
  {
    id: 'ley-25129',
    nombre: 'Ley de Asignación Familiar',
    busqueda: 'Ley 25129',
    rango: 'ley',
    fechaPublicacion: '1989-12-06',
  },
  {
    id: 'ley-27735',
    nombre: 'Ley de Gratificaciones para Trabajadores',
    busqueda: 'Ley 27735',
    rango: 'ley',
    fechaPublicacion: '2002-05-28',
  },
  // Salud
  {
    id: 'ley-29414',
    nombre:
      'Ley que establece los derechos de las personas usuarias de los servicios de salud',
    busqueda: 'Ley 29414',
    rango: 'ley',
    fechaPublicacion: '2009-10-02',
  },
  // Educación
  {
    id: 'ley-29944',
    nombre: 'Ley de Reforma Magisterial',
    busqueda: 'Ley 29944',
    rango: 'ley',
    fechaPublicacion: '2012-11-25',
  },
  {
    id: 'ley-30512',
    nombre: 'Ley de Institutos y Escuelas de Educación Superior',
    busqueda: 'Ley 30512',
    rango: 'ley',
    fechaPublicacion: '2016-11-02',
  },
  // Medio Ambiente
  {
    id: 'ley-29325',
    nombre: 'Ley del Sistema Nacional de Evaluación y Fiscalización Ambiental',
    busqueda: 'Ley 29325',
    rango: 'ley',
    fechaPublicacion: '2009-03-05',
  },
]

function ab(cmd: string): string {
  try {
    const result = execSync(`${AGENT_BROWSER} ${cmd}`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 60000,
    })
    return result.trim()
  } catch (error: unknown) {
    const e = error as { stdout?: Buffer }
    if (e.stdout) return e.stdout.toString().trim()
    throw error
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function login(): Promise<void> {
  console.log('🔐 Logging into SPIJ...')
  ab('open "https://spij.minjus.gob.pe/"')
  await wait(4000)

  // Fill login form
  ab('fill @e3 "usuarioNoPago"')
  ab('fill @e4 "123456"')
  ab('click @e2')
  await wait(4000)
  console.log('✅ Logged in')
}

async function searchAndExtract(ley: LeyFaltante): Promise<string | null> {
  console.log(`\n📜 Buscando: ${ley.nombre}`)
  console.log(`   Búsqueda: ${ley.busqueda}`)

  try {
    // Go to search
    ab('open "https://spij.minjus.gob.pe/spij-ext-web/#/busqueda/texto"')
    await wait(3000)

    // Get snapshot to find search field
    const snapshot = ab('snapshot -i')

    // Find text input for search
    const textInputMatch = snapshot.match(/textbox[^[]*\[ref=(\w+)\]/)
    if (textInputMatch) {
      ab(`fill @${textInputMatch[1]} "${ley.busqueda}"`)
      await wait(1000)
    }

    // Find and click search button
    const searchBtnMatch = snapshot.match(/button "Buscar"[^[]*\[ref=(\w+)\]/)
    if (searchBtnMatch) {
      ab(`click @${searchBtnMatch[1]}`)
      await wait(4000)
    }

    // Get results
    const resultsSnapshot = ab('snapshot -i')

    // Find law link with SPIJ ID
    const lawMatch = resultsSnapshot.match(
      /link[^[]*detallenorma\/(H\d+)[^[]*\[ref=(\w+)\]/,
    )
    if (lawMatch) {
      const spijId = lawMatch[1]
      console.log(`   Found SPIJ ID: ${spijId}`)

      // Click on the law
      ab(`click @${lawMatch[2]}`)
      await wait(4000)

      // Extract content
      const content = ab(
        'eval "document.querySelector(\'.contenido-norma, .texto-norma, article, main\')?.innerText || document.body.innerText"',
      )

      if (content && content.length > 500) {
        return content
      }
    }

    // Alternative: try eval to get all text
    const pageText = ab('eval "document.body.innerText"')
    if (pageText && pageText.length > 1000 && pageText.includes('Artículo')) {
      return pageText
    }

    return null
  } catch (error) {
    console.log(
      `   ❌ Error: ${error instanceof Error ? error.message : error}`,
    )
    return null
  }
}

async function saveLaw(ley: LeyFaltante, content: string): Promise<void> {
  const frontmatter = `---
titulo: "${ley.nombre.replace(/"/g, '\\"')}"
identificador: "${ley.id}"
pais: "pe"
jurisdiccion: "pe"
rango: "${ley.rango}"
fechaPublicacion: "${ley.fechaPublicacion}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "https://spij.minjus.gob.pe/"
diarioOficial: "El Peruano"
---`

  const markdown = `${frontmatter}

# ${ley.nombre}

${content}
`

  const filePath = join(OUTPUT_DIR, `${ley.id}.md`)
  await writeFile(filePath, markdown, 'utf-8')
  console.log(`   📝 Saved: ${filePath}`)
}

async function main() {
  console.log('🇵🇪 Legalize PE - Fetch Leyes Faltantes')
  console.log('═'.repeat(50))
  console.log(`📋 ${LEYES_FALTANTES.length} leyes a descargar`)
  console.log()

  await mkdir(OUTPUT_DIR, { recursive: true })

  let success = 0
  let failed = 0

  try {
    await login()

    for (const ley of LEYES_FALTANTES) {
      try {
        const content = await searchAndExtract(ley)

        if (content) {
          await saveLaw(ley, content)
          success++
          console.log('   ✅ Success')
        } else {
          failed++
          console.log('   ❌ No content found')
        }
      } catch (error) {
        failed++
        console.log(
          `   ❌ Error: ${error instanceof Error ? error.message : error}`,
        )
      }

      await wait(2000)
    }
  } finally {
    try {
      ab('close')
    } catch (e) {
      // Ignore close errors
    }
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
}

main().catch(console.error)
