/**
 * Legalize PE Scraper
 *
 * Extracts Peruvian legislation from SPIJ (Sistema Peruano de Información Jurídica)
 * and converts it to structured Markdown files.
 */

export { scrape } from './scraper'
export type { ScraperConfig, LawMetadata } from './types'
