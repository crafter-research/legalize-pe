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

echo ""
echo "================================================"
echo "✅ Success: $success"
echo "❌ Failed: $failed"
echo ""

# Cleanup temp directory
rm -rf "$TEMP_DIR"
