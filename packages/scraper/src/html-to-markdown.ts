/**
 * Convert SPIJ HTML to clean Markdown
 */

import * as cheerio from 'cheerio'
import type { AnyNode, Element } from 'domhandler'

export interface LawMetadata {
  titulo: string
  identificador: string
  pais: 'pe'
  jurisdiccion: string
  rango: string
  sector?: string
  fechaPublicacion: string
  fechaVigencia?: string
  ultimaActualizacion?: string
  estado: 'vigente' | 'derogado' | 'modificado' | 'pendiente-revision'
  fuente: string
  diarioOficial: 'El Peruano'
}

/**
 * Extract a clean title from SPIJ HTML
 */
export function extractTitle(sumilla: string, codigoNorma: string): string {
  const $ = cheerio.load(sumilla)
  const text = $.text().trim()
  return text || `Norma ${codigoNorma}`
}

/**
 * Determine the law type (rango) from SPIJ data
 */
export function determineRango(
  dispositivoLegal: string,
  codigoNorma: string,
): string {
  const dispositivo = dispositivoLegal.toLowerCase()
  const codigo = codigoNorma.toLowerCase()

  if (dispositivo.includes('constituci')) return 'constitucion'
  if (dispositivo.includes('decreto legislativo')) return 'decreto-legislativo'
  if (dispositivo.includes('decreto de urgencia')) return 'decreto-de-urgencia'
  if (dispositivo.includes('decreto supremo')) return 'decreto-supremo'
  if (dispositivo.includes('resoluci') && dispositivo.includes('ministerial'))
    return 'resolucion-ministerial'
  if (dispositivo.includes('resoluci') && dispositivo.includes('suprema'))
    return 'resolucion-suprema'
  if (dispositivo.includes('ley')) return 'ley'
  if (codigo.includes('ordenanza')) return 'ordenanza'

  return 'ley'
}

/**
 * Generate filename from identifier
 */
export function generateFilename(identificador: string): string {
  return `${identificador}.md`
}

/**
 * Convert SPIJ HTML content to Markdown
 */
export function convertHtmlToMarkdown(html: string): string {
  const $ = cheerio.load(html)

  // Remove unnecessary elements
  $('script, style, meta, link').remove()

  // Process the content
  let markdown = ''

  function processNode(node: AnyNode): string {
    const $node = $(node)

    // Handle text nodes
    if (node.type === 'text') {
      return $(node).text()
    }

    const tagName = 'tagName' in node ? node.tagName?.toLowerCase() || '' : ''

    // Handle different HTML elements
    switch (tagName) {
      case 'h1':
        return `# ${$node.text().trim()}\n\n`
      case 'h2':
        return `## ${$node.text().trim()}\n\n`
      case 'h3':
        return `### ${$node.text().trim()}\n\n`
      case 'h4':
        return `#### ${$node.text().trim()}\n\n`
      case 'h5':
        return `##### ${$node.text().trim()}\n\n`
      case 'h6':
        return `###### ${$node.text().trim()}\n\n`
      case 'p': {
        const text = processChildren($node)
        if (!text.trim()) return ''
        return `${text.trim()}\n\n`
      }
      case 'br':
        return '\n'
      case 'strong':
      case 'b':
        return `**${processChildren($node)}**`
      case 'em':
      case 'i':
        return `*${processChildren($node)}*`
      case 'a': {
        const href = $node.attr('href')
        const text = processChildren($node)
        if (href && !href.startsWith('#')) {
          return `[${text}](${href})`
        }
        return text
      }
      case 'ul':
        return (
          $node
            .find('> li')
            .map((_, li) => `- ${processChildren($(li)).trim()}`)
            .get()
            .join('\n') + '\n\n'
        )
      case 'ol':
        return (
          $node
            .find('> li')
            .map((i, li) => `${i + 1}. ${processChildren($(li)).trim()}`)
            .get()
            .join('\n') + '\n\n'
        )
      case 'table':
        return convertTable($, $node) + '\n\n'
      case 'span':
      case 'font':
      case 'div':
        return processChildren($node)
      default:
        return processChildren($node)
    }
  }

  function processChildren(
    $parent: cheerio.Cheerio<AnyNode>,
  ): string {
    let result = ''
    $parent.contents().each((_, child) => {
      if (child.type === 'text') {
        result += $(child).text()
      } else if (child.type === 'tag') {
        result += processNode(child)
      }
    })
    return result
  }

  // Process all children of body
  $('body')
    .contents()
    .each((_, child) => {
      if (child.type === 'tag') {
        markdown += processNode(child)
      } else if (child.type === 'text') {
        const text = $(child).text().trim()
        if (text) {
          markdown += `${text}\n\n`
        }
      }
    })

  // Clean up markdown
  return cleanMarkdown(markdown)
}

function convertTable(
  $: cheerio.CheerioAPI,
  $table: cheerio.Cheerio<AnyNode>,
): string {
  const rows: string[][] = []

  $table.find('tr').each((_, tr) => {
    const cells: string[] = []
    $(tr)
      .find('td, th')
      .each((_, cell) => {
        cells.push($(cell).text().trim().replace(/\|/g, '\\|'))
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
  const firstRow = normalizedRows[0]
  if (firstRow) {
    markdown += `| ${firstRow.join(' | ')} |\n`
    markdown += `| ${Array(maxCols).fill('---').join(' | ')} |\n`
  }

  // Data rows
  for (let i = 1; i < normalizedRows.length; i++) {
    const row = normalizedRows[i]
    if (row) {
      markdown += `| ${row.join(' | ')} |\n`
    }
  }

  return markdown
}

function cleanMarkdown(markdown: string): string {
  return (
    markdown
      // Remove excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim()
      // Ensure single trailing newline
      .concat('\n')
  )
}

/**
 * Generate YAML frontmatter from metadata
 */
export function generateFrontmatter(metadata: LawMetadata): string {
  const lines = ['---']

  lines.push(`titulo: "${metadata.titulo.replace(/"/g, '\\"')}"`)
  lines.push(`identificador: "${metadata.identificador}"`)
  lines.push(`pais: "${metadata.pais}"`)
  lines.push(`jurisdiccion: "${metadata.jurisdiccion}"`)
  lines.push(`rango: "${metadata.rango}"`)
  if (metadata.sector) {
    lines.push(`sector: "${metadata.sector}"`)
  }
  lines.push(`fechaPublicacion: "${metadata.fechaPublicacion}"`)
  if (metadata.fechaVigencia) {
    lines.push(`fechaVigencia: "${metadata.fechaVigencia}"`)
  }
  if (metadata.ultimaActualizacion) {
    lines.push(`ultimaActualizacion: "${metadata.ultimaActualizacion}"`)
  }
  lines.push(`estado: "${metadata.estado}"`)
  lines.push(`fuente: "${metadata.fuente}"`)
  lines.push(`diarioOficial: "${metadata.diarioOficial}"`)

  lines.push('---')

  return lines.join('\n')
}
