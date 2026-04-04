#!/usr/bin/env npx tsx
/**
 * Download missing laws from SPIJ using agent-browser
 */

import { execSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const AB = '/Users/shiara/Documents/personal-projects/agent-browser/bin/agent-browser-darwin-arm64'
const OUTPUT_DIR = '/Users/shiara/Documents/personal-projects/legalize-pe/leyes/pe'

interface Law {
  id: string
  name: string
  search: string
  rango: string
  date: string
}

const LAWS: Law[] = [
  { id: 'ley-27815', name: 'Ley del Código de Ética de la Función Pública', search: '27815', rango: 'ley', date: '2002-08-13' },
  { id: 'ley-28024', name: 'Ley que regula la gestión de intereses en la administración pública', search: '28024', rango: 'ley', date: '2003-07-12' },
  { id: 'ley-26771', name: 'Ley de Nepotismo', search: '26771', rango: 'ley', date: '1997-04-15' },
  { id: 'ley-27693', name: 'Ley que crea la Unidad de Inteligencia Financiera', search: '27693', rango: 'ley', date: '2002-04-12' },
  { id: 'dleg-650', name: 'TUO de la Ley de Compensación por Tiempo de Servicios', search: '650', rango: 'decreto-legislativo', date: '1991-07-24' },
  { id: 'dleg-713', name: 'Descansos Remunerados de los Trabajadores', search: '713', rango: 'decreto-legislativo', date: '1991-11-08' },
  { id: 'dleg-688', name: 'Ley de Consolidación de Beneficios Sociales', search: '688', rango: 'decreto-legislativo', date: '1991-11-05' },
  { id: 'dleg-892', name: 'Participación de los Trabajadores en las Utilidades', search: '892', rango: 'decreto-legislativo', date: '1996-11-11' },
  { id: 'ley-25129', name: 'Ley de Asignación Familiar', search: '25129', rango: 'ley', date: '1989-12-06' },
  { id: 'ley-27735', name: 'Ley de Gratificaciones para Trabajadores', search: '27735', rango: 'ley', date: '2002-05-28' },
  { id: 'ley-29414', name: 'Ley que establece los derechos de las personas usuarias de los servicios de salud', search: '29414', rango: 'ley', date: '2009-10-02' },
  { id: 'ley-29944', name: 'Ley de Reforma Magisterial', search: '29944', rango: 'ley', date: '2012-11-25' },
  { id: 'ley-30512', name: 'Ley de Institutos y Escuelas de Educación Superior', search: '30512', rango: 'ley', date: '2016-11-02' },
  { id: 'ley-29325', name: 'Ley del Sistema Nacional de Evaluación y Fiscalización Ambiental', search: '29325', rango: 'ley', date: '2009-03-05' },
]

function ab(cmd: string, timeout = 30000): string {
  try {
    return execSync(`"${AB}" ${cmd}`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      timeout,
    }).trim()
  } catch (error: any) {
    if (error.stdout) return error.stdout.toString().trim()
    return ''
  }
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function login(): Promise<boolean> {
  console.log('🔐 Iniciando sesión en SPIJ...')

  // Close any existing browser
  ab('close --all')
  await wait(2000)

  // Open SPIJ
  ab('open "https://spij.minjus.gob.pe/"')
  await wait(5000)

  // Get snapshot to find login fields
  const snapshot = ab('snapshot -i')

  // Find username field (textbox Usuario)
  const userMatch = snapshot.match(/textbox "Usuario"[^[]*\[ref=(\w+)\]/)
  const passMatch = snapshot.match(/textbox "Contraseña"[^[]*\[ref=(\w+)\]/)
  const loginBtnMatch = snapshot.match(/button "INGRESAR"[^[]*\[ref=(\w+)\]/g)

  if (!userMatch || !passMatch) {
    console.log('❌ No se encontró formulario de login')
    return false
  }

  ab(`fill @${userMatch[1]} "usuarioNoPago"`)
  ab(`fill @${passMatch[1]} "123456"`)

  // Click the second INGRESAR button (form submit)
  const btnMatches = [...snapshot.matchAll(/button "INGRESAR"[^[]*\[ref=(\w+)\]/g)]
  if (btnMatches.length > 1) {
    ab(`click @${btnMatches[1][1]}`)
  }

  await wait(4000)
  console.log('✅ Sesión iniciada')
  return true
}

async function searchAndExtractLaw(law: Law): Promise<string | null> {
  console.log(`\n📜 ${law.name}`)
  console.log(`   ID: ${law.id}`)
  console.log(`   Búsqueda: ${law.search}`)

  try {
    // Go to search page
    ab('open "https://spij.minjus.gob.pe/spij-ext-web/#/busqueda/texto"')
    await wait(3000)

    // Get snapshot
    let snapshot = ab('snapshot -i')

    // Find search textbox
    const textboxMatch = snapshot.match(/textbox[^[]*\[ref=(\w+)\]/)
    if (!textboxMatch) {
      console.log('   ❌ No se encontró campo de búsqueda')
      return null
    }

    // Fill search
    ab(`fill @${textboxMatch[1]} "${law.search}"`)
    await wait(1000)

    // Find and click search button
    const searchBtnMatch = snapshot.match(/button "Buscar"[^[]*\[ref=(\w+)\]/)
    if (searchBtnMatch) {
      ab(`click @${searchBtnMatch[1]}`)
    } else {
      ab('press Enter')
    }
    await wait(4000)

    // Get results snapshot
    snapshot = ab('snapshot -i')

    // Find law link with detallenorma
    const lawLinkMatch = snapshot.match(/link[^[]*detallenorma[^[]*\[ref=(\w+)\]/)
    if (!lawLinkMatch) {
      console.log('   ❌ No se encontraron resultados')
      return null
    }

    // Click on law
    ab(`click @${lawLinkMatch[1]}`)
    await wait(5000)

    // Extract text
    const text = ab('eval "document.body.innerText"', 60000)

    if (text && text.length > 500) {
      console.log(`   ✅ Texto extraído: ${text.length} caracteres`)
      return text
    }

    console.log('   ❌ Texto muy corto o vacío')
    return null
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

async function saveLaw(law: Law, content: string): Promise<void> {
  const markdown = `---
titulo: "${law.name.replace(/"/g, '\\"')}"
identificador: "${law.id}"
pais: "pe"
jurisdiccion: "pe"
rango: "${law.rango}"
fechaPublicacion: "${law.date}"
ultimaActualizacion: "${new Date().toISOString().split('T')[0]}"
estado: "vigente"
fuente: "https://spij.minjus.gob.pe/"
diarioOficial: "El Peruano"
---

# ${law.name}

${content}
`

  const filePath = join(OUTPUT_DIR, `${law.id}.md`)
  await writeFile(filePath, markdown, 'utf-8')
  console.log(`   📝 Guardado: ${filePath}`)
}

async function main() {
  console.log('🇵🇪 Descargando leyes faltantes de SPIJ')
  console.log('═'.repeat(50))
  console.log(`📋 ${LAWS.length} leyes a descargar\n`)

  let success = 0
  let failed = 0

  try {
    const loggedIn = await login()
    if (!loggedIn) {
      console.log('❌ No se pudo iniciar sesión')
      return
    }

    for (const law of LAWS) {
      const content = await searchAndExtractLaw(law)

      if (content) {
        await saveLaw(law, content)
        success++
      } else {
        failed++
      }

      await wait(2000)
    }
  } finally {
    ab('close')
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Éxito: ${success}`)
  console.log(`❌ Fallidas: ${failed}`)
}

main().catch(console.error)
