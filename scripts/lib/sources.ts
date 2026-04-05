/**
 * Law source fetchers with priority fallback
 */

import { PDFParse } from 'pdf-parse'

export interface FetchResult {
  content: string
  source: string
  pages?: number
  garbled: number
}

export interface LawSource {
  name: string
  priority: number
  fetch: (id: string, url?: string) => Promise<FetchResult | null>
}

// Helper: HTML to Markdown
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<div[^>]*class="[^"]*(?:sharedaddy|jp-relatedposts|ad-|social)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?[uo]l[^>]*>/gi, '\n')
    .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .trim()
}

// Helper: Format PDF text
function formatPdfText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/Art[íi]culo\s+(\d+)/gi, '\n\n## Artículo $1')
    .replace(/CAPÍTULO\s+([IVX]+)/gi, '\n\n# CAPÍTULO $1')
    .replace(/TÍTULO\s+([IVX]+)/gi, '\n\n# TÍTULO $1')
    .replace(/SECCIÓN\s+([IVX]+)/gi, '\n\n# SECCIÓN $1')
    .replace(/LIBRO\s+([IVX]+)/gi, '\n\n# LIBRO $1')
    .trim()
}

// Helper: Count garbled characters
function countGarbled(text: string): number {
  return (text.match(/�/g) || []).length
}

// Source 1: LP Derecho (web scraping)
export const lpDerechoSource: LawSource = {
  name: 'LP Derecho',
  priority: 1,
  async fetch(id: string, url?: string): Promise<FetchResult | null> {
    if (!url?.includes('lpderecho.pe')) return null

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      })

      if (!response.ok) return null

      const html = await response.text()
      const contentMatch =
        html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:footer|div[^>]*class="[^"]*post-tags)/i) ||
        html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)

      if (!contentMatch) return null

      const content = htmlToMarkdown(contentMatch[1])
      if (content.length < 1000) return null

      return {
        content,
        source: url,
        garbled: countGarbled(content),
      }
    } catch {
      return null
    }
  },
}

// Source 2: Congress PDF
export const congressPdfSource: LawSource = {
  name: 'Congreso PDF',
  priority: 2,
  async fetch(id: string, url?: string): Promise<FetchResult | null> {
    // Build URL from identifier if not provided
    const pdfUrl = url || buildCongressUrl(id)
    if (!pdfUrl) return null

    try {
      const response = await fetch(pdfUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      })

      if (!response.ok) return null

      const buffer = Buffer.from(await response.arrayBuffer())
      const parser = new PDFParse({ data: buffer })
      await parser.load()
      const textResult = await parser.getText()
      const text = textResult.pages.map((p: { text: string }) => p.text).join('\n\n')
      const pages = textResult.pages.length
      await parser.destroy()

      const content = formatPdfText(text)
      const garbled = countGarbled(content)

      // Reject if too many garbled characters (>5% of content)
      if (garbled > content.length * 0.05) return null

      return {
        content,
        source: pdfUrl,
        pages,
        garbled,
      }
    } catch {
      return null
    }
  },
}

// Source 3: Generic PDF URL
export const genericPdfSource: LawSource = {
  name: 'Generic PDF',
  priority: 3,
  async fetch(id: string, url?: string): Promise<FetchResult | null> {
    // Accept any PDF URL or URLs with MOD=AJPERES (PJ pattern)
    if (!url) return null
    if (!url.endsWith('.pdf') && !url.includes('MOD=AJPERES')) return null

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      })

      if (!response.ok) return null

      const buffer = Buffer.from(await response.arrayBuffer())

      // Skip PDFs larger than 5MB (likely scanned images)
      if (buffer.length > 5 * 1024 * 1024) return null

      const parser = new PDFParse({ data: buffer })
      await parser.load()
      const textResult = await parser.getText()
      const text = textResult.pages.map((p: { text: string }) => p.text).join('\n\n')
      const pages = textResult.pages.length
      await parser.destroy()

      // Skip if text extraction yields too little (scanned PDF)
      if (text.length < 1000) return null

      const content = formatPdfText(text)
      const garbled = countGarbled(content)

      if (garbled > content.length * 0.05) return null

      return {
        content,
        source: url,
        pages,
        garbled,
      }
    } catch {
      return null
    }
  },
}

// Build Congress/El Peruano URL from identifier
function buildCongressUrl(id: string): string | null {
  // Extract law number from identifier
  const match = id.match(/ley-(\d+)/)
  if (match) {
    return `https://www.leyes.congreso.gob.pe/Documentos/Leyes/${match[1]}.pdf`
  }

  const dlegMatch = id.match(/dleg-(\d+)/)
  if (dlegMatch) {
    return `https://www.leyes.congreso.gob.pe/Documentos/DecretosLegislativos/${dlegMatch[1]}.pdf`
  }

  // Decreto de Urgencia - try El Peruano format
  const duMatch = id.match(/du-(\d+)-(\d+)/)
  if (duMatch) {
    return `https://busquedas.elperuano.pe/download/url/decreto-de-urgencia-${duMatch[1]}-${duMatch[2]}`
  }

  // Decreto Ley
  const dlMatch = id.match(/dl-(\d+)/)
  if (dlMatch) {
    return `https://www.leyes.congreso.gob.pe/Documentos/DecretosLeyes/${dlMatch[1]}.pdf`
  }

  // Decreto Supremo - try SPIJ pattern
  const dsMatch = id.match(/ds-(\d+)-(\d+)-(\w+)/)
  if (dsMatch) {
    return null // DS URLs are complex, rely on catalog URLs
  }

  return null
}


// All sources in priority order
export const allSources: LawSource[] = [
  lpDerechoSource,
  congressPdfSource,
  genericPdfSource,
].sort((a, b) => a.priority - b.priority)
