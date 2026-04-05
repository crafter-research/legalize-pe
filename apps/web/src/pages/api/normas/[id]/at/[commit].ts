import path from 'node:path'
import { createGitService } from '@legalize-pe/git'
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const { id, commit } = params

  if (!id || !commit) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const repoPath = path.join(process.cwd(), '..', '..')
    const gitService = createGitService(repoPath)
    const version = await gitService.getContentAtCommit(id, commit)

    return new Response(JSON.stringify({ data: version }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching version:', error)
    return new Response(
      JSON.stringify({ error: 'Error al obtener la versión' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
