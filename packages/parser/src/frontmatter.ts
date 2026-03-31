import { stringify } from 'yaml'
import type { LawMetadata } from './types'

/**
 * Generates YAML frontmatter from law metadata
 */
export function generateFrontmatter(metadata: LawMetadata): string {
  const yaml = stringify(metadata, {
    lineWidth: 0, // Don't wrap lines
    singleQuote: false,
  })

  return `---\n${yaml}---`
}
