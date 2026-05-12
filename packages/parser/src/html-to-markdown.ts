import * as cheerio from 'cheerio'
import type { AnyNode, Element } from 'domhandler'
import { generateFrontmatter } from './frontmatter'
import type { LawMetadata, ParseOptions, ParseResult } from './types'

/**
 * Converts HTML content from SPIJ to structured Markdown
 */
export function parseHtmlToMarkdown(
  html: string,
  metadata: LawMetadata,
  options: ParseOptions = {},
): ParseResult {
  const $ = cheerio.load(html)

  // Remove scripts, styles, and navigation elements
  $('script, style, nav, header, footer, .navigation').remove()

  // Convert HTML structure to Markdown
  let content = ''

  // Add title
  content += `# ${metadata.titulo}\n\n`

  // Process the main content
  const mainContent = $('body').html() || ''
  content += convertToMarkdown(mainContent)

  // Generate frontmatter
  const frontmatter = generateFrontmatter(metadata)

  // Combine into final markdown
  const markdown = `${frontmatter}\n\n${content}`

  return {
    frontmatter,
    content,
    markdown,
  }
}

/**
 * Converts HTML content to Markdown format
 */
function convertToMarkdown(html: string): string {
  const $ = cheerio.load(html)

  let markdown = ''

  // Process each element
  $('body')
    .children()
    .each((_, element) => {
      markdown += processElement($, element)
    })

  return cleanMarkdown(markdown)
}

function processElement($: cheerio.CheerioAPI, element: Element): string {
  const $el = $(element)
  const tagName = element.tagName?.toLowerCase()

  switch (tagName) {
    case 'h1':
      return `# ${$el.text().trim()}\n\n`
    case 'h2':
      return `## ${$el.text().trim()}\n\n`
    case 'h3':
      return `### ${$el.text().trim()}\n\n`
    case 'h4':
      return `#### ${$el.text().trim()}\n\n`
    case 'h5':
      return `##### ${$el.text().trim()}\n\n`
    case 'h6':
      return `###### ${$el.text().trim()}\n\n`
    case 'p':
      return `${$el.text().trim()}\n\n`
    case 'ul':
      return `${$el
        .find('li')
        .map((_, li) => `- ${$(li).text().trim()}`)
        .get()
        .join('\n')}\n\n`
    case 'ol':
      return `${$el
        .find('li')
        .map((i, li) => `${i + 1}. ${$(li).text().trim()}`)
        .get()
        .join('\n')}\n\n`
    case 'table':
      return `${convertTable($, $el)}\n\n`
    case 'div':
    case 'section':
    case 'article': {
      let content = ''
      $el.children().each((_, child) => {
        content += processElement($, child)
      })
      return content
    }
    default: {
      const text = $el.text().trim()
      return text ? `${text}\n\n` : ''
    }
  }
}

function convertTable(
  $: cheerio.CheerioAPI,
  $table: cheerio.Cheerio<Element>,
): string {
  const rows: string[][] = []

  $table.find('tr').each((_, tr) => {
    const cells: string[] = []
    $(tr)
      .find('td, th')
      .each((_, cell) => {
        cells.push($(cell).text().trim())
      })
    if (cells.length > 0) {
      rows.push(cells)
    }
  })

  if (rows.length === 0) return ''

  const maxCols = Math.max(...rows.map((r) => r.length))
  const normalizedRows = rows.map((r) => {
    while (r.length < maxCols) r.push('')
    return r
  })

  let markdown = ''

  // Header row
  markdown += `| ${normalizedRows[0]?.join(' | ') ?? ''} |\n`
  markdown += `| ${Array(maxCols).fill('---').join(' | ')} |\n`

  // Data rows
  for (let i = 1; i < normalizedRows.length; i++) {
    markdown += `| ${normalizedRows[i]?.join(' | ') ?? ''} |\n`
  }

  return markdown
}

function cleanMarkdown(markdown: string): string {
  let cleaned = markdown

  // Remove OCR artifacts
  const ocrPatterns = [
    /Ver jurisprudencia aquí\.?/gi,
    /Ver jurisprudencia aqu[ií]\.?/gi,
    /Inicio \*\* Legislación/gi,
    /Inicio\s*\*+\s*Legislaci[oó]n/gi,
    /Firmado por:.*?(?=\n|$)/gi,
    /NORMAS LEGALES\s*/g,
    /El Peruano\s*\/?\s*\w+\s+\d+\s+de\s+\w+\s+de\s+\d+/gi,
    /^P[aá]gina\s+\d+\s*$/gim,
    /^\d+\s+NORMAS LEGALES\s*$/gim,
    /\[Ver enlace\]/gi,
    /\[link\]/gi,
    /^-{3,}\s*$/gm,
  ]

  for (const pattern of ocrPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  return cleaned
    .replace(/\n{4,}/g, '\n\n\n') // Max 2 blank lines
    .replace(/[ \t]+$/gm, '') // Trailing whitespace
    .replace(/^\s+$/gm, '') // Lines with only whitespace
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .replace(/^\s+|\s+$/g, '') // Trim
    .concat('\n') // Ensure final newline
}
