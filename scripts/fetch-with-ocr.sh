#!/bin/bash
# Fetch laws from Congreso archive using OCR for scanned PDFs
# Usage: ./scripts/fetch-with-ocr.sh

set -e

OUTPUT_DIR="leyes/pe"
TEMP_DIR="/tmp/legalize-pe-ocr"
BASE_URL="https://www.leyes.congreso.gob.pe/Documentos"

mkdir -p "$TEMP_DIR"
mkdir -p "$OUTPUT_DIR"

fetch_with_ocr() {
  local id="$1"
  local number="$2"
  local name="$3"
  local rango="$4"
  local fecha="$5"
  local url_path="$6"

  local pdf_file="$TEMP_DIR/${id}.pdf"
  local md_file="$OUTPUT_DIR/${id}.md"
  local work_dir="$TEMP_DIR/${id}_work"

  # Skip if already exists
  if [[ -f "$md_file" ]]; then
    echo "⏭️  $id already exists, skipping"
    return 0
  fi

  echo ""
  echo "📥 Fetching $id ($name)..."

  # Download PDF
  local url="${BASE_URL}/${url_path}/${number}.pdf"
  if ! curl -sL -o "$pdf_file" "$url"; then
    echo "❌ Failed to download $url"
    return 1
  fi

  # Check if PDF is valid
  if ! file "$pdf_file" | grep -q PDF; then
    echo "❌ Invalid PDF for $id"
    rm -f "$pdf_file"
    return 1
  fi

  # Create work directory
  mkdir -p "$work_dir"

  # Convert PDF to images (300 DPI for better OCR)
  echo "🖼️  Converting PDF to images..."
  if ! pdftoppm -png -r 300 "$pdf_file" "$work_dir/page" 2>/dev/null; then
    echo "❌ Failed to convert PDF to images"
    rm -rf "$work_dir" "$pdf_file"
    return 1
  fi

  # Count pages
  local page_count=$(ls "$work_dir"/page-*.png 2>/dev/null | wc -l | tr -d ' ')
  echo "📄 Processing $page_count pages with OCR..."

  # OCR each page and combine (run from work_dir to avoid path issues)
  local combined_text=""
  pushd "$work_dir" > /dev/null
  for img in page-*.png; do
    if [[ -f "$img" ]]; then
      echo "   🔍 OCR: $img"
      # Run tesseract with Spanish
      local page_text=$(tesseract "$img" stdout -l spa 2>/dev/null || echo "")
      combined_text="${combined_text}${page_text}

---

"
    fi
  done
  popd > /dev/null

  # Check if we got any text
  local text_length=${#combined_text}
  if [[ $text_length -lt 500 ]]; then
    echo "⚠️  Warning: Very little text extracted ($text_length chars)"
  fi

  # Create markdown file
  echo "📝 Creating markdown..."
  cat > "$md_file" << FRONTMATTER
---
titulo: "${name}"
identificador: "${id}"
pais: "pe"
jurisdiccion: "pe"
rango: "${rango}"
fechaPublicacion: "${fecha}"
ultimaActualizacion: "$(date +%Y-%m-%d)"
estado: "vigente"
fuente: "${url}"
diarioOficial: "El Peruano"
---

# ${name}

FRONTMATTER

  echo -e "$combined_text" >> "$md_file"

  # Get final file size
  local final_size=$(stat -f%z "$md_file")
  echo "✅ Saved $md_file ($final_size bytes, $page_count pages)"

  # Cleanup
  rm -rf "$work_dir" "$pdf_file"

  return 0
}

echo "🇵🇪 Legalize PE - OCR Fetcher"
echo "================================================"
echo "Using Tesseract OCR with Spanish language"
echo ""

success=0
failed=0

# Important laws to fetch
echo "📚 Fetching important laws with OCR..."

# Ley Marco del Sistema Nacional de Gestión Ambiental
fetch_with_ocr "ley-28245" "28245" "Ley Marco del Sistema Nacional de Gestión Ambiental" "ley" "2004-06-08" "Leyes" && ((success++)) || ((failed++))

# Ley de Hidrocarburos
fetch_with_ocr "ley-26221" "26221" "Ley Orgánica de Hidrocarburos" "ley-organica" "1993-08-20" "Leyes" && ((success++)) || ((failed++))

# Ley de Ejecución Coactiva
fetch_with_ocr "ley-26979" "26979" "Ley de Procedimiento de Ejecución Coactiva" "ley" "1998-09-23" "Leyes" && ((success++)) || ((failed++))

# Ley MYPE
fetch_with_ocr "ley-28015" "28015" "Ley de Promoción y Formalización de la Micro y Pequeña Empresa" "ley" "2003-07-03" "Leyes" && ((success++)) || ((failed++))

# Decretos Legislativos
fetch_with_ocr "dleg-1075" "01075" "Disposiciones Complementarias a la Decisión 486 - Propiedad Industrial" "decreto-legislativo" "2008-06-28" "DecretosLegislativos" && ((success++)) || ((failed++))

fetch_with_ocr "dleg-1033" "01033" "Ley de Organización y Funciones del INDECOPI" "decreto-legislativo" "2008-06-25" "DecretosLegislativos" && ((success++)) || ((failed++))

fetch_with_ocr "dleg-702" "00702" "Ley de Telecomunicaciones" "decreto-legislativo" "1991-11-05" "DecretosLegislativos" && ((success++)) || ((failed++))

# More Decretos Legislativos
fetch_with_ocr "dleg-1353" "01353" "Decreto Legislativo que crea la Autoridad Nacional de Transparencia" "decreto-legislativo" "2017-01-07" "DecretosLegislativos" && ((success++)) || ((failed++))

fetch_with_ocr "dleg-1438" "01438" "Decreto Legislativo del Sistema Nacional de Abastecimiento" "decreto-legislativo" "2018-09-16" "DecretosLegislativos" && ((success++)) || ((failed++))

fetch_with_ocr "dleg-767" "00767" "Ley Orgánica del Poder Judicial" "decreto-legislativo" "1991-12-04" "DecretosLegislativos" && ((success++)) || ((failed++))

# More Leyes
fetch_with_ocr "ley-27291" "27291" "Ley que permite utilización de medios electrónicos" "ley" "2000-06-24" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-29381" "29381" "Ley de Organización y Funciones del MTPE" "ley" "2009-06-16" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-27444" "27444" "Ley del Procedimiento Administrativo General" "ley" "2001-04-11" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-26887" "26887" "Ley General de Sociedades" "ley" "1997-12-09" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-27809" "27809" "Ley General del Sistema Concursal" "ley" "2002-08-08" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-29571" "29571" "Código de Protección y Defensa del Consumidor" "ley" "2010-09-02" "Leyes" && ((success++)) || ((failed++))

# Tax and Finance
fetch_with_ocr "ley-26702" "26702" "Ley General del Sistema Financiero y del Sistema de Seguros" "ley" "1996-12-09" "Leyes" && ((success++)) || ((failed++))

# Labor
fetch_with_ocr "ley-29497" "29497" "Nueva Ley Procesal del Trabajo" "ley" "2010-01-15" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-28806" "28806" "Ley General de Inspección del Trabajo" "ley" "2006-07-22" "Leyes" && ((success++)) || ((failed++))

# Constitutional
fetch_with_ocr "ley-28237" "28237" "Código Procesal Constitucional" "ley" "2004-05-31" "Leyes" && ((success++)) || ((failed++))

# Environment
fetch_with_ocr "ley-27446" "27446" "Ley del Sistema Nacional de Evaluación del Impacto Ambiental" "ley" "2001-04-23" "Leyes" && ((success++)) || ((failed++))

# Competition
fetch_with_ocr "dleg-1034" "01034" "Ley de Represión de Conductas Anticompetitivas" "decreto-legislativo" "2008-06-25" "DecretosLegislativos" && ((success++)) || ((failed++))

# Public contracts
fetch_with_ocr "ley-30225" "30225" "Ley de Contrataciones del Estado" "ley" "2014-07-11" "Leyes" && ((success++)) || ((failed++))

# Mining
fetch_with_ocr "ley-28090" "28090" "Ley que regula el Cierre de Minas" "ley" "2003-10-14" "Leyes" && ((success++)) || ((failed++))

# Electricity
fetch_with_ocr "ley-28832" "28832" "Ley para Asegurar el Desarrollo Eficiente de la Generación Eléctrica" "ley" "2006-07-23" "Leyes" && ((success++)) || ((failed++))

# Data protection
fetch_with_ocr "ley-29733" "29733" "Ley de Protección de Datos Personales" "ley" "2011-07-03" "Leyes" && ((success++)) || ((failed++))

# Criminal procedure
fetch_with_ocr "dleg-957" "00957" "Nuevo Código Procesal Penal" "decreto-legislativo" "2004-07-29" "DecretosLegislativos" && ((success++)) || ((failed++))

# Civil procedure
fetch_with_ocr "dleg-768" "00768" "Código Procesal Civil" "decreto-legislativo" "1993-03-04" "DecretosLegislativos" && ((success++)) || ((failed++))

# More important laws
fetch_with_ocr "ley-26636" "26636" "Ley Procesal del Trabajo" "ley" "1996-06-24" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-27157" "27157" "Ley de Regularización de Edificaciones" "ley" "1999-07-20" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-27287" "27287" "Ley de Títulos Valores" "ley" "2000-06-19" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-27287" "27287" "Ley de Títulos Valores" "ley" "2000-06-19" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-26842" "26842" "Ley General de Salud" "ley" "1997-07-20" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-28044" "28044" "Ley General de Educación" "ley" "2003-07-29" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-27783" "27783" "Ley de Bases de la Descentralización" "ley" "2002-07-20" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-27867" "27867" "Ley Orgánica de Gobiernos Regionales" "ley" "2002-11-18" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-27972" "27972" "Ley Orgánica de Municipalidades" "ley" "2003-05-27" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-28411" "28411" "Ley General del Sistema Nacional de Presupuesto" "ley" "2004-12-08" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-27785" "27785" "Ley Orgánica del Sistema Nacional de Control y CGR" "ley" "2002-07-23" "Leyes" && ((success++)) || ((failed++))

fetch_with_ocr "ley-28716" "28716" "Ley de Control Interno de las Entidades del Estado" "ley" "2006-04-18" "Leyes" && ((success++)) || ((failed++))

echo ""
echo "================================================"
echo "✅ Success: $success"
echo "❌ Failed: $failed"
echo ""

# Cleanup temp directory
rm -rf "$TEMP_DIR"
