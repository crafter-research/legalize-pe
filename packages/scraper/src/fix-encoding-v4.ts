import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Fourth pass - catch remaining patterns
const fourthPassFixes: [RegExp, string][] = [
  // Standalone replacement characters - context-based
  [/ � /g, ' ó '], // Often "ó" in Spanish
  [/ �r/g, ' ár'], // árbol, área, árido
  [/ �R/g, ' ÁR'],
  [/c�a\b/g, 'cía'], // policía, democracia
  [/C�A\b/g, 'CÍA'],
  [/E�A\b/g, 'ÉA'], // ÁREA
  [/e�a\b/g, 'éa'], // área
  [/Z�N/g, 'ZÓN'], // RAZÓN, CORAZÓN
  [/z�n/g, 'zón'], // razón, corazón
  [/d�s\b/g, 'días'], // días - specific fix
  [/D�S\b/g, 'DÍS'], // Note: rare
  [/g�s\b/g, 'gés'], // Note: could also be gás
  [/G�S\b/g, 'GÉS'],
  [/n�m/g, 'núm'], // número
  [/N�M/g, 'NÚM'],
  [/n�l/g, 'ñal'], // señal
  [/N�L/g, 'ÑAL'],
  [/l�c/g, 'líc'], // lícito, público
  [/L�C/g, 'LÍC'],
  [/t�\b/g, 'té'], // comité
  [/T�\b/g, 'TÉ'],
  [/ �n/g, ' án'], // ánimo, ángulo
  [/ �N/g, ' ÁN'],
  [/R�\b/g, 'RÉ'], // Note: rare
  [/r�\b/g, 'ré'], // podré
  [/m�n/g, 'mén'], // régimen
  [/M�N/g, 'MÉN'],
  [/m�r/g, 'mér'], // número, América
  [/M�R/g, 'MÉR'],
  [/e�o/g, 'eño'], // pequeño, diseño
  [/E�O/g, 'EÑO'],
  [/p�r/g, 'pár'], // párrafo
  [/P�R/g, 'PÁR'],
  [/c�n/g, 'cón'], // económico, cónsul
  [/C�N/g, 'CÓN'],
  [/D�a/g, 'Día'], // Día
  [/D�A/g, 'DÍA'], // DÍA
  [/d�a/g, 'día'], // día
  [/D�C/g, 'DÉC'], // DÉCIMO
  [/d�c/g, 'déc'], // décimo
  [/n�a/g, 'nía'], // compañía, soberanía
  [/N�A/g, 'NÍA'],
  [/a�a/g, 'aña'], // campaña, montaña
  [/A�A/g, 'AÑA'],
  [/c�l/g, 'cál'], // cálculo
  [/C�L/g, 'CÁL'],
  [/m�q/g, 'máq'], // máquina
  [/M�Q/g, 'MÁQ'],
  [/l�s/g, 'lís'], // análisis
  [/L�S/g, 'LÍS'],
  [/I�n/g, 'Ión'], // Note: rare
  [/i�n/g, 'ión'], // Note: should already be fixed
  [/m�t/g, 'mét'], // método, kilómetro
  [/M�T/g, 'MÉT'],

  // More -ía patterns
  [/g�a/g, 'gía'], // energía, tecnología
  [/G�A/g, 'GÍA'],
  [/r�a/g, 'ría'], // mayoría, secretaría
  [/R�A/g, 'RÍA'],
  [/l�a/g, 'lía'], // anomalía
  [/L�A/g, 'LÍA'],
  [/m�a/g, 'mía'], // autonomía, economía
  [/M�A/g, 'MÍA'],
  [/f�a/g, 'fía'], // filosofía, geografía
  [/F�A/g, 'FÍA'],

  // More -ón patterns
  [/s�n/g, 'són'], // prisón -> rare, usually "son" without accent
  [/S�N/g, 'SÓN'],
  [/t�n/g, 'tón'], // electrón, cartón
  [/T�N/g, 'TÓN'],

  // More names
  [/M�ndez/g, 'Méndez'],
  [/M�NDEZ/g, 'MÉNDEZ'],
  [/T�llez/g, 'Téllez'],
  [/T�LLEZ/g, 'TÉLLEZ'],
  [/Hid�lgo/g, 'Hidalgo'], // No accent actually
  [/R�os/g, 'Ríos'],
  [/R�OS/g, 'RÍOS'],
  [/Roa�a/g, 'Roaña'], // Name variant

  // -és patterns (nationality, etc.)
  [/n�s\b/g, 'nés'], // japonés, francés
  [/N�S\b/g, 'NÉS'],
  [/l�s\b/g, 'lés'], // inglés, cortés
  [/L�S\b/g, 'LÉS'],
  [/g�s\b/g, 'gués'], // portugués - specific
  [/G�S\b/g, 'GUÉS'],

  // More specific words
  [/\bR�o\b/g, 'Río'],
  [/\bR�O\b/g, 'RÍO'],
  [/\br�o\b/g, 'río'],
  [/raz�n/g, 'razón'],
  [/RAZ�N/g, 'RAZÓN'],
  [/Raz�n/g, 'Razón'],
  [/coraz�n/g, 'corazón'],
  [/CORAZ�N/g, 'CORAZÓN'],
  [/Coraz�n/g, 'Corazón'],
  [/prisi�n/g, 'prisión'],
  [/PRISI�N/g, 'PRISIÓN'],
  [/Prisi�n/g, 'Prisión'],
  [/comit�/g, 'comité'],
  [/COMIT�/g, 'COMITÉ'],
  [/Comit�/g, 'Comité'],
  [/caf�/g, 'café'],
  [/CAF�/g, 'CAFÉ'],
  [/Caf�/g, 'Café'],
  [/beb�/g, 'bebé'],
  [/BEB�/g, 'BEBÉ'],
  [/Beb�/g, 'Bebé'],
  [/polic�a/g, 'policía'],
  [/POLIC�A/g, 'POLICÍA'],
  [/Polic�a/g, 'Policía'],
  [/democr�cia/g, 'democrácia'], // Note: rare spelling
  [/DEMOCR�CIA/g, 'DEMOCRÁCIA'],
  [/mayor�a/g, 'mayoría'],
  [/MAYOR�A/g, 'MAYORÍA'],
  [/Mayor�a/g, 'Mayoría'],
  [/minor�a/g, 'minoría'],
  [/MINOR�A/g, 'MINORÍA'],
  [/Minor�a/g, 'Minoría'],
  [/tecnolog�a/g, 'tecnología'],
  [/TECNOLOG�A/g, 'TECNOLOGÍA'],
  [/Tecnolog�a/g, 'Tecnología'],
  [/metodolog�a/g, 'metodología'],
  [/METODOLOG�A/g, 'METODOLOGÍA'],
  [/Metodolog�a/g, 'Metodología'],
  [/energ�a/g, 'energía'],
  [/ENERG�A/g, 'ENERGÍA'],
  [/Energ�a/g, 'Energía'],
  [/econom�a/g, 'economía'],
  [/ECONOM�A/g, 'ECONOMÍA'],
  [/Econom�a/g, 'Economía'],
  [/autonom�a/g, 'autonomía'],
  [/AUTONOM�A/g, 'AUTONOMÍA'],
  [/Autonom�a/g, 'Autonomía'],
  [/secretar�a/g, 'secretaría'],
  [/SECRETAR�A/g, 'SECRETARÍA'],
  [/Secretar�a/g, 'Secretaría'],
  [/tesorer�a/g, 'tesorería'],
  [/TESORER�A/g, 'TESORERÍA'],
  [/Tesorer�a/g, 'Tesorería'],
  [/fiscal�a/g, 'fiscalía'],
  [/FISCAL�A/g, 'FISCALÍA'],
  [/Fiscal�a/g, 'Fiscalía'],
  [/alcald�a/g, 'alcaldía'],
  [/ALCALD�A/g, 'ALCALDÍA'],
  [/Alcald�a/g, 'Alcaldía'],
  [/campa�a/g, 'campaña'],
  [/CAMPA�A/g, 'CAMPAÑA'],
  [/Campa�a/g, 'Campaña'],
  [/monta�a/g, 'montaña'],
  [/MONTA�A/g, 'MONTAÑA'],
  [/Monta�a/g, 'Montaña'],
  [/compa��a/g, 'compañía'],
  [/COMPA��A/g, 'COMPAÑÍA'],
  [/Compa��a/g, 'Compañía'],
  [/peque�o/g, 'pequeño'],
  [/PEQUE�O/g, 'PEQUEÑO'],
  [/Peque�o/g, 'Pequeño'],
  [/peque�a/g, 'pequeña'],
  [/PEQUE�A/g, 'PEQUEÑA'],
  [/Peque�a/g, 'Pequeña'],
  [/dise�o/g, 'diseño'],
  [/DISE�O/g, 'DISEÑO'],
  [/Dise�o/g, 'Diseño'],
  [/sue�o/g, 'sueño'],
  [/SUE�O/g, 'SUEÑO'],
  [/Sue�o/g, 'Sueño'],
  [/ense�anza/g, 'enseñanza'],
  [/ENSE�ANZA/g, 'ENSEÑANZA'],
  [/Ense�anza/g, 'Enseñanza'],
  [/m�ximo/g, 'máximo'],
  [/M�XIMO/g, 'MÁXIMO'],
  [/M�ximo/g, 'Máximo'],
  [/m�xima/g, 'máxima'],
  [/M�XIMA/g, 'MÁXIMA'],
  [/m�nimo/g, 'mínimo'],
  [/M�NIMO/g, 'MÍNIMO'],
  [/M�nimo/g, 'Mínimo'],
  [/m�nima/g, 'mínima'],
  [/M�NIMA/g, 'MÍNIMA'],
  [/m�todo/g, 'método'],
  [/M�TODO/g, 'MÉTODO'],
  [/M�todo/g, 'Método'],
  [/k�metro/g, 'kómetro'], // kilómetro
  [/K�METRO/g, 'KÓMETRO'],
  [/il�metro/g, 'ilómetro'], // kilómetro
  [/IL�METRO/g, 'ILÓMETRO'],
  [/c�lculo/g, 'cálculo'],
  [/C�LCULO/g, 'CÁLCULO'],
  [/C�lculo/g, 'Cálculo'],
  [/m�quina/g, 'máquina'],
  [/M�QUINA/g, 'MÁQUINA'],
  [/M�quina/g, 'Máquina'],
  [/p�rrafo/g, 'párrafo'],
  [/P�RRAFO/g, 'PÁRRAFO'],
  [/P�rrafo/g, 'Párrafo'],
  [/se�al/g, 'señal'],
  [/SE�AL/g, 'SEÑAL'],
  [/Se�al/g, 'Señal'],
  [/an�lisis/g, 'análisis'],
  [/AN�LISIS/g, 'ANÁLISIS'],
  [/An�lisis/g, 'Análisis'],
  [/s�ntesis/g, 'síntesis'],
  [/S�NTESIS/g, 'SÍNTESIS'],
  [/S�ntesis/g, 'Síntesis'],
  [/hip�tesis/g, 'hipótesis'],
  [/HIP�TESIS/g, 'HIPÓTESIS'],
  [/Hip�tesis/g, 'Hipótesis'],
  [/par�ntesis/g, 'paréntesis'],
  [/PAR�NTESIS/g, 'PARÉNTESIS'],
  [/Par�ntesis/g, 'Paréntesis'],
  [/di�gnos/g, 'diagnós'],
  [/DI�GNOS/g, 'DIAGNÓS'],
  [/Di�gnos/g, 'Diagnós'],
  [/pron�stic/g, 'pronóstic'],
  [/PRON�STIC/g, 'PRONÓSTIC'],
  [/Pron�stic/g, 'Pronóstic'],
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
  for (const [pattern, replacement] of fourthPassFixes) {
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
