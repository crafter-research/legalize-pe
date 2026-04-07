import * as fs from 'fs'
import { execSync } from 'child_process'
import * as path from 'path'

const LEYES_DIR = '/Users/shiara/Documents/personal-projects/legalize-pe/leyes/pe'
const ROOT_DIR = '/Users/shiara/Documents/personal-projects/legalize-pe'

interface NormaInfo {
  filepath: string
  filename: string
  titulo: string
  identificador: string
  fechaPublicacion: string
  rango: string
}

function extractFrontmatter(filepath: string): NormaInfo | null {
  const content = fs.readFileSync(filepath, 'utf-8')
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)

  if (!frontmatterMatch) return null

  const frontmatter = frontmatterMatch[1]

  const getValue = (key: string): string => {
    const match = frontmatter.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, 'm'))
    return match?.[1]?.trim() || ''
  }

  return {
    filepath,
    filename: path.basename(filepath),
    titulo: getValue('titulo'),
    identificador: getValue('identificador'),
    fechaPublicacion: getValue('fechaPublicacion'),
    rango: getValue('rango'),
  }
}

function formatRango(rango: string): string {
  const rangoMap: Record<string, string> = {
    'resolucion-suprema': 'Resolución Suprema',
    'resolucion-ministerial': 'Resolución Ministerial',
    'resolucion-jefatural': 'Resolución Jefatural',
    'resolucion-directoral': 'Resolución Directoral',
    'resolucion': 'Resolución',
    'decreto-legislativo': 'Decreto Legislativo',
    'decreto-supremo': 'Decreto Supremo',
    'decreto-de-urgencia': 'Decreto de Urgencia',
    'ley': 'Ley',
    'ordenanza': 'Ordenanza',
  }
  return rangoMap[rango] || rango
}

async function main() {
  // Get list of new files from git status
  const gitStatus = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf-8' })
  const newFiles = gitStatus
    .split('\n')
    .filter(line => line.startsWith('??') && line.includes('leyes/pe/') && line.endsWith('.md'))
    .map(line => line.replace('?? ', '').trim())

  console.log(`Encontrados ${newFiles.length} archivos nuevos para commitear\n`)

  if (newFiles.length === 0) {
    console.log('No hay archivos nuevos.')
    return
  }

  // Extract info from each file
  const normas: NormaInfo[] = []
  for (const relPath of newFiles) {
    const fullPath = path.join(ROOT_DIR, relPath)
    const info = extractFrontmatter(fullPath)
    if (info) {
      normas.push(info)
    }
  }

  // Sort by fecha
  normas.sort((a, b) => a.fechaPublicacion.localeCompare(b.fechaPublicacion))

  console.log(`Procesando ${normas.length} normas...\n`)

  for (let i = 0; i < normas.length; i++) {
    const norma = normas[i]
    const relPath = `leyes/pe/${norma.filename}`

    // Format date for git (needs time component)
    const commitDate = `${norma.fechaPublicacion}T12:00:00`

    // Create commit message
    const rangoFormatted = formatRango(norma.rango)
    const commitMsg = `feat(leyes): add ${rangoFormatted} ${norma.identificador}`

    console.log(`[${i + 1}/${normas.length}] ${norma.filename}`)
    console.log(`  Fecha: ${norma.fechaPublicacion}`)
    console.log(`  Mensaje: ${commitMsg}`)

    try {
      // Stage the file
      execSync(`git add "${relPath}"`, { cwd: ROOT_DIR })

      // Commit with custom date
      const env = {
        ...process.env,
        GIT_AUTHOR_DATE: commitDate,
        GIT_COMMITTER_DATE: commitDate,
      }

      execSync(`git commit -m "${commitMsg}"`, {
        cwd: ROOT_DIR,
        env,
      })

      console.log(`  ✓ Commit creado\n`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.log(`  ✗ Error: ${errorMsg}\n`)
    }
  }

  console.log('Commits completados.')
}

main().catch(console.error)
