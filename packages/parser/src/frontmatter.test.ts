import { describe, expect, it } from 'vitest'
import { generateFrontmatter } from './frontmatter'
import type { LawMetadata } from './types'

describe('generateFrontmatter', () => {
  it('generates valid YAML frontmatter with all required fields', () => {
    const metadata: LawMetadata = {
      titulo: 'Código Civil',
      identificador: 'dleg-295',
      pais: 'pe',
      jurisdiccion: 'pe',
      rango: 'decreto-legislativo',
      fechaPublicacion: '1984-07-25',
      estado: 'vigente',
      fuente: 'https://lpderecho.pe/codigo-civil-peruano-actualizado/',
      diarioOficial: 'El Peruano',
    }

    const result = generateFrontmatter(metadata)

    expect(result).toContain('---')
    expect(result).toContain('titulo: Código Civil')
    expect(result).toContain('identificador: dleg-295')
    expect(result).toContain('pais: pe')
    expect(result).toContain('jurisdiccion: pe')
    expect(result).toContain('rango: decreto-legislativo')
    expect(result).toContain('fechaPublicacion: 1984-07-25')
    expect(result).toContain('estado: vigente')
    expect(result).toContain('diarioOficial: El Peruano')
  })

  it('includes optional fields when provided', () => {
    const metadata: LawMetadata = {
      titulo: 'Ley Test',
      identificador: 'ley-12345',
      pais: 'pe',
      jurisdiccion: 'pe',
      rango: 'ley',
      sector: 'justicia',
      fechaPublicacion: '2024-01-01',
      fechaVigencia: '2024-02-01',
      ultimaActualizacion: '2024-03-01',
      estado: 'vigente',
      fuente: 'https://example.com',
      diarioOficial: 'El Peruano',
    }

    const result = generateFrontmatter(metadata)

    expect(result).toContain('sector: justicia')
    expect(result).toContain('fechaVigencia: 2024-02-01')
    expect(result).toContain('ultimaActualizacion: 2024-03-01')
  })

  it('handles titles with special characters', () => {
    const metadata: LawMetadata = {
      titulo: 'Ley de "Protección" del Niño & Adolescente',
      identificador: 'ley-27337',
      pais: 'pe',
      jurisdiccion: 'pe',
      rango: 'ley',
      fechaPublicacion: '2000-08-07',
      estado: 'vigente',
      fuente: 'https://example.com',
      diarioOficial: 'El Peruano',
    }

    const result = generateFrontmatter(metadata)

    expect(result).toContain('---')
    expect(result).toContain('titulo:')
    // Should not throw on special characters
  })

  it('handles different estados', () => {
    const estados: LawMetadata['estado'][] = [
      'vigente',
      'derogado',
      'modificado',
      'pendiente-revision',
    ]

    for (const estado of estados) {
      const metadata: LawMetadata = {
        titulo: 'Test',
        identificador: 'test-1',
        pais: 'pe',
        jurisdiccion: 'pe',
        rango: 'ley',
        fechaPublicacion: '2024-01-01',
        estado,
        fuente: 'https://example.com',
        diarioOficial: 'El Peruano',
      }

      const result = generateFrontmatter(metadata)
      expect(result).toContain(`estado: ${estado}`)
    }
  })

  it('starts and ends with YAML delimiters', () => {
    const metadata: LawMetadata = {
      titulo: 'Test',
      identificador: 'test-1',
      pais: 'pe',
      jurisdiccion: 'pe',
      rango: 'ley',
      fechaPublicacion: '2024-01-01',
      estado: 'vigente',
      fuente: 'https://example.com',
      diarioOficial: 'El Peruano',
    }

    const result = generateFrontmatter(metadata)

    expect(result.startsWith('---\n')).toBe(true)
    expect(result.endsWith('---')).toBe(true)
  })
})
