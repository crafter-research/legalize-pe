import type { APIRoute } from 'astro'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { intelligentSearch } from '../../../lib/smart-search'
import type { CompactLey } from '../../../lib/search-index'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Query parameter is required and must be a string',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Load search index
    const indexPath = join(process.cwd(), 'public', 'search-index.json')
    const laws: CompactLey[] = JSON.parse(readFileSync(indexPath, 'utf-8'))

    // Perform intelligent search
    const results = intelligentSearch(query, laws, 10)

    return new Response(
      JSON.stringify({
        query,
        results: results.map(r => ({
          id: r.law.id,
          titulo: r.law.t,
          rango: r.law.r,
          estado: r.law.e,
          fechaPublicacion: r.law.f,
          bodyPreview: r.law.b,
          materias: r.law.m,
          score: r.score,
          matchReasons: r.matchReasons,
        })),
        totalResults: results.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Smart search error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
