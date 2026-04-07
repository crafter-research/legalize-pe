/**
 * Types for the law catalog and fetching system
 */

export interface NormaCatalogEntry {
  identificador: string
  titulo: string
  rango:
    | 'constitucion'
    | 'ley'
    | 'decreto-legislativo'
    | 'decreto-ley'
    | 'decreto-supremo'
    | 'decreto-urgencia'
    | 'resolucion'
    | 'otro'
  fechaPublicacion: string
  estado: 'pendiente' | 'descargado' | 'verificado' | 'error'
  fuentes: string[]
  materias: string[]
  sumilla?: string
  notas?: string
}

export interface NormaCatalog {
  version: string
  actualizacion: string
  normas: NormaCatalogEntry[]
}

export interface Frontmatter {
  titulo: string
  identificador: string
  pais: string
  jurisdiccion: string
  rango: string
  sector?: string
  fechaPublicacion: string
  fechaPromulgacion?: string
  fechaVigencia?: string
  ultimaActualizacion?: string
  estado: string
  fuente?: string
  fuenteAlternativa?: string
  diarioOficial?: string
  sumilla?: string
  materias?: string[]
  spijId?: string
  disclaimer?: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    chars: number
    lines: number
    articles: number
    garbled: number
  }
}
