#!/usr/bin/env npx tsx
/**
 * Standalone script to import laws into local SQLite database
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LEYES_DIR = join(__dirname, '../leyes/pe')
const DB_PATH = join(__dirname, '../local.db')

// Schema definition
const normas = sqliteTable('normas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  identificador: text('identificador').notNull().unique(),
  titulo: text('titulo').notNull(),
  pais: text('pais').notNull().default('pe'),
  jurisdiccion: text('jurisdiccion').notNull(),
  rango: text('rango').notNull(),
  sector: text('sector'),
  fechaPublicacion: text('fecha_publicacion').notNull(),
  fechaPromulgacion: text('fecha_promulgacion'),
  fechaVigencia: text('fecha_vigencia'),
  ultimaActualizacion: text('ultima_actualizacion'),
  estado: text('estado').notNull().default('vigente'),
  fuente: text('fuente'),
  fuenteAlternativa: text('fuente_alternativa'),
  diarioOficial: text('diario_oficial').default('El Peruano'),
  sumilla: text('sumilla'),
  materias: text('materias'),
  spijId: text('spij_id'),
  contenido: text('contenido').notNull(),
  contenidoTexto: text('contenido_texto'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
})

const client = createClient({
  url: `file:${DB_PATH}`,
})

const db = drizzle(client)

interface Frontmatter {
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
  materias?: string[] | string
  spijId?: string
  disclaimer?: boolean
}

function parseFrontmatter(content: string): {
  frontmatter: Frontmatter
  body: string
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    throw new Error('Invalid frontmatter format')
  }

  const [, yamlContent, body] = match
  const frontmatter: Record<string, string> = {}

  for (const line of (yamlContent ?? '').split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      frontmatter[key] = value
    }
  }

  return {
    frontmatter: frontmatter as unknown as Frontmatter,
    body: body?.trim(),
  }
}

async function importLaw(filePath: string): Promise<boolean> {
  const content = await readFile(filePath, 'utf-8')
  const { frontmatter, body } = parseFrontmatter(content)

  const existing = await db
    .select()
    .from(normas)
    .where(eq(normas.identificador, frontmatter.identificador))
    .limit(1)

  const plainText = body
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/>\s*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '\n')

  const materias = Array.isArray(frontmatter.materias)
    ? JSON.stringify(frontmatter.materias)
    : frontmatter.materias || null

  const normaData = {
    identificador: frontmatter.identificador,
    titulo: frontmatter.titulo,
    pais: frontmatter.pais || 'pe',
    jurisdiccion: frontmatter.jurisdiccion,
    rango: frontmatter.rango,
    sector: frontmatter.sector || null,
    fechaPublicacion: frontmatter.fechaPublicacion,
    fechaPromulgacion: frontmatter.fechaPromulgacion || null,
    fechaVigencia: frontmatter.fechaVigencia || null,
    ultimaActualizacion: frontmatter.ultimaActualizacion || null,
    estado: frontmatter.estado || 'vigente',
    fuente: frontmatter.fuente || null,
    fuenteAlternativa: frontmatter.fuenteAlternativa || null,
    diarioOficial: frontmatter.diarioOficial || 'El Peruano',
    sumilla: frontmatter.sumilla || null,
    materias,
    spijId: frontmatter.spijId || null,
    contenido: body,
    contenidoTexto: plainText,
  }

  if (existing.length > 0) {
    await db
      .update(normas)
      .set(normaData)
      .where(eq(normas.identificador, frontmatter.identificador))
    console.log(`  ✓ Updated: ${frontmatter.identificador}`)
  } else {
    await db.insert(normas).values(normaData)
    console.log(`  ✓ Inserted: ${frontmatter.identificador}`)
  }

  return true
}

async function getMdFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir)
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stats = await stat(fullPath)

    if (stats.isDirectory()) {
      const subFiles = await getMdFiles(fullPath)
      files.push(...subFiles)
    } else if (entry.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

async function main() {
  console.log('📚 Importing laws from markdown files...')
  console.log(`Database: ${DB_PATH}\n`)

  const mdFiles = await getMdFiles(LEYES_DIR)

  console.log(`Found ${mdFiles.length} law files\n`)

  let success = 0
  let failed = 0

  for (const filePath of mdFiles) {
    const fileName = filePath.replace(`${LEYES_DIR}/`, '')
    try {
      await importLaw(filePath)
      success++
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`  ✗ Failed: ${fileName} - ${msg}`)
      failed++
    }
  }

  console.log('\n─────────────────────────')
  console.log(`✅ Imported: ${success}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('─────────────────────────')
}

main().catch(console.error)
