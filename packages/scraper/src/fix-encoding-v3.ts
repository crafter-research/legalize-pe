import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Third pass - more aggressive generic patterns
const thirdPassFixes: [RegExp, string][] = [
  // Generic -ión pattern (most common remaining)
  [/ci�n/g, 'ción'],
  [/CI�N/g, 'CIÓN'],
  [/si�n/g, 'sión'],
  [/SI�N/g, 'SIÓN'],
  [/xi�n/g, 'xión'],
  [/XI�N/g, 'XIÓN'],
  [/ni�n/g, 'nión'],
  [/NI�N/g, 'NIÓN'],
  [/mi�n/g, 'mión'],
  [/MI�N/g, 'MIÓN'],
  [/ri�n/g, 'rión'],
  [/RI�N/g, 'RIÓN'],
  [/li�n/g, 'lión'],
  [/LI�N/g, 'LIÓN'],
  [/di�n/g, 'dión'],
  [/DI�N/g, 'DIÓN'],
  [/gi�n/g, 'gión'],
  [/GI�N/g, 'GIÓN'],
  [/ti�n/g, 'tión'],
  [/TI�N/g, 'TIÓN'],
  [/vi�n/g, 'vión'],
  [/VI�N/g, 'VIÓN'],
  [/bi�n/g, 'bión'],
  [/BI�N/g, 'BIÓN'],
  [/pi�n/g, 'pión'],
  [/PI�N/g, 'PIÓN'],

  // Words with inter-
  [/inter�s/g, 'interés'],
  [/INTER�S/g, 'INTERÉS'],
  [/Inter�s/g, 'Interés'],

  // More future tense
  [/ar�s/g, 'arás'],
  [/AR�S/g, 'ARÁS'],
  [/er�s/g, 'erás'],
  [/ER�S/g, 'ERÁS'],
  [/ir�s/g, 'irás'],
  [/IR�S/g, 'IRÁS'],

  // Character patterns
  [/car�ct/g, 'caráct'],
  [/CAR�CT/g, 'CARÁCT'],
  [/pr�ct/g, 'práct'],
  [/PR�CT/g, 'PRÁCT'],

  // Year (Año)
  [/\bA�o\b/g, 'Año'],
  [/\bA�O\b/g, 'AÑO'],
  [/\ba�o\b/g, 'año'],
  [/\ba�os\b/g, 'años'],
  [/\bA�os\b/g, 'Años'],
  [/\bA�OS\b/g, 'AÑOS'],

  // Country (país)
  [/pa�s/g, 'país'],
  [/PA�S/g, 'PAÍS'],
  [/Pa�s/g, 'País'],

  // Hábil, háber
  [/h�bil/g, 'hábil'],
  [/H�BIL/g, 'HÁBIL'],
  [/H�bil/g, 'Hábil'],
  [/h�bit/g, 'hábit'],
  [/H�BIT/g, 'HÁBIT'],
  [/h�be/g, 'hábe'],
  [/H�BE/g, 'HÁBE'],

  // Public
  [/P�bli/g, 'Públi'],
  [/P�BLI/g, 'PÚBLI'],
  [/p�bli/g, 'públi'],

  // vía
  [/v�a\b/g, 'vía'],
  [/V�A\b/g, 'VÍA'],
  [/v�as/g, 'vías'],
  [/V�AS/g, 'VÍAS'],

  // crédito, régimen
  [/cr�dit/g, 'crédit'],
  [/CR�DIT/g, 'CRÉDIT'],
  [/r�gim/g, 'régim'],
  [/R�GIM/g, 'RÉGIM'],

  // ráfico (tráfico, gráfico)
  [/r�fic/g, 'ráfic'],
  [/R�FIC/g, 'RÁFIC'],
  [/gr�fic/g, 'gráfic'],
  [/GR�FIC/g, 'GRÁFIC'],
  [/tr�fic/g, 'tráfic'],
  [/TR�FIC/g, 'TRÁFIC'],

  // número
  [/n�mer/g, 'númer'],
  [/N�MER/g, 'NÚMER'],

  // análisis, síntesis
  [/an�lis/g, 'anális'],
  [/AN�LIS/g, 'ANÁLIS'],
  [/s�ntes/g, 'síntes'],
  [/S�NTES/g, 'SÍNTES'],

  // técnico, tecnología
  [/t�cni/g, 'técni'],
  [/T�CNI/g, 'TÉCNI'],
  [/t�cno/g, 'técno'],
  [/T�CNO/g, 'TÉCNO'],
  [/tecno/g, 'tecno'],  // Usually OK

  // lógic, lógist
  [/l�gic/g, 'lógic'],
  [/L�GIC/g, 'LÓGIC'],
  [/l�gist/g, 'logíst'],
  [/L�GIST/g, 'LOGÍST'],

  // crónic
  [/cr�nic/g, 'crónic'],
  [/CR�NIC/g, 'CRÓNIC'],

  // electrónic
  [/electr�nic/g, 'electrónic'],
  [/ELECTR�NIC/g, 'ELECTRÓNIC'],

  // económic
  [/econ�mic/g, 'económic'],
  [/ECON�MIC/g, 'ECONÓMIC'],

  // orgánic
  [/org�nic/g, 'orgánic'],
  [/ORG�NIC/g, 'ORGÁNIC'],

  // mecánic
  [/mec�nic/g, 'mecánic'],
  [/MEC�NIC/g, 'MECÁNIC'],

  // botánic
  [/bot�nic/g, 'botánic'],
  [/BOT�NIC/g, 'BOTÁNIC'],

  // titánic
  [/tit�nic/g, 'titánic'],
  [/TIT�NIC/g, 'TITÁNIC'],

  // volcánic
  [/volc�nic/g, 'volcánic'],
  [/VOLC�NIC/g, 'VOLCÁNIC'],

  // hispánic
  [/hisp�nic/g, 'hispánic'],
  [/HISP�NIC/g, 'HISPÁNIC'],

  // satánic
  [/sat�nic/g, 'satánic'],
  [/SAT�NIC/g, 'SATÁNIC'],

  // oceánic
  [/oce�nic/g, 'oceánic'],
  [/OCE�NIC/g, 'OCEÁNIC'],

  // germánic
  [/germ�nic/g, 'germánic'],
  [/GERM�NIC/g, 'GERMÁNIC'],

  // románic
  [/rom�nic/g, 'románic'],
  [/ROM�NIC/g, 'ROMÁNIC'],

  // británic
  [/brit�nic/g, 'británic'],
  [/BRIT�NIC/g, 'BRITÁNIC'],

  // Names - more patterns
  [/Ar�oz/g, 'Aráoz'],
  [/AR�OZ/g, 'ARÁOZ'],
  [/Vel�squez/g, 'Velásquez'],
  [/VEL�SQUEZ/g, 'VELÁSQUEZ'],
  [/V�squez/g, 'Vásquez'],
  [/V�SQUEZ/g, 'VÁSQUEZ'],
  [/M�rquez/g, 'Márquez'],
  [/M�RQUEZ/g, 'MÁRQUEZ'],
  [/Henr�quez/g, 'Henríquez'],
  [/HENR�QUEZ/g, 'HENRÍQUEZ'],
  [/Rodr�guez/g, 'Rodríguez'],
  [/RODR�GUEZ/g, 'RODRÍGUEZ'],
  [/Dom�nguez/g, 'Domínguez'],
  [/DOM�NGUEZ/g, 'DOMÍNGUEZ'],
  [/Boh�rquez/g, 'Bohórquez'],
  [/BOH�RQUEZ/g, 'BOHÓRQUEZ'],
  [/C�rdova/g, 'Córdova'],
  [/C�RDOVA/g, 'CÓRDOVA'],
  [/C�rdoba/g, 'Córdoba'],
  [/C�RDOBA/g, 'CÓRDOBA'],
  [/C�ceres/g, 'Cáceres'],
  [/C�CERES/g, 'CÁCERES'],
  [/Ch�vez/g, 'Chávez'],
  [/CH�VEZ/g, 'CHÁVEZ'],
  [/Su�rez/g, 'Suárez'],
  [/SU�REZ/g, 'SUÁREZ'],
  [/Ju�rez/g, 'Juárez'],
  [/JU�REZ/g, 'JUÁREZ'],
  [/�lvarez/g, 'Álvarez'],
  [/�LVAREZ/g, 'ÁLVAREZ'],
  [/Vel�zquez/g, 'Velázquez'],
  [/VEL�ZQUEZ/g, 'VELÁZQUEZ'],
  [/G�mez/g, 'Gómez'],
  [/G�MEZ/g, 'GÓMEZ'],
  [/Ben�tez/g, 'Benítez'],
  [/BEN�TEZ/g, 'BENÍTEZ'],
  [/Est�vez/g, 'Estévez'],
  [/EST�VEZ/g, 'ESTÉVEZ'],

  // Standalone replacement patterns - be careful
  [/ �l /g, ' él '],
  [/ �L /g, ' ÉL '],
  [/^�l /gm, 'Él '],
  [/ �sta/g, ' ésta'],
  [/ �STA/g, ' ÉSTA'],
  [/ �ste/g, ' éste'],
  [/ �STE/g, ' ÉSTE'],
  [/ �sto/g, ' ésto'],
  [/ �stos/g, ' éstos'],
  [/ �stas/g, ' éstas'],

  // Words starting with Á, É, Í, Ó, Ú
  [/\b�rea/g, 'Área'],
  [/\b�REA/g, 'ÁREA'],
  [/\b�rbol/g, 'Árbol'],
  [/\b�RBOL/g, 'ÁRBOL'],
  [/\b�rea/g, 'área'],
  [/\b�ngel/g, 'Ángel'],
  [/\b�NGEL/g, 'ÁNGEL'],
  [/\b�ngul/g, 'ángul'],
  [/\b�NGUL/g, 'ÁNGUL'],
  [/\b�ngulo/g, 'Ángulo'],
  [/\b�poca/g, 'Época'],
  [/\b�POCA/g, 'ÉPOCA'],
  [/\b�poca/g, 'época'],
  [/\b�xito/g, 'Éxito'],
  [/\b�XITO/g, 'ÉXITO'],
  [/\b�xito/g, 'éxito'],
  [/\b�ndice/g, 'Índice'],
  [/\b�NDICE/g, 'ÍNDICE'],
  [/\b�ndice/g, 'índice'],
  [/\b�ntegr/g, 'Íntegr'],
  [/\b�NTEGR/g, 'ÍNTEGR'],
  [/\b�ntim/g, 'Íntim'],
  [/\b�NTIM/g, 'ÍNTIM'],
  [/\b�tem/g, 'Ítem'],
  [/\b�TEM/g, 'ÍTEM'],
  [/\b�tem/g, 'ítem'],
  [/\b�ptim/g, 'Óptim'],
  [/\b�PTIM/g, 'ÓPTIM'],
  [/\b�rgan/g, 'Órgan'],
  [/\b�RGAN/g, 'ÓRGAN'],
  [/\b�rden/g, 'Órden'],
  [/\b�RDEN/g, 'ÓRDEN'],
  [/\b�ltim/g, 'Últim'],
  [/\b�LTIM/g, 'ÚLTIM'],
  [/\b�nic/g, 'Únic'],
  [/\b�NIC/g, 'ÚNIC'],
  [/\b�til/g, 'Útil'],
  [/\b�TIL/g, 'ÚTIL'],

  // More common words
  [/atm�sfer/g, 'atmósfer'],
  [/ATM�SFER/g, 'ATMÓSFER'],
  [/hem�sfer/g, 'hemisfer'],
  [/HEM�SFER/g, 'HEMISFER'],
  [/b�sic/g, 'básic'],
  [/B�SIC/g, 'BÁSIC'],
  [/cl�sic/g, 'clásic'],
  [/CL�SIC/g, 'CLÁSIC'],
  [/f�sic/g, 'físic'],
  [/F�SIC/g, 'FÍSIC'],
  [/m�sic/g, 'músic'],
  [/M�SIC/g, 'MÚSIC'],
  [/t�pic/g, 'típic'],
  [/T�PIC/g, 'TÍPIC'],
  [/c�vic/g, 'cívic'],
  [/C�VIC/g, 'CÍVIC'],
  [/m�gic/g, 'mágic'],
  [/M�GIC/g, 'MÁGIC'],
  [/tr�gic/g, 'trágic'],
  [/TR�GIC/g, 'TRÁGIC'],
  [/l�ric/g, 'líric'],
  [/L�RIC/g, 'LÍRIC'],
  [/sat�ric/g, 'satíric'],
  [/SAT�RIC/g, 'SATÍRIC'],
  [/emp�ric/g, 'empíric'],
  [/EMP�RIC/g, 'EMPÍRIC'],
  [/hist�ric/g, 'históric'],
  [/HIST�RIC/g, 'HISTÓRIC'],
  [/ret�ric/g, 'retóric'],
  [/RET�RIC/g, 'RETÓRIC'],
  [/peri�dic/g, 'periódic'],
  [/PERI�DIC/g, 'PERIÓDIC'],
  [/met�dic/g, 'metódic'],
  [/MET�DIC/g, 'METÓDIC'],
  [/n�rdic/g, 'nórdic'],
  [/N�RDIC/g, 'NÓRDIC'],

  // Specific remaining patterns from grep
  [/r�s\b/g, 'rés'],  // interés, cortés
  [/R�S\b/g, 'RÉS'],
  [/t�r\b/g, 'tér'],  // carácter
  [/T�R\b/g, 'TÉR'],
  [/s�i/g, 'síi'],  // Note: This might be rare
  [/S�I/g, 'SÍI'],
  [/b�s/g, 'bás'],  // básico
  [/B�S/g, 'BÁS'],
  [/g�n/g, 'gén'],  // género, régimen
  [/G�N/g, 'GÉN'],
  [/l�n/g, 'lín'],  // línea
  [/L�N/g, 'LÍN'],
  [/r�n/g, 'rán'],  // serán, podrán
  [/R�N/g, 'RÁN'],
  [/t�\b/g, 'té'],  // comité
  [/T�\b/g, 'TÉ'],
  [/r�\b/g, 'ré'],  // podré
  [/R�\b/g, 'RÉ'],
  [/ �n /g, ' én '],  // (...) - rare
  [/h�c/g, 'héc'],  // hectárea
  [/H�C/g, 'HÉC'],
  [/t�a/g, 'tía'],  // garantía, mayoría
  [/T�A/g, 'TÍA'],
  [/n�s/g, 'nés'],  // japonés, francés
  [/N�S/g, 'NÉS'],
  [/r�o/g, 'río'],  // río
  [/R�O/g, 'RÍO'],
  [/fr�o/g, 'frío'],  // frío
  [/FR�O/g, 'FRÍO'],
  [/vac�o/g, 'vacío'],  // vacío
  [/VAC�O/g, 'VACÍO'],
  [/bald�o/g, 'baldío'],  // baldío
  [/BALD�O/g, 'BALDÍO'],
  [/nav�o/g, 'navío'],  // navío
  [/NAV�O/g, 'NAVÍO'],
  [/est�o/g, 'estío'],  // estío
  [/EST�O/g, 'ESTÍO'],
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
  for (const [pattern, replacement] of thirdPassFixes) {
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
