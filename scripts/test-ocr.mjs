import { execSync } from 'node:child_process'
import { exec } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const POPPLER_BIN =
  'C:\\Users\\Shiara\\AppData\\Local\\Microsoft\\WinGet\\Packages\\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\\poppler-25.07.0\\Library\\bin'
const TESSERACT = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'
const TESSDATA = 'C:\\Users\\Shiara\\.tessdata'
const OCR_ENV = { ...process.env, TESSDATA_PREFIX: TESSDATA }

const pdfPath = 'D:\\projects\\legalize-pe\\tmp\\test29625.pdf'
const pagesPrefix = 'D:\\projects\\legalize-pe\\tmp\\test-pages\\p'

// Step 1: Convert PDF to images
console.log('Converting PDF to images...')
try {
  const cmd = `"${POPPLER_BIN}\\pdftoppm.exe" -png -r 200 "${pdfPath}" "${pagesPrefix}"`
  console.log('Running:', cmd)
  execSync(cmd, { stdio: 'pipe', timeout: 60000 })
  console.log('Done converting')
} catch (e) {
  console.error('pdftoppm error:', e.message)
  process.exit(1)
}

// Step 2: List pages
const pagesDir = 'D:\\projects\\legalize-pe\\tmp\\test-pages'
if (!existsSync(pagesDir)) {
  console.log('No pages dir')
  process.exit(1)
}
const pages = readdirSync(pagesDir)
  .filter((f) => f.endsWith('.png'))
  .sort()
console.log(`Found ${pages.length} pages`)

// Step 3: OCR first page
if (pages.length > 0) {
  const imgPath = `${pagesDir}\\${pages[0]}`
  console.log(`OCR on ${imgPath}...`)
  try {
    const { stdout } = await execAsync(
      `"${TESSERACT}" "${imgPath}" stdout -l spa --psm 1`,
      { timeout: 60000, maxBuffer: 5 * 1024 * 1024, env: OCR_ENV },
    )
    console.log('OCR result (first 300 chars):', stdout.slice(0, 300))
  } catch (e) {
    console.error('Tesseract error:', e.message)
  }
}
