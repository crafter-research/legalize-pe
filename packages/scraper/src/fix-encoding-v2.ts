import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Additional patterns for second pass - focusing on remaining issues
const additionalFixes: [RegExp, string][] = [
  // Number symbol
  [/N�\s/g, 'N° '],
  [/N�$/gm, 'N°'],
  [/n�\s/g, 'n° '],
  [/n�$/gm, 'n°'],

  // More -ción endings
  [/aci�n/g, 'ación'],
  [/ACI�N/g, 'ACIÓN'],
  [/ici�n/g, 'ición'],
  [/ICI�N/g, 'ICIÓN'],
  [/uci�n/g, 'ución'],
  [/UCI�N/g, 'UCIÓN'],
  [/eci�n/g, 'ección'],
  [/ECI�N/g, 'ECCIÓN'],
  [/oci�n/g, 'oción'],
  [/OCI�N/g, 'OCIÓN'],

  // More -sión endings
  [/asi�n/g, 'asión'],
  [/ASI�N/g, 'ASIÓN'],
  [/esi�n/g, 'esión'],
  [/ESI�N/g, 'ESIÓN'],
  [/isi�n/g, 'isión'],
  [/ISI�N/g, 'ISIÓN'],
  [/osi�n/g, 'osión'],
  [/OSI�N/g, 'OSIÓN'],
  [/usi�n/g, 'usión'],
  [/USI�N/g, 'USIÓN'],

  // Verbs with accented past tense
  [/Der�g/g, 'Deróg'],
  [/DER�G/g, 'DERÓG'],
  [/der�g/g, 'deróg'],
  [/Restit�y/g, 'Restitúy'],
  [/RESTIT�Y/g, 'RESTITÚY'],
  [/restit�y/g, 'restitúy'],
  [/imparti�/g, 'impartió'],
  [/IMPARTI�/g, 'IMPARTIÓ'],

  // Common word patterns with ó
  [/�rgano/g, 'órgano'],
  [/�RGANO/g, 'ÓRGANO'],
  [/�rdene/g, 'órdene'],
  [/�RDENE/g, 'ÓRDENE'],
  [/peri�dic/g, 'periódic'],
  [/PERI�DIC/g, 'PERIÓDIC'],
  [/met�dic/g, 'metódic'],
  [/MET�DIC/g, 'METÓDIC'],
  [/mel�dic/g, 'melódic'],
  [/MEL�DIC/g, 'MELÓDIC'],
  [/epis�dic/g, 'episódic'],
  [/EPIS�DIC/g, 'EPISÓDIC'],
  [/cust�di/g, 'custódi'],
  [/CUST�DI/g, 'CUSTÓDI'],

  // Common word patterns with í
  [/Pol�tic/g, 'Polític'],
  [/POL�TIC/g, 'POLÍTIC'],
  [/pol�tic/g, 'polític'],
  [/cr�tic/g, 'crític'],
  [/CR�TIC/g, 'CRÍTIC'],
  [/impl�cit/g, 'implícit'],
  [/IMPL�CIT/g, 'IMPLÍCIT'],
  [/expl�cit/g, 'explícit'],
  [/EXPL�CIT/g, 'EXPLÍCIT'],
  [/il�cit/g, 'ilícit'],
  [/IL�CIT/g, 'ILÍCIT'],
  [/l�cit/g, 'lícit'],
  [/L�CIT/g, 'LÍCIT'],
  [/leg�tim/g, 'legítim'],
  [/LEG�TIM/g, 'LEGÍTIM'],
  [/ileg�tim/g, 'ilegítim'],
  [/ILEG�TIM/g, 'ILEGÍTIM'],
  [/mar�tim/g, 'marítim'],
  [/MAR�TIM/g, 'MARÍTIM'],
  [/�ntim/g, 'íntim'],
  [/�NTIM/g, 'ÍNTIM'],
  [/v�ctim/g, 'víctim'],
  [/V�CTIM/g, 'VÍCTIM'],
  [/r�gid/g, 'rígid'],
  [/R�GID/g, 'RÍGID'],
  [/l�pid/g, 'lípid'],
  [/L�PID/g, 'LÍPID'],
  [/h�brid/g, 'híbrid'],
  [/H�BRID/g, 'HÍBRID'],
  [/t�mid/g, 'tímid'],
  [/T�MID/g, 'TÍMID'],
  [/h�mid/g, 'húmid'],
  [/H�MID/g, 'HÚMID'],
  [/r�pid/g, 'rápid'],
  [/R�PID/g, 'RÁPID'],
  [/l�quid/g, 'líquid'],
  [/L�QUID/g, 'LÍQUID'],
  [/s�lid/g, 'sólid'],
  [/S�LID/g, 'SÓLID'],
  [/v�lid/g, 'válid'],
  [/V�LID/g, 'VÁLID'],
  [/inv�lid/g, 'inválid'],
  [/INV�LID/g, 'INVÁLID'],
  [/c�lid/g, 'cálid'],
  [/C�LID/g, 'CÁLID'],
  [/p�lid/g, 'pálid'],
  [/P�LID/g, 'PÁLID'],
  [/c�ndid/g, 'cándid'],
  [/C�NDID/g, 'CÁNDID'],
  [/spl�ndid/g, 'spléndid'],
  [/SPL�NDID/g, 'SPLÉNDID'],
  [/�cid/g, 'ácid'],
  [/�CID/g, 'ÁCID'],
  [/�rid/g, 'árid'],
  [/�RID/g, 'ÁRID'],

  // Common word patterns with á
  [/cort�s/g, 'cortés'],
  [/CORT�S/g, 'CORTÉS'],
  [/jer�rqui/g, 'jerárqui'],
  [/JER�RQUI/g, 'JERÁRQUI'],
  [/mon�rqui/g, 'monárqui'],
  [/MON�RQUI/g, 'MONÁRQUI'],
  [/anarqu�/g, 'anarquí'],
  [/ANARQU�/g, 'ANARQUÍ'],
  [/an�rqui/g, 'anárqui'],
  [/AN�RQUI/g, 'ANÁRQUI'],
  [/olig�rqui/g, 'oligárqui'],
  [/OLIG�RQUI/g, 'OLIGÁRQUI'],
  [/aut�rqui/g, 'autárqui'],
  [/AUT�RQUI/g, 'AUTÁRQUI'],
  [/t�cit/g, 'tácit'],
  [/T�CIT/g, 'TÁCIT'],

  // Common word patterns with ú
  [/act�a/g, 'actúa'],
  [/ACT�A/g, 'ACTÚA'],
  [/efect�a/g, 'efectúa'],
  [/EFECT�A/g, 'EFECTÚA'],
  [/contin�a/g, 'continúa'],
  [/CONTIN�A/g, 'CONTINÚA'],
  [/eval�a/g, 'evalúa'],
  [/EVAL�A/g, 'EVALÚA'],
  [/sit�a/g, 'sitúa'],
  [/SIT�A/g, 'SITÚA'],
  [/habit�a/g, 'habitúa'],
  [/HABIT�A/g, 'HABITÚA'],
  [/gradu�a/g, 'graduúa'],
  [/GRADU�A/g, 'GRADUÚA'],
  [/individu/g, 'individu'], // Usually OK
  [/p�blic/g, 'públic'],
  [/P�BLIC/g, 'PÚBLIC'],
  [/rep�blic/g, 'repúblic'],
  [/REP�BLIC/g, 'REPÚBLIC'],
  [/m�sic/g, 'músic'],
  [/M�SIC/g, 'MÚSIC'],
  [/f�sic/g, 'físic'],
  [/F�SIC/g, 'FÍSIC'],
  [/qu�mic/g, 'químic'],
  [/QU�MIC/g, 'QUÍMIC'],
  [/m�dic/g, 'médic'],
  [/M�DIC/g, 'MÉDIC'],
  [/jur�dic/g, 'jurídic'],
  [/JUR�DIC/g, 'JURÍDIC'],
  [/econ�mic/g, 'económic'],
  [/ECON�MIC/g, 'ECONÓMIC'],
  [/acad�mic/g, 'académic'],
  [/ACAD�MIC/g, 'ACADÉMIC'],
  [/pand�mic/g, 'pandémic'],
  [/PAND�MIC/g, 'PANDÉMIC'],
  [/end�mic/g, 'endémic'],
  [/END�MIC/g, 'ENDÉMIC'],
  [/epid�mic/g, 'epidémic'],
  [/EPID�MIC/g, 'EPIDÉMIC'],
  [/sist�mic/g, 'sistémic'],
  [/SIST�MIC/g, 'SISTÉMIC'],
  [/din�mic/g, 'dinámic'],
  [/DIN�MIC/g, 'DINÁMIC'],
  [/cer�mic/g, 'cerámic'],
  [/CER�MIC/g, 'CERÁMIC'],
  [/pol�mic/g, 'polémic'],
  [/POL�MIC/g, 'POLÉMIC'],

  // Future tense verbs (-rá, -rán)
  [/ar�\s/g, 'ará '],
  [/AR�\s/g, 'ARÁ '],
  [/ar�n/g, 'arán'],
  [/AR�N/g, 'ARÁN'],
  [/er�\s/g, 'erá '],
  [/ER�\s/g, 'ERÁ '],
  [/er�n/g, 'erán'],
  [/ER�N/g, 'ERÁN'],
  [/ir�\s/g, 'irá '],
  [/IR�\s/g, 'IRÁ '],
  [/ir�n/g, 'irán'],
  [/IR�N/g, 'IRÁN'],
  [/sar�\s/g, 'sará '],
  [/SAR�\s/g, 'SARÁ '],
  [/impulsar�/g, 'impulsará'],
  [/IMPULSAR�/g, 'IMPULSARÁ'],
  [/obedecer�/g, 'obedecerá'],
  [/OBEDECER�/g, 'OBEDECERÁ'],
  [/aplicar�/g, 'aplicará'],
  [/APLICAR�/g, 'APLICARÁ'],

  // Gerunds (-ándose, -éndose, -iéndose)
  [/�ndose/g, 'ándose'],
  [/�NDOSE/g, 'ÁNDOSE'],
  [/�ndole/g, 'ándole'],
  [/�NDOLE/g, 'ÁNDOLE'],
  [/respet�ndose/g, 'respetándose'],
  [/RESPET�NDOSE/g, 'RESPETÁNDOSE'],
  [/otorg�ndole/g, 'otorgándole'],
  [/OTORG�NDOLE/g, 'OTORGÁNDOLE'],

  // Words with ñ
  [/se�al/g, 'señal'],
  [/SE�AL/g, 'SEÑAL'],
  [/desempe�/g, 'desempeñ'],
  [/DESEMPE�/g, 'DESEMPEÑ'],

  // Words with é
  [/�tic/g, 'étic'],
  [/�TIC/g, 'ÉTIC'],
  [/est�tic/g, 'estétic'],
  [/EST�TIC/g, 'ESTÉTIC'],
  [/sint�tic/g, 'sintétic'],
  [/SINT�TIC/g, 'SINTÉTIC'],
  [/herm�tic/g, 'hermético'],
  [/HERM�TIC/g, 'HERMÉTICO'],
  [/aut�ntic/g, 'auténtic'],
  [/AUT�NTIC/g, 'AUTÉNTIC'],
  [/id�ntic/g, 'idéntic'],
  [/ID�NTIC/g, 'IDÉNTIC'],
  [/prot�tic/g, 'protétic'],
  [/PROT�TIC/g, 'PROTÉTIC'],
  [/terap�utic/g, 'terapéutic'],
  [/TERAP�UTIC/g, 'TERAPÉUTIC'],
  [/farmac�utic/g, 'farmacéutic'],
  [/FARMAC�UTIC/g, 'FARMACÉUTIC'],

  // Common word stems
  [/�ndole/g, 'índole'],
  [/�NDOLE/g, 'ÍNDOLE'],
  [/�nfasis/g, 'énfasis'],
  [/�NFASIS/g, 'ÉNFASIS'],
  [/an�lisis/g, 'análisis'],
  [/AN�LISIS/g, 'ANÁLISIS'],
  [/s�ntesis/g, 'síntesis'],
  [/S�NTESIS/g, 'SÍNTESIS'],
  [/hip�tesis/g, 'hipótesis'],
  [/HIP�TESIS/g, 'HIPÓTESIS'],
  [/par�ntesis/g, 'paréntesis'],
  [/PAR�NTESIS/g, 'PARÉNTESIS'],
  [/di�lisis/g, 'diálisis'],
  [/DI�LISIS/g, 'DIÁLISIS'],
  [/par�lisis/g, 'parálisis'],
  [/PAR�LISIS/g, 'PARÁLISIS'],
  [/cr�sis/g, 'crísis'],
  [/CR�SIS/g, 'CRÍSIS'],

  // More verb patterns
  [/establ�c/g, 'establéc'],
  [/ESTABL�C/g, 'ESTABLÉC'],
  [/reconoc�/g, 'reconocí'],
  [/RECONOC�/g, 'RECONOCÍ'],

  // Adjective patterns
  [/s�lido/g, 'sólido'],
  [/S�LIDO/g, 'SÓLIDO'],

  // More -logía patterns
  [/log�a/g, 'logía'],
  [/LOG�A/g, 'LOGÍA'],
  [/nom�a/g, 'nomía'],
  [/NOM�A/g, 'NOMÍA'],
  [/graf�a/g, 'grafía'],
  [/GRAF�A/g, 'GRAFÍA'],
  [/metr�a/g, 'metría'],
  [/METR�A/g, 'METRÍA'],

  // More -ía patterns (nouns)
  [/or�a/g, 'oría'],
  [/OR�A/g, 'ORÍA'],
  [/er�a/g, 'ería'],
  [/ER�A/g, 'ERÍA'],
  [/ur�a/g, 'uría'],
  [/UR�A/g, 'URÍA'],
  [/ar�a/g, 'aría'],
  [/AR�A/g, 'ARÍA'],
  [/dad�a/g, 'dadía'], // ciudadanía
  [/DAD�A/g, 'DADÍA'],
  [/ran�a/g, 'ranía'], // soberanía
  [/RAN�A/g, 'RANÍA'],

  // Words that commonly appear in legal texts
  [/Presunci�n/g, 'Presunción'],
  [/PRESUNCI�N/g, 'PRESUNCIÓN'],
  [/presunci�n/g, 'presunción'],
  [/religi�n/g, 'religión'],
  [/RELIGI�N/g, 'RELIGIÓN'],
  [/Religi�n/g, 'Religión'],
  [/opini�n/g, 'opinión'],
  [/OPINI�N/g, 'OPINIÓN'],
  [/Opini�n/g, 'Opinión'],
  [/situaci�n/g, 'situación'],
  [/SITUACI�N/g, 'SITUACIÓN'],
  [/Situaci�n/g, 'Situación'],

  // More specific patterns
  [/sanci�n/g, 'sanción'],
  [/SANCI�N/g, 'SANCIÓN'],
  [/Sanci�n/g, 'Sanción'],
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
  for (const [pattern, replacement] of additionalFixes) {
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
