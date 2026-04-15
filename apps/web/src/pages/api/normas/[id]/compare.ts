import path from 'node:path'
import { createGitService } from '@legalize-pe/git'
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ params, url }) => {
  const { id } = params
  const fromHash = url.searchParams.get('from')
  const toHash = url.searchParams.get('to')

  if (!id || !fromHash || !toHash) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const repoPath = path.join(process.cwd(), '..', '..')
    const gitService = createGitService(repoPath)

    // Get content at both commits using the existing method
    const [fromVersion, toVersion] = await Promise.all([
      gitService.getContentAtCommit(id, fromHash),
      gitService.getContentAtCommit(id, toHash),
    ])

    // Parse frontmatter and body
    function parseContent(content: string) {
      const parts = content.split(/^---\s*$/m)
      const body = parts.slice(2).join('---').trim()
      return body
    }

    const fromBody = parseContent(fromVersion.content)
    const toBody = parseContent(toVersion.content)

    // Split into lines for comparison
    const fromLines = fromBody.split('\n')
    const toLines = toBody.split('\n')

    return new Response(
      JSON.stringify({
        data: {
          from: {
            hash: fromHash,
            date: fromVersion.authorDate,
            subject: fromVersion.message.split('\n')[0] || '',
            lines: fromLines,
          },
          to: {
            hash: toHash,
            date: toVersion.authorDate,
            subject: toVersion.message.split('\n')[0] || '',
            lines: toLines,
          },
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error fetching compare data:', error)
    return new Response(
      JSON.stringify({ error: 'Error al obtener las versiones' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
