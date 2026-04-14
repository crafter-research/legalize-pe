import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Fifth pass - specific remaining patterns
const fifthPassFixes: [RegExp, string][] = [
  // Names
  [/PE�ARANDA/g, 'PEÑARANDA'],
  [/Pe�aranda/g, 'Peñaranda'],
  [/pe�aranda/g, 'peñaranda'],
  [/OT�ROLA/g, 'OTÁROLA'],
  [/Ot�rola/g, 'Otárola'],
  [/ot�rola/g, 'otárola'],
  [/MU�OZ/g, 'MUÑOZ'],
  [/Mu�oz/g, 'Muñoz'],
  [/mu�oz/g, 'muñoz'],
  [/NU�EZ/g, 'NÚÑEZ'],
  [/Nu�ez/g, 'Núñez'],
  [/nu�ez/g, 'núñez'],
  [/IBA�EZ/g, 'IBÁÑEZ'],
  [/Iba�ez/g, 'Ibáñez'],
  [/iba�ez/g, 'ibáñez'],
  [/YA�EZ/g, 'YÁÑEZ'],
  [/Ya�ez/g, 'Yáñez'],
  [/ya�ez/g, 'yáñez'],
  [/CASTA�EDA/g, 'CASTAÑEDA'],
  [/Casta�eda/g, 'Castañeda'],
  [/casta�eda/g, 'castañeda'],
  [/ORDO�EZ/g, 'ORDÓÑEZ'],
  [/Ordo�ez/g, 'Ordóñez'],
  [/ordo�ez/g, 'ordóñez'],
  [/BECE�A/g, 'BECEÑA'],
  [/Bece�a/g, 'Beceña'],

  // Year ranges with dash encoding issue
  [/2019�2020/g, '2019-2020'],
  [/2020�2021/g, '2020-2021'],
  [/2021�2022/g, '2021-2022'],
  [/2022�2023/g, '2022-2023'],
  [/2023�2024/g, '2023-2024'],
  [/2024�2025/g, '2024-2025'],
  [/2025�2026/g, '2025-2026'],

  // Other year patterns
  [/N� /g, 'N° '], // N° (number sign)
  [/N�\./g, 'N°.'],
  [/n� /g, 'n° '],
  [/N�$/gm, 'N°'],

  // More specific word patterns found
  [/emiti�/g, 'emitió'],
  [/EMITI�/g, 'EMITIÓ'],
  [/adec�a/g, 'adecúa'],
  [/ADEC�A/g, 'ADECÚA'],
  [/c�mplase/g, 'cúmplase'],
  [/C�MPLASE/g, 'CÚMPLASE'],
  [/C�mplase/g, 'Cúmplase'],
  [/MODIF�CASE/g, 'MODIFÍCASE'],
  [/Modif�case/g, 'Modifícase'],
  [/modif�case/g, 'modifícase'],

  // Additional common words
  [/a�o/g, 'año'],
  [/A�O/g, 'AÑO'],
  [/A�o/g, 'Año'],
  [/ni�o/g, 'niño'],
  [/NI�O/g, 'NIÑO'],
  [/Ni�o/g, 'Niño'],
  [/ni�a/g, 'niña'],
  [/NI�A/g, 'NIÑA'],
  [/Ni�a/g, 'Niña'],
  [/espa�ol/g, 'español'],
  [/ESPA�OL/g, 'ESPAÑOL'],
  [/Espa�ol/g, 'Español'],
  [/espa�ola/g, 'española'],
  [/ESPA�OLA/g, 'ESPAÑOLA'],
  [/Espa�ola/g, 'Española'],
  [/da�o/g, 'daño'],
  [/DA�O/g, 'DAÑO'],
  [/Da�o/g, 'Daño'],
  [/enga�o/g, 'engaño'],
  [/ENGA�O/g, 'ENGAÑO'],
  [/Enga�o/g, 'Engaño'],
  [/rega�o/g, 'regaño'],
  [/tama�o/g, 'tamaño'],
  [/TAMA�O/g, 'TAMAÑO'],
  [/Tama�o/g, 'Tamaño'],
  [/oto�o/g, 'otoño'],
  [/OTO�O/g, 'OTOÑO'],
  [/Oto�o/g, 'Otoño'],
  [/ba�o/g, 'baño'],
  [/BA�O/g, 'BAÑO'],
  [/Ba�o/g, 'Baño'],
  [/cari�o/g, 'cariño'],
  [/CARI�O/g, 'CARIÑO'],
  [/Cari�o/g, 'Cariño'],
  [/due�o/g, 'dueño'],
  [/DUE�O/g, 'DUEÑO'],
  [/Due�o/g, 'Dueño'],
  [/empe�o/g, 'empeño'],
  [/EMPE�O/g, 'EMPEÑO'],
  [/Empe�o/g, 'Empeño'],
  [/ense�a/g, 'enseña'],
  [/ENSE�A/g, 'ENSEÑA'],
  [/Ense�a/g, 'Enseña'],
  [/se�or/g, 'señor'],
  [/SE�OR/g, 'SEÑOR'],
  [/Se�or/g, 'Señor'],
  [/se�ora/g, 'señora'],
  [/SE�ORA/g, 'SEÑORA'],
  [/Se�ora/g, 'Señora'],
  [/pi�a/g, 'piña'],
  [/PI�A/g, 'PIÑA'],
  [/Pi�a/g, 'Piña'],
  [/caba�a/g, 'cabaña'],
  [/CABA�A/g, 'CABAÑA'],
  [/Caba�a/g, 'Cabaña'],
  [/ara�a/g, 'araña'],
  [/ARA�A/g, 'ARAÑA'],
  [/Ara�a/g, 'Araña'],
  [/rega�a/g, 'regaña'],
  [/pa�o/g, 'paño'],
  [/PA�O/g, 'PAÑO'],
  [/Pa�o/g, 'Paño'],
  [/enga�a/g, 'engaña'],
  [/ENGA�A/g, 'ENGAÑA'],
  [/desempe�/g, 'desempeñ'],
  [/DESEMPE�/g, 'DESEMPEÑ'],
  [/acompa�/g, 'acompañ'],
  [/ACOMPA�/g, 'ACOMPAÑ'],

  // Generic ñ patterns (careful with these)
  [/a�a/g, 'aña'],
  [/A�A/g, 'AÑA'],
  [/e�a/g, 'eña'],
  [/E�A/g, 'EÑA'],
  [/i�a/g, 'iña'],
  [/I�A/g, 'IÑA'],
  [/o�a/g, 'oña'],
  [/O�A/g, 'OÑA'],
  [/u�a/g, 'uña'],
  [/U�A/g, 'UÑA'],
  [/a�o/g, 'año'],
  [/A�O/g, 'AÑO'],
  [/e�o/g, 'eño'],
  [/E�O/g, 'EÑO'],
  [/i�o/g, 'iño'],
  [/I�O/g, 'IÑO'],
  [/o�o/g, 'oño'],
  [/O�O/g, 'OÑO'],
  [/u�o/g, 'uño'],
  [/U�O/g, 'UÑO'],
  [/a�e/g, 'añe'],
  [/A�E/g, 'AÑE'],
  [/e�e/g, 'eñe'],
  [/E�E/g, 'EÑE'],
  [/a�i/g, 'añi'],
  [/A�I/g, 'AÑI'],
  [/o�i/g, 'oñi'],
  [/O�I/g, 'OÑI'],
  [/u�i/g, 'uñi'],
  [/U�I/g, 'UÑI'],
]

function getAllMdFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...getAllMdFiles(fullPath))
    } else if (entry.endsWith('.md')) {
      files.push(fullPath)
    }
  }
  return files
}

function fixEncoding(content: string): string {
  let fixed = content
  for (const [pattern, replacement] of fifthPassFixes) {
    fixed = fixed.replace(pattern, replacement)
  }
  return fixed
}

async function main() {
  const leyesDir = process.argv[2] || join(process.cwd(), '../../leyes/pe')
  console.log(`Scanning directory: ${leyesDir}`)

  const files = getAllMdFiles(leyesDir)
  console.log(`Found ${files.length} markdown files`)

  let fixedCount = 0
  let totalReplacements = 0

  for (const file of files) {
    const content = readFileSync(file, 'utf-8')

    // Check if file has the replacement character
    if (!content.includes('�')) {
      continue
    }

    const fixed = fixEncoding(content)

    // Count remaining replacement characters
    const remainingBefore = (content.match(/�/g) || []).length
    const remainingAfter = (fixed.match(/�/g) || []).length
    const replacements = remainingBefore - remainingAfter

    if (replacements > 0) {
      writeFileSync(file, fixed, 'utf-8')
      fixedCount++
      totalReplacements += replacements
      console.log(
        `Fixed ${file.split('/').pop()}: ${replacements} replacements (${remainingAfter} remaining)`,
      )
    }
  }

  console.log('\nSummary:')
  console.log(`- Files processed: ${files.length}`)
  console.log(`- Files fixed: ${fixedCount}`)
  console.log(`- Total replacements: ${totalReplacements}`)
}

main().catch(console.error)
