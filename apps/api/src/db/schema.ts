import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const normas = sqliteTable(
  'normas',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    identificador: text('identificador').notNull().unique(),
    titulo: text('titulo').notNull(),
    pais: text('pais').notNull().default('pe'),
    jurisdiccion: text('jurisdiccion').notNull(),
    rango: text('rango').notNull(),
    sector: text('sector'),
    fechaPublicacion: text('fecha_publicacion').notNull(),
    fechaVigencia: text('fecha_vigencia'),
    ultimaActualizacion: text('ultima_actualizacion'),
    estado: text('estado').notNull().default('vigente'),
    fuente: text('fuente'),
    diarioOficial: text('diario_oficial').default('El Peruano'),
    contenido: text('contenido').notNull(),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_jurisdiccion').on(table.jurisdiccion),
    index('idx_rango').on(table.rango),
    index('idx_estado').on(table.estado),
    index('idx_fecha_publicacion').on(table.fechaPublicacion),
  ],
)

export type Norma = typeof normas.$inferSelect
export type NewNorma = typeof normas.$inferInsert
