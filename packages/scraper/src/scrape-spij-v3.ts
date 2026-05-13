/**
 * SPIJ Scraper v3 - Click-based navigation
 *
 * Navigates through the SPIJ menu by clicking on links
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { type Locator, type Page, chromium } from 'playwright'
import { type LawMetadata, generateFrontmatter } from './html-to-markdown'

const OUTPUT_DIR = join(process.cwd(), '../../leyes/pe')
const TEMP_DIR = join(process.cwd(), 'temp')

// Codes to scrape - using exact heading text from SPIJ menu
const CODES = [
  {
    heading: 'CONSTITUCION POLITICA',
    id: 'constitucion-politica-peru-1993',
    rango: 'constitucion',
  },
  {
    heading: 'REGLAMENTO DEL CONGRESO',
    id: 'reglamento-congreso',
    rango: 'reglamento',
  },
  {
    heading: 'NUEVO CODIGO PROCESAL CONSTITUCIONAL',
    id: 'codigo-procesal-constitucional',
    rango: 'ley',
  },
  { heading: 'CODIGO CIVIL', id: 'codigo-civil', rango: 'decreto-legislativo' },
  {
    heading: '(TUO) CODIGO PROCESAL CIVIL',
    id: 'codigo-procesal-civil',
    rango: 'decreto-supremo',
  },
  { heading: 'CODIGO PENAL', id: 'codigo-penal', rango: 'decreto-legislativo' },
  {
    heading: 'CODIGO PROCESAL PENAL (D.L 638)',
    id: 'codigo-procesal-penal-dl638',
    rango: 'decreto-legislativo',
  },
  {
    heading: 'NUEVO CODIGO PROCESAL PENAL (D.L 957)',
    id: 'nuevo-codigo-procesal-penal',
    rango: 'decreto-legislativo',
  },
  {
    heading: 'CODIGO DE EJECUCION PENAL',
    id: 'codigo-ejecucion-penal',
    rango: 'decreto-legislativo',
  },
  {
    heading: 'CODIGO PENAL MILITAR POLICIAL',
    id: 'codigo-penal-militar-policial',
    rango: 'decreto-legislativo',
  },
  {
    heading: 'CODIGO DE JUSTICIA MILITAR POLICIAL',
    id: 'codigo-justicia-militar',
    rango: 'decreto-legislativo',
  },
  {
    heading: 'CODIGO DE LOS NIÑOS Y ADOLESCENTES',
    id: 'codigo-ninos-adolescentes',
    rango: 'ley',
  },
  {
    heading: 'CODIGO DE RESPONSABILIDAD PENAL DE ADOLESCENTES',
    id: 'codigo-responsabilidad-penal-adolescentes',
    rango: 'decreto-legislativo',
  },
  { heading: 'CODIGO DE COMERCIO', id: 'codigo-comercio', rango: 'ley' },
  {
    heading: 'CODIGO DE PROTECCION Y DEFENSA DEL CONSUMIDOR',
    id: 'codigo-consumidor',
    rango: 'ley',
  },
  {
    heading: 'CODIGO TRIBUTARIO (TUO)',
    id: 'codigo-tributario',
    rango: 'decreto-supremo',
  },
  {
    heading: 'CODIGO DE PROCEDIMIENTOS PENALES',
    id: 'codigo-procedimientos-penales',
    rango: 'ley',
  },
  {
    heading: 'DERECHO COMPARADO',
    id: 'derecho-comparado',
    rango: 'jurisprudencia',
  },
  {
    heading: 'JURISPRUDENCIA INTERNACIONAL',
    id: 'jurisprudencia-internacional',
    rango: 'jurisprudencia',
  },
]

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function cleanText(text: string): string {
  // Remove menu/navigation text that appears on all pages
  const menuPatterns = [
    /Calendarios\s*arrow_drop_down/g,
    /TUPAS/g,
    /Información Relevante\s*arrow_drop_down/g,
    /Usuario Suscrito/g,
    /BUSCADOR DE NORMAS/g,
    /JURISPRUDENCIA/g,
    /LEGISLACIÓN EMITIDA POR GOBIERNOS LOCALES Y REGIONALES/g,
    /LEGISLACIÓN POR MATERIA/g,
    /NORMAS DEROGADAS/g,
    /NORMATIVA BÁSICA E INFORMACIÓN JURÍDICA RELEVANTE/g,
    /Ir a la pantalla principal/g,
    /Descargar/g,
    /Enviar/g,
    /QR/g,
    /download\s*mail\s*qr_code/gi,
    /keyboard_backspace\s*Volver/g,
    /home\s*Fecha de Publicación/g,
  ]

  let result = text
  for (const pattern of menuPatterns) {
    result = result.replace(pattern, '')
  }

  return result
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
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
  console.log('🔐 Navigating to SPIJ...')

  await page.goto('https://spij.minjus.gob.pe/spij-ext-web/', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(3000)

  // Check for login form
  const loginBtn = page.locator('button:has-text("INGRESAR")').first()

  if (await loginBtn.isVisible().catch(() => false)) {
    console.log('   Filling login form...')

    // Find inputs by their order
    const inputs = await page.locator('input').all()
    if (inputs.length >= 2) {
      await inputs[0]?.fill('usuarioNoPago')
      await inputs[1]?.fill('123456')
    }

    await loginBtn.click()
    await page.waitForTimeout(5000)
    await page.waitForLoadState('networkidle').catch(() => {})

    // Verify login success
    const menuBtn = page.locator('button:has-text("BUSCADOR")').first()
    if (await menuBtn.isVisible().catch(() => false)) {
      console.log('   ✅ Login successful')
      return true
    }
  }

  // Check if already logged in
  const isLoggedIn = await page
    .locator('h5')
    .first()
    .isVisible()
    .catch(() => false)
  if (isLoggedIn) {
    console.log('   ✅ Already logged in')
    return true
  }

  console.log('   ⚠️ Login status unclear')
  return false
}

async function extractContentFromCurrentPage(page: Page): Promise<string> {
  // Wait for any loading to complete
  await page.waitForTimeout(3000)
  await page.waitForLoadState('networkidle').catch(() => {})

  // Try to find the main content area
  let content = ''

  // Strategy 1: Look for the main content container
  try {
    const contentArea = await page.evaluate(() => {
      // Find the main content area (usually after navigation)
      const sidenavContent = document.querySelector('.mat-sidenav-content')
      if (sidenavContent) {
        // Try to get just the norma content, not the menu
        const normaContent = sidenavContent.querySelector(
          'app-detalle-norma, .detalle-norma, .content',
        )
        if (normaContent) {
          return normaContent.innerHTML
        }
        return sidenavContent.innerHTML
      }
      return ''
    })

    if (contentArea) {
      content = contentArea.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    }
  } catch {}

  // Strategy 2: Get innerText from specific areas
  if (content.length < 1000) {
    try {
      content = await page.evaluate(() => {
        // Get all text nodes from the main area
        const mainContent = document.querySelector('.mat-sidenav-content')
        if (!mainContent) return ''

        // Clone to avoid modifying the page
        const clone = mainContent.cloneNode(true) as HTMLElement

        // Remove toolbar/menu elements
        for (const el of clone.querySelectorAll(
          'mat-toolbar, mat-nav-list, mat-menu, .mat-menu',
        )) {
          el.remove()
        }

        return clone.innerText
      })
    } catch {}
  }

  // Strategy 3: Full page text
  if (content.length < 500) {
    try {
      content = await page.evaluate(() => document.body.innerText)
    } catch {}
  }

  return content
}

async function scrapeCode(
  page: Page,
  code: (typeof CODES)[0],
  index: number,
): Promise<boolean> {
  console.log(`\n📜 [${index + 1}/${CODES.length}] ${code.heading}`)

  try {
    // First, navigate to the main SPIJ page
    await page.goto('https://spij.minjus.gob.pe/spij-ext-web/', {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForTimeout(3000)

    // Login if needed
    const loginBtn = page.locator('button:has-text("INGRESAR")').first()
    if (await loginBtn.isVisible().catch(() => false)) {
      const inputs = await page.locator('input').all()
      if (inputs.length >= 2) {
        await inputs[0]?.fill('usuarioNoPago')
        await inputs[1]?.fill('123456')
      }
      await loginBtn.click()
      await page.waitForTimeout(4000)
    }

    // Wait for the menu to appear
    await page.waitForSelector('h5', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(2000)

    // Find and click the code heading
    const headingLocator = page
      .locator(`h5:has-text("${code.heading}")`)
      .first()

    if (!(await headingLocator.isVisible().catch(() => false))) {
      // Try partial match
      const partialHeading = page
        .locator('h5')
        .filter({ hasText: code.heading.split(' ')[0] || '' })
        .first()
      if (!(await partialHeading.isVisible().catch(() => false))) {
        console.log(`   ❌ Could not find heading: ${code.heading}`)
        return false
      }
      await partialHeading.click()
    } else {
      await headingLocator.click()
    }

    // Wait for navigation
    await page.waitForTimeout(5000)
    await page.waitForLoadState('networkidle').catch(() => {})

    // Check URL to see if we navigated
    const currentUrl = page.url()
    console.log(`   URL: ${currentUrl}`)

    // Extract content
    let content = await extractContentFromCurrentPage(page)

    // If content is too short, try screenshot + OCR
    if (content.length < 1000) {
      console.log(
        `   📷 Content too short (${content.length} chars), trying OCR...`,
      )
      const screenshotPath = join(TEMP_DIR, `${code.id}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: true })

      if (existsSync(screenshotPath)) {
        const ocrContent = runOCR(screenshotPath)
        if (ocrContent.length > content.length) {
          content = ocrContent
          console.log(`   🔤 OCR extracted ${content.length} chars`)
        }
      }
    }

    // Final check
    if (content.length < 500) {
      console.log('   ❌ Could not extract meaningful content')

      // Save debug screenshot
      const debugPath = join(TEMP_DIR, `debug-${code.id}.png`)
      await page.screenshot({ path: debugPath })
      console.log(`   📸 Debug screenshot saved: ${debugPath}`)

      return false
    }

    // Clean and save
    const cleanedContent = cleanText(content)

    const metadata: LawMetadata = {
      titulo: code.heading,
      identificador: code.id,
      pais: 'pe',
      jurisdiccion: 'pe',
      rango: code.rango,
      fechaPublicacion: '1900-01-01',
      ultimaActualizacion: new Date().toISOString().split('T')[0],
      estado: 'vigente',
      fuente: 'https://spij.minjus.gob.pe/',
      diarioOficial: 'El Peruano',
    }

    const fullContent = `${generateFrontmatter(metadata)}\n\n${cleanedContent}`
    const filepath = join(OUTPUT_DIR, `${code.id}.md`)
    writeFileSync(filepath, fullContent, 'utf-8')

    console.log(
      `   ✅ Saved: ${code.id}.md (${(cleanedContent.length / 1024).toFixed(1)} KB)`,
    )
    return true
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Starting SPIJ Scraper v3')
  console.log(`   Output: ${OUTPUT_DIR}`)
  console.log(`   Codes to scrape: ${CODES.length}`)

  ensureDir(OUTPUT_DIR)
  ensureDir(TEMP_DIR)

  const browser = await chromium.launch({
    headless: false, // Run headed to debug
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    locale: 'es-PE',
  })

  const page = await context.newPage()
  page.setDefaultTimeout(30000)

  let success = 0
  let failed = 0

  try {
    for (let i = 0; i < CODES.length; i++) {
      const code = CODES[i]
      if (!code) continue

      const ok = await scrapeCode(page, code, i)
      if (ok) success++
      else failed++

      await page.waitForTimeout(2000)
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log('📊 Summary')
    console.log('='.repeat(50))
    console.log(`   ✅ Success: ${success}`)
    console.log(`   ❌ Failed: ${failed}`)
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
