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

export interface ParseOptions {
  /** Preserve original HTML structure as much as possible */
  preserveStructure?: boolean
  /** Include raw HTML as comment */
  includeRawHtml?: boolean
}

export interface ParseResult {
  frontmatter: string
  content: string
  markdown: string
}
