/**
 * Comprehensive SPIJ Scraper
 *
 * Scrapes all Peruvian legal codes and legislation from SPIJ using agent-browser
 * with OCR fallback via Tesseract for non-scrapeable content.
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  type LawMetadata,
  convertHtmlToMarkdown,
  determineRango,
  extractTitle,
  generateFrontmatter,
} from './html-to-markdown'
import { fetchLaw, getSpijToken } from './spij-api'

// ============================================================================
// CONFIGURATION
// ============================================================================

const OUTPUT_DIR = join(process.cwd(), '../../leyes/pe')
const TEMP_DIR = join(process.cwd(), 'temp')
const SCREENSHOTS_DIR = join(TEMP_DIR, 'screenshots')

// All SPIJ IDs for major Peruvian legal codes
const SPIJ_CODES: Record<string, { id: string; name: string; rango: string }> =
  {
    // Constitución
    constitucion: {
      id: 'H679920',
      name: 'Constitución Política del Perú 1993',
      rango: 'constitucion',
    },

    // Reglamento del Congreso
    'reglamento-congreso': {
      id: 'H680012',
      name: 'Reglamento del Congreso de la República',
      rango: 'reglamento',
    },

    // Código Procesal Constitucional
    'codigo-procesal-constitucional': {
      id: 'H1270680',
      name: 'Nuevo Código Procesal Constitucional',
      rango: 'ley',
    },

    // Código Civil
    'codigo-civil': {
      id: 'H682684',
      name: 'Código Civil - Decreto Legislativo 295',
      rango: 'decreto-legislativo',
    },

    // Código Procesal Civil
    'codigo-procesal-civil': {
      id: 'H684704',
      name: 'TUO Código Procesal Civil',
      rango: 'decreto-legislativo',
    },

    // Código Penal
    'codigo-penal': {
      id: 'H683648',
      name: 'Código Penal - Decreto Legislativo 635',
      rango: 'decreto-legislativo',
    },

    // Código Procesal Penal (antiguo)
    'codigo-procedimientos-penales': {
      id: 'H680396',
      name: 'Código de Procedimientos Penales - Ley 9024',
      rango: 'ley',
    },

    // Nuevo Código Procesal Penal
    'nuevo-codigo-procesal-penal': {
      id: 'H697295',
      name: 'Nuevo Código Procesal Penal - Decreto Legislativo 957',
      rango: 'decreto-legislativo',
    },

    // Código de Ejecución Penal
    'codigo-ejecucion-penal': {
      id: 'H684464',
      name: 'Código de Ejecución Penal - Decreto Legislativo 654',
      rango: 'decreto-legislativo',
    },

    // Código Penal Militar Policial
    'codigo-penal-militar-policial': {
      id: 'H697323',
      name: 'Código Penal Militar Policial - Decreto Legislativo 1094',
      rango: 'decreto-legislativo',
    },

    // Código de Justicia Militar Policial (anterior)
    'codigo-justicia-militar': {
      id: 'H689920',
      name: 'Código de Justicia Militar - Decreto Legislativo 961',
      rango: 'decreto-legislativo',
    },

    // Código de los Niños y Adolescentes
    'codigo-ninos-adolescentes': {
      id: 'H689228',
      name: 'Código de los Niños y Adolescentes - Ley 27337',
      rango: 'ley',
    },

    // Código de Responsabilidad Penal de Adolescentes
    'codigo-responsabilidad-penal-adolescentes': {
      id: 'H1221752',
      name: 'Código de Responsabilidad Penal de Adolescentes - DL 1348',
      rango: 'decreto-legislativo',
    },

    // Código de Comercio
    'codigo-comercio': {
      id: 'H679960',
      name: 'Código de Comercio',
      rango: 'ley',
    },

    // Código de Protección y Defensa del Consumidor
    'codigo-consumidor': {
      id: 'H703096',
      name: 'Código de Protección y Defensa del Consumidor - Ley 29571',
      rango: 'ley',
    },

    // Código Tributario
    'codigo-tributario': {
      id: 'H685084',
      name: 'TUO del Código Tributario',
      rango: 'decreto-supremo',
    },

    // Ley de Procedimiento Administrativo General
    'ley-procedimiento-administrativo': {
      id: 'H689068',
      name: 'Ley de Procedimiento Administrativo General - Ley 27444',
      rango: 'ley',
    },

    // Ley General del Sistema Financiero
    'ley-sistema-financiero': {
      id: 'H687512',
      name: 'Ley General del Sistema Financiero - Ley 26702',
      rango: 'ley',
    },

    // Ley de Derechos de Autor
    'ley-derechos-autor': {
      id: 'H685016',
      name: 'Ley sobre el Derecho de Autor - DL 822',
      rango: 'decreto-legislativo',
    },

    // Ley de Productividad y Competitividad Laboral
    'ley-laboral': {
      id: 'H684384',
      name: 'TUO Ley de Productividad y Competitividad Laboral',
      rango: 'decreto-supremo',
    },
  }

// ============================================================================
// UTILITIES
// ============================================================================

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function ab(...args: string[]): string {
  try {
    const result = execSync(['agent-browser', ...args].join(' '), {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 120000,
      shell: '/bin/bash',
    })
    return result
  } catch (error) {
    return ''
  }
}

function abEval(jsCode: string): string {
  try {
    // Write JS to temp file to avoid shell escaping issues
    const tempFile = join(TEMP_DIR, 'eval.js')
    writeFileSync(tempFile, jsCode)
    const result = execSync(`agent-browser eval "$(cat ${tempFile})"`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 60000,
      shell: '/bin/bash',
    })
    return result
  } catch {
    return ''
  }
}

function runOCR(imagePath: string): string {
  if (!existsSync(imagePath)) return ''
  try {
    const result = execSync(
      `tesseract "${imagePath}" stdout -l spa --psm 6 2>/dev/null`,
      {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      },
    )
    return cleanOCRText(result)
  } catch {
    return ''
  }
}

function cleanOCRText(text: string): string {
  return text
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF\n\táéíóúüñÁÉÍÓÚÜÑ¿¡°ºª]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/[^\x20-\x7E\xA0-\xFF\n\táéíóúüñÁÉÍÓÚÜÑ¿¡°ºª«»§©®™€£¥¢]/g, '')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractUpdateDate(text: string): string | null {
  const patterns = [
    /[Úú]ltima\s+actualizaci[oó]n[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
    /actualizado\s+(?:al\s+)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
    /fecha\s+de\s+actualizaci[oó]n[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
    /(\d{4})-(\d{2})-(\d{2})/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      if (pattern.source.startsWith('(\\d{4})')) {
        return `${match[1]}-${match[2]}-${match[3]}`
      }
      const day = match[1]?.padStart(2, '0')
      const month = match[2]?.padStart(2, '0')
      const year = match[3]
      return `${year}-${month}-${day}`
    }
  }
  return null
}

// ============================================================================
// SCRAPERS
// ============================================================================

async function scrapeLawFromAPI(
  code: string,
  config: { id: string; name: string; rango: string },
): Promise<boolean> {
  console.log(`\n📜 [API] ${config.name} (${config.id})...`)

  try {
    const law = await fetchLaw(config.id)

    const metadata: LawMetadata = {
      titulo: cleanText(extractTitle(law.sumilla, law.codigoNorma)),
      identificador:
        law.codigoNorma
          ?.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') || code,
      pais: 'pe',
      jurisdiccion: 'pe',
      rango:
        config.rango || determineRango(law.dispositivoLegal, law.codigoNorma),
      sector: law.sector || undefined,
      fechaPublicacion: law.fechaPublicacion || '1900-01-01',
      ultimaActualizacion: new Date().toISOString().split('T')[0],
      estado: 'vigente',
      fuente: `https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${config.id}`,
      diarioOficial: 'El Peruano',
    }

    const markdown = convertHtmlToMarkdown(law.textoCompleto)
    const content = cleanText(markdown)

    const fullContent = `${generateFrontmatter(metadata)}\n\n${content}`

    const filename = `${metadata.identificador}.md`
    const filepath = join(OUTPUT_DIR, filename)

    writeFileSync(filepath, fullContent, 'utf-8')
    console.log(`   ✅ ${filename} (${(content.length / 1024).toFixed(1)} KB)`)

    return true
  } catch (error) {
    console.log(`   ⚠️ API failed: ${(error as Error).message}`)
    return false
  }
}

async function scrapeLawFromBrowser(
  code: string,
  config: { id: string; name: string; rango: string },
): Promise<boolean> {
  console.log(`\n🌐 [Browser] ${config.name}...`)

  const url = `https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${config.id}`

  try {
    // Open page and wait
    ab('open', url)
    ab('wait', '--load', 'networkidle')
    ab('wait', '5000')

    // Write extraction script
    const extractScript = `
      (function() {
        const content = document.querySelector('.mat-sidenav-content');
        if (content) return content.innerText;
        const main = document.querySelector('main, article, .content, #content');
        if (main) return main.innerText;
        return document.body.innerText;
      })()
    `
    const textContent = abEval(extractScript)

    if (textContent && textContent.length > 500) {
      return await saveLawContent(code, config, textContent, false)
    }

    // Fallback: take screenshot and OCR
    console.log('   📷 Taking screenshot for OCR...')
    const screenshotPath = join(SCREENSHOTS_DIR, `${code}.png`)
    ab('screenshot', '--full', screenshotPath)

    if (existsSync(screenshotPath)) {
      const ocrText = runOCR(screenshotPath)
      if (ocrText && ocrText.length > 500) {
        return await saveLawContent(code, config, ocrText, true)
      }
    }

    console.log('   ❌ Could not extract content')
    return false
  } catch (error) {
    console.log(`   ❌ Browser failed: ${(error as Error).message}`)
    return false
  }
}

async function saveLawContent(
  code: string,
  config: { id: string; name: string; rango: string },
  content: string,
  fromOCR: boolean,
): Promise<boolean> {
  const cleanedContent = cleanText(content)
  const updateDate = extractUpdateDate(cleanedContent)

  const metadata: LawMetadata = {
    titulo: config.name,
    identificador: code,
    pais: 'pe',
    jurisdiccion: 'pe',
    rango: config.rango,
    fechaPublicacion: '1900-01-01',
    ultimaActualizacion: updateDate || new Date().toISOString().split('T')[0],
    estado: 'vigente',
    fuente: `https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/${config.id}`,
    diarioOficial: 'El Peruano',
  }

  const fullContent = `${generateFrontmatter(metadata)}\n\n${cleanedContent}${fromOCR ? '\n\n<!-- Contenido extraído via OCR -->' : ''}`

  const filename = `${code}.md`
  const filepath = join(OUTPUT_DIR, filename)

  writeFileSync(filepath, fullContent, 'utf-8')
  console.log(
    `   ✅ ${filename} (${(cleanedContent.length / 1024).toFixed(1)} KB)${fromOCR ? ' [OCR]' : ''}`,
  )

  return true
}

async function scrapeElPeruano(): Promise<number> {
  console.log('\n📰 Scraping El Peruano...')
  let count = 0

  try {
    ab('open', 'https://diariooficial.elperuano.pe/normas')
    ab('wait', '--load', 'networkidle')
    ab('wait', '3000')

    // Get normas list
    const extractNormas = `
      (function() {
        const articles = document.querySelectorAll('article');
        return JSON.stringify(Array.from(articles).slice(0, 50).map(a => ({
          title: a.querySelector('h2, h3, .title')?.innerText || '',
          link: a.querySelector('a')?.href || '',
          date: a.querySelector('.date, time')?.innerText || ''
        })));
      })()
    `
    const normasJson = abEval(extractNormas)

    if (normasJson) {
      try {
        const normas = JSON.parse(normasJson)
        console.log(`   Found ${normas.length} normas`)
        count = normas.length
      } catch {
        console.log('   ⚠️ Could not parse normas')
      }
    }
  } catch (error) {
    console.log(`   ❌ El Peruano failed: ${(error as Error).message}`)
  }

  return count
}

async function scrapeCongreso(): Promise<number> {
  console.log('\n🏛️ Scraping Congreso...')
  let count = 0

  const urls = [
    'https://www.leyes.congreso.gob.pe/',
    'https://www.gob.pe/institucion/congreso-de-la-republica/normas-legales',
  ]

  for (const url of urls) {
    try {
      console.log(`   ${url}`)
      ab('open', url)
      ab('wait', '--load', 'networkidle')
      ab('wait', '3000')

      const extractLinks = `
        (function() {
          const links = document.querySelectorAll('a[href*="ley"], a[href*="norma"]');
          return links.length;
        })()
      `
      const linkCount = abEval(extractLinks)
      console.log(`   Found ${linkCount} links`)
      count += Number.parseInt(linkCount) || 0
    } catch (error) {
      console.log(`   ❌ Failed: ${(error as Error).message}`)
    }
  }

  return count
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 Starting comprehensive SPIJ scraper')
  console.log(`   Output: ${OUTPUT_DIR}`)
  console.log(`   Codes to scrape: ${Object.keys(SPIJ_CODES).length}`)

  ensureDir(OUTPUT_DIR)
  ensureDir(TEMP_DIR)
  ensureDir(SCREENSHOTS_DIR)

  // Get token
  console.log('\n🔐 Getting SPIJ token...')
  try {
    await getSpijToken()
    console.log('   ✅ Token acquired')
  } catch {
    console.log('   ⚠️ Token failed, will use browser')
  }

  // Scrape codes
  console.log('\n📚 Scraping legal codes...')

  let success = 0
  let failed = 0

  for (const [code, config] of Object.entries(SPIJ_CODES)) {
    let ok = await scrapeLawFromAPI(code, config)

    if (!ok) {
      ok = await scrapeLawFromBrowser(code, config)
    }

    if (ok) success++
    else failed++

    await new Promise((r) => setTimeout(r, 2000))
  }

  // Additional sources
  const elPeruanoCount = await scrapeElPeruano()
  const congresoCount = await scrapeCongreso()

  // Cleanup
  ab('close', '--all')

  // Summary
  console.log(`\n${'='.repeat(50)}`)
  console.log('📊 Summary')
  console.log('='.repeat(50))
  console.log(`   ✅ Codes scraped: ${success}`)
  console.log(`   ❌ Codes failed: ${failed}`)
  console.log(`   📰 El Peruano items: ${elPeruanoCount}`)
  console.log(`   🏛️ Congreso items: ${congresoCount}`)
}

main().catch(console.error)
