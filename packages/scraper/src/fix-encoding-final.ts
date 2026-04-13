import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Final pass - catch ALL remaining patterns
const finalFixes: [RegExp, string][] = [
  // Most common remaining
  [/\bE�A\b/g, 'ÉA'],  // ÁREA
  [/\be�a\b/g, 'éa'],  // área
  [/gu�s/g, 'gués'],  // burgués, portugués
  [/GU�S/g, 'GUÉS'],
  [/g�s\b/g, 'gés'],  // Note: generic
  [/G�S\b/g, 'GÉS'],
  [/�a\b/g, 'ía'],  // generic -ía ending
  [/�A\b/g, 'ÍA'],
  [/R�\s/g, 'RÉ '],  // podré
  [/R�$/gm, 'RÉ'],
  [/r�\s/g, 'ré '],
  [/r�$/gm, 'ré'],
  [/\bd�s\b/g, 'dís'],  // Note: could be días or -dés
  [/\bD�S\b/g, 'DÍS'],
  [/B�s/g, 'Bás'],  // Básico
  [/B�S/g, 'BÁS'],
  [/b�s/g, 'bás'],
  [/h�d/g, 'hád'],  // Note: rare, could be other
  [/H�D/g, 'HÁD'],
  [/d�g/g, 'dóg'],  // código
  [/D�G/g, 'DÓG'],
  [/v�n/g, 'vén'],  // jóvenes, convención
  [/V�N/g, 'VÉN'],
  [/i�\s/g, 'ié '],  // Note: rare
  [/i�$/gm, 'ié'],
  [/f�c/g, 'fác'],  // fácil, fáctico
  [/F�C/g, 'FÁC'],
  [/l�q/g, 'líq'],  // líquido
  [/L�Q/g, 'LÍQ'],
  [/\.�\s/g, '.ó '],  // sentence ending with ó
  [/n�r/g, 'nér'],  // género
  [/N�R/g, 'NÉR'],
  [/n�c/g, 'néc'],  // técnico
  [/N�C/g, 'NÉC'],
  [/s�l/g, 'sól'],  // sólido
  [/S�L/g, 'SÓL'],
  [/p�n/g, 'pón'],  // Note: could be -pán
  [/P�N/g, 'PÓN'],
  [/C�m/g, 'Cám'],  // Cámara
  [/C�M/g, 'CÁM'],
  [/c�m/g, 'cám'],

  // More specific patterns
  [/Bas�n/g, 'Basán'],  // Name
  [/BAS�N/g, 'BASÁN'],
  [/c�digo/g, 'código'],
  [/C�DIGO/g, 'CÓDIGO'],
  [/C�digo/g, 'Código'],
  [/g�nero/g, 'género'],
  [/G�NERO/g, 'GÉNERO'],
  [/G�nero/g, 'Género'],
  [/l�quido/g, 'líquido'],
  [/L�QUIDO/g, 'LÍQUIDO'],
  [/L�quido/g, 'Líquido'],
  [/s�lido/g, 'sólido'],
  [/S�LIDO/g, 'SÓLIDO'],
  [/S�lido/g, 'Sólido'],
  [/f�cil/g, 'fácil'],
  [/F�CIL/g, 'FÁCIL'],
  [/F�cil/g, 'Fácil'],
  [/dif�cil/g, 'difícil'],
  [/DIF�CIL/g, 'DIFÍCIL'],
  [/Dif�cil/g, 'Difícil'],
  [/C�mara/g, 'Cámara'],
  [/C�MARA/g, 'CÁMARA'],
  [/c�mara/g, 'cámara'],
  [/h�dric/g, 'hídric'],
  [/H�DRIC/g, 'HÍDRIC'],
  [/h�dro/g, 'hidro'],
  [/H�DRO/g, 'HIDRO'],
  [/burgu�s/g, 'burgués'],
  [/BURGU�S/g, 'BURGUÉS'],
  [/Burgu�s/g, 'Burgués'],
  [/portugu�s/g, 'portugués'],
  [/PORTUGU�S/g, 'PORTUGUÉS'],
  [/Portugu�s/g, 'Portugués'],
  [/cort�s/g, 'cortés'],
  [/CORT�S/g, 'CORTÉS'],
  [/Cort�s/g, 'Cortés'],
  [/ingl�s/g, 'inglés'],
  [/INGL�S/g, 'INGLÉS'],
  [/Ingl�s/g, 'Inglés'],
  [/franc�s/g, 'francés'],
  [/FRANC�S/g, 'FRANCÉS'],
  [/Franc�s/g, 'Francés'],
  [/japon�s/g, 'japonés'],
  [/JAPON�S/g, 'JAPONÉS'],
  [/Japon�s/g, 'Japonés'],
  [/holand�s/g, 'holandés'],
  [/HOLAND�S/g, 'HOLANDÉS'],
  [/Holand�s/g, 'Holandés'],
  [/dan�s/g, 'danés'],
  [/DAN�S/g, 'DANÉS'],
  [/Dan�s/g, 'Danés'],
  [/suec�s/g, 'suecés'],  // Note: should be "sueco" not "suecés"
  [/SUEC�S/g, 'SUECÉS'],
  [/finand�s/g, 'finandés'],  // Note: should be "finlandés"
  [/FINLAND�S/g, 'FINLANDÉS'],
  [/finland�s/g, 'finlandés'],
  [/irland�s/g, 'irlandés'],
  [/IRLAND�S/g, 'IRLANDÉS'],
  [/Irland�s/g, 'Irlandés'],
  [/escoc�s/g, 'escocés'],
  [/ESCOC�S/g, 'ESCOCÉS'],
  [/Escoc�s/g, 'Escocés'],
  [/norueg�s/g, 'noruegés'],  // Note: should be "noruego"
  [/aragon�s/g, 'aragonés'],
  [/ARAGON�S/g, 'ARAGONÉS'],
  [/Aragon�s/g, 'Aragonés'],
  [/leon�s/g, 'leonés'],
  [/LEON�S/g, 'LEONÉS'],
  [/Leon�s/g, 'Leonés'],
  [/montan�s/g, 'montañés'],
  [/MONTAN�S/g, 'MONTAÑÉS'],
  [/Montan�s/g, 'Montañés'],

  // More -éric patterns
  [/g�ner/g, 'géner'],  // género, genérico
  [/G�NER/g, 'GÉNER'],
  [/num�r/g, 'numér'],  // numérico
  [/NUM�R/g, 'NUMÉR'],

  // More -ónic patterns
  [/electr�n/g, 'electrón'],
  [/ELECTR�N/g, 'ELECTRÓN'],
  [/fot�n/g, 'fotón'],
  [/FOT�N/g, 'FOTÓN'],
  [/prot�n/g, 'protón'],
  [/PROT�N/g, 'PROTÓN'],
  [/neutr�n/g, 'neutrón'],
  [/NEUTR�N/g, 'NEUTRÓN'],

  // Additional specific words
  [/�rea/g, 'área'],
  [/�REA/g, 'ÁREA'],
  [/Area/g, 'Area'],  // Usually OK without accent in names
  [/h�bitat/g, 'hábitat'],
  [/H�BITAT/g, 'HÁBITAT'],
  [/H�bitat/g, 'Hábitat'],
  [/r�gido/g, 'rígido'],
  [/R�GIDO/g, 'RÍGIDO'],
  [/R�gido/g, 'Rígido'],
  [/r�gida/g, 'rígida'],
  [/R�GIDA/g, 'RÍGIDA'],
  [/R�gida/g, 'Rígida'],
  [/l�pido/g, 'lípido'],
  [/L�PIDO/g, 'LÍPIDO'],
  [/L�pido/g, 'Lípido'],
  [/v�ctima/g, 'víctima'],
  [/V�CTIMA/g, 'VÍCTIMA'],
  [/V�ctima/g, 'Víctima'],
  [/leg�timo/g, 'legítimo'],
  [/LEG�TIMO/g, 'LEGÍTIMO'],
  [/Leg�timo/g, 'Legítimo'],
  [/leg�tima/g, 'legítima'],
  [/LEG�TIMA/g, 'LEGÍTIMA'],
  [/Leg�tima/g, 'Legítima'],
  [/mar�timo/g, 'marítimo'],
  [/MAR�TIMO/g, 'MARÍTIMO'],
  [/Mar�timo/g, 'Marítimo'],
  [/mar�tima/g, 'marítima'],
  [/MAR�TIMA/g, 'MARÍTIMA'],
  [/Mar�tima/g, 'Marítima'],
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
  for (const [pattern, replacement] of finalFixes) {
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
      console.log(`Fixed ${file.split('/').pop()}: ${replacements} replacements (${remainingAfter} remaining)`)
    }
  }

  console.log(`\nSummary:`)
  console.log(`- Files processed: ${files.length}`)
  console.log(`- Files fixed: ${fixedCount}`)
  console.log(`- Total replacements: ${totalReplacements}`)
}

main().catch(console.error)
