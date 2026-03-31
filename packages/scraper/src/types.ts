export interface ScraperConfig {
  /** Base URL for SPIJ */
  baseUrl: string
  /** Output directory for markdown files */
  outputDir: string
  /** Enable verbose logging */
  verbose?: boolean
  /** Maximum retries for failed requests */
  maxRetries?: number
  /** Delay between requests in ms */
  requestDelay?: number
}

export interface LawMetadata {
  /** Law title */
  titulo: string
  /** Unique identifier (e.g., "ley-26702") */
  identificador: string
  /** Country code */
  pais: 'pe'
  /** Jurisdiction (e.g., "pe", "pe-lima", "pe-cusco") */
  jurisdiccion: string
  /** Law type (e.g., "ley", "decreto-legislativo", "decreto-supremo") */
  rango: LawType
  /** Sector for DS, RM, etc. (e.g., "minedu", "minsa") */
  sector?: string
  /** Publication date in ISO format */
  fechaPublicacion: string
  /** Effective date if different from publication */
  fechaVigencia?: string
  /** Last update date */
  ultimaActualizacion?: string
  /** Status */
  estado: 'vigente' | 'derogado' | 'modificado' | 'pendiente-revision'
  /** Source URL */
  fuente: string
  /** Official gazette */
  diarioOficial: 'El Peruano'
}

export type LawType =
  | 'constitucion'
  | 'ley'
  | 'decreto-legislativo'
  | 'decreto-de-urgencia'
  | 'decreto-supremo'
  | 'resolucion-ministerial'
  | 'resolucion-suprema'
  | 'ordenanza-regional'
  | 'ordenanza-municipal'

export interface ScrapedLaw {
  metadata: LawMetadata
  content: string
  rawHtml: string
}

export interface ScrapeResult {
  success: boolean
  laws: ScrapedLaw[]
  errors: ScrapeError[]
  warnings: string[]
}

export interface ScrapeError {
  identificador: string
  url: string
  error: string
  timestamp: string
}
