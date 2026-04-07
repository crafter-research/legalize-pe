import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LEYES_DIR = join(__dirname, '../leyes/pe')
const data = JSON.parse(
  readFileSync(join(__dirname, '../normas-legales-gob.json'), 'utf-8'),
)

function parseNorma(item) {
  const url = item.pdfUrl.toLowerCase()
  const titulo = item.titulo

  let tipo = 'ley'
  let numero = item.numero

  if (
    url.includes('decreto-legislativo') ||
    titulo.match(/Decreto Legislativo/i)
  ) {
    tipo = 'decreto-legislativo'
    const m =
      url.match(/decreto[_-]legislativo[_-]?(\d+)/i) ||
      item.detailUrl.match(/\/(\d+)-(\d+)$/)
    if (m) numero = m[2] || m[1]
  } else if (titulo.match(/Resolución Legislativa/i)) {
    tipo = 'resolucion-legislativa'
    const m = item.detailUrl.match(/-(\d+)$/)
    if (m) numero = m[1]
  }

  if (!numero) {
    const m = item.detailUrl.match(/-(\d+)$/)
    if (m) numero = m[1]
  }

  let identificador
  if (tipo === 'decreto-legislativo') identificador = `dleg-${numero}`
  else if (tipo === 'resolucion-legislativa') identificador = `rl-${numero}`
  else identificador = `ley-${numero}`

  return { ...item, tipo, numero, identificador }
}

const normas = data.map(parseNorma).filter((n) => n.numero)
const unique = normas.filter(
  (n, i, arr) =>
    arr.findIndex((x) => x.identificador === n.identificador) === i,
)

const missing = unique.filter(
  (n) => !existsSync(join(LEYES_DIR, `${n.identificador}.md`)),
)
const existing = unique.filter((n) =>
  existsSync(join(LEYES_DIR, `${n.identificador}.md`)),
)

console.log('Total unique normas:', unique.length)
console.log('Already have:', existing.length)
console.log('Missing:', missing.length)
console.log()
console.log('Missing normas:')
for (const n of missing) {
  console.log(' -', n.identificador, '|', n.titulo.slice(0, 80))
}
