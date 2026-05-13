import { parse, stringify } from 'yaml'
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

/**
 * Parses frontmatter from markdown content
 */
export function parseFrontmatter(content: string): {
  frontmatter: LawMetadata
  body: string
} {
  // Split on --- delimiters
  const parts = content.split(/^---\s*$/m)

  if (parts.length < 3) {
    throw new Error('Invalid frontmatter format: missing --- delimiters')
  }

  const yamlBlock = parts[1]?.trim() ?? ''
  const body = parts.slice(2).join('---').trim()

  // Use yaml.parse() to parse the YAML block
  const frontmatter = parse(yamlBlock) as LawMetadata

  return { frontmatter, body }
}
