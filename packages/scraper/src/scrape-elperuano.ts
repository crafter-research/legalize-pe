import * as fs from 'node:fs'
import { load } from 'cheerio'
import { chromium } from 'playwright'

interface NormaElPeruano {
  tipo: string
  numero: string
  fecha: string
  sumilla: string
  entidad: string
  url: string
  urlDescarga: string
  idNorma: string
}

async function scrapeElPeruano(): Promise<NormaElPeruano[]> {
  console.log('Iniciando scraping de El Peruano...')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  let normas: NormaElPeruano[] = []

  try {
    await page.goto('https://diariooficial.elperuano.pe/normas', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })

    console.log('Página cargada, esperando contenido...')
    await page.waitForTimeout(3000)

    const html = await page.content()
    console.log('HTML obtenido, parseando con cheerio...')

    normas = parseElPeruanoHtml(html)

    console.log(`\nTotal normas extraídas: ${normas.length}`)

    // Guardar resultado
    fs.writeFileSync('elperuano-normas.json', JSON.stringify(normas, null, 2))
    console.log('Normas guardadas en elperuano-normas.json')

    // Mostrar resumen
    console.log('\n--- Resumen por tipo ---')
    const tipoCount: Record<string, number> = {}
    for (const norma of normas) {
      tipoCount[norma.tipo] = (tipoCount[norma.tipo] || 0) + 1
    }
    for (const [tipo, count] of Object.entries(tipoCount).sort(
      (a, b) => b[1] - a[1],
    )) {
      console.log(`  ${tipo}: ${count}`)
    }

    // Mostrar resumen por entidad
    console.log('\n--- Resumen por entidad ---')
    const entidadCount: Record<string, number> = {}
    for (const norma of normas) {
      entidadCount[norma.entidad] = (entidadCount[norma.entidad] || 0) + 1
    }
    for (const [entidad, count] of Object.entries(entidadCount).sort(
      (a, b) => b[1] - a[1],
    )) {
      console.log(`  ${entidad}: ${count}`)
    }

    // Mostrar algunas normas de ejemplo
    console.log('\n--- Ejemplos de normas ---')
    for (const norma of normas.slice(0, 5)) {
      console.log(`\n${norma.tipo} N° ${norma.numero}`)
      console.log(`  Entidad: ${norma.entidad}`)
      console.log(`  Fecha: ${norma.fecha}`)
      console.log(`  Sumilla: ${norma.sumilla.slice(0, 100)}...`)
      console.log(`  URL: ${norma.url}`)
      console.log(`  ID: ${norma.idNorma}`)
    }
  } catch (error) {
    console.error('Error durante el scraping:', error)
  } finally {
    await browser.close()
  }

  return normas
}

function parseElPeruanoHtml(html: string): NormaElPeruano[] {
  const $ = load(html)
  const normas: NormaElPeruano[] = []

  // Iterar sobre cada article
  $('article.edicionesoficiales_articulos').each((_, article) => {
    const $article = $(article)
    const articleHtml = $article.html() || ''

    // Buscar el link a la norma
    const $link = $article.find(
      'h5 a[href*="busquedas.elperuano.pe/dispositivo"]',
    )
    if ($link.length === 0) return

    const url = $link.attr('href') || ''
    const tipoNumero = $link.text().trim()

    // Extraer ID de la norma del URL
    const idMatch = url.match(/\/NL\/(\d+-\d+)$/)
    const idNorma = idMatch?.[1] || ''

    // Parsear tipo y número
    const match = tipoNumero.match(/^(.+?)\s+N°\s*(.+)$/i)
    const tipo = match?.[1]?.trim() || tipoNumero
    const numero = match?.[2]?.trim() || ''

    // Buscar entidad (h4 dentro del article)
    const entidad = $article.find('h4').text().trim()

    // Buscar fecha
    const fechaMatch = articleHtml.match(/Fecha:\s*(\d{2}\/\d{2}\/\d{4})/)
    const fecha = fechaMatch?.[1] || ''

    // Buscar sumilla (el segundo <p> dentro de ediciones_texto)
    const $edicionesTexto = $article.find('.ediciones_texto')
    const $paragraphs = $edicionesTexto.find('p')
    let sumilla = ''
    if ($paragraphs.length >= 2) {
      sumilla = $paragraphs.eq(1).text().trim()
    }

    // Buscar URL de descarga individual
    const $descarga = $article.find('a[href*="DescargaIN"]')
    const urlDescarga = $descarga.attr('href') || ''

    // Buscar URL de cuadernillo completo
    const $cuadernillo = $article.find('a[href*="Descarga.asp"]')
    const urlCuadernillo = $cuadernillo.attr('href') || ''

    normas.push({
      tipo,
      numero,
      fecha,
      sumilla,
      entidad,
      url,
      urlDescarga,
      idNorma,
    })
  })

  return normas
}

async function downloadNormaContent(
  norma: NormaElPeruano,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
): Promise<string> {
  // El contenido real está en un iframe que carga desde la API
  // URL: https://busquedas.elperuano.pe/api/visor_html/{idNorma}
  const apiUrl = `https://busquedas.elperuano.pe/api/visor_html/${norma.idNorma}`

  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(apiUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })

    await page.waitForTimeout(1000)

    const html = await page.content()
    const $ = load(html)

    // Remover scripts, styles
    $('script, style').remove()

    // El contenido está directamente en el body
    let content = $('body').html() || ''

    // Limpiar el HTML pero preservar estructura básica
    content = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .trim()

    await context.close()
    return content
  } catch (error) {
    await context.close()
    throw error
  }
}

async function downloadAllNormas(): Promise<void> {
  console.log('Cargando normas desde elperuano-normas.json...')

  const normasJson = fs.readFileSync('elperuano-normas.json', 'utf-8')
  const normas: NormaElPeruano[] = JSON.parse(normasJson)

  console.log(`Total normas a descargar: ${normas.length}`)

  const browser = await chromium.launch({ headless: true })

  const results: { norma: NormaElPeruano; content: string; error?: string }[] =
    []

  for (const [i, norma] of normas.entries()) {
    console.log(
      `[${i + 1}/${normas.length}] Descargando: ${norma.tipo} N° ${norma.numero}...`,
    )

    try {
      const content = await downloadNormaContent(norma, browser)
      results.push({ norma, content })
      console.log(`  ✓ ${content.length} caracteres`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      results.push({ norma, content: '', error: errorMsg })
      console.log(`  ✗ Error: ${errorMsg}`)
    }

    // Pequeña pausa entre requests
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  await browser.close()

  // Guardar resultados
  fs.writeFileSync(
    'elperuano-normas-contenido.json',
    JSON.stringify(results, null, 2),
  )
  console.log('\nResultados guardados en elperuano-normas-contenido.json')

  // Resumen
  const exitosos = results.filter((r) => !r.error).length
  const fallidos = results.filter((r) => r.error).length
  console.log(`\nResumen: ${exitosos} exitosos, ${fallidos} fallidos`)
}

// Ejecutar según argumentos
const args = process.argv.slice(2)
if (args.includes('--download')) {
  downloadAllNormas().catch(console.error)
} else {
  scrapeElPeruano().catch(console.error)
}
