/**
 * SPIJ Scraper v2 - Direct URL navigation
 *
 * Uses known SPIJ URLs to scrape content directly
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { type Page, chromium } from 'playwright'
import {
  type LawMetadata,
  convertHtmlToMarkdown,
  generateFrontmatter,
} from './html-to-markdown'

const OUTPUT_DIR = join(process.cwd(), '../../leyes/pe')
const TEMP_DIR = join(process.cwd(), 'temp')

// SPIJ known URLs with IDs
const CODES = [
  {
    name: 'Constitución Política del Perú 1993',
    id: 'constitucion-politica-peru-1993',
    spijId: 'H679920',
    rango: 'constitucion',
  },
  {
    name: 'Reglamento del Congreso de la República',
    id: 'reglamento-congreso',
    spijId: 'H680012',
    rango: 'reglamento',
  },
  {
    name: 'Nuevo Código Procesal Constitucional - Ley 31307',
    id: 'codigo-procesal-constitucional',
    spijId: 'H1270680',
    rango: 'ley',
  },
  {
    name: 'Código Civil - Decreto Legislativo 295',
    id: 'codigo-civil-dleg-295',
    spijId: 'H682684',
    rango: 'decreto-legislativo',
  },
  {
    name: 'TUO Código Procesal Civil - DS 017-93-JUS',
    id: 'codigo-procesal-civil',
    spijId: 'H684704',
    rango: 'decreto-supremo',
  },
  {
    name: 'Código Penal - Decreto Legislativo 635',
    id: 'codigo-penal-dleg-635',
    spijId: 'H683648',
    rango: 'decreto-legislativo',
  },
  {
    name: 'Código Procesal Penal - Decreto Legislativo 638',
    id: 'codigo-procesal-penal-dleg-638',
    spijId: 'H684540',
    rango: 'decreto-legislativo',
  },
  {
    name: 'Nuevo Código Procesal Penal - Decreto Legislativo 957',
    id: 'nuevo-codigo-procesal-penal-dleg-957',
    spijId: 'H697295',
    rango: 'decreto-legislativo',
  },
  {
    name: 'Código de Ejecución Penal - Decreto Legislativo 654',
    id: 'codigo-ejecucion-penal-dleg-654',
    spijId: 'H684464',
    rango: 'decreto-legislativo',
  },
  {
    name: 'Código Penal Militar Policial - Decreto Legislativo 1094',
    id: 'codigo-penal-militar-policial-dleg-1094',
    spijId: 'H709544',
    rango: 'decreto-legislativo',
  },
  {
    name: 'Código de Justicia Militar Policial - Decreto Legislativo 961',
    id: 'codigo-justicia-militar-dleg-961',
    spijId: 'H698760',
    rango: 'decreto-legislativo',
  },
  {
    name: 'Código de los Niños y Adolescentes - Ley 27337',
    id: 'codigo-ninos-adolescentes-ley-27337',
    spijId: 'H689228',
    rango: 'ley',
  },
  {
    name: 'Código de Responsabilidad Penal de Adolescentes - DL 1348',
    id: 'codigo-responsabilidad-penal-adolescentes-dl-1348',
    spijId: 'H1221752',
    rango: 'decreto-legislativo',
  },
  {
    name: 'Código de Comercio',
    id: 'codigo-comercio',
    spijId: 'H679960',
    rango: 'ley',
  },
  {
    name: 'Código de Protección y Defensa del Consumidor - Ley 29571',
    id: 'codigo-consumidor-ley-29571',
    spijId: 'H703096',
    rango: 'ley',
  },
  {
    name: 'TUO del Código Tributario - DS 133-2013-EF',
    id: 'codigo-tributario-tuo',
    spijId: 'H685084',
    rango: 'decreto-supremo',
  },
  {
    name: 'Código de Procedimientos Penales - Ley 9024',
    id: 'codigo-procedimientos-penales-ley-9024',
    spijId: 'H680396',
    rango: 'ley',
  },
  {
    name: 'Ley de Procedimiento Administrativo General - Ley 27444',
    id: 'ley-procedimiento-administrativo-ley-27444',
    spijId: 'H689068',
    rango: 'ley',
  },
  {
    name: 'Ley General del Sistema Financiero - Ley 26702',
    id: 'ley-sistema-financiero-ley-26702',
    spijId: 'H687512',
    rango: 'ley',
  },
  {
    name: 'Ley sobre el Derecho de Autor - Decreto Legislativo 822',
    id: 'ley-derechos-autor-dleg-822',
    spijId: 'H685016',
    rango: 'decreto-legislativo',
  },
]

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function runOCR(imagePath: string): string {
  if (!existsSync(imagePath)) return ''
  try {
    const result = execSync(
      `tesseract "${imagePath}" stdout -l spa --psm 3 2>/dev/null`,
      { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 },
    )
    return cleanText(result)
  } catch {
    return ''
  }
}

async function loginToSpij(page: Page): Promise<boolean> {
  try {
    await page.goto('https://spij.minjus.gob.pe/spij-ext-web/', {
      waitUntil: 'networkidle',
    })
    await page.waitForTimeout(2000)

    // Check if already logged in
    const menuVisible = await page
      .locator('button:has-text("BUSCADOR")')
      .isVisible()
      .catch(() => false)
    if (menuVisible) {
      console.log('   Already logged in')
      return true
    }

    // Fill login form
    const userInput = page.locator('input').first()
    const passInput = page.locator('input').nth(1)
    const loginBtn = page.locator('button:has-text("INGRESAR")').first()

    if (await loginBtn.isVisible()) {
      await userInput.fill('usuarioNoPago')
      await passInput.fill('123456')
      await loginBtn.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)
      return true
    }

    return false
  } catch (error) {
    console.log(`   Login error: ${(error as Error).message}`)
    return false
  }
}

async function scrapeCode(
  page: Page,
  code: (typeof CODES)[0],
  index: number,
): Promise<boolean> {
  console.log(`\n📜 [${index + 1}/${CODES.length}] ${code.name}`)
  console.log(`   SPIJ ID: ${code.spijId}`)

  try {
    // Navigate directly to the code
    const url = `https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${code.spijId}`
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    // Wait for Angular to render
    await page.waitForTimeout(5000)
    await page.waitForLoadState('networkidle').catch(() => {})

    // Wait for content to appear
    await page
      .waitForSelector('.mat-sidenav-content, app-detalle-norma, .content', {
        timeout: 30000,
      })
      .catch(() => {})

    // Try multiple extraction strategies
    let content = ''

    // Strategy 1: Get content from mat-sidenav-content
    try {
      content = await page.evaluate(() => {
        const el = document.querySelector('.mat-sidenav-content')
        if (el) {
          // Remove navigation elements
          const clone = el.cloneNode(true) as HTMLElement
          for (const e of clone.querySelectorAll(
            'mat-toolbar, mat-nav-list, .menu, nav, .sidebar',
          )) {
            e.remove()
          }
          return clone.innerText
        }
        return ''
      })
    } catch {}

    // Strategy 2: Get all text from the page body
    if (!content || content.length < 1000) {
      try {
        content = await page.evaluate(() => {
          const body = document.body
          const clone = body.cloneNode(true) as HTMLElement
          // Remove common navigation/UI elements
          for (const e of clone.querySelectorAll(
            'mat-toolbar, mat-nav-list, header, footer, nav, .menu, .sidebar, script, style',
          )) {
            e.remove()
          }
          return clone.innerText
        })
      } catch {}
    }

    // Strategy 3: Screenshot + OCR
    if (!content || content.length < 1000) {
      console.log('   📷 Taking screenshot for OCR...')
      const screenshotPath = join(TEMP_DIR, `${code.id}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: true })

      if (existsSync(screenshotPath)) {
        content = runOCR(screenshotPath)
        if (content.length > 500) {
          console.log(`   🔤 OCR extracted ${content.length} chars`)
        }
      }
    }

    // Check if we got meaningful content
    if (!content || content.length < 500) {
      console.log(
        `   ❌ Could not extract content (got ${content?.length || 0} chars)`,
      )

      // Take a debug screenshot
      const debugPath = join(TEMP_DIR, `debug-${code.id}.png`)
      await page.screenshot({ path: debugPath })
      console.log(`   📸 Debug screenshot: ${debugPath}`)

      return false
    }

    // Clean and save content
    const cleanedContent = cleanText(content)

    // Remove menu items that appear in all pages
    const menuPatterns = [
      'Calendarios',
      'TUPAS',
      'Información Relevante',
      'Usuario Suscrito',
      'BUSCADOR DE NORMAS',
      'JURISPRUDENCIA',
      'LEGISLACIÓN EMITIDA',
      'LEGISLACIÓN POR MATERIA',
      'NORMAS DEROGADAS',
      'NORMATIVA BÁSICA',
    ]

    let filteredContent = cleanedContent
    for (const pattern of menuPatterns) {
      // Only remove if it appears as a separate line (menu item)
      const regex = new RegExp(`^${pattern}.*$`, 'gm')
      filteredContent = filteredContent.replace(regex, '')
    }
    filteredContent = filteredContent.replace(/\n{3,}/g, '\n\n').trim()

    // Extract update date from content
    let updateDate = new Date().toISOString().split('T')[0]
    const dateMatch = filteredContent.match(
      /(?:actualizado|modificado|publicado)[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
    )
    if (dateMatch) {
      updateDate = `${dateMatch[3]}-${dateMatch[2]?.padStart(2, '0')}-${dateMatch[1]?.padStart(2, '0')}`
    }

    const metadata: LawMetadata = {
      titulo: code.name,
      identificador: code.id,
      pais: 'pe',
      jurisdiccion: 'pe',
      rango: code.rango,
      fechaPublicacion: '1900-01-01', // Will be updated from content
      ultimaActualizacion: updateDate,
      estado: 'vigente',
      fuente: `https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${code.spijId}`,
      diarioOficial: 'El Peruano',
    }

    const fullContent = `${generateFrontmatter(metadata)}\n\n${filteredContent}`

    const filepath = join(OUTPUT_DIR, `${code.id}.md`)
    writeFileSync(filepath, fullContent, 'utf-8')

    console.log(
      `   ✅ Saved: ${code.id}.md (${(filteredContent.length / 1024).toFixed(1)} KB)`,
    )

    return true
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Starting SPIJ Scraper v2')
  console.log(`   Output: ${OUTPUT_DIR}`)
  console.log(`   Codes: ${CODES.length}`)

  ensureDir(OUTPUT_DIR)
  ensureDir(TEMP_DIR)

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'es-PE',
  })

  const page = await context.newPage()
  page.setDefaultTimeout(60000)
  page.setDefaultNavigationTimeout(60000)

  try {
    // Login first
    console.log('\n🔐 Logging into SPIJ...')
    const loggedIn = await loginToSpij(page)
    if (!loggedIn) {
      console.log('   ⚠️ Could not login, will try to continue anyway')
    } else {
      console.log('   ✅ Logged in')
    }

    // Scrape each code
    let success = 0
    let failed = 0

    for (let i = 0; i < CODES.length; i++) {
      const code = CODES[i]
      if (!code) continue

      const ok = await scrapeCode(page, code, i)
      if (ok) success++
      else failed++

      // Wait between requests
      await page.waitForTimeout(3000)
    }

    // Summary
    console.log(`\n${'='.repeat(50)}`)
    console.log('📊 Summary')
    console.log('='.repeat(50))
    console.log(`   ✅ Success: ${success}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📁 Output: ${OUTPUT_DIR}`)
  } catch (error) {
    console.error('Fatal error:', error)
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
