/**
 * SPIJ Scraper using Playwright
 *
 * Scrapes all Peruvian legal codes from SPIJ website
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

// Code mappings: ref -> identifier
const CODES = [
  {
    ref: 'e12',
    name: 'CONSTITUCION POLITICA',
    id: 'constitucion-politica-peru',
    rango: 'constitucion',
  },
  {
    ref: 'e14',
    name: 'REGLAMENTO DEL CONGRESO',
    id: 'reglamento-congreso',
    rango: 'reglamento',
  },
  {
    ref: 'e16',
    name: 'NUEVO CODIGO PROCESAL CONSTITUCIONAL',
    id: 'codigo-procesal-constitucional',
    rango: 'ley',
  },
  {
    ref: 'e18',
    name: 'CODIGO CIVIL',
    id: 'codigo-civil',
    rango: 'decreto-legislativo',
  },
  {
    ref: 'e20',
    name: 'TUO CODIGO PROCESAL CIVIL',
    id: 'codigo-procesal-civil',
    rango: 'decreto-legislativo',
  },
  {
    ref: 'e22',
    name: 'CODIGO PENAL',
    id: 'codigo-penal',
    rango: 'decreto-legislativo',
  },
  {
    ref: 'e24',
    name: 'CODIGO PROCESAL PENAL',
    id: 'codigo-procesal-penal-dl638',
    rango: 'decreto-legislativo',
  },
  {
    ref: 'e26',
    name: 'NUEVO CODIGO PROCESAL PENAL',
    id: 'nuevo-codigo-procesal-penal',
    rango: 'decreto-legislativo',
  },
  {
    ref: 'e28',
    name: 'CODIGO DE EJECUCION PENAL',
    id: 'codigo-ejecucion-penal',
    rango: 'decreto-legislativo',
  },
  {
    ref: 'e30',
    name: 'CODIGO PENAL MILITAR POLICIAL',
    id: 'codigo-penal-militar-policial',
    rango: 'decreto-legislativo',
  },
  {
    ref: 'e32',
    name: 'CODIGO DE JUSTICIA MILITAR POLICIAL',
    id: 'codigo-justicia-militar-policial',
    rango: 'decreto-legislativo',
  },
  {
    ref: 'e34',
    name: 'CODIGO DE LOS NIÑOS Y ADOLESCENTES',
    id: 'codigo-ninos-adolescentes',
    rango: 'ley',
  },
  {
    ref: 'e36',
    name: 'CODIGO DE RESPONSABILIDAD PENAL DE ADOLESCENTES',
    id: 'codigo-responsabilidad-penal-adolescentes',
    rango: 'decreto-legislativo',
  },
  {
    ref: 'e38',
    name: 'CODIGO DE COMERCIO',
    id: 'codigo-comercio',
    rango: 'ley',
  },
  {
    ref: 'e40',
    name: 'CODIGO DE PROTECCION Y DEFENSA DEL CONSUMIDOR',
    id: 'codigo-consumidor',
    rango: 'ley',
  },
  {
    ref: 'e42',
    name: 'CODIGO TRIBUTARIO TUO',
    id: 'codigo-tributario',
    rango: 'decreto-supremo',
  },
  {
    ref: 'e44',
    name: 'CODIGO DE PROCEDIMIENTOS PENALES',
    id: 'codigo-procedimientos-penales',
    rango: 'ley',
  },
  {
    ref: 'e46',
    name: 'DERECHO COMPARADO',
    id: 'derecho-comparado',
    rango: 'jurisprudencia',
  },
  {
    ref: 'e48',
    name: 'JURISPRUDENCIA INTERNACIONAL',
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
      `tesseract "${imagePath}" stdout -l spa --psm 6 2>/dev/null`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 },
    )
    return cleanText(result)
  } catch {
    return ''
  }
}

async function scrapeCode(
  page: Page,
  code: (typeof CODES)[0],
  index: number,
): Promise<boolean> {
  console.log(`\n📜 [${index + 1}/${CODES.length}] ${code.name}...`)

  try {
    // Find and click the code link
    const cards = await page.locator('.mat-card, .card, a').all()

    // Look for the heading with the code name
    const heading = page.locator(`h5:has-text("${code.name}")`)
    const exists = (await heading.count()) > 0

    if (!exists) {
      console.log(`   ⚠️ Could not find heading for ${code.name}`)
      return false
    }

    // Click the parent link
    const link = heading.locator('xpath=ancestor::a')
    if ((await link.count()) > 0) {
      await link.first().click()
    } else {
      await heading.click()
    }

    // Wait for content to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Extract content
    let content = ''

    // Try to get content from main content area
    const contentSelectors = [
      '.mat-sidenav-content',
      '.content-area',
      'main',
      'article',
      '.mat-card-content',
      'app-detalle-norma',
    ]

    for (const selector of contentSelectors) {
      const el = page.locator(selector).first()
      if ((await el.count()) > 0) {
        content = await el.innerText()
        if (content.length > 500) break
      }
    }

    // Fallback to body
    if (content.length < 500) {
      content = await page.locator('body').innerText()
    }

    // If still no content, try screenshot + OCR
    if (content.length < 500) {
      console.log('   📷 Taking screenshot for OCR...')
      const screenshotPath = join(TEMP_DIR, `${code.id}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: true })
      content = runOCR(screenshotPath)
    }

    if (content.length < 100) {
      console.log('   ❌ Could not extract content')
      return false
    }

    // Save content
    const cleanedContent = cleanText(content)

    const metadata: LawMetadata = {
      titulo: code.name,
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

    // Go back to main page
    await page.goto('https://spij.minjus.gob.pe/spij-ext-web/')
    await page.waitForLoadState('networkidle')

    // Re-login if needed
    const loginBtn = page.locator('button:has-text("INGRESAR")').first()
    if ((await loginBtn.count()) > 0 && (await loginBtn.isVisible())) {
      await page.fill(
        'input[placeholder*="Usuario"], input[type="text"]',
        'usuarioNoPago',
      )
      await page.fill(
        'input[placeholder*="Contraseña"], input[type="password"]',
        '123456',
      )
      await loginBtn.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
    }

    return true
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`)

    // Try to recover
    try {
      await page.goto('https://spij.minjus.gob.pe/spij-ext-web/')
      await page.waitForLoadState('networkidle')
    } catch {}

    return false
  }
}

async function scrapeElPeruano(page: Page): Promise<number> {
  console.log('\n📰 Scraping El Peruano...')
  let count = 0

  try {
    await page.goto('https://diariooficial.elperuano.pe/normas')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Get all articles
    const articles = await page.locator('article, .norma-item, .card').all()
    count = articles.length

    console.log(`   Found ${count} items`)

    // Extract first 20 normas
    for (let i = 0; i < Math.min(20, articles.length); i++) {
      try {
        const article = articles[i]
        if (!article) continue

        const title = await article
          .locator('h2, h3, .title, a')
          .first()
          .innerText()
          .catch(() => '')
        const link = await article
          .locator('a')
          .first()
          .getAttribute('href')
          .catch(() => '')

        if (title && title.length > 10) {
          const id = `elperuano-${Date.now()}-${i}`
          console.log(`   - ${title.substring(0, 60)}...`)
        }
      } catch {}
    }
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`)
  }

  return count
}

async function scrapeCongreso(page: Page): Promise<number> {
  console.log('\n🏛️ Scraping Congreso...')
  let count = 0

  const urls = [
    'https://www.leyes.congreso.gob.pe/',
    'https://www.gob.pe/institucion/congreso-de-la-republica/normas-legales',
  ]

  for (const url of urls) {
    try {
      console.log(`   ${url}`)
      await page.goto(url, { timeout: 30000 })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      const links = await page.locator('a').all()
      count += links.length

      console.log(`   Found ${links.length} links`)
    } catch (error) {
      console.log(`   ❌ Error: ${(error as Error).message}`)
    }
  }

  return count
}

async function main() {
  console.log('🚀 Starting SPIJ Playwright scraper')
  console.log(`   Output: ${OUTPUT_DIR}`)
  console.log(`   Codes: ${CODES.length}`)

  ensureDir(OUTPUT_DIR)
  ensureDir(TEMP_DIR)

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })
  const page = await context.newPage()

  // Set longer timeouts
  page.setDefaultTimeout(60000)
  page.setDefaultNavigationTimeout(60000)

  try {
    // Go to SPIJ
    console.log('\n🔐 Logging into SPIJ...')
    await page.goto('https://spij.minjus.gob.pe/spij-ext-web/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Login
    await page.fill(
      'input[placeholder*="Usuario"], input[type="text"]',
      'usuarioNoPago',
    )
    await page.fill(
      'input[placeholder*="Contraseña"], input[type="password"]',
      '123456',
    )
    await page.click('button:has-text("INGRESAR")')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    console.log('   ✅ Logged in')

    // Scrape codes
    let success = 0
    let failed = 0

    for (let i = 0; i < CODES.length; i++) {
      const code = CODES[i]
      if (!code) continue

      const ok = await scrapeCode(page, code, i)
      if (ok) success++
      else failed++

      await page.waitForTimeout(2000)
    }

    // Additional sources
    const elPeruanoCount = await scrapeElPeruano(page)
    const congresoCount = await scrapeCongreso(page)

    // Summary
    console.log(`\n${'='.repeat(50)}`)
    console.log('📊 Summary')
    console.log('='.repeat(50))
    console.log(`   ✅ Codes scraped: ${success}`)
    console.log(`   ❌ Codes failed: ${failed}`)
    console.log(`   📰 El Peruano items: ${elPeruanoCount}`)
    console.log(`   🏛️ Congreso items: ${congresoCount}`)
  } catch (error) {
    console.error('Fatal error:', error)
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
