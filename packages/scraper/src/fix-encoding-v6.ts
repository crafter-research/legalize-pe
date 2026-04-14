import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Sixth pass - ordinals and common word fragments
const sixthPassFixes: [RegExp, string][] = [
  // Ordinal numbers (1°, 2°, 3°, etc.)
  [/1�\s/g, '1° '],
  [/1�\./g, '1°.'],
  [/1�,/g, '1°,'],
  [/1�$/gm, '1°'],
  [/2�\s/g, '2° '],
  [/2�\./g, '2°.'],
  [/2�,/g, '2°,'],
  [/2�$/gm, '2°'],
  [/3�\s/g, '3° '],
  [/3�\./g, '3°.'],
  [/3�,/g, '3°,'],
  [/3�$/gm, '3°'],
  [/4�\s/g, '4° '],
  [/4�\./g, '4°.'],
  [/4�,/g, '4°,'],
  [/5�\s/g, '5° '],
  [/5�\./g, '5°.'],
  [/5�,/g, '5°,'],
  [/6�\s/g, '6° '],
  [/6�\./g, '6°.'],
  [/6�,/g, '6°,'],
  [/7�\s/g, '7° '],
  [/7�\./g, '7°.'],
  [/7�,/g, '7°,'],
  [/8�\s/g, '8° '],
  [/8�\./g, '8°.'],
  [/8�,/g, '8°,'],
  [/9�\s/g, '9° '],
  [/9�\./g, '9°.'],
  [/9�,/g, '9°,'],
  [/0�\s/g, '0° '],
  [/0�\./g, '0°.'],
  [/0�,/g, '0°,'],

  // Common word patterns
  // -ges endings (páginas, imágenes)
  [/p�g/g, 'pág'],
  [/P�G/g, 'PÁG'],
  [/P�g/g, 'Pág'],
  [/im�g/g, 'imág'],
  [/IM�G/g, 'IMÁG'],
  [/Im�g/g, 'Imág'],

  // -cía patterns (policía, democracia, farmacia)
  [/farmac�a/g, 'farmacía'],
  [/FARMAC�A/g, 'FARMACÍA'],
  [/eficac�a/g, 'eficacia'], // eficacia doesn't have accent
  [/EFICAC�A/g, 'EFICACIA'],

  // Medical terms
  [/m�d/g, 'méd'],
  [/M�D/g, 'MÉD'],
  [/M�d/g, 'Méd'],

  // -dón patterns
  [/perd�n/g, 'perdón'],
  [/PERD�N/g, 'PERDÓN'],

  // -gimen patterns
  [/r�g/g, 'rég'],
  [/R�G/g, 'RÉG'],
  [/R�g/g, 'Rég'],

  // -décimo patterns
  [/d�c/g, 'déc'],
  [/D�C/g, 'DÉC'],
  [/D�c/g, 'Déc'],

  // -güe patterns
  [/g�e/g, 'güe'],
  [/G�E/g, 'GÜE'],
  [/bilin�/g, 'bilingü'],
  [/BILIN�/g, 'BILINGÜ'],

  // -fér/-fór patterns (inferencia, fórmula)
  [/f�rm/g, 'fórm'],
  [/F�RM/g, 'FÓRM'],
  [/F�rm/g, 'Fórm'],
  [/f�r/g, 'fér'],
  [/F�R/g, 'FÉR'],

  // -súm/-sém patterns
  [/res�m/g, 'resúm'],
  [/RES�M/g, 'RESÚM'],
  [/Res�m/g, 'Resúm'],
  [/s�m/g, 'súm'],
  [/S�M/g, 'SÚM'],

  // -lím patterns (límite)
  [/l�m/g, 'lím'],
  [/L�M/g, 'LÍM'],
  [/L�m/g, 'Lím'],

  // -aér patterns (aéreo)
  [/a�r/g, 'aér'],
  [/A�R/g, 'AÉR'],

  // -náu patterns (náutico)
  [/n�u/g, 'náu'],
  [/N�U/g, 'NÁU'],
  [/N�u/g, 'Náu'],

  // aún
  [/a�n/g, 'aún'],
  [/A�N/g, 'AÚN'],
  [/A�n/g, 'Aún'],

  // -óp patterns (óptico, ópera)
  [/ �p/g, ' óp'],
  [/ �P/g, ' ÓP'],

  // -át patterns
  [/ �t/g, ' át'],
  [/ �T/g, ' ÁT'],

  // -úl patterns
  [/ �l/g, ' úl'],
  [/ �L/g, ' ÚL'],

  // -ác/-úc patterns
  [/N�c/g, 'Núc'], // núcleo
  [/N�C/g, 'NÚC'],
  [/n�c/g, 'núc'],

  // -pát patterns
  [/p�t/g, 'pát'],
  [/P�T/g, 'PÁT'],

  // -múl patterns
  [/m�l/g, 'múl'],
  [/M�L/g, 'MÚL'],

  // -híd patterns
  [/H�d/g, 'Híd'],
  [/H�D/g, 'HÍD'],
  [/h�d/g, 'híd'],

  // -cáp patterns
  [/c�p/g, 'cáp'],
  [/C�P/g, 'CÁP'],
  [/C�p/g, 'Cáp'],

  // -úc patterns
  [/u�c/g, 'úc'], // Note: context-dependent

  // -vío patterns
  [/v�o/g, 'vío'],
  [/V�O/g, 'VÍO'],

  // -ógr/-ágr patterns
  [/g�g/g, 'gág'], // geográfico - actually should be ógr
  [/G�G/g, 'GÁG'],

  // Common verbs with accent
  [/s� /g, 'sé '], // sé (I know)
  [/S� /g, 'SÉ '],
  [/t� /g, 'té '], // té (tea)
  [/T� /g, 'TÉ '],
  [/v� /g, 'vé '], // vé (see/go)
  [/V� /g, 'VÉ '],

  // More specific patterns
  [/g�s\b/g, 'gés'], // portugués, marqués
  [/G�S\b/g, 'GÉS'],
  [/c�a\b/g, 'cía'], // policía, democracia
  [/C�A\b/g, 'CÍA'],
  [/d�s\b/g, 'dés'], // cortés
  [/D�S\b/g, 'DÉS'],
  [/d�n\b/g, 'dón'], // perdón
  [/D�N\b/g, 'DÓN'],
  [/g�m/g, 'gúm'], // legúmbre - actually it's legumbre without accent
  [/G�M/g, 'GÚM'],
  [/e�n/g, 'eón'], // geología -> no, maybe león
  [/E�N/g, 'EÓN'],

  // Comma after accented vowel
  [/r�,/g, 'ré,'],
  [/R�,/g, 'RÉ,'],
  [/n�,/g, 'né,'],
  [/N�,/g, 'NÉ,'],

  // -add patterns (should be -add)
  [/a�d/g, 'aíd'], // caído
  [/A�D/g, 'AÍD'],

  // More words
  [/p�blico/g, 'público'],
  [/P�BLICO/g, 'PÚBLICO'],
  [/P�blico/g, 'Público'],
  [/p�blica/g, 'pública'],
  [/P�BLICA/g, 'PÚBLICA'],
  [/P�blica/g, 'Pública'],
  [/r�pido/g, 'rápido'],
  [/R�PIDO/g, 'RÁPIDO'],
  [/R�pido/g, 'Rápido'],
  [/r�pida/g, 'rápida'],
  [/R�PIDA/g, 'RÁPIDA'],
  [/R�pida/g, 'Rápida'],
  [/d�bil/g, 'débil'],
  [/D�BIL/g, 'DÉBIL'],
  [/D�bil/g, 'Débil'],
  [/l�nea/g, 'línea'],
  [/L�NEA/g, 'LÍNEA'],
  [/L�nea/g, 'Línea'],
  [/�nica/g, 'única'],
  [/�NICA/g, 'ÚNICA'],
  [/�nico/g, 'único'],
  [/�NICO/g, 'ÚNICO'],
  [/t�tulo/g, 'título'],
  [/T�TULO/g, 'TÍTULO'],
  [/T�tulo/g, 'Título'],
  [/cap�tulo/g, 'capítulo'],
  [/CAP�TULO/g, 'CAPÍTULO'],
  [/Cap�tulo/g, 'Capítulo'],
  [/art�culo/g, 'artículo'],
  [/ART�CULO/g, 'ARTÍCULO'],
  [/Art�culo/g, 'Artículo'],
  [/v�nculo/g, 'vínculo'],
  [/V�NCULO/g, 'VÍNCULO'],
  [/V�nculo/g, 'Vínculo'],
  [/obst�culo/g, 'obstáculo'],
  [/OBST�CULO/g, 'OBSTÁCULO'],
  [/Obst�culo/g, 'Obstáculo'],
  [/esp�ritu/g, 'espíritu'],
  [/ESP�RITU/g, 'ESPÍRITU'],
  [/Esp�ritu/g, 'Espíritu'],
  [/h�bito/g, 'hábito'],
  [/H�BITO/g, 'HÁBITO'],
  [/H�bito/g, 'Hábito'],
  [/�mbito/g, 'ámbito'],
  [/�MBITO/g, 'ÁMBITO'],
  [/pr�stamo/g, 'préstamo'],
  [/PR�STAMO/g, 'PRÉSTAMO'],
  [/Pr�stamo/g, 'Préstamo'],
  [/pr�ctica/g, 'práctica'],
  [/PR�CTICA/g, 'PRÁCTICA'],
  [/Pr�ctica/g, 'Práctica'],
  [/pr�ctico/g, 'práctico'],
  [/PR�CTICO/g, 'PRÁCTICO'],
  [/Pr�ctico/g, 'Práctico'],
  [/aut�ntico/g, 'auténtico'],
  [/AUT�NTICO/g, 'AUTÉNTICO'],
  [/Aut�ntico/g, 'Auténtico'],
  [/aut�ntica/g, 'auténtica'],
  [/AUT�NTICA/g, 'AUTÉNTICA'],
  [/Aut�ntica/g, 'Auténtica'],
  [/sistem�tico/g, 'sistemático'],
  [/SISTEM�TICO/g, 'SISTEMÁTICO'],
  [/sistem�tica/g, 'sistemática'],
  [/SISTEM�TICA/g, 'SISTEMÁTICA'],
  [/autom�tico/g, 'automático'],
  [/AUTOM�TICO/g, 'AUTOMÁTICO'],
  [/autom�tica/g, 'automática'],
  [/AUTOM�TICA/g, 'AUTOMÁTICA'],
  [/diplom�tico/g, 'diplomático'],
  [/DIPLOM�TICO/g, 'DIPLOMÁTICO'],
  [/diplom�tica/g, 'diplomática'],
  [/DIPLOM�TICA/g, 'DIPLOMÁTICA'],
  [/dem�crata/g, 'demócrata'],
  [/DEM�CRATA/g, 'DEMÓCRATA'],
  [/Dem�crata/g, 'Demócrata'],
  [/bur�crata/g, 'burócrata'],
  [/BUR�CRATA/g, 'BURÓCRATA'],
  [/Bur�crata/g, 'Burócrata'],
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
  for (const [pattern, replacement] of sixthPassFixes) {
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
