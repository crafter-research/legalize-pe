import { describe, expect, it } from 'vitest'
import { parseHtmlToMarkdown } from './html-to-markdown'
import type { LawMetadata } from './types'

const defaultMetadata: LawMetadata = {
  titulo: 'Ley de Prueba',
  identificador: 'ley-test',
  pais: 'pe',
  jurisdiccion: 'pe',
  rango: 'ley',
  fechaPublicacion: '2024-01-01',
  estado: 'vigente',
  fuente: 'https://example.com',
  diarioOficial: 'El Peruano',
}

describe('parseHtmlToMarkdown', () => {
  describe('basic structure', () => {
    it('returns frontmatter, content, and combined markdown', () => {
      const html = '<p>Test content</p>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result).toHaveProperty('frontmatter')
      expect(result).toHaveProperty('content')
      expect(result).toHaveProperty('markdown')
    })

    it('includes title as h1 in content', () => {
      const html = '<p>Test content</p>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('# Ley de Prueba')
    })

    it('combines frontmatter and content into markdown', () => {
      const html = '<p>Test content</p>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.markdown).toContain('---')
      expect(result.markdown).toContain('titulo: Ley de Prueba')
      expect(result.markdown).toContain('# Ley de Prueba')
      expect(result.markdown).toContain('Test content')
    })
  })

  describe('heading conversion', () => {
    it('converts h1 to markdown heading', () => {
      const html = '<h1>Título Principal</h1>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('# Título Principal')
    })

    it('converts h2 to markdown heading', () => {
      const html = '<h2>Capítulo I</h2>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('## Capítulo I')
    })

    it('converts h3 to markdown heading', () => {
      const html = '<h3>Sección Primera</h3>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('### Sección Primera')
    })

    it('converts h4, h5, h6 to markdown headings', () => {
      const html = '<h4>Sub 4</h4><h5>Sub 5</h5><h6>Sub 6</h6>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('#### Sub 4')
      expect(result.content).toContain('##### Sub 5')
      expect(result.content).toContain('###### Sub 6')
    })
  })

  describe('paragraph conversion', () => {
    it('converts paragraphs to plain text', () => {
      const html = '<p>Este es el artículo primero.</p>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('Este es el artículo primero.')
    })

    it('handles multiple paragraphs', () => {
      const html = '<p>Párrafo uno.</p><p>Párrafo dos.</p>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('Párrafo uno.')
      expect(result.content).toContain('Párrafo dos.')
    })

    it('trims whitespace from paragraphs', () => {
      const html = '<p>   Texto con espacios   </p>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('Texto con espacios')
      expect(result.content).not.toContain('   Texto')
    })
  })

  describe('list conversion', () => {
    it('converts unordered lists to markdown', () => {
      const html =
        '<ul><li>Item uno</li><li>Item dos</li><li>Item tres</li></ul>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('- Item uno')
      expect(result.content).toContain('- Item dos')
      expect(result.content).toContain('- Item tres')
    })

    it('converts ordered lists to markdown', () => {
      const html = '<ol><li>Primero</li><li>Segundo</li><li>Tercero</li></ol>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('1. Primero')
      expect(result.content).toContain('2. Segundo')
      expect(result.content).toContain('3. Tercero')
    })
  })

  describe('table conversion', () => {
    it('converts simple table to markdown', () => {
      const html = `
        <table>
          <tr><th>Columna 1</th><th>Columna 2</th></tr>
          <tr><td>Valor A</td><td>Valor B</td></tr>
        </table>
      `
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('| Columna 1 | Columna 2 |')
      expect(result.content).toContain('| --- | --- |')
      expect(result.content).toContain('| Valor A | Valor B |')
    })

    it('handles tables with varying column counts', () => {
      const html = `
        <table>
          <tr><td>A</td><td>B</td><td>C</td></tr>
          <tr><td>1</td><td>2</td></tr>
        </table>
      `
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      // Should normalize columns
      expect(result.content).toContain('|')
    })

    it('handles empty tables', () => {
      const html = '<table></table>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      // Should not crash on empty table
      expect(result.content).toBeDefined()
    })
  })

  describe('nested structure conversion', () => {
    it('processes nested divs', () => {
      const html = '<div><div><p>Contenido anidado</p></div></div>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('Contenido anidado')
    })

    it('processes sections and articles', () => {
      const html = '<section><article><p>En una sección</p></article></section>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('En una sección')
    })
  })

  describe('cleanup', () => {
    it('removes script tags', () => {
      const html = '<p>Visible</p><script>alert("hidden")</script>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('Visible')
      expect(result.content).not.toContain('alert')
      expect(result.content).not.toContain('script')
    })

    it('removes style tags', () => {
      const html = '<p>Visible</p><style>.hidden { display: none; }</style>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('Visible')
      expect(result.content).not.toContain('display')
      expect(result.content).not.toContain('.hidden')
    })

    it('removes navigation elements', () => {
      const html = '<nav>Menu</nav><p>Content</p><footer>Footer</footer>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('Content')
      expect(result.content).not.toContain('Menu')
      expect(result.content).not.toContain('Footer')
    })

    it('removes excessive newlines', () => {
      const html = '<p>One</p><p></p><p></p><p></p><p>Two</p>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      // Should not have more than 2 consecutive newlines
      expect(result.content).not.toMatch(/\n{3,}/)
    })

    it('ensures final newline', () => {
      const html = '<p>Content</p>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content.endsWith('\n')).toBe(true)
    })
  })

  describe('real-world examples', () => {
    it('handles typical law article structure', () => {
      const html = `
        <h2>TÍTULO PRELIMINAR</h2>
        <p><strong>Artículo I.-</strong> La ley se deroga sólo por otra ley.</p>
        <p><strong>Artículo II.-</strong> La ley no ampara el abuso del derecho.</p>
      `
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('## TÍTULO PRELIMINAR')
      expect(result.content).toContain(
        'Artículo I.- La ley se deroga sólo por otra ley.',
      )
      expect(result.content).toContain(
        'Artículo II.- La ley no ampara el abuso del derecho.',
      )
    })

    it('handles constitution-style structure', () => {
      const html = `
        <h1>CONSTITUCIÓN POLÍTICA DEL PERÚ</h1>
        <h2>TÍTULO I - DE LA PERSONA Y DE LA SOCIEDAD</h2>
        <h3>CAPÍTULO I - DERECHOS FUNDAMENTALES</h3>
        <p>Artículo 1.- La defensa de la persona humana y el respeto de su dignidad son el fin supremo de la sociedad y del Estado.</p>
      `
      const metadata: LawMetadata = {
        ...defaultMetadata,
        titulo: 'Constitución Política del Perú',
        identificador: 'constitucion-1993',
        rango: 'constitucion',
      }
      const result = parseHtmlToMarkdown(html, metadata)

      expect(result.content).toContain('# Constitución Política del Perú')
      expect(result.content).toContain('# CONSTITUCIÓN POLÍTICA DEL PERÚ')
      expect(result.content).toContain(
        '## TÍTULO I - DE LA PERSONA Y DE LA SOCIEDAD',
      )
      expect(result.content).toContain(
        '### CAPÍTULO I - DERECHOS FUNDAMENTALES',
      )
      expect(result.content).toContain(
        'Artículo 1.- La defensa de la persona humana',
      )
    })

    it('handles code structure with numbered articles', () => {
      const html = `
        <h2>LIBRO I - DERECHO DE LAS PERSONAS</h2>
        <h3>SECCIÓN PRIMERA - PERSONAS NATURALES</h3>
        <h4>TÍTULO I - PRINCIPIO DE LA PERSONA</h4>
        <p>Artículo 1.- La persona humana es sujeto de derecho desde su nacimiento.</p>
        <p>Artículo 2.- La mujer puede solicitar judicialmente el reconocimiento de su embarazo.</p>
      `
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('## LIBRO I - DERECHO DE LAS PERSONAS')
      expect(result.content).toContain(
        '### SECCIÓN PRIMERA - PERSONAS NATURALES',
      )
      expect(result.content).toContain(
        '#### TÍTULO I - PRINCIPIO DE LA PERSONA',
      )
      expect(result.content).toContain('Artículo 1.-')
      expect(result.content).toContain('Artículo 2.-')
    })
  })

  describe('edge cases', () => {
    it('handles empty HTML', () => {
      const html = ''
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.frontmatter).toContain('---')
      expect(result.content).toContain('# Ley de Prueba')
    })

    it('handles HTML with only whitespace', () => {
      const html = '   \n\t  '
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.markdown).toBeDefined()
    })

    it('handles special characters in content', () => {
      const html =
        '<p>El artículo 1° establece que "el Estado" & las instituciones...</p>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('El artículo 1°')
      expect(result.content).toContain('"el Estado"')
      expect(result.content).toContain('&')
    })

    it('handles HTML entities', () => {
      const html = '<p>&quot;Texto&quot; &amp; m&aacute;s</p>'
      const result = parseHtmlToMarkdown(html, defaultMetadata)

      expect(result.content).toContain('"Texto"')
      expect(result.content).toContain('&')
      expect(result.content).toContain('más')
    })
  })
})
