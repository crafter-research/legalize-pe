import * as fs from 'node:fs'
import { load } from 'cheerio'
import { chromium } from 'playwright'

async function investigateNorma() {
  const url = 'https://busquedas.elperuano.pe/dispositivo/NL/2503204-1'

  console.log(`Investigando: ${url}`)

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 60000,
  })

  console.log('Página cargada, esperando contenido...')
  await page.waitForTimeout(5000)

  const html = await page.content()
  fs.writeFileSync('norma-page.html', html)
  console.log('HTML guardado en norma-page.html')
  console.log(`Longitud del HTML: ${html.length}`)

  const $ = load(html)

  // Buscar diferentes selectores
  const selectorsToTry = [
    '.story',
    '.contenido',
    '#contenido',
    '.texto-norma',
    '.norma-contenido',
    'article',
    '.main-content',
    '.ediciones_texto',
    '#NormasEPPortal',
    '.dispositivo',
    '#texto-norma',
    'pre',
    '.text-justify',
  ]

  console.log('\n--- Buscando selectores ---')
  for (const selector of selectorsToTry) {
    const $el = $(selector)
    if ($el.length > 0) {
      const text = $el.text().trim().slice(0, 200)
      console.log(`${selector}: ${$el.length} elementos - "${text}..."`)
    }
  }

  // Ver estructura general
  console.log('\n--- Estructura del body ---')
  const bodyChildren = $('body')
    .children()
    .map((_, el) => {
      const $el = $(el)
      const tag = el.tagName
      const id = $el.attr('id') || ''
      const classes = $el.attr('class') || ''
      return `<${tag} id="${id}" class="${classes}">`
    })
    .get()
  console.log(bodyChildren.join('\n'))

  // Buscar iframes
  const iframes = $('iframe')
  console.log(`\nIframes encontrados: ${iframes.length}`)
  iframes.each((_, iframe) => {
    const src = $(iframe).attr('src')
    console.log(`  src: ${src}`)
  })

  // Extraer todo el texto visible
  $('script, style, nav, header, footer').remove()
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  console.log('\n--- Preview del contenido (primeros 2000 chars) ---')
  console.log(bodyText.slice(0, 2000))

  console.log('\n========================================')
  console.log('Navegador abierto para inspección manual.')
  console.log('Presiona Ctrl+C para cerrar.')
  console.log('========================================')
  await new Promise(() => {})
}

investigateNorma().catch(console.error)
