import path from 'node:path'
import { createGitService } from '@legalize-pe/git'
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const { id } = params

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const repoPath = path.join(process.cwd(), '..', '..')
    const gitService = createGitService(repoPath)
    const commits = await gitService.getHistory(id)

    if (!commits || commits.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No se encontró historial para esta norma' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ data: commits }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching history:', error)
    return new Response(
      JSON.stringify({ error: 'Error al obtener el historial' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
